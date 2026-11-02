/* Independent copy of the Wholeness focused-context shell. */
(() => {
  const env = document.querySelector('.result-environment');
  const app = document.querySelector('.mock-app');
  const story = document.querySelector('.results-layer'), shell = document.querySelector('.results-shell');
  const strip = document.querySelector('.result-strip'), toggle = document.querySelector('.result-strip-toggle');
  const nav = [...document.querySelectorAll('[data-section]')];
  const title = document.querySelector('.results-section-title'), copy = document.querySelector('.results-section-copy');
  const cards = document.querySelector('.explore-cards');
  const names = {home:'Church Survey', why:'Why it matters', reveals:'What it reveals', difference:'Make a difference', collaborate:'Collaborate'};
  const prompts = {why:'Why does this matter?', reveals:'What is it revealing?', difference:'How can I make a difference?'};
  const cardTitles = {
    why: ['🗣️ The Voice of Our People', '👁️ How We Look from the Outside', '🙌 For Those Who Carry Responsibility'],
    reveals: ['📊 The Story in the Data', '📖 Scripture Reflection'],
    difference: ['Lorem ipsum 1', 'Lorem ipsum 2', 'Lorem ipsum 3']
  };
  function setStripHeight() {
    if (strip.getClientRects().length) document.documentElement.style.setProperty('--result-strip-height', strip.getBoundingClientRect().height + 'px');
  }
  function choose(section) {
    const key = names[section] ? section : 'home';
    document.body.dataset.view = key;
    nav.forEach(button => button.setAttribute('aria-current', button.dataset.section === key ? 'page' : 'false'));
    story.hidden = key !== 'home';
    shell.hidden = key === 'home';
    title.textContent = names[key];
    copy.textContent = prompts[key] || '';
    cards.innerHTML = (cardTitles[key] || []).map(heading => `<button class="explore-card"><span class="explore-card-title">${heading}</span><span class="explore-card-subtitle">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</span></button>`).join('');
    strip.classList.remove('expanded');
    toggle.setAttribute('aria-expanded', 'false');
    setStripHeight();
    scrollTo(0, 0);
    document.dispatchEvent(new Event('resultviewchange'));
  }
  function leave() {
    env.classList.add('closed');
    app.inert = false;
    app.setAttribute('aria-hidden', 'false');
    scrollTo(0, 0);
    document.querySelector('.mock-result-open').focus({preventScroll:true});
  }
  nav.forEach(button => button.onclick = () => choose(button.dataset.section));
  toggle.onclick = () => toggle.setAttribute('aria-expanded', String(strip.classList.toggle('expanded')));
  document.querySelectorAll('[data-destination]').forEach(button => button.onclick = () => choose(button.dataset.destination));
  document.querySelector('.result-close').onclick = leave;
  document.querySelector('.mock-result-open').onclick = () => {
    app.inert = true;
    app.setAttribute('aria-hidden', 'true');
    env.classList.remove('closed');
    choose('home');
    document.querySelector('.result-close').focus({preventScroll:true});
  };
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !env.classList.contains('closed')) leave(); });
  addEventListener('resize', setStripHeight);
  new ResizeObserver(setStripHeight).observe(strip);
  choose('home');
})();
