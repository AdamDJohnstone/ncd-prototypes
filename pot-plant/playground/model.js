/* Orders run from weakest to strongest. No survey scores are stored. */
(function (root) {
  const IDS = ['EL', 'GBM', 'PS', 'ES', 'IWS', 'HSG', 'NOE', 'LR'];
  const DEFAULT = ['IWS', 'PS', 'NOE', 'HSG', 'LR', 'GBM', 'EL', 'ES'];
  function validate(order) {
    if (order.length !== 8 || new Set(order).size !== 8 || order.some(k => !IDS.includes(k))) throw new Error('Invalid arrangement');
  }
  function develop(order) {
    validate(order);
    // One adjacent exchange among the other seven, then the old minimum at rank four.
    // Applied to positions only, never implying relationships between specific qualities.
    const [a,b,c,d,...rest] = order;
    return [c,b,d,a,...rest];
  }
  function radius(order, id, after = false) { return 72 + 36 * (order.indexOf(id) + (after ? 1 : 0)); }
  const api = {IDS, DEFAULT, validate, develop, radius};
  if (typeof module !== 'undefined') module.exports = api;
  else root.PlaygroundModel = api;
})(globalThis);
