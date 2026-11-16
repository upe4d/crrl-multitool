import os
import uuid
import glob
import json
import subprocess
import threading
import time
import re
import ipaddress
from urllib.parse import urlsplit
from flask import Flask, request, jsonify, send_file, render_template
from werkzeug.middleware.proxy_fix import ProxyFix
from windows_media import convert_media

app = Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app, x_prefix=1)
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024
DOWNLOAD_DIR = os.environ.get("RECLIP_DOWNLOAD_DIR", os.path.join(os.path.dirname(__file__), "downloads"))
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

# Плагины поставляются вместе с приложением; внешние конфигурации yt-dlp не читаются.
YTDLP_BASE = ["yt-dlp", "--ignore-config", "--plugin-dirs", os.path.join(os.path.dirname(__file__), "plugins")]
jobs = {}
download_slot = threading.BoundedSemaphore(1)
info_slots = threading.BoundedSemaphore(2)
MAX_DOWNLOAD_BYTES = 250 * 1024 * 1024


def expire_jobs():
    """Убирает из памяти старые задания; файлы удаляются отдельным таймером."""
    now = time.time()
    for key, value in list(jobs.items()):
        if value.get("status") != "downloading" and now - value.get("created", now) > 3600:
            jobs.pop(key, None)


@app.before_request
def before_request():
    expire_jobs()


def read_url():
    """Проверяет входные данные до запуска загрузчика."""
    data = request.get_json(silent=True)
    if not isinstance(data, dict) or not isinstance(data.get("url"), str):
        raise ValueError("Укажите ссылку")
    url = data["url"].strip()
    try:
        parts = urlsplit(url)
        if len(url) > 4096 or parts.scheme not in ("http", "https") or not parts.hostname or parts.username or parts.password:
            raise ValueError
        if parts.port not in (None, 80, 443):
            raise ValueError
        try:
            address = ipaddress.ip_address(parts.hostname)
        except ValueError:
            address = None
        if address and not address.is_global:
            raise ValueError
    except ValueError:
        raise ValueError("Нужна корректная ссылка HTTP или HTTPS") from None
    return data, url


def parse_ytdlp_json(stdout):
    """Parse yt-dlp JSON output.

    With ``-j`` yt-dlp prints one JSON object per line. Some extractors
    emit multiple videos even with ``--no-playlist``, so stdout contains
    several objects and a plain ``json.loads`` raises "Extra data".
    Return the first valid object.
    """
    for line in stdout.splitlines():
        line = line.strip()
        if not line:
            continue
        return json.loads(line)
    raise ValueError("yt-dlp returned no data")


def run_download(job_id, url, format_choice, format_id):
    job = jobs[job_id]
    out_template = os.path.join(DOWNLOAD_DIR, f"{job_id}.%(ext)s")

    # В Windows FFmpeg на этом компьютере не открывает файлы напрямую.
    if os.name == "nt":
        return run_download_windows(job_id, url, format_choice, format_id)
    cmd = YTDLP_BASE + ["--no-playlist", "--socket-timeout", "15", "--max-filesize", "250M", "-o", out_template]

    if format_choice == "audio":
        cmd += ["-x", "--audio-format", "mp3"]
    elif format_id:
        cmd += ["-f", f"{format_id}+bestaudio/best", "--merge-output-format", "mp4"]
    else:
        cmd += ["-f", "bestvideo+bestaudio/best", "--merge-output-format", "mp4"]

    cmd.extend(["--", url])

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        if result.returncode != 0:
            job["status"] = "error"
            job["error"] = result.stderr.strip().split("\n")[-1]
            return

        files = glob.glob(os.path.join(DOWNLOAD_DIR, f"{job_id}.*"))
        if not files:
            job["status"] = "error"
            job["error"] = "Download completed but no file was found"
            return

        if format_choice == "audio":
            target = [f for f in files if f.endswith(".mp3")]
            chosen = target[0] if target else files[0]
        else:
            target = [f for f in files if f.endswith(".mp4")]
            chosen = target[0] if target else files[0]

        for f in files:
            if f != chosen:
                try:
                    os.remove(f)
                except OSError:
                    pass

        job["status"] = "done"
        job["file"] = chosen
        ext = os.path.splitext(chosen)[1]
        title = job.get("title", "").strip()
        # Sanitize title for filename
        if title:
            safe_title = "".join(c for c in title if c not in r'\/:*?"<>|').strip()[:100].strip()
            job["filename"] = f"{safe_title}{ext}" if safe_title else os.path.basename(chosen)
        else:
            job["filename"] = os.path.basename(chosen)
    except subprocess.TimeoutExpired:
        job["status"] = "error"
        job["error"] = "Download timed out (5 min limit)"
    except Exception as e:
        job["status"] = "error"
        job["error"] = str(e)


