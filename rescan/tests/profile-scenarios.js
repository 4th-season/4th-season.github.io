(function (global) {
  'use strict';

  const DOMAIN_IDS = [
    'change_response',
    'uncertainty_sensitivity',
    'relational_responsiveness',
    'persistence',
    'self_direction',
    'cooperation',
    'meaning_orientation'
  ];

  const scoreToAnswer = (question, targetScore) => {
    const normalized = Math.max(0, Math.min(100, Number(targetScore)));
    const scoredValue = Math.max(1, Math.min(5, Math.round(1 + (normalized / 100) * 4)));
    return question.direction === 'reverse' ? 6 - scoredValue : scoredValue;
  };

  const buildAnswers = (profile, targets) => {
    const fallback = 50;
    return Object.fromEntries(profile.questions.map((question) => [
      question.id,
      scoreToAnswer(question, targets[question.domain] ?? fallback)
    ]));
  };

  const scenarios = [
    {
      id: 'balanced-mid',
      label: '균형형 중간 응답',
      description: '모든 영역이 비슷한 수준으로 나타나고 조합 해석이 과도하게 생성되지 않아야 한다.',
      targets: Object.fromEntries(DOMAIN_IDS.map((id) => [id, 50])),
      expect: { balance: ['very_balanced', 'balanced'], maxPairs: 0, quality: ['limited', 'moderate'] }
    },
    {
      id: 'change-persistence-high',
      label: '변화 반응·지속성 동시 높음',
      description: '새로운 시도와 꾸준함이 함께 두드러지는 조합이 선택되어야 한다.',
      targets: {
        change_response: 90,
        uncertainty_sensitivity: 45,
        relational_responsiveness: 50,
        persistence: 90,
        self_direction: 65,
        cooperation: 55,
        meaning_orientation: 50
      },
      expect: { topIncludes: ['change_response', 'persistence'], pairContains: ['change_response', 'persistence'] }
    },
    {
      id: 'change-high-caution-low',
      label: '변화 반응 높음·불확실성 민감성 낮음',
      description: '빠르게 시도하는 경향과 사전 경계가 낮은 조합이 선택되어야 한다.',
      targets: {
        change_response: 90,
        uncertainty_sensitivity: 15,
        relational_responsiveness: 45,
        persistence: 55,
        self_direction: 55,
        cooperation: 50,
        meaning_orientation: 45
      },
      expect: { pairContains: ['change_response', 'uncertainty_sensitivity'], balance: ['contrasted'] }
    },
    {
      id: 'caution-high-selfdirection-high',
      label: '신중함·자기조절 동시 높음',
      description: '위험 점검과 계획 조정이 함께 작동하는 조합이 선택되어야 한다.',
      targets: {
        change_response: 35,
        uncertainty_sensitivity: 90,
        relational_responsiveness: 45,
        persistence: 60,
        self_direction: 90,
        cooperation: 55,
        meaning_orientation: 50
      },
      expect: { topIncludes: ['uncertainty_sensitivity', 'self_direction'], pairContains: ['uncertainty_sensitivity', 'self_direction'] }
    },
    {
      id: 'relationship-cooperation-high',
      label: '관계 반응성·협력성 동시 높음',
      description: '관계 신호에 민감하면서 조율하려는 경향이 함께 해석되어야 한다.',
      targets: {
        change_response: 45,
        uncertainty_sensitivity: 50,
        relational_responsiveness: 90,
        persistence: 50,
        self_direction: 55,
        cooperation: 90,
        meaning_orientation: 60
      },
      expect: { pairContains: ['relational_responsiveness', 'cooperation'] }
    },
    {
      id: 'persistence-high-selfdirection-low',
      label: '지속성 높음·자기조절 낮음',
      description: '오래 붙드는 힘과 방향 조정의 어려움이 함께 나타나는 긴장 조합을 확인한다.',
      targets: {
        change_response: 45,
        uncertainty_sensitivity: 55,
        relational_responsiveness: 50,
        persistence: 90,
        self_direction: 15,
        cooperation: 55,
        meaning_orientation: 50
      },
      expect: { pairContains: ['persistence', 'self_direction'], balance: ['contrasted'] }
    },
    {
      id: 'meaning-cooperation-high',
      label: '의미지향·협력성 동시 높음',
      description: '공동의 가치와 사람 사이의 조율이 연결되는 해석을 확인한다.',
      targets: {
        change_response: 50,
        uncertainty_sensitivity: 45,
        relational_responsiveness: 55,
        persistence: 55,
        self_direction: 60,
        cooperation: 90,
        meaning_orientation: 90
      },
      expect: { pairContains: ['cooperation', 'meaning_orientation'] }
    },
    {
      id: 'contrasted-profile',
      label: '강한 대비형 프로필',
      description: '최고·최저 영역 차이가 크게 나타나 대비형 균형도 문장이 출력되어야 한다.',
      targets: {
        change_response: 95,
        uncertainty_sensitivity: 10,
        relational_responsiveness: 85,
        persistence: 20,
        self_direction: 90,
        cooperation: 30,
        meaning_orientation: 75
      },
      expect: { balance: ['contrasted'], maxPairs: 2 }
    }
  ];

  global.ReScanProfileScenarios = { scenarios, buildAnswers };
}(window));
