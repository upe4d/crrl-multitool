# /// script
# requires-python = ">=3.10"
# dependencies = ["pillow", "pillow-heif"]
# ///
"""Локально извлекает непроверенные координаты и направление из EXIF фотографии."""

import json
import math
import sys
from pathlib import Path

from PIL import Image

try:
    import pillow_heif
    pillow_heif.register_heif_opener()
except ImportError:
    pass

MAX_BYTES = 30 * 1024 * 1024
Image.MAX_IMAGE_PIXELS = 80_000_000


def number(value):
    try:
        result = float(value)
        return result if math.isfinite(result) else None
    except (TypeError, ValueError, ZeroDivisionError, OverflowError):
        return None


def coordinate(value, reference, positive, negative, limit):
    if isinstance(reference, bytes):
        reference = reference.decode('ascii', errors='ignore')
    if not isinstance(reference, str) or not isinstance(value, (tuple, list)) or len(value) != 3:
        return None
    reference = reference.strip('\x00 ').upper()
    if reference not in (positive, negative):
        return None
    parts = [number(item) for item in value]
    if any(item is None for item in parts):
        return None
    degrees, minutes, seconds = parts
    if degrees < 0 or not 0 <= minutes < 60 or not 0 <= seconds < 60:
        return None
    result = degrees + minutes / 60 + seconds / 3600
    if result > limit:
        return None
    return round(-result if reference == negative else result, 7)


def read_metadata(path):
    path = Path(path)
    if not path.is_file() or path.stat().st_size > MAX_BYTES:
        raise ValueError('Файл отсутствует или превышает 30 МиБ')
    # Метаданные — лишь подсказка: их можно изменить или удалить.
    with Image.open(path) as image:
        if image.width * image.height > Image.MAX_IMAGE_PIXELS:
            raise ValueError('Изображение слишком большое')
        gps = image.getexif().get_ifd(0x8825)
        result = {'coordinates': None, 'direction': None, 'verified': False}
        lat = coordinate(gps.get(2), gps.get(1), 'N', 'S', 90)
        lon = coordinate(gps.get(4), gps.get(3), 'E', 'W', 180)
        if lat is not None and lon is not None:
            result['coordinates'] = {'latitude': lat, 'longitude': lon}
        direction = number(gps.get(17))
        if direction is not None and 0 <= direction < 360:
            reference = gps.get(16)
            if isinstance(reference, bytes):
                reference = reference.decode('ascii', errors='ignore')
            reference = reference.strip('\x00 ').upper() if isinstance(reference, str) else ''
            result['direction'] = {'degrees': round(direction, 1), 'reference': {'T': 'true', 'M': 'magnetic'}.get(reference, 'unknown')}
        return result


def main():
    if len(sys.argv) != 2:
        print('Использование: metadata-check.py <фотография>', file=sys.stderr)
        return 2
    try:
        print(json.dumps(read_metadata(sys.argv[1]), ensure_ascii=False))
        return 0
    except Exception as error:
        print(json.dumps({'error': str(error)}, ensure_ascii=False), file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
    raise SystemExit(main())
