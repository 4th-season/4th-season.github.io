(()=>{
  const originalRenderSearch=window.renderSearch;
  if(typeof originalRenderSearch!=='function'||!Array.isArray(window.RW_GROUPS))return;

  const emotionUrl='https://4th-season.tistory.com/20';
  const preferred=['괜찮아','됐어','그래','아무것도 아니야','별일 아니야','그냥 넘어가','말해 뭐 해','말해도 몰라','그만하자','여기까지 하자','나중에 얘기하자','네가 알아서 해','아무거나','네가 정해','마음대로 해','네가 이해해','네가 참아','누구는 잘하던데','남들은 다 해','너만 왜 그래','그게 뭐 대단한 거야','그 정도는 누구나 해','예민하게 굴지 마','유난 떨지 마','내가 걱정돼서 그래','내 말 들어','너를 위해서야','사랑하니까 하는 말이야'];
  const byCanonical=new Map(window.RW_GROUPS.map(group=>[group.canonical,group]));
  const featured=preferred.map(text=>byCanonical.get(text)).filter(Boolean);
  const featuredIds=new Set(featured.map(group=>group.id));
  for(const group of window.RW_GROUPS){
    if(featured.length>=28)break;
    if(!featuredIds.has(group.id)){featured.push(group);featuredIds.add(group.id)}
  }
  const allGroups=window.RW_GROUPS.slice().sort((a,b)=>String(a.canonical).localeCompare(String(b.canonical),'ko'));
  const escHome=value=>String(value||'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const card=group=>`<button class="card entry-language-card" onclick='pick(${JSON.stringify(group.id)},${JSON.stringify(group.canonical)})'><strong>${escHome(group.canonical)}</strong><small>대표 상황 ${Array.isArray(group.scenes)?group.scenes.length:0}개</small></button>`;

  function addStyles(){
    if(document.getElementById('entry-home-style'))return;
    const style=document.createElement('style');
    style.id='entry-home-style';
    style.textContent=`
      .entry-shortcuts{display:grid;grid-template-columns:1.4fr 1fr;gap:12px;margin:16px 0 24px}
      .entry-shortcut{display:block;padding:18px 20px;border:1px solid #d5dfca;border-radius:18px;background:#f7faF3;text-decoration:none;color:inherit}
      .entry-shortcut strong{display:block;font-size:1.05rem;margin-bottom:6px}.entry-shortcut small{display:block;line-height:1.55;color:#596454}
      .entry-search-box{margin-top:26px;padding:20px;border:1px solid #d9dfd2;border-radius:18px;background:#faf9f4}
      .entry-search-box .qt{margin-bottom:5px}.entry-all summary{cursor:pointer}.entry-language-card{text-align:left}
      @media(max-width:700px){.entry-shortcuts{grid-template-columns:1fr}.entry-shortcut{padding:16px}.entry-search-box{padding:16px}}
    `;
    document.head.appendChild(style);
  }

  function renderEntryHome(){
    addStyles();
    const featuredHtml=featured.map(card).join('');
    const allHtml=allGroups.map(card).join('');
    const content=`
      <div class="entry-shortcuts">
        <a class="entry-shortcut" href="#representative-languages"><strong>대표 언어에서 선택하기</strong><small>자주 쓰이는 관계의 말을 먼저 살펴보고 바로 분석을 시작합니다.</small></a>
        <a class="entry-shortcut" href="${emotionUrl}" target="_blank" rel="noopener noreferrer"><strong>감정어 바로가기</strong><small>감정문해사전 가나다에서 지금 마음에 가까운 감정어를 찾아봅니다.</small></a>
      </div>
      <div id="representative-languages" class="q"><div class="qt">대표 언어</div><p class="helper">궁금한 말을 누르면 해당 표현을 선택한 상태로 다음 단계로 이동할 수 있습니다.</p><div class="grid">${featuredHtml}</div></div>
      <details class="q entry-all"><summary class="qt">전체 대표 언어 펼쳐보기</summary><p class="helper">가나다순으로 전체 대표 표현을 확인합니다.</p><div class="grid">${allHtml}</div></details>
      <div class="entry-search-box"><div class="qt">목록에 없는 말 검색</div><p class="helper">대표 언어에 없거나 실제로 들은 표현이 조금 다르면 그대로 입력해 주세요. 가까운 유사언어와 대표 표현군을 찾아줍니다.</p><input id="entryExpressionSearch" class="search" placeholder="예: 됐어, 네가 알아서 해, 말해 뭐 해" autocomplete="off"></div>`;
    app.innerHTML=panel('1단계 · 표현','어떤 말이 궁금하세요?','대표 언어를 직접 선택하거나, 목록에 없는 말은 검색해서 시작합니다.',content,false,false);
    const input=document.getElementById('entryExpressionSearch');
    input?.addEventListener('input',event=>{
      const value=event.target.value;
      if(value.trim())originalRenderSearch(value);
    });
  }

  window.renderSearch=function(q=''){
    if(!String(q||'').trim())renderEntryHome();
    else originalRenderSearch(q);
  };

  if(typeof S!=='undefined'&&S.step===0&&!S.gid)renderEntryHome();
})();