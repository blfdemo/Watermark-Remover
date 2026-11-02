const $=id=>document.getElementById(id),cv=$('cv'),ctx=cv.getContext('2d',{willReadFrequently:true}),wrap=$('wrap'),root=document.documentElement;
const oc=document.createElement('canvas'),octx=oc.getContext('2d',{willReadFrequently:true});
let W,H,kind,frames=[],delays=[],regions=[],redoStack=[],cur=0,playing=true,timer,drag=null,base='file',ftype='',vid=null,showOrig=false,busy=false,ex=null,gen=0,cmp=false,dd=false,hold=false,applied=false,origSize=0;
const c0=$('cv0').getContext('2d'),lp=$('lp'),lc=$('lpc').getContext('2d');
function lbl(id,t){const b=$(id),l=b&&b.querySelector('.lbl');if(l)l.textContent=t;else if(b)b.textContent=t}
function setPlayIcon(on){const b=$('play');if(!b)return;b.querySelector('.ic-pause').style.display=on?'':'none';b.querySelector('.ic-play').style.display=on?'none':''}
const say=(t,e)=>{$('msg').textContent=t;$('msg').className=e?'err':''};
const fmtSize=b=>b<1e6?(b/1e3).toFixed(1)+' KB':(b/1e6).toFixed(2)+' MB';
const prog=p=>{$('bar').style.display='block';$('bar').firstChild.style.width=(p*100)+'%'};
const mode=()=>document.querySelector('input[name=m]:checked').value;
const HINTS={fill:'Blends the surrounding pixels over the selection. Best on plain or smooth backgrounds — fast and works everywhere. Try this first.',pix:'Hides the selection under a soft mosaic. Good for busy backgrounds.',crop:'Keeps only your last selection and cuts the rest away. Best when the watermark is near an edge.',ai:'⚠ Highest quality, but heavy: an AI model (LaMa) runs entirely in your browser, needs a lot of memory, is slow, and can crash the tab on large files. Try Smart fill first — only switch to AI erase if that result isn\u2019t clean enough. Works best on single photos or small/short GIFs. Videos always use Smart fill.'};
document.querySelectorAll('input[name=m]').forEach(r=>r.onchange=()=>{$('hint').textContent=HINTS[mode()];$('hint').classList.toggle('warn',mode()==='ai')});$('hint').textContent=HINTS.fill;

$('drop').onclick=()=>$('file').click();
$('drop').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('file').click()}};
$('sz').addEventListener('input',()=>$('sz').style.setProperty('--fill',(($('sz').value-.5)/.5*100)+'%'));
$('file').onchange=e=>e.target.files[0]&&load(e.target.files[0]);
['dragover','dragenter'].forEach(v=>$('drop').addEventListener(v,e=>{e.preventDefault();$('drop').classList.add('over')}));
['dragleave','drop'].forEach(v=>$('drop').addEventListener(v,e=>{e.preventDefault();$('drop').classList.remove('over')}));
$('drop').addEventListener('drop',e=>e.dataTransfer.files[0]&&load(e.dataTransfer.files[0]));
function isEditing(){return $('ed').style.display==='block'}
function goHome(){location.reload()}
function confirmLeave(){
  if(!isEditing()){goHome();return}
  $('leaveModal').style.display='flex';
}
$('leaveCancel').onclick=()=>{$('leaveModal').style.display='none'};
$('leaveConfirm').onclick=()=>{goHome()};
$('leaveModal').addEventListener('click',e=>{if(e.target.id==='leaveModal')$('leaveModal').style.display='none'});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('leaveModal').style.display==='flex')$('leaveModal').style.display='none'});
$('logo').onclick=confirmLeave;
$('logo').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();confirmLeave()}};
$('new').onclick=confirmLeave;
document.querySelectorAll('#rpPills .pill').forEach(p=>p.onclick=()=>{
  document.querySelectorAll('#rpPills .pill').forEach(x=>x.classList.remove('on'));
  p.classList.add('on');$('rp').value=p.dataset.v;$('rp').dispatchEvent(new Event('change'));
});

