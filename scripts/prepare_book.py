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
    """Uploads the page images. Safe to re-run: pages that are already there (same size) are skipped, failed
    uploads are retried, and the script says clearly how many pages are really in the bucket at the end."""
    import time
    import urllib.request
    from concurrent.futures import ThreadPoolExecutor
    url = os.environ['MAIN_SUPABASE_URL'].strip().strip('"').rstrip('/')
    key = os.environ['MAIN_SUPABASE_SERVICE_KEY'].strip().strip('"').strip()

    def call(method, path, data=None, ctype='application/json', extra=None, tries=6):
        last = ''
        for attempt in range(tries):
            req = urllib.request.Request(url + path, data=data, method=method)
            req.add_header('Authorization', 'Bearer ' + key)
            req.add_header('apikey', key)
            req.add_header('Content-Type', ctype)
            for k, v in (extra or {}).items():
                req.add_header(k, v)
            try:
                return True, urllib.request.urlopen(req, timeout=90).read()
            except urllib.error.HTTPError as e:
                last = 'HTTP %s %s' % (e.code, e.read()[:200])
                if e.code in (400, 401, 403, 404, 409) and attempt >= 1 and e.code != 404:
                    return False, last  # not a network problem - retrying will not help
            except Exception as e:  # timeouts, resets...
                last = str(e)
            time.sleep(min(30, 2 ** attempt))
        return False, last

    ok, msg = call('POST', '/storage/v1/bucket', json.dumps({'id': bucket, 'name': bucket, 'public': False}).encode(), tries=2)
    files = sorted(f for f in os.listdir(out_dir) if f.endswith('.webp') or f == 'toc.json' or f == 'meta.json')

    # what is already in the bucket?
    have = {}
    offset = 0
    while True:
        ok, raw = call('POST', '/storage/v1/object/list/' + bucket, json.dumps({'prefix': kind, 'limit': 1000, 'offset': offset}).encode(), tries=3)
        if not ok:
            break
        try:
            rows = json.loads(raw)
        except Exception:
            break
        for r in rows:
            have[r.get('name')] = (r.get('metadata') or {}).get('size')
        if len(rows) < 1000:
            break
        offset += 1000
    todo = [f for f in files if have.get(f) != os.path.getsize(os.path.join(out_dir, f))]
    print('%d files, %d already uploaded, %d to upload' % (len(files), len(files) - len(todo), len(todo)), flush=True)

    failed = []
    done = [0]

    def one(f):
        ctype = 'image/webp' if f.endswith('.webp') else 'application/json'
        with open(os.path.join(out_dir, f), 'rb') as fh:
            data = fh.read()
        ok, msg = call('POST', '/storage/v1/object/%s/%s/%s' % (bucket, kind, f), data, ctype, {'x-upsert': 'true'})
        done[0] += 1
        if not ok:
            failed.append((f, msg))
        if done[0] % 25 == 0 or done[0] == len(todo):
            print('uploaded %d/%d (failed so far: %d)' % (done[0], len(todo), len(failed)), flush=True)

    with ThreadPoolExecutor(max_workers=4) as ex:
        list(ex.map(one, todo))
    if failed:
        print('FAILED %d file(s), e.g. %s -> %s' % (len(failed), failed[0][0], failed[0][1]))
        print('Run the same command again: it only uploads what is missing.')
        sys.exit(1)
    print('upload finished - all %d files are in the bucket' % len(files))


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
