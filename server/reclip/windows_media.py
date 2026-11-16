"""Обработка локальных дорожек через поток, если FFmpeg не читает файлы Windows."""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os
import secrets
import shutil
import subprocess
import threading


def convert_media(video_path, audio_path, output_path, mode):
    """Отдаёт только переданные файлы по одноразовому адресу localhost."""
    paths = [Path(audio_path)] if mode == 'audio' else [Path(video_path), Path(audio_path)]
    token = secrets.token_urlsafe(32)

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            expected = {f'/{token}/{i}': path for i, path in enumerate(paths)}
            path = expected.get(self.path)
            if path is None:
                self.send_error(404)
                return
            try:
                with path.open('rb') as source:
                    self.send_response(200)
                    self.send_header('Content-Length', str(path.stat().st_size))
                    self.send_header('Content-Type', 'application/octet-stream')
                    self.end_headers()
                    shutil.copyfileobj(source, self.wfile, 1024 * 1024)
            except (OSError, BrokenPipeError):
                self.close_connection = True

        def log_message(self, *args):
            pass

    binary = os.environ.get('RECLIP_FFMPEG') or shutil.which('ffmpeg')
    if not binary:
        raise RuntimeError('FFmpeg не найден. Укажите путь в RECLIP_FFMPEG')
    server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    worker = threading.Thread(target=server.serve_forever, daemon=True)
    worker.start()
    urls = [f'http://127.0.0.1:{server.server_port}/{token}/{i}' for i in range(len(paths))]
    cmd = [binary, '-hide_banner', '-loglevel', 'error']
    for url in urls:
        cmd.extend(['-i', url])
    if mode == 'audio':
        cmd.extend(['-vn', '-codec:a', 'libmp3lame', '-b:a', '192k', '-f', 'mp3', 'pipe:1'])
    else:
        cmd.extend(['-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-movflags', 'frag_keyframe+empty_moov', '-f', 'mp4', 'pipe:1'])
    try:
        with Path(output_path).open('xb') as destination:
            result = subprocess.run(cmd, stdout=destination, stderr=subprocess.PIPE, timeout=180)
        if result.returncode:
            raise RuntimeError('Ошибка FFmpeg: ' + result.stderr.decode('utf-8', 'replace')[-700:])
    finally:
        server.shutdown()
        server.server_close()
        worker.join(timeout=3)
