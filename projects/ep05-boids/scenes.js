import * as THREE from './vendor/three.module.min.js';
'use strict';
const W=1920,H=1080,VH=900,INK='#ede4d3',GOLD='#c9a96a',CYAN='#80c9e2',DIM='#98a8b4';
const $=id=>document.getElementById(id),c=$('scene').getContext('2d'),bc=$('bg').getContext('2d');
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),mix=(a,b,k)=>a+(b-a)*k;
const ease=x=>(x=clamp(x),x*x*(3-2*x)),ramp=(t,a,b)=>ease((t-a)/(b-a));
const vec=a=>new THREE.Vector3(...a),ZERO=new THREE.Vector3();
const renderer=new THREE.WebGLRenderer({canvas:$('world'),antialias:true,alpha:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});
renderer.setPixelRatio(1);renderer.setSize(W,VH,false);renderer.setClearColor(new THREE.Color().setRGB(.018,.032,.060),1);renderer.outputColorSpace=THREE.LinearSRGBColorSpace;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(43,W/VH,.25,1500);
const target=new THREE.WebGLRenderTarget(W,VH,{depthBuffer:true,stencilBuffer:false});target.depthTexture=new THREE.DepthTexture(W,VH,THREE.UnsignedShortType);
const postScene=new THREE.Scene(),postCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
const postMaterial=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{image:{value:target.texture},depth:{value:target.depthTexture},texel:{value:new THREE.Vector2(1/W,1/VH)},near:{value:.25},far:{value:1500},focus:{value:100},blur:{value:1.1}},vertexShader:`varying vec2 uv0;void main(){uv0=uv;gl_Position=vec4(position.xy,0.,1.);}`,fragmentShader:`
 precision highp float;varying vec2 uv0;uniform sampler2D image,depth;uniform vec2 texel;uniform float near,far,focus,blur;
 float distanceAt(vec2 uv){float z=texture2D(depth,uv).x*2.-1.;return 2.*near*far/(far+near-z*(far-near));}
 void main(){vec3 col=texture2D(image,uv0).rgb;float d=distanceAt(uv0);float coc=clamp(abs(d-focus)/max(focus,1.)-.28,0.,1.);vec2 r=texel*coc*blur;
 vec3 soft=col*.5;soft+=texture2D(image,uv0+vec2(r.x,0)).rgb*.125;soft+=texture2D(image,uv0-vec2(r.x,0)).rgb*.125;soft+=texture2D(image,uv0+vec2(0,r.y)).rgb*.125;soft+=texture2D(image,uv0-vec2(0,r.y)).rgb*.125;
 col=mix(col,soft,coc*.7);vec3 halo=max(soft-vec3(.64),vec3(0.));col+=halo*.09;
 vec2 q=uv0-.5;float vignette=1.-.26*dot(q*vec2(1.,.85),q*vec2(1.,.85));gl_FragColor=vec4(col*vignette,1.);}`});
postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),postMaterial));
// 真正的立体简化鸟体：身体、尾羽、左右翼。翼角只控制外观，不控制质点运动。
function birdGeometry(){
 const vertices=[],shades=[];
 function tri(a,b,d,s){vertices.push(...a,...b,...d);shades.push(s,s,s)}
 tri([0,.10,.62],[-.11,0,-.30],[.11,0,-.30],.95);
 tri([0,.10,.62],[.11,0,-.30],[0,-.09,.2],.66);
 tri([0,.10,.62],[0,-.09,.2],[-.11,0,-.30],.58);
 tri([-.11,0,-.30],[0,0,-.72],[.11,0,-.30],.72);
 for(const side of [-1,1]){
  const a=[side*.06,.02,.20],b=[side*.66,.035,.08],d=[side*1.65,0,-.42],e=[side*.72,-.02,-.30],f=[side*.08,-.02,-.22];
  tri(a,b,e,.98);tri(b,d,e,.87);tri(a,e,f,.75);
 }
 const g=new THREE.InstancedBufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setAttribute('shade',new THREE.Float32BufferAttribute(shades,1));return g;
}
const uniforms={time:{value:0},demo:{value:0},turnColor:{value:0},sepDemo:{value:0},focusDepth:{value:100}};
const birdMaterial=new THREE.ShaderMaterial({side:THREE.DoubleSide,uniforms,vertexShader:`
 precision highp float;attribute vec3 iPosition,iVelocity;attribute float shade,iSeed,iWeight,iGold,iTurn,iBank;uniform float time,demo;varying float vShade,vWeight,vGold,vTurn,vDepth;
 void main(){vec3 f=normalize(iVelocity+vec3(.000001,0.,0.));vec3 ref=abs(f.y)>.94?vec3(0.,0.,1.):vec3(0.,1.,0.);vec3 right=normalize(cross(f,ref));vec3 up=normalize(cross(right,f));
 float bank=iBank;vec3 rr=right*cos(bank)+up*sin(bank);vec3 uu=up*cos(bank)-right*sin(bank);
 vec3 p=position;float phase=time*(23.+iSeed*9.)+iSeed*63.;float flap=sin(phase);float wing=abs(p.x);p.y+=flap*wing*.32;p.x*=1.-.15*(1.-cos(phase))*wing/1.65;
 float size=mix(.48,1.32,demo)*(.90+iSeed*.20);vec3 world=iPosition+(rr*p.x+uu*p.y+f*p.z)*size;vec4 view=modelViewMatrix*vec4(world,1.);gl_Position=projectionMatrix*view;
 vShade=shade*(.78+.22*max(dot(uu,normalize(vec3(-.3,.85,.7))),0.));vWeight=iWeight;vGold=iGold;vTurn=iTurn;vDepth=-view.z;}`,
 fragmentShader:`precision highp float;uniform float turnColor,focusDepth,sepDemo;varying float vShade,vWeight,vGold,vTurn,vDepth;
 void main(){vec3 silver=vec3(.86,.92,.98);vec3 highlight=mix(vec3(.36,.80,.98),vec3(.94,.43,.25),sepDemo);vec3 col=mix(silver,highlight,smoothstep(.18,.88,vTurn)*turnColor);col=mix(col,vec3(.94,.73,.37),vGold);
 float fog=1.-exp(-max(0.,vDepth-20.)*.0028);col=mix(col,vec3(.028,.053,.082),fog*.72);col*=vShade*vWeight;gl_FragColor=vec4(col,1.);}`});