async function load(f){
  try{
    if(tool==='cv'&&f.type!=='image/gif'){alert('Please choose a GIF file.');return}
    gen++;base=f.name.replace(/\.[^.]+$/,'');ftype=f.type;origSize=f.size;regions=[];redoStack=[];cur=0;frames=[];delays=[];
    if(f.type==='image/gif'){
      const r=new OG.GifReader(new Uint8Array(await f.arrayBuffer()));W=r.width;H=r.height;cv.width=W;cv.height=H;
      let buf=new Uint8ClampedArray(W*H*4);
      for(let i=0;i<r.numFrames();i++){
        const fi=r.frameInfo(i),snap=fi.disposal===3?buf.slice():null;
        r.decodeAndBlitFrameRGBA(i,buf);frames.push(buf.slice());delays.push(Math.max(2,fi.delay)*10);
        if(fi.disposal===2){for(let y=fi.y;y<fi.y+fi.height;y++)buf.fill(0,(y*W+fi.x)*4,(y*W+fi.x+fi.width)*4)}else if(snap)buf=snap;
      }
      kind='gif';
    }else if(f.type.startsWith('image/')){
      const bm=await createImageBitmap(f);W=bm.width;H=bm.height;cv.width=W;cv.height=H;ctx.drawImage(bm,0,0);
      frames=[ctx.getImageData(0,0,W,H).data];delays=[100];kind='img';
    }else if(f.type.startsWith('video/')){
      await new Promise((ok,no)=>{vid=document.createElement('video');vid.src=URL.createObjectURL(f);vid.muted=true;vid.loop=true;vid.playsInline=true;
        vid.onloadedmetadata=()=>{W=vid.videoWidth;H=vid.videoHeight;cv.width=oc.width=W;cv.height=oc.height=H;ok()};vid.onerror=no});
      kind='vid';
    }else throw 0;
    $('cv0').width=W;$('cv0').height=H;cmp=false;wrap.classList.remove('cmpon');lbl('cmp','Compare');$('cmp').classList.remove('on');$('drop').style.display='none';$('ed').style.display='block';document.body.classList.add('editing');document.documentElement.style.setProperty('--ar',W/H);$('ed').classList.toggle('conv',tool==='cv');$('mp4row').style.display=kind==='gif'?'block':'none';if($('mp4fname'))$('mp4fname').textContent=base+'.gif · '+fmtSize(origSize);mp4Blob=null;if(tool==='cv')lbl('go','Convert to MP4');$('play').style.display=kind==='img'?'none':'';updateHistBtns();
    say((kind==='gif'?frames.length+' frames · ':'')+W+'×'+H+' · '+fmtSize(origSize)+' · Step 1: draw a box over the watermark.');playing=true;lbl('play','Pause');setPlayIcon(true);start();
  }catch(e){say('Could not read that file.',1);$('ed').style.display='block'}
}

function fillR(d,r){
  const{x,y,w,h}=r,g=(px,py)=>{px=Math.min(W-1,Math.max(0,px));py=Math.min(H-1,Math.max(0,py));const o=(py*W+px)*4;return[d[o],d[o+1],d[o+2]]};
  const L=[],R=[],T=[],B=[];
  for(let j=0;j<h;j++){L.push(g(x-1,y+j));R.push(g(x+w,y+j))}
  for(let i=0;i<w;i++){T.push(g(x+i,y-1));B.push(g(x+i,y+h))}
  for(let j=0;j<h;j++){const ty=(j+.5)/h;for(let i=0;i<w;i++){const tx=(i+.5)/w,o=((y+j)*W+x+i)*4;
    for(let c=0;c<3;c++)d[o+c]=(L[j][c]*(1-tx)+R[j][c]*tx+T[i][c]*(1-ty)+B[i][c]*ty)/2;d[o+3]=255}}
}
function pixR(d,r){
  const b=Math.max(4,Math.round(Math.min(r.w,r.h)/3));
  for(let by=r.y;by<r.y+r.h;by+=b)for(let bx=r.x;bx<r.x+r.w;bx+=b){
    const ex_=Math.min(bx+b,r.x+r.w),ey=Math.min(by+b,r.y+r.h);let s=[0,0,0],n=0;
    for(let y=by;y<ey;y++)for(let x=bx;x<ex_;x++){const o=(y*W+x)*4;s[0]+=d[o];s[1]+=d[o+1];s[2]+=d[o+2];n++}
    for(let y=by;y<ey;y++)for(let x=bx;x<ex_;x++){const o=(y*W+x)*4;d[o]=s[0]/n;d[o+1]=s[1]/n;d[o+2]=s[2]/n;d[o+3]=255}}
}
const apply=(d,i)=>{if(!applied)return d;for(const r of regions){if(r.m==='fill')fillR(d,r);else if(r.m==='pix')pixR(d,r);else if(r.m==='ai'){const q=r.p&&r.p[i];q?paste(d,q):fillR(d,r)}}return d};
const process=i=>showOrig?frames[i]:apply(frames[i].slice(),i);
const cropOf=()=>[...regions].reverse().find(r=>r.m==='crop');
function cut(d,c){if(!c)return d;const o=new Uint8ClampedArray(c.w*c.h*4);for(let y=0;y<c.h;y++)o.set(d.subarray(((c.y+y)*W+c.x)*4,((c.y+y)*W+c.x+c.w)*4),y*c.w*4);return o}

