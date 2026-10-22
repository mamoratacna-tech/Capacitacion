"""Download pinned browser-test dependencies. No application or employee data is used.
Run: python tests/helpers/preparar-lector-pdf.py [destination]
Then: SAMARA_OCR_ASSETS=destination node tests/lectura-pdf-real-browser.cjs
"""
from pathlib import Path
from urllib.request import urlopen
import io
import sys
import tarfile

root = Path(sys.argv[1] if len(sys.argv) > 1 else '/tmp/samara-ocr-assets')
root.mkdir(parents=True, exist_ok=True)
for package, version in [('tesseract.js', '6.0.1'), ('tesseract.js-core', '6.0.0')]:
    archive = urlopen(f'https://registry.npmjs.org/{package}/-/{package}-{version}.tgz', timeout=45).read()
    with tarfile.open(fileobj=io.BytesIO(archive)) as tar:
        for member in tar:
            relative = Path(member.name).relative_to('package')
            if member.isfile() and '..' not in relative.parts and str(relative).endswith(('.js', '.wasm')):
                target = root / package / relative
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(tar.extractfile(member).read())
for url, filename in [
    ('https://cdn.jsdelivr.net/npm/@tesseract.js-data/spa@1.0.0/4.0.0_best_int/spa.traineddata.gz', 'spa.traineddata.gz'),
    ('https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js', 'pdf.min.js'),
    ('https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js', 'pdf.worker.min.js'),
]:
    (root / filename).write_bytes(urlopen(url, timeout=45).read())
print(f'Ready: {root}')
