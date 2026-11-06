"""双精度RK4：两个初态、同方程、同参数，无随机项；独立复算与步长复核。"""
from pathlib import Path
from decimal import Decimal
import json,hashlib,numpy as np
from scipy.integrate import solve_ivp
R=Path(__file__).resolve().parent
A0=(1.,1.,1.);B0=(1.000001,1.,1.)
def field(p):
 x,y,z=p
 return 10.*(y-x),x*(28.-z)-y,x*y-(8./3.)*z
def rk4(initial,h,end):
 n=round(end/h);out=np.empty((n+1,3),dtype=np.float64);out[0]=initial;p=tuple(initial)
 for i in range(n):
  k1=field(p);k2=field(tuple(p[j]+h*.5*k1[j] for j in range(3)));k3=field(tuple(p[j]+h*.5*k2[j] for j in range(3)));k4=field(tuple(p[j]+h*k3[j] for j in range(3)))
  p=tuple(p[j]+h/6*(k1[j]+2*k2[j]+2*k3[j]+k4[j]) for j in range(3));out[i+1]=p
 return out
def first_cross(d,h,threshold):
 found=np.flatnonzero(d>=threshold)
 return float(found[0]*h) if len(found) else None
def summarize(a,b,h):
 d=np.linalg.norm(a-b,axis=1)
 return {'first_distance_0_01':first_cross(d,h,.01),'first_distance_1':first_cross(d,h,1.),'first_distance_10':first_cross(d,h,10.),'maximum_distance':float(d.max()),'distance_decreases':int(np.sum(np.diff(d)<0)),'bounds_A':[a.min(axis=0).tolist(),a.max(axis=0).tolist()],'bounds_B':[b.min(axis=0).tolist(),b.max(axis=0).tolist()]}
if __name__=='__main__':
 h=.005;end=240.;a=rk4(A0,h,end);b=rk4(B0,h,end);again=rk4(A0,h,60.)
 assert np.array_equal(a[:len(again)],again)
 assert Decimal('1.000001')-Decimal('1.000000')==Decimal('0.000001')
 assert abs((B0[0]-A0[0])-1e-6)<1e-15
 assert np.isfinite(a).all() and np.isfinite(b).all()
 d=np.linalg.norm(a-b,axis=1);d.tofile(R/'distance.bin');a.tofile(R/'A.bin');b.tofile(R/'B.bin');again.tofile(R/'repeat_A.bin')
 refinements=[]
 ref=solve_ivp(lambda t,p:field(p),[0,15],A0,method='DOP853',rtol=2e-13,atol=2e-14,dense_output=True)
 errors=[]
 for step in [.005,.0025,.00125]:
  aa=a[:round(60/step)+1] if step==h else rk4(A0,step,60.)
  bb=b[:round(60/step)+1] if step==h else rk4(B0,step,60.)
  item=summarize(aa,bb,step);item['step']=step;item['short_time_errors_against_DOP853']={str(t):float(np.linalg.norm(aa[round(t/step)]-ref.sol(t))) for t in [1,5,10,15]};refinements.append(item);errors.append(item['short_time_errors_against_DOP853']['10'])
 assert errors[1]<errors[0]/10 and errors[2]<errors[1]/10
 assert all(r['first_distance_1'] is not None and r['distance_decreases']>100 for r in refinements)
 assert all(r['maximum_distance']<100 for r in refinements)
 # 选择较长历史中实际位于不同翼的时刻作为空间穿越起点，未指定或构造换翼。
 indices=np.arange(round(140/h),round(220/h),100)
 possible=[int(i) for i in indices if a[i,0]*b[i,0]<0 and d[i]>25 and 18<a[i,2]<38]
 assert possible
 # 在实际数据中选一段后续速度适中、空间跨度充足的窗口。
 score=lambda i:np.linalg.norm(a[i+400]-a[i])+min(d[i],40)*.1
 chosen=max(possible,key=score);long_start=float(chosen*h)
 report={'initial_A':A0,'initial_B':B0,'exact_decimal_delta_x':'0.000001','dtype':'float64','integrator':'classical RK4','step':h,'end_model_time':end,'samples':len(a),'parameters':{'sigma':10,'rho':28,'beta':8/3},'random_perturbations':False,'same_initial_repeat_bitwise_identical':True,'repeat_maximum_error':float(np.max(abs(a[:len(again)]-again))),'primary_first60':refinements[0],'refinements':refinements,'short_time_error_reduction_factors':[errors[0]/errors[1],errors[1]/errors[2]],'long_start':long_start,'long_start_A':a[chosen].tolist(),'long_start_B':b[chosen].tolist(),'long_start_distance':float(d[chosen]),'long_end':long_start+6.5,'global_distance_max':float(d.max()),'global_bounds':[np.minimum(a.min(axis=0),b.min(axis=0)).tolist(),np.maximum(a.max(axis=0),b.max(axis=0)).tolist()]}
 report['sha256']={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in R.glob('*.bin')}
 (R/'meta.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
