"""分析用户提供原件；不改变播放速度，不生成主配乐。"""
from pathlib import Path
import numpy as np
from scipy import signal
import subprocess,json,hashlib,csv
ROOT=Path(__file__).resolve().parent
MUSIC=ROOT.parents[1]/'assets/audio/default_bgm/We_Never_Remix_0.9x_开智小曲.mp3'
sr=22050
raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(MUSIC),'-ar',str(sr),'-ac','1','-f','f32le','-'])
x=np.frombuffer(raw,dtype=np.float32)
f,tt,z=signal.stft(x,fs=sr,nperseg=2048,noverlap=1536)
mag=np.abs(z); flux=np.maximum(np.diff(mag,axis=1),0)
# 避免纯低频的持续音掩盖敲击起音
onset=np.sum(flux[(f>40)&(f<8000)],axis=0); t=tt[1:];dt=np.median(np.diff(t))
base=signal.medfilt(onset,43);env=np.maximum(onset-base*.6,0)
ac=signal.fftconvolve(env-env.mean(),(env-env.mean())[::-1],mode='full')[len(env)-1:]
peaks,_=signal.find_peaks(ac)
peaks=[p for p in peaks if 65 < 60/(p*dt)<165]
rank=sorted(peaks,key=lambda p:ac[p],reverse=True)
candidates=[{'bpm':round(60/(p*dt),3),'score':round(float(ac[p]/ac[0]),4)} for p in rank[:8]]
print('tempo candidates',candidates)
# 对连续时间周期进行细网格折叠，避免把量化 lag 当精确 BPM
best=None
for bpm in np.linspace(68,150,3281):
 phase=(t*bpm/60)%1
 bins=np.bincount((phase*160).astype(int),weights=env,minlength=160)
 score=np.max(np.convolve(np.r_[bins[-3:],bins,bins[:3]],np.ones(7),mode='valid'))
 if best is None or score>best[0]:best=(score,float(bpm),int(np.argmax(bins)))
bpm=best[1];period=60/bpm
phase=best[2]/160;offset=phase*period
beats=np.arange(offset,len(x)/sr,period)
# 用局部起音峰检查网格误差；这是计算检查，不声称已人工听辨拍号
pk,_=signal.find_peaks(env,prominence=np.percentile(env,75)*.4,distance=int(.16/dt))
pt=t[pk]; pv=env[pk]
rows=[]
for i,b in enumerate(beats):
 sel=np.where(abs(pt-b)<.13)[0]
 if len(sel):
  k=sel[np.argmax(pv[sel])]; actual=float(pt[k]);strength=float(pv[k]);error=actual-b
 else:actual=float(b);strength=0.;error=None
 rows.append([actual,actual,round(actual*30),i%4+1,'onset candidate',False,strength,error])
with (ROOT/'audio/beat_map.csv').open('w') as file:
 w=csv.writer(file);w.writerow(['source_time_s','video_time_s','frame','beat_in_bar_candidate','event','verified_by_listening','strength','grid_error_s']);w.writerows(rows)
rms=np.sqrt(np.mean(x[:len(x)//sr*sr].reshape(-1,sr)**2,axis=1))
result={'file':str(MUSIC.relative_to(ROOT.parents[1])),'sha256':hashlib.sha256(MUSIC.read_bytes()).hexdigest(),'duration_s':len(x)/sr,'playback_speed':1,'tempo_candidates':candidates,'folded_bpm_estimate':bpm,'first_grid_beat_s':offset,'meter':'4/4 candidate only; not aurally verified','rms_loudest_second':int(np.argmax(rms)),'energy_sections':[{'start_s':i,'rms':round(float(np.mean(rms[i:i+10])),5)} for i in range(0,len(rms),10)],'source_in_s':0,'video_in_s':0,'human_listening_verified':False}
(ROOT/'audio/analysis.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
print(json.dumps(result,ensure_ascii=False,indent=2))
