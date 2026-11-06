"""单条规则的独立局部实验；固定步长积分，箭头直接读取速度或实际加速度。"""
from pathlib import Path
import json,numpy as np
R=Path(__file__).resolve().parent
def cap(v,m):
 n=np.linalg.norm(v,axis=-1,keepdims=True)
 return v*np.minimum(1,m/np.maximum(n,1e-9))
def demo(kind,n,seconds=13):
 if kind=='separation':
  p=np.array([[-4.,.6,0],[4.,-.6,0]])
  v=np.array([[.95,0,0],[-.95,0,0]])
  radius=4.;limit=2.6
 elif kind=='alignment':
  p=np.array([[x,0,z] for x in [-6.,0.,6.] for z in [-3.,3.]])
  theta=np.array([-.65,.55,.1,-.4,.8,-.18])
  v=np.stack([np.cos(theta)*2,np.zeros(n),np.sin(theta)*2],axis=1)
  radius=22.;limit=3.
 else:
  theta=np.arange(n)*2*np.pi/n
  p=np.stack([np.cos(theta)*7,np.zeros(n),np.sin(theta)*5.5],axis=1)
  v=np.stack([np.cos(theta)*.12,np.zeros(n),np.sin(theta)*.12],axis=1)
  radius=17.;limit=1.5
 out=[];min_dist=1e9
 for k in range(seconds*60+1):
  acc=np.zeros_like(p);neighbors=[];centers=[]
  for i in range(n):
   d=np.linalg.norm(p-p[i],axis=1);ids=np.flatnonzero((d<radius)&(d>1e-7)).tolist();neighbors.append(ids)
   center=p[ids].mean(axis=0) if ids else p[i];centers.append(center.tolist())
   if not ids:continue
   if kind=='separation':
    acc[i]=sum((p[i]-p[j])/d[j]*(1-d[j]/radius)*3.2 for j in ids)
   elif kind=='alignment':acc[i]=(v[ids].mean(axis=0)-v[i])*.62
   else:
    direction=center-p[i];direction/=max(np.linalg.norm(direction),1e-9)
    acc[i]=(direction*.28-v[i])*.65
  acc=cap(acc,2.)
  if k%2==0:out.append({'p':p.round(5).tolist(),'v':v.round(5).tolist(),'a':acc.round(5).tolist(),'neighbors':neighbors,'centers':centers})
  d=np.linalg.norm(p[:,None]-p[None,:],axis=-1)+np.eye(n)*1e6;min_dist=min(min_dist,float(d.min()))
  nv=cap(v+acc/60,limit);p+=(v+nv)/120;v=nv
 return {'kind':kind,'count':n,'fps':30,'step_hz':60,'radius':radius,'frames':out,'min_pair_distance':min_dist,'single_rule':True}
if __name__=='__main__':
 data={k:demo(k,n) for k,n in [('separation',2),('alignment',6),('cohesion',9)]}
 assert data['separation']['min_pair_distance']>1.1
 first=np.array(data['alignment']['frames'][0]['v']);last=np.array(data['alignment']['frames'][-1]['v'])
 assert np.var(last,axis=0).sum()<np.var(first,axis=0).sum()*.01
 # 讲解只用前10秒，个体尚未汇聚到同一点。
 assert data['cohesion']['min_pair_distance']>.7
 (R/'demos.json').write_text(json.dumps(data,separators=(',',':'))+'\n')
 print({k:{'n':v['count'],'min_distance':v['min_pair_distance']} for k,v in data.items()})
