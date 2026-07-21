#!/usr/bin/env python3
"""Strip MS Word HTML export artifacts from VAG-COM manual."""

import os
import re
from pathlib import Path

files = [
    "public/pdf/VAG/VagCom-Manual/manual.htm",
    "public/pdf/VAG/VagCom-Manual/manual/about_screen.html",
    "public/pdf/VAG/VagCom-Manual/manual/activation.html",
    "public/pdf/VAG/VagCom-Manual/manual/adaptation_screen.html",
    "public/pdf/VAG/VagCom-Manual/manual/b-settings.html",
    "public/pdf/VAG/VagCom-Manual/manual/dtc_screen.html",
    "public/pdf/VAG/VagCom-Manual/manual/login_screen.html",
    "public/pdf/VAG/VagCom-Manual/manual/m-blocks.html",
    "public/pdf/VAG/VagCom-Manual/manual/main_screen.html",
    "public/pdf/VAG/VagCom-Manual/manual/obd-2.html",
    "public/pdf/VAG/VagCom-Manual/manual/open_screen.html",
    "public/pdf/VAG/VagCom-Manual/manual/option_screen.html",
    "public/pdf/VAG/VagCom-Manual/manual/out_test.html",
    "public/pdf/VAG/VagCom-Manual/manual/readiness.html",
    "public/pdf/VAG/VagCom-Manual/manual/recode_screen.html",
    "public/pdf/VAG/VagCom-Manual/manual/scm_screen.html",
    "public/pdf/VAG/VagCom-Manual/manual/scm2_screen.html",
    "public/pdf/VAG/VagCom-Manual/manual/single_screen.html",
]

def clean_style_value(style_content):
    """Remove mso-* properties from style content."""
    # Split by semicolon, filter out mso-* properties
    parts = []
    for p in style_content.split(';'):
        p = p.strip()
        if p and not re.match(r'^mso-', p, re.IGNORECASE):
            parts.append(p)
    result = '; '.join(parts)
    # Clean up extra spaces and semicolons
    result = re.sub(r';\s*;', ';', result)
    result = re.sub(r'^\s*;+', '', result)
    result = re.sub(r';+\s*$', '', result)
    result = result.strip()
    return result

def clean_file(path):
    """Clean Word artifacts from a single file."""
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()

    original = text

    # 1. Remove mso-* CSS properties from style attributes (both single and double quotes)
    text = re.sub(
        r"style='([^']*)'",
        lambda m: f"style='{clean_style_value(m.group(1))}'" if clean_style_value(m.group(1)) else "",
        text
    )
    text = re.sub(
        r'style="([^"]*)"',
        lambda m: f'style="{clean_style_value(m.group(1))}"' if clean_style_value(m.group(1)) else "",
        text
    )

    # 2. Remove Mso* classes (MsoNormal, MsoNormalTable, GramE, SpellE)
    text = re.sub(r'\s*class\s*=\s*["\']?Mso\w+["\']?', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\s*class\s*=\s*["\']?GramE["\']?', '', text)
    text = re.sub(r'\s*class\s*=\s*["\']?SpellE["\']?', '', text)

    # 3. Remove <o:p> and </o:p> tags
    text = re.sub(r'</?o:p>', '', text)

    # 4. Remove id="_x0000_i####" from img tags
    text = re.sub(r'\s+id\s*=\s*"_x0000_i\d+"', '', text)
    text = re.sub(r"\s+id\s*=\s*'_x0000_i\d+'", '', text)

    # 5. Replace <![if !supportLineBreakNewLine]><br...><![endif]> with plain <br>
    text = re.sub(
        r"<!\[if\s+!supportLineBreakNewLine\]>\s*<br[^>]*>\s*<!\[endif\]>",
        "<br>",
        text,
        flags=re.IGNORECASE
    )

    if text != original:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(text)
        return True
    return False

for file_path in files:
    if os.path.exists(file_path):
        if clean_file(file_path):
            print(f"✓ {file_path}")
        else:
            print(f"- {file_path} (no changes)")
    else:
        print(f"✗ {file_path} (not found)")

print("\nDone!")
