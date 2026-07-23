(()=>{
  const data=window.RW_DATA;
  const groups=window.RW_GROUPS;
  if(!data||!Array.isArray(data.situation_groups)||!Array.isArray(groups))return;

  const corrections={
    'S01-03':{title:'불편한 일이 있었지만 사과나 설명이 이어지지 않았다',selection:'상대가 불편함을 드러냈지만 사과·설명·조정이 충분히 이어지지 않은 장면'},
    'S01-04':{title:'같은 실수와 사과가 반복되었지만 행동은 달라지지 않았다',selection:'사과는 있었지만 비슷한 일이 반복되어 신뢰가 약해진 장면'},
    'S02-03':{title:'약속하거나 해주기로 한 일이 이루어지지 않았다',selection:'기대했던 약속·도움·행동이 실제로 이행되지 않은 장면'},
    'S03-03':{title:'같은 사람에게 부탁이나 양보가 반복해서 요구되었다',selection:'부탁이 한쪽에게 계속 몰리거나 거절하기 어려웠던 장면'},
    'S04-02':{title:'지금은 이야기할 준비가 되지 않았다',selection:'감정·피로·시간 부족 때문에 당장은 대화를 이어가기 어려운 장면'},
    'S04-03':{title:'개인적인 질문이나 간섭을 멈춰 달라고 했다',selection:'사생활·선택·관계의 경계를 지켜 달라고 요청한 장면'},
    'S05-02':{title:'함께 결정해야 했지만 한 사람이 결정을 넘겼다',selection:'공동 결정이 필요했지만 판단과 책임이 한쪽으로 넘어간 장면'},
    'S05-03':{title:'의견을 묻는 형식이지만 기대하는 답이 정해져 있었다',selection:'선택권이 있는 것처럼 보였지만 사실상 원하는 답이 정해진 장면'},
    'S06-01':{title:'평소와 다른 모습이 보여 상태를 물었다',selection:'표정·말투·행동이 평소와 달라 이유나 상태를 확인한 장면'},
    'S06-03':{title:'설명하던 사람이 말을 멈추거나 더 말하지 않았다',selection:'설명 도중 포기·회피·피로·불신 중 하나가 나타날 수 있는 장면'},
    'S06-04':{title:'괜찮다고 했지만 표정이나 행동은 계속 달랐다',selection:'말과 비언어적 단서가 일치하지 않아 추가 확인이 필요한 장면'},
    'S08-02':{title:'같은 문제로 여러 번 다투었지만 해결되지 않았다',selection:'같은 주제가 반복되어 피로·체념·회피가 쌓인 장면'},
    'S08-03':{title:'설명했지만 이해받지 못했다고 느꼈다',selection:'말을 이어가도 전달되지 않는다고 느껴 대화를 포기하려는 장면'},
    'S09-04':{title:'한 번의 행동으로 사람 전체가 평가되었다',selection:'특정 행동이나 실수를 근거로 성격·능력·가치 전체가 단정된 장면'},
    'S10-03':{title:'사생활이나 개인 선택에 질문과 조언이 계속 이어졌다',selection:'걱정이나 관심을 이유로 개인 영역에 반복적으로 개입한 장면'},
    'S10-04':{title:'문제 제기가 내용보다 분위기 문제로 돌려졌다',selection:'제기된 문제보다 말투·민감함·분위기를 탓하며 핵심이 흐려진 장면'},
    'S11-02':{title:'만남이나 대화가 구체적 약속 없이 계속 미뤄졌다',selection:'다시 이야기하자는 말은 있었지만 시점과 행동이 정해지지 않은 장면'},
    'S11-04':{title:'관계에서 자신의 중요도나 애정을 확인하고 싶었다',selection:'연락·우선순위·관심의 변화를 느껴 관계의 의미를 확인하려는 장면'},
    'S12-02':{title:'감정을 가라앉힌 뒤 같은 문제를 다시 이야기했다',selection:'대화를 잠시 멈춘 뒤 구체적인 시점에 다시 조정한 장면'},
    'S12-04':{title:'대화가 아니라 관계 자체를 멈추거나 끝내려 했다',selection:'일시 중단이 아니라 관계 지속 여부를 다시 정하려는 장면'}
  };

  const seen=new Set();
  for(const category of data.situation_groups){
    if(!Array.isArray(category.scenes))continue;
    category.scenes=category.scenes.filter(scene=>{
      if(!scene||!scene.id||seen.has(scene.id))return false;
      seen.add(scene.id);
      const fix=corrections[scene.id];
      if(fix){
        scene.title=fix.title;
        scene.selection=fix.selection;
      }
      return true;
    });
  }

  for(const group of groups){
    if(!Array.isArray(group.scenes))continue;
    for(const scene of group.scenes){
      const fix=corrections[scene.scene_id];
      if(fix)scene.scene_title=fix.title;
    }
    group.scene_ids=[...new Set(group.scenes.map(scene=>scene.scene_id).filter(Boolean))];
  }
})();
