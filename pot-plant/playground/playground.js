const state = {phase:'before',busy:false,defaultOrder:[...PlaygroundModel.DEFAULT],beforeOrder:[...PlaygroundModel.DEFAULT],afterOrder:null,previousStopPoint:null,language:langCode};
const $ = id => document.getElementById(id);
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const ranksFor = order => ORDER.map(k=>order.indexOf(k)+1);
const pointsFor = (order, after=false) => spiralPts(ranksFor(order),after?0:-1,ORDER.indexOf(order[0]));
const say = message => $('announcement').textContent=message;
const caption = message => $('plantCaption').textContent=message;
function drawSpiral(pts, n=pts.length) {
  const d=pathOf(pts,n);spiral.setAttribute('d',d);under.setAttribute('d',d);
  const q=pts[n-1];dot.setAttribute('cx',q[0]);dot.setAttribute('cy',q[1]);dot.style.opacity=1;
}
function highlight(key) {
  [...wg.children].forEach((w,i)=>w.classList.toggle('highlight',ORDER[i]===key));
  [...$('cards').children].forEach(c=>c.classList.toggle('highlight',c.dataset.key===key));
}
function drawBefore() {
  setWedges(ranksFor(state.beforeOrder),-1,true);
  drawSpiral(pointsFor(state.beforeOrder));
  oldDot.style.opacity=0;
  caption(t('beforeCaption',{name:lang.qcs[state.beforeOrder[0]].name}));
}
function controls() {
  const locked=state.busy || state.phase==='after';
  $('cards').classList.toggle('locked',locked);
  $('cards').setAttribute('aria-busy',String(state.busy));
  [...$('cards').children].forEach((card,index)=>{
    card.querySelector('.handle').disabled=locked;
    card.querySelector('.up').disabled=locked||index===0;
    card.querySelector('.down').disabled=locked||index===7;
  });
  $('grow').disabled=state.busy;
  $('reset').disabled=state.busy;
  $('reset').hidden=state.phase==='after';
  $('return').hidden=state.phase!=='after';
  $('instructions').hidden=state.phase==='after';
  $('rankingTitle').textContent=t(state.phase==='after'?'afterHeading':'beforeHeading');
  $('beforeText').hidden=state.phase==='after';
  $('afterText').hidden=state.phase!=='after';
}
function move(key,index,focusClass) {
  if(state.busy||state.phase!=='before')return;
  const order=[...state.beforeOrder].reverse();
  const from=order.indexOf(key);index=Math.max(0,Math.min(7,index));
  if(from===index)return;
  order.splice(from,1);order.splice(index,0,key);
  state.beforeOrder=order.reverse();
  const card=$('cards').querySelector(`[data-key="${key}"]`);
  const active=document.activeElement;
  syncOrder();drawBefore();controls();highlight(key);
  if(focusClass) {
    const button=card.querySelector(focusClass);
    (button.disabled?card.querySelector('.handle'):button).focus({preventScroll:true});
  } else if(card.contains(active)) active.focus({preventScroll:true});
  say(t('moved',{name:lang.qcs[key].name,order:[...state.beforeOrder].reverse().map(k=>lang.qcs[k].name).join(', ')}));
}
function syncOrder() {
  [...state.beforeOrder].reverse().forEach(k=>$('cards').appendChild($('cards').querySelector(`[data-key="${k}"]`)));
}
let drag=null;
function endDrag(e) {
  if(!drag)return;
  const saved=drag;drag=null;
  saved.card.classList.remove('dragging');
  document.querySelectorAll('.drop-target').forEach(c=>c.classList.remove('drop-target'));
  if(e.type==='pointerup' && saved.target!=null)move(saved.key,saved.target,'.handle');
  highlight(null);
}
function createCards() {
  [...state.beforeOrder].reverse().forEach(key=>{
    const q=lang.qcs[key], card=document.createElement('li');
    card.dataset.key=key;card.style.setProperty('--quality',fills[ORDER.indexOf(key)]);
    const handle=document.createElement('button');handle.className='handle';handle.textContent='⠿';handle.ariaLabel=t('drag',{name:q.name});
    const words=document.createElement('div');words.className='words';
    const question=document.createElement('strong');question.textContent=q.heartQuestion;
    const name=document.createElement('span');name.textContent=q.name;
    words.append(question,name);card.append(handle,words);
    const arrows=document.createElement('div');arrows.className='arrows';
    [['up','↑',-1,'moveUp'],['down','↓',1,'moveDown']].forEach(([cls,symbol,delta,label])=>{
      const button=document.createElement('button');button.className=cls;button.textContent=symbol;button.ariaLabel=t(label,{name:q.name});
      button.onclick=()=>move(key,[...$('cards').children].indexOf(card)+delta,'.'+cls);
      arrows.append(button);
    });
    card.append(arrows);$('cards').append(card);
    card.addEventListener('pointerenter',()=>highlight(key));card.addEventListener('pointerleave',()=>{if(!drag)highlight(null)});
    card.addEventListener('focusin',()=>highlight(key));card.addEventListener('focusout',()=>{if(!drag)highlight(null)});
    handle.addEventListener('keydown',e=>{if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();move(key,[...$('cards').children].indexOf(card)+(e.key==='ArrowUp'?-1:1),'.handle')}});
    handle.addEventListener('pointerdown',e=>{
      if(e.button!==0||state.busy||state.phase!=='before')return;
      handle.setPointerCapture(e.pointerId);drag={key,card,target:null};card.classList.add('dragging');highlight(key);
    });
    handle.addEventListener('pointermove',e=>{
      if(!drag||drag.key!==key)return;
      const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('#cards li');
      document.querySelectorAll('.drop-target').forEach(c=>c.classList.remove('drop-target'));
      if(target){target.classList.add('drop-target');drag.target=[...$('cards').children].indexOf(target)}
      // Keep long mobile lists usable while dragging near a viewport edge.
      if(e.clientY<70)window.scrollBy(0,-12);else if(e.clientY>innerHeight-70)window.scrollBy(0,12);
    });
    handle.addEventListener('pointerup',endDrag);handle.addEventListener('pointercancel',endDrag);
    handle.addEventListener('lostpointercapture',endDrag);
  });
}
const pause = ms=>new Promise(resolve=>setTimeout(resolve,ms));
function extendSpiral(before,after,duration) {
  const start=before.length-1,end=after.length;
  return new Promise(resolve=>{
    const began=performance.now();
    function frame(now){const progress=Math.min(1,(now-began)/duration);drawSpiral(after,Math.min(end,Math.max(2,Math.floor(start+(end-start)*progress))));if(progress<1)requestAnimationFrame(frame);else resolve()}
    requestAnimationFrame(frame);
  });
}
async function grow() {
  if(state.busy||state.phase!=='before')return;
  state.busy=true;state.afterOrder=PlaygroundModel.develop(state.beforeOrder);controls();
  if(matchMedia('(max-width: 1050px)').matches)$('viz').scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'center'});
  const minimum=ORDER.indexOf(state.beforeOrder[0]),before=pointsFor(state.beforeOrder),after=pointsFor(state.afterOrder,true);
  state.previousStopPoint=before.at(-1);
  oldDot.setAttribute('cx',state.previousStopPoint[0]);oldDot.setAttribute('cy',state.previousStopPoint[1]);oldDot.style.opacity=1;
  const w=wg.children[minimum];w.classList.add('minimum-resolving');
  caption(t('attention',{name:lang.qcs[state.beforeOrder[0]].name}));
  await pause(reduced.matches?250:500);
  await animateRadii([{i:minimum,to:PlaygroundModel.radius(state.afterOrder,ORDER[minimum],true)}],reduced.matches?1:1350,easeMinimum);
  await pause(reduced.matches?100:450);w.classList.remove('minimum-resolving');
  caption(t('response'));
  await animateRadii(ORDER.flatMap((k,i)=>i===minimum?[]:[{i,to:PlaygroundModel.radius(state.afterOrder,k,true)}]),reduced.matches?1:1000);
  await extendSpiral(before,after,reduced.matches?1:2100);
  await pause(reduced.matches?100:350);
  state.phase='after';state.busy=false;controls();
  caption(t('afterCaption',{name:lang.qcs[state.afterOrder[0]].name}));
  say(t('afterTitle')+' '+t('afterCaption',{name:lang.qcs[state.afterOrder[0]].name}));
  // Keep the final plant in view on mobile; the reflection follows the retained arrangement.
  $('afterHeading').focus({preventScroll:true});
}
function restore(reset=false) {
  if(state.busy)return;
  state.phase='before';state.afterOrder=null;state.previousStopPoint=null;
  if(reset)state.beforeOrder=[...state.defaultOrder];
  syncOrder();drawBefore();controls();highlight(null);$('demo').hidden=true;
  say(t('restored'));
  $('cards').querySelector('.handle').focus({preventScroll:true});
}
labels();ensureWedges();
[...wg.children].forEach((w,i)=>{
  w.ariaLabel=t('details',{name:lang.qcs[ORDER[i]].name});
  w.addEventListener('pointerenter',()=>highlight(ORDER[i]));w.addEventListener('pointerleave',()=>highlight(null));
  w.addEventListener('focus',()=>highlight(ORDER[i]));w.addEventListener('blur',()=>highlight(null));
});
svg.append(oldDot,dot);
createCards();drawBefore();controls();
$('grow').onclick=grow;$('return').onclick=()=>restore();$('reset').onclick=()=>restore(true);

// Embedding is opt-in and scoped to an exact, validated HTTP(S) parent origin.
function httpURL(value) {try {const u=new URL(value);return ['https:','http:'].includes(u.protocol)?u:null}catch{return null}}
const parentURL=httpURL(p.get('parentOrigin'));
const parentOrigin=parentURL && parentURL.origin===p.get('parentOrigin') ? parentURL.origin : null;
const embedId=/^[a-zA-Z0-9_-]{1,80}$/.test(p.get('embedId')||'')?p.get('embedId'):'pot-plant-playground';
function send(type,extra={}) {if(parentOrigin&&window.parent!==window)parent.postMessage({namespace:'ncd-pot-plant-playground',version:1,id:embedId,type,...extra},parentOrigin)}
let lastHeight=0;
new ResizeObserver(()=>{const height=Math.ceil(document.body.getBoundingClientRect().height);if(height!==lastHeight){lastHeight=height;send('resize',{height})}}).observe(document.body);
$('discover').onclick=()=>{
  const destination=httpURL(p.get('surveyUrl'));
  if(parentOrigin&&window.parent!==window)send('discover');
  else if(destination)location.assign(destination.href);
  else {$('demo').hidden=false;$('demo').setAttribute('role','status')}
};