function od(i){if(!cmp)return;if(kind==='vid')c0.drawImage(vid,0,0,W,H);else c0.putImageData(new ImageData(frames[i],W,H),0,0)}
function vdraw(){
  octx.drawImage(vid,0,0,W,H);if(!ex)od();
  if(applied&&regions.length){const im=octx.getImageData(0,0,W,H);apply(im.data);octx.putImageData(im,0,0)}
  if(ex)ctx.drawImage(oc,ex.x,ex.y,ex.w,ex.h,0,0,ex.w,ex.h);else ctx.drawImage(oc,0,0);
}
const redraw=()=>{if(kind==='vid'){if(vid.paused)vdraw()}else if(!playing||kind==='img'){ctx.putImageData(new ImageData(process(cur),W,H),0,0);od(cur)}};
function start(){
  const g=gen;clearTimeout(timer);
  if(kind==='vid'){vid.play();const l=()=>{if(g!==gen)return;vdraw();requestAnimationFrame(l)};l();return}
  const step=()=>{if(g!==gen)return;ctx.putImageData(new ImageData(process(cur),W,H),0,0);od(cur);const d=delays[cur];cur=(cur+1)%frames.length;if(playing&&kind==='gif')timer=setTimeout(step,d)};
  step();
}
$('play').onclick=()=>{playing=!playing;lbl('play',playing?'Pause':'Play');setPlayIcon(playing);if(kind==='vid')playing?vid.play():vid.pause();else if(playing)start()};
function updateHistBtns(){$('undo').disabled=!regions.length;$('redo').disabled=!redoStack.length;updateQtyEstimate()}
function estBytes(){
  if(!frames.length)return 0;
  const c=applied?cropOf():null,cw=c?c.w:W,ch=c?c.h:H;
  const z=+$('sz').value,reps=+$('rp').value||1;
  const w=Math.max(2,Math.round(cw*z)&~1),h=Math.max(2,Math.round(ch*z)&~1);
  const bitrate=Math.max(1e6,w*h*8);
  const durSec=(delays.reduce((a,b)=>a+b,0)/1000)*reps;
  return bitrate*durSec/8;
}
function updateQtyEstimate(){
  const el=$('qtyOut');if(!el)return;
  el.textContent=(kind==='gif'&&frames.length)?'≈ '+fmtSize(estBytes())+' output':'';
}
$('sz').addEventListener('input',updateQtyEstimate);
document.querySelectorAll('#rpPills .pill').forEach(p=>p.addEventListener('click',updateQtyEstimate));
$('undo').onclick=()=>{if(!regions.length)return;redoStack.push(regions.pop());reset();boxes();redraw();updateHistBtns()};
$('redo').onclick=()=>{if(!redoStack.length)return;regions.push(redoStack.pop());reset();boxes();redraw();updateHistBtns()};
$('clear').onclick=()=>{if(!regions.length)return;regions=[];redoStack=[];reset();boxes();redraw();updateHistBtns();say('Cleared. Draw a new box over the watermark to start again.')};
function setCmp(on){cmp=on;wrap.classList.toggle('cmpon',on);lbl('cmp',on?'Exit compare':'Compare');$('cmp').classList.toggle('on',on);lp.style.display='none';if(on)wrap.style.setProperty('--p','50%');if(kind)redraw()}
$('cmp').onclick=()=>{if(!applied&&!cmp){say('Click Remove watermark first, then compare.',1);return}setCmp(!cmp)};

