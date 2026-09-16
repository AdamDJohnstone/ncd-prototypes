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

  function sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function chooseMimeType(){
    const candidates = [
      "video/mp4;codecs=h264",
      "video/mp4",
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm"
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
      position: "fixed",
      left: "-1200px",
      top: "0",
      width: "1000px",
      height: "1000px",
      border: "0",
      pointerEvents: "none",
      opacity: "1"
    });
    document.body.appendChild(iframe);
    return iframe;
  }

  function waitForLoad(iframe){
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Viewer took too long to load.")), 10000);
      iframe.addEventListener("load", () => {
        clearTimeout(timer);
        resolve();
      }, {once:true});
    });
  }

  /*
    SVG rendered as an <img> is a separate image document. Browser-generated
    computed font names and absolute url(...) references can therefore behave
    differently from the live SVG. Keep the live SVG's geometry, but make the
    image clone self-contained before drawing it to the recording canvas.
  */
  function prepareSvgClone(sourceSvg){
    const clone = sourceSvg.cloneNode(true);
    const sourceNodes = [sourceSvg, ...sourceSvg.querySelectorAll("*")];
    const cloneNodes = [clone, ...clone.querySelectorAll("*")];

    const copiedProperties = [
      "fill", "fill-opacity", "stroke", "stroke-opacity", "stroke-width",
      "stroke-linecap", "stroke-linejoin", "opacity", "font-size",
      "font-weight", "font-style", "letter-spacing", "text-anchor",
      "dominant-baseline", "visibility", "transform", "transform-origin"
    ];

    sourceNodes.forEach((source, index) => {
      const target = cloneNodes[index];
      if (!target || !(source instanceof Element)) return;
      const style = source.ownerDocument.defaultView.getComputedStyle(source);
      copiedProperties.forEach(property => {
        const value = style.getPropertyValue(property);
        if (value) target.style.setProperty(property, value);
      });
    });

    /* Match the live viewer's system font instead of serialising Safari/Chrome's
       private computed font-family name, which can fall back during SVG decoding. */
    clone.querySelectorAll("text").forEach(text => {
      text.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    });

    /* Re-establish local paint/filter references inside the cloned SVG. */
    clone.querySelectorAll(".wedge").forEach((wedge, index) => {
      wedge.setAttribute("fill", `url(#wedgeGrad${index})`);
      wedge.style.fill = `url(#wedgeGrad${index})`;
    });

    const spiral = clone.querySelector("#spiral");
    const spiralUnder = clone.querySelector("#spiralUnder");
    const stopDot = clone.querySelector("#stopDot");

    if (spiral){
      const source = sourceSvg.querySelector("#spiral");
      const style = source.ownerDocument.defaultView.getComputedStyle(source);
      spiral.style.stroke = style.stroke;
      spiral.style.strokeOpacity = style.strokeOpacity;
      spiral.setAttribute("filter", "url(#spiralGlow)");
      spiral.style.filter = "url(#spiralGlow)";
    }

    if (spiralUnder){
      const source = sourceSvg.querySelector("#spiralUnder");
      const style = source.ownerDocument.defaultView.getComputedStyle(source);
      spiralUnder.style.stroke = style.stroke;
      spiralUnder.style.strokeOpacity = style.strokeOpacity;
      spiralUnder.style.filter = "none";
    }

    if (stopDot){
      const source = sourceSvg.querySelector("#stopDot");
      const style = source.ownerDocument.defaultView.getComputedStyle(source);
      stopDot.style.fill = style.fill;
      stopDot.setAttribute("filter", "url(#tipGlow)");
      stopDot.style.filter = "url(#tipGlow)";
    }

    clone.setAttribute("width", String(SIZE));
    clone.setAttribute("height", String(SIZE));
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
    clone.querySelectorAll("[tabindex]").forEach(el => el.removeAttribute("tabindex"));

    return clone;
  }

  async function drawSvgFrame(sourceSvg, ctx){
    const clone = prepareSvgClone(sourceSvg);
    const xml = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([xml], {type:"image/svg+xml;charset=utf-8"});
    const url = URL.createObjectURL(blob);

    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, SIZE, SIZE);
      ctx.drawImage(image, 0, 0, SIZE, SIZE);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async function exportVideo(){
    if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream){
      alert("Video export is not supported by this browser. Please try the latest Chrome or Safari.");
      return;
    }

    exportBtn.disabled = true;
    const originalText = exportBtn.textContent;
    exportBtn.textContent = "Preparing video…";

    let iframe;
    let recorder;
    let stream;

    try {
      iframe = makeHiddenViewer();
      await waitForLoad(iframe);
      await sleep(900); // allow the viewer label reveal and fonts to settle

      const viewerDoc = iframe.contentDocument;
      const sourceSvg = viewerDoc.getElementById("viz");
      const growBtn = viewerDoc.getElementById("growBtn");
      if (!sourceSvg || !growBtn) throw new Error("Could not initialise the clean viewer.");

      const canvas = document.createElement("canvas");
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext("2d", {alpha:false});
      stream = canvas.captureStream(FPS);
      const mimeType = chooseMimeType();
      const chunks = [];

      recorder = new MediaRecorder(stream, mimeType ? {
        mimeType,
        videoBitsPerSecond: 8_000_000
      } : {videoBitsPerSecond: 8_000_000});

      recorder.addEventListener("dataavailable", event => {
        if (event.data && event.data.size) chunks.push(event.data);
      });

      const stopped = new Promise(resolve => recorder.addEventListener("stop", resolve, {once:true}));

      await drawSvgFrame(sourceSvg, ctx);
      recorder.start(250);
      await sleep(INITIAL_HOLD_MS);

      growBtn.click();
      const started = performance.now();
      let nextFrame = started;

      while (performance.now() - started < TOTAL_AFTER_CLICK_MS){
        await drawSvgFrame(sourceSvg, ctx);
        nextFrame += 1000 / FPS;
        const delay = nextFrame - performance.now();
        if (delay > 0) await sleep(delay);
      }

      await drawSvgFrame(sourceSvg, ctx);
      recorder.stop();
      await stopped;
      stream.getTracks().forEach(track => track.stop());

      const actualType = recorder.mimeType || mimeType || "video/webm";
      const extension = actualType.includes("mp4") ? "mp4" : "webm";
      const output = new Blob(chunks, {type:actualType});
      const url = URL.createObjectURL(output);
      const lang = new URLSearchParams(window.location.search).get("lang") || "en";
      const link = document.createElement("a");
      link.href = url;
      link.download = `ncd-pot-plant-${lang}.${extension}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);

      exportBtn.textContent = extension === "mp4" ? "MP4 exported" : "Video exported (WebM)";
      setTimeout(() => { exportBtn.textContent = originalText; }, 2500);
    } catch (error) {
      console.error("NCD Pot Plant video export failed:", error);
      alert(`Video export failed: ${error.message}`);
      exportBtn.textContent = originalText;
      if (recorder && recorder.state !== "inactive") recorder.stop();
    } finally {
      if (stream) stream.getTracks().forEach(track => track.stop());
      if (iframe) iframe.remove();
      exportBtn.disabled = false;
    }
  }

  exportBtn.addEventListener("click", exportVideo);
})();
