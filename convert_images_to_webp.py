#!/usr/bin/env python3
"""
Convert all PNG and JPEG images to WebP format and update HTML references
"""

import os
import re
from pathlib import Path
from PIL import Image
import sys

def convert_to_webp(input_path, output_path, quality=85):
    """Convert image to WebP format"""
    try:
        img = Image.open(input_path)
        
        # Convert RGBA to RGB if necessary (WebP supports transparency)
        if img.mode in ('RGBA', 'LA'):
            # Keep transparency for PNG
            img.save(output_path, 'WEBP', quality=quality, method=6)
        else:
            # Convert to RGB if not RGBA
            if img.mode != 'RGB':
                img = img.convert('RGB')
            img.save(output_path, 'WEBP', quality=quality, method=6)
        
        return True
    except Exception as e:
        print(f"Error converting {input_path}: {e}")
        return False

def update_html_references(html_file, image_mappings):
    """Update image references in HTML files"""
    try:
        with open(html_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Update all image references
        for old_ext, new_ext in [('.png', '.webp'), ('.jpg', '.webp'), ('.jpeg', '.webp')]:
            # Pattern to match image src attributes
            patterns = [
                # src="../image/filename.png"
                (rf'src=["\']([^"\']*{re.escape(old_ext)})["\']', rf'src="\1'.replace(old_ext, new_ext) + '"'),
                # href="../image/filename.png"
                (rf'href=["\']([^"\']*{re.escape(old_ext)})["\']', rf'href="\1'.replace(old_ext, new_ext) + '"'),
                # content="https://hsbteleet.com/image/filename.png"
                (rf'content=["\']([^"\']*{re.escape(old_ext)})["\']', rf'content="\1'.replace(old_ext, new_ext) + '"'),
            ]
            
            for pattern, replacement in patterns:
                def replace_func(match):
                    old_path = match.group(1)
                    new_path = old_path.replace(old_ext, new_ext)
                    return match.group(0).replace(old_path, new_path)
                
                content = re.sub(pattern, replace_func, content, flags=re.IGNORECASE)
        
        if content != original_content:
            with open(html_file, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
    except Exception as e:
        print(f"Error updating {html_file}: {e}")
        return False

def main():
    """Main conversion function"""
    image_dir = Path('image')
    html_dir = Path('html')
    root_html_files = [Path('index.html'), Path('syllabus/syllabus.html')]
    
    if not image_dir.exists():
        print("Error: image directory not found")
        return
    
    # Find all images to convert
    images_to_convert = []
    for ext in ['*.png', '*.jpg', '*.jpeg']:
        images_to_convert.extend(image_dir.glob(ext))
    
    # Filter out already converted WebP files
    images_to_convert = [img for img in images_to_convert if not img.with_suffix('.webp').exists()]
    
    print(f"Found {len(images_to_convert)} images to convert\n")
    
    converted_count = 0
    failed_count = 0
    
    for img_path in images_to_convert:
        webp_path = img_path.with_suffix('.webp')
        
        # Skip if already exists
        if webp_path.exists():
            print(f"[SKIP] {img_path.name} -> {webp_path.name} (already exists)")
            continue
        
        print(f"Converting {img_path.name}...", end=' ')
        
        # Special handling for large images
        quality = 85
        if 'syllabus' in img_path.name.lower():
            quality = 80  # Higher compression for large syllabus image
        
        if convert_to_webp(img_path, webp_path, quality):
            # Get file sizes
            old_size = img_path.stat().st_size / 1024  # KB
            new_size = webp_path.stat().st_size / 1024  # KB
            savings = ((old_size - new_size) / old_size) * 100
            
            print(f"✓ ({old_size:.1f}KB -> {new_size:.1f}KB, {savings:.1f}% savings)")
            converted_count += 1
        else:
            print("✗ FAILED")
            failed_count += 1
    
    print(f"\n[SUMMARY] Converted: {converted_count}, Failed: {failed_count}\n")
    
    # Update HTML files
    print("Updating HTML references...")
    html_files = list(html_dir.glob('*.html')) + root_html_files
    
    updated_count = 0
    for html_file in html_files:
        if html_file.exists() and update_html_references(html_file, {}):
            updated_count += 1
    
    # Also update partials
    partials_dir = Path('partials')
    if partials_dir.exists():
        for html_file in partials_dir.glob('*.html'):
            if update_html_references(html_file, {}):
                updated_count += 1
    
    print(f"[SUMMARY] Updated {updated_count} HTML files")

if __name__ == '__main__':
    try:
        main()
    except ImportError:
        print("Error: PIL (Pillow) library not installed.")
        print("Install it with: pip install Pillow")
        sys.exit(1)
