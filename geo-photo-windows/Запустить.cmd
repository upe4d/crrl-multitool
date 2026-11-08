@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js не найден. Установите Node.js и повторите запуск.
  pause
  exit /b 1
)
where uv >nul 2>nul
if errorlevel 1 (
  echo uv не найден. Установите uv и повторите запуск.
  pause
  exit /b 1
)
set "GEO_WINDOW_LIBS=%~dp0..\..\geo-sleuth-build\desktop-python"
if not exist "%GEO_WINDOW_LIBS%\webview\__init__.py" (
  echo Устанавливаем компоненты окна приложения...
  python -m pip install --target "%GEO_WINDOW_LIBS%" "pywebview>=5,<7"
  if errorlevel 1 (
    echo Не удалось установить компоненты окна.
    pause
    exit /b 1
  )
)
set "PYTHONPATH=%GEO_WINDOW_LIBS%"
python desktop.py
echo.
echo Приложение остановлено.
pause
