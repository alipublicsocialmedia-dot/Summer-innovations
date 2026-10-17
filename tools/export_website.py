"""Export a self-contained seven-page HTML and a clean source ZIP."""
from pathlib import Path
import base64
import json
import re
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]


def safe_json(value):
    return json.dumps(value, ensure_ascii=False).replace('<', '\\u003c').replace('>', '\\u003e')


def export(output):
    output.mkdir(parents=True, exist_ok=True)
    css = (ROOT / 'assets/styles.css').read_text()
    for font in (ROOT / 'assets/fonts').glob('*.woff2'):
        data = base64.b64encode(font.read_bytes()).decode()
        css = css.replace('fonts/' + font.name, 'data:font/woff2;base64,' + data)
    script = (ROOT / 'assets/script.js').read_text()
    files = [ROOT / 'index.html', *sorted((ROOT / 'services').glob('*.html')), *sorted((ROOT / 'products').glob('*.html'))]
    pages = {}
    favicon = 'data:image/svg+xml;base64,' + base64.b64encode((ROOT / 'assets/favicon.svg').read_bytes()).decode()
    for file in files:
        html = re.sub(r'<link rel="stylesheet"[^>]+>', '', file.read_text())
        html = re.sub(r'<script src="[^"]+assets/script.js"></script>', '', html)
        html = re.sub(r'<link rel="icon"[^>]+>', '<link rel="icon" href="' + favicon + '">', html)
        pages[file.relative_to(ROOT).as_posix()] = html
    bridge = '''
document.addEventListener('click', event => {
  const anchor = event.target.closest('a[href]');
  if (!anchor || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || anchor.hasAttribute('download')) return;
  const raw = anchor.getAttribute('href');
  if (/^(?:[a-z][a-z0-9+.-]*:|\\/\\/)/i.test(raw)) return;
  const url = new URL(raw, 'https://sumair.local/' + document.body.dataset.pagePath);
  const target = url.pathname.slice(1);
  if (!PAGE_NAMES.includes(target)) return;
  event.preventDefault();
  parent.postMessage({type:'sumair-navigate', page:target, section:decodeURIComponent(url.hash.slice(1))}, '*');
});
'''.replace('PAGE_NAMES', safe_json(list(pages)))
    data = {'pages': pages, 'css': css, 'script': script + '\n' + bridge}
    license_text = {p.name: p.read_text() for p in (ROOT / 'assets/fonts').glob('*LICENSE.txt')}
    shell = '''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#102e25"><title>Sumair Innovations</title>
<style>html,body{margin:0;height:100%;background:#102e25}iframe{display:block;width:100%;height:100%;border:0}noscript{color:#dbf99a;font:18px sans-serif;padding:2rem;display:block}</style></head><body>
<noscript>Enable JavaScript to view this portable website, or open index.html from the source ZIP.</noscript>
<iframe id="website" title="Sumair Innovations complete website"></iframe>
<script id="website-data" type="application/json">__DATA__</script>
<script id="font-licenses" type="application/json">__LICENSES__</script>
<script>
'use strict';
const bundle = JSON.parse(document.getElementById('website-data').textContent);
const frame = document.getElementById('website');
let activePage = '', requestedSection = '';
function scrollToSection() {
  const doc = frame.contentDocument;
  if (!doc) return;
  const section = requestedSection && doc.getElementById(requestedSection);
  if (section) section.scrollIntoView();
  else frame.contentWindow.scrollTo(0, 0);
}
function render() {
  const route = location.hash.slice(1).replace(/^\\//, '') || 'index.html';
  const [candidate, query = ''] = route.split('?');
  const page = Object.hasOwn(bundle.pages, candidate) ? candidate : 'index.html';
  requestedSection = new URLSearchParams(query).get('section') || '';
  if (page === activePage) {scrollToSection(); return;}
  activePage = page;
  frame.srcdoc = bundle.pages[page].replace('</head>', '<style>' + bundle.css + '</style></head>').replace('</body>', '<script>' + bundle.script + '<' + '/script></body>');
}
frame.addEventListener('load', () => {
  if (frame.contentDocument) document.title = frame.contentDocument.title;
  scrollToSection();
});
window.addEventListener('message', event => {
  if (event.source !== frame.contentWindow || event.data?.type !== 'sumair-navigate' || !Object.hasOwn(bundle.pages, event.data.page)) return;
  const hash = '#/' + event.data.page + (event.data.section ? '?section=' + encodeURIComponent(event.data.section) : '');
  if (location.hash === hash) scrollToSection(); else location.hash = hash;
});
window.addEventListener('hashchange', render);
render();
</script></body></html>'''
    standalone = output / 'Sumair-Innovations.html'
    standalone.write_text(shell.replace('__DATA__', safe_json(data)).replace('__LICENSES__', safe_json(license_text)))
    archive = output / 'Sumair-Innovations-Website.zip'
    source_files = [ROOT / 'README.md', ROOT / '.gitignore', ROOT / 'index.html']
    for directory in ['assets', 'services', 'products', 'templates', 'tools']:
        source_files.extend(p for p in (ROOT / directory).rglob('*') if p.is_file() and '__pycache__' not in p.parts and p.suffix != '.pyc')
    with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED) as zip_file:
        for file in sorted(source_files):
            zip_file.write(file, 'Sumair-Innovations/' + file.relative_to(ROOT).as_posix())
    print(f'Exported {standalone} ({standalone.stat().st_size:,} bytes)')
    print(f'Exported {archive} ({archive.stat().st_size:,} bytes)')


if __name__ == '__main__':
    export(Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else ROOT / 'dist')
