"""Read public rendered tables only. Never save scripts, styles, HTML or assets."""
import concurrent.futures
import json
import re
import urllib.request
from pathlib import Path
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://pubgstatistics.com'

def read(path):
    request = urllib.request.Request(BASE + path, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(request, timeout=40) as response:
        soup = BeautifulSoup(response.read(), 'html.parser')
    for element in soup(['script', 'style', 'svg']):
        element.decompose()
    return soup

def detail(path):
    soup = read(path)
    tables = [[[c.get_text(' ', strip=True) for c in row.select('th,td')]
               for row in table.select('tr')] for table in soup.select('table')]
    text = soup.get_text(' ', strip=True)
    title = soup.find('h1').get_text(' ', strip=True)
    start = text.index(title, text.index('All weapons')) + len(title)
    # Only factual header and table values; prose is examined but not replicated.
    header = text[start:text.index('Damage falloff', start)].split('Fire rate:')[0]
    links = sorted(set(a.get('href') for a in soup.select('a[href]') if 'pubg.com/' in a.get('href')))
    patches = []
    history = soup.find(id='change-history')
    if history:
        listing = history.find('ol')
        for item in listing.find_all('li', recursive=False) if listing else []:
            anchor = item.find('a', href=re.compile('pubg.com'))
            value = item.get_text(' ', strip=True)
            patch = re.match(r'(\d+\.\d+)\s+(\d+\s+\w+\s+\d{4})', value)
            if patch and anchor:
                changes = []
                for child in item.select('ul > li'):
                    line = child.get_text(' ', strip=True)
                    kind = next((t for t in ['Damage','Recoil','Fire rate','Attachments','Handling','Spawn rate','Added','Removed','Other'] if line.startswith(t)), 'Other')
                    changes.append({'type':kind.lower(), 'direction': 'buff' if 'buff' in line[:30] else 'nerf' if 'nerf' in line[:30] else 'changed', 'figures':re.findall(r'\d+(?:\.\d+)?(?:%| RPM|m/s|s\b)', line)})
                patches.append({'patch':patch[1], 'date':patch[2], 'sourceUrl':anchor['href'], 'changes':changes})
    result = {'slug': path.split('/')[-1], 'name': title, 'sourceUrl': BASE+path,
              'header': header, 'tables': tables, 'officialPatchLinks': links, 'patches':patches}
    print(json.dumps({'slug': result['slug'], 'header': header, 'tableRows': [len(t) for t in tables]}, ensure_ascii=True), flush=True)
    return result

if __name__ == '__main__':
    listing = read('/weapons')
    paths = sorted(set(a['href'] for a in listing.select('a[href]') if re.fullmatch(r'/weapons/[a-z0-9-]+', a['href']) and a['href'] != '/weapons/patch-notes'))
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(detail, paths))
    out = ROOT/'docs/research-observations.json'
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps({'retrievedAt':'2026-09-22','pages':results}, ensure_ascii=False, indent=2), encoding='utf-8')
    print('Investigated', len(results), 'detail pages')
