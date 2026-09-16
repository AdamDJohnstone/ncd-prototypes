(() => {
  const exportBtn = document.getElementById("exportVideoBtn");
  if (!exportBtn) return;

  const EXPORT_WIDTH = 1000;
  const EXPORT_HEIGHT = 1000;
  const FPS = 30;
  const INITIAL_SETTLE_MS = 250;
  const WEDGE_REVEAL_MS = 1000;
  const SPIRAL_MS = 10000;
  const GOLD_HOLD_MS = 500;
  const OLIVE_SETTLE_MS = 1800;
  const FINAL_HOLD_MS = 1000;
  const TOTAL_MS = INITIAL_SETTLE_MS + WEDGE_REVEAL_MS + SPIRAL_MS + GOLD_HOLD_MS + OLIVE_SETTLE_MS + FINAL_HOLD_MS;

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

  function copyComputedStyles(source, target){
    const sourceNodes = [source, ...source.querySelectorAll("*")];
    const targetNodes = [target, ...target.querySelectorAll("*")];

    sourceNodes.forEach((node, index) => {
      const clone = targetNodes[index];
      if (!clone || !(node instanceof Element)) return;

      const style = getComputedStyle(node);
      const properties = [
        "fill", "fill-opacity", "stroke", "stroke-opacity", "stroke-width",
        "stroke-linecap", "stroke-linejoin", "opacity", "font-family",
        "font-size", "font-weight", "font-style", "letter-spacing",
        "text-anchor", "dominant-baseline", "filter", "visibility"
      ];

      properties.forEach(property => {
        const value = style.getPropertyValue(property);
        if (value) clone.style.setProperty(property, value);
      });
    });
  }

  async function drawSvgFrame(sourceSvg, ctx){
    const clone = sourceSvg.cloneNode(true);
    copyComputedStyles(sourceSvg, clone);

    clone.setAttribute("width", String(EXPORT_WIDTH));
    clone.setAttribute("height", String(EXPORT_HEIGHT));
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");

    // Interactive accessibility attributes are irrelevant in the exported image.
    clone.querySelectorAll("[tabindex]").forEach(el => el.removeAttribute("tabindex"));

    const xml = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([xml], {type: "image/svg+xml;charset=utf-8"});
    const url = URL.createObjectURL(blob);

    try {
      const image = new Image();
      image.decoding = "sync";
      image.src = url;
      await image.decode();

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);
      ctx.drawImage(image, 0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  function makeViewerUrl(){
    const params = new URLSearchParams(window.location.search);
    const scores = params.get("scores");
    const lang = params.get("lang") || "en";

    const viewerParams = new URLSearchParams();
    if (scores) viewerParams.set("scores", scores);
    viewerParams.set("lang", lang);

    return `/ncd-prototypes/pot-plant/view/?${viewerParams.toString()}`;
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

  function sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
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

    try {
      iframe = makeHiddenViewer();
      await waitForLoad(iframe);
      await sleep(300);

      const viewerDoc = iframe.contentDocument;
      const sourceSvg = viewerDoc.getElementById("viz");
      const growBtn = viewerDoc.getElementById("growBtn");
      if (!sourceSvg || !growBtn) throw new Error("Could not initialise the clean viewer.");

      const canvas = document.createElement("canvas");
      canvas.width = EXPORT_WIDTH;
      canvas.height = EXPORT_HEIGHT;
      const ctx = canvas.getContext("2d", {alpha:false});
      const stream = canvas.captureStream(FPS);
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

      // Capture the labels-only opening frame before starting the viewer animation.
      await drawSvgFrame(sourceSvg, ctx);
      recorder.start(250);
      await sleep(INITIAL_SETTLE_MS);

      growBtn.click();
      const started = performance.now();
      let nextFrame = started;
      const activeDuration = TOTAL_MS - INITIAL_SETTLE_MS;

      while (performance.now() - started < activeDuration){
        await drawSvgFrame(sourceSvg, ctx);
        nextFrame += 1000 / FPS;
        const delay = nextFrame - performance.now();
        if (delay > 0) await sleep(delay);
      }

      // Ensure the final settled frame is present at the end of the recording.
      await drawSvgFrame(sourceSvg, ctx);
      recorder.stop();
      await stopped;
      stream.getTracks().forEach(track => track.stop());

      const actualType = recorder.mimeType || mimeType || "video/webm";
      const extension = actualType.includes("mp4") ? "mp4" : "webm";
      const output = new Blob(chunks, {type: actualType});
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
      if (iframe) iframe.remove();
      exportBtn.disabled = false;
    }
  }

  exportBtn.addEventListener("click", exportVideo);
})();
