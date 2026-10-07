"""
prepare_book.py — turn the book PDFs into protected page images + a table of contents.

The PDFs themselves are NEVER deployed. The reader shows these images only after the
server (functions/api/book/page.js) checks login, purchase, device and rate limits.

Usage (from the project root):
    python scripts/prepare_book.py render  <pdf> <out_dir> [width=1100] [quality=72]
    python scripts/prepare_book.py toc     <master.pdf> <out_dir>/toc.json
    python scripts/prepare_book.py cover   <sample.pdf> image/haryana-leet-book-cover.webp
    python scripts/prepare_book.py upload  <out_dir> <kind: master|sample> [bucket=book]

`upload` needs MAIN_SUPABASE_URL and MAIN_SUPABASE_SERVICE_KEY in the environment and uploads every
page to the private Supabase Storage bucket (created automatically). Cloudflare R2 works
too: upload the same files with the same keys (master/0001.webp ...) and bind the bucket
as BOOK_R2 on the Pages project; the API prefers R2 when the binding exists.
"""
import io
import json
import os
import re
import sys
from multiprocessing import Pool

import pymupdf
from PIL import Image


def _render(args):
    pdf, out_dir, i, width, quality = args
    path = os.path.join(out_dir, '%04d.webp' % (i + 1))
    if os.path.exists(path) and os.path.getsize(path) > 0:
        return i
    doc = pymupdf.open(pdf)
    page = doc[i]
    zoom = width / page.rect.width
    pix = page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), alpha=False)
    img = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
    img.save(path, 'WEBP', quality=quality, method=6)
    return i


def render(pdf, out_dir, width=1100, quality=72):
    os.makedirs(out_dir, exist_ok=True)
    n = pymupdf.open(pdf).page_count
    jobs = [(pdf, out_dir, i, width, quality) for i in range(n)]
    done = 0
    with Pool(max(1, (os.cpu_count() or 2) - 1)) as pool:
        for _ in pool.imap_unordered(_render, jobs, chunksize=8):
            done += 1
            if done % 50 == 0 or done == n:
                print('rendered %d/%d' % (done, n), flush=True)
    meta = {'pages': n, 'width': width}
    json.dump(meta, open(os.path.join(out_dir, 'meta.json'), 'w'))
    total = sum(os.path.getsize(os.path.join(out_dir, f)) for f in os.listdir(out_dir) if f.endswith('.webp'))
    print('done: %d pages, %.1f MB' % (n, total / 1e6))


def toc(pdf, out_json):
    doc = pymupdf.open(pdf)
    rows, prev = [], None
    for n in range(2, min(doc.page_count, 40)):
        text = doc[n].get_text()
        if not text.strip().startswith('Contents') and n > 12 and not re.search(r'\.\s\s\.', text[:400]):
            continue
        for b in doc[n].get_text('blocks'):
            t = b[4].strip().replace('\n', ' ')
            m = re.match(r'^(?:\.\s+){3,}\.?\s*(\d+)\s*(.*)$', t)
            if m:
                if prev:
                    rows.append((prev, int(m.group(1))))
                prev = m.group(2).strip() or None
            elif t and t != 'Contents' and not re.search(r'(?:\.\s+){3,}', t):
                if prev is None:
                    prev = t
    out = []
    for title, page in rows:
        if not title:
            continue
        kind = 'chapter' if title.startswith('Chapter') else 'section' if title.startswith('Section') else \
               'paper' if 'Sample Paper' in title else 'subject' if re.search(r'\([a-d]-\d\)$', title) else 'other'
        out.append({'t': title, 'p': page, 'k': kind})
    json.dump({'toc': out}, open(out_json, 'w', encoding='utf-8'), ensure_ascii=False)
    print('toc entries:', len(out))


def cover(pdf, out_path, width=720):
    doc = pymupdf.open(pdf)
    page = doc[0]
    zoom = width / page.rect.width
    pix = page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), alpha=False)
    Image.frombytes('RGB', (pix.width, pix.height), pix.samples).save(out_path, 'WEBP', quality=85, method=6)
    print('cover saved', out_path)


def upload(out_dir, kind, bucket='book'):
    import urllib.request
    url = os.environ['MAIN_SUPABASE_URL'].rstrip('/')
    key = os.environ['MAIN_SUPABASE_SERVICE_KEY']

    def call(method, path, data=None, ctype='application/json', extra=None):
        req = urllib.request.Request(url + path, data=data, method=method)
        req.add_header('Authorization', 'Bearer ' + key)
        req.add_header('apikey', key)
        req.add_header('Content-Type', ctype)
        for k, v in (extra or {}).items():
            req.add_header(k, v)
        try:
            return urllib.request.urlopen(req).read()
        except Exception as e:
            return getattr(e, 'read', lambda: str(e).encode())()

    call('POST', '/storage/v1/bucket', json.dumps({'id': bucket, 'name': bucket, 'public': False}).encode())
    files = sorted(f for f in os.listdir(out_dir) if f.endswith('.webp') or f == 'toc.json' or f == 'meta.json')
    for i, f in enumerate(files, 1):
        ctype = 'image/webp' if f.endswith('.webp') else 'application/json'
        with open(os.path.join(out_dir, f), 'rb') as fh:
            r = call('POST', '/storage/v1/object/%s/%s/%s' % (bucket, kind, f), fh.read(), ctype, {'x-upsert': 'true'})
        if i % 50 == 0 or i == len(files):
            print('uploaded %d/%d' % (i, len(files)), flush=True)
    print('upload finished')


if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'render':
        render(sys.argv[2], sys.argv[3], int(sys.argv[4]) if len(sys.argv) > 4 else 1100, int(sys.argv[5]) if len(sys.argv) > 5 else 72)
    elif cmd == 'toc':
        toc(sys.argv[2], sys.argv[3])
    elif cmd == 'cover':
        cover(sys.argv[2], sys.argv[3])
    elif cmd == 'upload':
        upload(sys.argv[2], sys.argv[3], sys.argv[4] if len(sys.argv) > 4 else 'book')
    else:
        print(__doc__)
