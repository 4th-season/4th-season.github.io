(()=>{
  const full='하나의 말은 여러 상황에서 서로 다르게 쓰이고 다르게 해설될 수 있습니다. 이 도구는 가능한 장면을 비교해 보는 참고일 뿐, 상대의 속마음이나 관계의 깊은 의미를 단정하지 않습니다. 말을 고를 때도, 들을 때도 한 번 더 살펴보세요.';
  const brief='같은 말도 상황에 따라 다르게 쓰일 수 있습니다. 이 안내를 깊은 의미나 확정된 해석으로 받아들이지 마세요.';
  function notice(text,strong){
    const box=document.createElement('div');
    box.className='notice reword-guide-notice';
    box.innerHTML=strong?`<strong>${strong}</strong><br>${text}`:text;
    return box;
  }
  function apply(){
    const app=document.getElementById('app');
    if(!app)return;
    app.querySelectorAll('.reword-guide-notice').forEach(x=>x.remove());
    const kicker=app.querySelector('.kicker')?.textContent||'';
    const helper=app.querySelector('.helper');
    if(kicker.includes('1단계')){
      helper?.after(notice(full,'이 도구의 안내'));
    }else if(kicker.includes('3단계')||kicker.includes('4단계')||kicker.includes('5단계')){
      helper?.after(notice(brief));
    }else if(kicker.includes('6단계')){
      const h2=app.querySelector('h2');
      if(h2)h2.textContent=h2.textContent.replace('이렇게 작동했을 가능성이 있습니다','이런 방식으로도 읽힐 수 있습니다');
      helper?.after(notice(full,'결과를 단정하지 마세요'));
      const actions=app.querySelector('.actions');
      actions?.before(notice('말하는 사람은 같은 표현이 다르게 들릴 수 있음을 살피고, 듣는 사람은 한 문장만으로 상대의 의도와 관계 전체를 판단하지 않는 것이 좋습니다.','말을 고를 때도, 들을 때도 주의해 주세요'));
    }
  }
  const app=document.getElementById('app');
  if(app)new MutationObserver(apply).observe(app,{childList:true,subtree:true});
  apply();
})();