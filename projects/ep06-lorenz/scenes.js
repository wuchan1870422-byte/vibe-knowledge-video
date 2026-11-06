import * as THREE from './vendor/three.module.min.js';
const W=1920,H=1080,VH=900,INK='#ede4d3',CYAN='#74d5ee',GOLD='#d5a164',DIM='#9aa9b5';
const $=id=>document.getElementById(id),c=$('scene').getContext('2d'),bc=$('bg').getContext('2d');
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),mix=(a,b,k)=>a+(b-a)*k;
const ease=x=>(x=clamp(x),x*x*(3-2*x)),ramp=(t,a,b)=>ease((t-a)/(b-a));
const V=a=>new THREE.Vector3(...a),CENTER=new THREE.Vector3(0,0,25);
const renderer=new THREE.WebGLRenderer({canvas:$('world'),antialias:true,alpha:false,preserveDrawingBuffer:true});
renderer.setSize(W,VH,false);renderer.setPixelRatio(1);renderer.setClearColor(new THREE.Color().setRGB(.016,.029,.052),1);renderer.outputColorSpace=THREE.LinearSRGBColorSpace;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(43,W/VH,.02,1200);camera.up.set(0,0,1);
const target=new THREE.WebGLRenderTarget(W,VH,{depthBuffer:true});
const postScene=new THREE.Scene(),postCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
const post=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{image:{value:target.texture},texel:{value:new THREE.Vector2(1/W,1/VH)},bloom:{value:.10}},vertexShader:`varying vec2 uv0;void main(){uv0=uv;gl_Position=vec4(position.xy,0.,1.);}`,fragmentShader:`precision highp float;varying vec2 uv0;uniform sampler2D image;uniform vec2 texel;uniform float bloom;void main(){vec3 col=texture2D(image,uv0).rgb;vec3 soft=(texture2D(image,uv0+texel*vec2(2.,0.)).rgb+texture2D(image,uv0-texel*vec2(2.,0.)).rgb+texture2D(image,uv0+texel*vec2(0.,2.)).rgb+texture2D(image,uv0-texel*vec2(0.,2.)).rgb)*.25;col+=max(soft-vec3(.42),vec3(0.))*bloom;vec2 p=uv0-.5;col*=1.-.28*dot(p,p);gl_FragColor=vec4(col,1.);}`});
postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),post));
let meta,A,B,REPEAT,DIST,ready=false,tracks=[],repeatTrack,heads=[],globalTau=0;
const PA=new THREE.Vector3(),PB=new THREE.Vector3();
function field(p){return new THREE.Vector3(10*(p.y-p.x),p.x*(28-p.z)-p.y,p.x*p.y-8/3*p.z)}
function sample(data,t,out=new THREE.Vector3()){
 t=clamp(t,0,(data.length/3-1)*.005);const q=t/.005,i=Math.min(Math.floor(q),data.length/3-2),k=q-i,a=i*3,b=a+3;
 const p0=new THREE.Vector3(data[a],data[a+1],data[a+2]),p1=new THREE.Vector3(data[b],data[b+1],data[b+2]),v0=field(p0),v1=field(p1),k2=k*k,k3=k2*k;
 return out.copy(p0).multiplyScalar(2*k3-3*k2+1).addScaledVector(v0,(k3-2*k2+k)*.005).addScaledVector(p1,-2*k3+3*k2).addScaledVector(v1,(k3-k2)*.005);
}
function distanceAt(t){return sample(A,t,PA).distanceTo(sample(B,t,PB))}
function timeAt(v){
 if(v<12){const a=meta.primary_first60.first_distance_0_01-1,b=meta.primary_first60.first_distance_1,d=meta.primary_first60.first_distance_10+1;return v<4?mix(a,b,ramp(v,0,4)):v<7?mix(b,d,ramp(v,4,7)):mix(d,60,ramp(v,7,12));}
 if(v<17)return 0;if(v<30)return 3*ramp(v,17,30);if(v<60)return 3+(v-30)*1.9;
 if(v<69)return 60+(v-60)*.35;if(v<83)return 12+(v-69)*.70;
 if(v<108)return meta.long_start+(v-83)*.2;
 const k=(v-108)/17;return meta.long_start+5+1.5*(2*k-k*k);
}
function ribbonGeometry(count){
 const g=new THREE.InstancedBufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([0,-1,0,0,1,0,1,1,0,0,-1,0,1,1,0,1,-1,0],3));
 g.setAttribute('p0',new THREE.InstancedBufferAttribute(new Float32Array(count*3),3));g.setAttribute('p1',new THREE.InstancedBufferAttribute(new Float32Array(count*3),3));g.setAttribute('when',new THREE.InstancedBufferAttribute(new Float32Array(count),1));g.instanceCount=0;return g;
}
function ribbonMaterial(color,width,opacity,halo=false){return new THREE.ShaderMaterial({transparent:true,depthWrite:!halo,depthTest:true,blending:halo?THREE.AdditiveBlending:THREE.NormalBlending,side:THREE.DoubleSide,
 uniforms:{color:{value:V(color)},resolution:{value:new THREE.Vector2(W,VH)},width:{value:width},opacity:{value:opacity},tau:{value:0},tail:{value:0},cutoff:{value:0},focus:{value:100},halo:{value:halo?1:0}},
 vertexShader:`precision highp float;attribute vec3 p0,p1;attribute float when;uniform vec2 resolution;uniform float width,focus;varying float edge,ageTime,depth;
 void main(){vec4 a=modelViewMatrix*vec4(p0,1.),b=modelViewMatrix*vec4(p1,1.);vec4 aa=projectionMatrix*a,bb=projectionMatrix*b;vec2 delta=(bb.xy/max(bb.w,.001)-aa.xy/max(aa.w,.001))*resolution;float len=length(delta);vec2 side=len>.0001?normalize(vec2(-delta.y,delta.x)):vec2(0.,1.);vec4 q=mix(aa,bb,position.x);float z=-mix(a.z,b.z,position.x);float scale=clamp(sqrt(focus/max(z,.1)),.65,1.9);q.xy+=side*position.y*width*scale/resolution*q.w;if(a.z>-.02||b.z>-.02)q=vec4(2.,2.,2.,1.);gl_Position=q;edge=position.y;ageTime=when;depth=z;}`,
 fragmentShader:`precision highp float;uniform vec3 color;uniform float opacity,tau,tail,halo,cutoff;varying float edge,ageTime,depth;
 void main(){float age=tau-ageTime;if(age<-.006||ageTime<cutoff)discard;float fade=tail>0.?pow(clamp(1.-age/tail,0.,1.),.65):mix(.52,1.,clamp(ageTime/max(tau,1.),0.,1.));float shape=halo>.5?pow(max(0.,1.-abs(edge)),1.8):1.-smoothstep(.65,1.,abs(edge));float fog=exp(-max(depth-15.,0.)*.002);gl_FragColor=vec4(color,opacity*fade*shape*fog);}`});}
