(function (global) {
  'use strict';

  const STATE_MAP = {
    clearly_higher: 'much_higher', somewhat_higher: 'somewhat_higher', near_average: 'similar',
    balanced: 'similar', somewhat_lower: 'somewhat_lower', clearly_lower: 'much_lower'
  };

  const AXES = {
    change_response: {
      high: { label: '탐색형', short: '탐색', strength: '새로운 가능성을 빠르게 발견하고 변화의 첫 시도를 시작하는 힘', shadow: '새로움 자체가 목적이 되면 선택이 늘고 마무리가 약해질 수 있음', work: '새로운 방식과 개선 과제가 있는 환경', pressure: '반복과 정체가 길어지면 흥미가 급격히 떨어질 수 있음', borrow: '안정형의 검증·반복·마무리 기준' },
      low: { label: '안정형', short: '안정', strength: '검증된 방식과 축적된 경험을 안정적으로 활용하는 힘', shadow: '익숙함이 지나치면 필요한 변화까지 늦출 수 있음', work: '기준과 과정이 분명하고 경험이 축적되는 환경', pressure: '갑작스러운 변화가 겹치면 방어적으로 굳어질 수 있음', borrow: '탐색형의 작은 실험과 임시 시도' }
    },
    uncertainty_sensitivity: {
      high: { label: '검토형', short: '검토', strength: '위험과 빠진 조건을 미리 발견해 시행착오를 줄이는 힘', shadow: '확인이 계속 늘어나면 준비가 행동을 대신할 수 있음', work: '정확성·안전·사전 검토가 중요한 환경', pressure: '불확실성이 커질수록 생각은 많아지고 결정은 늦어질 수 있음', borrow: '실행형의 최소 기준과 시험 행동' },
      low: { label: '실행형', short: '실행', strength: '조건이 완벽하지 않아도 시작하고 움직이며 조정하는 힘', shadow: '속도가 앞서면 필요한 확인이나 위험 신호를 놓칠 수 있음', work: '변화가 빠르고 현장 판단이 필요한 환경', pressure: '압박 속에서 더 빨리 결정해 실수가 반복될 수 있음', borrow: '검토형의 체크리스트와 중간 점검' }
    },
    relational_responsiveness: {
      high: { label: '관계반응형', short: '관계반응', strength: '표정·말투·분위기 변화를 빠르게 읽고 관계의 온도를 조절하는 힘', shadow: '상대의 반응을 자신의 가치나 관계 전체의 신호로 확대해석할 수 있음', work: '협업·고객·조정처럼 사람의 반응이 중요한 환경', pressure: '모호한 반응이나 냉담함이 오래 남아 의욕까지 흔들 수 있음', borrow: '자기기준형의 사실 확인과 감정 거리두기' },
      low: { label: '자기기준형', short: '자기기준', strength: '외부 반응이 적어도 자신의 판단과 흐름을 유지하는 힘', shadow: '상대가 보내는 정서적 신호를 늦게 알아차리거나 차갑게 보일 수 있음', work: '독립 판단과 집중이 필요한 환경', pressure: '관계 요구가 많아지면 거리를 두거나 소통을 줄일 수 있음', borrow: '관계반응형의 표정·말투·맥락 확인' }
    },
    persistence: {
      high: { label: '축적형', short: '축적', strength: '성과가 늦어도 반복과 시행착오를 견디며 결과를 쌓는 힘', shadow: '중단하거나 바꿔야 할 일까지 오래 붙들 수 있음', work: '장기 과제·숙련·반복 훈련이 필요한 환경', pressure: '책임감이 강해질수록 쉬지 못하고 버티기만 할 수 있음', borrow: '전환형의 중단 기준과 방향 재검토' },
      low: { label: '전환형', short: '전환', strength: '효율이 낮거나 흐름이 막힌 일을 빠르게 바꾸는 힘', shadow: '축적이 필요한 과정도 충분히 해보기 전에 옮겨갈 수 있음', work: '짧은 주기·다양한 과제·빠른 피드백이 있는 환경', pressure: '진전이 보이지 않으면 여러 일을 동시에 바꾸며 흐름이 흩어질 수 있음', borrow: '축적형의 작은 반복과 완료 단위' }
    }
  };

  const TYPE_NAMES = {
    '탐색|실행': '빠른 실험가', '탐색|검토': '신중한 개척자', '탐색|축적': '새 길을 만드는 완성자',
    '탐색|전환': '가능성을 좇는 전환자', '안정|검토': '안정 설계자', '안정|실행': '현실 대응자',
    '안정|축적': '묵묵한 축적가', '안정|전환': '실용적 조정자', '관계반응|축적': '관계를 지키는 지속자',
    '관계반응|전환': '분위기를 읽는 조정자', '자기기준|축적': '독립적인 완성자', '자기기준|전환': '자율적 전환자',
    '검토|축적': '치밀한 완성자', '검토|관계반응': '세심한 조율자', '실행|관계반응': '현장형 연결자',
    '실행|자기기준': '독립적 실행가'
  };

  const ensureObject = (value, message) => {
    if (!value || typeof value !== 'object') throw new Error(message);
    return value;
  };
  const getDomainRows = (calculation) => Object.entries(ensureObject(calculation.domains || calculation.categories, '영역별 채점 결과가 없습니다.')).map(([id, value]) => ({ id, ...value }));
  const resolveState = (row) => STATE_MAP[row.relativePosition || row.relativeState || row.state || 'near_average'] || 'similar';

  const selectDomainModules = (calculation, modules, options = {}) => {
    const rows = getDomainRows(calculation);
    const maxDomains = Number.isInteger(options.maxDomains) ? options.maxDomains : 7;
    const rankedIds = calculation.ranking.map((item) => typeof item === 'string' ? item : item.id);
    return rankedIds.slice(0, maxDomains).map((id) => {
      const row = rows.find((item) => item.id === id);
      const state = resolveState(row || {});
      const module = modules.domainModules?.[id]?.[state];
      if (!module) throw new Error(`영역 해석 모듈을 찾을 수 없습니다: ${id}/${state}`);
      return { type: 'domain', domainId: id, state, score: row.percent, ...module };
    });
  };

  const getBalanceModule = (calculation, modules) => {
    const key = calculation.profile?.balance || 'mixed';
    return { type: 'balance', key, ...(modules.balanceModules?.[key] || { title: '영역별 차이를 함께 살펴봅니다', text: '한 영역만으로 전체 성향을 설명하기보다 여러 경향이 어떤 상황에서 함께 작동하는지 보는 편이 좋습니다.' }) };
  };
  const getConfidenceModule = (calculation, modules) => {
    const key = calculation.responseQuality?.level || 'moderate';
    return { type: 'confidence', key, ...(modules.confidenceModules?.[key] || { title: '결과 참고도', text: '이번 응답의 전체적인 모양을 참고해 주세요.' }) };
  };

  const choosePole = (score) => score >= 57 ? 'high' : score <= 43 ? 'low' : 'mixed';
  const axisResult = (calculation, id) => {
    const score = calculation.domains[id].percent;
    const pole = choosePole(score);
    if (pole === 'mixed') return { id, score, pole, label: `${AXES[id].high.short}/${AXES[id].low.short} 혼합`, short: '혼합', distance: Math.abs(score - 50) };
    return { id, score, pole, ...AXES[id][pole], distance: Math.abs(score - 50) };
  };

  const characterModifier = (calculation) => {
    const ids = ['self_direction', 'cooperation', 'meaning_orientation'];
    const rows = ids.map((id) => ({ id, score: calculation.domains[id].percent })).sort((a, b) => b.score - a.score);
    if (rows[0].score - rows[2].score <= 8) return { id: 'balanced', label: '균형조율형', text: '자기 기준·협력·의미 추구가 비교적 고르게 작동합니다.' };
    const map = {
      self_direction: ['자기조율형', '자신의 기준과 우선순위를 세우고 행동을 조정하는 힘이 결과에 비교적 크게 작용합니다.'],
      cooperation: ['관계조율형', '타인의 입장과 공동의 해결점을 살피는 힘이 결과에 비교적 크게 작용합니다.'],
      meaning_orientation: ['의미연결형', '현재의 선택을 더 큰 가치와 장기적인 방향에 연결하는 힘이 결과에 비교적 크게 작용합니다.']
    };
    return { id: rows[0].id, label: map[rows[0].id][0], text: map[rows[0].id][1] };
  };

  const createTypeProfile = (calculation) => {
    const axisIds = ['change_response', 'uncertainty_sensitivity', 'relational_responsiveness', 'persistence'];
    const axes = axisIds.map((id) => axisResult(calculation, id));
    const distinct = axes.filter((axis) => axis.pole !== 'mixed').sort((a, b) => b.distance - a.distance);
    const primary = distinct[0];
    const secondary = distinct[1];
    const typeKey = primary && secondary ? [primary.short, secondary.short].sort().join('|') : '';
    const reverseKey = primary && secondary ? `${primary.short}|${secondary.short}` : '';
    const title = TYPE_NAMES[reverseKey] || TYPE_NAMES[typeKey] || (distinct.length ? `${distinct[0].label} 중심의 상황조정자` : '상황에 따라 조절하는 균형형');
    const modifier = characterModifier(calculation);
    const active = axes.filter((axis) => axis.pole !== 'mixed');
    const strengths = active.map((axis) => axis.strength).slice(0, 4);
    const shadows = active.map((axis) => axis.shadow).slice(0, 4);
    const portrait = active.length
      ? `${active.map((axis) => axis.short).join('·')} 경향이 비교적 선명합니다. ${modifier.text}`
      : `네 기질 축의 차이가 크지 않아 상황과 역할에 따라 반응 방식을 조절할 가능성이 큽니다. ${modifier.text}`;
    const relationshipAxis = axes.find((axis) => axis.id === 'relational_responsiveness');
    const workAxes = axes.filter((axis) => ['change_response', 'uncertainty_sensitivity', 'persistence'].includes(axis.id) && axis.pole !== 'mixed');
    const pressure = active.map((axis) => axis.pressure).slice(0, 3).join(' ');
    const borrow = active.map((axis) => axis.borrow).slice(0, 2).join(' · ');
    const directionParts = [];
    if (calculation.domains.change_response.percent >= 57 && calculation.domains.persistence.percent <= 43) directionParts.push('새 일을 더 늘리기보다 현재 시작한 것 하나를 작은 단위로 끝내는 편이 좋습니다.');
    if (calculation.domains.uncertainty_sensitivity.percent >= 57 && calculation.domains.self_direction.percent <= 43) directionParts.push('걱정을 없애려 하기보다 지금 결정할 수 있는 가장 작은 행동을 하나 정해 보세요.');
    if (calculation.domains.relational_responsiveness.percent >= 57 && calculation.domains.cooperation.percent >= 57) directionParts.push('관계를 지키는 것과 자신의 필요를 미루는 일을 구분할 기준이 필요합니다.');
    if (calculation.domains.persistence.percent >= 57 && calculation.domains.self_direction.percent >= 57) directionParts.push('더 오래 버티기보다 중단 기준과 회복 시간을 미리 정하는 편이 지속에 도움이 됩니다.');
    if (!directionParts.length) directionParts.push(primary?.borrow ? `지금은 자신의 강점을 더 키우기보다 반대 성향의 자원인 ‘${primary.borrow}’을 조금 빌려 쓰는 방향이 도움이 됩니다.` : '한 가지 성향을 강화하기보다 상황별로 어떤 반응이 실제로 도움이 되었는지 기록해 보세요.');

    return {
      title, modifier, axes,
      code: axes.map((axis) => axis.label).join(' · '),
      portrait,
      strengths,
      shadows,
      relationship: relationshipAxis?.pole === 'mixed' ? '관계의 반응을 살피는 힘과 자신의 기준을 유지하는 힘이 상황에 따라 번갈아 나타날 수 있습니다.' : `${relationshipAxis.strength}. 반면 ${relationshipAxis.shadow}.`,
      work: workAxes.length ? `${workAxes.map((axis) => axis.work).join(', ')}에서 강점이 드러날 수 있습니다. 다만 강점이 동시에 과해지면 속도·검토·지속 중 하나가 다른 요소를 압도하지 않는지 살펴야 합니다.` : '업무 환경과 과제 성격에 따라 여러 방식으로 대응할 가능성이 큽니다.',
      pressure: pressure || '압박이 커질수록 평소보다 한쪽 반응이 강해질 수 있으므로, 결과보다 반응의 변화를 먼저 알아차리는 것이 중요합니다.',
      recovery: active.length ? `회복에는 ${active.map((axis) => axis.borrow).slice(0, 2).join('과 ')}을 의식적으로 빌려 쓰는 방식이 도움이 될 수 있습니다.` : '회복에는 역할과 기대를 잠시 줄이고, 현재 필요한 반응을 다시 선택할 여유가 필요합니다.',
      borrow,
      direction: directionParts.join(' ')
    };
  };

  const interpret = (calculation, modules, options = {}) => {
    ensureObject(calculation, '채점 결과가 없습니다.');
    ensureObject(modules, '해석 모듈 데이터가 없습니다.');
    const domains = selectDomainModules(calculation, modules, options);
    const balance = getBalanceModule(calculation, modules);
    const confidence = getConfidenceModule(calculation, modules);
    const typeProfile = createTypeProfile(calculation);
    return {
      profileId: modules.profileId || null,
      schemaVersion: modules.schemaVersion || null,
      typeProfile,
      overview: { type: 'overview', title: `${typeProfile.title} · ${typeProfile.modifier.label}`, text: typeProfile.portrait },
      balance, confidence, pairs: [], domains,
      notice: '유형명은 이번 응답의 모양을 기억하기 위한 별칭입니다. 고정된 성격이나 능력, 정상·비정상, 직업 적합성을 판정하지 않습니다.'
    };
  };

  global.ReScanProfileInterpreter = { interpret, selectDomainModules, resolveState, createTypeProfile };
}(window));