function boxes(){
  wrap.querySelectorAll('.box').forEach(b=>b.remove());
  for(const r of regions.concat(drag&&drag.r?[drag.r]:[])){const b=document.createElement('div');b.className='box';
    b.style.cssText=`left:${r.x/W*100}%;top:${r.y/H*100}%;width:${r.w/W*100}%;height:${r.h/H*100}%`;wrap.appendChild(b)}
}
const pt=e=>{const b=cv.getBoundingClientRect();return{x:Math.min(W,Math.max(0,(e.clientX-b.left)*W/b.width)),y:Math.min(H,Math.max(0,(e.clientY-b.top)*H/b.height))}};
const rect=(a,b)=>{const x=Math.round(Math.min(a.x,b.x)),y=Math.round(Math.min(a.y,b.y));return{x,y,w:Math.round(Math.max(a.x,b.x))-x,h:Math.round(Math.max(a.y,b.y))-y}};
const mv=e=>{const b=cv.getBoundingClientRect();wrap.style.setProperty('--p',Math.min(100,Math.max(0,(e.clientX-b.left)/b.width*100))+'%')};
function loupe(e){
  if(cmp||busy||tool==='cv'){lp.style.display='none';return}
  const b=cv.getBoundingClientRect(),p=pt(e),sw=32*W/b.width,S=126,m=S/sw,tx=v=>(v-(p.x-sw/2))*m,ty=v=>(v-(p.y-sw/2))*m;
  lc.imageSmoothingEnabled=false;lc.fillStyle='#000';lc.fillRect(0,0,S,S);
  lc.drawImage(cv,p.x-sw/2,p.y-sw/2,sw,sw,0,0,S,S);
  if(drag){const r=rect(drag.a,p);lc.strokeStyle='#fff';lc.lineWidth=2;lc.strokeRect(tx(r.x),ty(r.y),r.w*m,r.h*m)}
  lc.strokeStyle='#fff';lc.lineWidth=1;lc.beginPath();lc.moveTo(S/2-9,S/2);lc.lineTo(S/2+9,S/2);lc.moveTo(S/2,S/2-9);lc.lineTo(S/2,S/2+9);lc.stroke();
  lp.style.display='block';lp.style.left=Math.min(innerWidth-138,Math.max(4,e.clientX-66))+'px';lp.style.top=(e.clientY<190?e.clientY+40:e.clientY-172)+'px';
}
wrap.addEventListener('pointerdown',e=>{if(busy||tool==='cv')return;wrap.setPointerCapture(e.pointerId);
  if(cmp){dd=true;mv(e);return}
  if(playing&&kind!=='img'){hold=true;$('play').onclick()}
  drag={a:pt(e),r:null};loupe(e)});
wrap.addEventListener('pointermove',e=>{if(dd){mv(e);return}
  if(drag){drag.r=rect(drag.a,pt(e));boxes()}
  if(drag||e.pointerType==='mouse')loupe(e)});
wrap.addEventListener('pointerup',e=>{if(dd){dd=false;return}if(!drag)return;
  const r=rect(drag.a,pt(e));drag=null;if(r.w>=3&&r.h>=3){const nr={...r,m:kind==='vid'&&mode()==='ai'?'fill':mode()};regions.push(nr);redoStack=[];reset();updateHistBtns()}
  boxes();redraw();if(e.pointerType!=='mouse')lp.style.display='none';
  if(hold){hold=false;$('play').onclick()}});
wrap.addEventListener('pointerleave',()=>{if(!drag)lp.style.display='none'});

