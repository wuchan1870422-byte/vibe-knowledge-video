"""最终成片解码电平、连续性与波形；不声称代替真人试听。"""
from pathlib import Path
import subprocess,json
import numpy as np
from PIL import Image,ImageDraw
R=Path(__file__).resolve().parent;sr=12000
raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(R/'delivery/final.mp4'),'-vn','-ar',str(sr),'-ac','1','-f','f32le','-'])
x=np.frombuffer(raw,np.float32)
def rms_db(v):return float(20*np.log10(max(np.sqrt(np.mean(v*v)),1e-10)))
blocks=x[:len(x)//120*120].reshape(-1,120)
peaks=np.max(abs(blocks),axis=1);rms=np.sqrt(np.mean(blocks*blocks,axis=1))
seconds=[rms_db(x[k*sr:(k+1)*sr]) for k in range(118)]
assert len(x)/sr>=118
assert np.max(abs(x))<.999
assert all(v>-55 for v in seconds[3:114]),'unexpected silent second'
report={'source':'decoded final.mp4 mono fold-down at 12kHz','first_8s_rms_dbfs':rms_db(x[:8*sr]),'seconds_32_to_110_rms_dbfs':rms_db(x[32*sr:110*sr]),'sample_peak':float(np.max(abs(x))),'samples_over_0_995':int(np.sum(abs(x)>.995)),'one_second_rms_dbfs':seconds,'human_listening_verified':False}
(R/'review/audio_levels.json').write_text(json.dumps(report,indent=2)+'\n')
im=Image.new('RGB',(1600,500),'#06090e');d=ImageDraw.Draw(im)
d.text((35,15),'Final MP4 decoded waveform / 10ms peak (gold) and RMS (ivory)',fill='#ede4d3')
for db in [-6,-12,-24,-36,-48]:
 y=440-(db+60)/60*400
 d.line((35,y,1565,y),fill='#26303b');d.text((35,y+3),str(db)+' dBFS reference',fill='#8d9197')
for i in range(1530):
 a=int(i*len(peaks)/1530);b=max(a+1,int((i+1)*len(peaks)/1530))
 p=float(peaks[a:b].max());r=float(rms[a:b].mean())
 def yy(v):return 440-max(0,min(400,(20*np.log10(max(v,1e-6))+60)/60*400))
 d.line((35+i,440,35+i,yy(p)),fill='#c9a96a');d.point((35+i,yy(r)),fill='#ede4d3')
for t in range(0,119,10):d.text((35+t/118*1530,463),str(t)+'s',fill='#ede4d3')
im.save(R/'review/audio_waveform.jpg',quality=94)
print(json.dumps({k:v for k,v in report.items() if k!='one_second_rms_dbfs'},indent=2))
