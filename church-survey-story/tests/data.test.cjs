const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
function model(search = '') {
  const context = vm.createContext({window:{}, location:{search}, URLSearchParams});
  for (const file of ['pot-plant/languages/en.js', 'pot-plant/languages/de.js', 'church-survey-story/data.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
  }
  return JSON.parse(JSON.stringify(context.window.NCDChurchSurvey));
}
test('survey input order is remapped to the established clockwise qualities', () => {
  const data = model('?scores=42.4,48,47.8,38.6,51.6,44.9,50.9,46.5');
  assert.deepEqual(data.qualities.map(q => [q.key, q.score, q.radius]), [
    ['LR',46.5,216], ['EL',42.4,144], ['ES',38.6,108], ['GBM',48,288],
    ['NOE',50.9,324], ['IWS',51.6,360], ['PS',47.8,252], ['HSG',44.9,180]
  ]);
  assert.equal(data.qualities[data.minimumIndex].key, 'ES');
});
test('heart questions and descriptions are available for later encounters', () => {
  const data = model();
  assert.equal(data.qualities.length, 8);
  assert.ok(data.qualities.every(q => q.heartQuestion.endsWith('?') && q.description.length > 70));
  assert.equal(data.qualities.find(q => q.key === 'EL').heartQuestion, 'Do you really believe in me?');
});
test('invalid score arrays fall back as a whole, preserving quality alignment', () => {
  for (const scores of ['1,2', '42.4,48,,38.6,51.6,44.9,50.9,46.5', 'NaN,48,47.8,38.6,51.6,44.9,50.9,46.5']) {
    assert.deepEqual(model('?scores=' + scores).inputScores, model().inputScores);
  }
});
test('changing the minimum changes the corresponding wedge, not the URL order', () => {
  const data = model('?scores=10,20,30,40,50,60,70,80');
  assert.equal(data.qualities[data.minimumIndex].key, 'EL');
  assert.equal(data.qualities.find(q => q.key === 'LR').radius, 360);
});
test('translation line structure is reused and unknown languages fall back to English', () => {
  assert.equal(model('?lang=de').language.code, 'de');
  assert.equal(model('?lang=de').qualities[0].name, 'Liebevolle Beziehungen');
  assert.equal(model('?lang=unknown').language.code, 'en');
});
