(() => {
  const exportBtn=document.getElementById("exportVideoBtn"); if(!exportBtn)return;
  const churchNameInput=document.getElementById("churchNameInput"),filenamePreview=document.getElementById("exportFilenamePreview");
  const SIZE=1080,FPS=30,EXPORT_VIEWBOX={x:-100,y:-100,width:1080,height:1080},EXPORT_VIEWBOX_STRING=`${EXPORT_VIEWBOX.x} ${EXPORT_VIEWBOX.y} ${EXPORT_VIEWBOX.width} ${EXPORT_VIEWBOX.height}`;
  const INITIAL_FRAMES=Math.round(.35*FPS),REVEAL_FRAMES=FPS,SPIRAL_FRAMES=10*FPS,GOLD_FRAMES=Math.round(.5*FPS),FINAL_FRAMES=FPS;
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  function safeFilenamePart(v){return v.trim().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/&/g," and ").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");}
  function exportBaseName(){const l=new URLSearchParams(location.search).get("lang")||"en",c=safeFilenamePart(churchNameInput?.value||"");return `${c?c+"-":""}ncd-pot-plant-${l}`;}
  function updateFilenamePreview(){if(filenamePreview)filenamePreview.textContent=`${exportBaseName()}.mp4`;}
  churchNameInput?.addEventListener("input",updateFilenamePreview);updateFilenamePreview();
  function makeViewerUrl(){const c=new URLSearchParams(location.search),v=new URLSearchParams();if(c.get("scores"))v.set("scores",c.get("scores"));v.set("lang",c.get("lang")||"en");return `/ncd-prototypes/pot-plant/view/?${v}`;}
  function makeHiddenViewer(){const f=document.createElement("iframe");f.src=makeViewerUrl();f.setAttribute("aria-hidden","true");Object.assign(f.style,{position:"fixed",left:"-1400px",top:"0",width:"1080px",height:"1080px",border:"0",pointerEvents:"none",opacity:"1"});document.body.appendChild(f);return f;}
  async function waitForViewer(f){
    const deadline=Date.now()+15000;
    while(Date.now()<deadline){
      try{const doc=f.contentDocument,win=f.contentWindow;if(doc?.readyState==="complete"&&doc.getElementById("viz")&&win?.NCDPotPlantExport)return{doc,win,svg:doc.getElementById("viz"),api:win.NCDPotPlantExport};}catch(e){}
      await sleep(100);
    }
    throw new Error("The export viewer could not initialise. Please reload the page and try again.");
  }
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
    const fontSize=parseFloat(st.fontSize)||34,fontWeight=st.fontWeight||"400",fontStyle=st.fontStyle||"normal",fontFamily=st.fontFamily||"sans-serif",SCALE=2,pad=Math.ceil(fontSize*1.5),probe=document.createElement("canvas"),pctx=probe.getContext("2d");
    pctx.font=`${fontStyle} ${fontWeight} ${fontSize*SCALE}px ${fontFamily}`;const m=pctx.measureText(text),left=Math.ceil(m.actualBoundingBoxLeft||0),right=Math.ceil(m.actualBoundingBoxRight||m.width),ascent=Math.ceil(m.actualBoundingBoxAscent||fontSize*SCALE*.9),descent=Math.ceil(m.actualBoundingBoxDescent||fontSize*SCALE*.4),padPx=pad*SCALE;
    probe.width=Math.max(1,left+right+padPx*2);probe.height=Math.max(1,ascent+descent+padPx*2);const ctx=probe.getContext("2d");ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";ctx.font=`${fontStyle} ${fontWeight} ${fontSize*SCALE}px ${fontFamily}`;ctx.textAlign="left";ctx.textBaseline="alphabetic";ctx.fillStyle=fill;ctx.fillText(text,padPx+left,padPx+ascent);return{canvas:probe,scale:SCALE,inkStart:padPx,inkWidth:left+right,baseline:padPx+ascent,height:probe.height};
  }
  function extendedPathPoint(path,length,at){const delta=.5;if(at<0){const p=path.getPointAtLength(0),q=path.getPointAtLength(Math.min(length,delta)),dx=q.x-p.x,dy=q.y-p.y,n=Math.hypot(dx,dy)||1;return{x:p.x+dx/n*at,y:p.y+dy/n*at};}if(at>length){const p=path.getPointAtLength(length),q=path.getPointAtLength(Math.max(0,length-delta)),dx=p.x-q.x,dy=p.y-q.y,n=Math.hypot(dx,dy)||1,d=at-length;return{x:p.x+dx/n*d,y:p.y+dy/n*d};}return path.getPointAtLength(at);}
  function drawShapedLineOnPath(ctx,path,shaped){
    const pathLength=path.getTotalLength(),visualWidth=shaped.inkWidth/shaped.scale;if(!pathLength||!visualWidth)return;const start=(pathLength-visualWidth)/2,destStrip=.5,sourceStrip=destStrip*shaped.scale,overlap=.18;
    for(let sx=0;sx<shaped.inkWidth;sx+=sourceStrip){const sourceWidth=Math.min(sourceStrip+overlap*shaped.scale,shaped.inkWidth-sx),visualX=sx/shaped.scale,visualStrip=Math.min(destStrip+overlap,visualWidth-visualX),at=start+visualX+visualStrip/2,delta=.35,p=extendedPathPoint(path,pathLength,at),p0=extendedPathPoint(path,pathLength,at-delta),p1=extendedPathPoint(path,pathLength,at+delta),cp=svgToCanvasPoint(p),angle=Math.atan2(p1.y-p0.y,p1.x-p0.x);ctx.save();ctx.translate(cp.x,cp.y);ctx.rotate(angle);ctx.drawImage(shaped.canvas,shaped.inkStart+sx,0,sourceWidth,shaped.height,-visualStrip/2,-shaped.baseline/shaped.scale,visualStrip,shaped.height/shaped.scale);ctx.restore();}
  }
  function drawCanvasLabels(sourceSvg,ctx){const doc=sourceSvg.ownerDocument;sourceSvg.querySelectorAll("#labels text").forEach(text=>{const tp=text.querySelector("textPath");if(!tp)return;const href=tp.getAttribute("href")||tp.getAttribute("xlink:href");if(!href)return;const path=doc.getElementById(href.replace(/^#/,"")),value=tp.textContent||"";if(!path||!value)return;const st=doc.defaultView.getComputedStyle(text),fill=text.classList.contains("arc-label-adj")?"#17241f":"#43514b";drawShapedLineOnPath(ctx,path,makeShapedLine(value,st,fill));});}
  function makeLabelLayer(sourceSvg){const layer=document.createElement("canvas");layer.width=SIZE;layer.height=SIZE;const lctx=layer.getContext("2d");lctx.imageSmoothingEnabled=true;lctx.imageSmoothingQuality="high";drawCanvasLabels(sourceSvg,lctx);return layer;}
  async function drawSvgFrame(svg,ctx,labelLayer){const xml=new XMLSerializer().serializeToString(prepareSvgClone(svg)),blob=new Blob([xml],{type:"image/svg+xml;charset=utf-8"}),url=URL.createObjectURL(blob);try{const im=new Image();im.src=url;await im.decode();ctx.fillStyle="#fff";ctx.fillRect(0,0,SIZE,SIZE);ctx.drawImage(im,0,0,SIZE,SIZE);ctx.drawImage(labelLayer,0,0);}finally{URL.revokeObjectURL(url);}}
  async function createMp4Encoder(){
    if(!window.VideoEncoder||!window.VideoFrame||!window.Mp4Muxer)throw new Error("This browser does not support the PowerPoint-compatible MP4 encoder. Please use a current version of Chrome, Edge or Safari.");
    /* 1080x1080 contains 4,624 H.264 macroblocks, which exceeds Level 3.1's 3,600-frame limit. Safari enforces that limit during encoding even when isConfigSupported() accepts the configuration. Level 4.0 supports this square frame size while remaining broadly PowerPoint-compatible. */
    const config={codec:"avc1.420028",width:SIZE,height:SIZE,bitrate:8_000_000,framerate:FPS,avc:{format:"avc"}};
    const support=await VideoEncoder.isConfigSupported(config);if(!support.supported)throw new Error("H.264 MP4 encoding is not supported by this browser/device.");
    const target=new Mp4Muxer.ArrayBufferTarget(),muxer=new Mp4Muxer.Muxer({target,video:{codec:"avc",width:SIZE,height:SIZE,frameRate:FPS},fastStart:"in-memory",firstTimestampBehavior:"strict"});
    let encoderError=null;const encoder=new VideoEncoder({output:(chunk,meta)=>muxer.addVideoChunk(chunk,meta),error:e=>{encoderError=e;}});encoder.configure(support.config);
    return{async add(canvas,index){if(encoderError)throw encoderError;const timestamp=Math.round(index*1_000_000/FPS),duration=Math.round(1_000_000/FPS),frame=new VideoFrame(canvas,{timestamp,duration});encoder.encode(frame,{keyFrame:index%(FPS*2)===0});frame.close();if(encoder.encodeQueueSize>8)await new Promise(r=>setTimeout(r,0));},async finish(){await encoder.flush();if(encoderError)throw encoderError;encoder.close();muxer.finalize();return new Blob([target.buffer],{type:"video/mp4"});}};
  }
  function downloadBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
  async function exportVideo(){
    exportBtn.disabled=true;const original=exportBtn.textContent;exportBtn.textContent="Preparing video…";let iframe;
    try{
      iframe=makeHiddenViewer();const{doc,svg,api}=await waitForViewer(iframe);if(doc.fonts?.ready)await doc.fonts.ready;await sleep(150);
      api.hideControls();api.setWedgeOpacity(0);api.setSpiralProgress(0);api.setSpiralTone("gold");
      exportBtn.textContent="Preparing labels…";const labelLayer=makeLabelLayer(svg),canvas=document.createElement("canvas");canvas.width=SIZE;canvas.height=SIZE;const ctx=canvas.getContext("2d",{alpha:false});ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";const mp4=await createMp4Encoder();let frame=0;
      async function commitFrame(){await drawSvgFrame(svg,ctx,labelLayer);await mp4.add(canvas,frame++);}
      exportBtn.textContent="Rendering MP4…";
      for(let i=0;i<INITIAL_FRAMES;i++)await commitFrame();
      for(let i=1;i<=REVEAL_FRAMES;i++){api.setWedgeOpacity(.70*(i/REVEAL_FRAMES));await commitFrame();}
      api.setWedgeOpacity(.70);
      for(let i=1;i<=SPIRAL_FRAMES;i++){const t=i/SPIRAL_FRAMES;api.setSpiralProgress(1-Math.pow(1-t,3.2));await commitFrame();}
      api.setSpiralProgress(1);api.setSpiralTone("gold");for(let i=0;i<GOLD_FRAMES+FINAL_FRAMES;i++)await commitFrame();
      exportBtn.textContent="Finalising MP4…";const output=await mp4.finish();downloadBlob(output,`${exportBaseName()}.mp4`);exportBtn.textContent="MP4 exported";setTimeout(()=>exportBtn.textContent=original,2500);
    }catch(error){console.error("NCD Pot Plant video export failed:",error);alert(`Video export failed: ${error.message}`);exportBtn.textContent=original;}finally{if(iframe)iframe.remove();exportBtn.disabled=false;updateFilenamePreview();}
  }
  exportBtn.addEventListener("click",exportVideo);
})();