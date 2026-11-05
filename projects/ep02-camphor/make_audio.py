"""固定原曲连续裁剪 + 原创物理启发短音效；不合成替代BGM。"""
from pathlib import Path
import numpy as np
from scipy import signal
import subprocess,json,wave
R=Path(__file__).resolve().parent;SR=48000;N=125*SR
MUSIC=R.parents[1]/'assets/audio/default_bgm/We_Never_Remix_0.9x_开智小曲.mp3'
a=json.loads((R/'audio/analysis.json').read_text());events=json.loads((R/'audio/events.json').read_text())
rng=np.random.default_rng(20261105)
def wav(path,x):
 with wave.open(str(path),'wb') as w:
  w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((np.clip(x,-.999,.999)*32767).astype('<i2').tobytes())
cmd=['ffmpeg','-y','-v','error','-ss',str(a['source_in_s']),'-i',str(MUSIC),'-t','125','-ar',str(SR),'-ac','2','-af','afade=t=in:d=1.4,afade=t=out:st=121.8:d=3.2',str(R/'audio/bgm_edit.wav')]
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
for at,g,p in [(events['launch'],.07,-.2),(events['release'],.055,-.35),(events['field'],.045,0),(events['marangoni'],.055,-.1),(events['accelerate'],.065,.25),(events['energy'],.045,0)]:add(at,drop(),g,p,'droplet resonance')
for at,g,p in [(10.0,.035,0),(29.7,.025,-.1),(55.5,.035,-.2),(75.0,.055,.2),(99.7,.03,0)]:add(at,wash(),g,p,'water movement')
t=np.arange(int(.16*SR))/SR;tap=(np.sin(2*np.pi*2100*t)+.4*np.sin(2*np.pi*3170*t))*np.exp(-t*60)*np.minimum(1000*t,1)
add(69.9,tap,.024,.15,'quiet contact click')
wav(R/'audio/sfx.wav',sfx)
(R/'audio/sfx_events.json').write_text(json.dumps(log,indent=2))
# 交付独立音效轨及BGM接口，即使换素材也无需重渲画面。
subprocess.run(['ffmpeg','-y','-v','error','-i',str(R/'audio/bgm_edit.wav'),'-i',str(R/'audio/sfx.wav'),'-filter_complex','[0:a]volume=0.74[a];[a][1:a]amix=inputs=2:normalize=0:duration=first[m]','-map','[m]','-c:a','pcm_s24le',str(R/'audio/mix_raw.wav')],check=True)
measure=subprocess.run(['ffmpeg','-hide_banner','-i',str(R/'audio/mix_raw.wav'),'-af','loudnorm=I=-14:TP=-1.2:LRA=11:print_format=json','-f','null','-'],capture_output=True,text=True,check=True).stderr
m=json.JSONDecoder().raw_decode(measure[measure.rfind('{'):])[0];(R/'audio/loudnorm_measurement.json').write_text(json.dumps(m,indent=2))
filt=f"loudnorm=I=-14:TP=-1.2:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true:print_format=json"
subprocess.run(['ffmpeg','-y','-v','error','-i',str(R/'audio/mix_raw.wav'),'-af',filt,'-ar',str(SR),'-c:a','pcm_s24le',str(R/'audio/final_mix.wav')],check=True)
subprocess.run(['ffmpeg','-y','-v','error','-i',str(R/'audio/final_mix.wav'),'-c:a','aac','-b:a','256k',str(R/'audio/final_mix.m4a')],check=True)
print('audio prepared; original speed 1.0; source 48–173s; independent BGM and SFX stems')
