(() => {
  const exportBtn=document.getElementById("exportVideoBtn"); if(!exportBtn)return;
  const SIZE=1000,FPS=30;
  const INITIAL_FRAMES=Math.round(.35*FPS),REVEAL_FRAMES=FPS,SPIRAL_FRAMES=10*FPS,GOLD_FRAMES=Math.round(.5*FPS),FINAL_FRAMES=FPS;
  const FRAME_MS=1000/FPS;
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  function chooseMimeType(){return ["video/mp4;codecs=h264","video/mp4","video/webm;codecs=vp9","video/webm;codecs=vp8","video/webm"].find(t=>MediaRecorder.isTypeSupported(t))||"";}
  function makeViewerUrl(){const c=new URLSearchParams(location.search),v=new URLSearchParams();if(c.get("scores"))v.set("scores",c.get("scores"));v.set("lang",c.get("lang")||"en");return `/ncd-prototypes/pot-plant/view/?${v}`;}
  function makeHiddenViewer(){const f=document.createElement("iframe");f.src=makeViewerUrl();f.setAttribute("aria-hidden","true");Object.assign(f.style,{position:"fixed",left:"-1200px",top:"0",width:"1000px",height:"1000px",border:"0",pointerEvents:"none",opacity:"1"});document.body.appendChild(f);return f;}
  function waitForLoad(f){return new Promise((res,rej)=>{const t=setTimeout(()=>rej(new Error("Viewer took too long to load.")),10000);f.addEventListener("load",()=>{clearTimeout(t);res();},{once:true});});}

  function prepareSvgClone(sourceSvg){
    const clone=sourceSvg.cloneNode(true),src=[sourceSvg,...sourceSvg.querySelectorAll("*")],dst=[clone,...clone.querySelectorAll("*")];
    const props=["fill","fill-opacity","stroke","stroke-opacity","stroke-width","stroke-linecap","stroke-linejoin","opacity","font-size","font-weight","font-style","letter-spacing","text-anchor","dominant-baseline","visibility","transform","transform-origin"];
    src.forEach((s,i)=>{const d=dst[i];if(!d||!(s instanceof Element))return;const st=s.ownerDocument.defaultView.getComputedStyle(s);props.forEach(p=>{const v=st.getPropertyValue(p);if(v)d.style.setProperty(p,v);});});
    clone.querySelectorAll("text").forEach(t=>t.style.fontFamily='system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif');

    /* Preserve the live label hierarchy explicitly when the SVG is rasterised for video. */
    clone.querySelectorAll(".arc-label-adj").forEach(t=>{
      t.setAttribute("fill","#223029");
      t.style.fill="#223029";
    });
    clone.querySelectorAll(".arc-label-noun").forEach(t=>{
      t.setAttribute("fill","#52605a");
      t.style.fill="#52605a";
    });

    const liveWedges=sourceSvg.querySelectorAll(".wedge");clone.querySelectorAll(".wedge").forEach((w,i)=>{const st=liveWedges[i].ownerDocument.defaultView.getComputedStyle(liveWedges[i]),o=st.opacity||"0";w.setAttribute("fill",`url(#wedgeGrad${i})`);w.style.fill=`url(#wedgeGrad${i})`;w.setAttribute("opacity",o);w.style.opacity=o;});
    const spiral=clone.querySelector("#spiral"),under=clone.querySelector("#spiralUnder"),dot=clone.querySelector("#stopDot");
    if(spiral){const s=sourceSvg.querySelector("#spiral"),st=s.ownerDocument.defaultView.getComputedStyle(s);spiral.removeAttribute("filter");spiral.style.filter="none";spiral.setAttribute("stroke",st.stroke||"#e0b62a");spiral.style.stroke=st.stroke||"#e0b62a";spiral.setAttribute("stroke-opacity",st.strokeOpacity||".86");spiral.style.strokeOpacity=st.strokeOpacity||".86";spiral.setAttribute("stroke-width","8");spiral.style.strokeWidth="8px";}
    if(under){const s=sourceSvg.querySelector("#spiralUnder"),st=s.ownerDocument.defaultView.getComputedStyle(s);under.removeAttribute("filter");under.style.filter="none";under.setAttribute("stroke",st.stroke||"#e0b62a");under.style.stroke=st.stroke||"#e0b62a";under.setAttribute("stroke-opacity",st.strokeOpacity||".16");under.style.strokeOpacity=st.strokeOpacity||".16";under.setAttribute("stroke-width","12");under.style.strokeWidth="12px";}
    if(dot){const s=sourceSvg.querySelector("#stopDot"),st=s.ownerDocument.defaultView.getComputedStyle(s);dot.removeAttribute("filter");dot.style.filter="none";dot.setAttribute("fill",st.fill||"#e0b62a");dot.style.fill=st.fill||"#e0b62a";dot.setAttribute("opacity",st.opacity||"0");dot.style.opacity=st.opacity||"0";}
    clone.setAttribute("width",SIZE);clone.setAttribute("height",SIZE);clone.setAttribute("xmlns","http://www.w3.org/2000/svg");clone.setAttribute("xmlns:xlink","http://www.w3.org/1999/xlink");clone.querySelectorAll("[tabindex]").forEach(e=>e.removeAttribute("tabindex"));return clone;
  }
  async function drawSvgFrame(svg,ctx){const xml=new XMLSerializer().serializeToString(prepareSvgClone(svg)),blob=new Blob([xml],{type:"image/svg+xml;charset=utf-8"}),url=URL.createObjectURL(blob);try{const im=new Image();im.src=url;await im.decode();ctx.fillStyle="#fff";ctx.fillRect(0,0,SIZE,SIZE);ctx.drawImage(im,0,0,SIZE,SIZE);}finally{URL.revokeObjectURL(url);}}

  async function exportVideo(){
    if(!window.MediaRecorder||!HTMLCanvasElement.prototype.captureStream){alert("Video export is not supported by this browser. Please try the latest Chrome or Safari.");return;}
    exportBtn.disabled=true;const original=exportBtn.textContent;exportBtn.textContent="Preparing video…";let iframe,recorder,stream;
    try{
      iframe=makeHiddenViewer();await waitForLoad(iframe);await sleep(900);
      const doc=iframe.contentDocument,svg=doc.getElementById("viz"),api=iframe.contentWindow.NCDPotPlantExport;if(!svg||!api)throw new Error("Could not initialise deterministic video renderer.");
      api.hideControls();api.setWedgeOpacity(0);api.setSpiralProgress(0);api.setSpiralTone("gold");
      const canvas=document.createElement("canvas");canvas.width=SIZE;canvas.height=SIZE;const ctx=canvas.getContext("2d",{alpha:false});stream=canvas.captureStream(FPS);const mime=chooseMimeType(),chunks=[];
      recorder=new MediaRecorder(stream,mime?{mimeType:mime,videoBitsPerSecond:8_000_000}:{videoBitsPerSecond:8_000_000});recorder.addEventListener("dataavailable",e=>{if(e.data?.size)chunks.push(e.data);});const stopped=new Promise(r=>recorder.addEventListener("stop",r,{once:true}));
      await drawSvgFrame(svg,ctx);recorder.start(250);let frameNumber=0,start=performance.now();
      async function commitFrame(){await drawSvgFrame(svg,ctx);frameNumber++;const target=start+frameNumber*FRAME_MS,delay=target-performance.now();if(delay>0)await sleep(delay);}
      exportBtn.textContent="Rendering video…";
      for(let i=0;i<INITIAL_FRAMES;i++)await commitFrame();
      for(let i=1;i<=REVEAL_FRAMES;i++){api.setWedgeOpacity(.70*(i/REVEAL_FRAMES));await commitFrame();}
      api.setWedgeOpacity(.70);
      /* Match the live animation exactly: rapid early growth, then a long deceleration into the constraint. */
      for(let i=1;i<=SPIRAL_FRAMES;i++){
        const t=i/SPIRAL_FRAMES;
        const easedProgress=1-Math.pow(1-t,3.2);
        api.setSpiralProgress(easedProgress);
        await commitFrame();
      }
      /* Keep the completed spiral in the same gold/yellow state; no post-growth grey/olive fade. */
      api.setSpiralProgress(1);api.setSpiralTone("gold");
      for(let i=0;i<GOLD_FRAMES+FINAL_FRAMES;i++)await commitFrame();
      recorder.stop();await stopped;stream.getTracks().forEach(t=>t.stop());
      const type=recorder.mimeType||mime||"video/webm",ext=type.includes("mp4")?"mp4":"webm",output=new Blob(chunks,{type}),url=URL.createObjectURL(output),lang=new URLSearchParams(location.search).get("lang")||"en",a=document.createElement("a");a.href=url;a.download=`ncd-pot-plant-${lang}.${ext}`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);exportBtn.textContent=ext==="mp4"?"MP4 exported":"Video exported (WebM)";setTimeout(()=>exportBtn.textContent=original,2500);
    }catch(error){console.error("NCD Pot Plant video export failed:",error);alert(`Video export failed: ${error.message}`);exportBtn.textContent=original;if(recorder&&recorder.state!=="inactive")recorder.stop();}finally{if(stream)stream.getTracks().forEach(t=>t.stop());if(iframe)iframe.remove();exportBtn.disabled=false;}
  }
  exportBtn.addEventListener("click",exportVideo);
})();
