import os
import re

html_dir = r"c:\Users\Nishant\Desktop\HSBTE_LEET\html"

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    
    # 1. Years
    content = re.sub(r'\b2024\b', '2026', content)
    content = re.sub(r'\b2025\b', '2026', content)
    content = re.sub(r'\b2027\b', '2026', content)
    
    # 2. Number of papers (14 -> 24)
    content = re.sub(r'\b14(?=\s+(exclusive|Sample|sample|HSBTE|premium|Papers))', '24', content)
    
    # 3. Prices (49 -> 99, 79 -> 149)
    content = re.sub(r'(?<!#)\b49\b', '99', content)
    content = re.sub(r'(?<!#)\b79\b', '149', content)

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {os.path.basename(filepath)}")

count = 0
for filename in os.listdir(html_dir):
    if filename.endswith(".html"):
        f_path = os.path.join(html_dir, filename)
        process_file(f_path)
        count += 1
print(f"Checked {count} files.")
