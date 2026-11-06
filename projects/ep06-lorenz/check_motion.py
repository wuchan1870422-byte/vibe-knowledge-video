"""从真正编码的MP4抽取连续镜头，供视觉检查；不是源页面截图。"""
from pathlib import Path
import subprocess,json
from PIL import Image,ImageDraw
R=Path(__file__).resolve().parent;out=R/'review/final_motion';out.mkdir(exist_ok=True)
segments=[(4.5,2,'opening'),(41.2,2,'separation'),(83,3,'entry'),(94,2,'inside'),(101,3,'pullback'),(123,1.9,'ending')]
report=[]
for start,duration,name in segments:
 folder=out/name;folder.mkdir(exist_ok=True)
 subprocess.run(['ffmpeg','-y','-v','error','-ss',str(start),'-i',str(R/'delivery/final.mp4'),'-t',str(duration),'-vf','fps=4,scale=480:270','-q:v','2',str(folder/'%03d.jpg')],check=True)
 files=sorted(folder.glob('*.jpg'));sheet=Image.new('RGB',(1920,288*((len(files)+3)//4)),'#06090e');draw=ImageDraw.Draw(sheet)
 for i,p in enumerate(files):
  x=i%4*480;y=i//4*288;sheet.paste(Image.open(p),(x,y));draw.text((x+8,y+272),f'{name}, approx {start+i/4:.2f}s',fill='#c9a96a')
 sheet.save(out/(name+'.jpg'),quality=95);report.append({'segment':name,'start_s':start,'duration_s':duration,'frames':len(files),'sheet':str((out/(name+'.jpg')).relative_to(R))})
(R/'review/motion_samples.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
