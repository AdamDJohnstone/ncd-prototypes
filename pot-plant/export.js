(() => {
  const exportBtn = document.getElementById("exportVideoBtn");
  if (!exportBtn) return;

  const SIZE = 1000;
  const FPS = 30;
  const INITIAL_HOLD_MS = 350;
  const WEDGE_REVEAL_MS = 1000;
  const SPIRAL_MS = 10000;
  const GOLD_HOLD_MS = 500;
  const OLIVE_SETTLE_MS = 1800;
  const FINAL_HOLD_MS = 1000;
  const TOTAL_AFTER_CLICK_MS = WEDGE_REVEAL_MS + SPIRAL_MS + GOLD_HOLD_MS + OLIVE_SETTLE_MS + FINAL_HOLD_MS;

  function sleep(ms){ return new Promise(resolve => setTimeout(resolve, ms)); }

  function chooseMimeType(){
    const candidates = [
      "video/mp4;codecs=h264", "video/mp4",
      "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"
    ];
    return candidates.find(type => MediaRecorder.isTypeSupported(type)) || "";
  }

  function makeViewerUrl(){
    const current = new URLSearchParams(window.location.search);
    const viewer = new URLSearchParams();
    if (current.get("scores")) viewer.set("scores", current.get("scores"));
    viewer.set("lang", current.get("lang") || "en");
    return `/ncd-prototypes/pot-plant/view/?${viewer.toString()}`;
  }

  function makeHiddenViewer(){
    const iframe = document.createElement("iframe");
    iframe.src = makeViewerUrl();
    iframe.setAttribute("aria-hidden", "true");
    Object.assign(iframe.style, {
      position:"fixed", left:"-1200px", top:"0", width:"1000px", height:"1000px",
      border:"0", pointerEvents:"none", opacity:"1"
    });
    document.body.appendChild(iframe);
    return iframe;
  }

  function waitForLoad(iframe){
    return new Promise((resolve,reject) => {
      const timer = setTimeout(() => reject(new Error("Viewer took too long to load.")),10000);
      iframe.addEventListener("load",() => { clearTimeout(timer); resolve(); },{once:true});
    });
  }

  function prepareSvgClone(sourceSvg){
    const clone = sourceSvg.cloneNode(true);
    const sourceNodes = [sourceSvg,...sourceSvg.querySelectorAll("*")];
    const cloneNodes = [clone,...clone.querySelectorAll("*")];

    const copiedProperties = [
      "fill","fill-opacity","stroke","stroke-opacity","stroke-width",
      "stroke-linecap","stroke-linejoin","opacity","font-size","font-weight",
      "font-style","letter-spacing","text-anchor","dominant-baseline","visibility",
      "transform","transform-origin"
    ];

    sourceNodes.forEach((source,index) => {
      const target = cloneNodes[index];
      if (!target || !(source instanceof Element)) return;
      const style = source.ownerDocument.defaultView.getComputedStyle(source);
      copiedProperties.forEach(property => {
        const value = style.getPropertyValue(property);
        if (value) target.style.setProperty(property,value);
      });
    });

    clone.querySelectorAll("text").forEach(text => {
      text.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    });

    /*
      The live viewer makes wedges translucent with CSS opacity. During SVG image
      serialisation some browsers effectively flatten the gradient paint and lose
      that inherited/transitional opacity. Make the current live opacity explicit
      on each exported wedge so the spiral beneath remains visible.
    */
    const liveWedges = sourceSvg.querySelectorAll(".wedge");
    clone.querySelectorAll(".wedge").forEach((wedge,index) => {
      const live = liveWedges[index];
      const liveStyle = live.ownerDocument.defaultView.getComputedStyle(live);
      const opacity = liveStyle.opacity || "0";
      wedge.setAttribute("fill",`url(#wedgeGrad${index})`);
      wedge.style.fill = `url(#wedgeGrad${index})`;
      wedge.setAttribute("opacity",opacity);
      wedge.style.opacity = opacity;
    });

    const spiral = clone.querySelector("#spiral");
    const spiralUnder = clone.querySelector("#spiralUnder");
    const stopDot = clone.querySelector("#stopDot");

    /*
      Use explicit export-safe spiral paint. The live path geometry (d) is still
      copied every frame, so the video follows the real animation exactly. Avoid
      SVG filters here: they are cosmetic and are unreliable when an SVG blob is
      decoded into a canvas image. The visible gold/olive line itself is what we
      need to preserve.
    */
    if (spiral){
      const source = sourceSvg.querySelector("#spiral");
      const style = source.ownerDocument.defaultView.getComputedStyle(source);
      spiral.removeAttribute("filter");
      spiral.style.filter = "none";
      spiral.setAttribute("stroke",style.stroke || "#e0b62a");
      spiral.style.stroke = style.stroke || "#e0b62a";
      spiral.setAttribute("stroke-opacity",style.strokeOpacity || ".86");
      spiral.style.strokeOpacity = style.strokeOpacity || ".86";
      spiral.setAttribute("stroke-width","8");
      spiral.style.strokeWidth = "8px";
    }

    if (spiralUnder){
      const source = sourceSvg.querySelector("#spiralUnder");
      const style = source.ownerDocument.defaultView.getComputedStyle(source);
      spiralUnder.removeAttribute("filter");
      spiralUnder.style.filter = "none";
      spiralUnder.setAttribute("stroke",style.stroke || "#e0b62a");
      spiralUnder.style.stroke = style.stroke || "#e0b62a";
      spiralUnder.setAttribute("stroke-opacity",style.strokeOpacity || ".16");
      spiralUnder.style.strokeOpacity = style.strokeOpacity || ".16";
      spiralUnder.setAttribute("stroke-width","12");
      spiralUnder.style.strokeWidth = "12px";
    }

    if (stopDot){
      const source = sourceSvg.querySelector("#stopDot");
      const style = source.ownerDocument.defaultView.getComputedStyle(source);
      stopDot.removeAttribute("filter");
      stopDot.style.filter = "none";
      stopDot.setAttribute("fill",style.fill || "#e0b62a");
      stopDot.style.fill = style.fill || "#e0b62a";
      stopDot.setAttribute("opacity",style.opacity || "0");
      stopDot.style.opacity = style.opacity || "0";
    }

    clone.setAttribute("width",String(SIZE));
    clone.setAttribute("height",String(SIZE));
    clone.setAttribute("xmlns","http://www.w3.org/2000/svg");
    clone.setAttribute("xmlns:xlink","http://www.w3.org/1999/xlink");
    clone.querySelectorAll("[tabindex]").forEach(el => el.removeAttribute("tabindex"));
    return clone;
  }

  async function drawSvgFrame(sourceSvg,ctx){
    const clone = prepareSvgClone(sourceSvg);
    const xml = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([xml],{type:"image/svg+xml;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0,0,SIZE,SIZE);
      ctx.drawImage(image,0,0,SIZE,SIZE);
    } finally { URL.revokeObjectURL(url); }
  }

  async function exportVideo(){
    if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream){
      alert("Video export is not supported by this browser. Please try the latest Chrome or Safari.");
      return;
    }

    exportBtn.disabled = true;
    const originalText = exportBtn.textContent;
    exportBtn.textContent = "Preparing video…";
    let iframe, recorder, stream;

    try {
      iframe = makeHiddenViewer();
      await waitForLoad(iframe);
      await sleep(900);

      const viewerDoc = iframe.contentDocument;
      const sourceSvg = viewerDoc.getElementById("viz");
      const growBtn = viewerDoc.getElementById("growBtn");
      if (!sourceSvg || !growBtn) throw new Error("Could not initialise the clean viewer.");

      const canvas = document.createElement("canvas");
      canvas.width = SIZE; canvas.height = SIZE;
      const ctx = canvas.getContext("2d",{alpha:false});
      stream = canvas.captureStream(FPS);
      const mimeType = chooseMimeType();
      const chunks = [];

      recorder = new MediaRecorder(stream,mimeType ? {mimeType,videoBitsPerSecond:8_000_000}:{videoBitsPerSecond:8_000_000});
      recorder.addEventListener("dataavailable",event => { if(event.data && event.data.size) chunks.push(event.data); });
      const stopped = new Promise(resolve => recorder.addEventListener("stop",resolve,{once:true}));

      await drawSvgFrame(sourceSvg,ctx);
      recorder.start(250);
      await sleep(INITIAL_HOLD_MS);

      growBtn.click();
      const started = performance.now();
      let nextFrame = started;
      while(performance.now()-started < TOTAL_AFTER_CLICK_MS){
        await drawSvgFrame(sourceSvg,ctx);
        nextFrame += 1000/FPS;
        const delay = nextFrame-performance.now();
        if(delay>0) await sleep(delay);
      }

      await drawSvgFrame(sourceSvg,ctx);
      recorder.stop();
      await stopped;
      stream.getTracks().forEach(track => track.stop());

      const actualType = recorder.mimeType || mimeType || "video/webm";
      const extension = actualType.includes("mp4") ? "mp4" : "webm";
      const output = new Blob(chunks,{type:actualType});
      const url = URL.createObjectURL(output);
      const lang = new URLSearchParams(window.location.search).get("lang") || "en";
      const link = document.createElement("a");
      link.href = url;
      link.download = `ncd-pot-plant-${lang}.${extension}`;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url),30000);
      exportBtn.textContent = extension === "mp4" ? "MP4 exported" : "Video exported (WebM)";
      setTimeout(() => { exportBtn.textContent = originalText; },2500);
    } catch(error){
      console.error("NCD Pot Plant video export failed:",error);
      alert(`Video export failed: ${error.message}`);
      exportBtn.textContent = originalText;
      if(recorder && recorder.state !== "inactive") recorder.stop();
    } finally {
      if(stream) stream.getTracks().forEach(track => track.stop());
      if(iframe) iframe.remove();
      exportBtn.disabled = false;
    }
  }

  exportBtn.addEventListener("click",exportVideo);
})();
