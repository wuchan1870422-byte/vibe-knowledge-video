/* 复用上一期Canvas/字幕/字体骨架。220个独立投篮记录，命中和来源永不变。 */
'use strict';
const W=1920,H=1080,INK='#ede4d3',GOLD='#c9a96a',COOL='#b6c7cd',DIM='#9d9e9e';
const COLORS={near:GOLD,far:COOL},CENTER={A:480,B:1440};
const bg=document.getElementById('bg'),bc=bg.getContext('2d'),sc=document.getElementById('scene'),c=sc.getContext('2d');
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),mix=(a,b,k)=>a+(b-a)*k;
const ease=v=>{v=clamp(v);return v*v*(3-2*v)},ramp=(t,a,b)=>ease((t-a)/(b-a));
const env=(t,a,b,d=.28)=>ramp(t,a,a+d)*(1-ramp(t,b-d,b));
RECORDS.forEach(Object.freeze);Object.freeze(RECORDS);
const GROUPS={},TOTAL={};
for(const p of ['A','B']){
 for(const source of ['near','far']){let xs=RECORDS.filter(x=>x.person===p&&x.source===source);GROUPS[p+'_'+source]={records:xs,n:xs.length,h:xs.filter(x=>x.hit).length};}
 const xs=RECORDS.filter(x=>x.person===p);TOTAL[p]={records:xs,n:xs.length,h:xs.filter(x=>x.hit).length};
}
const rate=(g,d=0)=>(100*g.h/g.n).toFixed(d)+'%';
function text(s,x,y,size=40,col=INK,align='center',bold=false,serif=false){c.save();c.font=`${bold?'700':'400'} ${size}px ${serif?'FilmSerif':'FilmSans'}`;c.textAlign=align;c.textBaseline='middle';c.fillStyle=col;c.fillText(s,x,y);c.restore()}
function line(a,b,col=GOLD,w=1,alpha=1){c.save();c.strokeStyle=col;c.lineWidth=w;c.globalAlpha*=alpha;c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke();c.restore()}
function rr(x,y,w,h,r=12){c.beginPath();c.roundRect(x,y,w,h,r)}
function glow(x,y,rx,ry,a=.12,col='201,169,106'){c.save();c.translate(x,y);c.scale(rx,ry);const g=c.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,`rgba(${col},${a})`);g.addColorStop(1,`rgba(${col},0)`);c.fillStyle=g;c.fillRect(-1,-1,2,2);c.restore()}
function arrow(x,y,dx,dy,col=GOLD,w=2){line([x,y],[x+dx,y+dy],col,w,.85);c.save();c.translate(x+dx,y+dy);c.rotate(Math.atan2(dy,dx));c.beginPath();c.moveTo(0,0);c.lineTo(-14,-6);c.lineTo(-10,0);c.lineTo(-14,6);c.closePath();c.fillStyle=col;c.fill();c.restore()}
function drawBG(t){
 bc.fillStyle='#06090e';bc.fillRect(0,0,W,H);let g=bc.createRadialGradient(960,430,20,960,430,1100);g.addColorStop(0,'#151d27');g.addColorStop(.65,'#0b1018');g.addColorStop(1,'#04060a');bc.fillStyle=g;bc.fillRect(0,0,W,H);
 bc.save();bc.strokeStyle='rgba(179,171,148,.028)';bc.lineWidth=.6;
 for(let y=150;y<840;y+=38){bc.beginPath();bc.moveTo(70,y);bc.lineTo(1850,y);bc.stroke()}
 for(let x=110;x<1840;x+=68){bc.beginPath();bc.moveTo(x,145);bc.lineTo(x,840);bc.stroke()}bc.restore();
 const f=bc.createLinearGradient(0,790,0,910);f.addColorStop(0,'rgba(6,9,14,0)');f.addColorStop(1,'#06090e');bc.fillStyle=f;bc.fillRect(0,790,W,290);
}
function person(p,y=165,small=false){const x=CENTER[p];c.save();glow(x-110,y,60,60,.1);c.beginPath();c.arc(x-110,y,small?27:36,0,Math.PI*2);c.fillStyle='#10151c';c.fill();c.strokeStyle=INK;c.lineWidth=1.5;c.stroke();c.restore();text(p,x-110,y,small?32:44,INK,'center',true);text('投手'+p,x+20,y,small?38:48,INK,'center',true)}
function group(p,source){return GROUPS[p+'_'+source]}
function groupGrid(rec,source,active=true){
 const g=group(rec.person,rec.source),cols=10,rows=Math.ceil(g.n/cols),pitch=active?38:25,cy=active?505:(source==='near'?360:650);
 return {x:CENTER[rec.person]+((rec.groupIndex%cols)-4.5)*pitch,y:cy+(Math.floor(rec.groupIndex/cols)-(rows-1)/2)*pitch,r:active?14:9.5};
}
function splitPos(rec){return groupGrid(rec,rec.source,false)}
function totalPos(rec,mini=false){const cols=11,p=mini?16:29,cy=mini?710:505;return{x:CENTER[rec.person]+((rec.personIndex%cols)-5)*p,y:cy+(Math.floor(rec.personIndex/cols)-4.5)*p,r:mini?5.5:11}}
function blend(a,b,k){return{x:mix(a.x,b.x,k),y:mix(a.y,b.y,k),r:mix(a.r,b.r,k)}}
function poolPos(rec,t){
 const a=splitPos(rec),b=totalPos(rec);
 if(t<48)return rec.source==='far'?blend(groupGrid(rec,'far',true),a,ramp(t,46,48)):a;
 if(t<56)return blend(a,b,ramp(t,48+.003*rec.personIndex,55+.003*rec.personIndex));
 if(t<70)return b;if(t<75)return blend(b,a,ramp(t,70+.002*rec.personIndex,74.5+.002*rec.personIndex));
 if(t<96)return a;return blend(a,totalPos(rec,true),ramp(t,96,100));
}
let DRAWN=[];
function shot(rec,pos,alpha=1){
 DRAWN.push(rec.id);c.save();c.globalAlpha*=alpha;const col=COLORS[rec.source];c.beginPath();c.arc(pos.x,pos.y,pos.r,0,Math.PI*2);c.fillStyle=rec.hit?col:'#0b1119';c.fill();c.strokeStyle=col;c.lineWidth=rec.hit?1:2.1;c.stroke();c.restore();
}
function court(p,source,t){const x=CENTER[p];
 c.save();c.strokeStyle='#63717b';c.lineWidth=1.5;c.globalAlpha=.45;rr(x-300,275,600,450,12);c.stroke();
 c.strokeRect(x-105,275,210,185);c.beginPath();c.arc(x,460,105,0,Math.PI);c.stroke();c.beginPath();c.ellipse(x,310,245,310,0,0,Math.PI);c.stroke();c.restore();
 line([x-55,292],[x+55,292],INK,3,.7);c.save();c.beginPath();c.ellipse(x,315,27,13,0,0,Math.PI*2);c.strokeStyle=GOLD;c.lineWidth=3;c.stroke();c.restore();
 for(const s of ['near','far']){const y=s==='near'?440:655,a=s===source?1:.22;c.save();c.globalAlpha=a;glow(x,y,70,35,.1);c.beginPath();c.ellipse(x,y,43+Math.sin(t*1.7)*2,18,0,0,Math.PI*2);c.strokeStyle=COLORS[s];c.lineWidth=2;c.stroke();text(s==='near'?'近投':'远投',x+105,y,39,COLORS[s]);c.restore()}
}
function opening(t){
 if(t<9){const source=t<4.8?'near':'far';text('为什么每组都赢了，合起来却输了？',960,75,52,INK,'center',false,true);for(const p of ['A','B']){person(p,180);court(p,source,t);text(rate(group(p,source)),CENTER[p],775,88,COLORS[source],'center',true)}return}
 if(t<13.5){text('为什么每组都赢了，',960,90,52,INK,'center',false,true);text('合起来却输了？',960,155,52,GOLD,'center',false,true);
  for(const p of ['A','B']){person(p,310);text('近投 '+rate(group(p,'near')),CENTER[p],425,51,GOLD,'center',true);text('远投 '+rate(group(p,'far')),CENTER[p],515,51,COOL,'center',true)}
  text('总命中率，谁更高？',960,680,68,INK,'center',false,true);
  for(let i=0;i<3;i++){let a=clamp((13.2-t-i*.7)/.4);c.save();c.globalAlpha=.15+.6*a;c.fillStyle=GOLD;c.beginPath();c.arc(930+i*30,784,4,0,Math.PI*2);c.fill();c.restore()}return;
 }
 for(const p of ['A','B']){person(p);glow(CENTER[p],450,320,210,.07);text(rate(TOTAL[p],1),CENTER[p],455,122,p==='A'?DIM:INK,'center',true);text('共'+TOTAL[p].n+'次出手',CENTER[p],625,49,DIM)}
 text('全部合并后的命中率',960,275,46,INK);text('同样多的总出手，结果却反过来',960,790,39,DIM);
}
function selected(t,source){
 for(const p of ['A','B']){person(p,145);const g=group(p,source);text(rate(g),CENTER[p],270,94,COLORS[source],'center',true);for(const rec of g.records)shot(rec,groupGrid(rec,source,true),ramp(t,(source==='near'?22:35)+.004*rec.groupIndex,(source==='near'?23.2:36.2)+.004*rec.groupIndex));
  text(`命中 ${g.h} ／ 出手 ${g.n}`,CENTER[p],750,50,INK,'center',true)}
 text(source==='near'?'只看近距离投篮':'只看远距离投篮',960,800,37,DIM);
}
function sourceLabels(t,alpha=1){c.save();c.globalAlpha*=alpha;for(const p of ['A','B'])for(const s of ['near','far']){const g=group(p,s);text(`${s==='near'?'近投':'远投'} ${g.h}/${g.n} ＝ ${rate(g)}`,CENTER[p],s==='near'?215:510,40,COLORS[s],'center',true)}c.restore()}
function mergeScene(t){
 for(const p of ['A','B'])person(p,145);
 // 合并时只让记录移动，来源由稳定的颜色保留；避免分组标签压到移动圆点上。
 // 每条记录只画一次；移动过程中保留颜色、命中/未命中与ID。
 for(const rec of RECORDS)shot(rec,poolPos(rec,t),rec.source==='near'?ramp(t,46,47):1);
 if(t>53){c.save();c.globalAlpha=ramp(t,53,55);for(const p of ['A','B']){text('总记录',CENTER[p],270,41,DIM);text(`${TOTAL[p].h} 命中 ／ ${TOTAL[p].n} 出手`,CENTER[p],705,48,INK,'center',true)}c.restore()}
 if(t<56){text('同一批记录 · 不增不减',960,815,40,INK);return}
 for(const p of ['A','B']){
  const start=p==='A'?56:63;const x=CENTER[p];
  if(t<start)continue;
  const near=group(p,'near'),far=group(p,'far');const local=t-start;
  const formula=local<2?`(${near.h}＋${far.h}) ÷ (${near.n}＋${far.n})`:`${TOTAL[p].h} ÷ ${TOTAL[p].n} ≈`;
  text(formula,x,758,47,INK,'center',true);
  if(local>=3.2)text(rate(TOTAL[p],1),x,820,65,INK,'center',true);
 }
}
function weightedBars(t){const k=ramp(t,74.5,76);c.save();c.globalAlpha*=k;
 for(const p of ['A','B']){const x=CENTER[p],n=group(p,'near').n,f=group(p,'far').n,total=TOTAL[p].n,w=630,left=x-w/2;
  text(`近投 ${n}次  ／  远投 ${f}次`,x,790,42,INK,'center',true);
  c.fillStyle='#202832';rr(left,820,w,27,6);c.fill();
  c.save();rr(left,820,w,27,6);c.clip();c.fillStyle=GOLD;c.fillRect(left,820,w*n/total,27);c.fillStyle=COOL;c.fillRect(left+w*n/total,820,w*f/total,27);c.restore();
  // 长度直接使用实际次数/110，不把10与100画成等长。
  line([left+w*n/total,815],[left+w*n/total,852],INK,1.3,.7);
 }c.restore();}
