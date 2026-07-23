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

  const AXES = {
    change_response: {
      high: {
        label: '탐색형', short: '탐색',
        core: '익숙한 방법을 그대로 반복하기보다 새로운 가능성과 다른 선택지를 먼저 살펴보는 편입니다. 변화가 필요하다고 느끼면 아이디어를 떠올리고 첫 시도를 시작하는 속도가 비교적 빠를 수 있습니다.',
        strength: '정체된 상황에서 새로운 방법을 제안하고, 아직 답이 정해지지 않은 일에 첫발을 내딛는 힘이 있습니다. 주변 사람이 망설일 때 가능성을 보여 주는 역할을 맡기도 합니다.',
        shadow: '새로움이 계속 눈에 들어오면 선택지가 많아지고, 이미 시작한 일을 충분히 익히거나 마무리하기 전에 관심이 옮겨갈 수 있습니다. 변화가 필요한지보다 지루함을 피하려는 마음이 앞서지 않는지 확인할 필요가 있습니다.',
        relationship: '관계에서도 새로운 활동이나 대화 방식을 먼저 제안하기 쉽습니다. 다만 상대가 익숙해질 시간을 필요로 할 때 변화의 속도를 맞추지 않으면 부담을 줄 수 있습니다.',
        work: '새로운 도구를 배우거나 기존 방식을 개선하는 일, 정답이 하나로 정해지지 않은 과제에서 강점을 보일 수 있습니다. 시작 단계의 활력은 크지만 반복 운영과 마무리 구조가 함께 있을 때 결과가 더 안정적으로 남습니다.',
        pressure: '반복과 정체가 길어지면 답답함이 커지고, 문제를 해결하기보다 환경이나 목표를 한꺼번에 바꾸고 싶어질 수 있습니다.',
        recovery: '새로운 자극을 완전히 막기보다 작은 실험 하나만 허용하고, 나머지 일은 마무리 기준을 정해 두는 방식이 도움이 됩니다.',
        borrow: '안정형의 검증·반복·마무리 기준'
      },
      low: {
        label: '안정형', short: '안정',
        core: '새로운 선택보다 이미 확인된 방법과 예측 가능한 흐름을 편하게 느끼는 편입니다. 경험을 반복하며 익숙함과 안정성을 쌓을 때 능력을 잘 발휘할 수 있습니다.',
        strength: '검증된 절차를 꾸준히 유지하고, 이전 경험에서 얻은 지식을 실제 상황에 안정적으로 적용하는 힘이 있습니다. 변화가 많은 환경에서도 기본을 지키는 역할을 할 수 있습니다.',
        shadow: '익숙한 방식이 안전하게 느껴질수록 환경이 달라졌는데도 기존 방법을 오래 유지할 수 있습니다. 변화 자체를 위험으로 받아들이면 필요한 수정의 시점을 놓칠 수 있습니다.',
        relationship: '관계에서는 갑작스러운 변화보다 예측 가능한 연락과 일관된 태도를 중요하게 여길 수 있습니다. 다만 새로운 방식으로 가까워지려는 상대의 제안을 지나치게 조심스럽게 받아들일 수 있습니다.',
        work: '역할과 기준이 분명하고 경험이 누적되는 환경에서 안정적인 성과를 내기 쉽습니다. 변화를 도입할 때는 이유·절차·시험 기간이 구체적으로 제시되면 적응이 더 수월합니다.',
        pressure: '갑작스러운 변화가 겹치면 먼저 방어적으로 굳거나, 결정을 미루며 익숙한 방식으로 돌아가려 할 수 있습니다.',
        recovery: '전체를 바꾸기보다 되돌릴 수 있는 작은 시험을 통해 새 방식의 안전성을 확인하는 편이 도움이 됩니다.',
        borrow: '탐색형의 작은 실험과 임시 시도'
      }
    },
    uncertainty_sensitivity: {
      high: {
        label: '검토형', short: '검토',
        core: '결정하기 전에 빠진 정보와 생길 수 있는 문제를 먼저 확인하는 편입니다. 준비가 충분하다고 느껴져야 마음이 놓이고 행동도 안정적으로 이어질 수 있습니다.',
        strength: '실수나 위험을 미리 발견하고, 다른 사람이 놓친 조건을 보완하는 힘이 있습니다. 안전·정확성·품질이 중요한 장면에서 신뢰받는 역할을 맡기 쉽습니다.',
        shadow: '확인할 항목이 계속 늘어나면 준비가 행동을 대신할 수 있습니다. 더 알아보면 확신이 생길 것 같지만, 실제로는 불확실성을 완전히 없애기 어려워 결정이 늦어질 수 있습니다.',
        relationship: '상대의 말에서 모호한 부분이나 앞으로 문제가 될 가능성을 빠르게 알아차릴 수 있습니다. 그러나 확인되지 않은 가능성을 실제 문제처럼 받아들이면 관계의 긴장이 커질 수 있습니다.',
        work: '사전 검토, 오류 예방, 품질 관리, 계획 수립처럼 꼼꼼함이 필요한 일에서 강점을 보입니다. 다만 모든 변수를 혼자 책임지려 하지 않도록 확인 범위와 마감 시점을 정하는 것이 중요합니다.',
        pressure: '불확실성이 커질수록 생각은 많아지고 결정은 늦어지며, 이미 확인한 내용을 반복해서 살필 수 있습니다.',
        recovery: '추가 정보가 꼭 필요한 부분과 지금 가진 정보로 시작해도 되는 부분을 나누고, 최소 실행 기준을 정하는 방식이 도움이 됩니다.',
        borrow: '실행형의 최소 기준과 시험 행동'
      },
      low: {
        label: '실행형', short: '실행',
        core: '모든 조건이 갖춰질 때까지 기다리기보다 먼저 움직이고 과정에서 조정하는 편입니다. 불확실한 상황에서도 시작 자체에 큰 부담을 느끼지 않을 수 있습니다.',
        strength: '변화가 빠른 상황에서 결정을 늦추지 않고, 실제 경험을 통해 필요한 정보를 얻는 힘이 있습니다. 예상 밖의 문제가 생겨도 현장에서 대응하는 능력으로 이어질 수 있습니다.',
        shadow: '속도가 앞서면 작은 위험 신호나 필요한 확인 절차를 지나칠 수 있습니다. 같은 실수가 반복된다면 실행력이 부족해서가 아니라 중간 점검이 부족했을 가능성을 살펴볼 필요가 있습니다.',
        relationship: '관계의 불확실한 분위기를 오래 해석하기보다 직접 묻거나 행동으로 확인하려는 편일 수 있습니다. 다만 상대가 생각을 정리할 시간이 필요할 때 답을 재촉하는 모습으로 보일 수 있습니다.',
        work: '빠른 판단, 현장 대응, 짧은 실험이 필요한 환경에서 강점을 보입니다. 시작 전 체크 항목을 적게라도 고정하면 속도를 잃지 않으면서 실수를 줄일 수 있습니다.',
        pressure: '압박이 커질수록 더 빨리 결정하고 바로 행동하려 하며, 결과가 좋지 않으면 또 다른 행동으로 덮으려 할 수 있습니다.',
        recovery: '행동을 멈추는 것보다 한 번의 중간 점검을 넣고, 실패 비용이 큰 항목만 미리 확인하는 방식이 잘 맞을 수 있습니다.',
        borrow: '검토형의 체크리스트와 중간 점검'
      }
    },
    relational_responsiveness: {
      high: {
        label: '관계반응형', short: '관계반응',
        core: '사람의 표정, 말투, 인정, 거리감의 변화를 비교적 빠르게 알아차리는 편입니다. 관계의 분위기가 마음과 의욕에 영향을 주기 때문에 따뜻한 연결 속에서 힘을 얻을 수 있습니다.',
        strength: '상대가 말로 표현하지 않은 불편이나 필요를 빠르게 감지하고, 관계의 온도를 조절하는 힘이 있습니다. 협업이나 돌봄, 고객 응대처럼 사람의 반응을 읽는 장면에서 장점이 드러날 수 있습니다.',
        shadow: '상대의 짧은 반응을 자신의 가치나 관계 전체에 대한 평가로 확대해서 받아들일 수 있습니다. 실제 사실과 자신의 해석을 구분하지 않으면 필요 이상으로 마음이 흔들릴 수 있습니다.',
        relationship: '가까운 사람에게 세심하고 정서적인 연결을 중요하게 여길 가능성이 큽니다. 반면 상대가 표현이 적거나 혼자 있는 시간이 필요한 사람이라면 무관심으로 오해하지 않도록 반응 방식의 차이를 확인하는 것이 필요합니다.',
        work: '협업, 조정, 교육, 서비스처럼 사람의 반응을 살피며 움직이는 일에서 강점을 보입니다. 다만 분위기를 지키기 위해 자신의 의견이나 피로를 계속 뒤로 미루면 감정 소진으로 이어질 수 있습니다.',
        pressure: '모호한 반응이나 냉담함이 오래 남아 의욕까지 흔들 수 있고, 상대의 마음을 확인하려는 생각이 반복될 수 있습니다.',
        recovery: '확인된 사실, 자신의 해석, 바라는 관계를 따로 적어 보고 필요한 경우 직접 묻는 방식이 마음의 소모를 줄일 수 있습니다.',
        borrow: '자기기준형의 사실 확인과 감정 거리두기'
      },
      low: {
        label: '자기기준형', short: '자기기준',
        core: '주변의 인정이나 분위기보다 자신의 판단과 흐름을 비교적 안정적으로 유지하는 편입니다. 외부 반응이 적어도 해야 할 일을 이어가거나 혼자 결정하는 데 큰 어려움이 없을 수 있습니다.',
        strength: '다른 사람의 평가에 지나치게 흔들리지 않고, 독립적으로 집중하고 판단하는 힘이 있습니다. 감정적인 분위기가 강한 상황에서도 문제를 분리해서 볼 수 있습니다.',
        shadow: '자신에게는 중요하지 않은 신호가 상대에게는 관계의 중요한 표현일 수 있습니다. 상대의 감정 변화를 늦게 알아차리면 무관심하거나 차갑다는 인상을 줄 수 있습니다.',
        relationship: '관계에서도 개인의 공간과 각자의 기준을 중요하게 여길 수 있습니다. 상대가 정서적 확인을 원할 때 해결책만 제시하기보다 먼저 감정을 확인해 주는 과정이 도움이 됩니다.',
        work: '독립 판단, 장시간 집중, 외부 평가와 거리를 두어야 하는 일에서 강점을 보입니다. 협업에서는 필요한 정보뿐 아니라 상대가 현재 어떤 상태인지도 짧게 확인하면 소통의 오해를 줄일 수 있습니다.',
        pressure: '관계 요구가 많아지면 거리를 두거나 말을 줄이며 혼자 해결하려는 경향이 강해질 수 있습니다.',
        recovery: '혼자 정리할 시간을 확보하되, 중요한 사람에게는 현재 상태와 필요한 거리를 간단히 설명하는 방식이 관계를 지키는 데 도움이 됩니다.',
        borrow: '관계반응형의 표정·말투·맥락 확인'
      }
    },
    persistence: {
      high: {
        label: '축적형', short: '축적',
        core: '성과가 바로 보이지 않아도 필요하다고 판단한 일은 일정 기간 계속하는 편입니다. 반복과 시행착오를 견디며 작은 진전을 쌓는 과정에서 힘을 발휘할 수 있습니다.',
        strength: '장기 과제, 숙련, 반복 훈련처럼 시간이 필요한 일에서 결과를 만들어 내는 힘이 있습니다. 다른 사람이 중간에 포기할 때 흐름을 유지하는 역할을 맡기도 합니다.',
        shadow: '꾸준함이 강할수록 이미 들인 시간과 노력이 아까워 방향을 바꾸기 어려울 수 있습니다. 계속하는 것이 책임감인지, 중단을 인정하기 어려운 마음인지 구분할 필요가 있습니다.',
        relationship: '관계에서도 쉽게 포기하지 않고 오래 책임지려는 편일 수 있습니다. 다만 관계를 유지한다는 이유로 반복되는 불편이나 불균형을 혼자 감당하지 않는지 살펴볼 필요가 있습니다.',
        work: '장기 프로젝트, 전문성 축적, 반복 개선이 필요한 환경에서 강점을 보입니다. 시작 전에 중간 점검일과 중단 기준을 함께 정하면 꾸준함이 소진으로 바뀌는 것을 줄일 수 있습니다.',
        pressure: '책임감이 강해질수록 쉬지 못하고 버티기만 하며, 도움을 요청하거나 방향을 바꾸는 일을 실패처럼 느낄 수 있습니다.',
        recovery: '완전히 멈추기보다 속도를 낮추고 회복 시간을 일정에 포함하며, 계속할 조건이 남아 있는지 다시 확인하는 방식이 도움이 됩니다.',
        borrow: '전환형의 중단 기준과 방향 재검토'
      },
      low: {
        label: '전환형', short: '전환',
        core: '진전이 보이지 않거나 효율이 낮다고 느껴지면 다른 방법이나 목표로 옮겨가는 편입니다. 막힌 흐름을 오래 붙잡기보다 새로운 선택으로 전환하는 속도가 빠를 수 있습니다.',
        strength: '효율이 낮은 일을 빠르게 알아차리고, 상황에 맞게 방향을 바꾸는 힘이 있습니다. 짧은 주기의 과제나 다양한 경험이 필요한 환경에서 유연성이 장점이 될 수 있습니다.',
        shadow: '축적이 필요한 과정도 충분히 해보기 전에 가능성이 없다고 판단할 수 있습니다. 초반의 지루함과 실제로 중단해야 할 신호를 구분하지 않으면 시작만 반복될 수 있습니다.',
        relationship: '관계의 갈등이 길어지면 문제를 오래 풀기보다 거리를 두거나 다른 관계로 관심을 옮길 수 있습니다. 중요한 관계에서는 한 번 더 대화해 볼 최소 기준을 정해 두는 편이 도움이 됩니다.',
        work: '짧은 주기, 다양한 과제, 빠른 피드백이 있는 환경에서 강점을 보입니다. 큰 목표를 작은 완료 단위로 나누면 변화 욕구를 살리면서도 결과를 남길 수 있습니다.',
        pressure: '진전이 보이지 않으면 여러 일을 동시에 바꾸며 흐름이 흩어지고, 무엇이 문제였는지 확인하기 전에 새 선택으로 넘어갈 수 있습니다.',
        recovery: '모든 것을 새로 시작하기보다 현재 일에서 끝낼 수 있는 가장 작은 단위를 정하고, 그 뒤에 전환 여부를 판단하는 방식이 도움이 됩니다.',
        borrow: '축적형의 작은 반복과 완료 단위'
      }
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

  const CHARACTER = {
    self_direction: {
      label: '자기조율형',
      text: '자신의 기준과 우선순위를 세우고, 결과를 보며 행동을 조정하는 힘이 비교적 두드러집니다. 어려움이 생겨도 자신이 바꿀 수 있는 부분을 찾으려는 태도로 이어질 수 있습니다.',
      strength: '목표를 현실적인 행동으로 나누고 흐트러진 생활을 다시 정리하는 능력이 장점이 될 수 있습니다.',
      caution: '모든 결과를 자신의 책임으로 돌리면 도움을 요청하거나 환경의 한계를 인정하기 어려워질 수 있습니다.',
      direction: '책임져야 할 부분과 혼자 책임질 필요가 없는 부분을 나누는 기준이 중요합니다.'
    },
    cooperation: {
      label: '관계조율형',
      text: '자신의 입장만 유지하기보다 상대의 이유와 공동의 해결점을 함께 살피는 힘이 비교적 두드러집니다. 갈등에서도 관계를 끊기보다 조정할 방법을 찾으려 할 수 있습니다.',
      strength: '서로 다른 요구를 연결하고, 함께 일할 수 있는 현실적인 절충점을 만드는 능력이 장점이 될 수 있습니다.',
      caution: '관계를 지키려는 마음이 강하면 자신의 필요와 한계를 늦게 말하거나 불편을 오래 참을 수 있습니다.',
      direction: '양보할 수 있는 부분과 반드시 지켜야 할 기준을 먼저 구분하는 것이 중요합니다.'
    },
    meaning_orientation: {
      label: '의미연결형',
      text: '현재의 선택을 눈앞의 효율만으로 보지 않고, 장기적으로 어떤 의미와 가치를 남기는지 연결해서 생각하는 힘이 비교적 두드러집니다.',
      strength: '일과 관계에 방향을 부여하고, 어려운 시기에도 왜 이 일을 하는지 다시 찾는 능력이 장점이 될 수 있습니다.',
      caution: '의미를 충분히 느끼지 못하면 해야 할 현실적인 일까지 공허하게 느껴지거나, 큰 방향을 고민하느라 작은 행동이 늦어질 수 있습니다.',
      direction: '중요하게 여기는 가치를 오늘 실행할 수 있는 한 가지 행동으로 번역하는 것이 중요합니다.'
    },
    balanced: {
      label: '균형조율형',
      text: '자기 기준, 타인과의 협력, 삶의 의미를 바라보는 힘이 한쪽에 크게 치우치지 않고 비교적 고르게 나타납니다. 상황에 따라 세 기준을 번갈아 사용할 가능성이 큽니다.',
      strength: '혼자 결정해야 할 때와 함께 조율해야 할 때, 현실적인 목표와 장기적인 의미를 함께 살필 수 있습니다.',
      caution: '여러 기준을 모두 고려하다 보면 무엇을 우선해야 하는지 늦게 정해질 수 있습니다.',
      direction: '현재 상황에서 가장 먼저 지켜야 할 기준이 무엇인지 한 문장으로 정리하는 것이 도움이 됩니다.'
    }
  };

  const ensureObject = (value, message) => {
    if (!value || typeof value !== 'object') throw new Error(message);
    return value;
  };

  const getDomainRows = (calculation) => Object.entries(
    ensureObject(calculation.domains || calculation.categories, '영역별 채점 결과가 없습니다.')
  ).map(([id, value]) => ({ id, ...value }));

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
    return {
      type: 'balance',
      key,
      ...(modules.balanceModules?.[key] || {
        title: '영역별 차이를 함께 살펴봅니다',
        text: '한 영역만으로 전체 성향을 설명하기보다 여러 경향이 어떤 상황에서 함께 작동하는지 보는 편이 좋습니다.'
      })
    };
  };

  const getConfidenceModule = (calculation, modules) => {
    const key = calculation.responseQuality?.level || 'moderate';
    return {
      type: 'confidence',
      key,
      ...(modules.confidenceModules?.[key] || {
        title: '응답 패턴 안내',
        text: '이번 응답에서 나타난 전체적인 흐름과 영역별 차이를 함께 참고해 주세요.'
      })
    };
  };

  const choosePole = (score) => score >= 57 ? 'high' : score <= 43 ? 'low' : 'mixed';

  const mixedAxis = (id, score) => ({
    id,
    score,
    pole: 'mixed',
    label: `${AXES[id].high.short}/${AXES[id].low.short} 혼합형`,
    short: '혼합',
    distance: Math.abs(score - 50),
    core: `${AXES[id].high.short}과 ${AXES[id].low.short} 중 한쪽이 고정적으로 앞서기보다 상황과 역할에 따라 두 방식이 번갈아 나타날 수 있습니다.`,
    strength: `한 가지 방식만 고집하지 않고 상황에 맞게 ${AXES[id].high.short}과 ${AXES[id].low.short}의 장점을 선택할 수 있습니다.`,
    shadow: '상황의 요구가 분명하지 않으면 판단 기준이 자주 바뀌거나, 주변 분위기에 따라 선택이 달라질 수 있습니다.',
    relationship: '관계에서도 한쪽 반응이 고정적이지 않아 상대와 상황에 따라 접근 방식이 달라질 수 있습니다.',
    work: '과제의 성격과 역할이 분명할수록 적절한 반응 방식을 선택하기 쉽습니다.',
    pressure: '압박이 커지면 최근에 익숙해진 한쪽 방식으로 갑자기 치우칠 수 있습니다.',
    recovery: '현재 상황이 요구하는 것이 속도인지 안정인지, 관계인지 독립인지 먼저 구분하면 반응을 선택하기 쉬워집니다.',
    borrow: '상황의 요구를 한 문장으로 정리하는 기준'
  });

  const axisResult = (calculation, id) => {
    const score = calculation.domains[id].percent;
    const pole = choosePole(score);
    if (pole === 'mixed') return mixedAxis(id, score);
    return { id, score, pole, ...AXES[id][pole], distance: Math.abs(score - 50) };
  };

  const characterModifier = (calculation) => {
    const ids = ['self_direction', 'cooperation', 'meaning_orientation'];
    const rows = ids.map((id) => ({ id, score: calculation.domains[id].percent })).sort((a, b) => b.score - a.score);
    const key = rows[0].score - rows[2].score <= 8 ? 'balanced' : rows[0].id;
    return { id: key, score: rows[0].score, ...CHARACTER[key] };
  };

  const createTypeProfile = (calculation) => {
    const axisIds = ['change_response', 'uncertainty_sensitivity', 'relational_responsiveness', 'persistence'];
    const axes = axisIds.map((id) => axisResult(calculation, id));
    const distinct = axes.filter((axis) => axis.pole !== 'mixed').sort((a, b) => b.distance - a.distance);
    const primary = distinct[0];
    const secondary = distinct[1];
    const directKey = primary && secondary ? `${primary.short}|${secondary.short}` : '';
    const sortedKey = primary && secondary ? [primary.short, secondary.short].sort().join('|') : '';
    const title = TYPE_NAMES[directKey] || TYPE_NAMES[sortedKey] || (distinct.length ? `${distinct[0].label} 중심의 상황조정자` : '상황에 따라 조절하는 균형형');
    const modifier = characterModifier(calculation);
    const active = axes.filter((axis) => axis.pole !== 'mixed');
    const explanatoryAxes = active.length ? active : [...axes].sort((a, b) => b.distance - a.distance).slice(0, 2);

    const portrait = active.length
      ? `이번 응답에서는 ${active.map((axis) => axis.label).join(', ')}의 특징이 비교적 분명하게 나타났습니다. 특히 ${primary.label}의 반응이 먼저 나타나고, ${secondary ? `${secondary.label}의 방식이 그 반응을 보완하거나 조절하는 모습` : '상황에 따라 다른 반응이 뒤따르는 모습'}으로 읽을 수 있습니다. ${modifier.text} 이 조합은 한 가지 고정된 성격을 뜻하기보다, 익숙한 상황에서 어떤 반응을 먼저 선택하는지 보여 주는 현재의 경향입니다.`
      : `네 기질 축의 점수 차이가 크지 않아 한쪽 방식이 고정적으로 앞서기보다 상황과 역할에 따라 반응을 조절할 가능성이 큽니다. 익숙한 환경에서는 안정적인 방식을 쓰다가도 필요할 때 새로운 방법을 선택하고, 관계의 요구와 자신의 기준을 번갈아 살필 수 있습니다. ${modifier.text}`;

    const plainSummary = primary
      ? `쉽게 말하면, ${primary.core} 여기에 ${modifier.label}의 특징이 더해져 반응을 실제 행동과 관계 속에서 조절하려는 모습이 나타납니다.`
      : `쉽게 말하면, 정해진 한 유형대로 움직이기보다 상황을 살핀 뒤 필요한 방식을 선택하는 편에 가깝습니다. ${modifier.label}의 특징이 그 선택의 기준으로 작동합니다.`;

    const strengths = explanatoryAxes.map((axis) => axis.strength).slice(0, 4);
    strengths.push(modifier.strength);

    const shadows = explanatoryAxes.map((axis) => axis.shadow).slice(0, 4);
    shadows.push(modifier.caution);

    const relationshipAxis = axes.find((axis) => axis.id === 'relational_responsiveness');
    const relationship = `${relationshipAxis.core} ${relationshipAxis.relationship} ${calculation.domains.cooperation.percent >= 57
      ? '협력성도 함께 높게 나타났기 때문에 갈등을 피하기만 하기보다 서로의 입장을 조정하고 공동의 해답을 찾으려는 경향이 더해질 수 있습니다.'
      : calculation.domains.cooperation.percent <= 43
        ? '협력성은 상대적으로 낮게 나타나 관계의 분위기를 느끼더라도 실제 조율 과정에서는 자신의 방식이나 거리를 선택할 가능성이 있습니다.'
        : '협력성은 중간 범위에 있어 관계의 중요도와 상황에 따라 조율의 정도가 달라질 수 있습니다.'}`;

    const workAxes = axes.filter((axis) => ['change_response', 'uncertainty_sensitivity', 'persistence'].includes(axis.id));
    const work = `${workAxes.map((axis) => axis.work).join(' ')} ${calculation.domains.self_direction.percent >= 57
      ? '자기조절 경향도 비교적 높아 목표와 진행 상황을 스스로 확인하고, 계획이 어긋나면 방법을 다시 조정하는 힘으로 이어질 수 있습니다.'
      : calculation.domains.self_direction.percent <= 43
        ? '자기조절 경향은 상대적으로 낮아 방향이 분명한 외부 구조, 마감, 역할 구분이 있을 때 강점을 더 안정적으로 사용할 수 있습니다.'
        : '자기조절 경향은 중간 범위에 있어 목표의 중요도와 환경의 구조에 따라 실행력이 달라질 수 있습니다.'}`;

    const pressure = `${explanatoryAxes.map((axis) => axis.pressure).join(' ')} 압박이 커졌을 때 평소의 강점이 과도하게 사용되면 같은 행동을 반복하면서도 왜 힘든지 알아차리기 어려울 수 있습니다. 이때는 문제를 한꺼번에 해결하려 하기보다 지금 강해진 반응이 무엇인지 먼저 이름 붙이는 것이 도움이 됩니다.`;

    const recovery = `${explanatoryAxes.map((axis) => axis.recovery).join(' ')} ${modifier.direction} 회복은 자신의 성향을 반대로 바꾸는 일이 아니라, 평소 덜 사용하는 반응을 필요한 만큼 빌려 균형을 되찾는 과정으로 보는 편이 좋습니다.`;

    const directionParts = [];
    if (calculation.domains.change_response.percent >= 57 && calculation.domains.persistence.percent <= 43) directionParts.push('새로운 가능성을 더 찾기 전에 현재 시작한 일 가운데 하나를 골라 작은 완료 단위를 만들어 보는 것이 좋습니다. 중요한 것은 큰 목표를 끝내는 것이 아니라, 끝까지 이어 본 경험을 한 번 남기는 것입니다.');
    if (calculation.domains.uncertainty_sensitivity.percent >= 57 && calculation.domains.self_direction.percent <= 43) directionParts.push('걱정을 없애려고 정보를 계속 모으기보다 지금 결정할 수 있는 가장 작은 행동을 하나 정해 보세요. 추가 확인이 필요한 일과 바로 시작해도 되는 일을 나누면 생각이 행동으로 이어지기 쉬워집니다.');
    if (calculation.domains.relational_responsiveness.percent >= 57 && calculation.domains.cooperation.percent >= 57) directionParts.push('관계를 지키는 일과 자신의 필요를 계속 미루는 일을 구분할 기준이 필요합니다. 상대를 배려하면서도 반드시 말해야 할 한계와 바람을 짧고 분명하게 표현하는 연습이 도움이 될 수 있습니다.');
    if (calculation.domains.persistence.percent >= 57 && calculation.domains.self_direction.percent >= 57) directionParts.push('더 오래 버티는 것만이 답은 아닐 수 있습니다. 시작할 때 중단 기준, 도움을 요청할 시점, 회복 시간을 함께 정하면 꾸준함이 소진으로 바뀌는 것을 줄일 수 있습니다.');
    if (calculation.domains.meaning_orientation.percent >= 57 && calculation.domains.self_direction.percent <= 43) directionParts.push('큰 의미와 방향을 충분히 생각했다면 이제 그것을 오늘 할 수 있는 한 가지 행동으로 옮겨 보는 편이 좋습니다. 의미가 행동으로 연결될 때 결과에 대한 확신도 조금씩 구체화될 수 있습니다.');
    if (!directionParts.length) directionParts.push(primary?.borrow
      ? `지금은 가장 강한 성향을 더 강화하기보다 반대쪽 자원인 ‘${primary.borrow}’을 필요한 만큼 빌려 쓰는 방향이 도움이 됩니다. 강점을 버리는 것이 아니라, 강점이 지나치게 사용될 때 균형을 잡아 줄 작은 기준을 추가하는 것입니다.`
      : '한 가지 유형을 더 분명하게 만들기보다 상황별로 어떤 반응이 실제로 도움이 되었는지 기록해 보세요. 잘된 장면과 힘들었던 장면을 비교하면 자신의 반응을 선택하는 기준이 더 분명해질 수 있습니다.');

    const directionSteps = [
      `최근 한 달 동안 ${primary ? primary.label : '가장 익숙한 반응'}이 도움이 되었던 장면 한 가지를 떠올려 보세요.`,
      '같은 반응이 오히려 일을 어렵게 만든 장면이 있었는지 살펴보세요.',
      '다음 비슷한 상황에서 반대 성향의 자원 가운데 한 가지만 작게 사용해 보세요.'
    ];

    return {
      title, modifier, axes,
      code: axes.map((axis) => axis.label).join(' · '),
      plainSummary, portrait, strengths, shadows, relationship, work, pressure, recovery,
      borrow: explanatoryAxes.map((axis) => axis.borrow).slice(0, 2).join(' · '),
      direction: directionParts.join(' '),
      directionSteps
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
      notice: '유형명은 70개 응답에서 나타난 경향을 쉽게 이해하고 기억하기 위한 해설명입니다. 점수는 다른 사람과 비교한 우열이 아니라 이번 응답 안에서 어떤 반응이 상대적으로 더 두드러졌는지를 보여 줍니다. 이 결과는 의료·상담 목적의 진단이나 표준화 심리검사를 대신하지 않습니다.'
    };
  };

  global.ReScanProfileInterpreter = { interpret, selectDomainModules, resolveState, createTypeProfile };
}(window));