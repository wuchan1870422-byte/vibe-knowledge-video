"""交付完整私有工程与不含音乐原件的公开可复现工程包。"""
from pathlib import Path
import zipfile,shutil,json,hashlib,os
R=Path(__file__).resolve().parent;REPO=R.parents[1]
OUT=Path(os.environ.get('VIBE_DELIVERY_DIR','/workspace/deliveries/ep03'));OUT.mkdir(parents=True,exist_ok=True)
files={'ep03-braess-final.mp4':R/'delivery/final.mp4','ep03-cover-portrait.jpg':R/'delivery/cover-portrait.jpg','ep03-cover-portrait.png':R/'delivery/cover-portrait.png','ep03-cover-profile.jpg':R/'delivery/cover-profile.jpg','ep03-quality-report.md':R/'review/QUALITY_REPORT.md','ep03-keyframes.jpg':R/'review/final_sheet.jpg','ep03-picture-only.mp4':R/'render/picture.mp4'}
for name,src in files.items():shutil.copy2(src,OUT/name)
source=OUT/'ep03-braess-source.zip'
with zipfile.ZipFile(source,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=5) as z:
 for f in R.rglob('*'):
  if not f.is_file():continue
  rel=f.relative_to(R)
  if rel.parts[0] in {'render','delivery'}:continue
  if '__pycache__' in rel.parts:continue
  if rel.parts[0]=='review' and (len(rel.parts)>2 or rel.suffix not in {'.md','.json','.jpg','.log'}):continue
  if rel.parts[0]=='audio' and rel.suffix in {'.wav','.m4a','.tmp'}:continue
  z.write(f,'vibe-knowledge-video/projects/ep03-braess/'+rel.as_posix())
 for name in ['AGENTS.md','VIDEO_STYLE.md','SKILL.md','LICENSE','assets/template.html','assets/audio/default_bgm/README.md','assets/audio/default_bgm/We_Never_Remix_0.9x_开智小曲.mp3','scripts/qa_check.py','references/quality-gate.md']:
  z.write(REPO/name,'vibe-knowledge-video/'+name)
 for name in ['cover-portrait.png','cover-portrait.jpg','cover-profile.jpg']:
  z.write(R/'delivery'/name,'vibe-knowledge-video/projects/ep03-braess/delivery/'+name)
with zipfile.ZipFile(source) as src,zipfile.ZipFile(R/'delivery/source.zip','w',compression=zipfile.ZIP_DEFLATED,compresslevel=5) as dst:
 for n in src.namelist():
  if not n.lower().endswith('.mp3'):dst.writestr(n,src.read(n))
with zipfile.ZipFile(OUT/'ep03-audio-stems.zip','w',compression=zipfile.ZIP_DEFLATED,compresslevel=4) as z:
 for name in ['bgm_edit.wav','sfx.wav','final_mix.wav','final_mix.m4a','audio_analysis.md','analysis.json','events.json','beat_map.csv']:
  z.write(R/'audio'/name,name)
for p in [source,R/'delivery/source.zip',OUT/'ep03-audio-stems.zip']:
 with zipfile.ZipFile(p) as z:assert z.testzip() is None
manifest={}
for p in OUT.iterdir():
 if p.is_file() and p.suffix!='.json':manifest[p.name]={'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
(OUT/'ep03-manifest.json').write_text(json.dumps(manifest,indent=2))
print(json.dumps(manifest,indent=2))
