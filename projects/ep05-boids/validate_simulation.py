"""独立核对计算回放、局部邻居和连续性。图形中的羽翼不是刚体求解器。"""
from pathlib import Path
import json,hashlib,numpy as np
from scipy.spatial import cKDTree
R=Path(__file__).resolve().parent;S=R/'sim'
m=json.loads((S/'meta.json').read_text());n=m['count']
a=np.fromfile(S/'replay.bin',dtype='<i2').reshape(m['cache_frames'],n,7)
f=np.fromfile(S/'focus.bin',dtype='<f4').reshape(m['focus_frames'],17,8)
assert n==3200 and m['step_hz']==60 and m['seed']==20261107
assert np.all(f[:,0,0]==m['focus_id'])
dist=np.linalg.norm(f[:,1:,1:4]-f[:,:1,1:4],axis=-1)
valid=f[:,1:,0]>=0
assert np.max(dist[valid])<=m['neighbor_radius']+.0001
for frame in f:
 ids=frame[frame[:,0]>=0,0].astype(int)
 assert len(ids)==len(set(ids)) and np.all((ids>=0)&(ids<n))
p=a[:,:,:3].astype(np.float32)/128;v=a[:,:,3:6].astype(np.float32)/1024
speed=np.linalg.norm(v,axis=-1)
assert speed.min()>6.498 and speed.max()<11.502
maximum_displacement=float(np.linalg.norm(np.diff(p,axis=0),axis=-1).max())
assert maximum_displacement<11.5/m['cache_hz']+.03
assert np.linalg.norm(np.diff(v,axis=0),axis=-1).max()<m['max_acceleration']/m['cache_hz']+.01
assert m['observed_max_turn_rad_s']<=.90001 and m['observed_max_acceleration']<=12.001
assert not m['global_goal'] and not m['predefined_agent_trajectories']
near_min={}
for start,end in [(12,28),(65,72)]:
 d=dist[start*60:end*60];mask=valid[start*60:end*60];near_min[f'{start}-{end}s']=float(d[mask].min())
assert min(near_min.values())>1.79
# KD树独立检查缓存采样时邻居；缓存量化误差不能被当作新邻居选择。
kd_checks=[]
for t in [12,16,20,24,26,66,68,70,92,96]:
 i=round(t*m['cache_hz']);native=f[t*60];ids=native[1:,0].astype(int);ids=ids[ids>=0]
 d,nearest=cKDTree(p[i]).query(p[i,m['focus_id']],k=17)
 native_d=np.linalg.norm(native[1:1+len(ids),1:4]-native[0,1:4],axis=1)
 assert native_d.max()<=d[-1]+.015
 kd_checks.append({'time_s':t,'same_ids_after_quantization':set(ids)==set(nearest[1:]),'max_native_neighbor_distance':float(native_d.max()),'cache_kth_distance':float(d[-1])})
clearance=1e9
for i in range(len(a)):
 t=i/m['cache_hz']
 if not 88<=t<112:continue
 lift=60*(1-(t-88)/3) if t<91 else 0 if t<106 else min(60,(t-106)*15)
 ob=np.array(m['obstacle_target'])+[0,lift,0]
 clearance=min(clearance,float(np.linalg.norm(p[i]-ob,axis=1).min()-7))
assert clearance>3 and m['minimum_obstacle_surface_distance']>3
assert hashlib.sha256((S/'replay.bin').read_bytes()).hexdigest()==(S/'replay-before-focus.sha256').read_text().strip()
report={'count':n,'integration_hz':60,'cache_hz':m['cache_hz'],'cache_frames':m['cache_frames'],'focus_id':m['focus_id'],'native_focus_minimum_neighbor_distance':near_min,'max_cache_displacement':maximum_displacement,'max_native_neighbor_distance':float(dist[valid].max()),'minimum_cached_sphere_clearance':clearance,'minimum_native_sphere_clearance':m['minimum_obstacle_surface_distance'],'observed_max_acceleration':m['observed_max_acceleration'],'observed_max_turn_rad_s':m['observed_max_turn_rad_s'],'independent_kd_checks':kd_checks,'replay_unchanged_after_focus_selection':True,'replay_sha256':hashlib.sha256((S/'replay.bin').read_bytes()).hexdigest(),'focus_sha256':hashlib.sha256((S/'focus.bin').read_bytes()).hexdigest(),'no_global_goal':True,'fixed_seed':m['seed'],'notes':'Point-agent Boids; wings are visual geometry, not full rigid-body collision. Native obstacle clearance measured at every integration step.'}
(R/'review/simulation_checks.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
