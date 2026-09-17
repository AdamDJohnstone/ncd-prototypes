(() => {
  const exportBtn=document.getElementById("exportVideoBtn"); if(!exportBtn)return;
  const churchNameInput=document.getElementById("churchNameInput"),filenamePreview=document.getElementById("exportFilenamePreview");
  const SIZE=1080,FPS=30,EXPORT_VIEWBOX={x:-100,y:-100,width:1080,height:1080},EXPORT_VIEWBOX_STRING=`${EXPORT_VIEWBOX.x} ${EXPORT_VIEWBOX.y} ${EXPORT_VIEWBOX.width} ${EXPORT_VIEWBOX.height}`;
  const INITIAL_FRAMES=Math.round(.35*FPS),REVEAL_FRAMES=FPS,SPIRAL_FRAMES=10*FPS,GOLD_FRAMES=Math.round(.5*FPS),FINAL_FRAMES=FPS,FRAME_MS=1000/FPS;
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  function chooseRecordingFormat(){
    const mp4=["video/mp4;codecs=avc1.42E01E","video/mp4;codecs=avc1","video/mp4"],m4=mp4.find(t=>MediaRecorder.isTypeSupported(t));
    if(m4)return{mime:m4,ext:"mp4",label:"MP4"};
    const webm=["video/webm;codecs=vp9","video/webm;codecs=vp8","video/webm"],mw=webm.find(t=>MediaRecorder.isTypeSupported(t));
    return mw?{mime:mw,ext:"webm",label:"WebM"}:{mime:"",ext:"webm",label:"WebM"};
  }
  function extensionForMime(mime,fallback){mime=(mime||"").toLowerCase();if(mime.includes("mp4"))return"mp4";if(mime.includes("webm"))return"webm";return fallback;}
  function makeViewerUrl(){const c=new URLSearchParams(location.search),v=new URLSearchParams();if(c.get("scores"))v.set("scores",c.get("scores"));v.set("lang",c.get("lang")||"en");return `/ncd-prototypes/pot-plant/view/?${v}`;}
  function makeHiddenViewer(){const f=document.createElement("iframe");f.src=makeViewerUrl();f.setAttribute("aria-hidden","true");Object.assign(f.style,{position:"fixed",left:"-1200px",top:"0",width:"1080px",height:"1080px",border:"0",pointerEvents:"none",opacity:"1"});document.body.appendChild(f);return f;}
  function waitForLoad(f){return new Promise((res,rej)=>{const t=setTimeout(()=>rej(new Error("Viewer took too long to load.")),10000);f.addEventListener("load",()=>{clearTimeout(t);res();},{once:true});});}
  function safeFilenamePart(v){return v.trim().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/&/g," and ").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");}
  function exportBaseName(){const l=new URLSearchParams(location.search).get("lang")||"en",c=safeFilenamePart(churchNameInput?.value||"");return `${c?c+"-":""}ncd-pot-plant-${l}`;}
  function updateFilenamePreview(){if(filenamePreview){const f=window.MediaRecorder?chooseRecordingFormat():{ext:"mp4"};filenamePreview.textContent=`${exportBaseName()}.${f.ext}`;}}
  churchNameInput?.addEventListener("input",updateFilenamePreview);updateFilenamePreview();

  function prepareSvgClone(sourceSvg){
    const clone=sourceSvg.cloneNode(true),src=[sourceSvg,...sourceSvg.querySelectorAll("*")],dst=[clone,...clone.querySelectorAll("*")],props=["fill","fill-opacity","stroke","stroke-opacity","stroke-width","stroke-linecap","stroke-linejoin","opacity","visibility","transform","transform-origin"];
    src.forEach((s,i)=>{const d=dst[i];if(!d||!(s instanceof Element))return;const st=s.ownerDocument.defaultView.getComputedStyle(s);props.forEach(p=>{const v=st.getPropertyValue(p);if(v)d.style.setProperty(p,v);});});
    const liveWedges=sourceSvg.querySelectorAll(".wedge");clone.querySelectorAll(".wedge").forEach((w,i)=>{const st=liveWedges[i].ownerDocument.defaultView.getComputedStyle(liveWedges[i]),o=st.opacity||"0";w.setAttribute("fill",`url(#wedgeGrad${i})`);w.style.fill=`url(#wedgeGrad${i})`;w.setAttribute("opacity",o);w.style.opacity=o;});
    const spiral=clone.querySelector("#spiral"),under=clone.querySelector("#spiralUnder"),dot=clone.querySelector("#stopDot");
    if(spiral){const s=sourceSvg.querySelector("#spiral"),st=s.ownerDocument.defaultView.getComputedStyle(s);spiral.removeAttribute("filter");spiral.style.filter="none";spiral.setAttribute("stroke",st.stroke||"#e0b62a");spiral.style.stroke=st.stroke||"#e0b62a";spiral.setAttribute("stroke-opacity",st.strokeOpacity||".86");spiral.style.strokeOpacity=st.strokeOpacity||".86";spiral.setAttribute("stroke-width","8");spiral.style.strokeWidth="8px";}
    if(under){const s=sourceSvg.querySelector("#spiralUnder"),st=s.ownerDocument.defaultView.getComputedStyle(s);under.removeAttribute("filter");under.style.filter="none";under.setAttribute("stroke",st.stroke||"#e0b62a");under.style.stroke=st.stroke||"#e0b62a";under.setAttribute("stroke-opacity",st.strokeOpacity||".16");under.style.strokeOpacity=st.strokeOpacity||".16";under.setAttribute("stroke-width","12");under.style.strokeWidth="12px";}
    if(dot){const s=sourceSvg.querySelector("#stopDot"),st=s.ownerDocument.defaultView.getComputedStyle(s);dot.removeAttribute("filter");dot.style.filter="none";dot.setAttribute("fill",st.fill||"#e0b62a");dot.style.fill=st.fill||"#e0b62a";dot.setAttribute("opacity",st.opacity||"0");dot.style.opacity=st.opacity||"0";}
    clone.querySelector("#labels")?.remove();clone.querySelector("#labelPaths")?.remove();clone.setAttribute("viewBox",EXPORT_VIEWBOX_STRING);clone.setAttribute("width",SIZE);clone.setAttribute("height",SIZE);clone.setAttribute("xmlns","http://www.w3.org/2000/svg");clone.setAttribute("xmlns:xlink","http://www.w3.org/1999/xlink");clone.querySelectorAll("[tabindex]").forEach(e=>e.removeAttribute("tabindex"));return clone;
  }
  function svgToCanvasPoint(p){return{x:(p.x-EXPORT_VIEWBOX.x)*(SIZE/EXPORT_VIEWBOX.width),y:(p.y-EXPORT_VIEWBOX.y)*(SIZE/EXPORT_VIEWBOX.height)};}
  function makeShapedLine(text,st,fill){
    const fontSize=parseFloat(st.fontSize)||34,fontWeight=st.fontWeight||"400",fontStyle=st.fontStyle||"normal",fontFamily=st.fontFamily||"sans-serif",SCALE=2,pad=Math.ceil(fontSize*1.25),probe=document.createElement("canvas"),pctx=probe.getContext("2d");
    pctx.font=`${fontStyle} ${fontWeight} ${fontSize*SCALE}px ${fontFamily}`;const m=pctx.measureText(text),left=Math.ceil(m.actualBoundingBoxLeft||0),right=Math.ceil(m.actualBoundingBoxRight||m.width),ascent=Math.ceil(m.actualBoundingBoxAscent||fontSize*SCALE*.9),descent=Math.ceil(m.actualBoundingBoxDescent||fontSize*SCALE*.35),padPx=pad*SCALE;
    probe.width=Math.max(1,left+right+padPx*2);probe.height=Math.max(1,ascent+descent+padPx*2);const ctx=probe.getContext("2d");ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";ctx.font=`${fontStyle} ${fontWeight} ${fontSize*SCALE}px ${fontFamily}`;ctx.textAlign="left";ctx.textBaseline="alphabetic";ctx.fillStyle=fill;ctx.fillText(text,padPx+left,padPx+ascent);return{canvas:probe,scale:SCALE,inkStart:padPx,inkWidth:left+right,baseline:padPx+ascent,height:probe.height};
  }
  function extendedPathPoint(path,length,at){
    const delta=.5;
    if(at<0){const p=path.getPointAtLength(0),q=path.getPointAtLength(Math.min(length,delta)),dx=q.x-p.x,dy=q.y-p.y,n=Math.hypot(dx,dy)||1;return{x:p.x+dx/n*at,y:p.y+dy/n*at};}
    if(at>length){const p=path.getPointAtLength(length),q=path.getPointAtLength(Math.max(0,length-delta)),dx=p.x-q.x,dy=p.y-q.y,n=Math.hypot(dx,dy)||1,d=at-length;return{x:p.x+dx/n*d,y:p.y+dy/n*d};}
    return path.getPointAtLength(at);
  }
  function drawShapedLineOnPath(ctx,path,shaped){
    const pathLength=path.getTotalLength(),visualWidth=shaped.inkWidth/shaped.scale;if(!pathLength||!visualWidth)return;const start=(pathLength-visualWidth)/2,destStrip=.5,sourceStrip=destStrip*shaped.scale,overlap=.18;
    for(let sx=0;sx<shaped.inkWidth;sx+=sourceStrip){const sourceWidth=Math.min(sourceStrip+overlap*shaped.scale,shaped.inkWidth-sx),visualX=sx/shaped.scale,visualStrip=Math.min(destStrip+overlap,visualWidth-visualX),at=start+visualX+visualStrip/2,delta=.35,p=extendedPathPoint(path,pathLength,at),p0=extendedPathPoint(path,pathLength,at-delta),p1=extendedPathPoint(path,pathLength,at+delta),cp=svgToCanvasPoint(p),angle=Math.atan2(p1.y-p0.y,p1.x-p0.x);ctx.save();ctx.translate(cp.x,cp.y);ctx.rotate(angle);ctx.drawImage(shaped.canvas,shaped.inkStart+sx,0,sourceWidth,shaped.height,-visualStrip/2,-shaped.baseline/shaped.scale,visualStrip,shaped.height/shaped.scale);ctx.restore();}
  }
  function drawCanvasLabels(sourceSvg,ctx){const doc=sourceSvg.ownerDocument;ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";sourceSvg.querySelectorAll("#labels text").forEach(text=>{const tp=text.querySelector("textPath");if(!tp)return;const href=tp.getAttribute("href")||tp.getAttribute("xlink:href");if(!href)return;const path=doc.getElementById(href.replace(/^#/,"")),value=tp.textContent||"";if(!path||!value)return;const st=doc.defaultView.getComputedStyle(text),fill=text.classList.contains("arc-label-adj")?"#223029":"#52605a";drawShapedLineOnPath(ctx,path,makeShapedLine(value,st,fill));});}
  function makeLabelLayer(sourceSvg){const layer=document.createElement("canvas");layer.width=SIZE;layer.height=SIZE;const lctx=layer.getContext("2d");lctx.imageSmoothingEnabled=true;lctx.imageSmoothingQuality="high";drawCanvasLabels(sourceSvg,lctx);return layer;}
  async function drawSvgFrame(svg,ctx,labelLayer){const xml=new XMLSerializer().serializeToString(prepareSvgClone(svg)),blob=new Blob([xml],{type:"image/svg+xml;charset=utf-8"}),url=URL.createObjectURL(blob);try{const im=new Image();im.src=url;await im.decode();ctx.fillStyle="#fff";ctx.fillRect(0,0,SIZE,SIZE);ctx.drawImage(im,0,0,SIZE,SIZE);if(labelLayer)ctx.drawImage(labelLayer,0,0);}finally{URL.revokeObjectURL(url);}}

  async function exportVideo(){
    if(!window.MediaRecorder||!HTMLCanvasElement.prototype.captureStream){alert("Video export is not supported by this browser. Please try the latest Chrome or Safari.");return;}
    exportBtn.disabled=true;const original=exportBtn.textContent;exportBtn.textContent="Preparing video…";let iframe,recorder,stream;
    try{
      iframe=makeHiddenViewer();await waitForLoad(iframe);await sleep(900);const doc=iframe.contentDocument,svg=doc.getElementById("viz"),api=iframe.contentWindow.NCDPotPlantExport;if(!svg||!api)throw new Error("Could not initialise deterministic video renderer.");if(doc.fonts?.ready)await doc.fonts.ready;
      api.hideControls();api.setWedgeOpacity(0);api.setSpiralProgress(0);api.setSpiralTone("gold");
      exportBtn.textContent="Preparing labels…";const labelLayer=makeLabelLayer(svg);
      const canvas=document.createElement("canvas");canvas.width=SIZE;canvas.height=SIZE;const ctx=canvas.getContext("2d",{alpha:false});ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";stream=canvas.captureStream(FPS);const format=chooseRecordingFormat(),chunks=[];
      recorder=new MediaRecorder(stream,format.mime?{mimeType:format.mime,videoBitsPerSecond:8_000_000}:{videoBitsPerSecond:8_000_000});recorder.addEventListener("dataavailable",e=>{if(e.data?.size)chunks.push(e.data);});const stopped=new Promise(r=>recorder.addEventListener("stop",r,{once:true}));
      await drawSvgFrame(svg,ctx,labelLayer);recorder.start(250);let frameNumber=0,start=performance.now();async function commitFrame(){await drawSvgFrame(svg,ctx,labelLayer);frameNumber++;const delay=start+frameNumber*FRAME_MS-performance.now();if(delay>0)await sleep(delay);}
      exportBtn.textContent="Rendering video…";for(let i=0;i<INITIAL_FRAMES;i++)await commitFrame();for(let i=1;i<=REVEAL_FRAMES;i++){api.setWedgeOpacity(.70*(i/REVEAL_FRAMES));await commitFrame();}api.setWedgeOpacity(.70);for(let i=1;i<=SPIRAL_FRAMES;i++){const t=i/SPIRAL_FRAMES;api.setSpiralProgress(1-Math.pow(1-t,3.2));await commitFrame();}api.setSpiralProgress(1);api.setSpiralTone("gold");for(let i=0;i<GOLD_FRAMES+FINAL_FRAMES;i++)await commitFrame();
      recorder.stop();await stopped;stream.getTracks().forEach(t=>t.stop());const actualType=recorder.mimeType||format.mime||"video/webm",actualExt=extensionForMime(actualType,format.ext),output=new Blob(chunks,{type:actualType}),url=URL.createObjectURL(output),a=document.createElement("a");a.href=url;a.download=`${exportBaseName()}.${actualExt}`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);exportBtn.textContent=actualExt==="mp4"?"MP4 exported":"Video exported (WebM)";setTimeout(()=>exportBtn.textContent=original,2500);
    }catch(error){console.error("NCD Pot Plant video export failed:",error);alert(`Video export failed: ${error.message}`);exportBtn.textContent=original;if(recorder&&recorder.state!=="inactive")recorder.stop();}finally{if(stream)stream.getTracks().forEach(t=>t.stop());if(iframe)iframe.remove();exportBtn.disabled=false;updateFilenamePreview();}
  }
  exportBtn.addEventListener("click",exportVideo);
})();
