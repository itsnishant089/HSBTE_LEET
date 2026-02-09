#!/usr/bin/env python3
"""
Script to check and fix meta descriptions for all branch pages
Ensures each page has a branch-specific description
"""

import os
import re
from pathlib import Path

# Branch name mappings (filename -> display name)
BRANCH_MAPPINGS = {
    'civil': 'Civil Engineering',
    'mech': 'Mechanical Engineering',
    'computer-pyq': 'Computer Engineering',
    'ece': 'Electronics and Communication Engineering',
    'Electrical-Engineering': 'Electrical Engineering',
    'Chemical': 'Chemical Engineering',
    'ai-ml': 'AI & Machine Learning',
    'Automation': 'Automation & Robotics',
    'Automobile': 'Automobile Engineering',
    'Textile-Technology': 'Textile Technology',
    'Textile-Processing': 'Textile Processing',
    'Textile-Design': 'Textile Design',
    'Plastic': 'Plastic Technology',
    'FAA': 'Finance Accounts & Auditing',
    'dbm': 'Business Management',
    'Hotel-Management': 'Hotel Management',
    'Food': 'Food Technology',
    'Fashion-Technology': 'Fashion Technology',
    'Fashion-Design': 'Fashion Design',
    'Medical-Electronics': 'Medical Electronics',
    'Medical-Laboratory-Technology': 'Medical Laboratory Technology',
    'Library': 'Library & Information Science',
    'Instrumentation-&-Control': 'Instrumentation & Control',
    'Office-Management': 'Office Management',
    'Ceramic': 'Ceramic Engineering',
    'Architectural-Assistantship': 'Architectural Assistantship',
    'd-pharmacy': 'D Pharmacy',
    'haryanaleet': 'Haryana LEET',
    'btech-leet': 'BTech LEET',
    'B-Pharmacy-leet': 'B Pharmacy LEET',
    'hsbte-pyq': 'HSBTE PYQ',
    'syllabus': 'HSBTE Syllabus'
}

def get_branch_name(filename):
    """Extract branch name from filename"""
    base = Path(filename).stem
    # Remove semester numbers
    base = re.sub(r'-\d+$', '', base)
    base = re.sub(r'-pyq-\d+-semester$', '', base)
    base = re.sub(r'-1-semester$', '', base)
    
    # Check special cases
    if 'computer' in base:
        return 'Computer Engineering'
    if 'mech' in base:
        return 'Mechanical Engineering'
    if 'ece' in base:
        return 'Electronics and Communication Engineering'
    
    # Check mappings
    for key, value in BRANCH_MAPPINGS.items():
        if key in base:
            return value
    
    # Default: capitalize and format
    return base.replace('-', ' ').title()

def generate_description(branch_name, is_semester=False, semester_num=None):
    """Generate branch-specific description"""
    if is_semester and semester_num:
        sem_text = f"{semester_num} Semester"
        return f"Download {branch_name} {sem_text} Previous Year Question Papers (PYQ) for HSBTE. Free PDF downloads for all Haryana Polytechnic students. Access all subjects and exam sessions including Dec 2024, July 2024, Feb 2023, and May-June 2025."
    else:
        return f"Download {branch_name} previous year question papers PDF from HSBTE PYQ. Get Haryana Polytechnic {branch_name} semester wise PYQ free. Access all semesters including 1st, 2nd, 3rd, 4th, 5th, and 6th semester {branch_name} diploma question papers."

def fix_description_in_file(filepath):
    """Fix meta description in a single file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Extract branch and semester info
        filename = os.path.basename(filepath)
        branch_name = get_branch_name(filename)
        
        # Check if it's a semester page
        semester_match = re.search(r'-(\d+)(\.html|$)', filename)
        is_semester = bool(semester_match)
        semester_num = None
        if is_semester:
            num = semester_match.group(1)
            semester_num = {1: '1st', 2: '2nd', 3: '3rd'}.get(int(num), f'{num}th')
        
        # Generate new description
        new_desc = generate_description(branch_name, is_semester, semester_num)
        
        # Find and replace meta description
        pattern = r'<meta\s+name=["\']description["\']\s+content=["\']([^"\']+)["\']\s*/?>'
        
        if re.search(pattern, content):
            new_content = re.sub(
                pattern,
                f'<meta name="description" content="{new_desc}" />',
                content
            )
            
            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"[FIXED] {filename} - {branch_name}")
                return True
            else:
                print(f"[OK] Already correct: {filename}")
                return False
        else:
            print(f"[WARN] No description found: {filename}")
            return False
            
    except Exception as e:
        print(f"[ERROR] Error processing {filepath}: {e}")
        return False

def main():
    """Main function"""
    html_dir = Path('html')
    if not html_dir.exists():
        print("Error: html directory not found")
        return
    
    html_files = list(html_dir.glob('*.html'))
    print(f"Found {len(html_files)} HTML files\n")
    
    fixed_count = 0
    for html_file in sorted(html_files):
        if fix_description_in_file(html_file):
            fixed_count += 1
    
    print(f"\n[SUMMARY] Fixed {fixed_count} files")

if __name__ == '__main__':
    main()
