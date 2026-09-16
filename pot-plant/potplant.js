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

  const params =
    new URLSearchParams(window.location.search);
  
  const requestedLanguage =
    params.get("lang") || "en";
  
  const LANGUAGE_CODE =
    window.NCD_POT_PLANT_LANGUAGES?.[requestedLanguage]
      ? requestedLanguage
      : "en";
  
  const language =
    window.NCD_POT_PLANT_LANGUAGES?.[LANGUAGE_CODE];
  
  if (!language) {
    console.error(
      `NCD Pot Plant language "${LANGUAGE_CODE}" could not be loaded.`
    );
    return;
  }
  
  /*
    The keys below are structural, not translated.
  
    INPUT ORDER
    Used by sliders and ?scores=
  */
  const INPUT_QC_KEYS = [
    "EL",
    "GBM",
    "PS",
    "ES",
    "IWS",
    "HSG",
    "NOE",
    "LR"
  ];
  
  /*
    DIAGRAM ORDER
    Fixed clockwise from top centre.
  */
  const DIAGRAM_QC_KEYS = [
    "LR",
    "EL",
    "ES",
    "GBM",
    "NOE",
    "IWS",
    "PS",
    "HSG"
  ];
  
  const INPUT_QCS =
    INPUT_QC_KEYS.map(key => ({
      key,
      ...language.qcs[key]
    }));
  
  const DIAGRAM_QCS =
    DIAGRAM_QC_KEYS.map(key => ({
      key,
      ...language.qcs[key]
    }));

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
    return qc.name;
  }

  function applyInterfaceLanguage(){
    document
      .querySelectorAll("[data-i18n]")
      .forEach(element => {
  
        const key =
          element.getAttribute("data-i18n");
  
        const value =
          language.interface[key];
  
        if(value !== undefined){
          element.textContent = value;
        }
  
      });
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

/* =========================================================
   QUALITY CHARACTERISTIC CARD
   ========================================================= */

const qcCard =
  document.getElementById("qcCard");

const qcCardName =
  document.getElementById("qcCardName");

const qcCardQuestion =
  document.getElementById("qcCardQuestion");

const qcCardDescription =
  document.getElementById("qcCardDescription");

const qcCardClose =
  document.getElementById("qcCardClose");


function openQcCard(index){

  if(!qcCard) return;

  const qc = DIAGRAM_QCS[index];

  if(qcCardName){
    qcCardName.textContent =
      fullName(qc);
  }

  if(qcCardQuestion){
    qcCardQuestion.textContent =
      qc.heartQuestion;
  }

  if(qcCardDescription){
    qcCardDescription.textContent =
      qc.description;
  }

  qcCard.classList.add("is-open");

  qcCard.setAttribute(
    "aria-hidden",
    "false"
  );
}


function closeQcCard(){

  if(!qcCard) return;

  qcCard.classList.remove("is-open");

  qcCard.setAttribute(
    "aria-hidden",
    "true"
  );
}


if(qcCardClose){

  qcCardClose.addEventListener(
    "click",
    event => {

      event.stopPropagation();

      closeQcCard();
    }
  );

}


/*
  Clicking somewhere else in the component
  gently dismisses the card.
*/

document.addEventListener(
  "click",
  event => {

    if(
      qcCard &&
      qcCard.classList.contains("is-open") &&
      !qcCard.contains(event.target)
    ){
      closeQcCard();
    }

  }
);


/*
  Escape also closes it.
*/

document.addEventListener(
  "keydown",
  event => {

    if(event.key === "Escape"){
      closeQcCard();
    }

  }
);
  
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
      wedge.setAttribute("data-qc-index",i);
      wedge.setAttribute("tabindex","0");
      wedge.setAttribute("role","button");
      wedge.setAttribute(
        "aria-label",
        `${fullName(DIAGRAM_QCS[i])}: ${DIAGRAM_QCS[i].heartQuestion}`
      );
      
      wedge.addEventListener("click",event => {
        event.stopPropagation();
        openQcCard(i);
      });
      
      wedge.addEventListener("keydown",event => {
      
        if(event.key === "Enter" || event.key === " "){
          event.preventDefault();
          openQcCard(i);
        }
      
      });
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
      
      let line1R;
      let line2R;
      
      if (bottom) {
        /*
          The lower labels read in reverse around the circle.
      
          Shift the whole two-line block outward by one line,
          preserving the visual arrangement we established
          for the English diagram.
        */
        line1R = labelOuterR;
        line2R = labelOuterR + labelLineGap;
      } else {
        line1R = labelOuterR;
        line2R = labelInnerR;
      }

      const arcStart = a0 + 3.5;
      const arcEnd = a1 - 3.5;
      
      const qc = DIAGRAM_QCS[i];
      
      const line1Arc =
        document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path"
        );
      
      const line2Arc =
        document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path"
        );
      
      const line1Id = `line1Arc${i}`;
      const line2Id = `line2Arc${i}`;
      
      line1Arc.setAttribute("id", line1Id);
      line2Arc.setAttribute("id", line2Id);
      
      line1Arc.setAttribute(
        "d",
        arcPath(line1R, arcStart, arcEnd, reverse)
      );
      
      line2Arc.setAttribute(
        "d",
        arcPath(line2R, arcStart, arcEnd, reverse)
      );
      
      line1Arc.setAttribute("fill", "none");
      line1Arc.setAttribute("stroke", "none");
      
      line2Arc.setAttribute("fill", "none");
      line2Arc.setAttribute("stroke", "none");
      
      labelPathsG.appendChild(line1Arc);
      labelPathsG.appendChild(line2Arc);
      
      
      /*
        Create one curved label line.
      
        The translation file determines:
        - the text
        - whether this line carries emphasis
      
        The diagram determines:
        - which concentric circle the line occupies
      */
      function addLabelLine(line, arcId){
      
        const text =
          document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text"
          );
      
        text.setAttribute(
          "class",
          `${
            line.emphasis
              ? "arc-label-adj"
              : "arc-label-noun"
          } qc-clickable`
        );
      
        text.setAttribute("data-qc-index", i);
        text.setAttribute("tabindex", "0");
        text.setAttribute("role", "button");
      
        text.addEventListener("click", event => {
          event.stopPropagation();
          openQcCard(i);
        });
      
        text.addEventListener("keydown", event => {
      
          if(
            event.key === "Enter" ||
            event.key === " "
          ){
            event.preventDefault();
            openQcCard(i);
          }
      
        });
      
        const textPath =
          document.createElementNS(
            "http://www.w3.org/2000/svg",
            "textPath"
          );
      
        textPath.setAttribute(
          "href",
          `#${arcId}`
        );
      
        textPath.setAttribute(
          "startOffset",
          "50%"
        );
      
        textPath.setAttribute(
          "text-anchor",
          "middle"
        );
      
        textPath.textContent = line.text;
      
        text.appendChild(textPath);
      
        labelsG.appendChild(text);
      }
      
      
      addLabelLine(qc.lines[0], line1Id);
      addLabelLine(qc.lines[1], line2Id);
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

  const languageSelect =
    document.getElementById("languageSelect");
  
  if(languageSelect){
  
    languageSelect.value = LANGUAGE_CODE;
  
    languageSelect.addEventListener("change", event => {
  
      const newLanguage =
        event.target.value;
  
      const newParams =
        new URLSearchParams(window.location.search);
  
      newParams.set("lang", newLanguage);
  
      window.location.search =
        newParams.toString();
    });
  }
  
  applyInterfaceLanguage();
  buildControls();
  syncControls();
  
  const isViewer = document.body.classList.contains("viewer");
  const growBtn = document.getElementById("growBtn");
  
  if(isViewer){
  
    /*
      CLEAN VIEW INITIAL STATE
  
      Show:
        - Quality Characteristic labels
        - Watch it grow button
  
      Hide:
        - wedges
        - spiral
  
      The wedges themselves are drawn immediately, but CSS keeps
      them invisible until the user begins the experience.
    */
  
    const {ranks,minIdx} = draw();
  
    spiralPoints = buildSpiralPoints(ranks,minIdx);
  
    spiralPath.setAttribute("d",`M ${cx} ${cy}`);
    spiralUnder.setAttribute("d",`M ${cx} ${cy}`);
  
    stopDot.setAttribute("cx",cx);
    stopDot.setAttribute("cy",cy);
    stopDot.style.opacity = 0;
  
  
    if(growBtn){
  
      growBtn.addEventListener("click",() => {
  
        /* Reset any previous finished state */
        document.body.classList.remove("settled");
        document.body.classList.remove("growing");
  
        /*
          On the FIRST viewing, reveal the wedges before growth begins.
  
          On replay, the wedges remain visible because they have
          already become part of the understood picture.
        */
  
        const firstRun =
          !document.body.classList.contains("has-grown");
  
  
        growBtn.classList.add("is-running");
  
  
        if(firstRun){
  
          /*
            PHASE 1
            Reveal the health profile.
          */
  
          document.body.classList.add("revealing");
  
  
          /*
            PHASE 2
            After the wedges have materialised, allow a small pause
            so the viewer can register the shape before growth begins.
          */
  
          window.setTimeout(() => {
  
            document.body.classList.remove("revealing");
            document.body.classList.add("growing");
  
            animateSpiral();
  
          }, 1000);
  
        } else {
  
          /*
            REPLAY
  
            The viewer already understands the wedges, so replay only
            the all-by-itself growth.
          */
  
          document.body.classList.add("growing");
  
          animateSpiral();
        }
  
  
        /*
          Work out when the spiral itself will finish.
  
          First viewing has the additional 1-second wedge reveal.
        */
  
        const preGrowthDelay = firstRun ? 1000 : 0;
  
  
        window.setTimeout(() => {
  
          /*
            Let the completed gold spiral sit briefly before settling
            into the quieter olive tone.
          */
  
          window.setTimeout(() => {
  
            document.body.classList.remove("growing");
            document.body.classList.add("settled");
            document.body.classList.add("has-grown");
  
          }, 500);
  
  
          /*
            Return the control as "Watch again".
          */
  
          window.setTimeout(() => {
  
            const icon =
              growBtn.querySelector(".grow-icon");
  
            const label =
              growBtn.querySelector(".grow-label");
  
            if(icon){
              icon.textContent = "🌱";
            }
  
            if(label){
              label.textContent = language.interface.watchAgain;
            }
  
            growBtn.classList.add("is-replay");
            growBtn.classList.remove("is-running");
  
          }, 900);
  
        }, preGrowthDelay + animationDurationMs);
  
      });
  
    }
  
  } else {
  
    /*
      PLAYGROUND
  
      Keep the existing behaviour:
      render immediately and automatically animate.
    */
  
    render(true);
  }
})();

