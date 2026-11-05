/* 源于仓库template.html的分层Canvas骨架。所有空间、扩散与时间比例均为教学示意。 */
'use strict';
const W=1920,H=1080;
const bg=document.getElementById('bg'),bc=bg.getContext('2d');
const sc=document.getElementById('scene'),c=sc.getContext('2d');
const GOLD='#c9a96a',INK='#ede4d3',DIM='#9a978f',FLOW='#9db5be';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const mix=(a,b,k)=>a+(b-a)*k;
const ease=v=>{v=clamp(v);return v*v*(3-2*v)};
const ramp=(t,a,b)=>ease((t-a)/(b-a));
const env=(t,a,b,k=.7)=>ramp(t,a,a+k)*(1-ramp(t,b-k,b));
function rng(seed){return ()=>{let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296}}
const rand=rng(20261105);
const dust=Array.from({length:190},()=>({x:rand()*1920,y:150+rand()*620,r:rand()*1.6+.3,p:rand()*6.28}));
const molecules=Array.from({length:110},(_,i)=>{let x=0,y=0,pts=[[0,0]];for(let k=0;k<42;k++){const a=rand()*Math.PI*2;x+=Math.cos(a)*21;y+=Math.sin(a)*21;pts.push([x,y])}return{p:rand()*6.28,birth:rand()*7,r:rand()*2+2.5,pts}});
function text(s,x,y,size=24,col=INK,align='center',serif=false){c.save();c.fillStyle=col;c.font=`${serif?'400':'400'} ${size}px ${serif?'FilmSerif':'FilmSans'}`;c.textAlign=align;c.textBaseline='middle';c.fillText(s,x,y);c.restore()}
function line(x1,y1,x2,y2,col=GOLD,width=1,alpha=1){c.save();c.globalAlpha*=alpha;c.strokeStyle=col;c.lineWidth=width;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();c.restore()}
function arrow(x,y,dx,dy,col=INK,width=2,alpha=1,dashed=false){const l=Math.hypot(dx,dy);if(l<5)return;c.save();c.globalAlpha*=alpha;c.strokeStyle=col;c.fillStyle=col;c.lineWidth=width;if(dashed)c.setLineDash([9,9]);c.beginPath();c.moveTo(x,y);c.lineTo(x+dx,y+dy);c.stroke();c.setLineDash([]);c.translate(x+dx,y+dy);c.rotate(Math.atan2(dy,dx));c.beginPath();c.moveTo(0,0);c.lineTo(-13,-5);c.lineTo(-10,0);c.lineTo(-13,5);c.closePath();c.fill();c.restore()}
function ring(x,y,rx,ry,col=GOLD,alpha=.3,width=1){c.save();c.globalAlpha*=alpha;c.strokeStyle=col;c.lineWidth=width;c.beginPath();c.ellipse(x,y,Math.max(1,rx),Math.max(1,ry),0,0,Math.PI*2);c.stroke();c.restore()}
function glow(x,y,rx,ry,col='201,169,106',strength=.1){c.save();c.translate(x,y);c.scale(rx,ry);const g=c.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,`rgba(${col},${strength})`);g.addColorStop(1,`rgba(${col},0)`);c.fillStyle=g;c.fillRect(-1,-1,2,2);c.restore()}
function label(s,x,y,tx,ty,side='left',col=DIM){line(x,y,tx,ty,col,1,.6);line(tx,ty,tx+(side==='left'?-28:28),ty,col,1,.6);text(s,tx+(side==='left'?-39:39),ty,24,col,side==='left'?'right':'left');ring(x,y,3,3,col,.8)}
const waterFrames=Array.from({length:72},(_,i)=>{const im=new Image();im.src=`water/${String(i).padStart(3,"0")}.jpg`;return im});
window.assetsReady=Promise.all(waterFrames.map(im=>im.decode()));
const waterLayer=document.createElement("canvas");waterLayer.width=1920;waterLayer.height=660;const wc=waterLayer.getContext("2d");
function drawBG(t){
 bc.fillStyle='#05080d';bc.fillRect(0,0,W,H);
 const g=bc.createRadialGradient(1040,430,0,1040,430,1000);g.addColorStop(0,'#101923');g.addColorStop(.6,'#080d16');g.addColorStop(1,'#030509');bc.fillStyle=g;bc.fillRect(0,0,W,H);
 // 由波面法线计算的镜面反射层；不把可见波纹当作马兰戈尼流的定量证据。
 const wt=t<7.5?0:t-7.5;
 const wi=waterFrames[Math.floor((wt%6)/6*72)];
 if(wi.complete&&wi.naturalWidth){
  wc.clearRect(0,0,1920,660);wc.globalCompositeOperation='source-over';wc.drawImage(wi,0,0,1920,660);
  wc.globalCompositeOperation='destination-in';const mask=wc.createLinearGradient(0,0,0,660);mask.addColorStop(0,'rgba(0,0,0,0)');mask.addColorStop(.17,'rgba(0,0,0,.8)');mask.addColorStop(.72,'rgba(0,0,0,.8)');mask.addColorStop(1,'rgba(0,0,0,0)');wc.fillStyle=mask;wc.fillRect(0,0,1920,660);
  bc.save();bc.globalAlpha=.7;bc.globalCompositeOperation='screen';bc.drawImage(waterLayer,0,135);bc.restore()
 }
 // 景深中的水面高光：受限在叙事画面内，字幕区域独立留黑。
 bc.save();bc.beginPath();bc.rect(0,100,W,710);bc.clip();
 for(let j=0;j<38;j++){
  bc.beginPath();const y=170+j*17;
  for(let x=0;x<=W;x+=24){const z=y+Math.sin(x*.004+j*.8+t*.23)*(2+j*.07)+Math.sin(x*.011-j*.4+t*.32)*1.5;if(!x)bc.moveTo(x,z);else bc.lineTo(x,z)}
  bc.strokeStyle=`rgba(143,167,177,${.016+(.5+.5*Math.sin(j*2.1+t*.4))*.012})`;bc.lineWidth=.7;bc.stroke();
 }
 for(const p of dust){bc.globalAlpha=.11+Math.sin(p.p+t*.32)*.06;bc.fillStyle='#a5aeb0';bc.fillRect(p.x,p.y+Math.sin(t*.3+p.p)*3,p.r,p.r*.5)}bc.restore();
 const fade=bc.createLinearGradient(0,740,0,920);fade.addColorStop(0,'rgba(5,8,13,0)');fade.addColorStop(1,'rgba(5,8,13,1)');bc.fillStyle=fade;bc.fillRect(0,740,W,340);
}
function hullPath(scale=1){c.beginPath();c.moveTo(188*scale,0);c.bezierCurveTo(122*scale,-55*scale,12*scale,-75*scale,-132*scale,-53*scale);c.quadraticCurveTo(-158*scale,0,-132*scale,53*scale);c.bezierCurveTo(12*scale,75*scale,122*scale,55*scale,188*scale,0);c.closePath()}
function crystal(x,y,s=1,t=0,supply=1){
 c.save();c.translate(x,y);c.scale(s,s);const k=.3+.7*supply;
 c.scale(k,k);const facets=[[-17,-13,0,-28,19,-12],[0,-28,29,-5,19,-12],[-17,-13,-25,8,0,19],[19,-12,29,-5,19,15],[0,-28,19,-12,0,19],[-17,-13,0,19,0,-28],[0,19,19,-12,19,15]];
 const cols=['#d7d9cf','#9da9a6','#b8c5c0','#7f928e','#edf0de','#cbd7d1','#aab8ae'];
 facets.forEach((v,i)=>{c.beginPath();c.moveTo(v[0],v[1]);c.lineTo(v[2],v[3]);c.lineTo(v[4],v[5]);c.closePath();c.fillStyle=cols[i];c.fill();c.strokeStyle='rgba(238,241,218,.28)';c.lineWidth=.7;c.stroke()});c.restore();
}
function boat(x,y,s=1,t=0,supply=1,rot=0){
 c.save();c.translate(x,y);c.rotate(rot);c.scale(s,s);
 // 船体非发光实物层：厚度、木纹、船舷和暖金细描边。
 c.save();c.translate(0,13);hullPath();c.fillStyle='#040507';c.shadowColor='rgba(0,0,0,.9)';c.shadowBlur=24;c.fill();c.restore();
 const body=c.createLinearGradient(0,-68,0,72);body.addColorStop(0,'#bca477');body.addColorStop(.13,'#4b402e');body.addColorStop(.48,'#8b754c');body.addColorStop(.8,'#403726');body.addColorStop(1,'#a68a53');hullPath();c.fillStyle=body;c.fill();c.strokeStyle='#c9ad75';c.lineWidth=1.6;c.stroke();
 c.save();hullPath(.88);c.clip();c.fillStyle='#191d20';c.fillRect(-160,-80,350,160);
 for(let i=-4;i<=4;i++){const yy=i*12;const dg=c.createLinearGradient(0,yy,0,yy+11);dg.addColorStop(0,'#413d31');dg.addColorStop(.4,'#2b2b26');dg.addColorStop(1,'#232522');c.fillStyle=dg;c.fillRect(-128,yy,310,10);c.strokeStyle='rgba(192,165,104,.12)';c.lineWidth=.5;c.strokeRect(-128,yy,310,10)}
 // 微细材料纹理，路径完全由序号决定。
 for(let k=0;k<35;k++){const xx=-125+(k*47)%290,yy=-47+(k*19)%93;line(xx,yy,xx+15+(k%4)*4,yy+.3,'#c3a875',.45,.11)}
 c.restore();hullPath(.91);c.strokeStyle='rgba(218,192,141,.65)';c.lineWidth=.8;c.stroke();
 line(-92,-51,-92,51,'#c9b57c',4,.55);line(56,-43,56,43,'#9e8d65',5,.45);
 c.fillStyle='#141a1d';c.fillRect(-160,-20,48,40);line(-160,-20,-111,-20,GOLD,1,.7);line(-160,20,-111,20,GOLD,1,.7);
 crystal(-147,1,.8,t,supply);
 for(const [xx,yy] of [[-112,-43],[-112,43],[52,-38],[52,38]]){ring(xx,yy,1.8,1.8,'#dac38f',.9,1)}
 c.restore();
}
function water(x,y,s,t,strength=1){
 glow(x,y+12,430*s,190*s,'101,137,148',.055);
 for(let i=0;i<9;i++){const ph=(t*.17+i*.113)%1,rx=(130+ph*260)*s;ring(x-55*s,y,rx,rx*.28,FLOW,(1-ph)*.12*strength,.8)}
 // 船首细弧与船尾张开的尾迹；不是喷气推进示意。
 c.save();c.strokeStyle='rgba(183,191,178,.17)';c.lineWidth=1;
 for(let i=0;i<4;i++){const ph=(t*.31+i*.25)%1;c.globalAlpha=(1-ph)*strength;c.beginPath();c.moveTo(x+185*s,y);c.bezierCurveTo(x+(120-ph*100)*s,y-(72+ph*20)*s,x-(170+ph*220)*s,y-(98+ph*75)*s,x-(300+ph*300)*s,y-(125+ph*90)*s);c.stroke();c.beginPath();c.moveTo(x+185*s,y);c.bezierCurveTo(x+(120-ph*100)*s,y+(72+ph*20)*s,x-(170+ph*220)*s,y+(98+ph*75)*s,x-(300+ph*300)*s,y+(125+ph*90)*s);c.stroke()}c.restore();
}
const fc=document.createElement('canvas');fc.width=240;fc.height=100;const fctx=fc.getContext('2d');
function concentrationField(x,y,s,t,power=1){
 const im=fctx.createImageData(240,100);const ar=im.data;
 for(let j=0;j<100;j++)for(let i=0;i<240;i++){
  const xx=(i-130)*5,yy=(j-50)*5;
  const cc=Math.exp(-((xx+120)**2/(xx< -120?185000:28000)+yy*yy/37000));
  const ripple=.89+.11*Math.cos(Math.sqrt((xx+120)**2+yy*yy)*.035-t*1.8);
  const edge=Math.pow(Math.max(0,Math.sin(Math.PI*i/239)*Math.sin(Math.PI*j/99)),.45);const a=clamp(cc*power)*ripple*edge;const k=(j*240+i)*4;
  ar[k]=196;ar[k+1]=155;ar[k+2]=80;ar[k+3]=Math.round(a*50);
 }fctx.putImageData(im,0,0);c.save();c.globalCompositeOperation='screen';c.imageSmoothingEnabled=true;c.drawImage(fc,x-650*s,y-250*s,1200*s,500*s);c.restore();
 // 同一解析场的等浓度线，仅表示相对分布，没有物理单位。
 c.save();c.strokeStyle=GOLD;c.lineWidth=.9;
 for(let n=0;n<7;n++){const phase=(t*.11+n/7)%1;c.globalAlpha=.23*(1-phase)*power;const a=(90+phase*400)*s,b=(45+phase*170)*s;c.beginPath();c.ellipse(x-150*s-phase*120*s,y,a,b,0,0,Math.PI*2);c.stroke()}c.restore();
}
function release(x,y,s,t,power=1,waterFlow=false){
 c.save();
 for(let i=0;i<100;i++){
  const m=molecules[i],age=(Math.max(0,t)+m.birth)%7;
  const step=age/7*40,k=Math.floor(step),f=step-k,p1=m.pts[k],p2=m.pts[k+1];
  let xx=mix(p1[0],p2[0],f),yy=mix(p1[1],p2[1],f)*.8;
  if(waterFlow){xx-=age*26;yy+=Math.sin(m.p)*age*12}
  c.globalAlpha=(1-age/7)*.7*power;c.fillStyle=i%7===0?INK:GOLD;c.beginPath();c.arc(x+xx*s,y+yy*s,(m.r+Math.sin(age)*.2)*s,0,6.283);c.fill();
 }c.restore();
}
function flow(x,y,s,t,power=1){
 // 从低张力源指向周围高张力界面。虚线是示意水流，不是分子随机游走。
 c.save();
 for(let j=0;j<14;j++){
  const ang=(-Math.PI*.82+j*(Math.PI*1.64/13))+Math.PI;
  const dx=Math.cos(ang),dy=Math.sin(ang);const r0=48,r1=330;
  c.globalAlpha=.34*power;c.strokeStyle=FLOW;c.lineWidth=1.2;c.setLineDash([3,9]);c.lineDashOffset=-t*18;
  c.beginPath();c.moveTo(x+dx*r0*s,y+dy*r0*s);c.quadraticCurveTo(x+dx*190*s,y+dy*145*s,x+dx*r1*s,y+dy*245*s);c.stroke();
  const p=(t*.25+j*.17)%1;const r=70+p*230;
  arrow(x+dx*r*s,y+dy*r*.74*s,dx*21*s,dy*16*s,FLOW,1.5,.8*power);
 }c.restore();
}
function bars(x,y,v,name,col=GOLD){
 text(name,x,y-28,23,DIM,'left');line(x,y,x+230,y,'#3b4042',3,.8);line(x,y,x+230*clamp(v),y,col,4,.95);ring(x+230*clamp(v),y,4,4,col,.9,1.5)
}
function opening(t){
 const start=EVENTS.launch;const move=ramp(t,start,start+3.2);
 const x=680+move*540,y=450+Math.sin(t*.4)*1.3,s=1.28+Math.min(t,10)*.024;
 water(x,y,s,t,.25+.75*move);if(move>0)release(x-145*s,y,s,t-start,move*.55,true);boat(x,y,s,t);
 if(t<7){text('静止的水面',960,688,27,DIM);line(865,729,1055,729,GOLD,.7,.3)}
 if(t>=8) {c.save();c.globalAlpha=ramp(t,8,9);label('开始运动',x+145*s,y,x+220,y-130,'right');c.restore()}
}
function discovery(t){
 const p=ramp(t,10,17),s=Math.exp(mix(Math.log(1.48),Math.log(2.35),p));const x=mix(1110,1215,p),y=mix(450,465,p);
 water(x,y,s,t,.55);boat(x,y,s,t);
 const lx=x-147*s;
 if(t<18){c.save();c.globalAlpha=env(t,11,18);label('樟脑',lx,y-8,lx-170,y-165,'left',INK);text('尾部开口 · 与水接触',lx-210,y+175,23,DIM,'right');c.restore()}
 if(t>=18){c.fillStyle='rgba(5,8,13,.72)';c.fillRect(0,130,W,650)}
}
function molecular(t){
 const p=ramp(t,21,24);const x=840,y=445,s=2.6;
 glow(960,450,620,290,'134,157,155',.07);
 // 宏观船尾变为局部界面切片，清楚区分空气和水。
 c.save();c.globalAlpha=.7;line(260,475,1650,475,FLOW,1.5,.8);text('空气',1640,421,24,DIM,'right');text('水',1640,525,24,DIM,'right');c.restore();
 crystal(600,445,2.9,t);
 label('固体樟脑',575,405,420,277,'left',INK);
 // 固体边缘出发的分子沿固定种子的随机游走；不把扩散画成整齐射流。
 for(let i=0;i<66;i++){
  const m=molecules[i],age=(Math.max(0,t-21)+m.birth)%6,step=age/6*40,k=Math.floor(step),f=step-k;
  const xx=660+Math.abs(mix(m.pts[k][0],m.pts[k+1][0],f))*2.8,dy=mix(m.pts[k][1],m.pts[k+1][1],f),yy=477+(i%4===0?Math.abs(dy)*1.2:dy*.17);
  c.save();c.globalAlpha=(1-age/6)*p*.8;c.fillStyle=GOLD;c.beginPath();c.arc(xx,yy,4.5,0,6.283);c.fill();c.restore();
  if(i%9===0){c.save();c.globalAlpha=.18*(1-age/6)*p;c.strokeStyle=GOLD;c.lineWidth=1;c.beginPath();for(let j=0;j<=k;j++){const xp=660+Math.abs(m.pts[j][0])*2.8,yp=477+(i%4===0?Math.abs(m.pts[j][1])*1.2:m.pts[j][1]*.17);j?c.lineTo(xp,yp):c.moveTo(xp,yp)}c.stroke();c.restore()}
 }
 text('随机路径 · 分子扩散',1170,285,31,INK);
 text('轨迹放大示意，分子并非可见金色光点',1170,656,23,DIM);
 if(t>26){c.save();c.globalAlpha=ramp(t,26,28)*.7;arrow(1010,510,0,100,DIM,1.5,.8,true);text('部分进入水体',1120,610,23,DIM);c.restore()}
}
function fieldScene(t){
 const x=1060,y=445,s=1.6;const pow=ramp(t,30,32);
 concentrationField(x,y,s,t,pow);release(x-145*s,y,.9,t-20,.7,true);water(x,y,s,t,.3);boat(x,y,s,t);
 const anim=env(t,30,39);
 c.save();c.globalAlpha=anim;label('浓度较高',x-300,y+95,480,660,'left',GOLD);label('浓度较低',x+350,y-30,1430,270,'right',INK);text('樟脑相对浓度',400,255,27,INK,'left');for(let i=0;i<150;i++){c.fillStyle=`rgba(201,169,106,${i/150*.65})`;c.fillRect(400+i*2,298,2,12)}text('低',400,343,21,DIM,'left');text('高',700,343,21,GOLD,'right');c.restore();
 if(t>38.5){
  const a=ramp(t,38.5,40);c.save();c.globalAlpha=a;c.fillStyle='#070b11';c.fillRect(220,180,1480,565);
  text('分子多的地方，表面张力较低',960,228,34,INK,true);
  const ox=510,oy=640;arrow(ox,oy,890,0,DIM,1.3);arrow(ox,oy,0,-290,DIM,1.3);
  text('樟脑浓度 c',1410,689,24,DIM,'right');text('表面张力 γ',490,331,24,DIM,'left');
  c.strokeStyle=GOLD;c.lineWidth=3;c.beginPath();let end=ramp(t,39,41);for(let i=0;i<=180*end;i++){const v=i/180,xx=ox+v*820,yy=oy-250+180*(1-Math.exp(-v*2.1));i?c.lineTo(xx,yy):c.moveTo(xx,yy)}c.stroke();
  const v=.15+.65*(.5+.5*Math.sin(t*.6));const px=ox+v*820,py=oy-250+180*(1-Math.exp(-v*2.1));ring(px,py,7,7,INK,.9,2);line(px,py,px,oy,GOLD,1,.2);text('关系示意 · 非实验曲线',960,744,22,DIM);c.restore();
 }
}
function tensionScene(t){
 const x=960,y=438,s=1.6;
 concentrationField(x,y,s,t,.8);boat(x,y,s,t);
 const k=ramp(t,43,45);
 c.save();c.globalAlpha=k;label('尾：浓度高 / 张力低',x-160,y-45,680,245,'left',GOLD);label('头：浓度低 / 张力高',x+170,y-25,1265,245,'right',INK);
 bars(430,662,.35,'船尾 γ',GOLD);bars(1260,662,.9,'船头 γ',INK);
 c.restore();
 if(t>47.8){const a=ramp(t,47.8,49.1);c.save();c.globalAlpha=a;arrow(740,744,440,0,GOLD,2.5,.9);text('表面张力梯度  ∇ₛγ',960,704,28,INK);c.restore()}
}
function marangoni(t){
 const x=1060,y=474,s=1.5;
 concentrationField(x,y,s,t,.7);flow(x-147*s,y,s,t,ramp(t,55.5,57));boat(x,y,s,t);
 text('马兰戈尼效应',960,205,55,INK,true);text('MARANGONI EFFECT',960,268,22,GOLD);
 text('低 γ',650,623,26,GOLD);text('高 γ',360,623,26,FLOW);arrow(620,623,-200,0,FLOW,2.1,.9,true);
 if(t>61){text('灰蓝虚线 = 水面流动方向',1350,706,23,FLOW);text('由低张力区域向周围高张力区域流动',960,766,25,DIM)}
}
function forces(t){
 const x=960,y=430,s=1.55;
 flow(x-147*s,y,s,t,.25*(1-ramp(t,71,73)));concentrationField(x,y,s,t,.38);boat(x,y,s,t);
 text('水的流动 ≠ 船的受力',960,217,39,INK,true);
 const k=ramp(t,67,69);c.save();c.globalAlpha=k;
 arrow(x-153*s,y,-105,0,GOLD,3,.9);arrow(x+188*s,y,225,0,GOLD,3,.9);
 text('尾侧较小',x-405,y-65,25,GOLD);text('头侧较大',x+455,y-65,25,GOLD);
 // 仅在单独一条基线上画净力，避免与流线混淆。
 arrow(735,665,440*ramp(t,70,72),0,INK,5,.95);
 text('接触线张力的向前合力',960,724,29,INK);
 text('示意忽略侧向细节；总运动还受水动力影响',960,786,22,DIM);
 c.restore();
}
function accelerate(t){
 const u=ramp(t,75,81);const x=650+u*600,y=440,s=mix(1.75,1.25,u);
 concentrationField(x,y,s,t,.65);water(x,y,s,t,1);release(x-147*s,y,s,t,1,true);boat(x,y,s,t);
 const a=1-ramp(t,78,80);c.save();c.globalAlpha=a;
 arrow(x+190*s,y,170,0,INK,3,.9);text('驱动',x+260,y-45,24,INK);
 arrow(x-110*s,y+110,-110,0,DIM,2,.9);text('水动力阻力',x-250,y+160,23,DIM);c.restore();
}
function exhaustion(t){
 const q=ramp(t,82,98),supply=1-q;
 const elapsed=clamp(t-81,0,17);const x=780+400*(1-Math.exp(-elapsed/7))/(1-Math.exp(-17/7)),y=425,s=1.6;
 water(x,y,s,t,.15+supply*.7);concentrationField(x,y,s,t,supply*.75);release(x-147*s,y,s,t,supply*.7,true);boat(x,y,s,t,supply);
 text('供给减弱 → 梯度变小 → 驱动衰减',960,216,33,INK,true);
 // 表盘是机制的相对量，非实验读数，不显示虚假的物理单位。
 bars(350,695,supply,'樟脑供给');bars(845,695,Math.pow(supply,1.1),'张力差');bars(1335,695,Math.sqrt(supply),'运动速度');
 text('相对量示意 · 耗尽过程时间压缩 · 真实运动可能振荡或转向',960,779,22,DIM);
}
function energy(t){
 const p=ramp(t,100,108),s=mix(1.3,1.05,p),x=mix(1180,960,p),y=mix(430,385,p);
 water(x,y,s,t,.14);boat(x,y,s,t,.06);ring(x,y,650,260,FLOW,.08);
 if(t<108){text('小船 · 水 · 空气',960,705,29,DIM);return}
 const a=ramp(t,EVENTS.energy,EVENTS.energy+1.2);c.save();c.globalAlpha=a;
 const labels=[['樟脑','化学自由能'],['界面','张力梯度'],['小船与水','运动'],['环境','耗散']];
 const xs=[390,770,1150,1530];
 for(let i=0;i<4;i++){
  const xx=xs[i];ring(xx,622,56,56,i===3?DIM:GOLD,.4,1.1);
  if(i===0)crystal(xx,622,1.05,t,.8);
  if(i===1){for(let k=0;k<5;k++)line(xx-30,606+k*8,xx+30,606+k*8,GOLD,1,.2+k*.14)}
  if(i===2){arrow(xx-25,622,50,0,INK,2)}
  if(i===3){for(let k=0;k<7;k++){const ang=k/7*6.283,rr=25+Math.sin(t+k)*5;line(xx+Math.cos(ang)*rr,622+Math.sin(ang)*rr,xx+Math.cos(ang)*(rr+14),622+Math.sin(ang)*(rr+14),DIM,1,.7)}}
  text(labels[i][0],xx,710,24,INK);text(labels[i][1],xx,752,23,DIM);
  if(i<3){arrow(xx+80,622,210,0,GOLD,1.2,.35);
   for(let j=0;j<3;j++){const ph=(t*.35+j/3+i*.18)%1;c.fillStyle=GOLD;c.globalAlpha=a*(.4+.4*Math.sin(ph*Math.PI));c.beginPath();c.arc(xx+80+ph*200,622,3,0,6.283);c.fill();c.globalAlpha=a}
  }
 }
 text('持续供给，才有持续的不均匀',960,208,36,INK,true);
 c.restore();
}
function closing(t){
 const x=960,y=368,s=1.12;water(x,y,s,t,.18);boat(x,y,s,t,.03);
 text('没有发动机，谁在推这艘船？',960,180,42,INK,true);
 line(580,570,1340,570,GOLD,1,.35);
 text('参考资料',960,615,23,GOLD);
 text('Suematsu et al. · J. Phys. Chem. C 114, 9876–9882 (2010)',960,665,24,DIM);
 text('Lauga & Davis · Viscous Marangoni propulsion · JFM 705 (2012)',960,709,24,DIM);
 text('机制与轨迹为示意，非定量实验复现；不是永动机。',960,770,23,DIM);
}
function sceneFor(t){
 if(t<10)return opening;if(t<21)return discovery;if(t<30)return molecular;if(t<43)return fieldScene;if(t<55.6)return tensionScene;if(t<66)return marangoni;if(t<75)return forces;if(t<81)return accelerate;if(t<100)return exhaustion;if(t<120)return energy;return closing;
}
function drawScene(t){
 c.clearRect(0,0,W,H);c.save();c.beginPath();c.rect(0,120,W,690);c.clip();
 // 内容相联的过渡：短暂叠化在相同船体/界面道具上，无模板擦屏。
 const bounds=[10,21,30,43,55.6,66,75,81,100,120];const b=bounds.find(v=>Math.abs(t-v)<.42);
 if(b){const k=ramp(t,b-.42,b+.42);c.save();c.globalAlpha=1-k;sceneFor(b-.5)(t);c.restore();c.save();c.globalAlpha=k;sceneFor(b+.5)(t);c.restore()}else sceneFor(t)(t);
 c.restore();
}
const $=id=>document.getElementById(id);
function drawOverlay(t){
 const title=t>=18&&t<21;const sub=SUBTITLES.find(s=>t>=s[0]&&t<s[1]);
 if(sub&&!title){const a=env(t,sub[0],sub[1],.28);$('subtitle').textContent=sub[2];$('subtitle-en').textContent=sub[3];$('subtitle').style.opacity=a;$('subtitle-en').style.opacity=a*.94}
 else{$('subtitle').textContent='';$('subtitle-en').textContent=''}
 const tc=$('titlecard');tc.style.display=title?'flex':'none';if(title){tc.style.opacity=env(t,18,21,.4);tc.querySelector('.name').textContent='《没有发动机，谁在推这艘船？》';tc.querySelector('.q').textContent='樟脑小船 · 水面上的非平衡之旅';tc.querySelector('.q-en').textContent='A tiny boat. A hidden surface force.'}
 const sec=t<10?'':t<21?'01　秘密在船尾':t<30?'02　分子如何散开':t<43?'03　看不见的浓度场':t<55.6?'04　同一水面，不同张力':t<66?'05　界面开始流动':t<81?'06　流动与受力':t<100?'07　有限的供给':t<120?'08　能量从哪里来':'';
 $('toplabel').textContent=sec;
 $('annotation').textContent=title||t<10||t>120?'':t<30?'微观与尺度为示意':t<43?'浓度场与关系曲线为机制示意':t<55.6?'γ：表面张力　｜　无伪造实测数值':t<81?'灰蓝虚线：界面流　／　金色：接触线力　／　米白：净驱动':t<100?'耗尽过程时间压缩，非实验时间记录':'化学自由能 → 界面驱动 → 运动与耗散';
 // 片尾整体只淡最后0.35秒，保留结论充分阅读时间。
 const end=1-ramp(t,124.65,125);document.getElementById('stage').style.opacity=end;
}
window.render=t=>{t=clamp(t,0,125);drawBG(t);drawScene(t);drawOverlay(t)};
window.selftest=()=>[
 {name:'subtitle durations',ok:SUBTITLES.every(s=>s[1]-s[0]>=2.5)},
 {name:'subtitle single line width',ok:SUBTITLES.every(s=>{c.font='700 45px FilmSans';return c.measureText(s[2]).width<1740})},
 {name:'no persistent VIBE label',ok:!document.getElementById('watermark')},
 {name:'fixed timeline',ok:SUBTITLES[SUBTITLES.length-1][1]<=125},
];
let t0=performance.now();(function loop(){if(window.__RENDER_MODE__)return;window.render(((performance.now()-t0)/1000)%125);requestAnimationFrame(loop)})();