function weights(t){
 for(const p of ['A','B'])person(p,145);
 sourceLabels(t,ramp(t,74.7,75.5));
 for(const rec of RECORDS){let a=1;if(t>=75&&t<80&&rec.person==='B')a=.35;if(t>=80&&t<85&&rec.person==='A')a=.35;shot(rec,poolPos(rec,t),a)}
 weightedBars(t);
 if(t>=85){c.save();c.globalAlpha=ramp(t,85,86);text('组内命中率',960,350,44,INK);text('×',960,415,40,DIM);text('该组出手比例',960,480,44,INK);text('各组加起来',960,555,37,GOLD);c.restore()}
}
function finalResults(t){
 // 同一批220条原始记录归为小型总池，两个结果面板只是统计视角，不复制记录。
 for(const rec of RECORDS)shot(rec,poolPos(rec,t),.75);
 // 等记录落到下方，再展开比较文字，避免移动的圆点穿过结论。
 const a=ramp(t,99.7,100.5);c.save();c.globalAlpha=a;
 text('分组看',480,265,52,INK,'center',false,true);text('合并看',1440,265,52,INK,'center',false,true);
 text(`近投  A ${rate(group('A','near'))}  ＞  B ${rate(group('B','near'))}`,480,385,48,GOLD,'center',true);
 text(`远投  A ${rate(group('A','far'))}  ＞  B ${rate(group('B','far'))}`,480,485,48,COOL,'center',true);
 text(`A ${rate(TOTAL.A,1)}`,1440,385,65,DIM,'center',true);text(`B ${rate(TOTAL.B,1)}`,1440,485,65,INK,'center',true);
 text('A的命中率都更高',480,570,40,INK);text('B的总命中率更高',1440,570,40,INK);
 text('同一批记录，两种同时成立的结果',960,830,38,DIM);c.restore();
 text('辛普森悖论',960,140,67,INK,'center',false,true);
}
function drawScene(t){
 c.clearRect(0,0,W,H);DRAWN=[];
 if(t>=22){line([960,190],[960,810],DIM,.8,.16)}
 if(t<22)opening(t);
 else if(t<35)selected(t,'near');
 else if(t<46)selected(t,'far');
 else if(t<70)mergeScene(t);
 else if(t<96)weights(t);
 else {
  finalResults(t)
 }
}
const $=id=>document.getElementById(id);
function drawOverlay(t){
 const s=SUBTITLES.find(x=>t>=x[0]&&t<x[1]);if(s){const a=env(t,s[0],s[1]);$('subtitle').textContent=s[2];$('subtitle-en').textContent=s[3];$('subtitle').style.opacity=a;$('subtitle-en').style.opacity=a*.96}else{$('subtitle').textContent='';$('subtitle-en').textContent=''}
 $('titlecard').style.display='none';
 $('toplabel').textContent=t<22?'':t<35?'01　近距离投篮记录':t<46?'02　远距离投篮记录':t<56?'03　同一批记录，合并查看':t<70?'04　总命中 ÷ 总出手':t<96?'05　出手比例改变了总结果':'';
 $('annotation').textContent=t<22?'教学示意数据 · 只比较命中率':t<46?'每个圆点＝1次出手 · 实心命中／空心未命中 · 示意数据':t<96?'暖金＝近投来源，灰蓝＝远投来源 · 每个圆点始终是同一次出手':'教学示意数据 · 不代表真实球员记录或真实球技高低';
 $('stage').style.opacity=1-ramp(t,117.7,118);
}
window.assetsReady=Promise.resolve(true);window.render=t=>{t=clamp(t,0,DURATION);drawBG(t);drawScene(t);drawOverlay(t)};
window.audit=t=>{window.render(t);const ids=[...DRAWN];return{t,ids,count:ids.length,unique:new Set(ids).size,pool:RECORDS.length,hits:RECORDS.filter(x=>x.hit).length,sources:RECORDS.reduce((m,x)=>{const k=x.person+'_'+x.source;m[k]=(m[k]||0)+1;return m},{})}};
const ORIGINAL_RECORDS=JSON.stringify(RECORDS);
window.selftest=()=>{
 const out=[{name:'220 unique records',ok:RECORDS.length===220&&new Set(RECORDS.map(x=>x.id)).size===220},{name:'four groups exact',ok:group('A','near').n===10&&group('A','near').h===9&&group('B','near').n===100&&group('B','near').h===80&&group('A','far').n===100&&group('A','far').h===30&&group('B','far').n===10&&group('B','far').h===2},{name:'39/110 and 82/110 rounded',ok:TOTAL.A.n===110&&TOTAL.A.h===39&&rate(TOTAL.A,1)==='35.5%'&&TOTAL.B.n===110&&TOTAL.B.h===82&&rate(TOTAL.B,1)==='74.5%'},{name:'subtitles fit',ok:SUBTITLES.every(x=>{c.font='700 64px FilmSans';return c.measureText(x[2]).width<1760})},{name:'reading duration',ok:SUBTITLES.every(x=>x[1]-x[0]>=2.5)},{name:'no watermark',ok:!$('watermark')}];
 for(const t of [22,26,34.9,35,39,45.9]){const a=window.audit(t);const source=t<35?'near':'far';const expected=RECORDS.filter(x=>x.source===source).map(x=>x.id).sort().join('|');out.push({name:'selected group IDs '+t,ok:a.count===110&&a.unique===110&&a.ids.sort().join('|')===expected})}
 let all=true;for(let frame=46*30;frame<=118*30;frame+=3){const a=window.audit(frame/30);if(a.count!==220||a.unique!==220||a.ids.sort().join('|')!==RECORDS.map(x=>x.id).sort().join('|')){all=false;break}}
 out.push({name:'merge/split identity conservation sampled every 0.1s',ok:all});out.push({name:'outcomes and provenance immutable',ok:JSON.stringify(RECORDS)===ORIGINAL_RECORDS});return out;
};
// 独立封面使用相同模型统计，身份仍是A/B，背景为同一暖金深色体系。
window.renderCover=function(height=1920){
 const cw=1080,ch=height;document.documentElement.style.width=cw+'px';document.documentElement.style.height=ch+'px';document.body.style.width=cw+'px';document.body.style.height=ch+'px';$('stage').style.width=cw+'px';$('stage').style.height=ch+'px';$('stage').style.opacity=1;
 for(const id of ['toplabel','annotation','subtitle','subtitle-en','titlecard'])$(id).style.display='none';bg.width=sc.width=cw;bg.height=sc.height=ch;
 bc.fillStyle='#06090e';bc.fillRect(0,0,cw,ch);const g=bc.createRadialGradient(540,ch*.55,0,540,ch*.55,900);g.addColorStop(0,'#1a2430');g.addColorStop(1,'#06090e');bc.fillStyle=g;bc.fillRect(0,0,cw,ch);
 c.clearRect(0,0,cw,ch);c.save();c.translate(0,-(1920-ch)/2);
 text('为什么每组都赢了',540,460,78,INK,'center',true);text('合起来却输了？',540,575,92,GOLD,'center',true);
 text(`近投：A ${rate(group('A','near'))} ＞ B ${rate(group('B','near'))}`,540,790,55,GOLD,'center',true);text(`远投：A ${rate(group('A','far'))} ＞ B ${rate(group('B','far'))}`,540,900,55,COOL,'center',true);
 arrow(540,985,0,100,GOLD,4);text('总命中率反转',540,1155,52,DIM);
 text('A '+rate(TOTAL.A,1),540,1285,96,INK,'center',true);text('B '+rate(TOTAL.B,1),540,1430,96,GOLD,'center',true);
 text('辛普森悖论 · 教学示意数据',540,1610,43,DIM);c.restore();
};
let t0=performance.now();(function loop(){if(window.__RENDER_MODE__)return;window.render((performance.now()-t0)/1000%DURATION);requestAnimationFrame(loop)})();
