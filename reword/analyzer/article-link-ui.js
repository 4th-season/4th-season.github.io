(()=>{
  const originalRenderResult=window.renderResult;
  if(typeof originalRenderResult!=='function')return;
  const normalize=value=>String(value||'').replace(/^표현:\s*/,'').trim();
  const esc=value=>String(value||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  function selectedGroup(expression){
    const groups=window.RW_GROUPS||[];
    if(typeof S!=='undefined'&&S?.gid){
      const found=groups.find(group=>group.id===S.gid);
      if(found)return found;
    }
    const key=String(expression||'').replace(/\s+/g,'').toLowerCase();
    return groups.find(group=>{
      const terms=[group.canonical,...(group.aliases||[])];
      return terms.some(term=>String(term||'').replace(/\s+/g,'').toLowerCase()===key);
    })||null;
  }

  function appendLinks(){
    const links=window.RW_ARTICLE_LINKS||{};
    const situationLinks=window.RW_SITUATION_ARTICLE_LINKS||{};
    const app=document.getElementById('app');
    if(!app)return;
    const chip=[...app.querySelectorAll('.chip')].find(el=>el.textContent.trim().startsWith('표현:'));
    const expression=normalize(chip?.textContent||'');
    const article=links.expressions?.[expression];
    const group=selectedGroup(expression);
    const situationArticle=group?.source_group?situationLinks[String(group.source_group)]:null;
    const emotionIndex=links.emotionIndex;
    if(!article&&!situationArticle&&!emotionIndex)return;

    const box=document.createElement('section');
    box.className='q article-links-box';
    box.innerHTML=`<div class="qt">이어 읽기</div><p class="helper">분석 결과를 정답처럼 받아들이기보다, 표현·상황·감정을 함께 비교해 보세요.</p><div class="grid article-links-grid">${article?`<a class="card" href="${esc(article.url)}" target="_blank" rel="noopener noreferrer"><strong>이 표현 자세히 읽기</strong><small>${esc(article.title)}</small></a>`:''}${situationArticle?`<a class="card" href="${esc(situationArticle.url)}" target="_blank" rel="noopener noreferrer"><strong>비슷한 상황 읽기</strong><small>${esc(situationArticle.title)}</small></a>`:''}${emotionIndex?`<a class="card" href="${esc(emotionIndex.url)}" target="_blank" rel="noopener noreferrer"><strong>관련 감정 찾아보기</strong><small>${esc(emotionIndex.title)}</small></a>`:''}</div>`;
    const actions=app.querySelector('.panel > .actions');
    if(actions)actions.before(box);else app.querySelector('.panel')?.appendChild(box);
  }

  window.renderResult=function(){
    originalRenderResult();
    appendLinks();
  };
})();
