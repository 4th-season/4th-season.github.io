(function (global) {
  'use strict';

  const STATE_MAP = {
    clearly_higher: 'much_higher',
    somewhat_higher: 'somewhat_higher',
    near_average: 'similar',
    balanced: 'similar',
    somewhat_lower: 'somewhat_lower',
    clearly_lower: 'much_lower'
  };

  const byPriority = (a, b) => (b.priority || 0) - (a.priority || 0);

  const ensureObject = (value, message) => {
    if (!value || typeof value !== 'object') throw new Error(message);
    return value;
  };

  const getDomainRows = (calculation) => {
    const source = calculation.domains || calculation.categories;
    ensureObject(source, '영역별 채점 결과가 없습니다.');
    return Object.entries(source).map(([id, value]) => ({ id, ...value }));
  };

  const resolveState = (row) => {
    const raw = row.relativePosition || row.relativeState || row.state || 'near_average';
    return STATE_MAP[raw] || raw;
  };

  const selectDomainModules = (calculation, modules, options = {}) => {
    const maxDomains = Number.isInteger(options.maxDomains) ? options.maxDomains : 7;
    const rows = getDomainRows(calculation);
    const rankedIds = Array.isArray(calculation.ranking)
      ? calculation.ranking.map((item) => typeof item === 'string' ? item : item.id)
      : [...rows].sort((a, b) => (b.percent || b.score || 0) - (a.percent || a.score || 0)).map((row) => row.id);

    return rankedIds.slice(0, maxDomains).map((id) => {
      const row = rows.find((item) => item.id === id);
      const state = resolveState(row || {});
      const module = modules.domainModules?.[id]?.[state];
      if (!module) throw new Error(`영역 해석 모듈을 찾을 수 없습니다: ${id}/${state}`);
      return { type: 'domain', domainId: id, state, score: row?.percent ?? row?.score ?? null, ...module };
    });
  };

  const selectPairModules = (calculation, modules, options = {}) => {
    const maxPairs = Number.isInteger(options.maxPairs) ? options.maxPairs : 2;
    const rows = getDomainRows(calculation);
    const stateMap = Object.fromEntries(rows.map((row) => [row.id, resolveState(row)]));
    const matched = (modules.pairModules || []).filter((rule) => {
      return Array.isArray(rule.aState) && rule.aState.includes(stateMap[rule.a])
        && Array.isArray(rule.bState) && rule.bState.includes(stateMap[rule.b]);
    }).sort(byPriority);

    const selected = [];
    const usedDomains = new Set();
    for (const rule of matched) {
      if (usedDomains.has(rule.a) && usedDomains.has(rule.b)) continue;
      selected.push({ type: 'pair', ...rule });
      usedDomains.add(rule.a);
      usedDomains.add(rule.b);
      if (selected.length >= maxPairs) break;
    }
    return selected;
  };

  const getBalanceModule = (calculation, modules) => {
    const key = calculation.profile?.balance || calculation.balance?.level || calculation.balanceLevel || calculation.profileBalance || 'mixed';
    const module = modules.balanceModules?.[key];
    if (!module) throw new Error(`균형도 해석 모듈을 찾을 수 없습니다: ${key}`);
    return { type: 'balance', key, ...module };
  };

  const getConfidenceModule = (calculation, modules) => {
    const key = calculation.responseQuality?.level || calculation.confidence?.level || calculation.confidenceLevel || calculation.responseConfidence || 'moderate';
    const module = modules.confidenceModules?.[key];
    if (!module) throw new Error(`응답 참고도 모듈을 찾을 수 없습니다: ${key}`);
    return { type: 'confidence', key, ...module };
  };

  const createOverview = (calculation, domainModules, pairModules) => {
    const ranking = Array.isArray(calculation.ranking) ? calculation.ranking : [];
    const top = ranking[0];
    const second = ranking[1];
    const topId = typeof top === 'string' ? top : top?.id;
    const secondId = typeof second === 'string' ? second : second?.id;
    const topModule = domainModules.find((item) => item.domainId === topId) || domainModules[0];
    const secondModule = domainModules.find((item) => item.domainId === secondId) || domainModules[1];
    const gap = Number(calculation.profile?.topGap ?? calculation.topGap ?? calculation.topDifference ?? 0);

    if (gap <= 5 && topModule && secondModule) {
      return {
        type: 'overview',
        title: '두 가지 반응 경향이 함께 두드러집니다',
        text: `${topModule.title} 동시에 ${secondModule.title} 두 경향의 점수 차이가 작아 상황에 따라 함께 나타날 가능성이 있습니다.`
      };
    }
    if (pairModules.length) {
      return { type: 'overview', title: pairModules[0].title, text: pairModules[0].text };
    }
    return {
      type: 'overview',
      title: topModule?.title || '여러 반응 경향을 함께 살펴봅니다',
      text: topModule?.summary || '이번 응답에서 나타난 영역별 차이를 생활 장면과 함께 살펴볼 수 있습니다.'
    };
  };

  const dedupe = (items) => {
    const seen = new Set();
    return items.filter((item) => {
      const key = `${item.type}:${item.id || item.domainId || item.key || item.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const interpret = (calculation, modules, options = {}) => {
    ensureObject(calculation, '채점 결과가 없습니다.');
    ensureObject(modules, '해석 모듈 데이터가 없습니다.');
    const domains = selectDomainModules(calculation, modules, options);
    const pairs = selectPairModules(calculation, modules, options);
    const balance = getBalanceModule(calculation, modules);
    const confidence = getConfidenceModule(calculation, modules);
    const overview = createOverview(calculation, domains, pairs);

    return {
      profileId: modules.profileId || null,
      schemaVersion: modules.schemaVersion || null,
      overview,
      balance,
      confidence,
      pairs,
      domains,
      sections: dedupe([overview, balance, ...pairs, ...domains, confidence]),
      notice: '이 결과는 개인 내부의 상대적 경향을 바탕으로 구성한 자기이해 자료이며, 표준화 심리검사나 전문적 평가를 대체하지 않습니다.'
    };
  };

  global.ReScanProfileInterpreter = {
    interpret,
    selectDomainModules,
    selectPairModules,
    resolveState
  };
}(window));
