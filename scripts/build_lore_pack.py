"""Original, local, nonexecutable lore example. No downloads or allocation at runtime."""
from pathlib import Path
import json,hashlib
ROOT=Path(__file__).resolve().parents[1]
lore={'title':'Echoes of the Borderlands','entries':[
 {'region_id':'R00','text':'Hearthfield\nThe old road bends around a hearthstone. Its inscription offers no command: rest, eat, and choose a path when morning comes.'},
 {'region_id':'R01','text':'Briarford\nToren keeps the watch beside cottages rebuilt from storm-felled timber. Every repaired shield carries a different traveler’s mark.'},
 {'region_id':'R02','text':'Emberwick\nIra plants bright berries between herb beds. The village remembers winter by the gardens that survived it.'},
 {'region_id':'R03','text':'Mossveil\nWoodcutters leave the oldest pines standing. The moss beneath them records a quieter history than the roads.'},
 {'region_id':'R04','text':'Stormstone\nThe abandoned quarry supplied the crown’s observatory. Its last stone was never carried down the ridge.'},
 {'region_id':'R05','text':'Crownfall\nA broken arch points toward no throne. The royal scribes hid their records among ordinary stones when the banners fell.'},
 {'region_id':'R06','text':'Oathkeeper\nThe grove’s promise was made to living travelers, not kings. A pilgrim may read the runes once; their meaning belongs to memory.'},
 {'region_id':'R07','text':'Moonwell\nDry paths wind between pools that reflect the sky. The forgotten well held maps of journeys that had not yet begun.'}
]}
payload=json.dumps(lore,ensure_ascii=False,separators=(',',':'))
pack={'pack_id':'borderland-echoes','schema_version':1,'game_min_version':1,'content_type':'lore','compressed_bytes':0,'installed_bytes':0,'sha256':hashlib.sha256(payload.encode()).hexdigest(),'dependencies':[],'optional':True,'uninstall':'remove-lore-only','payload':payload}
for _ in range(8):
 raw=json.dumps(pack,ensure_ascii=False,separators=(',',':')).encode();pack['compressed_bytes']=pack['installed_bytes']=len(raw)
raw=json.dumps(pack,ensure_ascii=False,separators=(',',':')).encode();assert len(raw)==pack['installed_bytes']
(ROOT/'content-packs/borderland-echoes.godseed.json').write_bytes(raw)
print('Original optional lore:',len(raw),'bytes; not auto-installed')
