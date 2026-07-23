(()=>{
  const groups=Array.isArray(window.RW_GROUPS)?window.RW_GROUPS:[];
  const expressionLinks=window.RW_ARTICLE_LINKS?.expressions||{};
  const situationLinks=window.RW_SITUATION_ARTICLE_LINKS||{};
  const normalize=v=>String(v||'').replace(/\s+/g,'').toLowerCase();
  const byUrl=new Map();
  const addUrl=(kind,key,item)=>{
    if(!item?.url)return;
    const list=byUrl.get(item.url)||[];
    list.push({kind,key,title:item.title||''});
    byUrl.set(item.url,list);
  };
  Object.entries(expressionLinks).forEach(([key,item])=>addUrl('expression',key,item));
  Object.entries(situationLinks).forEach(([key,item])=>addUrl('situation',key,item));

  const expressionMissing=[];
  const expressionTitleMismatch=[];
  const expressionOrphans=[];
  const canonicalSet=new Set(groups.map(g=>normalize(g.canonical)));

  for(const group of groups){
    const item=expressionLinks[group.canonical];
    if(!item){
      expressionMissing.push({id:group.id,canonical:group.canonical,source_group:group.source_group});
      continue;
    }
    if(!normalize(item.title).includes(normalize(group.canonical))){
      expressionTitleMismatch.push({id:group.id,canonical:group.canonical,title:item.title,url:item.url});
    }
  }
  for(const [key,item] of Object.entries(expressionLinks)){
    if(!canonicalSet.has(normalize(key)))expressionOrphans.push({key,title:item.title,url:item.url});
  }

  const sourceGroups=[...new Set(groups.map(g=>String(g.source_group||'')).filter(Boolean))].sort((a,b)=>Number(a)-Number(b));
  const situationMissing=sourceGroups.filter(id=>!situationLinks[id]).map(id=>({source_group:id,expressions:groups.filter(g=>String(g.source_group)===id).map(g=>g.canonical)}));
  const situationOrphans=Object.entries(situationLinks).filter(([id])=>!sourceGroups.includes(String(id))).map(([id,item])=>({source_group:id,title:item.title,url:item.url}));
  const duplicateUrls=[...byUrl.entries()].filter(([,items])=>items.length>1).map(([url,items])=>({url,items}));

  const report={
    generated_at:new Date().toISOString(),
    totals:{
      groups:groups.length,
      expression_links:Object.keys(expressionLinks).length,
      source_groups:sourceGroups.length,
      situation_links:Object.keys(situationLinks).length,
      expression_missing:expressionMissing.length,
      expression_title_mismatch:expressionTitleMismatch.length,
      expression_orphans:expressionOrphans.length,
      situation_missing:situationMissing.length,
      situation_orphans:situationOrphans.length,
      duplicate_urls:duplicateUrls.length
    },
    expression_missing:expressionMissing,
    expression_title_mismatch:expressionTitleMismatch,
    expression_orphans:expressionOrphans,
    situation_missing:situationMissing,
    situation_orphans:situationOrphans,
    duplicate_urls:duplicateUrls
  };
  window.RW_LINK_QA=report;

  const root=document.getElementById('qa');
  if(!root)return;
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const section=(title,rows,render)=>`<section><h2>${esc(title)} <small>${rows.length}</small></h2>${rows.length?`<div class="list">${rows.map(render).join('')}</div>`:'<p class="ok">문제 없음</p>'}</section>`;
  root.innerHTML=`
    <section class="summary"><h1>Re:Word 연결 QA</h1><p>현재 대표 표현 데이터와 실제 연결 파일을 대조한 결과입니다.</p><div class="stats">${Object.entries(report.totals).map(([k,v])=>`<div><strong>${esc(v)}</strong><span>${esc(k)}</span></div>`).join('')}</div></section>
    ${section('개별 표현 연결 누락',expressionMissing,r=>`<article><b>${esc(r.id)} · ${esc(r.canonical)}</b><span>source_group ${esc(r.source_group)}</span></article>`)}
    ${section('개별 글 제목 불일치',expressionTitleMismatch,r=>`<article><b>${esc(r.canonical)}</b><span>${esc(r.title)}</span><a href="${esc(r.url)}" target="_blank" rel="noopener">열기</a></article>`)}
    ${section('대표 표현에 없는 고아 연결',expressionOrphans,r=>`<article><b>${esc(r.key)}</b><span>${esc(r.title)}</span><a href="${esc(r.url)}" target="_blank" rel="noopener">열기</a></article>`)}
    ${section('상황형 연결 누락',situationMissing,r=>`<article><b>source_group ${esc(r.source_group)}</b><span>${esc(r.expressions.join(' · '))}</span></article>`)}
    ${section('사용되지 않는 상황형 연결',situationOrphans,r=>`<article><b>source_group ${esc(r.source_group)}</b><span>${esc(r.title)}</span><a href="${esc(r.url)}" target="_blank" rel="noopener">열기</a></article>`)}
    ${section('중복 주소',duplicateUrls,r=>`<article><b>${esc(r.url)}</b><span>${esc(r.items.map(x=>`${x.kind}:${x.key}`).join(' · '))}</span></article>`)}
    <section><h2>JSON 보고서</h2><pre>${esc(JSON.stringify(report,null,2))}</pre></section>`;
})();