/* Independent copy of the Wholeness focused-context shell. */
(() => {
  const env = document.querySelector('.result-environment');
  const app = document.querySelector('.mock-app');
  const story = document.querySelector('.results-layer'), shell = document.querySelector('.results-shell');
  const strip = document.querySelector('.result-strip'), toggle = document.querySelector('.result-strip-toggle');
  const nav = [...document.querySelectorAll('[data-section]')];
  const title = document.querySelector('.results-section-title'), copy = document.querySelector('.results-section-copy');
  const cards = document.querySelector('.explore-cards');
  const readings = [...document.querySelectorAll('[data-reading]')];
  const readingRoutes = readings.map(article => article.dataset.reading);
  const names = {home:'Church Survey', why:'Why it matters', reveals:'What it reveals', difference:'Make a difference', collaborate:'Collaborate', 'voice-of-our-people':'The Voice of Our People', 'how-we-look-from-the-outside':'How We Look from the Outside', 'for-those-who-carry-responsibility':'For Those Who Carry Responsibility', 'the-story-in-the-data':'The Story in the Data', 'scripture-reflection':'Scripture Reflection', 'three-ways-to-add-life':'Three Ways to Add Life', 'disciple-reality-check':'Disciple Reality Check'};
  const prompts = {why:'Why does this matter?', reveals:'What is it revealing?', difference:'How can I make a difference?'};
  const cardTitles = {
    why: ['🗣️ The Voice of Our People', '👁️ How We Look from the Outside', '🙌 For Those Who Carry Responsibility'],
    reveals: ['📊 The Story in the Data', '📖 Scripture Reflection'],
    difference: ['🌱 Three Ways to Add Life', '🔍 Disciple Reality Check', '🌳 Take the Wholeness Test']
  };
  function setStripHeight() {
    if (strip.getClientRects().length) document.documentElement.style.setProperty('--result-strip-height', strip.getBoundingClientRect().height + 'px');
  }
  function choose(section) {
    const key = names[section] ? section : 'home';
    const isReading = readingRoutes.includes(key);
    const navKey = ['three-ways-to-add-life', 'disciple-reality-check'].includes(key) ? 'difference' : ['the-story-in-the-data', 'scripture-reflection'].includes(key) ? 'reveals' : isReading ? 'why' : key;
    document.body.dataset.view = key;
    document.title = `${names[key]} — Church Survey`;
    readings.forEach(article => { article.hidden = article.dataset.reading !== key; });
    document.body.dataset.readingPage = String(isReading);
    copy.hidden = isReading;
    cards.hidden = isReading;
    nav.forEach(button => button.setAttribute('aria-current', button.dataset.section === navKey ? 'page' : 'false'));
    story.hidden = key !== 'home';
    shell.hidden = key === 'home';
    title.textContent = names[key];
    copy.textContent = prompts[key] || '';
    cards.innerHTML = (cardTitles[key] || []).map((heading, index) => {
      const route = key === 'why' ? readingRoutes[index] : key === 'reveals' ? ['the-story-in-the-data', 'scripture-reflection'][index] : key === 'difference' ? ['three-ways-to-add-life', 'disciple-reality-check'][index] : null;
      const linked = Boolean(route);
      const tag = linked ? 'a' : 'button';
      return `<${tag} class="explore-card"${linked ? ` href="#${route}"` : ''}><span class="explore-card-title">${heading}</span><span class="explore-card-subtitle">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</span></${tag}>`;
    }).join('');
    strip.classList.remove('expanded');
    toggle.setAttribute('aria-expanded', 'false');
    setStripHeight();
    scrollTo(0, 0);
    document.dispatchEvent(new Event('resultviewchange'));
  }
  function navigate(section) {
    if (location.hash === '#' + section) choose(section);
    else location.hash = section;
  }
  addEventListener('hashchange', () => choose(location.hash.slice(1)));
  function leave() {
    env.classList.add('closed');
    app.inert = false;
    app.setAttribute('aria-hidden', 'false');
    scrollTo(0, 0);
    document.querySelector('.mock-result-open').focus({preventScroll:true});
  }
  nav.forEach(button => button.onclick = () => navigate(button.dataset.section));
  toggle.onclick = () => toggle.setAttribute('aria-expanded', String(strip.classList.toggle('expanded')));
  document.querySelectorAll('[data-destination]').forEach(button => button.onclick = () => navigate(button.dataset.destination));
  document.querySelector('.result-close').onclick = leave;
  document.querySelector('.mock-result-open').onclick = () => {
    app.inert = true;
    app.setAttribute('aria-hidden', 'true');
    env.classList.remove('closed');
    navigate('home');
    document.querySelector('.result-close').focus({preventScroll:true});
  };
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !env.classList.contains('closed')) leave(); });
  addEventListener('resize', setStripHeight);
  new ResizeObserver(setStripHeight).observe(strip);
  choose(location.hash.slice(1));
})();
