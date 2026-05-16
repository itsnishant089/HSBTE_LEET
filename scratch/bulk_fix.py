import os
import re

html_dir = 'html'
image_renames = {
    'hsbte pyq.webp': 'hsbte-pyq.webp',
    'leet sample paper.webp': 'leet-sample-paper.webp',
    'sample paper.webp': 'sample-paper.webp',
    'Chemical Engginering.webp': 'chemical-engineering.webp',
    'Food Tech.webp': 'food-tech.webp'
}

# Also handle partials
dirs_to_check = ['html', 'partials', 'js']

for d in dirs_to_check:
    if not os.path.exists(d): continue
    for filename in os.listdir(d):
        if filename.endswith(('.html', '.js')):
            filepath = os.path.join(d, filename)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
            except:
                continue
            
            # 1. Fix canonical and OG URLs (remove .html)
            if filename.endswith('.html'):
                content = re.sub(r'(<link rel="canonical" href="https://hsbteleet.com/[^"]+)\.html(" */?>)', r'\1\2', content)
                content = re.sub(r'(<meta property="og:url" content="https://hsbteleet.com/[^"]+)\.html(" */?>)', r'\1\2', content)
            
            # 2. Fix image names
            for old, new in image_renames.items():
                content = content.replace(f'image/{old}', f'image/{new}')
                content = content.replace(f'image/{old.replace(" ", "%20")}', f'image/{new}')
            
            # 3. Fix syllabus.html links -> /hsbte-syllabus
            content = content.replace('syllabus.html', 'hsbte-syllabus')
            
            # 4. Ensure FontAwesome is present if not already (only for HTML files)
            if filename.endswith('.html') and 'font-awesome' not in content.lower() and 'include.js' not in content.lower():
                # Add include.js if missing
                if '</body>' in content:
                    content = content.replace('</body>', '<script defer src="/js/include.js"></script>\n</body>')
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)

print("Bulk update complete.")