let meta,replay,focusData,demos,N,geometry,birds,ready=false;
let positions,velocities,weights,golds,turns,banks,seeds;
const sphere=new THREE.Mesh(new THREE.SphereGeometry(1,32,20),new THREE.MeshBasicMaterial({color:0x557b98,transparent:true,opacity:.035,depthWrite:false,side:THREE.DoubleSide}));
const ringPoints=[];
for(let plane=0;plane<3;plane++)for(let k=0;k<72;k++)for(const i of [k,k+1]){let a=i/72*Math.PI*2,p=[Math.cos(a),Math.sin(a),0];if(plane===1)p=[p[0],0,p[1]];if(plane===2)p=[0,p[0],p[1]];ringPoints.push(...p)}
const ringGeometry=new THREE.BufferGeometry();ringGeometry.setAttribute('position',new THREE.Float32BufferAttribute(ringPoints,3));
const sphereWire=new THREE.LineSegments(ringGeometry,new THREE.LineBasicMaterial({color:0x7fc9e0,transparent:true,opacity:.10,depthWrite:false}));
scene.add(sphere,sphereWire);
const linkPositions=new Float32Array(16*6),linkGeometry=new THREE.BufferGeometry();linkGeometry.setAttribute('position',new THREE.BufferAttribute(linkPositions,3));
const links=new THREE.LineSegments(linkGeometry,new THREE.LineBasicMaterial({color:0x8fd2e6,transparent:true,opacity:.48,depthWrite:false}));scene.add(links);
const obstacleMaterial=new THREE.ShaderMaterial({vertexShader:`varying vec3 n,p;void main(){n=normalMatrix*normal;p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec3 n,p;void main(){vec3 nn=normalize(n);float light=max(0.,dot(nn,normalize(vec3(-.6,.8,1.))));float rim=pow(1.-abs(nn.z),2.);vec3 col=vec3(.028,.065,.10)+light*vec3(.12,.19,.24)+rim*vec3(.24,.47,.60);gl_FragColor=vec4(col,1.);}`});
const obstacle=new THREE.Mesh(new THREE.SphereGeometry(7,48,32),obstacleMaterial);scene.add(obstacle);
const obstacleWire=new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.SphereGeometry(7.025,20,12)),new THREE.LineBasicMaterial({color:0x6ba6bf,transparent:true,opacity:.14}));scene.add(obstacleWire);
// 短轨迹逐段采样同一计算回放，未用装饰曲线替代群体动力学。
const TRAILS=900,SEG=5,trailPositions=new Float32Array(TRAILS*SEG*6),trailColors=new Float32Array(TRAILS*SEG*6),trailGeometry=new THREE.BufferGeometry();
trailGeometry.setAttribute('position',new THREE.BufferAttribute(trailPositions,3));trailGeometry.setAttribute('color',new THREE.BufferAttribute(trailColors,3));
const trailMaterial=new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.22,blending:THREE.AdditiveBlending,depthWrite:false});const trails=new THREE.LineSegments(trailGeometry,trailMaterial);scene.add(trails);
const debugLines=new THREE.Group();scene.add(debugLines);
function capTime(t){return clamp(t,0,125)}
function indexTime(t){const x=capTime(t)*meta.cache_hz;return[Math.min(Math.floor(x),meta.cache_frames-2),x-Math.floor(x)]}
function sample(id,t,pOut=new THREE.Vector3(),vOut=null){
 const [frame,k]=indexTime(t),stride=N*7,a=frame*stride+id*7,b=a+stride,dt=1/meta.cache_hz;
 const k2=k*k,k3=k2*k,h00=2*k3-3*k2+1,h10=k3-2*k2+k,h01=-2*k3+3*k2,h11=k3-k2;
 for(let j=0;j<3;j++){
  const p0=replay[a+j]/128,p1=replay[b+j]/128,v0=replay[a+3+j]/1024,v1=replay[b+3+j]/1024;
  pOut.setComponent(j,h00*p0+h10*dt*v0+h01*p1+h11*dt*v1);
  if(vOut)vOut.setComponent(j,mix(v0,v1,k));
 }return pOut;
}
function sampleTurn(id,t){const[f,k]=indexTime(t);return mix(replay[f*N*7+id*7+6],replay[(f+1)*N*7+id*7+6],k)/32767}
function telemetry(t){const f=Math.min(meta.focus_frames-1,Math.round(capTime(t)*60)),base=f*17*8,out=[];
 for(let j=0;j<17;j++){const b=base+j*8,id=Math.round(focusData[b]);if(id<0)continue;out.push({id,p:vec(Array.from(focusData.subarray(b+1,b+4))),v:vec(Array.from(focusData.subarray(b+4,b+7))),turn:focusData[b+7]})}return out;
}
const ptemp=new THREE.Vector3(),vtemp=new THREE.Vector3(),ptemp2=new THREE.Vector3();
function localAmount(t){return t>=12&&t<28?ramp(t,12,15):t>=65&&t<72?1-ramp(t,68,72):0}
function updateFlock(t,local){
 let center=new THREE.Vector3(),lo=new THREE.Vector3(1e6,1e6,1e6),hi=new THREE.Vector3(-1e6,-1e6,-1e6);
 for(let i=0;i<N;i++){
  sample(i,t,ptemp,vtemp);positions.set(ptemp.toArray(),i*3);velocities.set(vtemp.toArray(),i*3);weights[i]=mix(1,.15,localAmount(t));golds[i]=0;turns[i]=sampleTurn(i,t);
  // 倾斜取自实际速度差，外观不反馈至模拟。
  sample(i,Math.min(125,t+.12),ptemp2);const tangent=ptemp2.sub(ptemp).sub(vtemp.clone().multiplyScalar(.12));const right=new THREE.Vector3().crossVectors(vtemp,new THREE.Vector3(0,1,0)).normalize();banks[i]=clamp(tangent.dot(right)*3,-.5,.5);
  center.add(ptemp);lo.min(ptemp);hi.max(ptemp);
 }
 center.divideScalar(N);
 let observed=telemetry(t);
 if(local){
  for(const a of observed){positions.set(a.p.toArray(),a.id*3);velocities.set(a.v.toArray(),a.id*3);weights[a.id]=1;golds[a.id]=a.id===meta.focus_id?1:0;turns[a.id]=a.turn/meta.max_turn_rad_s;}
  const lead=observed[0];sphere.position.copy(lead.p);sphereWire.position.copy(lead.p);sphere.scale.setScalar(meta.neighbor_radius);sphereWire.scale.copy(sphere.scale);
  sphere.visible=sphereWire.visible=true;sphere.material.opacity=.035*localAmount(t);sphereWire.material.opacity=.10*localAmount(t);links.material.opacity=.48*localAmount(t);
  for(let j=1;j<observed.length;j++){linkPositions.set(lead.p.toArray(),(j-1)*6);linkPositions.set(observed[j].p.toArray(),(j-1)*6+3)}
  linkGeometry.setDrawRange(0,(observed.length-1)*2);linkGeometry.attributes.position.needsUpdate=true;links.visible=true;
 }else{sphere.visible=sphereWire.visible=links.visible=false;}
 geometry.instanceCount=N;
 return{center,lo,hi,observed};
}
function updateTrails(t,local,observed){
 let ids=local?observed.map(x=>x.id):Array.from({length:800},(_,i)=>i*4),cursor=0;
 const a=new THREE.Vector3(),b=new THREE.Vector3();
 for(const id of ids){for(let k=0;k<SEG;k++){
  sample(id,Math.max(0,t-k*.065),a);sample(id,Math.max(0,t-(k+1)*.065),b);trailPositions.set(a.toArray(),cursor);trailPositions.set(b.toArray(),cursor+3);
  let power=(1-k/SEG)*(local?1.:.60);for(let v=0;v<2;v++){trailColors[cursor+v*3]=.23*power;trailColors[cursor+v*3+1]=.68*power;trailColors[cursor+v*3+2]=.87*power;}cursor+=6;
 }}trailGeometry.setDrawRange(0,cursor/3);trailGeometry.attributes.position.needsUpdate=true;trailGeometry.attributes.color.needsUpdate=true;trails.visible=true;
 trailMaterial.opacity=local?.37:t>=65&&t<88?.30:.20;
}
function obstaclePos(t){let lift=t<88?60:t<91?60*(1-(t-88)/3):t<106?0:Math.min(60,(t-106)*15);return vec(meta.obstacle_target).add(new THREE.Vector3(0,lift,0))}
function exactFit(center,azimuth,elevation){
 const offset=new THREE.Vector3(Math.sin(azimuth)*Math.cos(elevation),Math.sin(elevation),Math.cos(azimuth)*Math.cos(elevation));
 const right=new THREE.Vector3(Math.cos(azimuth),0,-Math.sin(azimuth)),up=new THREE.Vector3().crossVectors(offset,right);let distance=40;
 const tan=Math.tan(43*Math.PI/360),aspect=camera.aspect;
 for(let i=0;i<N;i++){const p=ptemp.set(positions[i*3],positions[i*3+1],positions[i*3+2]).sub(center),depth=p.dot(offset);distance=Math.max(distance,depth+(Math.abs(p.dot(right))+1)/(tan*aspect*.82),depth+(Math.abs(p.dot(up))+1)/(tan*.79));}
 return distance;
}
function cameraFlock(t,state){
 let center=state.center.clone(),focus=state.observed[0],distance,azimuth,elevation,local=(t>=12&&t<28)||(t>=65&&t<70);
 const extent=state.hi.clone().sub(state.lo),fit=Math.max(extent.y*1.9,extent.z*1.40,extent.x*1.10,100);
 if(t<12){azimuth=mix(.50,1.05,ramp(t,0,12));elevation=.24+Math.sin(t*.11)*.10;distance=exactFit(center,azimuth,elevation)*mix(.84,1.0,ramp(t,1,11));}
 else if(t<28){let k=ramp(t,12,15);const farDistance=exactFit(center,1.05,.34);center.lerp(focus.p,k);distance=Math.exp(mix(Math.log(farDistance),Math.log(22),k));azimuth=mix(1.05,.65,k)+.12*Math.sin(Math.max(0,t-15)*.10);elevation=mix(.34,.49,k);}
 else if(t<88){
  let k=ramp(t,65,77);center.lerp(focus.p,1-k);azimuth=.65+1.0*k; elevation=.49-.07*k;
  const fitted=exactFit(state.center,azimuth,elevation);distance=Math.exp(mix(Math.log(22),Math.log(fitted),k));
  if(t>=78){let pass=ramp(t,78,82)*(1-ramp(t,83,87));distance*=1-.48*pass;azimuth+=ramp(t,78,87)*1.6;elevation+=pass*.14;}
 }else if(t<109){azimuth=.72;elevation=.36;let close=ramp(t,92,95)*(1-ramp(t,99,104));const fitted=exactFit(center,azimuth,elevation);center.lerp(obstaclePos(t),close*.45);distance=fitted*mix(1.04,.65,close);}
 else{azimuth=.72+.20*ramp(t,109,125);elevation=.36;distance=exactFit(center,azimuth,elevation)*(1.04+.12*ramp(t,109,125));}
 const offset=new THREE.Vector3(Math.sin(azimuth)*Math.cos(elevation),Math.sin(elevation),Math.cos(azimuth)*Math.cos(elevation)).multiplyScalar(distance);
 camera.position.copy(center).add(offset);camera.up.set(0,1,0);camera.lookAt(center);camera.updateMatrixWorld();postMaterial.uniforms.focus.value=distance;postMaterial.uniforms.blur.value=local?.65:1.45;
 return{center,distance,local};
}
function clearDebug(){while(debugLines.children.length){const x=debugLines.children.pop();x.geometry?.dispose();x.material?.dispose();x.parent=null}}
function addLine(a,b,color,opacity=.75){const g=new THREE.BufferGeometry().setFromPoints([a,b]),m=new THREE.LineBasicMaterial({color,transparent:true,opacity,depthWrite:false});debugLines.add(new THREE.Line(g,m))}
function addArrow(a,v,color,scale=1){let length=v.length()*scale;if(length<.03)return;let dir=v.clone().normalize(),tip=a.clone().addScaledVector(dir,length);addLine(a,tip,color,.88);let side=new THREE.Vector3().crossVectors(dir,new THREE.Vector3(0,1,0)).normalize().multiplyScalar(Math.min(.5,length*.22));addLine(tip,tip.clone().addScaledVector(dir,-.7).add(side),color);addLine(tip,tip.clone().addScaledVector(dir,-.7).sub(side),color)}
function demoState(kind,t){const d=demos[kind],idx=clamp(t*d.fps,0,d.frames.length-1),i=Math.floor(idx),j=Math.min(i+1,d.frames.length-1),k=idx-i;
 const a=d.frames[i],b=d.frames[j],inter=name=>a[name].map((p,id)=>p.map((x,axis)=>mix(x,b[name][id][axis],k)));
 return{...d,p:inter('p'),v:inter('v'),a:inter('a'),centers:inter('centers'),neighbors:a.neighbors};
}
function updateDemo(t){
 let start=t<40?28:t<52?40:52,kind=t<40?'separation':t<52?'alignment':'cohesion',state=demoState(kind,t-start),center=new THREE.Vector3();
 for(const p of state.p)center.add(vec(p));center.divideScalar(state.count);
 sphere.visible=sphereWire.visible=links.visible=trails.visible=obstacle.visible=obstacleWire.visible=false;geometry.instanceCount=state.count;
 for(let i=0;i<state.count;i++){
  positions.set(state.p[i],i*3);velocities.set(state.v[i],i*3);weights[i]=1;golds[i]=kind==='cohesion'&&i===0?1:0;turns[i]=0;banks[i]=0;
  const p=vec(state.p[i]),v=vec(state.v[i]),a=vec(state.a[i]);
  if(kind==='separation'){
   let distance=p.distanceTo(vec(state.p[1-i]));if(distance<state.radius){golds[i]=0;turns[i]=1;addArrow(p,a,0xdf8f67,5.0);}
  }else if(kind==='alignment')addArrow(p,v,0x80c9e2,2.0);
 }
 if(kind==='cohesion'){
  const target=vec(state.centers[0]),p=vec(state.p[0]);for(const id of state.neighbors[0])addLine(p,vec(state.p[id]),0xa7b9c5,.12);
  addLine(p,target,0xc9a96a,.75);addArrow(p,vec(state.a[0]),0xc9a96a,9);
  const s=.45;addLine(target.clone().add(new THREE.Vector3(-s,0,0)),target.clone().add(new THREE.Vector3(s,0,0)),0xc9a96a,1);addLine(target.clone().add(new THREE.Vector3(0,0,-s)),target.clone().add(new THREE.Vector3(0,0,s)),0xc9a96a,1);
 }
 camera.position.copy(center).add(new THREE.Vector3(0,17,13));camera.up.set(0,1,0);camera.lookAt(center);camera.updateMatrixWorld();postMaterial.uniforms.focus.value=21.4;postMaterial.uniforms.blur.value=.35;
 uniforms.demo.value=kind==='cohesion'?.12:kind==='alignment'?.8:1;uniforms.turnColor.value=kind==='separation'?1:0;uniforms.sepDemo.value=kind==='separation'?1:0;
 return{demo:kind,center,state};
}
function project(p){const q=p.clone().project(camera);return{x:(q.x*.5+.5)*W,y:(-.5*q.y+.5)*VH,z:q.z}}
function text(s,x,y,size=40,color=INK,serif=false,align='center',bold=false){c.save();c.font=`${bold?'700':'400'} ${size}px ${serif?'FilmSerif':'FilmSans'}`;c.textAlign=align;c.textBaseline='middle';c.fillStyle=color;c.fillText(s,x,y);c.restore()}
function line2(a,b,col=CYAN,alpha=.6){c.save();c.globalAlpha=alpha;c.strokeStyle=col;c.lineWidth=1.4;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();c.restore()}
function background(t){bc.fillStyle='#06090e';bc.fillRect(0,0,W,H)}
function overlay(t,info){
 c.clearRect(0,0,W,H);
 // Chromium连续截图时可能保留刚变为全透明的Canvas旧合成层。
 // 在本来就相同颜色的字幕背景边角写入一像素，确保空标注层也提交新画面。
 c.fillStyle='#06090e';c.fillRect(0,H-1,1,1);
 // 收束段没有任何画布标注：直接隐藏该合成层，避免空层缓存残留旧HUD。
 $('scene').style.visibility=t>=109&&t<120.4?'hidden':'visible';
 const local=(t>=12&&t<28)||(t>=65&&t<70),isDemo=t>=28&&t<65;
 if(t<12){c.save();c.globalAlpha=ramp(t,.4,1.5)*(1-ramp(t,11,12));text('没有指挥官，鸟群如何一起转弯？',960,100,55,INK,true);c.restore();}
 if(local){
  const a=info.observed[0],p=project(a.p),label={x:1420,y:235};line2({x:p.x+35,y:p.y-16},{x:label.x-70,y:label.y+65},GOLD,.55);
  text('观察一只',label.x,label.y,55,GOLD,true);text('只回应附近的伙伴',label.x,label.y+66,39,INK);
  text('球面：感知距离',475,210,38,DIM);text('连线：实际参与计算',475,263,38,CYAN);
 }
 if(isDemo){const kind=info.demo,lt=t-(kind==='separation'?28:kind==='alignment'?40:52);c.save();c.globalAlpha=ramp(lt,1.4,2.4);
  text(kind==='separation'?'分离':kind==='alignment'?'对齐':'聚合',960,110,82,kind==='separation'?'#dc9475':kind==='alignment'?CYAN:GOLD,true);
  text(kind==='separation'?'SEPARATION':kind==='alignment'?'ALIGNMENT':'COHESION',960,193,28,DIM);c.restore();
  if(kind==='cohesion'&&lt>2){let point=project(vec(info.state.centers[0]));text('这只个体的邻居平均位置',1440,260,38,GOLD);line2(point,{x:1320,y:295},GOLD,.6);}
  if(kind==='separation')text('橙色箭头：实际排斥加速度',960,790,36,'#d6977a');
  if(kind==='alignment')text('青色箭头：实际速度方向',960,790,36,CYAN);
 }
 if(t>=77.5&&t<87){let a=ramp(t,77.5,78.5)*(1-ramp(t,86,87));c.save();c.globalAlpha=a;text('涌现',350,130,86,INK,true);text('E M E R G E N C E',350,215,29,CYAN);c.restore();}
 if(t>=88&&t<109){text('新增：局部避障',960,100,55,INK,true);c.fillStyle='rgba(6,9,14,.78)';c.beginPath();c.roundRect(1240,170,430,140,12);c.fill();text('颜色对应实际转向幅度',1450,205,36,CYAN);
  const x=1300,y=248,w=300;for(let i=0;i<w;i++){c.fillStyle=`rgb(${mix(184,92,i/w)},${mix(202,205,i/w)},${mix(219,245,i/w)})`;c.fillRect(x+i,y,1,8)}text('小',x,y+35,27,DIM);text('大',x+w,y+35,27,CYAN);
 }
 if(t>=120.4){c.save();c.globalAlpha=ramp(t,120.4,121.3);text('局部互动，整体秩序',960,740,65,INK,true);text('Boids · Craig Reynolds',960,815,30,DIM);c.restore();}
 const sub=SUBTITLES.find(s=>t>=s[0]&&t<s[1]);
 if(sub){let alpha=ramp(t,sub[0],sub[0]+.25)*(1-ramp(t,sub[1]-.25,sub[1]));$('subtitle').textContent=sub[2];$('subtitle-en').textContent=sub[3];$('subtitle').style.opacity=alpha;$('subtitle-en').style.opacity=alpha*.95}else{$('subtitle').textContent='';$('subtitle-en').textContent=''}
 $('titlecard').style.display='none';$('toplabel').textContent='';
 $('annotation').textContent=isDemo?'单条规则示意 · 独立局部实验':t>=108?'基于Boids的简化群集演示；真实鸟群还受感知、环境与个体差异等因素影响。':local?'模型示意 · 感知范围内最近的16位邻居 · 环境含软边界约束':t>=88?'模型示意 · 三条群集规则＋局部避障 · 环境含软边界约束':`Boids简化群集模拟 · ${meta.count}个体 · 环境含软边界约束`;
 $('stage').style.opacity=1-ramp(t,124.5,125);
}
let lastInfo=null;
window.render=t=>{
 if(!ready)throw new Error('assets not ready');t=clamp(t,0,125);background(t);clearDebug();
 let info;
 if(t>=28&&t<65){info=updateDemo(t)}else{
  const local=(t>=12&&t<28)||(t>=65&&t<72);info=updateFlock(t,local);cameraFlock(t,info);updateTrails(t,local,info.observed);
  let visible=t>=88&&t<110;obstacle.visible=obstacleWire.visible=visible;obstacle.position.copy(obstaclePos(t));obstacleWire.position.copy(obstacle.position);
  uniforms.demo.value=0;uniforms.turnColor.value=t>=88&&t<109?1:0;uniforms.sepDemo.value=0;
 }
 uniforms.time.value=t;
 for(const name of ['iPosition','iVelocity','iWeight','iGold','iTurn','iBank'])geometry.attributes[name].needsUpdate=true;
 renderer.setRenderTarget(target);renderer.render(scene,camera);renderer.setRenderTarget(null);renderer.render(postScene,postCamera);overlay(t,info);lastInfo=info;
};
window.audit=t=>{window.render(t);let info=lastInfo;
 if(info.demo){const d=info.state;return{type:'single rule',rule:info.demo,n:d.count,neighbors:d.neighbors,positions:d.p,velocities:d.v,accelerations:d.a,centers:d.centers};}
 const xs=info.observed,lead=xs[0];return{type:'flock',n:N,focusId:lead.id,neighborIds:xs.slice(1).map(x=>x.id),distances:xs.slice(1).map(x=>x.p.distanceTo(lead.p)),maxRadius:meta.neighbor_radius,sphere:obstacle.visible?obstacle.position.toArray():null};
};
window.selftest=()=>{
 const results=[{name:'3200 simulated agents',ok:N===3200},{name:'cache sample count and binary lengths',ok:replay.length===meta.cache_frames*N*7&&focusData.length===meta.focus_frames*17*8},{name:'no global goal or assigned trajectories',ok:meta.global_goal===false&&meta.predefined_agent_trajectories===false},{name:'observed angular bound',ok:meta.observed_max_turn_rad_s<=meta.max_turn_rad_s+.00001},{name:'observed acceleration bound',ok:meta.observed_max_acceleration<=meta.max_acceleration+.05},{name:'no sphere penetration',ok:meta.minimum_obstacle_surface_distance>.45}];
 c.font='700 64px FilmSans';results.push({name:'subtitles fit 1760px',ok:SUBTITLES.every(s=>c.measureText(s[2]).width<1760)},{name:'reading time >=2.5s',ok:SUBTITLES.every(s=>s[1]-s[0]>=2.5)},{name:'no fixed watermark',ok:!$('watermark')});
 let local=true;for(const t of [12,15,20,25,27.9,65,68,69.9]){const s=telemetry(t),p=s[0].p;if(s.length>17||new Set(s.map(x=>x.id)).size!==s.length||s.slice(1).some(x=>x.p.distanceTo(p)>meta.neighbor_radius+.001))local=false;}
 results.push({name:'only actual local neighbors highlighted/linked',ok:local});return results;
};
// 独立竖版封面：直接绘制同一模拟状态，不读取/编辑视频截图。
window.renderCover=height=>{
 height=height||1920;window.__RENDER_MODE__=true;const width=1080;$('scene').style.visibility='visible';
 for(const id of ['toplabel','annotation','subtitle','subtitle-en','titlecard','worldveil'])$(id).style.display='none';
 for(const node of [document.documentElement,document.body,$('stage')]){node.style.width=width+'px';node.style.height=height+'px';node.style.opacity=1;}
 for(const node of [$('bg'),$('scene')]){node.width=width;node.height=height;}
 $('world').style.width=width+'px';$('world').style.height=height+'px';renderer.setSize(width,height,false);target.setSize(width,height);postMaterial.uniforms.texel.value.set(1/width,1/height);
 camera.aspect=width/height;camera.updateProjectionMatrix();clearDebug();const t=85.2,state=updateFlock(t,false);updateTrails(t,false,state.observed);uniforms.demo.value=0;uniforms.sepDemo.value=0;uniforms.turnColor.value=0;uniforms.time.value=t;obstacle.visible=obstacleWire.visible=false;
 for(const name of ['iPosition','iVelocity','iWeight','iGold','iTurn','iBank'])geometry.attributes[name].needsUpdate=true;
 const az=1.75,el=.44,d=exactFit(state.center,az,el)*1.04;camera.position.copy(state.center).add(new THREE.Vector3(Math.sin(az)*Math.cos(el),Math.sin(el),Math.cos(az)*Math.cos(el)).multiplyScalar(d));camera.lookAt(state.center);camera.updateMatrixWorld();postMaterial.uniforms.focus.value=d;
 renderer.setRenderTarget(target);renderer.render(scene,camera);renderer.setRenderTarget(null);renderer.render(postScene,postCamera);
 bc.fillStyle='#06090e';bc.fillRect(0,0,width,height);c.clearRect(0,0,width,height);c.save();c.translate(0,-(1920-height)/2);
 text('没有指挥官',540,410,96,INK,false,'center',true);text('鸟群为何一起转弯？',540,540,77,GOLD,false,'center',true);
 text('局部规则，整体秩序',540,1500,57,INK,true);text('涌现 · Boids群集模型',540,1580,42,CYAN);text('3200个体 · 简化模型演示',540,1640,31,DIM);c.restore();
};
window.assetsReady=(async()=>{
 const files=await Promise.all(['sim/meta.json','sim/replay.bin','sim/focus.bin','sim/demos.json'].map(async name=>{const r=await fetch(name);if(!r.ok)throw new Error(name+': '+r.status);return name.endsWith('json')?r.json():r.arrayBuffer()}));
 [meta,replay,focusData,demos]=files;replay=new Int16Array(replay);focusData=new Float32Array(focusData);N=meta.count;
 positions=new Float32Array(N*3);velocities=new Float32Array(N*3);weights=new Float32Array(N);golds=new Float32Array(N);turns=new Float32Array(N);banks=new Float32Array(N);seeds=new Float32Array(N);
 for(let i=0;i<N;i++)seeds[i]=((Math.imul(i+1,1597334677)>>>0)%100003)/100003;
 geometry=birdGeometry();for(const[name,array,size]of [['iPosition',positions,3],['iVelocity',velocities,3],['iWeight',weights,1],['iGold',golds,1],['iTurn',turns,1],['iBank',banks,1],['iSeed',seeds,1]])geometry.setAttribute(name,new THREE.InstancedBufferAttribute(array,size));
 birds=new THREE.Mesh(geometry,birdMaterial);birds.frustumCulled=false;trails.frustumCulled=false;links.frustumCulled=false;scene.add(birds);ready=true;window.render(0);
 return{renderer:renderer.getContext().getParameter(renderer.getContext().RENDERER),count:N};
})();
// 预览用墙钟只选择回放时刻；离线导出总是调用纯时间入口。
window.assetsReady.then(()=>{const start=performance.now();function loop(now){if(window.__RENDER_MODE__)return;window.render((now-start)/1000%125);requestAnimationFrame(loop)}if(!window.__RENDER_MODE__)requestAnimationFrame(loop)});
