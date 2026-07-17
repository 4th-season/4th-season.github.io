(function (global) {
  'use strict';

  const MODES = new Set(['scored', 'pattern', 'reflection', 'help', 'guide']);
  const BLOCKING_MODES = new Set(['help', 'guide']);

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

  const resolveResultSet = (checklist, mode) => {
    if (mode === 'pattern' && Array.isArray(checklist.patternResults) && checklist.patternResults.length) {
      return checklist.patternResults.map((item) => ({ ...item, level: item.level || '반복 패턴', summary: item.summary || '반복되는 패턴을 다시 살펴볼 수 있는 단계입니다.' }));
    }
    if (mode === 'reflection' && Array.isArray(checklist.reflectionResults) && checklist.reflectionResults.length) {
      return checklist.reflectionResults.map((item) => ({ ...item, level: item.level || '성찰 단계', summary: item.summary || '생각과 감정을 천천히 되돌아볼 수 있는 단계입니다.' }));
    }
    if (Array.isArray(checklist.results) && checklist.results.length) {
      return checklist.results.map((item) => {
        if (mode === 'pattern') {
          return { ...item, level: '반복 패턴', summary: item.summary || '반복되는 패턴을 다시 살펴볼 수 있는 단계입니다.' };
        }
        if (mode === 'reflection') {
          return { ...item, level: '성찰 단계', summary: item.summary || '생각과 감정을 천천히 되돌아볼 수 있는 단계입니다.' };
        }
        return item;
      });
    }
    return [];
  };

  const getResultForScore = (results = [], total) => {
    if (!Array.isArray(results) || !results.length) return null;
    const exact = results.find((item) => total >= item.min && total <= item.max);
    if (exact) return exact;
    const fallback = [...results].reverse().find((item) => total >= item.min);
    return fallback || results[0] || null;
  };

  const getModeFallbackMessage = (mode) => {
    if (mode === 'pattern') return '반복 패턴에 대한 결과 구간이 없습니다.';
    if (mode === 'reflection') return '성찰형 결과 구간이 없습니다.';
    return '해당 점수 구간의 결과가 없습니다.';
  };

  const calculate = (checklist, answers) => {
    if (!checklist || !Array.isArray(checklist.questions)) throw new Error('문항 데이터가 없습니다.');
    const mode = checklist.mode || 'scored';
    if (!MODES.has(mode)) throw new Error('지원하지 않는 계산 모드입니다.');

    if (BLOCKING_MODES.has(mode)) {
      return {
        mode,
        blocked: true,
        total: null,
        categories: {},
        result: null,
        message: checklist.helpMessage || '이 주제는 점수 기반 결과를 제공하지 않습니다.'
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

    const resultSet = resolveResultSet(checklist, mode);
    validateRanges(resultSet);
    const result = getResultForScore(resultSet, total);

    return {
      mode,
      blocked: false,
      total,
      categories,
      result,
      message: result ? result.summary || result.message || '' : getModeFallbackMessage(mode)
    };
  };

  global.ReScanScoring = { calculate, validateRanges };
}(window));
