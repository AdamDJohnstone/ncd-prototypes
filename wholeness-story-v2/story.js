const Q=new URLSearchParams(location.search),scores=(Q.get("scores")||"65.74,53.52,59.01").split(",").map(Number),name=Q.get("name")||"Adam";document.getElementById("personName").textContent=name;
const C=[{k:"ER",lines:[["Embracing",1],["Relationships",0]],c:"#477B3A"},{k:"PC",lines:[["Purposeful",1],["Contribution",0]],c:"#98403D"},{k:"UC",lines:[["Unshakable",1],["Confidence",0]],c:"#37547E"}],NS="http://www.w3.org/2000/svg",cx=440,cy=440,start=-150,sec=120,base=24,phase1=88,phase2=168,finalMin=205,step=82,spiralGrowth=40;
const rad=d=>d*Math.PI/180,polar=(r,a)=>[cx+r*Math.cos(rad(a)),cy+r*Math.sin(rad(a))],clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),ease=t=>1-Math.pow(1-clamp(t),2.3);
function wp(r,i){let a=start+i*sec,b=a+sec,p=polar(r,a),q=polar(r,b);return `M${cx},${cy}L${p[0]},${p[1]}A${r},${r} 0 0 1 ${q[0]},${q[1]}Z`}
function ranks(){let o=scores.map((s,i)=>({s,i})).sort((a,b)=>a.s-b.s),r=[];o.forEach((x,k)=>r[x.i]=finalMin+k*step);return r}const targets=ranks(),minI=targets.indexOf(Math.min(...targets));
function makeWedges(g){return C.map((q,i)=>{let p=document.createElementNS(NS,"path");p.setAttribute("fill",q.c);p.setAttribute("opacity",".65");p.setAttribute("d",wp(phase1,i));g.appendChild(p);return p})}
makeWedges(document.getElementById("markWedges"));const paths=makeWedges(document.getElementById("wedges")),lg=document.getElementById("labels");
function arc(r,a,b,rev){let p=polar(r,rev?b:a),q=polar(r,rev?a:b);return `M${p[0]},${p[1]} A${r},${r} 0 0 ${rev?0:1} ${q[0]},${q[1]}`}
const labels=[];C.forEach((q,i)=>{let mid=start+(i+.5)*sec,bot=((mid%360)+360)%360>0&&((mid%360)+360)%360<180,c=.5;q.lines.forEach((line,j)=>{let off=(c-j)*42,r=365+(bot?-off:off),id="arc"+i+"_"+j,path=document.createElementNS(NS,"path");path.id=id;path.setAttribute("d",arc(r,start+i*sec+8,start+(i+1)*sec-8,bot));path.setAttribute("fill","none");path.setAttribute("stroke","none");lg.appendChild(path);let t=document.createElementNS(NS,"text"),tp=document.createElementNS(NS,"textPath");t.setAttribute("fill",line[1]?"#223029":"#52605a");t.setAttribute("font-size",line[1]?"48":"39");t.setAttribute("font-weight",line[1]?"800":"600");tp.setAttribute("href","#"+id);tp.setAttribute("startOffset","50%");tp.setAttribute("text-anchor","middle");tp.textContent=line[0];t.appendChild(tp);t.style.opacity=0;lg.appendChild(t);labels.push({t,i})})});
const sp=document.getElementById("spiral"),su=document.getElementById("spiralUnder"),dot=document.getElementById("stop"),nar=document.getElementById("narrative"),arts=[...document.querySelectorAll(".beats article")];
function equalGrow(t,i){if(i===minI)return phase2;let d=targets.map(x=>Math.max(0,x-phase2)),mx=Math.max(...d),travel=ease(t)*mx;return phase2+Math.min(travel,d[i])}
function spiralFull(){let th=-Math.PI/2,pts=[],b=spiralGrowth/(2*Math.PI),last=null;for(let n=0;n<4000;n++,th+=.012){let r=b*(th+Math.PI/2),deg=((th*180/Math.PI)%360+360)%360,sector=Math.floor((((deg-start)%360)+360)%360/sec);if(r>targets[minI] && sector===minI){last=pts[pts.length-1];break}let x=cx+r*Math.cos(th),y=cy+r*Math.sin(th);pts.push([x,y]);if(r>430)break}return {pts,last:pts[pts.length-1]}}const sf=spiralFull();
function spiralD(t){let n=Math.max(0,Math.floor(sf.pts.length*clamp(t)));return sf.pts.slice(0,n).map((p,i)=>(i?"L":"M")+p[0].toFixed(1)+","+p[1].toFixed(1)).join("")}
function setNarrative(i){nar.innerHTML=arts[i]?.innerHTML||""}
function render(p){let x=p*6,beat=Math.min(6,Math.floor(x+.18)),local=x-Math.floor(x);setNarrative(beat);
 paths.forEach((path,i)=>{let r=phase1;
   if(x<1){r=phase1}
   else if(x<4){let intro=i+1,tt=clamp(x-intro);r=phase1+(phase2-phase1)*ease(tt)}
   else {r=equalGrow(clamp((x-4)/.9),i)}
   path.setAttribute("d",wp(r,i));labels.filter(z=>z.i===i).forEach(z=>z.t.style.opacity=x>=Math.max(1,i+1)?1:0);
 });
 let flow=clamp((x-5)/.95),d=spiralD(flow);sp.setAttribute("d",d);su.setAttribute("d",d);if(flow>.995){let z=sf.last;dot.setAttribute("cx",z[0]);dot.setAttribute("cy",z[1]);dot.setAttribute("opacity","1")}else dot.setAttribute("opacity","0")}
function update(){let s=document.getElementById("story"),r=s.getBoundingClientRect(),den=s.offsetHeight-innerHeight,p=clamp(-r.top/den);render(p)}addEventListener("scroll",update,{passive:true});addEventListener("resize",update);update();