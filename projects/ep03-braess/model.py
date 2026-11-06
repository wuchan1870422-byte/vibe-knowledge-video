"""用户指定的单向4000车辆模型；每条可变道路各自计算自己的流量。"""
from fractions import Fraction

def state(upper,lower,shortcut,open_link=True):
    assert upper>=0 and lower>=0 and shortcut>=0
    assert upper+lower+shortcut==4000
    assert open_link or shortcut==0
    flows={'SA':upper+shortcut,'AT':upper,'SB':lower,'BT':lower+shortcut,'AB':shortcut}
    times={'SA':Fraction(flows['SA'],100),'AT':Fraction(45),'SB':Fraction(45),'BT':Fraction(flows['BT'],100),'AB':Fraction(0)}
    costs={'upper':times['SA']+times['AT'],'lower':times['SB']+times['BT'],'shortcut':times['SA']+times['AB']+times['BT'] if open_link else None}
    return {'shortcut_available':open_link,'route_flows':{'upper':upper,'lower':lower,'shortcut':shortcut},'edge_flows':flows,'edge_times':times,'route_costs':costs}

def symmetric(n):
    assert n%2==0
    return state((4000-n)//2,(4000-n)//2,n)

if __name__=='__main__':
    import json
    from pathlib import Path
    before=state(2000,2000,0,open_link=False)
    assert before['route_costs']['upper']==before['route_costs']['lower']==65
    near=state(1990,1990,20)
    assert near['route_costs']['shortcut']==Fraction(201,5) # 40.2，约40，仅为刚开放附近。
    final=state(0,0,4000)
    assert final['route_costs']['shortcut']==80
    assert final['route_costs']['upper']==final['route_costs']['lower']==85
    # 独立道路的计算不能偷用同一个x；不对称分配检验。
    asymmetric=state(500,1500,2000)
    assert asymmetric['edge_times']['SA']==25 and asymmetric['edge_times']['BT']==35
    # 一个驾驶者的实际单边偏离，而不是同时重分配全体车辆。
    assert state(1,0,3999)['route_costs']['upper']==85
    assert state(0,1,3999)['route_costs']['lower']==85
    assert state(1999,2001,0)['route_costs']['lower']==Fraction(6501,100)
    for n in range(0,4001,2):
        s=symmetric(n)
        assert s['edge_flows']['SA']+s['edge_flows']['SB']==4000
        assert s['edge_flows']['AT']+s['edge_flows']['BT']==4000
        assert s['route_costs']['shortcut']<s['route_costs']['upper']
        assert s['route_costs']['shortcut']<s['route_costs']['lower']
    report={'checks':'passed','demand':4000,'before':before,'near_opening':near,'all_shortcut':final,'asymmetric_check':asymmetric,'migration_states_checked':2001,'particle_scale':'1 glyph ≈ 50 cars; migration is illustrative'}
    report=json.loads(json.dumps(report,default=float))
    Path(__file__).with_name('model_checks.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
    print(json.dumps(report,ensure_ascii=False,indent=2))
