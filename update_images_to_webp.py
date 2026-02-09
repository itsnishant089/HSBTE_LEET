#!/usr/bin/env python3
"""
Update all HTML files to use WebP images instead of PNG/JPEG
This script updates references without converting images (conversion should be done separately)
"""

import os
import re
from pathlib import Path

def update_html_file(html_file):
    """Update image references in a single HTML file"""
    try:
        with open(html_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        changes = 0
        
        # Pattern to match image src/href/content attributes with PNG/JPEG
        patterns = [
            # src="../image/filename.png" -> src="../image/filename.webp"
            (r'src=["\']([^"\']*\.(png|jpg|jpeg))["\']', r'src="\1'.replace(r'\.png', '.webp').replace(r'\.jpg', '.webp').replace(r'\.jpeg', '.webp') + '"'),
            # href="../image/filename.png"
            (r'href=["\']([^"\']*\.(png|jpg|jpeg))["\']', lambda m: f'href="{m.group(1).replace(".png", ".webp").replace(".jpg", ".webp").replace(".jpeg", ".webp")}"'),
            # content="https://hsbteleet.com/image/filename.png"
            (r'content=["\']([^"\']*\.(png|jpg|jpeg))["\']', lambda m: f'content="{m.group(1).replace(".png", ".webp").replace(".jpg", ".webp").replace(".jpeg", ".webp")}"'),
        ]
        
        # Simple replacement approach
        def replace_image_ext(match):
            full_match = match.group(0)
            for ext in ['.png', '.jpg', '.jpeg']:
                if ext in full_match.lower():
                    return full_match.replace(ext, '.webp').replace(ext.upper(), '.webp')
            return full_match
        
        # Replace all image extensions
        content = re.sub(
            r'(src|href|content)=["\']([^"\']*\.(png|jpg|jpeg))["\']',
            replace_image_ext,
            content,
            flags=re.IGNORECASE
        )
        
        if content != original_content:
            with open(html_file, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
    except Exception as e:
        print(f"Error updating {html_file}: {e}")
        return False

def main():
    """Main function"""
    html_dir = Path('html')
    partials_dir = Path('partials')
    syllabus_dir = Path('syllabus')
    root_files = [Path('index.html')]
    
    html_files = []
    
    # Collect all HTML files
    if html_dir.exists():
        html_files.extend(html_dir.glob('*.html'))
    if partials_dir.exists():
        html_files.extend(partials_dir.glob('*.html'))
    if syllabus_dir.exists():
        html_files.extend(syllabus_dir.glob('*.html'))
    html_files.extend([f for f in root_files if f.exists()])
    
    print(f"Found {len(html_files)} HTML files to update\n")
    
    updated_count = 0
    for html_file in html_files:
        if update_html_file(html_file):
            print(f"[UPDATED] {html_file}")
            updated_count += 1
    
    print(f"\n[SUMMARY] Updated {updated_count} files")

if __name__ == '__main__':
    main()
