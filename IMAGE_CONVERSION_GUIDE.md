# Image Conversion to WebP - Guide

## Overview
All HTML files have been updated to reference WebP images. Now you need to convert the actual image files.

## Quick Conversion (Using Online Tools)

### Option 1: Bulk Convert Online
1. Visit: https://cloudconvert.com/png-to-webp (or similar bulk converter)
2. Upload all PNG/JPEG files from the `image/` folder
3. Set quality to 80-85%
4. Download and replace files in `image/` folder

### Option 2: Using Python (Pillow)
```bash
pip install Pillow
python convert_images_to_webp.py
```

### Option 3: Using ImageMagick (Command Line)
```bash
# Install ImageMagick first
# Then run:
cd image
for file in *.png; do
    magick "$file" -quality 85 "${file%.png}.webp"
done
```

### Option 4: Using cwebp (Google's WebP Tools)
```bash
# Download from: https://developers.google.com/speed/webp/download
# Then:
cd image
for file in *.png; do
    cwebp -q 85 "$file" -o "${file%.png}.webp"
done
```

## Critical Images to Convert First
1. `syllabus.png` (1.1MB) - **HIGHEST PRIORITY**
2. `robo.png` (if exists)
3. `banner bgremove.png`
4. `line bgremove.png`
5. All branch icons (`.png` files)

## After Conversion
1. Verify WebP files are created in `image/` folder
2. Test the website to ensure images load correctly
3. Keep original PNG files as backup (optional)

## Expected File Size Reduction
- `syllabus.png`: ~1.1MB → ~100-150KB (85-90% reduction)
- Other images: 30-50% reduction typical
