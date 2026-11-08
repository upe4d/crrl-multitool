# Поиск места по фото для Windows

Экспериментальная локальная оболочка Geo-sleuth. Откройте `Запустить.cmd` двойным щелчком. Интерфейс появится в отдельном окне Windows без вкладки браузера. Внутри используется WebView2, а поиск работает через локальный сервер на `127.0.0.1`. При закрытии окна сервер останавливается.

На настроенном компьютере можно также открыть `Открыть приложение.vbs` без окна консоли. Он использует `C:\Python313\pythonw.exe` и установленные компоненты окна. Ярлык можно создать на этот файл средствами Windows.

Модель обрабатывает фото на компьютере. Для поиска ориентира в OpenStreetMap и изображений панорам Google нужен интернет; название предполагаемого ориентира и его координаты передаются картографическим сервисам. Фото этим запросам не отправляется. Загруженные изображения и служебные результаты сохраняются в `geo-sleuth-build/desktop-data` рядом с исходной папкой проекта и в Git не входят.

Поиск ориентиров и сопоставление панорам приблизительные. Координаты ориентиров и панорам не являются подтверждёнными координатами камеры; направление панорамы не является направлением съёмки. Проверяйте варианты вручную.

## Зависимости

Эта версия использует уже установленное окружение: Node.js, `uv`, Python, WebView2 Runtime, навык Geo-sleuth, Transformers.js, локальные файлы модели Qwen2.5-VL-3B-Instruct-ONNX q4 и кэш моделей Geo-sleuth. Если библиотека окна `pywebview` отсутствует, запускной файл попробует установить её автоматически. Обработчик поиска использует имеющийся кэш `uv` без загрузки зависимостей. Модели и зависимости в репозиторий не включены. При переносе на другой компьютер их необходимо установить и указать пути в `config.local.json`. Путь к Python по умолчанию: `C:/Python313/python.exe`.

Пример `config.local.json` (все поля необязательны):

```json
{
  "python": "C:/Python313/python.exe",
  "uv": "uv",
  "skillScripts": "C:/Users/Admin/.codex/skills/geo-sleuth/scripts",
  "transformers": "E:/CODEX SKILLS SOFT/file-news-suite/browserytools-static-lab/node_modules/@huggingface/transformers/dist/transformers.node.mjs",
  "modelCache": "E:/CODEX SKILLS SOFT/file-news-suite/geo-sleuth-build/model-cache",
  "hfCache": "E:/CODEX SKILLS SOFT/file-news-suite/geo-sleuth-build/hf-cache",
  "uvCache": "E:/CODEX SKILLS SOFT/file-news-suite/geo-sleuth-build/uv-cache",
  "dataDir": "E:/CODEX SKILLS SOFT/file-news-suite/geo-sleuth-build/desktop-data"
}
```

Работа занимает время, особенно на процессоре. При ошибке проверьте путь зависимости и подключение к картографическим сервисам; сообщение отображается в приложении. Исходный проект: https://github.com/Oldcircle/geo-sleuth
