(()=>{
  const originalRenderSearch=window.renderSearch;
  if(typeof originalRenderSearch!=='function')return;

  const normalize=s=>String(s||'').toLowerCase().replace(/\s+/g,'').replace(/[._\-~!@#$%^&*()+=?,/\\|:;"'`]/g,'');

  const crisisTerms=['죽고싶어','사라지고싶어','다끝내고싶어','못버티겠어','너무힘들어','살고싶지않아'];
  const restrictedTerms=[
    '성폭행','강간','성추행','성희롱','성착취','몰카','불법촬영','유포하겠다','사진뿌린다','영상뿌린다',
    '죽여버린다','죽여버릴거야','죽이겠다','칼로찌른다','패죽인다','묻어버린다','가만안둔다','찾아가서해친다',
    '납치한다','감금한다','불지른다','폭탄','테러',
    '장애인비하','인종비하','외국인비하','성소수자비하','여성비하','남성비하',
    '몸팔아','창녀','걸레','갈보','보지','자지','씹','개보지','개자지','애미','애비',
    '벗어봐','몸보여줘','사진보내','야한사진','야한영상','자고싶다','한번하자','성관계하자'
  ];

  function isRestricted(value){
    const q=normalize(value);
    if(!q)return false;
    if(crisisTerms.some(term=>q.includes(term)))return false;
    return restrictedTerms.some(term=>q.includes(normalize(term)));
  }

  function renderRestricted(value){
    const app=document.getElementById('app');
    if(!app)return;
    const prog=document.querySelectorAll('#prog span');
    prog.forEach((x,i)=>x.classList.toggle('active',i===0));
    app.innerHTML=`<section class="panel"><div class="kicker">분석 제한</div><h2>이 표현은 분석하지 않습니다</h2><p class="helper">이 표현은 관계의 의미를 비교하기보다 안전과 경계를 먼저 살펴야 할 수 있어 분석 대상에서 제외됩니다. 반복적이거나 상습적으로 사용된다면 전문가의 도움이 필요할 수 있습니다. 다른 표현을 입력해 주세요.</p><div class="actions"><span></span><button class="btn primary" type="button" id="restrictedReset">다른 표현 검색하기</button></div></section>`;
    document.getElementById('restrictedReset')?.addEventListener('click',()=>originalRenderSearch(''));
  }

  window.renderSearch=function(value=''){
    if(isRestricted(value)){
      renderRestricted(value);
      return;
    }
    return originalRenderSearch(value);
  };
})();
