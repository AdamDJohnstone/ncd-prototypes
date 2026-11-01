/* Geometry and typography adapted from pot-plant/potplant.js.
   No interaction handlers, timers, or clickable labels belong in this renderer. */
(() => {
  const {qualities, language, minimumIndex} = window.NCDChurchSurvey;
  const NS = 'http://www.w3.org/2000/svg';
  const cx = 440, cy = 440, startDeg = -112.5, sectorDeg = 45;
  const initialRadius = 60, explanatoryRadius = 108;
  const clamp = n => Math.max(0, Math.min(1, n));
  const ease = n => 1 - Math.pow(1 - clamp(n), 2.4);
  const rad = d => d * Math.PI / 180;
  const polar = (r, theta) => [cx + r * Math.cos(theta), cy + r * Math.sin(theta)];
  const svg = document.getElementById('viz');
  svg.dataset.language = language.code;
  function element(tag, attributes, parent) {
    const el = document.createElementNS(NS, tag);
    Object.entries(attributes).forEach(([key, value]) => el.setAttribute(key, value));
    parent.appendChild(el);
    return el;
  }
  function wedgePath(index, r) {
    const a = startDeg + index * sectorDeg, p = polar(r, rad(a)), q = polar(r, rad(a + sectorDeg));
    return `M ${cx} ${cy} L ${p[0]} ${p[1]} A ${r} ${r} 0 0 1 ${q[0]} ${q[1]} Z`;
  }
  function arcPath(r, a, b, reverse) {
    const p = polar(r, rad(reverse ? b : a)), q = polar(r, rad(reverse ? a : b));
    return `M ${p[0]} ${p[1]} A ${r} ${r} 0 0 ${reverse ? 0 : 1} ${q[0]} ${q[1]}`;
  }
  const defs = svg.querySelector('defs'), wedges = document.getElementById('wedges');
  const labelPaths = document.getElementById('labelPaths'), labelsGroup = document.getElementById('labels');
  const paths = [], labels = [];
  qualities.forEach((qc, i) => {
    const gradient = element('linearGradient', {id:`wedgeGrad${i}`, x1:'0%', y1:'0%', x2:'100%', y2:'100%'}, defs);
    element('stop', {offset:'0%', 'stop-color':qc.colour, 'stop-opacity':'.92'}, gradient);
    element('stop', {offset:'100%', 'stop-color':qc.colour, 'stop-opacity':'.72'}, gradient);
    paths.push(element('path', {d:wedgePath(i, initialRadius), fill:`url(#wedgeGrad${i})`, opacity:'.70', 'data-qc':qc.key}, wedges));
    const a = startDeg + i * sectorDeg, b = a + sectorDeg, mid = ((a + b) / 2 + 360) % 360;
    const bottom = mid > 0 && mid < 180;
    const lines = qc.lines.slice(0, 4), centreIndex = (lines.length - 1) / 2;
    labels[i] = lines.map((line, j) => {
      const offset = (centreIndex - j) * 34 * (language.labelLineSpacing ?? 1);
      const radius = 420 + (bottom ? -offset : offset), id = `labelArc${i}_${j}`;
      element('path', {id, d:arcPath(radius, a + 3.5, b - 3.5, bottom), fill:'none'}, labelPaths);
      const text = element('text', {class:line.emphasis ? 'arc-label-adj' : 'arc-label-noun',
        'font-size':(line.emphasis ? 41.5 : 33.5) * (language.labelScale ?? 1), opacity:0}, labelsGroup);
      element('textPath', {href:`#${id}`, startOffset:'50%', 'text-anchor':'middle'}, text).textContent = line.text;
      return text;
    });
  });
  function reveal(qualitiesProgress, profileProgress) {
    // Equal radial travel: shorter wedges finish before longer ones, as in Wholeness.
    const travel = ease(profileProgress) * (360 - explanatoryRadius);
    paths.forEach((path, i) => {
      const progress = clamp(qualitiesProgress * 8 - i);
      const explanatory = initialRadius + (explanatoryRadius - initialRadius) * ease(progress);
      const radius = profileProgress > 0
        ? explanatoryRadius + Math.min(travel, qualities[i].radius - explanatoryRadius) : explanatory;
      path.setAttribute('d', wedgePath(i, radius));
      path.dataset.radius = radius;
      labels[i].forEach(label => label.setAttribute('opacity', clamp((progress - .55) / .45)));
    });
  }
  function sectorIndex(theta) {
    let deg = theta * 180 / Math.PI;
    while (deg < startDeg) deg += 360;
    while (deg >= startDeg + 360) deg -= 360;
    return Math.floor((deg - startDeg) / sectorDeg);
  }
  function boundaryCrossingTheta(previousTheta, theta, previousSector) {
    let boundary = rad(startDeg + (previousSector + 1) * sectorDeg);
    while (boundary <= previousTheta) boundary += 2 * Math.PI;
    while (boundary > theta) boundary -= 2 * Math.PI;
    return boundary;
  }
  // Preserve the pot-plant stopping rule: first entry into the minimum sector
  // beyond its radius. This is the sector edge, not a newly invented radial cutoff.
  function buildSpiralPoints() {
    const theta0 = -Math.PI / 2, step = .0045, b = 33 / (2 * Math.PI);
    const points = [[cx, cy]], minimumBoundary = qualities[minimumIndex].radius;
    let previousTheta = theta0, previousSector = sectorIndex(theta0);
    for (let theta = theta0 + step; theta <= theta0 + Math.PI * 60; theta += step) {
      const sector = sectorIndex(theta);
      if (sector !== previousSector) {
        const crossing = boundaryCrossingTheta(previousTheta, theta, previousSector);
        const r = b * (crossing - theta0);
        if (sector === minimumIndex && r > minimumBoundary) {
          points.push(polar(r, crossing));
          return points;
        }
      }
      points.push(polar(b * (theta - theta0), theta));
      previousTheta = theta;
      previousSector = sector;
    }
    return points;
  }
  const points = buildSpiralPoints();
  const spiral = document.getElementById('spiral'), under = document.getElementById('spiralUnder'), dot = document.getElementById('stop');
  function drawSpiral(progress) {
    const count = Math.max(1, Math.floor(clamp(progress) * (points.length - 1)) + 1);
    const d = points.slice(0, count).map((p, i) => `${i ? 'L' : 'M'} ${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' ');
    spiral.setAttribute('d', d);
    under.setAttribute('d', d);
    const tip = points[count - 1];
    dot.setAttribute('cx', tip[0]);
    dot.setAttribute('cy', tip[1]);
    dot.setAttribute('opacity', progress > 0 ? 1 : 0);
  }
  window.NCDChurchDiagram = {reveal, drawSpiral};
})();
