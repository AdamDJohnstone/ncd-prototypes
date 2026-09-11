(() => {
  /*
    INPUT ORDER — used by BOTH sliders and ?scores=
    1. Empowering Leadership
    2. Gift-based Ministry
    3. Passionate Spirituality
    4. Effective Structures
    5. Inspiring Worship Service
    6. Holistic Small Groups
    7. Need-oriented Evangelism
    8. Loving Relationships

    DIAGRAM ORDER — fixed clockwise from top centre
    Loving Relationships
    Empowering Leadership
    Effective Structures
    Gift-based Ministry
    Need-oriented Evangelism
    Inspiring Worship Service
    Passionate Spirituality
    Holistic Small Groups
  */

  const INPUT_QCS = [
    { key:"EL", adjective:"Empowering", noun:"Leadership" },
    { key:"GBM", adjective:"Gift-based", noun:"Ministry" },
    { key:"PS", adjective:"Passionate", noun:"Spirituality" },
    { key:"ES", adjective:"Effective", noun:"Structures" },
    { key:"IWS", adjective:"Inspiring", noun:"Worship Service" },
    { key:"HSG", adjective:"Holistic", noun:"Small Groups" },
    { key:"NOE", adjective:"Need-oriented", noun:"Evangelism" },
    { key:"LR", adjective:"Loving", noun:"Relationships" }
  ];

  const DIAGRAM_QCS = [
    { key:"LR", adjective:"Loving", noun:"Relationships" },
    { key:"EL", adjective:"Empowering", noun:"Leadership" },
    { key:"ES", adjective:"Effective", noun:"Structures" },
    { key:"GBM", adjective:"Gift-based", noun:"Ministry" },
    { key:"NOE", adjective:"Need-oriented", noun:"Evangelism" },
    { key:"IWS", adjective:"Inspiring", noun:"Worship Service" },
    { key:"PS", adjective:"Passionate", noun:"Spirituality" },
    { key:"HSG", adjective:"Holistic", noun:"Small Groups" }
  ];

  const DEFAULT_INPUT_SCORES = [67,52,62,59,71,74,43,78];

  const fills = [
    "#477B39", // Loving Relationships
    "#727145", // Empowering Leadership
    "#926550", // Effective Structures
    "#9A5C5E", // Gift-based Ministry
    "#786071", // Need-oriented Evangelism
    "#526082", // Inspiring Worship Service
    "#436777", // Passionate Spirituality
    "#44725C"  // Holistic Small Groups
  ];

  const svg = document.getElementById("viz");
  if (!svg) return;

  const svgDefs = svg.querySelector("defs");
  const wedgesG = document.getElementById("wedges");
  const labelPathsG = document.getElementById("labelPaths");
  const labelsG = document.getElementById("labels");
  const spiralPath = document.getElementById("spiral");
  const spiralUnder = document.getElementById("spiralUnder");
  const stopDot = document.getElementById("stopDot");

  const cx = 440;
  const cy = 440;
  const sectorDeg = 45;
  const startDeg = -112.5;

  const minRadius = 108;
  const rankStep = 36;
  const maxRadius = minRadius + 7 * rankStep;

  const radialGrowthPerTurn = 33;
  const b = radialGrowthPerTurn / (2 * Math.PI);

  const animationDurationMs = 10000;

  let inputScores = readScoresFromUrl() || [...DEFAULT_INPUT_SCORES];
  let spiralPoints = [];
  let animationFrame = null;

  function fullName(qc){
    return `${qc.adjective} ${qc.noun}`;
  }

  function inputScoresToMap(scores){
    const map = {};
    INPUT_QCS.forEach((qc,i) => {
      map[qc.key] = scores[i];
    });
    return map;
  }

  function diagramScoresFromInput(scores){
    const map = inputScoresToMap(scores);
    return DIAGRAM_QCS.map(qc => map[qc.key]);
  }

  function readScoresFromUrl(){
    const params = new URLSearchParams(window.location.search);
    const scoreParam = params.get("scores");
    if (!scoreParam) return null;

    const parsed = scoreParam.split(",").map(v => Number(v.trim()));

    if (
      parsed.length === 8 &&
      parsed.every(v => Number.isFinite(v) && v >= 0 && v <= 100)
    ){
      return parsed;
    }

    console.warn(
      "Invalid ?scores= value. Expected 8 numbers from 0–100 in this order:",
      INPUT_QCS.map(fullName).join(", ")
    );
    return null;
  }

  function updateUrlFromScores(){
    if (document.body.classList.contains("viewer")) return;

    const params = new URLSearchParams(window.location.search);
    params.set("scores", inputScores.join(","));
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", newUrl);
  }

  function hexToRgb(hex){
    const h = hex.replace("#","");
    return {
      r: parseInt(h.slice(0,2),16),
      g: parseInt(h.slice(2,4),16),
      b: parseInt(h.slice(4,6),16)
    };
  }

  function mixWithWhite(hex, amount){
    const {r,g,b} = hexToRgb(hex);
    const mix = c => Math.round(c + (255-c)*amount);
    return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
  }

  function makeGradient(i, base){
    if (document.getElementById(`wedgeGrad${i}`)) return;

    const grad = document.createElementNS("http://www.w3.org/2000/svg","radialGradient");
    grad.setAttribute("id",`wedgeGrad${i}`);
    grad.setAttribute("cx","46%");
    grad.setAttribute("cy","44%");
    grad.setAttribute("r","72%");

    const s1 = document.createElementNS("http://www.w3.org/2000/svg","stop");
    s1.setAttribute("offset","0%");
    s1.setAttribute("stop-color",mixWithWhite(base,.18));

    const s2 = document.createElementNS("http://www.w3.org/2000/svg","stop");
    s2.setAttribute("offset","58%");
    s2.setAttribute("stop-color",base);

    const s3 = document.createElementNS("http://www.w3.org/2000/svg","stop");
    s3.setAttribute("offset","100%");
    s3.setAttribute("stop-color",mixWithWhite(base,.04));

    grad.appendChild(s1);
    grad.appendChild(s2);
    grad.appendChild(s3);
    svgDefs.appendChild(grad);
  }

  fills.forEach((c,i) => makeGradient(i,c));

  function polar(r, deg){
    const a = deg * Math.PI / 180;
    return [cx + r*Math.cos(a), cy + r*Math.sin(a)];
  }

  function pointPolar(r, theta){
    return [cx + r*Math.cos(theta), cy + r*Math.sin(theta)];
  }

  function sectorPath(r, a0, a1){
    const p1 = polar(r,a0);
    const p2 = polar(r,a1);
    return [
      `M ${cx} ${cy}`,
      `L ${p1[0]} ${p1[1]}`,
      `A ${r} ${r} 0 0 1 ${p2[0]} ${p2[1]}`,
      "Z"
    ].join(" ");
  }

  function ranksFromScores(values){
    const order = values
      .map((v,i) => ({v,i}))
      .sort((a,b) => a.v === b.v ? a.i-b.i : a.v-b.v);

    const ranks = Array(values.length);
    order.forEach((item,idx) => ranks[item.i] = idx+1);
    return ranks;
  }

  function rankToRadius(rank){
    return minRadius + (rank-1)*rankStep;
  }

  function normalizedDegFromTheta(theta){
    let deg = theta * 180 / Math.PI;
    return ((deg - startDeg) % 360 + 360) % 360;
  }

  function sectorIndexForAngle(theta){
    return Math.floor(normalizedDegFromTheta(theta) / sectorDeg) % 8;
  }

  function boundaryCrossingTheta(thetaA, thetaB, oldSector){
    let lo = thetaA;
    let hi = thetaB;

    for(let i=0;i<30;i++){
      const mid = (lo+hi)/2;
      if(sectorIndexForAngle(mid) === oldSector){
        lo = mid;
      } else {
        hi = mid;
      }
    }

    return (lo+hi)/2;
  }

  function arcPath(r, start, end, reverse=false){
    let a0 = start;
    let a1 = end;

    if(reverse) [a0,a1] = [a1,a0];

    const p0 = polar(r,a0);
    const p1 = polar(r,a1);
    const sweep = reverse ? 0 : 1;

    return `M ${p0[0]} ${p0[1]} A ${r} ${r} 0 0 ${sweep} ${p1[0]} ${p1[1]}`;
  }

  function isBottomHalf(midDeg){
    const d = ((midDeg % 360)+360)%360;
    return d > 0 && d < 180;
  }

  function draw(){
    wedgesG.innerHTML = "";
    labelPathsG.innerHTML = "";
    labelsG.innerHTML = "";

    const scores = diagramScoresFromInput(inputScores);
    const ranks = ranksFromScores(scores);

    const minVal = Math.min(...scores);
    const maxVal = Math.max(...scores);
    const minIdx = scores.indexOf(minVal);
    const maxIdx = scores.indexOf(maxVal);

    scores.forEach((score,i) => {
      const radius = rankToRadius(ranks[i]);
      const a0 = startDeg + i*sectorDeg;
      const a1 = a0 + sectorDeg;
      const mid = a0 + sectorDeg/2;

      const wedge = document.createElementNS("http://www.w3.org/2000/svg","path");
      wedge.setAttribute("d",sectorPath(radius,a0,a1));
      wedge.setAttribute("fill",`url(#wedgeGrad${i})`);
      wedge.setAttribute(
        "class",
        `wedge${i===minIdx ? " min" : ""}${i===maxIdx ? " max" : ""}`
      );
      wedgesG.appendChild(wedge);

      const bottom = isBottomHalf(mid);
      const reverse = bottom;
      
      /*
        Treat each adjective+noun pair as one visual label block.
      
        The normal labels occupy two curved text lines around the same
        imaginary outer ring.
      
        When the lower three labels are reversed to keep them readable,
        the whole two-line block is shifted outward by one line. This
        prevents the adjective from falling inward toward the diagram.
      */
      
      const labelInnerR = maxRadius + 26;
      const labelLineGap = 34;
      const labelOuterR = labelInnerR + labelLineGap;
      
      let adjR;
      let nounR;
      
      if (bottom) {
        // Shift the entire reversed block outward by one line.
        adjR = labelOuterR;
        nounR = labelOuterR + labelLineGap;
      } else {
        adjR = labelOuterR;
        nounR = labelInnerR;
      }

      const arcStart = a0 + 3.5;
      const arcEnd = a1 - 3.5;

      const adjArc = document.createElementNS("http://www.w3.org/2000/svg","path");
      const nounArc = document.createElementNS("http://www.w3.org/2000/svg","path");
      const adjId = `adjArc${i}`;
      const nounId = `nounArc${i}`;

      adjArc.setAttribute("id",adjId);
      nounArc.setAttribute("id",nounId);
      adjArc.setAttribute("d",arcPath(adjR,arcStart,arcEnd,reverse));
      nounArc.setAttribute("d",arcPath(nounR,arcStart,arcEnd,reverse));
      adjArc.setAttribute("fill","none");
      adjArc.setAttribute("stroke","none");
      nounArc.setAttribute("fill","none");
      nounArc.setAttribute("stroke","none");

      labelPathsG.appendChild(adjArc);
      labelPathsG.appendChild(nounArc);

      const adjText = document.createElementNS("http://www.w3.org/2000/svg","text");
      adjText.setAttribute("class","arc-label-adj");

      const adjTP = document.createElementNS("http://www.w3.org/2000/svg","textPath");
      adjTP.setAttribute("href",`#${adjId}`);
      adjTP.setAttribute("startOffset","50%");
      adjTP.setAttribute("text-anchor","middle");
      adjTP.textContent = DIAGRAM_QCS[i].adjective;
      adjText.appendChild(adjTP);

      const nounText = document.createElementNS("http://www.w3.org/2000/svg","text");
      nounText.setAttribute("class","arc-label-noun");

      const nounTP = document.createElementNS("http://www.w3.org/2000/svg","textPath");
      nounTP.setAttribute("href",`#${nounId}`);
      nounTP.setAttribute("startOffset","50%");
      nounTP.setAttribute("text-anchor","middle");
      nounTP.textContent = DIAGRAM_QCS[i].noun;
      nounText.appendChild(nounTP);

      labelsG.appendChild(adjText);
      labelsG.appendChild(nounText);
    });

    const minText = document.getElementById("minText");
    const maxText = document.getElementById("maxText");

    if(minText){
      minText.textContent = `${fullName(DIAGRAM_QCS[minIdx])} — ${minVal}`;
    }

    if(maxText){
      maxText.textContent = `${fullName(DIAGRAM_QCS[maxIdx])} — ${maxVal}`;
    }

    return {ranks,minIdx};
  }

  function buildSpiralPoints(ranks, minIdx){
    const theta0 = -Math.PI/2;
    const thetaMax = theta0 + Math.PI*60;
    const step = 0.0045;

    const pts = [[cx,cy]];
    const minBoundary = rankToRadius(ranks[minIdx]);

    let prevTheta = theta0;
    let prevSector = sectorIndexForAngle(prevTheta);

    for(let theta=theta0+step; theta<=thetaMax; theta+=step){
      const currentSector = sectorIndexForAngle(theta);

      if(currentSector !== prevSector){
        const crossingTheta = boundaryCrossingTheta(
          prevTheta,
          theta,
          prevSector
        );

        const crossingR = b*(crossingTheta-theta0);

        if(currentSector === minIdx && crossingR > minBoundary){
          pts.push(pointPolar(crossingR,crossingTheta));
          return pts;
        }
      }

      const r = b*(theta-theta0);
      pts.push(pointPolar(r,theta));

      prevTheta = theta;
      prevSector = currentSector;
    }

    return pts;
  }

  function pointsToPath(points, count=points.length){
    const n = Math.max(1,Math.min(count,points.length));
    let d = `M ${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)}`;

    for(let i=1;i<n;i++){
      d += ` L ${points[i][0].toFixed(2)} ${points[i][1].toFixed(2)}`;
    }

    return d;
  }

  function setFullSpiral(){
    const fullD = pointsToPath(spiralPoints);

    spiralPath.setAttribute("d",fullD);
    spiralUnder.setAttribute("d",fullD);

    const end = spiralPoints[spiralPoints.length-1];

    stopDot.setAttribute("cx",end[0]);
    stopDot.setAttribute("cy",end[1]);
    stopDot.style.opacity = 1;
  }

  function animateSpiral(){
    if(animationFrame){
      cancelAnimationFrame(animationFrame);
    }

    stopDot.setAttribute("cx",cx);
    stopDot.setAttribute("cy",cy);
    stopDot.style.opacity = .95;

    spiralPath.setAttribute("d",`M ${cx} ${cy}`);
    spiralUnder.setAttribute("d",`M ${cx} ${cy}`);

    const startTime = performance.now();

    function frame(now){
      const t = Math.min(1,(now-startTime)/animationDurationMs);
      const progress = 1 - Math.pow(1-t,3.2);
      const count = Math.max(
        2,
        Math.floor(progress*(spiralPoints.length-1))+1
      );

      const partialD = pointsToPath(spiralPoints,count);

      spiralPath.setAttribute("d",partialD);
      spiralUnder.setAttribute("d",partialD);

      const tip = spiralPoints[count-1];

      stopDot.setAttribute("cx",tip[0]);
      stopDot.setAttribute("cy",tip[1]);
      stopDot.style.opacity = t < 1 ? .95 : 1;

      if(t < 1){
        animationFrame = requestAnimationFrame(frame);
      } else {
        animationFrame = null;
      }
    }

    animationFrame = requestAnimationFrame(frame);
  }

  function render(animate=true){
    const {ranks,minIdx} = draw();
    spiralPoints = buildSpiralPoints(ranks,minIdx);

    if(animate){
      animateSpiral();
    } else {
      setFullSpiral();
    }
  }

  function buildControls(){
    const sliders = document.getElementById("sliders");
    if(!sliders) return;

    sliders.innerHTML = "";

    INPUT_QCS.forEach((qc,i) => {
      const row = document.createElement("div");
      row.className = "row";

      row.innerHTML = `
        <label>
          <span>${fullName(qc)}</span>
          <strong id="value${i}">${inputScores[i]}</strong>
        </label>
        <input
          aria-label="${fullName(qc)}"
          type="range"
          min="0"
          max="100"
          value="${inputScores[i]}"
        >
      `;

      const input = row.querySelector("input");

      input.addEventListener("input",e => {
        inputScores[i] = Number(e.target.value);
        document.getElementById(`value${i}`).textContent = inputScores[i];
        updateUrlFromScores();
        render(false);
      });

      input.addEventListener("change",() => render(true));

      sliders.appendChild(row);
    });
  }

  function syncControls(){
    const inputs = document.querySelectorAll("#sliders input");

    inputs.forEach((input,i) => {
      input.value = inputScores[i];

      const value = document.getElementById(`value${i}`);
      if(value) value.textContent = inputScores[i];
    });

    updateUrlFromScores();
  }

  function setScores(newScores){
    inputScores = [...newScores];
    syncControls();
    render(true);
  }

  const animateBtn = document.getElementById("animateBtn");
  if(animateBtn){
    animateBtn.addEventListener("click",animateSpiral);
  }

  const randomBtn = document.getElementById("randomBtn");
  if(randomBtn){
    randomBtn.addEventListener("click",() => {
      setScores(inputScores.map(() => Math.round(35+Math.random()*55)));
    });
  }

  const closeBtn = document.getElementById("closeBtn");
  if(closeBtn){
    closeBtn.addEventListener("click",() => {
      // INPUT order: EL, GBM, PS, ES, IWS, HSG, NOE, LR
      setScores([50,51,52,53,54,55,56,57]);
    });
  }

  const balancedBtn = document.getElementById("balancedBtn");
  if(balancedBtn){
    balancedBtn.addEventListener("click",() => {
      // INPUT order: EL, GBM, PS, ES, IWS, HSG, NOE, LR
      setScores([69,68,67,72,73,74,70,71]);
    });
  }

  buildControls();
  syncControls();
  render(true);
})();

