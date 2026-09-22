"""Convert reviewed public numeric observations into independent domain records."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
pages = json.loads((ROOT/'docs/research-observations.json').read_text(encoding='utf-8'))['pages']
categories = {'Assault Rifle':'AR','LMG':'LMG','SMG':'SMG','Marksman Rifle':'DMR','Sniper Rifle':'SR','Shotgun':'SHOTGUN','Handgun':'HANDGUN'}
removed = {'bizon','dp-28','mosin-nagant','p1911','qbu','r45'}
bolt = {'awm':[2.11,2.47,2.57,2.67,2.70], 'kar98k':[1.68,1.93,2.13,2.23,2.29], 'm24':[1.56,1.95,2,2.03,2.10], 'mosin-nagant':[1.63,2.02,2.17,2.25,2.30], 'win94':[.94,1.34,1.34,1.34,1.34]}
# Each tuple is an observed Normal TTK and its HTK. It is not raw timing.
normal = {'deagle':[1.29,6], 'dragunov':[2.70,7], 'lynx-amr':[2.20,3], 'mk12':[2.09,9], 'mini-14':[2.09,9], 'p1911':[.95,8], 'p92':[1.11,10], 'qbu':[2.06,9], 'r1895':[1.07,5], 'r45':[1.28,5], 's12k':[.29,2], 's1897':[.79,2], 's686':[.25,2], 'sawed-off':[.30,2], 'sks':[1.78,8], 'slr':[1.81,8], 'dbs':[.20,2]}
def save(path, data):
    target = ROOT/path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
def source(url, confidence='verified', precision='displayed'):
    return {'source':'pubgstatistics public tables','sourceUrl':url,'gameVersion':'43.1','retrievedAt':'2026-09-22','confidence':confidence,'precision':precision}

groups = {v:[] for v in categories.values()}
classes = {}
patches = []
timings = {}
body = []
for page in pages:
    slug, header = page['slug'], page['header']
    category = next(value for key,value in categories.items() if key+' ·' in header)
    raw_parts = page['tables'][1][1:]
    multipliers = {r[0].lower().replace(' ','-'):float(r[2]) for r in raw_parts}
    if category not in classes and slug != 'dragunov': classes[category] = multipliers
    if not body:
        for i,r in enumerate(raw_parts):
            body.append({'id':r[0].lower().replace(' ','-'),'name':r[0].title(), 'hitMultiplier':float(r[1]), 'armor':'helmet' if i<2 else 'vest' if i<7 else 'none'})
    samples = [{'distance':float(r[0].replace(' m','')),'damage':float(r[1])} for r in page['tables'][0][1:]]
    ammo_match = re.search(r' · ([^.·]+(?:\.\d+)?[^·]*?) Base damage', header)
    prefix = header.split(' Base damage')[0].split(' · ')[1:]
    ammo = next((p.strip() for p in prefix if p.strip() != 'Care package only'), None)
    rpm = int(re.search(r'Fire rate (\d+)',header)[1])
    pellet = re.search(r'(\d+) per shot',header)
    kind = 'bolt' if slug in bolt else 'burst' if 'peak (burst)' in header else 'pump' if slug=='s1897' else 'single' if 'peak' in header else 'auto'
    firing = {'kind':kind, 'rpm':rpm, 'normalInterval':None, 'cycleLimit':2 if slug in ['s686','sawed-off','dbs'] else None}
    if kind == 'burst':
        size = 2 if slug=='mk47-mutant' else 3
        intra = 60/rpm
        observed_ttk, htk = (.48,8) if size==2 else (.64,9)
        boundaries = (htk-1)//size
        normal_boundary = (observed_ttk-(htk-1-boundaries)*intra)/boundaries
        firing.update({'burstSize':size,'intraBurstInterval':intra,'perfectBoundaryInterval':intra,'normalBoundaryInterval':normal_boundary})
    if kind=='auto': firing['rpmOptions'] = [990,660] if slug=='mg3' else [rpm]
    if kind=='bolt': firing['timingId'] = slug
    if slug in normal:
        ttk,htk = normal[slug]
        firing['normalInterval'] = ttk/(htk-1)
    record = {'id':slug,'slug':slug,'name':page['name'],'category':category,'ammoType':ammo,
              'baseDamage':samples[0]['damage'] if samples[0]['distance']==0 else None,
              'carePackage':'Care package only' in header,'status':'archived' if slug in removed else 'active',
              'muzzleVelocity':735 if slug=='rpd' else None,
              'measuredRange':{'min':samples[0]['distance'],'max':samples[-1]['distance']},'falloff':samples,
              'multiplierOverrides':multipliers if slug=='dragunov' else {},
              'projectile':{'kind':'pellets','pelletCount':int(pellet[1])} if pellet else {'kind':'slug' if slug=='o12' else 'bullet','pelletCount':1},
              'firing':firing,'source':source(page['sourceUrl']),
              'timingSource':source(page['sourceUrl'],'derived','rounded-display-or-rpm')}
    groups[category].append(record)
    for patch in page['patches']:
        patches.append({'weaponId':slug, **patch, 'source':source(page['sourceUrl'])})
    if slug in bolt:
        timings[slug] = {'intervals':dict(zip(['none','2x','4x','6x','8x'],bolt[slug])), 'source':source(page['sourceUrl'],'derived','0.01s')}

for category,records in groups.items():
    for r in records:
        actual = next(p for p in pages if p['slug']==r['slug'])['tables'][1][1:]
        expected = {v[0].lower().replace(' ','-'):float(v[2]) for v in actual}
        assert {**classes[category],**r['multiplierOverrides']} == expected, r['slug']
    save('src/data/weapons/'+category.lower()+'.json',records)
save('src/data/multipliers/body-parts.json',body)
save('src/data/multipliers/weapon-classes.json',classes)
save('src/data/multipliers/armor.json',[1,.7,.6,.45])
save('src/data/timing/bolt.json',timings)
save('src/data/timing/normal-observations.json',normal)
save('src/data/patches/weapon-history.json',patches)
save('src/data/metadata.json',{'version':'43.1','retrievedAt':'2026-09-22','referenceUpdatedAt':'2026-09-15','source':source('https://pubgstatistics.com/weapons'),'rounding':'Public base samples have one decimal; raw precision unavailable.','interpolation':'linear within measured range only','health':100})
lines=['# Data sources','', '53 detail pages reviewed. Numeric samples are rounded public observations, not game raw data.','', '| Category | Weapon | Status | Range | Samples | History entries | Source |','|---|---|---|---|---:|---:|---|']
for records in groups.values():
    for r in records:
        lines.append(f"| {r['category']} | {r['name']} | {r['status']} | {r['measuredRange']['min']:g}–{r['measuredRange']['max']:g}m | {len(r['falloff'])} | {sum(p['weaponId']==r['id'] for p in patches)} | [detail]({r['source']['sourceUrl']}) |")
lines += ['', '## Shared rules', '', 'Armor and hit areas: https://pubgstatistics.com/weapons . Class multipliers verified against all 53 body tables. Dragunov overrides are explicit. Bolt and Normal timing are derived from browser observations described in reference-analysis.md. Normal single-shot intervals use observed TTK / (HTK − 1), preserving the rounding limitation. Burst Normal boundary interval is inferred from the recorded multi-burst TTK and public RPM-derived internal interval; it is an approximation, not a verified engine rule.', '', 'Patch records contain factual type/direction/numeric figures, plus official links. Descriptive prose and assets were not copied. History is a reference index, not an exhaustive independently audited archive. RPD muzzle velocity 735m/s is from its introduction entry; no other unverified muzzle values are filled.']
save('docs/dataset-summary.json',{'weapons':sum(map(len,groups.values())),'patchRecords':len(patches),'categories':{k:len(v) for k,v in groups.items()}})
(ROOT/'docs/data-sources.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print('Built', sum(map(len,groups.values())), 'weapons and',len(patches),'patch records')
