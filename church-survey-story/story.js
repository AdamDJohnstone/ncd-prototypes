/* Wholeness v5 interaction architecture: native positions, local progress,
   autonomous life. There is no global timeline or scroll-position transform. */
(() => {
  const {reveal, drawSpiral} = window.NCDChurchDiagram;
  const qualities = document.querySelector('.qualities'), profile = document.querySelector('.profile');
  const life = document.querySelector('.life'), copy = document.querySelector('.scroll-copy');
  const beats = [...document.querySelectorAll('.beat')], wrap = document.getElementById('spiralWrap');
  const clamp = n => Math.max(0, Math.min(1, n));
  let ticking = false, spiralState = 'ready', spiralStart = null, spiralRAF = 0, lastY = scrollY;

  function measureLayout() {
    if (!copy.getClientRects().length) return;
    beats.forEach(el => el.style.setProperty('--text-height', el.firstElementChild.getBoundingClientRect().height + 'px'));
  }
  function holdProgress(el) {
    const child = el.firstElementChild;
    const reading = parseFloat(getComputedStyle(child).top);
    const distance = el.getBoundingClientRect().height - child.getBoundingClientRect().height;
    return clamp((reading - el.getBoundingClientRect().top) / distance);
  }
  function animateSpiral(now) {
    if (spiralState !== 'running') return;
    if (spiralStart === null) spiralStart = now;
    const progress = clamp((now - spiralStart) / 4086);
    drawSpiral(1 - Math.pow(1 - progress, 2));
    if (progress < 1) spiralRAF = requestAnimationFrame(animateSpiral);
    else spiralState = 'done';
  }
  function updateSpiral() {
    const r = life.firstElementChild.getBoundingClientRect();
    const centre = (r.top + r.bottom) / 2;
    const reading = parseFloat(getComputedStyle(profile.firstElementChild).top);
    if (scrollY >= lastY && centre <= reading && spiralState === 'ready') {
      spiralState = 'running';
      spiralStart = null;
      wrap.style.opacity = 1;
      spiralRAF = requestAnimationFrame(animateSpiral);
    }
    if (centre > reading + innerHeight * .12 && spiralState !== 'ready') {
      cancelAnimationFrame(spiralRAF);
      spiralState = 'ready';
      spiralStart = null;
      wrap.style.opacity = 0;
      setTimeout(() => { if (spiralState === 'ready') drawSpiral(0); }, 220);
    }
    lastY = scrollY;
  }
  function update() {
    ticking = false;
    if (!copy.getClientRects().length) return;
    reveal(holdProgress(qualities), holdProgress(profile));
    updateSpiral();
  }
  function requestUpdate() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }
  function layoutChanged() { measureLayout(); requestUpdate(); }
  new ResizeObserver(layoutChanged).observe(copy);
  addEventListener('scroll', requestUpdate, {passive:true});
  addEventListener('resize', layoutChanged);
  document.addEventListener('resultviewchange', layoutChanged);
  document.fonts.ready.then(layoutChanged);
  measureLayout();
  drawSpiral(0);
  wrap.style.opacity = 0;
  update();
})();
