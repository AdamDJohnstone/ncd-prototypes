const p = new URLSearchParams(location.search);
const langCode = window.NCD_POT_PLANT_LANGUAGES[p.get('lang')] ? p.get('lang') : 'en';
const lang = structuredClone(window.NCD_POT_PLANT_LANGUAGES[langCode]);
const strings = {...NCD_PLAYGROUND_STRINGS.en, ...NCD_PLAYGROUND_STRINGS[langCode]};
const t = (key, values = {}) => strings[key].replace(/\{(\w+)\}/g, (_, name) => values[name] ?? '');
if (langCode === 'en') lang.qcs.ES.heartQuestion = strings.esQuestion;
document.documentElement.lang = langCode;
document.title = strings.title;
document.querySelectorAll('[data-text]').forEach(el => el.textContent = t(el.dataset.text));
const ORDER = ['LR','EL','ES','GBM','NOE','IWS','PS','HSG'];
const fills = ['#477B39','#727145','#926550','#9A5C5E','#786071','#526082','#436777','#44725C'];
const svg=document.getElementById('viz'), defs=svg.querySelector('defs'), wg=document.getElementById('wedges'), pg=document.getElementById('labelPaths'), lg=document.getElementById('labels'), spiral=document.getElementById('spiral'), under=document.getElementById('spiralUnder'), dot=document.getElementById('stopDot'), oldDot=document.getElementById('oldStopDot');
const qcCard=document.getElementById('qcCard');
let detailTrigger;
function openQcCard(i) {
  detailTrigger = document.activeElement;
  const q=lang.qcs[ORDER[i]];
  document.getElementById('qcCardName').textContent=q.name;
  document.getElementById('qcCardQuestion').textContent=q.heartQuestion;
  document.getElementById('qcCardDescription').textContent=q.description;
  if (!qcCard.open) qcCard.showModal();
}
document.getElementById('qcCardClose').ariaLabel=t('close');
document.getElementById('qcCardClose').onclick=()=>qcCard.close();
qcCard.addEventListener('close',()=>detailTrigger?.focus());
qcCard.addEventListener('click',e=>{if(e.target===qcCard && (e.clientX<qcCard.getBoundingClientRect().left || e.clientX>qcCard.getBoundingClientRect().right || e.clientY<qcCard.getBoundingClientRect().top || e.clientY>qcCard.getBoundingClientRect().bottom))qcCard.close()});
document.getElementById('plantTitle').textContent=t('plant');
document.querySelector('.plant').ariaLabel=t('plant');
