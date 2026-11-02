/* Light / dark switch. Follows the OS until the user flips it; the choice is remembered. */
(function(){
  var root=document.documentElement,btn=document.getElementById('themeToggle'),KEY='wmo-theme',mq=window.matchMedia('(prefers-color-scheme: dark)');
  var current=function(){return root.getAttribute('data-theme')||(mq.matches?'dark':'light')};
  var sync=function(){btn.setAttribute('aria-checked',current()==='dark')};
  btn.addEventListener('click',function(){
    var next=current()==='dark'?'light':'dark';
    root.setAttribute('data-theme',next);
    try{localStorage.setItem(KEY,next)}catch(e){}
    sync();
  });
  if(mq.addEventListener)mq.addEventListener('change',sync);
  sync();
})();
