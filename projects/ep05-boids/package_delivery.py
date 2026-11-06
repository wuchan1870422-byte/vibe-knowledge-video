"""保存实际交付、完整私有源包及不单独分发原曲的公开源包。"""
from pathlib import Path
import zipfile,shutil,json,hashlib,os
R=Path(__file__).resolve().parent;REPO=R.parents[1]
OUT=Path(os.environ.get('VIBE_DELIVERY_DIR','/workspace/deliveries/ep05'));OUT.mkdir(parents=True,exist_ok=True)
files={'ep05-boids-final.mp4':R/'delivery/final.mp4','ep05-cover-portrait.jpg':R/'delivery/cover-portrait.jpg','ep05-cover-portrait.png':R/'delivery/cover-portrait.png','ep05-cover-profile.jpg':R/'delivery/cover-profile.jpg','ep05-quality-report.md':R/'review/QUALITY_REPORT.md','ep05-keyframes.jpg':R/'review/final_sheet.jpg','ep05-picture-only.mp4':R/'render/picture.mp4'}
for name,src in files.items():shutil.copy2(src,OUT/name)
source=OUT/'ep05-boids-source-private.zip'
with zipfile.ZipFile(source,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=5) as z:
 for f in R.rglob('*'):
  if not f.is_file():continue
  rel=f.relative_to(R)
  if rel.parts[0] in {'render','delivery'} or '__pycache__' in rel.parts:continue
  if rel.as_posix()=='sim/boids':continue
  if rel.parts[0]=='review' and (len(rel.parts)>2 or rel.suffix not in {'.md','.json','.jpg','.log'} or rel.name.startswith(('debug-','encoded-','raw-captured','captured-frame','tail-'))):continue
  if rel.parts[0]=='audio' and rel.suffix in {'.wav','.m4a','.tmp'}:continue
  z.write(f,'vibe-knowledge-video/projects/ep05-boids/'+rel.as_posix())
 for name in ['AGENTS.md','VIDEO_STYLE.md','SKILL.md','LICENSE','assets/template.html','assets/audio/default_bgm/README.md','assets/audio/default_bgm/We_Never_Remix_0.9x_开智小曲.mp3','scripts/qa_check.py','references/quality-gate.md']:
  z.write(REPO/name,'vibe-knowledge-video/'+name)
 for name in ['cover-portrait.png','cover-portrait.jpg','cover-profile.jpg']:
  z.write(R/'delivery'/name,'vibe-knowledge-video/projects/ep05-boids/delivery/'+name)
with zipfile.ZipFile(source) as src,zipfile.ZipFile(R/'delivery/source.zip','w',compression=zipfile.ZIP_DEFLATED,compresslevel=5) as dst:
 for name in src.namelist():
  if not name.lower().endswith('.mp3'):dst.writestr(name,src.read(name))
shutil.copy2(R/'delivery/source.zip',OUT/'ep05-boids-source.zip')
with zipfile.ZipFile(OUT/'ep05-audio-stems-private.zip','w',compression=zipfile.ZIP_DEFLATED,compresslevel=4) as z:
 for name in ['bgm_edit.wav','sfx.wav','final_mix.wav','final_mix.m4a','audio_analysis.md','analysis.json','events.json','beat_map.csv','intro_envelope.json','peak_control.json']:
  z.write(R/'audio'/name,name)
for p in [source,R/'delivery/source.zip',OUT/'ep05-audio-stems-private.zip']:
 with zipfile.ZipFile(p) as z:assert z.testzip() is None
with zipfile.ZipFile(R/'delivery/source.zip') as z:
 names=z.namelist();assert not any(n.lower().endswith(('.mp3','.wav','.m4a')) for n in names)
 assert all('vibe-knowledge-video/projects/ep05-boids/'+n in names for n in ['scenes.js','sim/boids.cpp','sim/replay.bin','sim/focus.bin','sim/meta.json','sim/demos.json','fonts/sans.ttc','fonts/sans-bold.ttc','fonts/serif.ttc','fonts/latin-italic.ttf','vendor/three.module.min.js','vendor/LICENSE'])
assert (R/'delivery/source.zip').stat().st_size<100*1024**2
manifest={}
for p in OUT.iterdir():
 if p.is_file() and p.suffix!='.json':manifest[p.name]={'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
(OUT/'ep05-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps(manifest,indent=2))