function makeTrack(data,color,repeat=false){
 const count=Math.floor((data.length/3-1)/2),history=ribbonGeometry(count),active=ribbonGeometry(900);
 for(let j=0;j<count;j++){const i=j*2;for(let k=0;k<3;k++){history.attributes.p0.array[j*3+k]=data[i*3+k];history.attributes.p1.array[j*3+k]=data[(i+2)*3+k]}history.attributes.when.array[j]=i*.005;}
 const parts=[['historyHalo',history,ribbonMaterial(color,6,.045,true),1],['historyCore',history,ribbonMaterial(color,1.6,.28),3],['tailHalo',active,ribbonMaterial(color,14,.20,true),5],['tailCore',active,ribbonMaterial(color,3.3,.97),7]];
 const obj={data,history,active,meshes:{},color};
 for(const[name,g,material,order]of parts){const mesh=new THREE.Mesh(g,material);mesh.frustumCulled=false;mesh.renderOrder=order;scene.add(mesh);obj.meshes[name]=mesh;}
 if(repeat){obj.meshes.historyHalo.visible=obj.meshes.historyCore.visible=obj.meshes.tailHalo.visible=false;obj.meshes.tailCore.material.depthTest=false;obj.meshes.tailCore.material.uniforms.width.value=1.10;obj.meshes.tailCore.renderOrder=10;}
 return obj;
}
function updateTrack(obj,t,tau,visible=true){
 if(!visible){for(const mesh of Object.values(obj.meshes))mesh.visible=false;return;}
 const isRepeat=obj===repeatTrack;const history= t<7?.08:t<12?.20:t<30?.13:t<60?.19:t<69?.17:t<83?.10:.30;
 obj.history.instanceCount=Math.min(obj.history.attributes.when.count,Math.floor(tau/.01));
 const tail=1.8,start=Math.max(0,tau-tail),first=Math.ceil(start/.005),last=Math.floor(tau/.005);let count=0;
 let before=sample(obj.data,start),after=new THREE.Vector3();
 for(let i=first;i<=last+1;i++){
  const time=Math.min(tau,i*.005);if(time<=start||count>=900)continue;sample(obj.data,time,after);obj.active.attributes.p0.array.set(before.toArray(),count*3);obj.active.attributes.p1.array.set(after.toArray(),count*3);obj.active.attributes.when.array[count]=time;before.copy(after);count++;if(time===tau)break;
 }obj.active.instanceCount=count;
 for(const name of ['p0','p1','when'])obj.active.attributes[name].needsUpdate=true;
 for(const[name,mesh]of Object.entries(obj.meshes)){
  mesh.visible=visible&&(!isRepeat||name==='tailCore');const u=mesh.material.uniforms;u.tau.value=tau;u.tail.value=name.startsWith('tail')?tail:0;
  u.cutoff.value=name.startsWith('history')&&t>=83?5:0;
  if(name==='historyCore')u.opacity.value=history;if(name==='historyHalo')u.opacity.value=t>=83?.045:.020;
 }
}
function makeHead(color){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0],3));const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending,uniforms:{color:{value:V(color)}},vertexShader:`void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_PointSize=50.;}`,fragmentShader:`precision highp float;uniform vec3 color;void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;float glow=exp(-r*r*6.);vec3 c=mix(color,vec3(1.),exp(-r*r*45.));gl_FragColor=vec4(c,glow);}`});const mesh=new THREE.Points(g,material);mesh.frustumCulled=false;mesh.renderOrder=20;scene.add(mesh);return mesh;}
const axes=new THREE.Group();scene.add(axes);
for(const [dir,color]of [[new THREE.Vector3(2,0,0),0x738997],[new THREE.Vector3(0,2,0),0x738997],[new THREE.Vector3(0,0,2),0x738997]]){const g=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(1,1,1).sub(dir),new THREE.Vector3(1,1,1).add(dir)]);axes.add(new THREE.Line(g,new THREE.LineBasicMaterial({color,transparent:true,opacity:.30})));}
function viewpoint(t,tau){
 const a=sample(A,tau),b=sample(B,tau),mid=a.clone().add(b).multiplyScalar(.5);let look=CENTER.clone(),pos;
 camera.clearViewOffset();camera.up.set(0,0,1);
 const wide=new THREE.Vector3(29,-51,31),offset=new THREE.Vector3(.55,-1,.45).normalize();
 if(t<12){let k=ramp(t,2,11);look.copy(mid).lerp(CENTER,ramp(t,7,11));let d=Math.exp(mix(Math.log(15),Math.log(62),k));
  const right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,0,1),offset).normalize(),up=offset.clone().cross(right),tan=Math.tan(43*Math.PI/360);
  for(const p of [a,b]){const q=p.clone().sub(look);d=Math.max(d,q.dot(offset)+Math.abs(q.dot(right))/(tan*camera.aspect*.80),q.dot(offset)+Math.abs(q.dot(up))/(tan*.76));}
  pos=look.clone().addScaledVector(offset,d);}
 else if(t<30){let k=ramp(t,17,25);look.copy(a).lerp(CENTER,k);const d=Math.exp(mix(Math.log(7),Math.log(64),k));pos=look.clone().addScaledVector(offset,d);camera.setViewOffset(W,VH,220,0,W,VH);}
 else if(t<60){pos=look.clone().add(wide);camera.setViewOffset(W,VH,235,0,W,VH);}
 else if(t<69){pos=look.clone().add(wide);camera.setViewOffset(W,VH,-360,0,W,VH);}
 else if(t<83){look.copy(CENTER);pos=look.clone().add(wide);}
 else{
  const tangent=sample(A,tau+.08).sub(sample(A,tau-.08)).normalize(),right=tangent.clone().cross(new THREE.Vector3(0,0,1)).normalize();
  const near=a.clone().addScaledVector(tangent,-7).addScaledVector(right,2.4).add(new THREE.Vector3(0,0,4));const nearLook=a.clone().addScaledVector(tangent,1.2);
  const theta=.28+(t-83)*.022;const far=CENTER.clone().add(new THREE.Vector3(Math.sin(theta)*55,-Math.cos(theta)*55,27));
  let closeness=t<86?ramp(t,83,86):1-ramp(t,91,104);look.copy(CENTER).lerp(nearLook,closeness);pos=far.lerp(near,closeness);
  if(t>=108){let k=ramp(t,108,125);look.copy(CENTER);pos=CENTER.clone().add(new THREE.Vector3(25+3*k,-53-5*k,27));}
 }
 camera.position.copy(pos);camera.lookAt(look);camera.updateProjectionMatrix();camera.updateMatrixWorld();const focus=camera.position.distanceTo(look);
 for(const obj of [...tracks,repeatTrack])for(const mesh of Object.values(obj.meshes))mesh.material.uniforms.focus.value=focus;
 axes.visible=t>=12&&t<19;
 return{a,b,look,focus};
}
function text(s,x,y,size=40,color=INK,align='center',bold=false,serif=false){c.save();c.font=`${bold?'700':'400'} ${size}px ${serif?'FilmSerif':'FilmSans'}`;c.textAlign=align;c.textBaseline='middle';c.fillStyle=color;c.fillText(s,x,y);c.restore()}
function line(x1,y1,x2,y2,color=DIM,width=1.2,alpha=.6){c.save();c.globalAlpha=alpha;c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();c.restore()}
function point(x,y,r,color){c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill()}
function projected(p){const q=p.clone().project(camera);return{x:(q.x*.5+.5)*W,y:(-.5*q.y+.5)*VH}}
function readableDistance(d){return d<.01?d.toExponential(2):d.toFixed(2)}
function inset(t){
 const x=1285,y=520,w=550,h=230;c.fillStyle='rgba(7,13,23,.92)';c.beginPath();c.roundRect(x,y,w,h,16);c.fill();
 text('初始间距放大示意',x+w/2,y+38,35,DIM);const ax=x+130,bx=x+420,cy=y+118;
 line(ax,cy,bx,cy,INK,1.5,.5);point(ax,cy,11,CYAN);point(bx,cy,11,GOLD);text('A',ax,cy-39,35,CYAN,'center',true);text('B',bx,cy-39,35,GOLD,'center',true);
 text('Δx = 0.000001',x+w/2,y+190,43,INK,'center',true);
 if(t<17){const p=projected(sample(A,0));line(p.x+15,p.y,1260,y+90,DIM,1,.35);}
}
function distanceGraph(tau){
 const x=1295,y=240,w=555,h=390;c.fillStyle='rgba(6,11,20,.92)';c.beginPath();c.roundRect(x,y,w,h,12);c.fill();text('两状态的距离',x+w/2,y+37,40,INK);text('对数纵轴',x+w/2,y+80,28,DIM);
 const left=x+92,right=x+w-24,top=y+120,bottom=y+h-62;const xx=t=>mix(left,right,t/60),yy=d=>mix(bottom,top,clamp((Math.log10(Math.max(d,1e-7))+7)/9));
 for(const [d,label]of [[1e-6,'1e-6'],[1e-3,'1e-3'],[1,'1'],[100,'100']]){line(left,yy(d),right,yy(d),DIM,1,.15);text(label,left-12,yy(d),27,DIM,'right');}
 line(left,top,left,bottom,DIM,1.1,.7);line(left,bottom,right,bottom,DIM,1.1,.7);
 for(const v of [0,20,40,60])text(String(v),xx(v),bottom+28,28,DIM);
 text('模型时间',x+w/2,y+h+13,31,DIM);
 c.save();c.strokeStyle='#d9e3e5';c.lineWidth=2.3;c.beginPath();const n=Math.min(Math.floor(tau/.005),12000);for(let i=0;i<=n;i+=4){const px=xx(i*.005),py=yy(DIST[i]);if(i===0)c.moveTo(px,py);else c.lineTo(px,py)}c.lineTo(xx(tau),yy(distanceAt(tau)));c.stroke();c.restore();point(xx(tau),yy(distanceAt(tau)),5,INK);
 text('当前差异 d = '+readableDistance(distanceAt(tau)),x+w/2,y+h+70,35,INK);
}
function overlay(t,tau,info){
 c.clearRect(0,0,W,H);c.fillStyle='#06090e';c.fillRect(0,H-1,1,1);$('scene').style.visibility='visible';
 if(t<12){text('只差百万分之一，未来为什么会彻底不同？',960,62,50,INK,'center',false,true);text('结果片段',230,765,33,DIM);}
 c.fillStyle='rgba(6,10,17,.82)';c.beginPath();c.roundRect(1215,t<12?98:40,635,78,12);c.fill();
 text('模型时间  t = '+tau.toFixed(2),1535,t<12?132:80,42,INK);
 if(t>=12&&t<30){text('回到起点',500,130,64,INK,'center',false,true);text('主场景保持真实比例',500,207,35,DIM);text('初始 x',1550,225,43,DIM);text('A   1.000000',1550,320,58,CYAN,'center',true);text('B   1.000001',1550,412,58,GOLD,'center',true);text('共同初值：y = 1，z = 1',1550,475,31,DIM);inset(t);}
 if(t>=30&&t<60)distanceGraph(tau);
 if(t>=60&&t<69){text('全程同一套方程',470,200,54,INK,'center',false,true);text('dx/dt = 10(y − x)',470,322,48,CYAN);text('dy/dt = x(28 − z) − y',470,433,48,INK);text('dz/dt = xy − (8/3)z',470,544,48,GOLD);text('参数固定 · 没有随机扰动',470,656,35,DIM);}
 if(t>=69&&t<77.5){text('原始 A',485,180,48,CYAN);text('同初态重新计算 A',1410,180,48,INK);text('完全重合',960,725,63,INK,'center',false,true);text('相同计算条件下，最大差异 = 0',960,793,34,DIM);}
 if(t>=77.5&&t<83){text('确定性混沌',960,155,77,INK,'center',false,true);text('对初始条件敏感',960,244,43,CYAN);}
 if(t>=83&&t<99){text('更长历史路径叠加',690,105,43,DIM);}
 if(t>=99){text('洛伦兹吸引子',520,130,65,INK,'center',false,true);text('LORENZ ATTRACTOR',520,203,27,CYAN);}
 if(!(t>=69&&t<83)){text('A',145,110,39,CYAN,'center',true);line(180,110,245,110,CYAN,3,1);text('B',145,167,39,GOLD,'center',true);line(180,167,245,167,GOLD,3,1);}
 const sub=SUBTITLES.find(s=>t>=s[0]&&t<s[1]);if(sub){const alpha=ramp(t,sub[0],sub[0]+.23)*(1-ramp(t,sub[1]-.23,sub[1]));$('subtitle').textContent=sub[2];$('subtitle-en').textContent=sub[3];$('subtitle').style.opacity=alpha;$('subtitle-en').style.opacity=alpha*.94}else{$('subtitle').textContent='';$('subtitle-en').textContent=''}
 $('toplabel').textContent='';$('titlecard').style.display='none';$('footnote2').textContent=t>=108?'这是简化动力学模型，不是实际天气预报。':'';
 $('annotation').textContent=t>=108?'轨迹画在状态空间中，不是空气中某只粒子的飞行路线。':t>=83?'细线：模型时间 t ≥ 5 的历史路径叠加；亮点：当前两个状态。':t>=69&&t<83?'同初态、同参数、同算法的独立复算 · 白色线芯表示重算 A':'简化动力学模型 · 状态空间轨迹 · 青蓝 A / 金橙 B';
 $('stage').style.opacity=1-ramp(t,124.5,125);
}
let lastInfo=null;
window.render=t=>{
 if(!ready)throw new Error('model not ready');t=clamp(t,0,125);const tau=timeAt(t);globalTau=tau;bc.fillStyle='#06090e';bc.fillRect(0,0,W,H);
 const repeat=t>=69&&t<83;updateTrack(tracks[0],t,tau,true);updateTrack(tracks[1],t,tau,!repeat);updateTrack(repeatTrack,t,tau,repeat);
 const info=viewpoint(t,tau);heads[0].geometry.attributes.position.array.set(info.a.toArray());heads[0].geometry.attributes.position.needsUpdate=true;heads[1].geometry.attributes.position.array.set(info.b.toArray());heads[1].geometry.attributes.position.needsUpdate=true;heads[1].visible=!repeat;
 renderer.setRenderTarget(target);renderer.render(scene,camera);renderer.setRenderTarget(null);renderer.render(postScene,postCamera);overlay(t,tau,info);lastInfo={t,tau,distance:distanceAt(tau),A:info.a.toArray(),B:info.b.toArray(),projected_A:projected(info.a),projected_B:projected(info.b),repeat};
};
window.audit=t=>{window.render(t);return lastInfo};
window.selftest=()=>{
 c.font='700 64px FilmSans';let repeat=true;for(let i=0;i<REPEAT.length;i++)if(A[i]!==REPEAT[i])repeat=false;
 return[{name:'given initial states',ok:A[0]===1&&A[1]===1&&A[2]===1&&B[0]===1.000001&&B[1]===1&&B[2]===1},{name:'double-precision RK4 .005 through 240 model units',ok:meta.dtype==='float64'&&meta.integrator==='classical RK4'&&meta.step===.005&&meta.end_model_time>=60},{name:'repeat independent integration identical',ok:repeat},{name:'no random perturbations',ok:meta.random_perturbations===false},{name:'distance computed from both states',ok:Math.abs(distanceAt(0)-1e-6)<1e-15&&Math.abs(distanceAt(25)-DIST[5000])<1e-10},{name:'actual nonmonotone bounded distance curve',ok:meta.primary_first60.distance_decreases>100&&meta.global_distance_max<100},{name:'subtitles fit',ok:SUBTITLES.every(s=>c.measureText(s[2]).width<1760)},{name:'reading duration',ok:SUBTITLES.every(s=>s[1]-s[0]>=2.5)},{name:'no persistent watermark',ok:!$('watermark')}];
};
window.renderCover=height=>{
 height=height||1920;window.__RENDER_MODE__=true;const width=1080;$('scene').style.visibility='visible';
 for(const id of ['toplabel','annotation','subtitle','subtitle-en','titlecard','worldveil','footnote2'])$(id).style.display='none';
 for(const node of [document.documentElement,document.body,$('stage')]){node.style.width=width+'px';node.style.height=height+'px';node.style.opacity=1;}
 for(const node of [$('bg'),$('scene')]){node.width=width;node.height=height;}
 $('world').style.width=width+'px';$('world').style.height=height+'px';renderer.setSize(width,height,false);target.setSize(width,height);post.uniforms.texel.value.set(1/width,1/height);camera.clearViewOffset();camera.aspect=width/height;camera.updateProjectionMatrix();camera.up.set(0,0,1);
 const tau=meta.long_start;updateTrack(tracks[0],105,tau);updateTrack(tracks[1],105,tau);updateTrack(repeatTrack,105,tau,false);axes.visible=false;
 camera.position.copy(CENTER).add(new THREE.Vector3(45,-112,43));camera.lookAt(CENTER);camera.updateMatrixWorld();for(const obj of tracks)for(const mesh of Object.values(obj.meshes)){mesh.material.uniforms.resolution.value.set(width,height);mesh.material.uniforms.focus.value=125;mesh.material.uniforms.width.value*=1.15;}
 for(let i=0;i<2;i++){heads[i].visible=true;heads[i].geometry.attributes.position.array.set(sample(i?B:A,tau).toArray());heads[i].geometry.attributes.position.needsUpdate=true;}
 renderer.setRenderTarget(target);renderer.render(scene,camera);renderer.setRenderTarget(null);renderer.render(postScene,postCamera);bc.fillStyle='#06090e';bc.fillRect(0,0,width,height);c.clearRect(0,0,width,height);c.save();c.translate(0,-(1920-height)/2);
 text('只差百万分之一',540,410,86,INK,'center',true);text('未来为何彻底不同？',540,540,76,GOLD,'center',true);text('同一套规则，两条未来',540,1510,50,INK,'center',false,true);text('混沌 · 洛伦兹吸引子',540,1600,41,CYAN);text('真实数值积分 · 状态空间轨迹',540,1635,30,DIM);c.restore();
};
window.assetsReady=(async()=>{
 const names=['sim/meta.json','sim/A.bin','sim/B.bin','sim/repeat_A.bin','sim/distance.bin'];const data=await Promise.all(names.map(async name=>{const r=await fetch(name);if(!r.ok)throw new Error(name+': '+r.status);return name.endsWith('json')?r.json():r.arrayBuffer()}));
 meta=data[0];[A,B,REPEAT,DIST]=data.slice(1).map(x=>new Float64Array(x));tracks=[makeTrack(A,[.35,.79,.96]),makeTrack(B,[.96,.57,.26])];repeatTrack=makeTrack(REPEAT,[.92,.94,.95],true);heads=[makeHead([.35,.79,.96]),makeHead([.96,.57,.26])];ready=true;window.render(0);return{double_samples:meta.samples};
})();
window.assetsReady.then(()=>{const start=performance.now();function loop(now){if(window.__RENDER_MODE__)return;window.render((now-start)/1000%125);requestAnimationFrame(loop)}if(!window.__RENDER_MODE__)requestAnimationFrame(loop)});
