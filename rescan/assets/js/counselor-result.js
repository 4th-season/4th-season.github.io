document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const app = document.querySelector('#checklist-app');
  if (!app || !window.ReScanScoring) return;

  const checklistId = new URLSearchParams(location.search).get('id');
  if (!checklistId) return;

  let latestAnswers = null;

  const loadJson = async (path) => {
    const response = await fetch(path, { cache: 'no-store' });
    if (!response.ok) throw new Error(`데이터를 불러오지 못했습니다. (${response.status})`);
    return response.json();
  };

  const dataPromise = (async () => {
    const index = await loadJson('/rescan/data/index.json');
    const item = Array.isArray(index.items) ? index.items.find((entry) => entry.id === checklistId) : null;
    if (!item || !item.dataPath) return null;
    return loadJson(item.dataPath);
  })().catch(() => null);

  const createText = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = text || '';
    return element;
  };

  const getBand = (percent) => percent <= 33 ? 'low' : (percent <= 66 ? 'mid' : 'high');

  const getRelative = (percent, average) => {
    const difference = Math.round(percent - average);
    if (difference >= 8) return { key: 'above', difference, label: `내 영역 평균보다 ${difference}%p 높음` };
    if (difference <= -8) return { key: 'below', difference, label: `내 영역 평균보다 ${Math.abs(difference)}%p 낮음` };
    return { key: 'similar', difference, label: '내 영역 평균과 비슷함' };
  };

  const getFallbackNarrative = (checklist, category, row, average) => {
    const band = getBand(row.percent);
    const relative = getRelative(row.percent, average);
    const guide = checklist.categoryGuides?.[row.id]?.[band] || '';
    const description = category?.description || `${row.label}과 관련된 최근 생활 경험`;

    if (band === 'low') {
      return {
        interpretation: `${row.label} 점수는 ${row.percent}%로, 최근 응답에서는 ${description}이 비교적 안정적으로 유지되는 편입니다. ${relative.label}이라는 점까지 함께 보면 다른 영역의 부담을 다룰 때 활용할 수 있는 상대적 자원에 가깝습니다.`,
        strength: `이 영역에서 이미 작동하고 있는 사람, 습관, 환경 조건은 생활이 흔들릴 때 다시 기대어 볼 수 있는 장점이 됩니다. 낮은 점수는 잘하고 있다는 칭찬보다 현재 이용 가능한 자원이 남아 있다는 뜻으로 읽는 편이 정확합니다.`,
        caution: `다만 점수가 낮다고 해서 언제나 문제가 없다는 뜻은 아닙니다. 특정 관계나 일정, 건강·경제 조건이 바뀌면 지금의 안정이 빠르게 줄어들 수 있으므로 무엇이 이 상태를 지지하는지 함께 확인해야 합니다.`,
        support: guide || `새로운 과제를 더하기보다 지금 유지되고 있는 조건을 구체적으로 확인하고, 바쁜 시기에도 그 조건이 가장 먼저 사라지지 않도록 보호하는 방식이 도움이 됩니다.`
      };
    }

    if (band === 'high') {
      return {
        interpretation: `${row.label} 점수는 ${row.percent}%로, 최근 응답에서는 ${description}과 관련된 부담이 자주 나타난 편입니다. ${relative.label}이므로 네 영역 가운데 우선해서 살펴볼 필요가 있는 부분으로 읽을 수 있습니다.`,
        strength: `이 결과의 장점은 문제가 있다는 판정이 아니라 현재 생활에서 힘이 가장 많이 소모되는 지점을 비교적 선명하게 보여 준다는 데 있습니다. 불편을 알아차리고 구분한 것 자체가 조정의 출발점이 될 수 있습니다.`,
        caution: `이 부담이 이어지면 선택 폭이 좁아지거나, 작은 변화에도 피로와 회피 반응이 커질 수 있습니다. 개인의 의지 부족으로 해석하면 실제로 바꿔야 할 관계·시간·환경 조건을 놓치기 쉽습니다.`,
        support: guide || `조언이나 목표를 먼저 제시하기보다 어떤 상황에서 부담이 커지고 무엇이 조금 완화시키는지 확인한 뒤, 줄일 부담과 요청할 도움을 한 가지씩 나누어 보는 방식이 적절합니다.`
      };
    }

    return {
      interpretation: `${row.label} 점수는 ${row.percent}%로, 안정된 자원과 부담 신호가 함께 나타나는 중간 영역입니다. ${relative.label}이므로 현재 생활 전체의 흐름과 비슷하게 움직이는 부분으로 볼 수 있습니다.`,
      strength: `어떤 장면에서는 이 영역의 기능이 비교적 유지되고 있다는 점이 장점입니다. 이미 잘되는 상황을 찾아보면 도움이 되는 사람, 시간대, 공간, 준비 방식 같은 현실적인 조건을 확인할 수 있습니다.`,
      caution: `반대로 피로가 누적되거나 상황이 복잡해지면 유지되던 기능이 쉽게 흔들릴 수 있습니다. 평균에 가깝다는 이유로 지나치기보다 괜찮았던 장면과 어려웠던 장면의 차이를 살펴보는 편이 좋습니다.`,
      support: guide || `전체를 한 번에 바꾸기보다 이 영역이 괜찮았던 때와 어려웠던 때를 하나씩 비교하고, 차이를 만든 조건 가운데 조정 가능한 한 가지부터 다루는 방식이 도움이 됩니다.`
    };
  };

  const getNarrative = (checklist, category, row, average) => {
    const band = getBand(row.percent);
    const fallback = getFallbackNarrative(checklist, category, row, average);
    const custom = checklist.categoryNarratives?.[row.id]?.[band];
    if (!custom || typeof custom !== 'object') return fallback;
    return {
      interpretation: custom.interpretation || fallback.interpretation,
      strength: custom.strength || fallback.strength,
      caution: custom.caution || fallback.caution,
      support: custom.support || fallback.support
    };
  };

  const createNarrativeSection = (title, text, className) => {
    const section = document.createElement('div');
    section.className = `result-narrative-part ${className}`;
    section.appendChild(createText('h4', '', title));
    section.appendChild(createText('p', '', text));
    return section;
  };

  const buildOverview = (rows, average) => {
    const sorted = [...rows].sort((a, b) => b.percent - a.percent);
    const focus = sorted[0];
    const resource = sorted.at(-1);
    const gap = focus.percent - resource.percent;
    const block = document.createElement('div');
    block.className = 'result-block result-counselor-overview';
    block.appendChild(createText('p', 'result-counselor-label', '상담식 종합 해설'));
    block.appendChild(createText('h3', '', '점수보다 먼저, 네 영역 사이의 흐름을 읽어보면'));

    let text;
    if (gap < 8) {
      text = `네 영역의 개인 평균은 ${average}%입니다. 영역 간 차이가 ${gap}%p로 크지 않아 한 부분만의 문제라기보다 현재 생활 전반이 비슷한 수준으로 움직이는 모습에 가깝습니다. 이런 경우에는 가장 높은 점수 하나만 고르기보다 여러 영역에 공통으로 영향을 주는 피로, 시간 부족, 최근 사건을 먼저 확인하는 편이 좋습니다.`;
    } else {
      const focusRelative = getRelative(focus.percent, average);
      const resourceRelative = getRelative(resource.percent, average);
      text = `네 영역의 개인 평균은 ${average}%입니다. ${focus.label}은 ${focus.percent}%로 ${focusRelative.label}이며, 현재 가장 부담이 몰린 영역입니다. 반면 ${resource.label}은 ${resource.percent}%로 ${resourceRelative.label}아 상대적으로 유지되는 자원에 가깝습니다. 따라서 가장 힘든 영역만 고치려 하기보다, 비교적 유지되는 ${resource.label}의 조건을 활용해 ${focus.label}의 부담을 덜어 주는 순서가 현실적입니다.`;
    }

    block.appendChild(createText('p', 'result-counselor-copy', text));
    const note = createText('p', 'result-average-note', `여기서 평균은 다른 사람이나 연령 집단의 평균이 아니라, 이번 응답에서 나온 ${rows.length}개 영역의 개인 평균입니다. 표준화 규준이 없는 체크리스트이므로 타인과 비교하는 수치로 해석하지 않습니다.`);
    block.appendChild(note);
    return block;
  };

  const enhanceResult = async () => {
    const resultView = app.querySelector('.result-view');
    if (!resultView || resultView.dataset.counselorEnhanced === 'true' || !latestAnswers) return;

    const checklist = await dataPromise;
    if (!checklist) return;

    let calculation;
    try {
      calculation = window.ReScanScoring.calculate(checklist, latestAnswers);
    } catch (error) {
      return;
    }
    if (calculation.blocked || !calculation.categories) return;

    const categories = new Map((checklist.categories || []).map((category) => [category.id, category]));
    const rows = Object.entries(calculation.categories).map(([id, value]) => ({ id, label: categories.get(id)?.label || id, ...value }));
    if (!rows.length) return;

    const average = Math.round(rows.reduce((sum, row) => sum + row.percent, 0) / rows.length);
    const summary = resultView.querySelector('.result-summary');
    if (summary) summary.insertAdjacentElement('afterend', buildOverview(rows, average));

    const items = [...resultView.querySelectorAll('.result-category-item')];
    rows.forEach((row, index) => {
      const item = items[index];
      if (!item) return;
      const category = categories.get(row.id);
      const relative = getRelative(row.percent, average);
      const narrative = getNarrative(checklist, category, row, average);
      const heading = item.querySelector('.result-category > div');
      if (heading) heading.appendChild(createText('span', `result-relative-badge is-${relative.key}`, relative.label));

      const body = document.createElement('div');
      body.className = 'result-category-narrative';
      body.appendChild(createNarrativeSection('이 점수가 뜻하는 것', narrative.interpretation, 'is-meaning'));
      body.appendChild(createNarrativeSection('장점으로 작용할 수 있는 부분', narrative.strength, 'is-strength'));
      body.appendChild(createNarrativeSection('약점으로 작용할 수 있는 부분', narrative.caution, 'is-caution'));
      body.appendChild(createNarrativeSection('도움을 줄 때 고려할 점', narrative.support, 'is-support'));
      item.appendChild(body);
    });

    resultView.dataset.counselorEnhanced = 'true';
  };

  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || form.id !== 'rescan-form') return;
    latestAnswers = Object.fromEntries([...new FormData(form).entries()].map(([key, value]) => [key, Number(value)]));
    setTimeout(enhanceResult, 0);
  }, true);

  const observer = new MutationObserver(() => {
    if (app.querySelector('.result-view')) enhanceResult();
  });
  observer.observe(app, { childList: true, subtree: true });
});
