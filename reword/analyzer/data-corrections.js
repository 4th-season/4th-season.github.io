(()=>{
  const groups=window.RW_GROUPS;
  if(!Array.isArray(groups))return;

  const byId=new Map(groups.map(group=>[group.id,group]));
  const removeAliases={
    RW001:['별일 아니야'],
    RW003:['별거 아니야','별일 아니야'],
    RW031:[],
    RW032:['여기서 멈추자'],
    RW036:['지금은 말하지 말자'],
    RW051:['내가 알아서 할게'],
    RW054:['알아서 해']
  };

  const replaceAliases={
    RW056:{'이 정도는 해요줄 수 있잖아':'이 정도는 해줄 수 있잖아'},
    RW062:{'네가 이해요해요':'네가 이해해요'},
    RW108:{'너를 위해요서야':'너를 위해서야'},
    RW109:{'내가 아니면 누가 말해요줘':'내가 아니면 누가 말해줘'}
  };

  const keywordOverrides={
    RW026:['말해 뭐 해','말해서 뭐 해','말해 봐야 뭐 해'],
    RW029:['설명 안 해','설명하지 않아'],
    RW059:['할 수 있지','해줄 수 있지'],
    RW103:['내 말 들어','내 말을 들어']
  };

  const malformed=[
    /아니야요$/,
    /하자요$/,
    /후회한다요$/,
    /말해요도/,
    /이해요해/,
    /위해요서/,
    /해요줄/,
    /말해요줘/
  ];

  for(const group of groups){
    let aliases=Array.isArray(group.aliases)?group.aliases.slice():[];

    const replacements=replaceAliases[group.id]||{};
    aliases=aliases.map(alias=>replacements[alias]||alias);

    const removals=new Set(removeAliases[group.id]||[]);
    aliases=aliases.filter(alias=>!removals.has(alias));
    aliases=aliases.filter(alias=>!malformed.some(pattern=>pattern.test(alias)));

    const seen=new Set();
    group.aliases=aliases.filter(alias=>{
      const key=String(alias).replace(/\s+/g,'').toLowerCase();
      if(!key||seen.has(key))return false;
      seen.add(key);
      return true;
    });

    if(keywordOverrides[group.id])group.keywords=keywordOverrides[group.id];
  }

  // 대표 표현 자체가 다른 그룹의 유사표현으로 중복 노출되는 경우를 줄인다.
  const canonicalOwner=new Map(groups.map(group=>[
    String(group.canonical||'').replace(/\s+/g,'').toLowerCase(),
    group.id
  ]));
  for(const group of groups){
    group.aliases=(group.aliases||[]).filter(alias=>{
      const key=String(alias).replace(/\s+/g,'').toLowerCase();
      const owner=canonicalOwner.get(key);
      return !owner||owner===group.id;
    });
  }

  // 같은 장면과 같은 기능 순서가 반복되던 대표 표현을 의미 차이에 맞게 분리한다.
  const sceneFunctionOverrides={
    RW006:{
      'S07-03':['F05','F02','F07'],
      'S06-02':['F02','F05','F04'],
      'S04-02':['F04','F13','F07'],
      'S01-03':['F09','F05','F14']
    },
    RW007:{
      'S07-03':['F14','F01','F07'],
      'S06-02':['F04','F02','F14'],
      'S04-02':['F14','F04','F07'],
      'S01-03':['F14','F09','F06']
    },
    RW008:{
      'S07-03':['F10','F04','F06'],
      'S06-02':['F10','F07','F04'],
      'S04-02':['F10','F13','F07'],
      'S01-03':['F09','F10','F06']
    },
    RW009:{
      'S07-03':['F02','F05','F01'],
      'S06-02':['F02','F01','F05'],
      'S04-02':['F05','F04','F13'],
      'S01-03':['F09','F02','F05']
    },
    RW031:{
      'S08-01':['F10','F04','F06'],
      'S08-02':['F10','F06','F04'],
      'S12-02':['F10','F04','F14'],
      'S12-04':['F14','F10','F07']
    },
    RW032:{
      'S08-01':['F10','F14','F07'],
      'S12-04':['F14','F07','F10'],
      'S12-02':['F14','F10','F04'],
      'S04-03':['F13','F07','F14']
    },
    RW033:{
      'S08-01':['F10','F04','F13'],
      'S12-02':['F04','F10','F14'],
      'S04-02':['F04','F13','F07'],
      'S08-02':['F10','F04','F06']
    },
    RW034:{
      'S08-01':['F10','F04','F02'],
      'S12-02':['F10','F04','F14'],
      'S04-02':['F10','F04','F13'],
      'S08-02':['F10','F06','F04']
    },
    RW036:{
      'S12-02':['F04','F10','F14'],
      'S04-02':['F04','F13','F07'],
      'S08-01':['F10','F04','F02'],
      'S11-02':['F06','F04','F07']
    },
    RW051:{
      'S05-01':['F01','F03','F08'],
      'S05-02':['F06','F08','F01'],
      'S05-04':['F09','F06','F08'],
      'S12-04':['F07','F06','F14']
    },
    RW052:{
      'S05-02':['F06','F01','F03'],
      'S05-01':['F01','F03','F06'],
      'S03-02':['F03','F01','F08'],
      'S12-03':['F01','F14','F03']
    },
    RW053:{
      'S05-01':['F01','F03','F08'],
      'S05-02':['F08','F06','F01'],
      'S05-04':['F09','F08','F06'],
      'S12-03':['F14','F01','F03']
    },
    RW054:{
      'S05-01':['F06','F07','F12'],
      'S05-04':['F09','F06','F12'],
      'S12-04':['F07','F14','F06'],
      'S08-02':['F12','F06','F10']
    }
  };

  for(const [groupId,sceneMap] of Object.entries(sceneFunctionOverrides)){
    const group=byId.get(groupId);
    if(!group||!Array.isArray(group.scenes))continue;
    for(const scene of group.scenes){
      if(sceneMap[scene.scene_id])scene.function_ids=sceneMap[scene.scene_id].slice();
    }
  }
})();