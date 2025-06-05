# Script untuk mengecek dan memperbaiki mixed content issues

import re
import os
from pathlib import Path

def find_mixed_content_in_templates():
    """Find potential mixed content issues in HTML templates"""
    template_dir = Path("app/templates")
    mixed_content_patterns = [
        r'src=["\']http://[^"\']*["\']',
        r'href=["\']http://[^"\']*["\']',
        r'action=["\']http://[^"\']*["\']',
        r'url$$["\']?http://[^"\']*["\']?$$',
    ]
    
    issues_found = []
    
    for template_file in template_dir.rglob("*.html"):
        with open(template_file, 'r', encoding='utf-8') as f:
            content = f.read()
            line_number = 1
            
            for line in content.split('\n'):
                for pattern in mixed_content_patterns:
                    matches = re.findall(pattern, line, re.IGNORECASE)
                    if matches:
                        issues_found.append({
                            'file': str(template_file),
                            'line': line_number,
                            'content': line.strip(),
                            'matches': matches
                        })
                line_number += 1
    
    return issues_found

def check_javascript_files():
    """Check JavaScript files for HTTP URLs"""
    js_dir = Path("app/static/js")
    issues_found = []
    
    for js_file in js_dir.rglob("*.js"):
        with open(js_file, 'r', encoding='utf-8') as f:
            content = f.read()
            if 'http://' in content and 'https://' not in content.replace('http://', ''):
                issues_found.append({
                    'file': str(js_file),
                    'issue': 'Contains HTTP URLs'
                })
    
    return issues_found

print("Checking for Mixed Content Issues...")
print("=" * 40)

# Check templates
template_issues = find_mixed_content_in_templates()
if template_issues:
    print("Mixed content found in templates:")
    for issue in template_issues:
        print(f"  File: {issue['file']}")
        print(f"  Line {issue['line']}: {issue['content']}")
        print(f"  Matches: {issue['matches']}")
        print()
else:
    print("No mixed content issues found in templates.")

# Check JavaScript files
js_issues = check_javascript_files()
if js_issues:
    print("Issues found in JavaScript files:")
    for issue in js_issues:
        print(f"  File: {issue['file']}")
        print(f"  Issue: {issue['issue']}")
        print()
else:
    print("No HTTP URL issues found in JavaScript files.")

print("\nRecommendations:")
print("1. Replace all http:// URLs with https:// or use protocol-relative URLs (//)")
print("2. Use relative URLs for internal resources")
print("3. Ensure all external resources support HTTPS")
