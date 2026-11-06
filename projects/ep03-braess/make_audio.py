"""固定原曲连续裁剪 + 原创物理启发短音效；不合成替代BGM。"""
from pathlib import Path
import numpy as np
from scipy import signal
import subprocess,json,wave
R=Path(__file__).resolve().parent;SR=48000;N=118*SR
MUSIC=R.parents[1]/'assets/audio/default_bgm/We_Never_Remix_0.9x_开智小曲.mp3'
a=json.loads((R/'audio/analysis.json').read_text());events=json.loads((R/'audio/events.json').read_text())
rng=np.random.default_rng(20261105)
def wav(path,x):
 with wave.open(str(path),'wb') as w:
  w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((np.clip(x,-.999,.999)*32767).astype('<i2').tobytes())
cmd=['ffmpeg','-y','-v','error','-ss',str(a['source_in_s']),'-i',str(MUSIC),'-t','118','-ar',str(SR),'-ac','2','-af','afade=t=in:d=1.4,afade=t=out:st=114.8:d=3.2',str(R/'audio/bgm_edit.wav')]
subprocess.run(cmd,check=True)
sfx=np.zeros((N,2),np.float32)
log=[]
def add(at,sound,gain=.1,pan=0,name=''):
 k=round(at*SR);l=min(len(sound),N-k)
 if k<0 or l<=0:return
 sfx[k:k+l,0]+=sound[:l]*gain*np.sqrt((1-pan)/2)
 sfx[k:k+l,1]+=sound[:l]*gain*np.sqrt((1+pan)/2)
 log.append({'time':at,'kind':name,'gain':gain,'pan':pan})
def drop(d=.6):
 t=np.arange(int(d*SR))/SR
 # 滴水短促衰减共振，不是旋律。
 freq=550+1300*np.exp(-t*18);ph=np.cumsum(freq)/SR*2*np.pi
 return (np.sin(ph)*np.exp(-t*15)+.25*np.sin(ph*1.73)*np.exp(-t*22))*np.minimum(t*500,1)
def wash(d=1.2):
 noise=rng.normal(0,1,int(d*SR));b,a=signal.butter(2,[200,2200],fs=SR,btype='bandpass');x=signal.lfilter(b,a,noise);x/=max(np.max(abs(x)),.01)
 return x*np.sin(np.linspace(0,np.pi,len(x)))**2
# 克制的道路开启/切换短提示，无发动机轰鸣，不逐字配音。
for name,gain in [('hook',.025),('split',.022),('open',.038),('migrate',.022),('equilibrium',.032),('close',.036),('name',.028)]:
 t=np.arange(int(.22*SR))/SR
 click=(np.sin(2*np.pi*1100*t)+.3*np.sin(2*np.pi*1900*t))*np.exp(-t*33)*np.minimum(t*700,1)
 add(events[name],click,gain,0,'soft route-switch contact')
for at in [31.0,65.0,83.0,96.4]:add(at,wash(.5),.018,0,'subtle transition air')
wav(R/'audio/sfx.wav',sfx)
(R/'audio/sfx_events.json').write_text(json.dumps(log,indent=2))
# 交付独立音效轨及BGM接口，即使换素材也无需重渲画面。
subprocess.run(['ffmpeg','-y','-v','error','-i',str(R/'audio/bgm_edit.wav'),'-i',str(R/'audio/sfx.wav'),'-filter_complex','[0:a]volume=0.74[a];[a][1:a]amix=inputs=2:normalize=0:duration=first[m]','-map','[m]','-c:a','pcm_s24le',str(R/'audio/mix_raw.wav')],check=True)
measure=subprocess.run(['ffmpeg','-hide_banner','-i',str(R/'audio/mix_raw.wav'),'-af','loudnorm=I=-14:TP=-1.2:LRA=11:print_format=json','-f','null','-'],capture_output=True,text=True,check=True).stderr
m=json.JSONDecoder().raw_decode(measure[measure.rfind('{'):])[0];(R/'audio/loudnorm_measurement.json').write_text(json.dumps(m,indent=2))
filt=f"loudnorm=I=-14:TP=-1.2:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true:print_format=json"
subprocess.run(['ffmpeg','-y','-v','error','-i',str(R/'audio/mix_raw.wav'),'-af',filt,'-ar',str(SR),'-c:a','pcm_s24le',str(R/'audio/final_mix.wav')],check=True)
subprocess.run(['ffmpeg','-y','-v','error','-i',str(R/'audio/final_mix.wav'),'-c:a','aac','-b:a','256k',str(R/'audio/final_mix.m4a')],check=True)
print('audio prepared; original speed 1.0; source 55–173s; independent BGM and SFX stems')