const ORT='https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/',MODELS=['https://huggingface.co/edgetools/lama/resolve/main/lama_fp32.onnx','https://huggingface.co/Carve/LaMa-ONNX/resolve/main/lama_fp32.onnx'];
let sp=null;
const lo=src=>new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=()=>no(new Error('could not load the AI engine (internet needed once)'));document.head.appendChild(s)});
async function getModel(){
  let cache=null;try{cache=await caches.open('lama-v1')}catch(e){}
  for(const u of MODELS){try{
    let r=cache&&await cache.match(u);
    if(!r){r=await fetch(u);if(!r.ok)throw 0;const len=+r.headers.get('content-length')||208e6,rd=r.body.getReader(),parts=[];let got=0;
      for(;;){const{done,value}=await rd.read();if(done)break;parts.push(value);got+=value.length;prog(got/len);say('Downloading AI model (one time, ~200 MB): '+Math.round(got/1e6)+' MB')}
      const b=new Blob(parts);if(b.size<1e7)throw 0;if(cache){try{await cache.put(u,new Response(b))}catch(e){}}return new Uint8Array(await b.arrayBuffer())}
    return new Uint8Array(await r.arrayBuffer());
  }catch(e){}}
  throw new Error('model download failed');
}
function getSess(){if(sp)return sp;sp=(async()=>{
  say('Loading AI engine…');await lo(ORT+'ort.webgpu.min.js');ort.env.wasm.wasmPaths=ORT;if(!self.crossOriginIsolated)ort.env.wasm.numThreads=1;
  let buf=await getModel();say('Starting AI…');await tick();
  for(const ep of navigator.gpu?[['webgpu'],['wasm']]:[['wasm']]){try{const s=await ort.InferenceSession.create(buf,{executionProviders:ep,enableCpuMemArena:false,enableMemPattern:false});buf=null;return s}catch(e){}}
  throw new Error('could not start the model')})();sp.catch(()=>{sp=null});return sp}
function paste(d,q){for(let y=0;y<q.h;y++)d.set(q.d.subarray(y*q.w*4,(y+1)*q.w*4),((q.y+y)*W+q.x)*4)}
const S=512,N=S*S,IMG=new Float32Array(3*N),MK=new Float32Array(N),sc=document.createElement('canvas'),wc=document.createElement('canvas');wc.width=wc.height=S;
const scx=sc.getContext('2d',{willReadFrequently:true}),wx=wc.getContext('2d',{willReadFrequently:true});
async function aiFill(i,r,sess){
  const m=Math.max(r.w,r.h);
  if(m>Math.min(W,H)){const d=frames[i].slice();fillR(d,r);return{x:r.x,y:r.y,w:r.w,h:r.h,d:cut(d,r)}}
  const s=Math.min(W,H,Math.max(256,m*3)),sx=Math.max(0,Math.min(W-s,Math.round(r.x+r.w/2-s/2))),sy=Math.max(0,Math.min(H-s,Math.round(r.y+r.h/2-s/2))),k=S/s;
  if(sc.width!==W||sc.height!==H){sc.width=W;sc.height=H}
  scx.putImageData(new ImageData(frames[i],W,H),0,0);
  wx.imageSmoothingQuality='high';wx.drawImage(sc,sx,sy,s,s,0,0,S,S);
  const px=wx.getImageData(0,0,S,S).data;
  for(let j=0;j<N;j++){IMG[j]=px[j*4]/255;IMG[N+j]=px[j*4+1]/255;IMG[2*N+j]=px[j*4+2]/255}
  MK.fill(0);
  const x0=Math.max(0,Math.floor((r.x-sx)*k)-3),x1=Math.min(S,Math.ceil((r.x+r.w-sx)*k)+3),y0=Math.max(0,Math.floor((r.y-sy)*k)-3),y1=Math.min(S,Math.ceil((r.y+r.h-sy)*k)+3);
  for(let y=y0;y<y1;y++)MK.fill(1,y*S+x0,y*S+x1);
  const ti=new ort.Tensor('float32',IMG,[1,3,S,S]),tm=new ort.Tensor('float32',MK,[1,1,S,S]);
  const res=await sess.run({[sess.inputNames[0]]:ti,[sess.inputNames[1]]:tm}),ot=res[sess.outputNames[0]],o=ot.data;
  const e={x:Math.max(0,Math.floor(sx+x0/k)),y:Math.max(0,Math.floor(sy+y0/k))};
  e.w=Math.min(W,Math.ceil(sx+x1/k))-e.x;e.h=Math.min(H,Math.ceil(sy+y1/k))-e.y;
  const d=new Uint8ClampedArray(e.w*e.h*4);
  for(let y=0;y<e.h;y++)for(let x=0;x<e.w;x++){
    const u=Math.min(S-1,Math.max(0,Math.floor((e.x+x+.5-sx)*k))),v=Math.min(S-1,Math.max(0,Math.floor((e.y+y+.5-sy)*k))),q=v*S+u,p=(y*e.w+x)*4;
    d[p]=o[q];d[p+1]=o[N+q];d[p+2]=o[2*N+q];d[p+3]=255}
  for(const z of[ot,ti,tm]){try{z.dispose()}catch(_){}}
  e.d=d;return e;
}
function ringDiff(a,b,r){
  const P=10,x0=Math.max(0,r.x-P),y0=Math.max(0,r.y-P),x1=Math.min(W,r.x+r.w+P),y1=Math.min(H,r.y+r.h+P);let s=0,n=0;
  for(let y=y0;y<y1;y+=2)for(let x=x0;x<x1;x+=2){if(x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h)continue;const o=(y*W+x)*4;s+=Math.abs(a[o]-b[o])+Math.abs(a[o+1]-b[o+1])+Math.abs(a[o+2]-b[o+2]);n+=3}
  return n?s/n:0}
