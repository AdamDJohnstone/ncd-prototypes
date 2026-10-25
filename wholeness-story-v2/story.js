const Q=new URLSearchParams(location.search),scores=(Q.get("scores")||"65.74,53.52,59.01").split(",").map(Number),name=Q.get("name")||"Adam";
const personName=document.getElementById("personName");if(personName)personName.textContent=name;
const C=[{k:"ER",lines:[["Embracing",1],["Relationships",0]],c:"#477B3A"},{k:"PC",lines:[["Purposeful",1],["Contribution",0]],c:"#98403D"},{k:"UC",lines:[["Unshakable",1],["Confidence",0]],c:"#37547E"}],NS="http://www.w3.org/2000/svg",cx=440,cy=440,start=-150,sec=120,base=24,phase1=104,phase2=190,finalMin=190,step=82,spiralGrowth=40;
const rad=d=>d*Math.PI/180,polar=(r,a)=>[cx+r*Math.cos(rad(a)),cy+r*Math.sin(rad(a))],clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),ease=t=>1-Math.pow(1-clamp(t),2.3);
function wp(r,i){let a=start+i*sec,b=a+sec,p=polar(r,a),q=polar(r,b);return `M${cx},${cy}L${p[0]},${p[1]}A${r},${r} 0 0 1 ${q[0]},${q[1]}Z`}
function ranks(){let o=scores.map((s,i)=>({s,i})).sort((a,b)=>a.s-b.s),r=[];o.forEach((x,k)=>r[x.i]=finalMin+k*step);return r}const targets=ranks(),minI=targets.indexOf(Math.min(...targets));
function makeWedges(g){return C.map((q,i)=>{let p=document.createElementNS(NS,"path");p.setAttribute("fill",q.c);p.setAttribute("opacity",".65");p.setAttribute("d",wp(phase1,i));g.appendChild(p);return p})}
const paths=makeWedges(document.getElementById("wedges")),lg=document.getElementById("labels");
function arc(r,a,b,rev){let p=polar(r,rev?b:a),q=polar(r,rev?a:b);return `M${p[0]},${p[1]} A${r},${r} 0 0 ${rev?0:1} ${q[0]},${q[1]}`}
const labels=[];C.forEach((q,i)=>{let mid=start+(i+.5)*sec,bot=((mid%360)+360)%360>0&&((mid%360)+360)%360<180,c=.5;q.lines.forEach((line,j)=>{let off=(c-j)*42,r=405+(bot?-off:off),id="arc"+i+"_"+j,path=document.createElementNS(NS,"path");path.id=id;path.setAttribute("d",arc(r,start+i*sec+8,start+(i+1)*sec-8,bot));path.setAttribute("fill","none");path.setAttribute("stroke","none");lg.appendChild(path);let t=document.createElementNS(NS,"text"),tp=document.createElementNS(NS,"textPath");t.setAttribute("fill",line[1]?"#223029":"#52605a");t.setAttribute("font-size",line[1]?"48":"39");t.setAttribute("font-weight",line[1]?"800":"600");tp.setAttribute("href","#"+id);tp.setAttribute("startOffset","50%");tp.setAttribute("text-anchor","middle");tp.textContent=line[0];t.appendChild(tp);t.style.opacity=0;lg.appendChild(t);labels.push({t,i})})});
const sp=document.getElementById("spiral"),su=document.getElementById("spiralUnder"),dot=document.getElementById("stop"),nar=document.getElementById("narrative"),arts=[...document.querySelectorAll(".beats article")];
function equalGrow(t,i){if(i===minI)return phase2;let d=targets.map(x=>Math.max(0,x-phase2)),mx=Math.max(...d),travel=ease(t)*mx;return phase2+Math.min(travel,d[i])}
function spiralFull(){let th=-Math.PI/2,pts=[],b=spiralGrowth/(2*Math.PI),last=null;for(let n=0;n<4000;n++,th+=.012){let r=b*(th+Math.PI/2),deg=((th*180/Math.PI)%360+360)%360,sector=Math.floor((((deg-start)%360)+360)%360/sec);if(r>targets[minI] && sector===minI){last=pts[pts.length-1];break}let x=cx+r*Math.cos(th),y=cy+r*Math.sin(th);pts.push([x,y]);if(r>430)break}return {pts,last:pts[pts.length-1]}}const sf=spiralFull();
function spiralD(t){let n=Math.max(0,Math.floor(sf.pts.length*clamp(t)));return sf.pts.slice(0,n).map((p,i)=>(i?"L":"M")+p[0].toFixed(1)+","+p[1].toFixed(1)).join("")}
function setNarrative(html,opacity=1,shift=0){nar.replaceChildren();if(html){const tpl=document.createElement("template");tpl.innerHTML=html.trim();nar.append(...tpl.content.cloneNode(true).childNodes)}nar.style.opacity=opacity;nar.style.transform=`translateY(${shift}px)`}
function articleHTML(i){return arts[i]?.innerHTML||""}
let smoothScrollY=scrollY,targetScrollY=scrollY,raf=0;
function withScrollY(y,fn){const dy=y-scrollY;return fn(dy)}
function beatProgressAt(i,dy=0){const el=arts[i],r=el.getBoundingClientRect(),vh=innerHeight,top=r.top-dy;return clamp((vh*.72-top)/(el.offsetHeight-vh*.18))}
function beatVisibilityAt(i,dy=0){let p=beatProgressAt(i,dy);if(i>=2&&i<=4)return p<.12?p/.12:p>.94?(1-p)/.06:1;return p<.12?p/.12:p>.86?(1-p)/.14:1}
function activeBeatAt(dy=0){let best=-1,dist=1e9;arts.forEach((el,i)=>{let r=el.getBoundingClientRect(),c=(r.top-dy)+r.height*.42,d=Math.abs(c-innerHeight*.52);if(d<dist){dist=d;best=i}});return best}
function setNarrativeForScroll(dy){
 let i=activeBeatAt(dy);if(i<0)return setNarrative("",0);
 const p=beatProgressAt(i,dy),profile=beatProgressAt(5,dy),lifeP=beatProgressAt(6,dy);
 if(i===7)return setNarrative("",0);

 // Beat 5 is one explicit personal-reveal sequence:
 // wedge growth first, then a short silent settle, then one text appearance.
 if(i===5){
   if(profile<.48)return setNarrative("",0);
   const enter=clamp((profile-.48)/.12);
   const op=profile>.92?1-clamp((profile-.92)/.08):enter;
   const shift=profile<.60?(1-enter)*54:profile>.92?-clamp((profile-.92)/.08)*54:0;
   return setNarrative(articleHTML(5),op,shift)
 }

 // Do not repeat beat 5 once beat 6 owns the narrative.
 if(i===6){
   if(lifeP<.18)return setNarrative("",0);
   const op=lifeP<.30?(lifeP-.18)/.12:(lifeP>.96?(1-lifeP)/.04:1);
   const shift=lifeP<.42?(1-(lifeP-.18)/.24)*54:lifeP>.76?-((lifeP-.76)/.24)*54:0;
   return setNarrative(articleHTML(6),op,shift)
 }

 let op=beatVisibilityAt(i,dy);
 let shift=p<.24?(1-p/.24)*54:p>.76?-((p-.76)/.24)*54:0;
 setNarrative(articleHTML(i),op,shift)
}
function renderAt(y){
 const dy=y-scrollY;setNarrativeForScroll(dy);
 const growthBeats=[2,3,4];
 paths.forEach((path,i)=>{
   let gp=beatProgressAt(growthBeats[i],dy),r=phase1;
   if(gp>.32)r=phase1+(phase2-phase1)*ease(clamp((gp-.32)/.34));
   const q3=beatProgressAt(4,dy),profile=beatProgressAt(5,dy);
   const personalP=clamp((profile-.10)/.24);
   if(personalP>0)r=equalGrow(personalP,i);
   path.setAttribute("d",wp(r,i));
   let lo=clamp((gp-.69)/.12);labels.filter(v=>v.i===i).forEach(v=>v.t.style.opacity=lo)
 });
 const life=beatProgressAt(6,dy),flow=clamp((life-.22)/.64),d=spiralD(flow);sp.setAttribute("d",d);su.setAttribute("d",d);
 if(flow>.995){let z=sf.last;dot.setAttribute("cx",z[0]);dot.setAttribute("cy",z[1]);dot.setAttribute("opacity","1")}else dot.setAttribute("opacity","0")
}
function tick(){const delta=targetScrollY-smoothScrollY;smoothScrollY+=delta*.16;if(Math.abs(delta)<.08)smoothScrollY=targetScrollY;renderAt(smoothScrollY);if(smoothScrollY!==targetScrollY)raf=requestAnimationFrame(tick);else raf=0}
function update(){targetScrollY=scrollY;if(!raf)raf=requestAnimationFrame(tick)}addEventListener("scroll",update,{passive:true});addEventListener("resize",update);update();