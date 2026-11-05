"""确定性的波面法线/镜面反射纹理：视觉素材，不代表流场的实验计算。"""
from pathlib import Path
import numpy as np
from PIL import Image
R=Path(__file__).resolve().parent/'water';R.mkdir(exist_ok=True)
w,h=800,300
y,x=np.mgrid[0:h,0:w];x=x/w*12;y=y/h*7
for frame in range(72):
 t=frame/72*2*np.pi
 nx=np.zeros_like(x);ny=np.zeros_like(y)
 for k,(a,b,freq,amp) in enumerate([(1,.25,3,.75),(.3,1,5,.42),(.8,-.5,7,.22),(.2,.8,13,.11),(-.5,.3,21,.06)]):
  phase=(x*a+y*b)*freq+t*(k%3+1)+k*2.1
  nx+=np.cos(phase)*a*amp;ny+=np.cos(phase)*b*amp
 n=np.sqrt(nx*nx+ny*ny+9)
 spec=np.maximum(0,(nx*.35+ny*.65+3*.8)/n)**28
 broad=np.maximum(0,(nx*.15+ny*.3+3*.91)/n)**5
 fall=np.exp(-((x-6)**2/15+(y-3.5)**2/5))
 v=(spec*.75+broad*.035)*fall
 rgb=np.stack([4+v*95,8+v*112,13+v*117],axis=-1).clip(0,255).astype('uint8')
 Image.fromarray(rgb).save(R/f'{frame:03d}.jpg',quality=93)
print('prepared water textures',72)
