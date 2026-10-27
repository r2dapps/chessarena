import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {HDRLoader} from 'three/examples/jsm/loaders/HDRLoader.js';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import Peer from 'peerjs';
const {Game}=window.Chess,$=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const LS={get(k,d){try{const v=localStorage.getItem('rjc.'+k);return v==null?d:JSON.parse(v)}catch{return d}},set(k,v){try{localStorage.setItem('rjc.'+k,JSON.stringify(v))}catch{}}};
const st={night:LS.get('night',matchMedia('(prefers-color-scheme: dark)').matches),sound:LS.get('sound',false),scene:LS.get('scene','room'),board:LS.get('board','wood'),pieceSet:LS.get('pieceSet','ivory'),level:LS.get('level',3),mode:LS.get('mode','cpu'),side:LS.get('side',1),name:LS.get('playerName','Grandmaster'),scenario:LS.get('scenario','backrank')};
/* icons */
const IC={undo:'<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 010 12h-3"/>',flip:'<path d="M4 12a8 8 0 0113.5-5.8L20 8"/><path d="M20 4v4h-4"/><path d="M20 12a8 8 0 01-13.5 5.8L4 16"/><path d="M4 20v-4h4"/>',resign:'<path d="M6 21V4"/><path d="M6 5h11l-2 4 2 4H6"/>',new:'<path d="M12 5v14M5 12h14"/>',menu:'<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',hbtn:'<path d="M5 6h14M5 12h14M5 18h9"/>',on:'<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 010 7"/>',off:'<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l4 6M21 9l-4 6"/>'};
const svgI=p=>`<svg viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
$$('.ctl .ib').forEach(b=>b.innerHTML=svgI(IC[b.dataset.a]));$('#menu').innerHTML=svgI(IC.menu);$('#hbtn').innerHTML=svgI(IC.hbtn);
const GL={1:"<circle cx=\"22.5\" cy=\"12\" r=\"5\"/><path d=\"M17 19.500h11l-1 3.500c4.500 2 7 6 7 12.500H11c0-6.500 2.500-10.500 7-12.500z\"/><rect x=\"10\" y=\"35\" width=\"25\" height=\"5\" rx=\"2\"/>",2:"<path d=\"M12 40c0-2 .5-3 2-4 0-7 3-11 8-15-2 .5-4.500 2-6 4.500L10.500 23c1-3 3.500-6 7-8.500l.5-3.500 3 2 2.500-3.500 1.500 3c7 1.500 12 7.500 12 16 0 3.500-.5 7-1 11z\"/><circle cx=\"19.500\" cy=\"17.500\" r=\"1.200\" fill=\"#000\" opacity=\".55\"/>",3:"<circle cx=\"22.500\" cy=\"7.500\" r=\"2.800\"/><path d=\"M22.500 11c5 3.500 8 7 8 11.500 0 3-1.500 5-4 6.500l1.500 4h-11l1.500-4c-2.500-1.500-4-3.500-4-6.500 0-4.500 3-8 8-11.500z\"/><rect x=\"11\" y=\"34\" width=\"23\" height=\"6\" rx=\"2.500\"/><path d=\"M20 15.500l5 5\" stroke=\"#000\" stroke-opacity=\".5\" stroke-width=\"1.500\" fill=\"none\"/>",4:"<path d=\"M11 40v-4l3-3 1.500-13-3.500-3V8h5v3h3V8h4v3h3V8h5v9l-3.500 3 1.500 13 3 3v4z\"/>",5:"<circle cx=\"8\" cy=\"12\" r=\"2.500\"/><circle cx=\"15.500\" cy=\"8\" r=\"2.500\"/><circle cx=\"22.500\" cy=\"7\" r=\"2.500\"/><circle cx=\"29.500\" cy=\"8\" r=\"2.500\"/><circle cx=\"37\" cy=\"12\" r=\"2.500\"/><path d=\"M10.500 36L7 15l8 11 2.500-14 5 14 5-14L30 26l8-11-3.500 21z\"/><rect x=\"10\" y=\"35\" width=\"25\" height=\"5\" rx=\"2.500\"/>",6:"<path d=\"M21 3h3v4h4v3h-4v4h-3v-4h-4V7h4z\"/><path d=\"M22.500 15c-6 0-11 4-11 10 0 4 2 6 4 7l-2 6h18l-2-6c2-1 4-3 4-7 0-6-5-10-11-10z\"/><rect x=\"10\" y=\"35\" width=\"25\" height=\"5\" rx=\"2.500\"/>"};
const glyph=(k,c)=>`<svg viewBox="0 0 45 45" class="pc ${c>0?'w':'b'}" aria-hidden="true">${GL[k]}</svg>`;
/* audio */
const A=(()=>{let c,m,nb,amb,timer;
const init=()=>{if(c){c.state==='suspended'&&c.resume();return}c=new(window.AudioContext||window.webkitAudioContext)();m=c.createGain();m.gain.value=st.sound?.8:0;m.connect(c.destination);const n=c.sampleRate*2;nb=c.createBuffer(1,n,c.sampleRate);const d=nb.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1};
const noise=(f,q,type,dur,v,t0=0)=>{if(!c)return;const s=c.createBufferSource(),fl=c.createBiquadFilter(),g=c.createGain(),t=c.currentTime+t0;s.buffer=nb;fl.type=type;fl.frequency.value=f;fl.Q.value=q;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);s.connect(fl);fl.connect(g);g.connect(m);s.start(t,Math.random());s.stop(t+dur+.05)};
const tone=(f,dur,v,type='sine',t0=0,f2)=>{if(!c)return;const o=c.createOscillator(),g=c.createGain(),t=c.currentTime+t0;o.type=type;o.frequency.setValueAtTime(f,t);f2&&o.frequency.exponentialRampToValueAtTime(f2,t+dur);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(m);o.start(t);o.stop(t+dur+.05)};
const fx={move(){noise(2200,1.2,'bandpass',.07,.55);noise(700,2,'bandpass',.1,.35);tone(170,.12,.5,'sine',0,90);tone(95,.22,.25,'triangle',0,60)},cap(){noise(1500,.8,'bandpass',.12,.9);tone(120,.18,.7,'sine',0,60);noise(2600,1,'bandpass',.05,.4,.09)},castle(){fx.move();setTimeout(fx.move,170)},sel(){tone(900,.05,.1)},lift(){noise(1200,1,'bandpass',.04,.25)},clock(){noise(4200,2,'bandpass',.03,.4);tone(1100,.04,.08,'square')},check(){tone(660,.5,.22,'triangle');tone(880,.6,.18,'triangle',.12)},end(){[523,659,784,1047].forEach((f,i)=>tone(f,1.1,.18,'triangle',i*.14))},err(){tone(160,.12,.12,'square')}};
const bird=()=>{const n=2+Math.random()*3|0,b=2000+Math.random()*1500;for(let i=0;i<n;i++)tone(b,.09,.05,'sine',i*.13,b*1.4)};
const ambient=(sc,night)=>{if(!c||!st.sound)return;clearInterval(timer);if(amb){const o=amb;o.g.gain.linearRampToValueAtTime(0,c.currentTime+.8);setTimeout(()=>o.n.forEach(x=>{try{x.stop()}catch{}}),1000)}
const g=c.createGain(),ns=[];g.gain.value=0;g.gain.linearRampToValueAtTime(1,c.currentTime+1.2);g.connect(m);
const loop=(f,type,v,lf,ld)=>{const s=c.createBufferSource(),fl=c.createBiquadFilter(),gg=c.createGain();s.buffer=nb;s.loop=true;fl.type=type;fl.frequency.value=f;gg.gain.value=v;if(lf){const o=c.createOscillator(),og=c.createGain();o.frequency.value=lf;og.gain.value=ld;o.connect(og);og.connect(gg.gain);o.start();ns.push(o)}s.connect(fl);fl.connect(gg);gg.connect(g);s.start();ns.push(s)};
const cricket=()=>{const o=c.createOscillator(),mo=c.createOscillator(),mg=c.createGain(),gg=c.createGain();o.frequency.value=4300;mo.frequency.value=28;mg.gain.value=.012;gg.gain.value=.012;mo.connect(mg);mg.connect(gg.gain);o.connect(gg);gg.connect(g);o.start();mo.start();ns.push(o,mo)};
if(sc==='room'){loop(260,'lowpass',.03);loop(1800,'bandpass',.012,.08,.02);}
else if(sc==='beach'){loop(700,'lowpass',.08,.11,.07);loop(3200,'highpass',.012,.11,.01);night?cricket():timer=setInterval(()=>{if(Math.random()<.5){const f=1500+Math.random()*300;tone(f,.35,.05,'sawtooth',0,f*.6);tone(f*1.1,.3,.04,'sawtooth',.25,f*.7)}},4500)}
else{loop(500,'bandpass',night?.03:.045,.07,.025);night?cricket():timer=setInterval(()=>Math.random()<.8&&bird(),2600)}
amb={g,n:ns}};
return{init,fx,ambient,mute(){m&&(m.gain.value=st.sound?.8:0)}}})();
const snd=k=>st.sound&&A.fx[k]?.();

function speak(text){
  if(!st.sound||!('speechSynthesis' in window))return;
  try{
    window.speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(text);
    u.lang='en-US';
    u.rate=0.92;
    u.pitch=1.0;
    u.volume=0.9;
    window.speechSynthesis.speak(u);
  }catch(e){}
}

/* three */
const canvas=$('#c'),R=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance',logarithmicDepthBuffer:false}),S=new THREE.Scene(),cam=new THREE.PerspectiveCamera(40,1,.1,600),orthoCam=new THREE.OrthographicCamera(-1,1,1,-1,.1,100);
let activeCam=cam;
R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=1.15;
const pmrem=new THREE.PMREMGenerator(R);
pmrem.compileEquirectangularShader();
let hdrTexture=null,hdrEnvMap=null;
new HDRLoader().load('qwantani_sunset_1k.hdr',texture=>{
  texture.mapping=THREE.EquirectangularReflectionMapping;
  hdrTexture=texture;
  hdrEnvMap=pmrem.fromEquirectangular(texture).texture;
  if(T.cur<=.5){
    S.environment=hdrEnvMap;
    S.environmentIntensity=.42;
    if((st.scene||'room')==='room'){
      S.background=texture;
      S.backgroundBlurriness=0;
    }
  }
  applyTime(T.cur);
},undefined,err=>console.warn('HDR load fallback',err));
const ctl=new OrbitControls(cam,canvas);Object.assign(ctl,{enableDamping:true,enablePan:false,enableZoom:true,zoomSpeed:1.1,minPolarAngle:.2,maxPolarAngle:1.42,rotateSpeed:.7,touches:{ONE:THREE.TOUCH.ROTATE,TWO:THREE.TOUCH.DOLLY_PAN}});
const hemi=new THREE.HemisphereLight(0xffd9a8,0x3b3060,1.4),sun=new THREE.DirectionalLight(0xffecd2,3.2),lamp=new THREE.PointLight(0xffd9a8,0,14,1.5),fill=new THREE.DirectionalLight(0x8090c0,.45);
sun.castShadow=true;sun.shadow.mapSize.setScalar(innerWidth<700?1024:2048);Object.assign(sun.shadow.camera,{left:-5,right:5,top:5,bottom:-5,near:1,far:80});sun.shadow.bias=-.0004;sun.shadow.normalBias=.03;
fill.position.set(8,6,-4);
S.add(hemi,sun,sun.target,lamp,fill);
const P={cream:'#f2eadf',creamD:'#d9cdbd',lav:'#b9abdd',lavD:'#8478b5',mint:'#a9d9c6',mintD:'#74b7a0',rock:'#6b5d52',rockD:'#3d3028',slate:'#2a2d35',slateD:'#1a1c22',slateM:'#3e4350'};
const K=10,TH=1.8,UP=new THREE.Vector3(0,1,0);
let O=new THREE.Vector3(),F=new THREE.Vector3(1,0,0),RK=new THREE.Vector3(0,0,1),SZ=.3,TOP=TH,mesh=new Array(64).fill(null),pcs=[],extras=[],proto={1:{},'-1':{}},tray={1:[],'-1':[]},ready=false,viewSide=1;
const pos=(f,r,y)=>{const v=O.clone().addScaledVector(F,(f-3.5)*SZ).addScaledVector(RK,(r-3.5)*SZ);v.y=y;return v};
const sqW=(s,y)=>pos(s&7,s>>3,y);
const mat=(c,o={})=>new THREE.MeshStandardMaterial({color:c,roughness:.85,flatShading:true,...o});
let ENV=null,T={cur:st.night?1:0,tgt:st.night?1:0},stars,sunM,moonM,tableY=TH;
const sky=new THREE.Group();S.add(sky);
{sunM=new THREE.Mesh(new THREE.SphereGeometry(4,24,16),new THREE.MeshBasicMaterial({color:'#fff4dc',fog:false}));sunM.position.set(-40,45,-60);
moonM=new THREE.Mesh(new THREE.SphereGeometry(3,24,16),new THREE.MeshBasicMaterial({color:'#ece7fa',fog:false}));moonM.position.set(45,40,-55);
const a=[];for(let i=0;i<500;i++){const u=Math.random()*6.283,v=Math.random()*1.3+.1,r=140;a.push(Math.cos(u)*Math.cos(v)*r,Math.sin(v)*r,Math.sin(u)*Math.cos(v)*r)}
const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(a,3));stars=new THREE.Points(g,new THREE.PointsMaterial({color:'#fff',size:1.6,sizeAttenuation:false,transparent:true,fog:false,depthWrite:false}));sky.add(sunM,moonM,stars)}
let sd=7;const rnd=()=>(sd=sd*16807%2147483647)/2147483647;
function add(g,geo,m,x,y,z,sh=true){const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=sh;g.add(o);return o}
function makeEquirectSky(stops){
  const c=document.createElement('canvas');
  c.width=1024;
  c.height=512;
  const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,0,512);
  stops.forEach(([pos,col])=>g.addColorStop(pos,col));
  x.fillStyle=g;
  x.fillRect(0,0,1024,512);
  const t=new THREE.CanvasTexture(c);
  t.mapping=THREE.EquirectangularReflectionMapping;
  t.colorSpace=THREE.SRGBColorSpace;
  return t;
}
let duskTexture=null,cosmosTexture=null;
function getEnvTexture(name){
  if(name==='garden'){
    if(!cosmosTexture){
      cosmosTexture=makeEquirectSky([
        [0.0, '#04060d'],
        [0.35, '#070a18'],
        [0.65, '#0c132a'],
        [0.85, '#12182b'],
        [1.0, '#04060b']
      ]);
    }
    return cosmosTexture;
  }
  if(name==='beach'){
    if(!duskTexture){
      duskTexture=makeEquirectSky([
        [0.0, '#100c1e'],
        [0.30, '#221538'],
        [0.55, '#562145'],
        [0.72, '#9c4542'],
        [0.82, '#e07656'],
        [0.90, '#3a1f33'],
        [1.0, '#0b0f19']
      ]);
    }
    return duskTexture;
  }
  return hdrTexture;
}

/* --- Clean Cinematic 3D Scene --- */
function buildEnv(name){
  if(ENV)S.remove(ENV.g);
  const g=new THREE.Group(),glow=[],e={g,glow,name,upd:null},ty=tableY;
  
  let tableCol='#242730',trimCol='#6e7686',trimMet=0.6;
  if(name==='garden'){
    tableCol='#12151f';trimCol='#5c6779';trimMet=0.7;
  }else if(name==='beach'){
    tableCol='#241822';trimCol='#a86470';trimMet=0.65;
  }else{
    tableCol='#262933';trimCol='#8c734b';trimMet=0.6;
  }

  const tableMat=new THREE.MeshStandardMaterial({color:tableCol,roughness:.27,metalness:.25});
  const tableTop=new THREE.Mesh(new THREE.BoxGeometry(SZ*17.2,.16,SZ*13.6),tableMat);
  tableTop.position.set(0,ty-.08,0);
  tableTop.castShadow=tableTop.receiveShadow=true;
  g.add(tableTop);

  const trimMat=new THREE.MeshStandardMaterial({color:trimCol,roughness:.22,metalness:trimMet});
  const trim=new THREE.Mesh(new THREE.BoxGeometry(SZ*17.35,.016,SZ*13.75),trimMat);
  trim.position.set(0,ty-.002,0);
  g.add(trim);

  const legMat=new THREE.MeshStandardMaterial({color:'#181a20',roughness:.4,metalness:.2});
  for(const lx of[-1,1])for(const lz of[-1,1]){
    const leg=new THREE.Mesh(new THREE.CylinderGeometry(.06,.085,ty-.14,16),legMat);
    leg.position.set(lx*SZ*6.0,(ty-.14)/2,lz*SZ*4.9);
    leg.castShadow=true;
    g.add(leg);
  }

  g.rotation.y=Math.atan2(-F.z,F.x);
  g.position.set(O.x,0,O.z);
  S.add(g);
  ENV=e;
  lamp.position.set(O.x,ty+2.7,O.z);
  lamp.userData.base=10;
  applyTime(T.cur);
  A.ambient(name,T.tgt>.5)}

const C=(a,b,t)=>new THREE.Color(a).lerp(new THREE.Color(b),t);
function applyTime(t){
  if(!ENV)return;
  const sc=(ENV&&ENV.name)||st.scene||'room';
  const L=(a,b)=>a+(b-a)*t;
  S.fog=null;

  if(sc==='garden'){
    // Midnight Sky / Starry Cosmos
    S.background=t>.5?new THREE.Color('#050711'):getEnvTexture('garden');
    S.environment=hdrEnvMap;
    S.environmentIntensity=t>.5?0.14:0.25;
    sky.visible=true;
    stars.visible=true;
    stars.material.opacity=L(0.65,1.0);
    moonM.visible=true;
    sunM.visible=false;

    hemi.intensity=L(0.95,0.4);
    hemi.color.copy(C('#d0d8f0','#1a1f38',t));
    hemi.groundColor.copy(C('#151b2e','#070914',t));
    sun.intensity=L(1.8,0.9);
    sun.color.copy(C('#a5b8f0','#7a8fd4',t));
    fill.intensity=L(0.35,0.12);
    fill.color.copy(C('#8fa0d4','#283254',t));
  }else if(sc==='beach'){
    // Dusk Panorama
    S.background=t>.5?new THREE.Color('#0b0e1a'):getEnvTexture('beach');
    S.environment=hdrEnvMap;
    S.environmentIntensity=t>.5?0.18:0.38;
    sky.visible=false;
    stars.visible=false;
    moonM.visible=t>.5;
    sunM.visible=false;

    hemi.intensity=L(1.15,0.45);
    hemi.color.copy(C('#f5d0c5','#2a1a38',t));
    hemi.groundColor.copy(C('#3d253b','#0d0918',t));
    sun.intensity=L(2.4,0.95);
    sun.color.copy(C('#f2876b','#685088',t));
    fill.intensity=L(0.42,0.14);
    fill.color.copy(C('#e0a5b8','#3a2b50',t));
  }else{
    // Sunset Canyon (room)
    if(t>.5){
      S.background=new THREE.Color('#10121a');
      S.environmentIntensity=0.18;
    }else{
      S.background=hdrTexture||new THREE.Color('#252a32');
      S.environment=hdrEnvMap;
      S.environmentIntensity=0.44;
      S.backgroundBlurriness=0;
    }
    sky.visible=false;
    stars.material.opacity=t;
    sunM.visible=false;
    moonM.visible=t>.4;

    hemi.intensity=L(1.2,0.45);
    hemi.color.copy(C('#f4e9d8','#2a2060',t));
    hemi.groundColor.copy(C('#343c4a','#0a0818',t));
    sun.intensity=L(2.8,1.0);
    sun.color.copy(C('#ffd8ad','#6070c0',t));
    fill.intensity=L(0.42,0.12);
    fill.color.copy(C('#dce5f5','#4050a0',t));
  }

  sun.position.copy(O).add(new THREE.Vector3(L(-6,-8),L(12,14),L(3,10)));
  sun.target.position.copy(O);
  lamp.intensity=(lamp.userData.base||0)*t;
  R.toneMappingExposure=L(0.92,0.85);
  document.documentElement.dataset.theme=t>.5?'night':'day';
}
/* board */
const hl=new THREE.Group(),hs=new THREE.Group(),hv=new THREE.Group();S.add(hl,hs,hv);
const HM={mint:new THREE.MeshBasicMaterial({color:P.mint,transparent:true,opacity:.95,depthWrite:false}),lav:new THREE.MeshBasicMaterial({color:P.lav,transparent:true,opacity:.55,depthWrite:false})};
HM.mint2=HM.mint.clone();HM.mint2.opacity=.4;
let chk=null;
function mark(g,sq,kind,m){let geo;const s=SZ;if(kind==='sq')geo=new THREE.PlaneGeometry(s*.98,s*.98);else if(kind==='dot')geo=new THREE.CircleGeometry(s*.14,28);else geo=new THREE.RingGeometry(kind==='cap'?s*.38:s*.34,kind==='cap'?s*.49:s*.43,40);
geo.rotateX(-Math.PI/2);const o=new THREE.Mesh(geo,m);o.position.copy(sqW(sq,TOP+.012));o.renderOrder=2;g.add(o);return o}
const clr=g=>{while(g.children.length){const o=g.children.pop();o.geometry.dispose()}};
function wood(base,dark,seed){const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');x.fillStyle=base;x.fillRect(0,0,256,256);let q=seed;const r=()=>(q=q*16807%2147483647)/2147483647;
for(let i=0;i<80;i++){x.strokeStyle=dark;x.globalAlpha=.05+r()*.13;x.lineWidth=.5+r()*2.2;x.beginPath();const y=r()*256;x.moveTo(0,y);for(let u=0;u<=256;u+=32)x.lineTo(u,y+Math.sin(u/40+i)*3+(r()-.5)*2);x.stroke()}
const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t}
const wm=(b,d,sd,ro)=>new THREE.MeshStandardMaterial({map:wood(b,d,sd),roughness:ro,metalness:0});
const boardMeshes=[];
const BOARD_THEMES={
  wood:{
    name:'Walnut & Maple',
    M_Wood:wm('#4a2818','#1f0f08',3,.5),
    M_Black:wm('#6e3e22','#351c0e',5,.45),
    M_White:wm('#e5cb9e','#b89463',9,.45)
  },
  emerald:{
    name:'Tournament Emerald & Buff',
    M_Wood:new THREE.MeshStandardMaterial({color:'#1a251e',roughness:.42,metalness:.08}),
    M_Black:new THREE.MeshStandardMaterial({color:'#285e43',roughness:.38,metalness:.04}),
    M_White:new THREE.MeshStandardMaterial({color:'#e9e3cb',roughness:.32,metalness:.02})
  },
  navy:{
    name:'Royal Navy & Ice',
    M_Wood:new THREE.MeshStandardMaterial({color:'#0f1422',roughness:.35,metalness:.22}),
    M_Black:new THREE.MeshStandardMaterial({color:'#1d2b45',roughness:.28,metalness:.15}),
    M_White:new THREE.MeshStandardMaterial({color:'#d8e4f0',roughness:.22,metalness:.06})
  },
  marble:{
    name:'Obsidian & Carrara Marble',
    M_Wood:new THREE.MeshStandardMaterial({color:'#0a0c10',roughness:.25,metalness:.35}),
    M_Black:new THREE.MeshStandardMaterial({color:'#181a20',roughness:.22,metalness:.12}),
    M_White:new THREE.MeshStandardMaterial({color:'#f8fafc',roughness:.16,metalness:.04})
  },
  rosewood:{
    name:'Crimson Rosewood & Ivory',
    M_Wood:wm('#3b1216','#1c0709',2,.48),
    M_Black:wm('#5a1a22','#2a0b0f',4,.44),
    M_White:wm('#f5ebd9','#c9bca6',8,.42)
  },
  slate:{
    name:'Slate & Zinc',
    M_Wood:new THREE.MeshStandardMaterial({color:'#222730',roughness:.4,metalness:.2}),
    M_Black:new THREE.MeshStandardMaterial({color:'#333b47',roughness:.32,metalness:.12}),
    M_White:new THREE.MeshStandardMaterial({color:'#94a3b8',roughness:.24,metalness:.08})
  }
};
function applyBoardTheme(name){
  st.board=name;LS.set('board',name);
  const th=BOARD_THEMES[name]||BOARD_THEMES.wood;
  boardMeshes.forEach(o=>{
    const n=o.userData?.matName||'M_White';
    o.material=th[n]||th.M_White;
  });
}
const PIECE_SETS={
  ivory:{
    w:new THREE.MeshPhysicalMaterial({color:'#ede7d8',roughness:.22,metalness:.03,clearcoat:.65,clearcoatRoughness:.12,reflectivity:.9}),
    b:new THREE.MeshPhysicalMaterial({color:'#181a20',roughness:.22,metalness:.05,clearcoat:.65,clearcoatRoughness:.12,reflectivity:.9})
  },
  gold:{
    w:new THREE.MeshPhysicalMaterial({color:'#e5c158',roughness:.24,metalness:.88,clearcoat:.4,clearcoatRoughness:.1}),
    b:new THREE.MeshPhysicalMaterial({color:'#d4dae2',roughness:.18,metalness:.95,clearcoat:.6,clearcoatRoughness:.08})
  },
  walnut:{
    w:new THREE.MeshPhysicalMaterial({color:'#f2ede4',roughness:.32,metalness:.02,clearcoat:.3,clearcoatRoughness:.2}),
    b:new THREE.MeshPhysicalMaterial({color:'#3a2416',roughness:.35,metalness:.02,clearcoat:.3,clearcoatRoughness:.2})
  },
  mono:{
    w:new THREE.MeshPhysicalMaterial({color:'#ffffff',roughness:.14,metalness:.02,clearcoat:.95,clearcoatRoughness:.06}),
    b:new THREE.MeshPhysicalMaterial({color:'#101216',roughness:.14,metalness:.02,clearcoat:.95,clearcoatRoughness:.06})
  }
};
function applyPieceSet(name){
  st.pieceSet=name;LS.set('pieceSet',name);
  const ps=PIECE_SETS[name]||PIECE_SETS.ivory;
  pcs.concat(extras).forEach(o=>{
    const c=o.userData?.c||1;
    o.traverse(ch=>{if(ch.isMesh)ch.material=c>0?ps.w:ps.b});
  });
}
new GLTFLoader().load('ChessBoard.glb',gl=>{
const root=gl.scene;root.scale.setScalar(K);root.position.y=TH;S.add(root);root.updateMatrixWorld(true);
const found=[],inside=new Set(),re=/^(White|Black)(Pawn|Rook|Knight|Bishop|Queen|King)/;
root.traverse(o=>{const m=re.exec(o.name);if(m&&!inside.has(o)){o.traverse(c=>inside.add(c));found.push({o,c:m[1]==='White'?1:-1,k:{Pawn:1,Knight:2,Bishop:3,Rook:4,Queen:5,King:6}[m[2]]})}});
const box=new THREE.Box3();
boardMeshes.length=0;
root.traverse(o=>{if(!o.isMesh)return;o.castShadow=o.receiveShadow=true;if(!inside.has(o)){box.expandByObject(o);o.userData.matName=o.material?.name||'M_White';boardMeshes.push(o)}});
applyBoardTheme(st.board);
applyPieceSet(st.pieceSet);
const wp=(c,k)=>found.filter(f=>f.c===c&&f.k===k).map(f=>f.o.getWorldPosition(new THREE.Vector3()));
const wr=wp(1,4),br=wp(-1,4),avg=a=>a.reduce((s,v)=>s.add(v),new THREE.Vector3()).multiplyScalar(1/a.length);
const aw=avg(wr),ab=avg(br);O=avg(wr.concat(br));RK=ab.clone().sub(aw).setY(0);SZ=RK.length()/7;RK.normalize();F=new THREE.Vector3().crossVectors(RK,UP).normalize();
TOP=box.max.y;tableY=box.min.y;O.y=TOP;
found.forEach(f=>{f.o.userData={c:f.c,k:f.k,y0:f.o.getWorldPosition(new THREE.Vector3()).y}});
found.forEach(f=>S.attach(f.o));
for(const c of[1,-1])for(const k of[1,2,3,4,5,6]){const r0=c>0?0:7,r1=c>0?1:6,fl={1:[0,1,2,3,4,5,6,7],2:[1,6],3:[2,5],4:[0,7],5:[3],6:[4]}[k],free=fl.map(f=>(k===1?r1:r0)*8+f);
for(const f of found.filter(x=>x.c===c&&x.k===k)){let bi=0,bd=1e9;free.forEach((s,i)=>{const d=sqW(s,0).distanceTo(f.o.position.clone().setY(0));if(d<bd){bd=d;bi=i}});const s=free.splice(bi,1)[0];f.o.userData.home=s;pcs.push(f.o);proto[c][k]||(proto[c][k]=f.o)}}
ready=true;buildEnv(st.scene);makeClock3D();initCam();resize();newGame(true);$('#panel').style.visibility='';
});
function resetViz(){
  extras.forEach(e=>S.remove(e));extras=[];tray={1:[],'-1':[]};mesh.fill(null);TW.length=0;
  const pool=pcs.slice();pool.forEach(p=>{p.visible=false;p.userData.sq=-1});
  for(let sq=0;sq<64;sq++){
    const val=G.b[sq];if(!val)continue;
    const c=val>0?1:-1,k=Math.abs(val);
    const idx=pool.findIndex(p=>p.userData.c===c&&p.userData.k===k);
    let pObj=null;
    if(idx>=0){pObj=pool.splice(idx,1)[0]}
    else if(proto[c]&&proto[c][k]){
      pObj=proto[c][k].clone(true);
      pObj.userData={c,k,y0:proto[c][k].userData.y0};
      S.add(pObj);extras.push(pObj);
    }
    if(pObj){
      pObj.visible=true;
      pObj.userData.sq=sq;
      mesh[sq]=pObj;
      pObj.position.copy(sqW(sq,pObj.userData.y0));
    }
  }
}
const TW=[],go=(o,to,dur,arc=0,delay=0)=>new Promise(res=>{if(!dur){o.position.copy(to);return res()}TW.push({o,a:o.position.clone(),b:to,t0:performance.now()+delay,d:dur,arc,res})});
const slot=(k,c,y)=>pos(c<0?-1.4-(k>>3):8.4+(k>>3),k%8,y);
async function vmove(m,col,anim,land){const d=anim?1:0,jobs=[],mv=mesh[m.from];mesh[m.from]=null;
if(m.cap){const cs=m.fl==='e'?m.to-8*col:m.to,v=mesh[cs];mesh[cs]=null;if(v){v.userData.sq=-1;const T=tray[v.userData.c];jobs.push(go(v,slot(T.length,v.userData.c,v.userData.y0),650*d,1.1,380*d));T.push(v)}}
const mp=go(mv,sqW(m.to,mv.userData.y0),(m.p===2?800:620)*d,m.p===2?1.2:.45);
if(m.fl==='c'){const rk=m.from&~7,[a,b]=m.to>m.from?[rk+7,rk+5]:[rk,rk+3],r=mesh[a];mesh[a]=null;mesh[b]=r;r.userData.sq=b;jobs.push(go(r,sqW(b,r.userData.y0),620*d,.45,250*d))}
mv.userData.sq=m.to;mesh[m.to]=mv;await mp;land&&land();
if(m.promo){const pr=proto[col][m.promo].clone(true);mv.visible=false;mv.userData.sq=-1;pr.userData={c:col,k:m.promo,sq:m.to,y0:proto[col][m.promo].userData.y0};pr.position.copy(sqW(m.to,pr.userData.y0));S.add(pr);extras.push(pr);mesh[m.to]=pr}
await Promise.all(jobs)}
/* camera */
let dist0=5,flipT=null;
function initCam(){ctl.target.copy(O).add(new THREE.Vector3(0,.15,0));placeCam(viewSide)}
function placeCam(side){const el=.58;cam.position.copy(O).addScaledVector(RK,-side*dist0*Math.cos(el)).add(new THREE.Vector3(0,dist0*Math.sin(el),0));ctl.update()}

let is2D=false;
function toggle2D(){
  is2D=!is2D;
  ctl.enabled=false;
  if(is2D){
    orthoCam.position.copy(O).add(new THREE.Vector3(0,18,0));
    orthoCam.up.copy(RK).multiplyScalar(viewSide);
    orthoCam.lookAt(O);
    orthoCam.updateProjectionMatrix();
    flipT={t0:performance.now(),from:cam.position.clone(),to:O.clone().add(new THREE.Vector3(0,dist0*1.55,-viewSide*0.01)),d:350,is2D:true};
  }else{
    activeCam=cam;
    const el=.58;
    const dest=O.clone().addScaledVector(RK,-viewSide*dist0*Math.cos(el)).add(new THREE.Vector3(0,dist0*Math.sin(el),0));
    cam.position.copy(O).add(new THREE.Vector3(0,dist0*1.55,-viewSide*0.01));
    flipT={t0:performance.now(),from:cam.position.clone(),to:dest,d:420,is2D:false};
  }
  const b=$('#btn2d');if(b){b.textContent=is2D?'3D':'2D';b.classList.toggle('active',is2D)}
}
window.toggle2D=toggle2D;

function flipView(side){if(side===viewSide||!ready)return;viewSide=side;const off=cam.position.clone().sub(ctl.target);flipT={t0:performance.now(),off,d:1000}}
function resize(){const w=innerWidth,h=innerHeight,wide=matchMedia('(min-width:980px), (max-height:520px) and (orientation:landscape)').matches,p=$('#panel');R.setPixelRatio(Math.min(devicePixelRatio,w<700?1.5:2));R.setSize(w,h,false);
const B=SZ*8,asp=w/h;dist0=Math.max(4,B*2.05/Math.min(1,asp*1.05));ctl.maxDistance=dist0*1.7;ctl.minDistance=B*.7;
if(wide){const off=p.offsetWidth+20;cam.aspect=(w+off)/h;cam.setViewOffset(w+off,h,off,0,w,h)}else{cam.clearViewOffset();cam.aspect=w/h}cam.updateProjectionMatrix();
const bSz=SZ*9.8;let oW,oH;if(asp>=1){oH=bSz;oW=bSz*asp}else{oW=bSz;oH=bSz/asp}
orthoCam.left=-oW/2;orthoCam.right=oW/2;orthoCam.top=oH/2;orthoCam.bottom=-oH/2;orthoCam.near=.1;orthoCam.far=50;
if(wide){const off=(p.offsetWidth+28)*(oW/w);orthoCam.setViewOffset(oW+off,oH,off,0,oW,oH)}else{const pH=p?(p.offsetHeight||160):0;const offY=(pH+18)*(oH/h);orthoCam.setViewOffset(oW,oH+offY,0,offY,oW,oH)}
orthoCam.updateProjectionMatrix()}
addEventListener('resize',()=>{ready&&resize()});
/* loop */
R.setAnimationLoop(()=>{const now=performance.now();
if(Math.abs(T.cur-T.tgt)>.002){T.cur+=(T.tgt-T.cur)*.06;applyTime(T.cur)}
for(let i=TW.length-1;i>=0;i--){const w=TW[i];if(now<w.t0)continue;const u=Math.min(1,(now-w.t0)/w.d),e=u<.5?2*u*u:1-2*(1-u)*(1-u);w.o.position.lerpVectors(w.a,w.b,e);w.o.position.y+=w.arc*Math.sin(Math.PI*u);if(u>=1){TW.splice(i,1);w.res()}}
if(flipT){const u=Math.min(1,(now-flipT.t0)/flipT.d),e=u*u*(3-2*u);
  if(flipT.from&&flipT.to){cam.position.lerpVectors(flipT.from,flipT.to,e);ctl.target.copy(O).add(new THREE.Vector3(0,.15,0));cam.lookAt(ctl.target)}
  else{cam.position.copy(ctl.target).add(flipT.off.clone().applyAxisAngle(UP,Math.PI*e))}
  if(ctl.enabled)ctl.update();
  if(u>=1){
    if(flipT.is2D){activeCam=orthoCam;ctl.enabled=false}
    else{activeCam=cam;cam.position.copy(flipT.to);ctl.target.copy(O).add(new THREE.Vector3(0,.15,0));cam.lookAt(ctl.target);ctl.enabled=true;ctl.update()}
    flipT=null;
  }
}
if(chk)chk.material.opacity=.35+.3*Math.sin(now/220);
if(ctl.enabled)ctl.update();R.render(S,activeCam)});
/* game */
let clk=null,clkObj=null,clkTex=null,clkCtx=null,G=new Game(),cfg={mode:st.mode,me:1,level:st.level,auto:true,time:LS.get('time')==='0'?'5+0':LS.get('time','5+0')},busy=false,over=false,sel=-1,selMoves=[],thinking=false,epoch=0,W=null;
try{W=new Worker('ai-worker.js');W.onmessage=e=>{const d=e.data;if(d.id!==epoch)return;setTimeout(()=>{if(d.id!==epoch)return;thinking=false;if(d.to==null){ui();return}doMove(d.from,d.to,d.promo)},Math.max(0,450-(Date.now()-aiT0)))}}catch{}
let aiT0=0;
const fmt=ms=>{const t=Math.ceil(Math.max(0,ms)/1000);return Math.floor(t/60)+':'+String(t%60).padStart(2,'0')};
const clockMs=c=>{if(!clk)return 0;const base=clk[c>0?'w':'b'];if(!clk.started||over||G.turn!==c)return Math.max(0,base);return Math.max(0,base-(performance.now()-clk.t))};
function clockInit(tc,sv){if(!tc||tc==='0'){clk=null;paintClock();return}const[m,i]=tc.split('+').map(Number);clk={w:sv?sv.w:m*60000,b:sv?sv.b:m*60000,inc:(i||0)*1000,t:0,tc,started:sv?!!sv.started:false};paintClock()}
function makeClock3D(){const g=new THREE.Group(),dk=mat('#2a2733',{flatShading:false,roughness:.5}),cv=document.createElement('canvas');cv.width=512;cv.height=160;clkCtx=cv.getContext('2d');clkTex=new THREE.CanvasTexture(cv);clkTex.colorSpace=THREE.SRGBColorSpace;
const b=new THREE.Mesh(new THREE.BoxGeometry(1.3,.22,.6),dk);b.position.y=.11;const sc=new THREE.Mesh(new THREE.PlaneGeometry(1.15,.36),new THREE.MeshBasicMaterial({map:clkTex,toneMapped:false}));sc.position.set(0,.3,.1);sc.rotation.x=-.9;
b.castShadow=b.receiveShadow=true;g.add(b,sc);for(const x of[-.42,.42]){const k=new THREE.Mesh(new THREE.CylinderGeometry(.11,.11,.07,16),mat('#8d86ad',{flatShading:false}));k.position.set(x,.25,-.17);k.castShadow=true;g.add(k)}
g.scale.setScalar(.8);g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(F,UP,RK.clone().negate()));g.position.copy(pos(9.8,-.95,tableY));g.visible=false;S.add(g);clkObj=g}
function paintClock(){for(const[id,c]of[['#pb',bottom()],['#pt',-bottom()]]){const e=$(id+' .clk');e.hidden=!clk;if(clk){const ms=clockMs(c);e.textContent=fmt(ms);e.classList.toggle('low',ms<20000&&!over)}}
if(clkObj){clkObj.visible=!!clk;if(clk&&clkCtx){const x=clkCtx;x.fillStyle='#1d1b27';x.fillRect(0,0,512,160);x.font='300 64px ui-sans-serif,system-ui,sans-serif';x.textBaseline='middle';x.textAlign='center';
for(const[c,cx]of[[1,128],[-1,384]]){x.fillStyle=!over&&G.turn===c?'#a9d9c6':'#6f6a86';x.fillText(fmt(clockMs(c)),cx,88);x.fillStyle=c>0?'#efe6d2':'#8d86ad';x.beginPath();x.arc(cx,28,8,0,7);x.fill()}clkTex.needsUpdate=true}}
if(clk&&clk.started&&!over&&clockMs(G.turn)<=0){const c=G.turn;clk[c>0?'w':'b']=0;clk.started=false;over=true;epoch++;thinking=false;clearSel();snd('end');endGame({win:-c,why:'Time'});ui()}}
setInterval(paintClock,250);
const humanTurn=()=>cfg.mode==='local'||G.turn===cfg.me;
const bottom=()=>cfg.mode==='local'?1:cfg.me;
function toast(t,ms=1800){const e=$('#toast');e.textContent=t;e.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('on'),ms)}
const V={1:1,2:3,3:3,4:5,5:9};
function ui(){const h=G.hist,L=$('#hist');let x='';for(let i=0;i<h.length;i+=2)x+=`<li><span>${i/2+1}</span><b${i===h.length-1?' class="cur"':''}>${h[i].san}</b><b${i+1===h.length-1?' class="cur"':''}>${h[i+1]?.san||''}</b></li>`;L.innerHTML=x;L.scrollTop=L.scrollHeight;
const bt=bottom(),cp={1:[],'-1':[]};let sc=0;for(const r of h)if(r.cap){const k=Math.abs(r.cap);cp[r.color].push(k);sc+=r.color*V[k]}
for(const c of[1,-1])cp[c].sort((a,b)=>b-a);
const pName=st.name||'Grandmaster';
const names={top:cfg.mode==='cpu'?'Computer':cfg.mode==='online'?'Opponent':cfg.mode==='scenario'?'Tactical Opponent':bt>0?'Black':'White',bot:cfg.mode==='local'?(bt>0?'White':'Black'):pName};
for(const[id,c,n]of[['#pb',bt,names.bot],['#pt',-bt,names.top]]){const e=$(id);e.querySelector('b').textContent=n;e.querySelector('.cap').innerHTML=cp[c].map(k=>glyph(k,-c)).join('');const a=sc*c;e.querySelector('em').textContent=a>0?'+'+a:'';e.classList.toggle('on',!over&&G.turn===c);e.classList.toggle('th',thinking&&G.turn===c)}
$('[data-a=undo]').disabled=cfg.mode==='online'||!h.length||!!clk;paintClock();$('[data-a=resign]').disabled=over}
function marks(){clr(hl);chk=null;const h=G.hist;if(h.length){const m=h[h.length-1].m;mark(hl,m.from,'sq',HM.lav);mark(hl,m.to,'sq',HM.lav)}if(!over&&G.inCheck())chk=mark(hl,G.ks[G.turn>0?0:1],'sq',HM.lav.clone())}
function clearSel(){sel=-1;selMoves=[];clr(hs)}
function select(sq){clearSel();sel=sq;selMoves=G.legal().filter(m=>m.from===sq);mark(hs,sq,'ring',HM.mint);for(const m of selMoves)mark(hs,m.to,m.cap?'cap':'dot',HM.mint);snd('sel')}
const rc=new THREE.Raycaster(),ndc=new THREE.Vector2();
function ray(ev){const r=canvas.getBoundingClientRect();ndc.set((ev.clientX-r.left)/r.width*2-1,-(ev.clientY-r.top)/r.height*2+1);rc.setFromCamera(ndc,activeCam)}
function planePt(ev,y){ray(ev);const p=new THREE.Vector3();return rc.ray.intersectPlane(new THREE.Plane(UP,-y),p)?p:null}
function sqAt(p){if(!p)return -1;const f=Math.floor(p.clone().sub(O).dot(F)/SZ+4),r=Math.floor(p.clone().sub(O).dot(RK)/SZ+4);return f<0||f>7||r<0||r>7?-1:r*8+f}
function pick(ev){ray(ev);const hit=rc.intersectObjects(pcs.concat(extras).filter(p=>p.visible&&p.userData.sq>=0),true)[0];
if(hit){let o=hit.object;while(o&&o.userData.sq==null)o=o.parent;if(o)return o.userData.sq}return sqAt(planePt(ev,TOP))}
let down=null,hov=-2;
canvas.addEventListener('touchstart',e=>{
  if(e.touches.length>=2){
    if(down&&down.drag){go(down.drag,sqW(down.sq,down.drag.userData.y0),100);down=null;clearSel()}
    if(!is2D)ctl.enabled=true;
  }
},{passive:true});
canvas.addEventListener('pointerdown',e=>{A.init();lock();down={x:e.clientX,y:e.clientY,t:performance.now(),drag:null,moved:false};
if(!ready||busy||over||!humanTurn())return;const sq=pick(e),p=sq>=0?G.b[sq]:0;
if(p&&p*G.turn>0){down.sq=sq;down.drag=mesh[sq];down.was=sel===sq;ctl.enabled=false;if(sel!==sq)select(sq)}},{capture:true});
addEventListener('pointermove',e=>{if(!down?.drag)return;if(!down.moved){if(Math.hypot(e.clientX-down.x,e.clientY-down.y)<7)return;down.moved=true;snd('lift')}
const p=planePt(e,TOP);if(!p)return;const m=down.drag;m.position.set(p.x,m.userData.y0+SZ*1.1,p.z);const sq=sqAt(p);
if(sq!==hov){hov=sq;clr(hv);if(sq>=0&&selMoves.some(x=>x.to===sq))mark(hv,sq,'sq',HM.mint2)}});
addEventListener('pointerup',e=>{if(!down)return;const d=down;down=null;ctl.enabled=true;clr(hv);hov=-2;if(!ready)return;
if(d.drag&&d.moved){const sq=sqAt(planePt(e,TOP)),m=selMoves.filter(x=>x.to===sq);
if(m.length){clearSel();m[0].promo?askPromo(m[0].from,sq):doMove(m[0].from,sq,0)}else{go(d.drag,sqW(d.sq,d.drag.userData.y0),160);snd('err')}return}
if(d.drag){if(d.was)clearSel();return}
const dd=Math.hypot(e.clientX-d.x,e.clientY-d.y),t=performance.now()-d.t;if(dd>8||t>600||busy||over||!humanTurn()||e.target!==canvas)return;
const sq=pick(e);if(sq<0){clearSel();return}const m=selMoves.filter(x=>x.to===sq);
if(sel>=0&&m.length){clearSel();m[0].promo?askPromo(m[0].from,sq):doMove(m[0].from,sq,0);return}clearSel()});
function askPromo(from,to){const c=G.turn,e=$('#promo');e.querySelector('.pk').innerHTML=[5,4,3,2].map(k=>`<button data-k="${k}" aria-label="Promote">${glyph(k,c)}</button>`).join('');e.hidden=false;
e.onclick=ev=>{const b=ev.target.closest('button');if(!b)return;e.hidden=true;doMove(from,to,+b.dataset.k)}}
async function doMove(from,to,promo=0,remote=false){const col=G.turn,rec=G.move(from,to,promo);if(!rec){snd('err');return}
if(clk){if(!clk.started){clk.started=true;clk.t=performance.now()}else{const now=performance.now();clk[col>0?'w':'b']=Math.max(0,clk[col>0?'w':'b']-(now-clk.t))+clk.inc;clk.t=now}}
busy=true;clearSel();const ms=G.status(),mm=rec.m;
if(!remote&&cfg.mode==='online')net.send({t:'move',from,to,promo});
await vmove(mm,col,true,()=>snd(mm.fl==='c'?'castle':mm.cap?'cap':'move'));if(clk&&!over)setTimeout(()=>snd('clock'),140);
over=!!ms.over;marks();ui();save();
if(over){snd('end');endGame(ms);busy=false;return}
if(cfg.mode==='scenario'){
  if(st.scenario==='fork'&&rec.cap===-5){
    over=true;snd('end');toast('Queen captured! Scenario solved!',3500);endGame({win:cfg.me,why:'Queen captured'});busy=false;return;
  }
  if(st.scenario==='endgame'&&rec.m.promo){
    over=true;snd('end');toast('Pawn promoted! Drill solved!',3500);endGame({win:cfg.me,why:'Pawn promoted'});busy=false;return;
  }
}
if(ms.check){snd('check');toast('Check');speak('Check');}
busy=false;
if((cfg.mode==='cpu'||cfg.mode==='scenario')&&G.turn!==cfg.me)aiMove();else if(cfg.mode==='local'&&cfg.auto)flipView(G.turn)}
function aiMove(){if(!W)return;thinking=true;aiT0=Date.now();ui();W.postMessage({moves:G.hist.map(h=>[h.m.from,h.m.to,h.m.promo||0]),level:cfg.level,id:epoch,state:{b:Array.from(G.b),turn:G.turn,cast:G.cast,ep:G.ep,ks:[G.ks[0],G.ks[1]],half:G.half||0,full:G.full||1}})}
function endGame(ms){
  if(clk)clk.started=false;
  const isDraw=ms.win===0;
  const winner=ms.win>0?'White':ms.win<0?'Black':'';
  const heading=cfg.mode==='scenario'?(ms.win===cfg.me?'Scenario Solved!':'Puzzle Failed'):(isDraw?'Draw':`${winner} wins`);
  if(cfg.mode==='scenario'){
    speak(ms.win===cfg.me?'Scenario solved! Well played.':'Puzzle failed. Try again.');
  } else {
    speak(ms.why==='Checkmate'?('Checkmate. '+heading):(ms.why==='Time'?(heading+' on time'):heading));
  }
  const reasons={Checkmate:'by checkmate',Stalemate:'by stalemate',Time:'on time',Resigned:'by resignation',Draw:'by agreement'};
  const sub=reasons[ms.why]||ms.why;

  const icon=$('#res .res-icon svg');
  if(icon){
    if(isDraw){
      icon.innerHTML='<circle cx="12" cy="12" r="9"/><line x1="8" y1="12" x2="16" y2="12"/>';
    } else if((cfg.mode==='local'&&ms.win!==0)||(ms.win===cfg.me)){
      icon.innerHTML='<path d="M12 2l3 7h7l-6 4.5 2.3 7L12 17l-6.3 3.5L8 13 2 8.5h7z"/>';
    } else {
      icon.innerHTML='<circle cx="12" cy="12" r="9"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>';
    }
  }
  $('#res h2').textContent=heading;
  $('#res p').textContent=sub;
  $('#res').hidden=false;
  const card=$('#res .card');
  if(card){card.style.opacity='0';card.style.transform='scale(.92) translateY(12px)';requestAnimationFrame(()=>{card.style.transition='opacity .35s ease,transform .35s ease';card.style.opacity='1';card.style.transform='scale(1) translateY(0)'})}
}
function save(){if(cfg.mode!=='online')LS.set('game',{mode:cfg.mode,me:cfg.me,level:cfg.level,moves:G.hist.map(h=>[h.m.from,h.m.to,h.m.promo||0]),clk:clk&&{w:clk.w,b:clk.b,tc:clk.tc,started:clk.started}})}
async function rebuild(moves){epoch++;thinking=false;G=new Game();resetViz();over=false;busy=true;clearSel();for(const[f,t,p]of moves){const c=G.turn,r=G.move(f,t,p);if(r)await vmove(r.m,c,false)}
const ms=G.status();over=!!ms.over;busy=false;marks();ui();ctlView()}
function ctlView(){const side=cfg.mode==='local'?G.turn:cfg.me;flipView(side)}
const SCENARIOS={
  backrank:{name:'Back-Rank Mate',sub:'White to move · Mate in 1',fen:'3r2k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1',side:1,tip:'White to move: deliver decisive back-rank checkmate'},
  fork:{name:'Knight Royal Fork',sub:'White to move · Win Queen',fen:'2q3k1/5ppp/8/3N4/8/8/5PPP/6K1 w - - 0 1',side:1,tip:'White to move: fork King & Queen with the knight'},
  smothered:{name:'Smothered Mate',sub:'Philidor Pattern · Knight Mate',fen:'6rk/6pp/7N/8/8/8/8/7K w - - 0 1',side:1,tip:'White to move: smothered checkmate with the knight'},
  endgame:{name:'Pawn Endgame Drill',sub:'King & Pawn Opposition',fen:'8/4k3/8/4P3/4K3/8/8/8 w - - 0 1',side:1,tip:'White to move: maintain opposition to promote the pawn'}
};
function loadFen(fen){
  const parts=fen.trim().split(/\s+/),rows=parts[0].split('/'),syms={p:1,n:2,b:3,r:4,q:5,k:6};
  G.reset();G.b.fill(0);let wk=4,bk=60;
  for(let r=7;r>=0;r--){
    let f=0;
    for(const ch of rows[7-r]){
      if(ch>='1'&&ch<='8')f+=+ch;
      else{
        const v=syms[ch.toLowerCase()]*(ch===ch.toUpperCase()?1:-1),sq=r*8+f;
        G.b[sq]=v;if(v===6)wk=sq;if(v===-6)bk=sq;f++;
      }
    }
  }
  G.ks=[wk,bk];G.turn=parts[1]==='b'?-1:1;G.cast=0;
  if(parts[2]){if(parts[2].includes('K'))G.cast|=1;if(parts[2].includes('Q'))G.cast|=2;if(parts[2].includes('k'))G.cast|=4;if(parts[2].includes('q'))G.cast|=8}
  G.ep=-1;G.half=parts[4]?+parts[4]:0;G.full=parts[5]?+parts[5]:1;G.hist=[];G.keys=[G.key()];
}
async function newGame(boot){
  $('#res').hidden=true;let moves=[],sv=null;
  epoch++;thinking=false;over=false;busy=false;clearSel();
  if(boot){
    sv=LS.get('game');
    if(sv&&sv.mode!=='online'&&sv.moves?.length){
      cfg.mode=sv.mode;cfg.me=sv.me;cfg.level=sv.level;cfg.time=sv.clk?.tc||LS.get('time','5+0');moves=sv.moves;
    }else{
      sv=null;if(st.mode==='online')cfg.mode='cpu';cfg.time=LS.get('time','5+0');
    }
  }
  if(cfg.mode==='scenario'){
    const sc=SCENARIOS[st.scenario]||SCENARIOS.backrank;
    cfg.me=sc.side||1;
    loadFen(sc.fen);resetViz();applyPieceSet(st.pieceSet);clockInit(cfg.time);marks();ui();viewSide=sc.side||1;placeCam(viewSide);toast(sc.tip,3400);return;
  }
  await rebuild(moves);clockInit(cfg.time,sv?.clk);viewSide=cfg.mode==='local'?G.turn:cfg.me;placeCam(viewSide);
  if(!over&&cfg.mode==='cpu'&&G.turn!==cfg.me)aiMove();
  if(boot&&!sv&&!LS.get('seen',0)){LS.set('seen',1);openSheet()}
}
/* controls */
$('#tg').onclick=()=>{st.night=!st.night;T.tgt=st.night?1:0;LS.set('night',st.night);A.init();A.ambient(st.scene,st.night)};
const sndI=()=>$('#snd').innerHTML=svgI(st.sound?IC.on:IC.off);sndI();
$('#snd').onclick=()=>{st.sound=!st.sound;LS.set('sound',st.sound);A.init();A.mute();sndI();st.sound&&A.fx.sel()};
$('#hbtn').innerHTML=svgI(IC.hbtn);$('#hbtn').onclick=()=>{$('#panel').classList.toggle('open');setTimeout(resize,50)};
$('.ctl').onclick=async e=>{const b=e.target.closest('button');if(!b)return;const a=b.dataset.a;
if(a==='flip')flipView(-viewSide);
else if(a==='new')cfg.mode==='online'?(net.conn?.open?rematch():openSheet()):openSheet();
else if(a==='undo'&&!busy||a==='undo'&&thinking){const n=cfg.mode==='cpu'?(G.turn===cfg.me?2:1):1,mv=G.hist.slice(0,Math.max(0,G.hist.length-n)).map(h=>[h.m.from,h.m.to,h.m.promo||0]);await rebuild(mv);save();if(cfg.mode==='cpu'&&G.turn!==cfg.me)aiMove()}
else if(a==='resign'&&!over){const loser=cfg.mode==='local'?G.turn:cfg.me;if(cfg.mode==='online')net.send({t:'resign'});over=true;endGame({win:-loser,why:'Resigned'});ui()}};
const b2d=$('#btn2d');if(b2d)b2d.onclick=()=>{toggle2D();b2d.textContent=is2D?'3D':'2D'};
const rst=$('#btn-restart');if(rst)rst.onclick=()=>{if(cfg.mode==='online'){toast('Reset disabled in online room');return}newGame();toast('Game restarted')};
$('#again').onclick=()=>{cfg.mode==='online'?(net.conn?.open?rematch():(openSheet(),$('#res').hidden=true)):newGame()};

/* === STORYBOARD WIZARD CONTROLLER === */
let wizStep=1;
const WIZ_STEPS=[
  {title:'Player Identity',desc:'Enter your moniker and choose your pieces',pill:'Level 1 of 4'},
  {title:'Opponent & Format',desc:'Choose AI level, two players, or tactical scenarios',pill:'Level 2 of 4'},
  {title:'Board & Atmosphere',desc:'Customize checkerboard style and environment lighting',pill:'Level 3 of 4'},
  {title:'Clock & Time Control',desc:'Select match speed or play casual',pill:'Level 4 of 4'}
];
const D={name:st.name,side:st.side,mode:cfg.mode,level:st.level,scenario:st.scenario,board:st.board,pieceSet:st.pieceSet,scene:st.scene,lighting:st.night?'night':'day',time:cfg.time};
const LN=['Beginner','Easy','Club','Expert','Master'];

function setWizStep(n){
  wizStep=Math.max(1,Math.min(4,n));
  const info=WIZ_STEPS[wizStep-1];
  $('#wiz-step-lbl').textContent=info.pill;
  $('#wiz-title').textContent=info.title;
  $('#wiz-desc').textContent=info.desc;
  $$('.wiz-step').forEach(s=>s.hidden=(+s.dataset.step!==wizStep));
  $$('#wiz-dots .wiz-dot').forEach((d,i)=>d.classList.toggle('on',i===wizStep-1));
  $$('#wiz-tabs .wiz-tab').forEach((tab,i)=>tab.classList.toggle('on',i===wizStep-1));
  const pBtn=$('#wiz-prev');if(pBtn)pBtn.style.visibility=wizStep===1?'hidden':'visible';
  const nBtn=$('#wiz-next');
  if(nBtn){
    if(wizStep===4){
      nBtn.innerHTML=(D.mode==='online'?'Create Room':'Start Match')+' <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
    }else{
      nBtn.innerHTML='Next <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>';
    }
  }
}

function syncSheet(){
  const ni=$('#player-name');if(ni&&!ni.matches(':focus'))ni.value=D.name||'Grandmaster';
  $$('#sheet .seg').forEach(s=>{
    const k=s.dataset.k;
    s.querySelectorAll('button').forEach(b=>b.classList.toggle('on',String(D[k])===b.dataset.v));
  });
  $$('#sheet .grid-picker').forEach(gp=>{
    const k=gp.dataset.k;
    gp.querySelectorAll('.pick-item').forEach(b=>b.classList.toggle('on',String(D[k])===b.dataset.v));
  });
  $('#ai-opts').hidden=D.mode!=='cpu';
  $('#scenario-opts').hidden=D.mode!=='scenario';
  $('#net').hidden=D.mode!=='online';
  $('#lvn').textContent=LN[cfg.level-1]+` (Lvl ${cfg.level})`;
  $('#lvl').value=cfg.level;
  setWizStep(wizStep);
}

function openSheet(){
  wizStep=(!over&&G.hist.length>0)?3:1;
  D.name=st.name;
  D.side=st.side;
  D.mode=cfg.mode;
  D.time=cfg.time;
  D.board=st.board;
  D.pieceSet=st.pieceSet;
  D.scene=st.scene;
  D.lighting=st.night?'night':'day';
  D.scenario=st.scenario;
  $('#sheet').hidden=false;
  syncSheet();
}

$('#sheet').onclick=e=>{
  if(e.target.id==='sheet'&&!net.waiting)$('#sheet').hidden=true;
  const b=e.target.closest('.seg button, .pick-item');
  if(!b)return;
  const parent=b.closest('[data-k]');
  if(!parent)return;
  const k=parent.dataset.k;
  const v=b.dataset.v;
  if(k==='side')D.side=+v;
  else if(k==='board'){D.board=v;applyBoardTheme(v)}
  else if(k==='pieceSet'){D.pieceSet=v;applyPieceSet(v)}
  else if(k==='scene'){D.scene=v;st.scene=v;LS.set('scene',v);ready&&buildEnv(v)}
  else if(k==='lighting'){D.lighting=v;st.night=(v==='night');T.tgt=st.night?1:0;LS.set('night',st.night);A.ambient(st.scene,st.night)}
  else if(k==='mode')D.mode=v;
  else if(k==='scenario')D.scenario=v;
  else if(k==='time')D.time=v;
  syncSheet();
};

const wizTabs=$('#wiz-tabs');
if(wizTabs){
  wizTabs.onclick=e=>{
    const tab=e.target.closest('.wiz-tab');
    if(!tab)return;
    setWizStep(+tab.dataset.tab);
  };
}
const nameInput=$('#player-name');
if(nameInput){
  nameInput.oninput=e=>{
    D.name=e.target.value.trim();
    st.name=D.name||'Grandmaster';
    LS.set('playerName',st.name);
  };
}
$('#lvl').oninput=e=>{cfg.level=+e.target.value;st.level=cfg.level;LS.set('level',cfg.level);$('#lvn').textContent=LN[cfg.level-1]+` (Lvl ${cfg.level})`};
$('#wiz-prev').onclick=()=>setWizStep(wizStep-1);
$('#wiz-next').onclick=()=>{
  if(wizStep<4){
    setWizStep(wizStep+1);
  } else {
    const ni=$('#player-name');
    if(ni){st.name=ni.value.trim()||'Grandmaster';D.name=st.name;LS.set('playerName',st.name)}
    cfg.time=D.time;LS.set('time',D.time);
    A.init();A.ambient(st.scene,st.night);lock();
    st.scenario=D.scenario;LS.set('scenario',D.scenario);
    LS.set('mode',D.mode);LS.set('side',D.side);
    if(D.mode==='online'){const side=D.side||(Math.random()<.5?1:-1);net.host(side);return}
    net.close();cfg.mode=D.mode;cfg.me=D.side||(Math.random()<.5?1:-1);
    $('#sheet').hidden=true;LS.set('game',null);newGame();
  }
};
/* online */
const code5=()=>Array.from({length:5},()=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.random()*32|0]).join('');
const net={peer:null,conn:null,waiting:false,code:'',isHost:false,
send(o){this.conn?.open&&this.conn.send(o)},
close(){try{this.conn?.close();this.peer?.destroy()}catch{}this.conn=this.peer=null;this.waiting=false},
host(side){this.close();this.isHost=true;this.code=code5();cfg.me=side;const p=this.peer=new Peer('rjchess-'+this.code);
p.on('open',()=>{this.waiting=true;$('#roomw').hidden=false;$('#room').textContent=this.code;$('#go').hidden=true});
p.on('connection',c=>{if(this.conn?.open){c.close();return}this.attach(c)});
p.on('error',e=>{if(e.type==='unavailable-id')this.host(side);else toast('Connection failed')})},
join(code){this.close();this.isHost=false;const p=this.peer=new Peer();p.on('open',()=>this.attach(p.connect('rjchess-'+code.toUpperCase(),{reliable:true})));p.on('error',()=>toast('Room not found'));toast('Joining')},
attach(c){this.conn=c;const ok=()=>{this.waiting=false;$('#go').hidden=false;$('#roomw').hidden=true;$('#sheet').hidden=true;if(this.isHost)this.start(cfg.me)};c.open?ok():c.on('open',ok);
c.on('data',d=>{if(d.t==='move')doMove(d.from,d.to,d.promo,true);else if(d.t==='start'){cfg.me=d.you;cfg.time=d.time||'0';this.begin()}else if(d.t==='resign'&&!over){over=true;endGame({win:cfg.me,why:'Resigned'});ui()}});
c.on('close',()=>toast('Opponent left',3000))},
start(me){this.send({t:'start',you:-me,time:cfg.time});this.begin()},
begin(){cfg.mode='online';$('#sheet').hidden=true;newGame()}};
function rematch(){cfg.me=-cfg.me;net.start(cfg.me)}
$('#join').onclick=()=>{const c=$('#code').value.trim();if(c.length===5){A.init();net.join(c)}else toast('Enter the 5 character code')};
$('#copy').onclick=async()=>{const u=location.origin+location.pathname+'?room='+net.code;try{navigator.share?await navigator.share({url:u}):await navigator.clipboard.writeText(u);toast('Invite copied')}catch{try{await navigator.clipboard.writeText(u);toast('Invite copied')}catch{}}};
$('#menu').onclick=openSheet;
/* wake lock */
let wl=null;async function lock(){try{if('wakeLock'in navigator&&!wl){wl=await navigator.wakeLock.request('screen');wl.addEventListener('release',()=>wl=null)}}catch{}}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')lock()});lock();
/* boot */
addEventListener('pointerdown',()=>{A.init();A.ambient(st.scene,st.night);lock()},{once:true});
$('#panel').style.visibility='hidden';
T.cur=T.tgt=st.night?1:0;document.documentElement.dataset.theme=st.night?'night':'day';
const room=new URLSearchParams(location.search).get('room');if(room){cfg.mode='online';LS.set('seen',1);setTimeout(()=>{openSheet();D.mode='online';syncSheet();$('#code').value=room.toUpperCase();net.join(room)},800)}
