"""从仓库已有第五期源包复用字体，不联网下载或重装Skill。"""
from pathlib import Path
import zipfile
R=Path(__file__).resolve().parent
archive=R.parent/'ep05-boids/delivery/source.zip'
with zipfile.ZipFile(archive) as z:
 for name in ['sans.ttc','sans-bold.ttc','serif.ttc','latin-italic.ttf']:
  dst=R/'fonts'/name
  if not dst.exists():
   key='vibe-knowledge-video/projects/ep05-boids/fonts/'+name
   dst.parent.mkdir(exist_ok=True);dst.write_bytes(z.read(key));print('Reused',name)
assert all((R/'fonts'/name).exists() for name in ['sans.ttc','sans-bold.ttc','serif.ttc','latin-italic.ttf'])
