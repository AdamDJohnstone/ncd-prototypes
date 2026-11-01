/* Preserve the pot-plant URL order independently of the visual clockwise order.
   Heart questions/descriptions remain in this model, never in the overview DOM. */
(() => {
  const inputKeys = ['EL', 'GBM', 'PS', 'ES', 'IWS', 'HSG', 'NOE', 'LR'];
  const diagramKeys = ['LR', 'EL', 'ES', 'GBM', 'NOE', 'IWS', 'PS', 'HSG'];
  const sampleScores = [42.4, 48, 47.8, 38.6, 51.6, 44.9, 50.9, 46.5];
  const colours = ['#477B39', '#727145', '#926550', '#9A5C5E', '#786071', '#526082', '#436777', '#44725C'];
  const params = new URLSearchParams(location.search);
  const requested = params.get('lang') || 'en';
  const language = window.NCD_POT_PLANT_LANGUAGES[requested] || window.NCD_POT_PLANT_LANGUAGES.en;
  const raw = params.get('scores');
  const parsed = raw?.split(',').map(value => value.trim() === '' ? NaN : Number(value));
  const inputScores = parsed?.length === 8 && parsed.every(n => Number.isFinite(n) && n >= -50)
    ? parsed : sampleScores;
  const scoreMap = Object.fromEntries(inputKeys.map((key, i) => [key, inputScores[i]]));
  const qualities = diagramKeys.map((key, i) => ({key, ...language.qcs[key], score:scoreMap[key], colour:colours[i]}));
  // This is deliberately the old prototype's ordinal mapping, not score magnitude.
  // Stable sorting also preserves its handling of ties; quantitative mapping is deferred.
  const order = qualities.map((qc, i) => i).sort((a, b) => qualities[a].score - qualities[b].score);
  order.forEach((index, rank) => {qualities[index].radius = 108 + rank * 36;});
  window.NCDChurchSurvey = {inputKeys, diagramKeys, inputScores, qualities, language, minimumIndex:order[0]};
})();