def run_download_windows(job_id, url, format_choice, format_id):
    job = jobs[job_id]
    try:
        if format_choice not in ("video", "audio"):
            raise ValueError("Неподдерживаемый формат")
        import re
        if format_id and not re.fullmatch(r"[A-Za-z0-9._-]{1,80}", str(format_id)):
            raise ValueError("Некорректный идентификатор качества")
        def fetch(kind, selection):
            template = os.path.join(DOWNLOAD_DIR, f"{job_id}.{kind}.%(ext)s")
            cmd = YTDLP_BASE + ["--no-playlist", "--no-progress", "-f", selection, "-o", template, "--", url]
            result = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=300)
            if result.returncode:
                raise RuntimeError(result.stderr.strip().split("\n")[-1] or "Не удалось скачать дорожку")
            found = [f for f in glob.glob(os.path.join(DOWNLOAD_DIR, f"{job_id}.{kind}.*")) if not f.endswith((".part", ".ytdl"))]
            if len(found) != 1:
                raise RuntimeError("Не удалось определить скачанную дорожку")
            return found[0]
        video = fetch("video", format_id or "bestvideo/best") if format_choice == "video" else None
        audio = fetch("audio", "bestaudio/best")
        ext = ".mp3" if format_choice == "audio" else ".mp4"
        chosen = os.path.join(DOWNLOAD_DIR, job_id + ext)
        convert_media(video, audio, chosen, format_choice)
        title = job.get("title", "").strip()
        safe_title = "".join(c for c in title if c not in r'\/:*?"<>|').strip()[:100].strip()
        job.update(status="done", file=chosen, filename=(safe_title or job_id) + ext)
    except Exception as e:
        job.update(status="error", error=str(e))


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/info", methods=["POST"])
def get_info():
    try:
        data, url = read_url()
    except ValueError as error:
        return jsonify({"error": str(error)}), 400

    if not info_slots.acquire(blocking=False):
        return jsonify({"error": "Сервис занят. Попробуйте немного позже"}), 429
    cmd = YTDLP_BASE + ["--socket-timeout", "15", "--no-playlist", "-j", "--", url]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=60)
        if result.returncode != 0:
            return jsonify({"error": result.stderr.strip().split("\n")[-1]}), 400

        info = parse_ytdlp_json(result.stdout)

        # Build quality options — keep best format per resolution
        best_by_height = {}
        for f in info.get("formats", []):
            height = f.get("height")
            if height and f.get("vcodec", "none") != "none":
                tbr = f.get("tbr") or 0
                if height not in best_by_height or tbr > (best_by_height[height].get("tbr") or 0):
                    best_by_height[height] = f

        formats = []
        for height, f in best_by_height.items():
            formats.append({
                "id": f["format_id"],
                "label": f"{height}p",
                "height": height,
            })
        formats.sort(key=lambda x: x["height"], reverse=True)

        return jsonify({
            "title": info.get("title", ""),
            "thumbnail": info.get("thumbnail", ""),
            "duration": info.get("duration"),
            "uploader": info.get("uploader", ""),
            "formats": formats,
        })
    except subprocess.TimeoutExpired:
        return jsonify({"error": "Timed out fetching video info"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    finally:
        info_slots.release()


@app.route("/api/playlist", methods=["POST"])
def get_playlist_info():
    try:
        data, url = read_url()
    except ValueError as error:
        return jsonify({"error": str(error)}), 400

    if not info_slots.acquire(blocking=False):
        return jsonify({"error": "Сервис занят. Попробуйте немного позже"}), 429
    cmd = YTDLP_BASE + ["--socket-timeout", "15", "--playlist-end", "25", "--flat-playlist", "-J", "--", url]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=60)
        if result.returncode != 0:
            return jsonify({"error": result.stderr.strip().split("\n")[-1]}), 400

        info = json.loads(result.stdout)
        entries = info.get("entries", [])
        urls = [entry.get("url") for entry in entries if entry.get("url")]
        return jsonify({"urls": urls})
    except subprocess.TimeoutExpired:
        return jsonify({"error": "Timed out fetching playlist info"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    finally:
        info_slots.release()


@app.route("/api/download", methods=["POST"])
def start_download():
    try:
        data, url = read_url()
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    format_choice = data.get("format", "video")
    format_id = data.get("format_id")
    title = data.get("title", "")

    if (format_choice not in ("video", "audio") or not isinstance(title, str) or len(title) > 500
            or (format_id is not None and (not isinstance(format_id, str) or not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]{0,79}", format_id)))):
        return jsonify({"error": "Некорректные параметры загрузки"}), 400

    if not download_slot.acquire(blocking=False):
        return jsonify({"error": "Уже выполняется другая загрузка. Попробуйте позже"}), 429

    job_id = uuid.uuid4().hex
    jobs[job_id] = {"status": "downloading", "url": url, "title": title, "created": time.time()}

    def execute():
        try:
            run_download(job_id, url, format_choice, format_id)
            # После объединения потоков итоговый файл тоже должен укладываться в лимит.
            job = jobs.get(job_id, {})
            if job.get("status") == "done" and os.path.getsize(job["file"]) > MAX_DOWNLOAD_BYTES:
                job["status"] = "error"
                job["error"] = "Готовый файл больше 250 МБ. Выберите меньшее качество."
        finally:
            download_slot.release()
    thread = threading.Thread(target=execute)
    thread.daemon = True
    try:
        thread.start()
    except Exception:
        jobs.pop(job_id, None)
        download_slot.release()
        raise

    return jsonify({"job_id": job_id})


@app.route("/api/status/<job_id>")
def check_status(job_id):
    job = jobs.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    return jsonify({
        "status": job["status"],
        "error": job.get("error"),
        "filename": job.get("filename"),
    })


@app.route("/api/file/<job_id>")
def download_file(job_id):
    job = jobs.get(job_id)
    if not job or job["status"] != "done":
        return jsonify({"error": "File not ready"}), 404
    return send_file(job["file"], as_attachment=True, download_name=job["filename"])


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8899))
    host = os.environ.get("HOST", "127.0.0.1")
    app.run(host=host, port=port)
