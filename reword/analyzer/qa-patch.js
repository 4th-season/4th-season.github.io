(()=>{
  const previousRenderSearch=window.renderSearch;
  const previousSetRel=window.setRel;

  function patchSearchCopy(){
    const input=document.getElementById('expressionSearch');
    if(!input)return;
    input.placeholder='궁금한 말을 입력하세요';
    const panel=input.closest('.panel');
    if(!panel)return;
    const title=panel.querySelector('h2');
    const helper=panel.querySelector(':scope > .helper');
    if(title)title.textContent='어떤 말이 궁금하세요?';
    if(helper)helper.textContent='궁금한 말을 입력한 뒤, 가까운 유사언어나 대표 표현군을 선택합니다.';
  }

  if(typeof previousRenderSearch==='function'){
    window.renderSearch=function(value=''){
      const q=String(value||'');
      if(typeof S!=='undefined'&&S.gid&&q.trim()!==String(S.shown||'').trim()){
        S.gid=null;
        S.shown=null;
        S.scene=null;
        S.customScene=null;
        S.sceneTitle=null;
        S.rel={};
        S.del=[];
        S.emo=[];
      }
      const result=previousRenderSearch(q);
      patchSearchCopy();
      return result;
    };
  }

  if(typeof previousSetRel==='function'){
    window.setRel=function(questionId,optionId,score){
      previousSetRel(questionId,optionId,score);
      if(typeof S!=='undefined'&&typeof enable==='function'){
        enable(Object.keys(S.rel||{}).length>=4);
      }
    };
  }

  patchSearchCopy();
})();