let stopAI=false;
async function runAI(){
  const s=await getSess(),t0=Date.now(),key={},n=frames.length;let ran=0,thr=8;
  for(let i=0;i<n;i++){
    if(stopAI)throw new Error('cancelled');
    for(let ri=0;ri<regions.length;ri++){
      const r=regions[ri];if(r.m!=='ai')continue;const k=key[ri];
      if(k&&ringDiff(frames[i],frames[k.i],r)<thr){(r.p=r.p||{})[i]=k.p;continue}
      const p=await aiFill(i,r,s);ran++;(r.p=r.p||{})[i]=p;key[ri]={i,p};
      const pp=(Date.now()-t0)/ran;
      if(n>8&&pp>25000)throw new Error('too slow on this device');
      if(pp*n>6e4&&thr<40)thr*=1.2;
    }
    prog((i+1)/n);const per=(Date.now()-t0)/Math.max(1,ran),left=Math.ceil(per*ran/(i+1)*(n-i-1)/1000);
    say('AI cleaning frame '+(i+1)+' of '+n+' · about '+left+'s left');await tick();
  }
}
function setStage(){lbl('go',applied?'Download '+(kind==='gif'?'GIF':kind==='vid'?'video':'image'):'Remove watermark');$('go').classList.toggle('dl',applied)}
function reset(){applied=false;regions.forEach(r=>delete r.p);setStage();if(cmp)setCmp(false)}
async function doProcess(){
  if(!regions.length){say('Draw a box over the watermark first.',1);return}
  const ai=kind!=='vid'&&regions.some(r=>r.m==='ai');
  busy=true;stopAI=false;lbl('go',ai?'Cancel':'Working…');$('go').disabled=!ai;say('Working…');
  try{
    if(ai){try{await runAI()}catch(e){
      if(e.message==='cancelled')throw e;
      regions.forEach(r=>{if(r.m==='ai')r.m='fill'});say('AI stopped ('+e.message+'). Used Smart fill instead.',1);await tick()}}
    applied=true;
  }catch(e){reset();say(e.message==='cancelled'?'Cancelled. Your selection is still there.':'Something went wrong: '+(e.message||e),1)}
  busy=false;$('go').disabled=false;$('bar').style.display='none';setStage();
  if(applied){setCmp(true);if($('msg').className!=='err')say('Step 3: drag the divider to check the result, then Download. Not right? Hit Redo.')}
}
$('go').onclick=()=>tool==='cv'?convGo():busy?(stopAI=true):applied?doExport():doProcess();
$('redo').onclick=()=>{reset();setCmp(false);say('Adjust your selection, then click Remove watermark.')};
let tool='wm',mp4Blob=null;
document.querySelectorAll('input[name=t]').forEach(r=>r.onchange=()=>{tool=r.value;const c=tool==='cv';
  document.querySelector('h1').textContent=c?'Convert GIF to MP4':'Remove watermarks from photos, GIFs & videos';
  document.querySelector('.hero p').textContent=c?'Smaller files, sharper video, plays everywhere. Runs on your device.':'Select the watermark, pick a method, download the clean file.';
  $('file').accept=c?'image/gif':'image/*,video/*';$('drop').querySelector('small').textContent=c?'GIF files':'JPG · PNG · WebP · GIF · MP4 · WebM'});
