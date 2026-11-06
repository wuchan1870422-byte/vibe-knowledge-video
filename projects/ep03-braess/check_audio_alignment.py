"""通过与指定原曲的相关性核查最终音轨时间映射，不替代真人试听。"""
from pathlib import Path
import subprocess,json,numpy as np
from scipy import signal
R=Path(__file__).resolve().parent;SR=8000
music=R.parents[1]/'assets/audio/default_bgm/We_Never_Remix_0.9x_开智小曲.mp3'
final=R/'delivery/final.mp4'
def decode(p):
 return np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(p),'-ar',str(SR),'-ac','1','-f','f32le','-']),np.float32)
s=decode(music);f=decode(final);out=[]
for t in [5,20,40,60,80,100,110]:
 k=t*SR;n=SR*2;a=f[k:k+n];b=s[(t+0)*SR-800:(t+0)*SR+n+800]
 corr=signal.correlate(b,a,mode='valid',method='fft');j=int(np.argmax(corr));seg=b[j:j+n]
 coeff=float(np.corrcoef(a,seg)[0,1]);offset=(j-800)/SR
 assert coeff>.97,(t,coeff)
 assert abs(offset)<.04,(t,offset)
 out.append({'video_second':t,'source_expected_second':t+0,'correlation':coeff,'time_offset_s':offset})
(R/'review/audio_alignment.json').write_text(json.dumps(out,indent=2));print(json.dumps(out,indent=2))
