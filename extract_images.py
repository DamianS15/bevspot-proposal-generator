import re
import os

os.makedirs('src/assets', exist_ok=True)

with open('original.html', 'r', encoding='utf-8') as f:
    content = f.read()

topbar_logo_match = re.search(r'<img id="topbar-logo" src="([^"]+)"', content)
bevspot_logo_match = re.search(r'<div class="bevspot-logo-box">\s*<img src="([^"]+)"', content)

with open('src/assets/images.js', 'w', encoding='utf-8') as out:
    out.write('export const topbarLogo = "' + (topbar_logo_match.group(1) if topbar_logo_match else '') + '";\n')
    out.write('export const bevspotLogo = "' + (bevspot_logo_match.group(1) if bevspot_logo_match else '') + '";\n')

print("Images extracted successfully.")
