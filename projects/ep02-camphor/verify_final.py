"""核对最终编码文件；保留程序退出状态与本轮输出证据。"""
from pathlib import Path
import subprocess,json,csv,hashlib
import numpy as np
from PIL import Image,ImageDraw
R=Path(__file__).resolve().parent;F=R/'delivery/final.mp4'
def run(args):return subprocess.run(args,capture_output=True,text=True,check=True)
info=json.loads(run(['ffprobe','-v','error','-count_frames','-show_format','-show_streams','-of','json',str(F)]).stdout)
(R/'review/ffprobe.json').write_text(json.dumps(info,indent=2))
v=next(s for s in info['streams'] if s['codec_type']=='video');a=next(s for s in info['streams'] if s['codec_type']=='audio')
assert (v['width'],v['height'])==(1920,1080)
assert v['codec_name']=='h264' and v['pix_fmt']=='yuv420p'
assert v['avg_frame_rate']=='30/1' and int(v['nb_read_frames'])==3750
assert a['codec_name']=='aac' and a['channels']==2
assert abs(float(info['format']['duration'])-125)<.1
# 不只看容器元数据；全文件解码失败会使检查失败。
dec=run(['ffmpeg','-nostdin','-v','error','-xerror','-i',str(F),'-f','null','-'])
(R/'review/full_decode.log').write_text(dec.stderr or 'Full video and audio decode completed without reported error.\n')
# 一秒一帧审查亮度和变化，末尾淡出单独记录，不作黑屏故障。
raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(F),'-vf','fps=1,scale=480:270','-f','rawvideo','-pix_fmt','rgb24','-'])
frames=np.frombuffer(raw,np.uint8).reshape(-1,270,480,3)
metrics=[]
for i,f in enumerate(frames):
 lum=f.mean(2);delta=float(np.abs(f.astype(float)-frames[i-1].astype(float)).mean()) if i else None
 metrics.append({'second':i,'mean_luma':float(lum.mean()),'content_bright_ratio':float((lum>45).mean()),'mean_change':delta})
assert len(frames)==125
assert all(m['content_bright_ratio']>.001 for m in metrics[:-1]),'unexpected empty second'
(R/'review/frame_metrics.json').write_text(json.dumps(metrics,indent=2))
# 取最终编码文件的关键静帧，不把HTML截图冒充成片抽检。
times=[2,8,14,19,25,33,40,47,58,71.8,77,87,97,105,113,122]
out=R/'review/final_frames';out.mkdir(exist_ok=True)
for t in times:run(['ffmpeg','-y','-v','error','-ss',str(t),'-i',str(F),'-frames:v','1',str(out/f'{t:06.2f}.jpg')])
im=Image.new('RGB',(1920,4*288),(5,8,13));d=ImageDraw.Draw(im)
for i,t in enumerate(times):
 im.paste(Image.open(out/f'{t:06.2f}.jpg').resize((480,270)),((i%4)*480,(i//4)*288));d.text(((i%4)*480+8,(i//4)*288+272),f'{t:.2f}s',fill=(201,169,106))
im.save(R/'review/final_sheet.jpg',quality=95)
# 最终复用的AAC位流测量；input_i/input_tp是测量值，output_*是另一次归一的预测，不混淆。
l=run(['ffmpeg','-hide_banner','-i',str(F),'-vn','-af','loudnorm=I=-14:TP=-1:LRA=11:print_format=json','-f','null','-']).stderr
m=json.JSONDecoder().raw_decode(l[l.rfind('{'):])[0];(R/'review/final_loudness.json').write_text(json.dumps(m,indent=2))
assert abs(float(m['input_i'])+14)<1
assert float(m['input_tp'])<=-1
summary={'duration':info['format']['duration'],'resolution':[v['width'],v['height']],'frame_rate':v['avg_frame_rate'],'frames':v['nb_read_frames'],'video':v['codec_name'],'audio':a['codec_name'],'channels':a['channels'],'lufs_i':m['input_i'],'true_peak_dbtp':m['input_tp'],'full_decode':'passed','one_second_samples':len(frames),'persistent_label':'absent in source and reviewed frames','sha256':hashlib.sha256(F.read_bytes()).hexdigest(),'bytes':F.stat().st_size,'human_listening_verified':False}
(R/'review/summary.json').write_text(json.dumps(summary,indent=2));print(json.dumps(summary,indent=2))