const nap=ms=>new Promise(r=>setTimeout(r,ms));
async function makeMp4(){
  const c=applied?cropOf():null,cw=c?c.w:W,ch=c?c.h:H,z=+$('sz').value,reps=+$('rp').value;
  const w=Math.max(2,Math.round(cw*z)&~1),h=Math.max(2,Math.round(ch*z)&~1),total=frames.length*reps;let n=0;
  const tc=document.createElement('canvas'),ec=document.createElement('canvas');tc.width=cw;tc.height=ch;ec.width=w;ec.height=h;
  const tx=tc.getContext('2d'),ex2=ec.getContext('2d');
  const paint=i=>{tx.putImageData(new ImageData(cut(process(i),c),cw,ch),0,0);ex2.fillStyle=$('mbg').value;ex2.fillRect(0,0,w,h);ex2.drawImage(tc,0,0,w,h)};
  if(window.VideoEncoder&&window.Mp4Muxer){
    let cfg=null;
    for(const codec of['avc1.640028','avc1.4d0028','avc1.42001f']){const q={codec,width:w,height:h,bitrate:Math.max(1e6,w*h*8),framerate:30};try{if((await VideoEncoder.isConfigSupported(q)).supported){cfg=q;break}}catch(e){}}
    if(cfg){
      const mux=new Mp4Muxer.Muxer({target:new Mp4Muxer.ArrayBufferTarget(),video:{codec:'avc',width:w,height:h},fastStart:'in-memory'});
      let err=null;const enc=new VideoEncoder({output:(k,m)=>mux.addVideoChunk(k,m),error:e=>{err=e}});enc.configure(cfg);
      let ts=0;
      for(let r=0;r<reps;r++)for(let i=0;i<frames.length;i++){
        if(err)throw err;
        paint(i);const dur=delays[i]*1000/(+$('spd').value||1),vf=new VideoFrame(ec,{timestamp:ts,duration:dur});
        enc.encode(vf,{keyFrame:n%60===0});vf.close();ts+=dur;n++;
        while(enc.encodeQueueSize>6)await nap(5);
        prog(n/total);say('Converting frame '+n+' of '+total+'…');if(n%4===0)await nap(0);
      }
      await enc.flush();enc.close();if(err)throw err;mux.finalize();
      return{blob:new Blob([mux.target.buffer],{type:'video/mp4'}),ext:'mp4'};
    }
  }
  const mt=window.MediaRecorder&&['video/mp4;codecs=avc1','video/mp4','video/webm;codecs=vp9','video/webm'].find(x=>MediaRecorder.isTypeSupported(x));
  if(!mt)throw new Error('this browser cannot create video. Try Chrome, Edge or Safari');
  const rec=new MediaRecorder(ec.captureStream(30),{mimeType:mt,videoBitsPerSecond:6e6}),parts=[],done=new Promise(r=>rec.onstop=r);
  rec.ondataavailable=e=>e.data.size&&parts.push(e.data);rec.start();
  for(let r=0;r<reps;r++)for(let i=0;i<frames.length;i++){paint(i);n++;prog(n/total);say('Recording in real time… '+n+' of '+total);await nap(delays[i])}
  rec.stop();await done;
  return{blob:new Blob(parts,{type:mt.split(';')[0]}),ext:mt.startsWith('video/mp4')?'mp4':'webm'};
}
async function convGo(){
  if(busy)return;
  if(mp4Blob){save(mp4Blob.blob,base+'.'+mp4Blob.ext);return}
  busy=true;$('go').disabled=true;
  try{mp4Blob=await makeMp4();lbl('go','Download '+mp4Blob.ext.toUpperCase());$('go').classList.add('dl');
    say('Done · '+fmtSize(mp4Blob.blob.size)+' (was '+fmtSize(origSize)+'). Click Download.'+(mp4Blob.ext==='webm'?' (This browser made WebM instead of MP4.)':''))}
  catch(e){say('Could not convert: '+(e.message||e),1)}
  busy=false;$('go').disabled=false;setTimeout(()=>$('bar').style.display='none',1200);
}
$('sz').onchange=$('rp').onchange=()=>{mp4Blob=null;if(tool==='cv'){lbl('go','Convert to MP4');$('go').classList.remove('dl')}};
$('mp4').onclick=async()=>{
  if(busy)return;busy=true;$('mp4').disabled=true;
  try{const r=await makeMp4();save(r.blob,base+(applied?'-clean':'')+'.'+r.ext);say('Saved as '+r.ext.toUpperCase()+' · '+fmtSize(r.blob.size)+' (was '+fmtSize(origSize)+').')}
  catch(e){say('Could not convert: '+(e.message||e),1)}
  busy=false;$('mp4').disabled=false;setTimeout(()=>$('bar').style.display='none',1200);
};
function save(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}
const tick=()=>new Promise(r=>setTimeout(r));

