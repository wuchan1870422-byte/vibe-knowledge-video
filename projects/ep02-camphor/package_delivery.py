"""私有交付包：完整源代码/离线资产；原件不推送公共Git。"""
from pathlib import Path
import zipfile,shutil,json,hashlib
R=Path(__file__).resolve().parent;REPO=R.parents[1]
OUT=Path('/workspace/deliveries/ep02');OUT.mkdir(parents=True,exist_ok=True)
shutil.copy2(R/'delivery/final.mp4',OUT/'ep02-camphor-final.mp4')
shutil.copy2(R/'review/final_frames/019.00.jpg',OUT/'ep02-camphor-preview.jpg')
shutil.copy2(R/'review/QUALITY_REPORT.md',OUT/'ep02-quality-report.md')
shutil.copy2(R/'review/final_sheet.jpg',OUT/'ep02-keyframes.jpg')
with zipfile.ZipFile(OUT/'ep02-camphor-source.zip','w',compression=zipfile.ZIP_DEFLATED,compresslevel=5) as z:
 for f in R.rglob('*'):
  if not f.is_file():continue
  rel=f.relative_to(R)
  if rel.parts[0] in {'render','delivery'}:continue
  if rel.parts[0]=='review' and rel.suffix not in {'.md','.json'}:continue
  if rel.parts[0]=='review' and len(rel.parts)>2:continue
  if rel.parts[0]=='research' and rel.name!='NOTES.md':continue
  if rel.parts[0]=='audio' and rel.suffix in {'.wav','.m4a','.log'}:continue
  if '__pycache__' in rel.parts:continue
  z.write(f,'vibe-knowledge-video/projects/ep02-camphor/'+rel.as_posix())
 for name in ['AGENTS.md','VIDEO_STYLE.md','SKILL.md','LICENSE','assets/template.html','assets/audio/default_bgm/README.md','assets/audio/default_bgm/We_Never_Remix_0.9x_开智小曲.mp3','scripts/qa_check.py','references/quality-gate.md','references/visualization-design.md']:
  z.write(REPO/name,'vibe-knowledge-video/'+name)
with zipfile.ZipFile(OUT/'ep02-audio-stems.zip','w',compression=zipfile.ZIP_DEFLATED,compresslevel=4) as z:
 for name in ['bgm_edit.wav','sfx.wav','final_mix.wav','final_mix.m4a','audio_analysis.md','analysis.json','events.json','beat_map.csv','sfx_events.json']:
  z.write(R/'audio'/name,name)
# 独立无声画面保留给后续重混，不依赖用户提取音轨。
shutil.copy2(R/'render/picture.mp4',OUT/'ep02-picture-only.mp4')
manifest={}
for name in ['ep02-camphor-final.mp4','ep02-camphor-source.zip','ep02-audio-stems.zip','ep02-picture-only.mp4','ep02-quality-report.md','ep02-keyframes.jpg']:
 p=OUT/name;manifest[name]={'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
(OUT/'ep02-manifest.json').write_text(json.dumps(manifest,indent=2))
for name in ['ep02-camphor-source.zip','ep02-audio-stems.zip']:
 with zipfile.ZipFile(OUT/name) as z:assert z.testzip() is None
print(json.dumps(manifest,indent=2))
