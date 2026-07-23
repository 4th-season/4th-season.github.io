(function (global) {
  'use strict';

  const DEFAULT_GROUPS = {
    temperament: ['change_response', 'uncertainty_sensitivity', 'relational_responsiveness', 'persistence'],
    character: ['self_direction', 'cooperation', 'meaning_orientation']
  };

  const asNumber = (value) => {
    const number = Number(value);
    if (!Number.isFinite(number)) throw new Error('응답값은 숫자여야 합니다.');
    return number;
  };

  const mean = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

  const standardDeviation = (values) => {
    if (!values.length) return 0;
    const average = mean(values);
    return Math.sqrt(mean(values.map((value) => (value - average) ** 2)));
  };

  const round = (value, digits = 1) => {
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
  };

  const validateProfile = (profile) => {
    if (!profile || profile.mode !== 'profile') throw new Error('profile 모드 데이터가 아닙니다.');
    if (!Array.isArray(profile.scale) || profile.scale.length < 2) throw new Error('응답 척도가 올바르지 않습니다.');
    if (!Array.isArray(profile.domains) || !profile.domains.length) throw new Error('영역 정의가 없습니다.');
    if (!Array.isArray(profile.questions) || !profile.questions.length) throw new Error('문항 데이터가 없습니다.');

    const domainIds = new Set(profile.domains.map((domain) => domain.id));
    if (domainIds.size !== profile.domains.length) throw new Error('영역 ID가 중복됩니다.');

    const questionIds = new Set();
    profile.questions.forEach((question) => {
      if (!question.id || questionIds.has(question.id)) throw new Error(`문항 ID가 비어 있거나 중복됩니다: ${question.id || '(없음)'}`);
      questionIds.add(question.id);
      if (!domainIds.has(question.domain)) throw new Error(`등록되지 않은 영역입니다: ${question.id}`);
      if (!['forward', 'reverse'].includes(question.direction)) throw new Error(`채점 방향이 올바르지 않습니다: ${question.id}`);
    });
    return true;
  };

  const classifyRelativePosition = (score, average, spread) => {
    if (spread < 4) return 'balanced';
    const delta = score - average;
    if (delta >= 10) return 'clearly_higher';
    if (delta >= 5) return 'somewhat_higher';
    if (delta <= -10) return 'clearly_lower';
    if (delta <= -5) return 'somewhat_lower';
    return 'near_average';
  };

  const calculateResponseQuality = (profile, answers, rawValues, domainScores) => {
    const counts = new Map();
    rawValues.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
    const mostUsed = Math.max(...counts.values());
    const sameResponseRatio = rawValues.length ? mostUsed / rawValues.length : 1;
    const midpoint = mean(profile.scale.map((item) => Number(item.value)));
    const midpointRatio = rawValues.filter((value) => value === midpoint).length / rawValues.length;
    const domainSpread = standardDeviation(domainScores);

    let level = 'good';
    const notes = [];
    if (sameResponseRatio >= 0.85) {
      level = 'limited';
      notes.push('한 응답값이 매우 반복되어 영역 차이를 세밀하게 해석하기 어렵습니다.');
    } else if (sameResponseRatio >= 0.7 || midpointRatio >= 0.65 || domainSpread < 3) {
      level = 'moderate';
      notes.push('응답이나 영역 점수가 비슷하게 나타나 결과의 세부 차이는 참고 수준으로 읽는 것이 좋습니다.');
    }

    return {
      level,
      sameResponseRatio: round(sameResponseRatio * 100),
      midpointRatio: round(midpointRatio * 100),
      domainSpread: round(domainSpread),
      notes
    };
  };

  const calculate = (profile, answers) => {
    validateProfile(profile);
    if (!answers || typeof answers !== 'object') throw new Error('응답 데이터가 없습니다.');

    const scaleValues = profile.scale.map((item) => asNumber(item.value));
    const scaleMin = Math.min(...scaleValues);
    const scaleMax = Math.max(...scaleValues);
    const domainMeta = Object.fromEntries(profile.domains.map((domain) => [domain.id, domain]));
    const domains = Object.fromEntries(profile.domains.map((domain) => [domain.id, {
      id: domain.id,
      label: domain.label,
      group: domain.group,
      rawScore: 0,
      count: 0,
      min: 0,
      max: 0,
      percent: 0,
      relativePosition: 'near_average'
    }]));

    const scoredAnswers = {};
    const rawValues = [];

    profile.questions.forEach((question) => {
      if (!(question.id in answers)) throw new Error(`미응답 문항이 있습니다: ${question.id}`);
      const raw = asNumber(answers[question.id]);
      if (!scaleValues.includes(raw)) throw new Error(`허용되지 않은 응답값입니다: ${question.id}`);
      const score = question.direction === 'reverse' ? scaleMax + scaleMin - raw : raw;
      rawValues.push(raw);
      scoredAnswers[question.id] = { raw, score, domain: question.domain, direction: question.direction };
      domains[question.domain].rawScore += score;
      domains[question.domain].count += 1;
    });

    Object.values(domains).forEach((domain) => {
      domain.min = scaleMin * domain.count;
      domain.max = scaleMax * domain.count;
      const range = domain.max - domain.min;
      domain.percent = range > 0 ? round(((domain.rawScore - domain.min) / range) * 100) : 0;
    });

    const domainRows = Object.values(domains);
    const percentages = domainRows.map((domain) => domain.percent);
    const profileAverage = mean(percentages);
    const profileSpread = standardDeviation(percentages);

    domainRows.forEach((domain) => {
      domain.relativePosition = classifyRelativePosition(domain.percent, profileAverage, profileSpread);
    });

    const ranking = [...domainRows].sort((a, b) => b.percent - a.percent || a.id.localeCompare(b.id));
    const topGap = ranking.length > 1 ? ranking[0].percent - ranking[1].percent : 0;
    const totalRange = ranking.length ? ranking[0].percent - ranking[ranking.length - 1].percent : 0;

    const groupsConfig = profile.groups || DEFAULT_GROUPS;
    const groups = {};
    Object.entries(groupsConfig).forEach(([groupId, domainIds]) => {
      const validDomains = domainIds.filter((id) => domains[id]);
      const scores = validDomains.map((id) => domains[id].percent);
      groups[groupId] = {
        id: groupId,
        domainIds: validDomains,
        average: round(mean(scores)),
        spread: round(standardDeviation(scores)),
        range: scores.length ? round(Math.max(...scores) - Math.min(...scores)) : 0
      };
    });

    const pairDistances = [];
    for (let i = 0; i < domainRows.length; i += 1) {
      for (let j = i + 1; j < domainRows.length; j += 1) {
        pairDistances.push({
          a: domainRows[i].id,
          b: domainRows[j].id,
          difference: round(Math.abs(domainRows[i].percent - domainRows[j].percent))
        });
      }
    }

    const quality = calculateResponseQuality(profile, answers, rawValues, percentages);

    return {
      mode: 'profile',
      profileId: profile.id,
      questionCount: profile.questions.length,
      scale: { min: scaleMin, max: scaleMax },
      domains,
      ranking: ranking.map((domain, index) => ({ id: domain.id, label: domain.label, percent: domain.percent, rank: index + 1 })),
      profile: {
        average: round(profileAverage),
        spread: round(profileSpread),
        topGap: round(topGap),
        totalRange: round(totalRange),
        balance: totalRange <= 8 ? 'very_balanced' : totalRange <= 16 ? 'balanced' : totalRange <= 28 ? 'mixed' : 'contrasted'
      },
      groups,
      pairDistances,
      responseQuality: quality,
      scoredAnswers,
      domainMeta
    };
  };

  global.ReScanProfileScoring = {
    calculate,
    validateProfile,
    classifyRelativePosition
  };
}(window));
