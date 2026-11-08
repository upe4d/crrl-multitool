# /// script
# requires-python = ">=3.10"
# dependencies = ["pywebview>=5,<7"]
# ///
"""Запускает локальный сервер и отдельное окно Windows."""
import os
import re
import subprocess
import sys
from pathlib import Path

APP = Path(__file__).resolve().parent
sys.path.insert(0, str((APP / '../../geo-sleuth-build/desktop-python').resolve()))


def main():
    import webview
    env = dict(os.environ, GEO_DESKTOP='1', PYTHONUTF8='1')
    # Окно консоли дочернему серверу не требуется: управление из окна приложения.
    server = subprocess.Popen(['node', str(APP / 'server.mjs')], cwd=APP, env=env,
                              stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                              text=True, encoding='utf-8', errors='replace',
                              creationflags=subprocess.CREATE_NO_WINDOW)
    try:
        line = server.stdout.readline()
        match = re.search(r'http://127\.0\.0\.1:\d+/', line)
        if not match:
            raise RuntimeError('Не удалось запустить локальный сервер: ' + line.strip())
        webview.create_window('Мультитул — поиск места по фото', match.group(),
                              width=1320, height=860, min_size=(760, 560),
                              background_color='#0c1010')
        webview.start(gui='edgechromium')
    finally:
        if server.poll() is None:
            # Останавливаем только сервер этого окна и его дочерние процессы.
            subprocess.run(['taskkill', '/PID', str(server.pid), '/T', '/F'],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                           creationflags=subprocess.CREATE_NO_WINDOW, check=False)


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        import ctypes
        ctypes.windll.user32.MessageBoxW(0, str(error), 'Поиск места по фото', 0x10)
        sys.exit(1)
