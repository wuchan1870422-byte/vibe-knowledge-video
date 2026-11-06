"""复核已缓存的双精度模型；不修改渲染正在读取的数据。"""
from pathlib import Path
from decimal import Decimal
import hashlib,json,importlib.util
import numpy as np
from scipy.integrate import solve_ivp
R=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('lorenz_integrate',R/'sim/integrate.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
m=json.loads((R/'sim/meta.json').read_text());h=m['step'];a=np.fromfile(R/'sim/A.bin',np.float64).reshape(-1,3);b=np.fromfile(R/'sim/B.bin',np.float64).reshape(-1,3);repeat=np.fromfile(R/'sim/repeat_A.bin',np.float64).reshape(-1,3);d=np.fromfile(R/'sim/distance.bin',np.float64)
assert h==.005 and m['end_model_time']>=60 and m['samples']==len(a)==len(b)
assert a.dtype==b.dtype==np.dtype('float64')
assert a[0].tolist()==[1,1,1] and b[0].tolist()==[1.000001,1,1]
assert Decimal('1.000001')-Decimal('1.000000')==Decimal('.000001')
assert m['parameters']=={'sigma':10,'rho':28,'beta':8/3}
assert not m['random_perturbations']
assert np.array_equal(d,np.linalg.norm(a-b,axis=1))
assert np.array_equal(repeat,a[:len(repeat)])
assert np.array_equal(module.rk4((1.,1.,1.),h,5.),a[:1001])
assert np.isfinite(a).all() and np.isfinite(b).all()
assert np.sum(np.diff(d[:12001])<0)>100 and max(d)<100
assert all(np.isclose(r['first_distance_1'],25.2,atol=.03) for r in m['refinements'])
assert all(r>10 for r in m['short_time_error_reduction_factors'])
for name,value in m['sha256'].items():assert hashlib.sha256((R/'sim'/name).read_bytes()).hexdigest()==value
refa=solve_ivp(lambda t,p:module.field(p),(0,15),(1.,1.,1.),method='DOP853',rtol=2e-13,atol=2e-14,dense_output=True)
refb=solve_ivp(lambda t,p:module.field(p),(0,15),(1.000001,1.,1.),method='DOP853',rtol=2e-13,atol=2e-14,dense_output=True)
rows=[]
for t in [1,5,10,15]:
 reference=float(np.linalg.norm(refa.sol(t)-refb.sol(t)));value=float(d[round(t/h)]);relative=abs(value-reference)/reference
 assert relative<.0001
 rows.append({'model_time':t,'rk4_distance':value,'reference_distance':reference,'relative_difference':relative})
(R/'review/short_distance_reference.json').write_text(json.dumps(rows,indent=2)+'\n')
report={'passed':True,'precision':'float64','step':h,'model_time_end':m['end_model_time'],'same_initial_repeat_exact':True,'all_distance_samples_match_states':True,'all_binary_sha256_match':True,'short_state_convergence_factors':m['short_time_error_reduction_factors'],'short_distance_reference_max_relative_error':max(r['relative_difference'] for r in rows),'first_distance_at_least_1':m['primary_first60']['first_distance_1'],'distance_not_monotone':True,'no_added_randomness':True,'long_time_pointwise_agreement_not_assumed':True}
(R/'review/model_validation.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
