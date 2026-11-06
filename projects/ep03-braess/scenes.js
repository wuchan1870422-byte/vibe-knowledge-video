/* 同一张路网贯穿全片。模型/粒子为教学示意，不是实际交通微观仿真。 */
'use strict';
const W=1920,H=1080,INK='#ede4d3',GOLD='#c9a96a',COOL='#b6c7cd',DIM='#9d9e9e',SHORT='#efc77e';
const bg=document.getElementById('bg'),bc=bg.getContext('2d'),sc=document.getElementById('scene'),c=sc.getContext('2d');
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),mix=(a,b,k)=>a+(b-a)*k;
const ease=v=>{v=clamp(v);return v*v*(3-2*v)};
const ramp=(t,a,b)=>ease((t-a)/(b-a));
const env=(t,a,b,d=.3)=>ramp(t,a,a+d)*(1-ramp(t,b-d,b));
const NODES={S:[220,450],A:[960,222],B:[960,678],T:[1700,450]};
const EDGES={SA:['S','A'],AT:['A','T'],SB:['S','B'],BT:['B','T'],AB:['A','B']};
const ROUTES={upper:['S','A','T'],lower:['S','B','T'],shortcut:['S','A','B','T']};
const COLORS={upper:GOLD,lower:COOL,shortcut:SHORT};
function calc(upper,lower,shortcut){
 if(upper+lower+shortcut!==4000)throw Error('demand changed');
 const flow={SA:upper+shortcut,AT:upper,SB:lower,BT:lower+shortcut,AB:shortcut};
 const time={SA:flow.SA/100,AT:45,SB:45,BT:flow.BT/100,AB:0};
 return {upper,lower,shortcut,flow,time,cost:{upper:time.SA+45,lower:45+time.BT,shortcut:time.SA+time.BT}};
}
const BASE=calc(2000,2000,0),AFTER=calc(0,0,4000);
const KEY={before:BASE.cost.upper,after:AFTER.cost.shortcut,delta:AFTER.cost.shortcut-BASE.cost.upper};
function stateAt(t){
 const qt=Math.floor(t*4)/4;let n=0,open=t>=EVENTS.open&&t<83;
 if(t>=EVENTS.open&&t<43)n=Math.round(20*ramp(qt,35.6,38)/2)*2;
 else if(t>=43&&t<65)n=20+Math.round(3980*ramp(qt,43,65)/20)*20;
 else if(t>=65&&t<83)n=4000;
 else if(t>=83)n=0;
 n=clamp(n,0,4000);
 // 关路期间的n是尚在重新分配的路线份额示意，不当作关闭后已达均衡。
 return {...calc((4000-n)/2,(4000-n)/2,n),open,transition:t>=83&&t<90.5,visualFrac:t>=83&&t<90.5?1-ramp(t,83,90.5):n/4000};
}
const fmt=v=>Math.abs(v-Math.round(v))<1e-7?String(Math.round(v)):v.toFixed(1);
function text(s,x,y,size=40,col=INK,align='center',bold=false,serif=false){c.save();c.font=`${bold?'700':'400'} ${size}px ${serif?'FilmSerif':'FilmSans'}`;c.textAlign=align;c.textBaseline='middle';c.fillStyle=col;c.fillText(s,x,y);c.restore()}
function line(a,b,col=GOLD,width=1,alpha=1){c.save();c.strokeStyle=col;c.lineWidth=width;c.globalAlpha*=alpha;c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke();c.restore()}
function arrow(x,y,dx,dy,col=GOLD,w=2,a=1){c.save();c.globalAlpha*=a;c.strokeStyle=col;c.fillStyle=col;c.lineWidth=w;c.beginPath();c.moveTo(x,y);c.lineTo(x+dx,y+dy);c.stroke();c.translate(x+dx,y+dy);c.rotate(Math.atan2(dy,dx));c.beginPath();c.moveTo(0,0);c.lineTo(-13,-6);c.lineTo(-10,0);c.lineTo(-13,6);c.closePath();c.fill();c.restore()}
function roundRect(x,y,w,h,r=12){c.beginPath();c.roundRect(x,y,w,h,r)}
function glow(x,y,rx,ry,a=.14,col='201,169,106'){c.save();c.translate(x,y);c.scale(rx,ry);const g=c.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,`rgba(${col},${a})`);g.addColorStop(1,`rgba(${col},0)`);c.fillStyle=g;c.fillRect(-1,-1,2,2);c.restore()}
function point(route,p){
 const pts=ROUTES[route].map(k=>NODES[k]);const lens=pts.slice(1).map((x,i)=>Math.hypot(x[0]-pts[i][0],x[1]-pts[i][1]));
 const total=lens.reduce((a,b)=>a+b,0);let dist=clamp(p)*total;
 for(let i=0;i<lens.length;i++){if(dist<=lens[i]||i===lens.length-1){let k=dist/lens[i];const x=mix(pts[i][0],pts[i+1][0],k),y=mix(pts[i][1],pts[i+1][1],k),ang=Math.atan2(pts[i+1][1]-pts[i][1],pts[i+1][0]-pts[i][0]);return [x,y,ang]}dist-=lens[i]}
}
function drawBG(t){
 bc.fillStyle='#06090e';bc.fillRect(0,0,W,H);const g=bc.createRadialGradient(960,440,0,960,440,1050);g.addColorStop(0,'#141b23');g.addColorStop(.6,'#0b1018');g.addColorStop(1,'#04060a');bc.fillStyle=g;bc.fillRect(0,0,W,H);
 // 沿用深色细线与柔光语言，去掉不属于交通主题的水面素材。
 bc.save();bc.lineWidth=.6;bc.strokeStyle='rgba(179,171,148,.034)';
 for(let y=155;y<850;y+=38){bc.beginPath();bc.moveTo(70,y);bc.lineTo(1850,y);bc.stroke()}
 for(let x=110;x<1840;x+=68){bc.beginPath();bc.moveTo(x,140);bc.lineTo(x,840);bc.stroke()}
 bc.restore();
 const f=bc.createLinearGradient(0,800,0,915);f.addColorStop(0,'rgba(6,9,14,0)');f.addColorStop(1,'#06090e');bc.fillStyle=f;bc.fillRect(0,800,W,280);
}
function path(route,col,a=1,width=5){c.save();c.globalAlpha*=a;c.strokeStyle=col;c.lineJoin='round';c.lineCap='round';c.lineWidth=width;c.beginPath();ROUTES[route].forEach((k,i)=>i?c.lineTo(...NODES[k]):c.moveTo(...NODES[k]));c.stroke();c.restore()}
function road(key,t,s){
 const [p,q]=EDGES[key].map(k=>NODES[k]);const dx=q[0]-p[0],dy=q[1]-p[1],ang=Math.atan2(dy,dx),nx=-Math.sin(ang),ny=Math.cos(ang);
 const variable=key==='SA'||key==='BT',isNew=key==='AB';
 if(isNew&&t<8){if(t>1){c.save();c.globalAlpha=env(t,1,8,.6);line(p,q,SHORT,8,.8);arrow(960,420,0,80,SHORT,3,.9);c.restore()}return}
 if(isNew&&t<EVENTS.open)return;
 const openAlpha=isNew? (s.open?ramp(t,EVENTS.open,EVENTS.open+.8):.22):1;
 const col=isNew?SHORT:variable?GOLD:'#68727a';
 c.save();c.globalAlpha*=openAlpha;c.lineCap='round';
 line([p[0],p[1]+7],[q[0],q[1]+7],'#020406',24,.9);
 line(p,q,col,17,.13);line(p,q,'#171d24',11,1);line(p,q,col,2.4,variable?.95:.7);
 // 固定道路双虚线、可变道路暖金实线，新路细金色单向。
 if(!variable&&!isNew){c.save();c.setLineDash([12,14]);for(let sign of [-1,1])line([p[0]+nx*7*sign,p[1]+ny*7*sign],[q[0]+nx*7*sign,q[1]+ny*7*sign],col,1,.6);c.restore()}
 else if(variable){for(let k=.15;k<.95;k+=.08){const x=p[0]+dx*k,y=p[1]+dy*k;line([x+nx*6,y+ny*6],[x+nx*10,y+ny*10],GOLD,1,.35)}}
 for(const k of (isNew?[.30,.72]:[.35,.72])){const x=p[0]+dx*k,y=p[1]+dy*k;arrow(x-15*Math.cos(ang),y-15*Math.sin(ang),30*Math.cos(ang),30*Math.sin(ang),col,1.8,.8)}
 if(isNew&&!s.open){line([945,431],[975,461],'#aa9374',5,1);line([945,461],[975,431],'#aa9374',5,1)}
 c.restore();
}
function car(route,p,t,id,alpha=1,col=COLORS[route],large=false){const [x,y,ang]=point(route,p);c.save();c.globalAlpha*=alpha;c.translate(x,y);c.rotate(ang);c.shadowColor=col;c.shadowBlur=large?12:5;c.fillStyle=col;roundRect(-6,-3,large?19:12,large?8:6,2);c.fill();c.shadowBlur=0;c.fillStyle='#141a20';c.fillRect(-2,-2,3,4);c.restore()}
function vehicles(t,s){
 const frac=s.visualFrac;const carTime=t<8?t*.7:t;
 for(let i=0;i<80;i++){
  const base=i%2?'upper':'lower',r=clamp(frac*80-i);
  const p=(carTime*.095+i*.61803398875)%1;
  if(1-r>.01)car(base,p,t,i,(1-r)*.85);
  if(r>.01)car('shortcut',p,t,i,r*.96*(t>=83?1-ramp(t,83,84.2):1));
 }
 if(t>=69&&t<73.4)car('upper',ramp(t,69,72.4),t,100,1,INK,true);
 if(t>=74&&t<78.5)car('lower',ramp(t,74,77.5),t,101,1,INK,true);
}
function node(k){const [x,y]=NODES[k];glow(x,y,65,65,.13);c.save();c.beginPath();c.arc(x,y,40,0,Math.PI*2);c.fillStyle='#10151c';c.fill();c.strokeStyle=GOLD;c.lineWidth=2;c.stroke();c.restore();text(k,x,y+1,50,INK,'center',true)}
function plate(key,t,s){
 if(t<8)return;const variable=key==='SA'||key==='BT';
 const pos={SA:[500,238],AT:[1420,238],SB:[500,675],BT:[1420,675]};const [x,y]=pos[key];
 c.save();c.fillStyle='rgba(7,11,17,.92)';roundRect(x-195,y-68,390,140,10);c.fill();line([x-155,y+70],[x+155,y+70],variable?GOLD:'#63717a',1.5,.5);
 if(t>=83&&t<90.5&&variable){text('重新分流',x,y-13,49,GOLD,'center',true);text('稳定后再计时',x,y+43,32,DIM)}
 else if(t<15.7&&variable){text('x / 100 分钟',x,y-13,49,GOLD,'center',true);text('本段的车辆数 = x',x,y+43,32,DIM)}
 else if(variable){text(`${fmt(s.time[key])} 分钟`,x,y-13,66,GOLD,'center',true);text(`${s.flow[key]} 辆经过本段`,x,y+43,42,DIM)}
 else {text('45 分钟',x,y-13,66,COOL,'center',true);text('固定耗时',x,y+43,36,DIM)}
 c.restore();
}
function smallNewLabel(t,s){
 if(t<EVENTS.open||t>=91)return;
 c.save();c.globalAlpha=ramp(t,EVENTS.open,EVENTS.open+.6);
 const x=1108,y=448;c.fillStyle='rgba(7,11,17,.93)';roundRect(x-108,y-62,245,140,10);c.fill();
 text(s.open?'新近路 A→B':'近路已关闭',x+10,y-29,32,s.open?SHORT:DIM);
 text(s.open?'≈ 0 分钟':'×',x+10,y+29,56,s.open?SHORT:DIM,'center',true);c.restore();
}
function equation(prefix,parts,result,col=INK,options={}){
 const y=805;
 text(prefix,420,y,36,DIM,'right');
 text(parts,1010,y,62,col,'center',true);
 if(result)text(result,1540,y,76,col,'center',true);
}
function traceEdge(key,k,col){const [a,b]=EDGES[key].map(n=>NODES[n]);line(a,[mix(a[0],b[0],clamp(k)),mix(a[1],b[1],clamp(k))],col,6,.9);}
function spotlight(route,t,a=.8){path(route,COLORS[route],a,6);const p=(t*.18)%1;const [x,y]=point(route,p);glow(x,y,55,42,.15)}
function narrative(t,s){
 if(t<8){
  text('结果预告',960,305,36,DIM);text(fmt(KEY.before),765,435,122,INK,'center',true);arrow(905,435,110,0,GOLD,4,1);text(fmt(KEY.after),1160,435,122,SHORT,'center',true);text('分钟',1305,445,39,DIM);text('同一批车辆，只多了一条近路',960,570,41,INK);return;
 }
 if(t<15.7){
  text('两种道路，两种计时方式',960,410,47,INK,'center',false,true);
  text('暖金实线：车越多越慢',960,478,36,GOLD);text('灰蓝双线：始终45分钟',960,534,36,COOL);
  text('x：本批4000辆中，选择经过该路段的车辆数',960,805,35,DIM);return;
 }
 if(t<31.1333333333){
  if(t<23.7){
   traceEdge('SA',ramp(t,16.5,18),GOLD);traceEdge('AT',ramp(t,18.2,19.7),GOLD);
   const part=t<18.2?fmt(s.time.SA):`${fmt(s.time.SA)} ＋ ${fmt(s.time.AT)} ${t>=19.7?'＝':''}`;
   equation('上路',part,t>=19.7?`${fmt(s.cost.upper)}分钟`:'',GOLD)
  }
  else if(t<28.4){
   traceEdge('SB',ramp(t,23.7,25.1),COOL);traceEdge('BT',ramp(t,25.3,26.6),COOL);
   const part=t<25.3?fmt(s.time.SB):`${fmt(s.time.SB)} ＋ ${fmt(s.time.BT)} ${t>=26.6?'＝':''}`;
   equation('下路',part,t>=26.6?`${fmt(s.cost.lower)}分钟`:'',COOL)
  }
  else{equation('均衡', `上路 ${fmt(s.cost.upper)} ＝ 下路 ${fmt(s.cost.lower)}`,'',INK)}
  text(`上路 ${s.upper}辆`,960,420,43,GOLD,'center',true);text(`下路 ${s.lower}辆`,960,492,43,COOL,'center',true);
  return;
 }
 if(t<43){
  spotlight('shortcut',t,.85);
  const early=t<35.6;
  equation(early?'刚开放估算':'少量改走后',early?`${fmt(BASE.time.SA)} ＋ ${fmt(BASE.time.AB)} ＋ ${fmt(BASE.time.BT)} ≈`:`${fmt(s.time.SA)} ＋ 0 ＋ ${fmt(s.time.BT)} ＝`,early?`${fmt(BASE.cost.shortcut)}分钟`:`${fmt(s.cost.shortcut)}分钟`,SHORT);
  text('近路耗时≈0：理想化假设',960,142,34,DIM);
  return;
 }
 if(t<65){
  spotlight('shortcut',t,.72);equation('新路线',`${fmt(s.time.SA)} ＋ 0 ＋ ${fmt(s.time.BT)} ＝`,`${fmt(s.cost.shortcut)}分钟`,SHORT);
  text(`改走近路：${s.shortcut} / 4000辆`,960,142,38,INK);
  const w=400*ramp(t,43,65);line([750,189],[1150,189],'#323b43',3,.8);line([750,189],[750+w,189],SHORT,4,.9);
  return;
 }
 if(t<69){spotlight('shortcut',t,.75);text('4000辆全部走新路线',960,142,39,INK);equation('最终', `${fmt(s.time.SA)} ＋ ${fmt(s.time.AB)} ＋ ${fmt(s.time.BT)} ＝`,`${fmt(s.cost.shortcut)}分钟`,SHORT);return}
 if(t<79){
  const upper=t<74;const route=upper?'upper':'lower';spotlight(route,t,.78);
  const deviated=upper?calc(1,0,3999):calc(0,1,3999);const cost=upper?deviated.cost.upper:deviated.cost.lower;
  text('假设：只改1人，其余3999人不动',960,142,35,DIM);
  equation(upper?'若改上路':'若改下路',upper?`${fmt(deviated.time.SA)} ＋ ${fmt(deviated.time.AT)} ＝`:`${fmt(deviated.time.SB)} ＋ ${fmt(deviated.time.BT)} ＝`,`${fmt(cost)}分钟`,INK);
  text(`留在新路线：${fmt(AFTER.cost.shortcut)}分钟`,735,515,38,SHORT,'center',true);return;
 }
 if(t<83){text(`留在近路 ${fmt(AFTER.cost.shortcut)}分钟`,735,385,43,SHORT,'center',true);text(`单独改道 ${fmt(calc(1,0,3999).cost.upper)}分钟`,735,540,43,INK,'center',true);equation('没人愿意单独换路',`${fmt(AFTER.cost.shortcut)} ＜ ${fmt(calc(1,0,3999).cost.upper)}`,'',INK);return}
 if(t>=83&&t<90.5){text('关闭后，恢复上下两条路线',960,805,49,INK);text('总需求不变：4000辆',960,142,39,INK);return}
 if(t<91){equation('重新分流',`${fmt(s.time.SA)} ＋ 45 ＝`,`${fmt(s.cost.upper)}分钟`,GOLD);text('总需求不变：4000辆',960,142,39,INK);return}
 // 同图对比，不换节点位置、不增加第二套图。
 c.save();c.fillStyle='rgba(7,11,17,.92)';roundRect(620,355,680,195,12);c.fill();
 if(t<96.4){text('只改变一条路',960,410,45,INK,'center',false,true);text('总需求始终是4000辆',960,480,36,DIM)}
 else{text('布雷斯悖论',960,415,66,INK,'center',false,true);text('BRAESS’S PARADOX',960,491,31,GOLD)}c.restore();
 text('无近路',520,805,37,DIM);text(`${fmt(KEY.before)}分钟`,735,805,69,GOLD,'center',true);text('有近路',1190,805,37,DIM);text(`${fmt(KEY.after)}分钟`,1410,805,69,SHORT,'center',true);
 if(t>=110){text('仅限特定路网与交通条件',960,144,38,INK)}
}
function drawScene(t){
 c.clearRect(0,0,W,H);const s=stateAt(t);
 text('总需求 4000辆',150,65,37,DIM,'left');
 for(const key of ['SA','AT','SB','BT','AB'])road(key,t,s);
 if(t>=8)vehicles(t,s);
 // 关键演示路径在车辆之下/节点之上以外层描边强调，节点始终固定。
 narrative(t,s);
 for(const k of ['S','A','B','T'])node(k);
 if(t>=8)for(const key of ['SA','AT','SB','BT'])plate(key,t,s);
 smallNewLabel(t,s);
 if(t>=83&&t<91){c.save();c.globalAlpha=1-ramp(t,89,91);text('车流重新分配中',960,530,37,DIM);c.restore()}
}
const $=id=>document.getElementById(id);
function drawOverlay(t){
 const sub=SUBTITLES.find(s=>t>=s[0]&&t<s[1]);
 if(sub){const a=env(t,sub[0],sub[1],.24);$('subtitle').textContent=sub[2];$('subtitle-en').textContent=sub[3];$('subtitle').style.opacity=a;$('subtitle-en').style.opacity=a*.96}
 else{$('subtitle').textContent='';$('subtitle-en').textContent=''}
 const sec=t<8?'':t<16?'01　两种计时方式':t<31.133333?'02　修路之前':t<43?'03　近路为什么诱人':t<65?'04　越来越多人改道':t<83?'05　更慢，却不愿单独离开':t<91?'06　把近路关掉':t<110?'07　个人选择与集体结果':'';
 $('toplabel').textContent=sec;
 $('titlecard').style.display='none';
 $('annotation').textContent=t<8?'':t<16?'两条可变耗时道路，分别用各自的车流量计算':t<31.133?'每个车符号≈50辆 · 动画速度不代表实际车速':t<43?'A→B单向 · ≈0分钟为理想化假设':t<91?'车流迁移为示意 · 总需求始终4000辆':'用户指定的理想化路网模型 · 不推论所有道路';
 $('stage').style.opacity=1-ramp(t,117.7,118);
}
window.assetsReady=Promise.resolve(true);
window.render=t=>{t=clamp(t,0,DURATION);drawBG(t);drawScene(t);drawOverlay(t)};
window.model=calc;window.stateAt=stateAt;
window.selftest=()=>{
 const a=calc(2000,2000,0),b=calc(1990,1990,20),d=calc(0,0,4000),asym=calc(500,1500,2000);
 const checks=[{name:'before 65/65',ok:a.cost.upper===65&&a.cost.lower===65},{name:'near opening 40.2 not a constant',ok:b.cost.shortcut===40.2},{name:'all shortcut 80',ok:d.cost.shortcut===80},{name:'single deviations 85',ok:calc(1,0,3999).cost.upper===85&&calc(0,1,3999).cost.lower===85},{name:'edge flow independence',ok:asym.time.SA===25&&asym.time.BT===35},{name:'all subtitle durations >=2.5',ok:SUBTITLES.every(x=>x[1]-x[0]>=2.5)},{name:'all subtitle widths',ok:SUBTITLES.every(x=>{c.font='700 64px FilmSans';return c.measureText(x[2]).width<1760})},{name:'no watermark',ok:!$('watermark')}];
 for(let i=0;i<=DURATION*30;i++){const m=stateAt(i/30);if(m.upper+m.lower+m.shortcut!==4000||m.flow.SA+m.flow.SB!==4000||m.flow.AT+m.flow.BT!==4000){checks.push({name:'frame demand conservation',ok:false});break}}
 checks.push({name:'closed link has no chosen shortcut',ok:[0,12,83,85,90.5,110,118].every(t=>stateAt(t).shortcut===0)});
 checks.push({name:'node positions fixed',ok:JSON.stringify(NODES)==='{"S":[220,450],"A":[960,222],"B":[960,678],"T":[1700,450]}'});return checks;
};
// 封面单独构图：所有标题和主要数字处在竖屏及中心裁切安全区域。
window.renderCover=function(height=1920){
 const cw=1080,ch=height;document.documentElement.style.width=cw+'px';document.documentElement.style.height=ch+'px';document.body.style.width=cw+'px';document.body.style.height=ch+'px';$('stage').style.width=cw+'px';$('stage').style.height=ch+'px';$('stage').style.opacity=1;
 for(const id of ['toplabel','annotation','subtitle','subtitle-en','titlecard'])$(id).style.display='none';
 bg.width=sc.width=cw;bg.height=sc.height=ch;
 bc.fillStyle='#06090f';bc.fillRect(0,0,cw,ch);const g=bc.createRadialGradient(540,1000,50,540,1000,920);g.addColorStop(0,'#1a232e');g.addColorStop(1,'#06090f');bc.fillStyle=g;bc.fillRect(0,0,cw,ch);
 c.clearRect(0,0,cw,ch);c.save();c.translate(0,-(1920-ch)/2);
 text('多修一条路',540,475,88,INK,'center',true);text('为什么更堵？',540,600,100,GOLD,'center',true);
 const p={S:[135,1000],A:[540,800],B:[540,1200],T:[945,1000]};
 for(const [u,v] of [['S','A'],['A','T'],['S','B'],['B','T']]){line(p[u],p[v],'#222b33',20,1);line(p[u],p[v],u==='S'&&v==='A'||u==='B'?GOLD:COOL,3,.8)}
 line(p.A,p.B,SHORT,9,.85);arrow(540,950,0,75,SHORT,4,1);text('新近路',650,990,39,SHORT);
 
 for(let i=0;i<24;i++){const route=i%2?['S','A','B','T']:['S','A','T'];let k=(i*.618)%1;let edge=Math.min(route.length-2,Math.floor(k*(route.length-1))),f=(k*(route.length-1))%1;const a=p[route[edge]],b=p[route[edge+1]];glow(mix(a[0],b[0],f),mix(a[1],b[1],f),12,12,.3);c.fillStyle=SHORT;c.beginPath();c.arc(mix(a[0],b[0],f),mix(a[1],b[1],f),5,0,6.283);c.fill()}
 for(const k of Object.keys(p)){const [x,y]=p[k];c.beginPath();c.arc(x,y,34,0,6.283);c.fillStyle='#0b1119';c.fill();c.strokeStyle=GOLD;c.lineWidth=2;c.stroke();text(k,x,y,41,INK,'center',true)}
 text(fmt(KEY.before),300,1415,142,INK,'center',true);arrow(470,1415,140,0,GOLD,5,1);text(fmt(KEY.after),780,1415,142,SHORT,'center',true);text('分钟',540,1525,43,DIM);text('布雷斯悖论',540,1650,49,INK,'center',false,true);c.restore();
};
let t0=performance.now();(function loop(){if(window.__RENDER_MODE__)return;window.render((performance.now()-t0)/1000%DURATION);requestAnimationFrame(loop)})();
