"""教学构造数据：每次出手一个不可混淆ID；命中率而非得分或球技比较。"""
from fractions import Fraction
from decimal import Decimal,ROUND_HALF_UP
from pathlib import Path
import random,json
R=Path(__file__).resolve().parent
GROUPS={('A','near'):(10,9),('A','far'):(100,30),('B','near'):(100,80),('B','far'):(10,2)}
def percent(hits,attempts):
 return (Decimal(hits)*100/Decimal(attempts)).quantize(Decimal('.1'),rounding=ROUND_HALF_UP)
def build():
 records=[];rng=random.Random(20261106)
 for person in ['A','B']:
  index=0
  for source in ['near','far']:
   n,h=GROUPS[person,source];items=[{'id':f'{person}-{source}-{i:03d}','person':person,'source':source,'hit':i<h} for i in range(n)];rng.shuffle(items)
   for i,rec in enumerate(items):rec['groupIndex']=i;rec['personIndex']=index+i
   records.extend(items);index+=n
 return records
if __name__=='__main__':
 records=build();assert len(records)==220 and len({x['id'] for x in records})==220
 report={'source':'user-provided illustrative data, not actual player records','groups':{},'totals':{},'checks':[]}
 for (p,g),(n,h) in GROUPS.items():
  xs=[x for x in records if x['person']==p and x['source']==g];assert len(xs)==n and sum(x['hit'] for x in xs)==h
  report['groups'][p+'_'+g]={'attempts':n,'hits':h,'rate_percent':str(percent(h,n))}
 for p in ['A','B']:
  xs=[x for x in records if x['person']==p];n=len(xs);h=sum(x['hit'] for x in xs);assert n==110
  report['totals'][p]={'attempts':n,'hits':h,'rate_percent':str(percent(h,n)),'exact_rate':str(Fraction(h,n)),'near_share':str(Fraction(GROUPS[p,'near'][0],n)),'far_share':str(Fraction(GROUPS[p,'far'][0],n))}
 assert report['totals']['A']['hits']==39 and report['totals']['B']['hits']==82
 assert report['totals']['A']['rate_percent']=='35.5' and report['totals']['B']['rate_percent']=='74.5'
 assert Fraction(9,10)>Fraction(80,100) and Fraction(30,100)>Fraction(2,10)
 assert Fraction(39,110)<Fraction(82,110)
 for p in ['A','B']:
  near_n,near_h=GROUPS[p,'near'];far_n,far_h=GROUPS[p,'far']
  weighted=Fraction(near_n,110)*Fraction(near_h,near_n)+Fraction(far_n,110)*Fraction(far_h,far_n)
  assert weighted==Fraction(near_h+far_h,110)
 assert Fraction(90+30,2)!=Fraction(39*100,110) and Fraction(80+20,2)!=Fraction(82*100,110)
 report['checks']=['four input groups counted exactly','220 unique immutable record identities','A and B each have 110 attempts','39/110 rounds to 35.5%; 82/110 rounds to 74.5%','A higher in both groups; B higher in aggregate','weighted aggregation equals total hits/total attempts','unweighted average of percentages rejected']
 (R/'records.json').write_text(json.dumps(records,ensure_ascii=False,indent=2))
 (R/'records.js').write_text('const RECORDS='+json.dumps(records,ensure_ascii=False)+';\n')
 (R/'model_checks.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps(report,ensure_ascii=False,indent=2))
