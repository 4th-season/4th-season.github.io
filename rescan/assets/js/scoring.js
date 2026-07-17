(function (global) {
  'use strict';

  const MODES = new Set(['scored', 'pattern', 'reflection', 'help']);

  const asNumber = (value) => {
    const number = Number(value);
    if (!Number.isFinite(number)) throw new Error('응답값은 숫자여야 합니다.');
    return number;
  };

  const validateRanges = (results = []) => {
    if (!Array.isArray(results) || !results.length) return true;
    const sorted = [...results].sort((a, b) => a.min - b.min);
    for (let i = 0; i < sorted.length; i += 1) {
      const current = sorted[i];
      if (!Number.isFinite(current.min) || !Number.isFinite(current.max) || current.min > current.max) {
        throw new Error('결과 구간 값이 올바르지 않습니다.');
      }
      if (i > 0 && current.min !== sorted[i - 1].max + 1) {
        throw new Error('결과 구간에 빈틈 또는 중복이 있습니다.');
      }
    }
    return true;
  };

  const calculate = (checklist, answers) => {
    if (!checklist || !Array.isArray(checklist.questions)) throw new Error('문항 데이터가 없습니다.');
    const mode = checklist.mode || 'scored';
    if (!MODES.has(mode)) throw new Error('지원하지 않는 계산 모드입니다.');

    if (mode === 'help') {
      return {
        mode,
        blocked: true,
        total: null,
        categories: {},
        result: null,
        message: '도움 안내형 주제는 점수 결과를 제공하지 않습니다.'
      };
    }

    const scaleValues = (checklist.scale || []).map((item) => asNumber(item.value));
    if (!scaleValues.length) throw new Error('응답 척도가 없습니다.');
    const scaleMin = Math.min(...scaleValues);
    const scaleMax = Math.max(...scaleValues);
    const categories = {};
    let total = 0;

    checklist.questions.forEach((question) => {
      if (!(question.id in answers)) throw new Error(`미응답 문항이 있습니다: ${question.id}`);
      const raw = asNumber(answers[question.id]);
      if (!scaleValues.includes(raw)) throw new Error(`허용되지 않은 응답값입니다: ${question.id}`);
      const score = question.reverse ? scaleMax + scaleMin - raw : raw;
      total += score;
      const category = question.category || 'uncategorized';
      if (!categories[category]) categories[category] = { score: 0, count: 0 };
      categories[category].score += score;
      categories[category].count += 1;
    });

    validateRanges(checklist.results || []);
    const result = (checklist.results || []).find((item) => total >= item.min && total <= item.max) || null;

    return {
      mode,
      blocked: false,
      total,
      categories,
      result,
      message: result ? result.summary || '' : '해당 점수 구간의 결과가 없습니다.'
    };
  };

  global.ReScanScoring = { calculate, validateRanges };
}(window));
