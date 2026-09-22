(() => {
const p=new URLSearchParams(location.search), langCode=window.NCD_POT_PLANT_LANGUAGES?.[p.get("lang")||"en"]?(p.get("lang")||"en"):"en",lang=window.NCD_POT_PLANT_LANGUAGES[langCode];
const INPUT=["EL","GBM","PS","ES","IWS","HSG","NOE","LR"], ORDER=["LR","EL","ES","GBM","NOE","IWS","PS","HSG"], fills=["#477B39","#727145","#926550","#9A5C5E","#786071","#526082","#436777","#44725C"];
const defaultsA=[67,52,62,59,71,74,43,78], defaultsB=[70,58,65,61,73,76,51,80];
const parse=(key,d)=>{const s=p.get(key);if(!s)return [...d];const a=s.split(",").map(Number);return a.length===8&&a.every(Number.isFinite)?a:[...d]};
let before=parse("before",defaultsA),after=parse("after",defaultsB),busy=false,current="before";
const svg=document.getElementById("viz"),defs=svg.querySelector("defs"),wg=document.getElementById("wedges"),pg=document.getElementById("labelPaths"),lg=document.getElementById("labels"),spiral=document.getElementById("spiral"),under=document.getElementById("spiralUnder"),dot=document.getElementById("stopDot"),oldDot=document.getElementById("oldStopDot");
const cx=440,cy=440,start=-112.5,stepDeg=45,minR=108,gap=36,labelR=minR+7*gap+60,b=33/(2*Math.PI);
const qcCard=document.getElementById("qcCard"),qcCardName=document.getElementById("qcCardName"),qcCardQuestion=document.getElementById("qcCardQuestion"),qcCardDescription=document.getElementById("qcCardDescription"),qcCardClose=document.getElementById("qcCardClose");
function openQcCard(i){const q=lang.qcs[ORDER[i]];if(!qcCard||!q)return;qcCardName.textContent=q.name;qcCardQuestion.textContent=q.heartQuestion;qcCardDescription.textContent=q.description;qcCard.classList.add("is-open");qcCard.setAttribute("aria-hidden","false")}
function closeQcCard(){if(!qcCard)return;qcCard.classList.remove("is-open");qcCard.setAttribute("aria-hidden","true")}
qcCardClose?.addEventListener("click",e=>{e.stopPropagation();closeQcCard()});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeQcCard()});
document.addEventListener("click",e=>{if(qcCard?.classList.contains("is-open")&&!qcCard.contains(e.target)&&!e.target.closest(".qc-clickable")&&!e.target.closest(".wedge"))closeQcCard()});
const mapScores=s=>Object.fromEntries(INPUT.map((k,i)=>[k,s[i]])), diagram=s=>{const m=mapScores(s);return ORDER.map(k=>m[k])};
const ranks=v=>{const ix=v.map((_,i)=>i).sort((a,b)=>v[a]-v[b]),r=[];ix.forEach((x,i)=>r[x]=i+1);return r};
const polar=(r,t)=>[cx+r*Math.cos(t),cy+r*Math.sin(t)], rr=(rank,offset=0)=>minR+(rank-1+offset)*gap, rad=d=>d*Math.PI/180;
function grad(i){let g=document.getElementById("cg"+i);if(!g){g=document.createElementNS("http://www.w3.org/2000/svg","linearGradient");g.id="cg"+i;g.setAttribute("x2","100%");g.setAttribute("y2","100%");g.innerHTML=`<stop offset="0%" stop-color="${fills[i]}" stop-opacity=".92"/><stop offset="100%" stop-color="${fills[i]}" stop-opacity=".72"/>`;defs.appendChild(g)}return"url(#cg"+i+")"}
function wedgeD(i,r){const a0=rad(start+i*stepDeg),a1=rad(start+(i+1)*stepDeg),a=polar(r,a0),z=polar(r,a1);return`M ${cx} ${cy} L ${a[0]} ${a[1]} A ${r} ${r} 0 0 1 ${z[0]} ${z[1]} Z`}
function arc(r,a0,a1,rev){let s=rad(a0),e=rad(a1);if(rev)[s,e]=[e,s];const a=polar(r,s),z=polar(r,e);return`M ${a[0]} ${a[1]} A ${r} ${r} 0 0 ${rev?0:1} ${z[0]} ${z[1]}`}
function labels(){pg.innerHTML=lg.innerHTML="";ORDER.forEach((k,i)=>{const q=lang.qcs[k],mid=start+(i+.5)*stepDeg,bot=((mid%360)+360)%360>0&&((mid%360)+360)%360<180,lines=q.lines.slice(0,4),c=(lines.length-1)/2;lines.forEach((line,j)=>{const off=(c-j)*34*(lang.labelLineSpacing??1),r=labelR+(bot?-off:off),id=`ca${i}_${j}`,path=document.createElementNS("http://www.w3.org/2000/svg","path");path.id=id;path.setAttribute("d",arc(r,start+i*stepDeg+3.5,start+(i+1)*stepDeg-3.5,bot));pg.appendChild(path);const t=document.createElementNS("http://www.w3.org/2000/svg","text");t.setAttribute("class",(line.emphasis?"arc-label-adj":"arc-label-noun")+" qc-clickable");t.setAttribute("tabindex","0");t.setAttribute("role","button");t.addEventListener("click",e=>{e.stopPropagation();openQcCard(i)});t.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();openQcCard(i)}});t.setAttribute("font-size",(line.emphasis?41.5:33.5)*(lang.labelScale??1));const tp=document.createElementNS("http://www.w3.org/2000/svg","textPath");tp.setAttribute("href","#"+id);tp.setAttribute("startOffset","50%");tp.setAttribute("text-anchor","middle");tp.textContent=line.text;t.appendChild(tp);lg.appendChild(t)})})}
function ensureWedges(){if(wg.children.length)return;ORDER.forEach((_,i)=>{const x=document.createElementNS("http://www.w3.org/2000/svg","path");x.classList.add("wedge","compare-wedge");x.dataset.i=i;x.setAttribute("fill",grad(i));x.setAttribute("tabindex","0");x.setAttribute("role","button");x.addEventListener("click",e=>{e.stopPropagation();openQcCard(i)});x.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();openQcCard(i)}});wg.appendChild(x)})}
function setWedgeRadius(i,r){const w=wg.children[i];w.dataset.radius=String(r);w.setAttribute("d",wedgeD(i,r))}
function setWedges(rs,offset=0,instant=false){ensureWedges();[...wg.children].forEach((w,i)=>{if(instant)w.classList.add("instant");setWedgeRadius(i,rr(rs[i],offset));if(instant)requestAnimationFrame(()=>w.classList.remove("instant"))})}
const easeMinimum=t=>1-Math.pow(1-t,2.35),easeQuiet=t=>1-Math.pow(1-t,3);
function animateRadii(items,duration,ease=easeQuiet){return new Promise(resolve=>{const jobs=items.map(({i,to})=>{const w=wg.children[i],from=Number(w.dataset.radius);return{i,from:Number.isFinite(from)?from:to,to}}),st=performance.now();function frame(now){const t=Math.min(1,(now-st)/duration),e=ease(t);jobs.forEach(({i,from,to})=>setWedgeRadius(i,from+(to-from)*e));if(t<1)requestAnimationFrame(frame);else resolve()}requestAnimationFrame(frame)})}
function spiralPts(rs,offset,minIdx){const t0=-Math.PI/2,max=t0+Math.PI*60,st=.0045,pts=[[cx,cy]],boundary=rr(rs[minIdx],offset);let prev=t0,ps=sector(prev);for(let t=t0+st;t<=max;t+=st){let cs=sector(t);if(cs!==ps){let bt=rad(start+(ps+1)*stepDeg);while(bt<=prev)bt+=2*Math.PI;while(bt>t)bt-=2*Math.PI;let br=b*(bt-t0);if(cs===minIdx&&br>boundary){pts.push(polar(br,bt));return pts}}pts.push(polar(b*(t-t0),t));prev=t;ps=cs}return pts}
function sector(t){let d=t*180/Math.PI;while(d<start)d+=360;while(d>=start+360)d-=360;return Math.floor((d-start)/stepDeg)}
const pathOf=(a,n=a.length)=>{let d=`M ${a[0][0]} ${a[0][1]}`;for(let i=1;i<n;i++)d+=` L ${a[i][0].toFixed(2)} ${a[i][1].toFixed(2)}`;return d};
function clearSpiral(){spiral.setAttribute("d","");under.setAttribute("d","");dot.style.opacity=0}
function growSpiral(rs,offset,minIdx,duration=3600){return new Promise(resolve=>{const pts=spiralPts(rs,offset,minIdx),st=performance.now();function f(now){const t=Math.min(1,(now-st)/duration),e=1-Math.pow(1-t,3.2),n=Math.max(2,Math.floor(e*(pts.length-1))+1),d=pathOf(pts,n);spiral.setAttribute("d",d);under.setAttribute("d",d);const q=pts[n-1];dot.setAttribute("cx",q[0]);dot.setAttribute("cy",q[1]);dot.style.opacity=1;if(t<1)requestAnimationFrame(f);else resolve(pts[pts.length-1])}requestAnimationFrame(f)})}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function minInfo(s){const d=diagram(s),v=Math.min(...d);return{d,v,i:d.indexOf(v),r:ranks(d)}}
function glow(i,duration=1100,minimum=false){const w=wg.children[i];w.classList.remove("resolved","minimum-resolving");void w.getBoundingClientRect();w.classList.add("resolved");if(minimum)w.classList.add("minimum-resolving");setTimeout(()=>w.classList.remove("resolved","minimum-resolving"),duration)}
async function showBefore(){if(busy)return;busy=true;current="before";oldDot.style.opacity=0;clearSpiral();[...wg.children].forEach(w=>w.classList.add("hidden"));await wait(350);const A=minInfo(before),B=minInfo(after),dir=Math.sign(B.v-A.v),off=dir>0?-1:0;setWedges(A.r,off,true);[...wg.children].forEach(w=>w.classList.remove("hidden"));await wait(700);await growSpiral(A.r,off,A.i);busy=false;buttons()}
async function showAfter(){if(busy||current==="after")return;busy=true;const A=minInfo(before),B=minInfo(after),dir=Math.sign(B.v-A.v),beforeOff=dir>0?-1:0,afterOff=dir<0?-1:0;
if(current!=="before"){busy=false;await showBefore();busy=true}
const oldPts=spiralPts(A.r,beforeOff,A.i),tip=oldPts[oldPts.length-1];
oldDot.setAttribute("cx",tip[0]);oldDot.setAttribute("cy",tip[1]);
svg.appendChild(oldDot);
oldDot.style.opacity=dir===0?0:1;
clearSpiral();
await wait(1200);

const changedMinimum=A.i!==B.i;
async function resolveMinimum(i){
  glow(i,3800,true);
  await animateRadii([{i,to:rr(B.r[i],afterOff)}],3400,easeMinimum);
  await wait(300);
  await wait(1100);
}

if(changedMinimum){
  await resolveMinimum(A.i);
  await resolveMinimum(B.i);
}else{
  await resolveMinimum(B.i);
}

const minimums=new Set(changedMinimum?[A.i,B.i]:[B.i]);
const others=[...wg.children].map((w,i)=>({w,i})).filter(x=>!minimums.has(x.i));
await animateRadii(others.map(({i})=>({i,to:rr(B.r[i],afterOff)})),2400,easeQuiet);
await wait(1100);

await growSpiral(B.r,afterOff,B.i);
current="after";busy=false;buttons()}
function buttons(){document.getElementById("beforeBtn")?.classList.toggle("active",current==="before");document.getElementById("afterBtn")?.classList.toggle("active",current==="after")}
function url(){const q=new URLSearchParams(location.search);q.set("before",before.join(","));q.set("after",after.join(","));q.set("lang",langCode);history.replaceState(null,"",location.pathname+"?"+q)}
function controls(id,arr,setter){const el=document.getElementById(id);if(!el)return;el.innerHTML="";INPUT.forEach((k,i)=>{const row=document.createElement("div");row.className="compare-row";row.innerHTML=`<label>${lang.qcs[k].name}</label><input type="number" min="-50" step="0.1" value="${Number(arr[i]).toFixed(1)}">`;row.querySelector("input").addEventListener("change",e=>{const n=Number(e.target.value);if(Number.isFinite(n)){setter(i,n);url();current="edit";showBefore()}});el.appendChild(row)})}
labels();ensureWedges();controls("beforeScores",before,(i,n)=>before[i]=n);controls("afterScores",after,(i,n)=>after[i]=n);
document.getElementById("beforeBtn")?.addEventListener("click",showBefore);document.getElementById("afterBtn")?.addEventListener("click",showAfter);
document.getElementById("languageSelect")?.addEventListener("change",e=>{const q=new URLSearchParams(location.search);q.set("lang",e.target.value);location.search=q});
const ls=document.getElementById("languageSelect");if(ls)ls.value=langCode;showBefore();
})();