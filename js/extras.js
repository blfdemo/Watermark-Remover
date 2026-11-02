/* Settings, mode switching, shortcuts and small extras. Runs after app.js. */
(function(){
const $=id=>document.getElementById(id),root=document.documentElement,body=document.body,KEY='wmo-settings';
const D={theme:'system',loupe:true,auto:false,size:1};let S=Object.assign({},D);
try{Object.assign(S,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
const dark=()=>(root.getAttribute('data-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'))==='dark';
function theme(){
  if(S.theme==='system'){root.removeAttribute('data-theme');try{localStorage.removeItem('wmo-theme')}catch(e){}}
  else{root.setAttribute('data-theme',S.theme);try{localStorage.setItem('wmo-theme',S.theme)}catch(e){}}
  $('themeToggle').setAttribute('aria-checked',dark());
}
function ui(){
  document.querySelector('input[name=sth][value='+S.theme+']').checked=true;
  $('sLoupe').checked=S.loupe;$('sAuto').checked=S.auto;$('sSize').value=S.size;$('sSizeOut').textContent=Math.round(S.size*100)+'%';
}
function apply(){
  theme();body.classList.toggle('no-loupe',!S.loupe);
  $('sz').value=S.size;$('sz').dispatchEvent(new Event('input'));ui();
}
document.querySelectorAll('input[name=sth]').forEach(r=>r.onchange=()=>{S.theme=r.value;save();theme()});
$('sLoupe').onchange=e=>{S.loupe=e.target.checked;save();apply()};
$('sAuto').onchange=e=>{S.auto=e.target.checked;save()};
$('sSize').oninput=e=>{S.size=+e.target.value;save();apply()};
$('setReset').onclick=()=>{S=Object.assign({},D);save();apply()};
$('themeToggle').addEventListener('click',()=>{S.theme=root.getAttribute('data-theme')||'system';save();ui()});
const modal=$('setModal'),open=()=>{ui();modal.style.display='flex'},shut=()=>{modal.style.display='none'};
$('openSet').onclick=open;$('setClose').onclick=$('setDone').onclick=shut;
modal.addEventListener('click',e=>{if(e.target===modal)shut()});

/* switching modes while a file is open */
document.querySelectorAll('input[name=t]').forEach(r=>r.addEventListener('change',()=>{
  body.dataset.tool=tool;
  if(!isEditing()){say('Add a file to get started.');return}
  if(tool==='cv'&&kind!=='gif'){document.querySelector('input[name=t][value=wm]').checked=true;document.querySelector('input[name=t][value=wm]').dispatchEvent(new Event('change'));say('GIF to MP4 needs a GIF. Click New File to choose one.',1);return}
  $('ed').classList.toggle('conv',tool==='cv');mp4Blob=null;
  if(tool==='cv'){lbl('go','Convert to MP4');$('go').classList.remove('dl');say('Set your MP4 options, then convert.')}
  else{setStage();say('Draw a box over the watermark.')}
}));

/* extra MP4 options */
const dirty=()=>$('sz').dispatchEvent(new Event('change'));
document.querySelectorAll('#spPills .pill').forEach(p=>p.onclick=()=>{
  document.querySelectorAll('#spPills .pill').forEach(x=>x.classList.remove('on'));p.classList.add('on');
  $('spd').innerHTML='<option value="'+p.dataset.v+'"></option>';dirty()});
$('mbg').addEventListener('input',dirty);

/* show file name in the MP4 panel */
const baseLoad=load;
window.load=async f=>{await baseLoad(f);if(f&&f.name)$('mp4fname').textContent=f.name};

/* optional one-click remove + download */
const goClick=$('go').onclick;
$('go').onclick=async()=>{
  if(S.auto&&tool==='wm'&&!applied&&!busy){await doProcess();if(applied)doExport();return}
  goClick();
};

/* drop anywhere, paste an image */
addEventListener('dragover',e=>e.preventDefault());
addEventListener('drop',e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f&&!isEditing()&&!e.target.closest('#drop'))load(f)});
addEventListener('paste',e=>{const f=e.clipboardData&&e.clipboardData.files[0];if(f&&!isEditing())load(f)});

/* shortcuts */
addEventListener('keydown',e=>{
  if(e.key==='Escape'&&modal.style.display==='flex'){shut();return}
  if(!isEditing()||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)||modal.style.display==='flex'||$('leaveModal').style.display==='flex')return;
  const k=e.key.toLowerCase(),m=e.metaKey||e.ctrlKey;
  if(m&&k==='z'){e.preventDefault();if(!$('undo').disabled)$('undo').click()}
  else if(m)return;
  else if(k===' '){e.preventDefault();if(kind!=='img')$('play').click()}
  else if(k==='c'&&tool==='wm')$('cmp').click();
  else if(k==='delete'||k==='backspace'){if(tool==='wm')$('clear').click()}
  else if(tool==='wm'&&'1234'.includes(k)&&k){const r=document.querySelectorAll('input[name=m]')[+k-1];if(r){r.checked=true;r.dispatchEvent(new Event('change'))}}
});
apply();
})();
