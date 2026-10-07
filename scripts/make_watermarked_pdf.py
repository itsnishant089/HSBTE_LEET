"""
make_watermarked_pdf.py — create the personal PDF copy for a buyer of the "Reader + PDF by email" plan.

    python scripts/make_watermarked_pdf.py "<MASTER.pdf>" "<student name>" <mobile> [out_dir]

* Stamps the buyer's name + mobile diagonally on EVERY page (and a small licence line in the footer),
  so a leaked copy can be traced back to the buyer.
* Locks the PDF (AES-256): printing, copying text and editing are disallowed for normal viewers.
* Result: <out_dir>/HaryanaLEET_<name>_<last4>.pdf — email it (or share a private Drive link) and then press
  "Mark delivered" in the admin portal → Book Purchases.
Keep the owner password in your own notes; it is printed once at the end.
"""
import os
import re
import secrets
import sys

import pymupdf


def main():
    if len(sys.argv) < 4:
        print(__doc__)
        sys.exit(1)
    src, name, mobile = sys.argv[1], sys.argv[2].strip(), re.sub(r'\D', '', sys.argv[3])[-10:]
    out_dir = sys.argv[4] if len(sys.argv) > 4 else '.'
    os.makedirs(out_dir, exist_ok=True)
    label = '%s | %s | hsbteleet.com' % (name, mobile)
    foot = 'Licensed to %s (%s) — personal use only — sharing is prohibited' % (name, mobile)

    doc = pymupdf.open(src)
    for page in doc:
        r = page.rect
        pivot = pymupdf.Point(r.width / 2, r.height / 2)
        mat = pymupdf.Matrix(-30)
        fs = max(10.0, r.width / 48)
        y = -r.height * 0.25
        row = 0
        while y < r.height * 1.25:
            x0 = r.width * (0.02 if row % 2 == 0 else 0.30)
            for dx in (0, r.width * 0.55):
                page.insert_text(pymupdf.Point(x0 + dx, y), label, fontsize=fs, color=(0.1, 0.33, 0.86),
                                 fill_opacity=0.11, morph=(pivot, mat))
            y += r.height * 0.11
            row += 1
        page.insert_text(pymupdf.Point(18, r.height - 8), foot, fontsize=6.5, color=(0.35, 0.35, 0.35), fill_opacity=0.85)

    owner = secrets.token_urlsafe(10)
    perms = pymupdf.PDF_PERM_ACCESSIBILITY  # no print / copy / modify
    safe = re.sub(r'[^A-Za-z0-9]+', '_', name).strip('_')[:30] or 'student'
    out = os.path.join(out_dir, 'HaryanaLEET_%s_%s.pdf' % (safe, mobile[-4:]))
    doc.save(out, garbage=3, deflate=True, encryption=pymupdf.PDF_ENCRYPT_AES_256, owner_pw=owner, user_pw='', permissions=perms)
    print('Created:', out, '(%.1f MB)' % (os.path.getsize(out) / 1e6))
    print('Owner password (keep it): ' + owner)


if __name__ == '__main__':
    main()