async function doExport(){
  if(!regions.length){say('Draw a box over the watermark first.',1);return}
  busy=true;showOrig=false;$('go').disabled=true;const c=cropOf(),cw=c?c.w:W,ch=c?c.h:H;
  try{
    if(kind==='img'){
      const t=document.createElement('canvas');t.width=cw;t.height=ch;t.getContext('2d').putImageData(new ImageData(cut(process(0),c),cw,ch),0,0);
      const ty=/jpe?g/.test(ftype)?'image/jpeg':ftype==='image/webp'?'image/webp':'image/png';
      t.toBlob(b=>{save(b,base+'-clean.'+(ty==='image/jpeg'?'jpg':ty.slice(6)));say('Done · '+fmtSize(b.size)+'. Your download has started.')},ty,.95);
    }else if(kind==='gif'){
      const gif=GE.GIFEncoder();
      for(let i=0;i<frames.length;i++){
        const d=cut(process(i),c).slice();for(let p=0;p<d.length;p+=4)if(d[p+3]<128){d[p]=d[p+1]=d[p+2]=255}
        const pal=GE.quantize(d,256,{format:'rgb565'});gif.writeFrame(GE.applyPalette(d,pal,'rgb565'),cw,ch,{palette:pal,delay:delays[i],repeat:0});
        prog((i+1)/frames.length);say('Processing frame '+(i+1)+' of '+frames.length+'…');await tick();
      }
      gif.finish();const gBlob=new Blob([gif.bytes()],{type:'image/gif'});save(gBlob,base+'-clean.gif');say('Done · '+fmtSize(gBlob.size)+' (was '+fmtSize(origSize)+'). Your download has started.');
    }else{
      if(!window.MediaRecorder)throw new Error('This browser cannot record video. Try Chrome, Edge or Safari 14.1+.');
      ex=c||null;cv.width=cw;cv.height=ch;
      if(!vid.dst){const ac=new AudioContext(),s=ac.createMediaElementSource(vid);vid.dst=ac.createMediaStreamDestination();s.connect(vid.dst)}
      const st=new MediaStream([...cv.captureStream(30).getVideoTracks(),...vid.dst.stream.getAudioTracks()]);
      const mt=['video/mp4;codecs=avc1','video/webm;codecs=vp9,opus','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));
      const rec=new MediaRecorder(st,{mimeType:mt,videoBitsPerSecond:8e6}),parts=[];
      rec.ondataavailable=e=>e.data.size&&parts.push(e.data);
      vid.loop=false;vid.muted=false;vid.currentTime=0;await tick();
      const iv=setInterval(()=>{prog(vid.currentTime/vid.duration);say('Processing in real time… keep this tab open.')},300);
      await new Promise(res=>{rec.onstop=res;vid.onended=()=>rec.stop();rec.start();vid.play()});
      clearInterval(iv);ex=null;cv.width=W;cv.height=H;vid.onended=null;vid.loop=true;vid.muted=true;vid.play();
      const vBlob=new Blob(parts,{type:mt.split(';')[0]});save(vBlob,base+'-clean.'+(mt.startsWith('video/mp4')?'mp4':'webm'));say('Done · '+fmtSize(vBlob.size)+'. Your download has started.');
    }
  }catch(e){say('Something went wrong: '+(e.message||e),1)}
  busy=false;$('go').disabled=false;setTimeout(()=>$('bar').style.display='none',1500);
}
