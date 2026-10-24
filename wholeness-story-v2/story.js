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
function setNarrative(html,opacity=1){if(nar.dataset.html!==html){nar.innerHTML=html;nar.dataset.html=html}nar.style.opacity=opacity}
function articleHTML(i){return arts[i]?.innerHTML||""}
function textAt(x){
  const fade=(a,b)=>clamp((x-a)/(b-a)), out=(a,b)=>1-clamp((x-a)/(b-a));
  let i=0,o=1;
  if(x<1.05){i=0;o=x<.88?1:out(.88,1.05)}
  else if(x<1.28){return ["",0]}
  else if(x<1.72){i=1;o=x<1.42?fade(1.28,1.42):out(1.58,1.72)}
  else if(x<1.90){return ["",0]}
  else if(x<2.92){i=2;o=x<2.06?fade(1.90,2.06):(x<2.76?1:out(2.76,2.92))}
  else if(x<3.12){return ["",0]}
  else if(x<4.14){i=3;o=x<3.28?fade(3.12,3.28):(x<3.98?1:out(3.98,4.14))}
  else if(x<4.34){return ["",0]}
  else if(x<5.36){i=4;o=x<4.50?fade(4.34,4.50):(x<5.20?1:out(5.20,5.36))}
  else if(x<5.60){return ["",0]}
  else if(x<6.30){i=5;o=x<5.76?fade(5.60,5.76):(x<6.14?1:out(6.14,6.30))}
  else if(x<6.48){return ["",0]}
  else if(x<7.72){i=6;o=x<6.64?fade(6.48,6.64):(x<7.56?1:out(7.56,7.72))}
  else if(x<7.94){return ["",0]}
  else{i=8;o=x<8.10?fade(7.94,8.10):1}
  return [articleHTML(i),o]
}
function render(p){let x=p*8.6,[html,op]=textAt(x);setNarrative(html,op);
 const seq=[{q:1.90,g:2.18,e:2.62,l:2.68},{q:3.12,g:3.40,e:3.84,l:3.90},{q:4.34,g:4.62,e:5.06,l:5.12}];
 paths.forEach((path,i)=>{let z=seq[i],r=phase1;if(x>=z.g){r=phase1+(phase2-phase1)*ease(clamp((x-z.g)/(z.e-z.g)))}if(x>=5.55){r=equalGrow(clamp((x-5.55)/.72),i)}path.setAttribute("d",wp(r,i));let lo=clamp((x-z.l)/.16);labels.filter(v=>v.i===i).forEach(v=>v.t.style.opacity=lo)});
 let flow=clamp((x-6.68)/.92),d=spiralD(flow);sp.setAttribute("d",d);su.setAttribute("d",d);if(flow>.995){let z=sf.last;dot.setAttribute("cx",z[0]);dot.setAttribute("cy",z[1]);dot.setAttribute("opacity","1")}else dot.setAttribute("opacity","0")}
function update(){let s=document.getElementById("story"),r=s.getBoundingClientRect(),den=s.offsetHeight-innerHeight,p=clamp(-r.top/den);render(p)}addEventListener("scroll",update,{passive:true});addEventListener("resize",update);update();