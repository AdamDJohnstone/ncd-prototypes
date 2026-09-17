(() => {
  const exportBtn=document.getElementById("exportVideoBtn"); if(!exportBtn)return;
  const churchNameInput=document.getElementById("churchNameInput");
  const filenamePreview=document.getElementById("exportFilenamePreview");
  const SIZE=1080,FPS=30;
  const EXPORT_VIEWBOX={x:-100,y:-100,width:1080,height:1080};
  const EXPORT_VIEWBOX_STRING=`${EXPORT_VIEWBOX.x} ${EXPORT_VIEWBOX.y} ${EXPORT_VIEWBOX.width} ${EXPORT_VIEWBOX.height}`;
  const INITIAL_FRAMES=Math.round(.35*FPS),REVEAL_FRAMES=FPS,SPIRAL_FRAMES=10*FPS,GOLD_FRAMES=Math.round(.5*FPS),FINAL_FRAMES=FPS;
  const FRAME_MS=1000/FPS;
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));

  function isSafari(){
    const ua=navigator.userAgent;
    return /Safari\//.test(ua)&&!/Chrome\//.test(ua)&&!/Chromium\//.test(ua)&&!/Edg\//.test(ua)&&!/OPR\//.test(ua);
  }
  function chooseRecordingFormat(){
    if(isSafari()){
      const mp4Types=["video/mp4;codecs=avc1.42E01E","video/mp4;codecs=avc1","video/mp4"];
      const mime=mp4Types.find(t=>MediaRecorder.isTypeSupported(t));
      if(mime)return {mime,ext:"mp4",label:"MP4"};
    }
    const webmTypes=["video/webm;codecs=vp9","video/webm;codecs=vp8","video/webm"];
    const mime=webmTypes.find(t=>MediaRecorder.isTypeSupported(t));
    if(mime)return {mime,ext:"webm",label:"WebM"};
    return {mime:"",ext:"webm",label:"WebM"};
  }
  function makeViewerUrl(){const c=new URLSearchParams(location.search),v=new URLSearchParams();if(c.get("scores"))v.set("scores",c.get("scores"));v.set("lang",c.get("lang")||"en");return `/ncd-prototypes/pot-plant/view/?${v}`;}
  function makeHiddenViewer(){const f=document.createElement("iframe");f.src=makeViewerUrl();f.setAttribute("aria-hidden","true");Object.assign(f.style,{position:"fixed",left:"-1200px",top:"0",width:"1080px",height:"1080px",border:"0",pointerEvents:"none",opacity:"1"});document.body.appendChild(f);return f;}
  function waitForLoad(f){return new Promise((res,rej)=>{const t=setTimeout(()=>rej(new Error("Viewer took too long to load.")),10000);f.addEventListener("load",()=>{clearTimeout(t);res();},{once:true});});}
  function safeFilenamePart(value){return value.trim().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/&/g," and ").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");}
  function exportBaseName(){const lang=new URLSearchParams(location.search).get("lang")||"en",church=safeFilenamePart(churchNameInput?.value||"");return `${church?church+"-":""}ncd-pot-plant-${lang}`;}
  function updateFilenamePreview(){if(filenamePreview){const format=window.MediaRecorder?chooseRecordingFormat():{ext:"mp4"};filenamePreview.textContent=`${exportBaseName()}.${format.ext}`;}}
  churchNameInput?.addEventListener("input",updateFilenamePreview);updateFilenamePreview();

  function prepareSvgClone(sourceSvg){
    const clone=sourceSvg.cloneNode(true),src=[sourceSvg,...sourceSvg.querySelectorAll("*")],dst=[clone,...clone.querySelectorAll("*")];
    const props=["fill","fill-opacity","stroke","stroke-opacity","stroke-width","stroke-linecap","stroke-linejoin","opacity","visibility","transform","transform-origin"];
    src.forEach((s,i)=>{const d=dst[i];if(!d||!(s instanceof Element))return;const st=s.ownerDocument.defaultView.getComputedStyle(s);props.forEach(p=>{const v=st.getPropertyValue(p);if(v)d.style.setProperty(p,v);});});
    const liveWedges=sourceSvg.querySelectorAll(".wedge");clone.querySelectorAll(".wedge").forEach((w,i)=>{const st=liveWedges[i].ownerDocument.defaultView.getComputedStyle(liveWedges[i]),o=st.opacity||"0";w.setAttribute("fill",`url(#wedgeGrad${i})`);w.style.fill=`url(#wedgeGrad${i})`;w.setAttribute("opacity",o);w.style.opacity=o;});
    const spiral=clone.querySelector("#spiral"),under=clone.querySelector("#spiralUnder"),dot=clone.querySelector("#stopDot");
    if(spiral){const s=sourceSvg.querySelector("#spiral"),st=s.ownerDocument.defaultView.getComputedStyle(s);spiral.removeAttribute("filter");spiral.style.filter="none";spiral.setAttribute("stroke",st.stroke||"#e0b62a");spiral.style.stroke=st.stroke||"#e0b62a";spiral.setAttribute("stroke-opacity",st.strokeOpacity||".86");spiral.style.strokeOpacity=st.strokeOpacity||".86";spiral.setAttribute("stroke-width","8");spiral.style.strokeWidth="8px";}
    if(under){const s=sourceSvg.querySelector("#spiralUnder"),st=s.ownerDocument.defaultView.getComputedStyle(s);under.removeAttribute("filter");under.style.filter="none";under.setAttribute("stroke",st.stroke||"#e0b62a");under.style.stroke=st.stroke||"#e0b62a";under.setAttribute("stroke-opacity",st.strokeOpacity||".16");under.style.strokeOpacity=st.strokeOpacity||".16";under.setAttribute("stroke-width","12");under.style.strokeWidth="12px";}
    if(dot){const s=sourceSvg.querySelector("#stopDot"),st=s.ownerDocument.defaultView.getComputedStyle(s);dot.removeAttribute("filter");dot.style.filter="none";dot.setAttribute("fill",st.fill||"#e0b62a");dot.style.fill=st.fill||"#e0b62a";dot.setAttribute("opacity",st.opacity||"0");dot.style.opacity=st.opacity||"0";}
    // Labels are drawn separately on canvas. This avoids Safari's SVG-image
    // shaping bug for complex scripts while retaining the live SVG geometry.
    clone.querySelector("#labels")?.remove();
    clone.querySelector("#labelPaths")?.remove();
    clone.setAttribute("viewBox",EXPORT_VIEWBOX_STRING);clone.setAttribute("width",SIZE);clone.setAttribute("height",SIZE);clone.setAttribute("xmlns","http://www.w3.org/2000/svg");clone.setAttribute("xmlns:xlink","http://www.w3.org/1999/xlink");clone.querySelectorAll("[tabindex]").forEach(e=>e.removeAttribute("tabindex"));return clone;
  }

  function svgToCanvasPoint(p){
    return {x:(p.x-EXPORT_VIEWBOX.x)*(SIZE/EXPORT_VIEWBOX.width),y:(p.y-EXPORT_VIEWBOX.y)*(SIZE/EXPORT_VIEWBOX.height)};
  }

  function graphemes(text,lang){
    if(typeof Intl!=="undefined"&&Intl.Segmenter){
      try{return [...new Intl.Segmenter(lang||undefined,{granularity:"grapheme"}).segment(text)].map(s=>s.segment);}catch(e){}
    }
    return Array.from(text);
  }

  function drawCanvasLabels(sourceSvg,ctx){
    const doc=sourceSvg.ownerDocument;
    const lang=doc.documentElement.lang||new URLSearchParams(location.search).get("lang")||"en";
    sourceSvg.querySelectorAll("#labels text").forEach(text=>{
      const textPath=text.querySelector("textPath");if(!textPath)return;
      const href=textPath.getAttribute("href")||textPath.getAttribute("xlink:href");if(!href)return;
      const path=doc.getElementById(href.replace(/^#/,""));if(!path)return;
      const pathLength=path.getTotalLength();if(!pathLength)return;
      const st=doc.defaultView.getComputedStyle(text);
      const fontSize=parseFloat(st.fontSize)||34,fontWeight=st.fontWeight||"400",fontStyle=st.fontStyle||"normal",fontFamily=st.fontFamily||"sans-serif";
      const spacing=parseFloat(st.letterSpacing)||0;
      const clusters=graphemes(textPath.textContent||"",lang);if(!clusters.length)return;

      ctx.save();
      ctx.font=`${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
      ctx.textAlign="center";ctx.textBaseline="middle";
      ctx.fillStyle=text.classList.contains("arc-label-adj")?"#223029":"#52605a";

      // Measure the shaped grapheme clusters first, then centre the complete
      // line on exactly the same SVG path used by the live textPath.
      const widths=clusters.map(g=>ctx.measureText(g).width);
      const totalWidth=widths.reduce((a,b)=>a+b,0)+Math.max(0,clusters.length-1)*spacing;
      let cursor=Math.max(0,(pathLength-totalWidth)/2);

      clusters.forEach((cluster,i)=>{
        const w=widths[i];
        const at=Math.max(0,Math.min(pathLength,cursor+w/2));
        const delta=Math.min(1.5,Math.max(.35,pathLength/500));
        const p=path.getPointAtLength(at),p0=path.getPointAtLength(Math.max(0,at-delta)),p1=path.getPointAtLength(Math.min(pathLength,at+delta));
        const cp=svgToCanvasPoint(p),angle=Math.atan2(p1.y-p0.y,p1.x-p0.x);
        ctx.save();ctx.translate(cp.x,cp.y);ctx.rotate(angle);ctx.fillText(cluster,0,0);ctx.restore();
        cursor+=w+spacing;
      });
      ctx.restore();
    });
  }

  async function drawSvgFrame(svg,ctx){
    const xml=new XMLSerializer().serializeToString(prepareSvgClone(svg)),blob=new Blob([xml],{type:"image/svg+xml;charset=utf-8"}),url=URL.createObjectURL(blob);
    try{const im=new Image();im.src=url;await im.decode();ctx.fillStyle="#fff";ctx.fillRect(0,0,SIZE,SIZE);ctx.drawImage(im,0,0,SIZE,SIZE);drawCanvasLabels(svg,ctx);}finally{URL.revokeObjectURL(url);}
  }

  async function exportVideo(){
    if(!window.MediaRecorder||!HTMLCanvasElement.prototype.captureStream){alert("Video export is not supported by this browser. Please try the latest Chrome or Safari.");return;}
    exportBtn.disabled=true;const original=exportBtn.textContent;exportBtn.textContent="Preparing video…";let iframe,recorder,stream;
    try{
      iframe=makeHiddenViewer();await waitForLoad(iframe);await sleep(900);
      const doc=iframe.contentDocument,svg=doc.getElementById("viz"),api=iframe.contentWindow.NCDPotPlantExport;if(!svg||!api)throw new Error("Could not initialise deterministic video renderer.");
      if(doc.fonts?.ready)await doc.fonts.ready;
      api.hideControls();api.setWedgeOpacity(0);api.setSpiralProgress(0);api.setSpiralTone("gold");
      const canvas=document.createElement("canvas");canvas.width=SIZE;canvas.height=SIZE;const ctx=canvas.getContext("2d",{alpha:false});stream=canvas.captureStream(FPS);const format=chooseRecordingFormat(),chunks=[];
      recorder=new MediaRecorder(stream,format.mime?{mimeType:format.mime,videoBitsPerSecond:8_000_000}:{videoBitsPerSecond:8_000_000});recorder.addEventListener("dataavailable",e=>{if(e.data?.size)chunks.push(e.data);});const stopped=new Promise(r=>recorder.addEventListener("stop",r,{once:true}));
      await drawSvgFrame(svg,ctx);recorder.start(250);let frameNumber=0,start=performance.now();
      async function commitFrame(){await drawSvgFrame(svg,ctx);frameNumber++;const target=start+frameNumber*FRAME_MS,delay=target-performance.now();if(delay>0)await sleep(delay);}
      exportBtn.textContent="Rendering video…";
      for(let i=0;i<INITIAL_FRAMES;i++)await commitFrame();
      for(let i=1;i<=REVEAL_FRAMES;i++){api.setWedgeOpacity(.70*(i/REVEAL_FRAMES));await commitFrame();}
      api.setWedgeOpacity(.70);
      for(let i=1;i<=SPIRAL_FRAMES;i++){const t=i/SPIRAL_FRAMES,easedProgress=1-Math.pow(1-t,3.2);api.setSpiralProgress(easedProgress);await commitFrame();}
      api.setSpiralProgress(1);api.setSpiralTone("gold");for(let i=0;i<GOLD_FRAMES+FINAL_FRAMES;i++)await commitFrame();
      recorder.stop();await stopped;stream.getTracks().forEach(t=>t.stop());
      const actualType=recorder.mimeType||format.mime||"video/webm",output=new Blob(chunks,{type:actualType}),url=URL.createObjectURL(output),a=document.createElement("a");a.href=url;a.download=`${exportBaseName()}.${format.ext}`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);exportBtn.textContent=format.ext==="mp4"?"MP4 exported":"Video exported (WebM)";setTimeout(()=>exportBtn.textContent=original,2500);
    }catch(error){console.error("NCD Pot Plant video export failed:",error);alert(`Video export failed: ${error.message}`);exportBtn.textContent=original;if(recorder&&recorder.state!=="inactive")recorder.stop();}finally{if(stream)stream.getTracks().forEach(t=>t.stop());if(iframe)iframe.remove();exportBtn.disabled=false;updateFilenamePreview();}
  }
  exportBtn.addEventListener("click",exportVideo);
})();
