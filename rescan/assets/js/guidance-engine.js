(function (global) {
  'use strict';

  const OPERATORS = {
    eq: (actual, expected) => actual === expected,
    neq: (actual, expected) => actual !== expected,
    gt: (actual, expected) => actual > expected,
    gte: (actual, expected) => actual >= expected,
    lt: (actual, expected) => actual < expected,
    lte: (actual, expected) => actual <= expected
  };

  const evaluateCondition = (condition, answers) => {
    if (!condition || typeof condition.questionId !== 'string') return false;
    if (!Object.prototype.hasOwnProperty.call(answers, condition.questionId)) return false;
    const operator = OPERATORS[condition.operator];
    if (!operator) return false;
    return operator(Number(answers[condition.questionId]), Number(condition.value));
  };

  const getConditionCount = (card) => {
    const conditions = card && card.conditions ? card.conditions : {};
    return ['all', 'any', 'none'].reduce((count, key) => count + (Array.isArray(conditions[key]) ? conditions[key].length : 0), 0);
  };

  const matchesCard = (card, answers) => {
    if (!card || !card.conditions || !answers) return false;
    const { all = [], any = [], none = [] } = card.conditions;
    if (Array.isArray(all) && all.length && !all.every((condition) => evaluateCondition(condition, answers))) return false;
    if (Array.isArray(any) && any.length && !any.some((condition) => evaluateCondition(condition, answers))) return false;
    if (Array.isArray(none) && none.length && none.some((condition) => evaluateCondition(condition, answers))) return false;
    return true;
  };

  const selectCard = (guidance, calculation, answers) => {
    if (!guidance || !Array.isArray(guidance.cards) || !guidance.cards.length) return null;
    if (!calculation || calculation.blocked || !calculation.categories) return null;

    const categoryEntries = Object.entries(calculation.categories);
    if (!categoryEntries.length) return null;
    const highestPercent = Math.max(...categoryEntries.map(([, value]) => Number(value.percent) || 0));
    const leadingCategories = new Set(categoryEntries
      .filter(([, value]) => (Number(value.percent) || 0) === highestPercent)
      .map(([categoryId]) => categoryId));

    const candidates = guidance.cards
      .filter((card) => leadingCategories.has(card.category) && matchesCard(card, answers))
      .map((card, index) => ({
        card,
        index,
        specificity: getConditionCount(card),
        priority: Number(card.priority) || 0
      }))
      .sort((a, b) => b.specificity - a.specificity || b.priority - a.priority || a.index - b.index);

    if (!candidates.length) return null;
    if (candidates.length > 1
      && candidates[0].specificity === candidates[1].specificity
      && candidates[0].priority === candidates[1].priority) {
      return null;
    }
    return candidates[0].card;
  };

  global.ReScanGuidance = {
    evaluateCondition,
    matchesCard,
    selectCard
  };
}(window));
