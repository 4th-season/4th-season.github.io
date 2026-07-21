# WORKPLAN — [Re:Read] 자본론 제1권

## 목표

독일어 제4판(1890) 계열을 기준으로 『자본론』 제1권을 한국어 자체 번역과 독일어 원문이 문단별로 대응하는 완독형 웹 판본으로 제작한다.

## W01 — 기반 확정

- [x] 작업 브랜치 생성
- [x] 기준 판본 1차 확정
- [x] 8부 33장 구조 확인
- [x] SOURCE_MANIFEST.md
- [x] STRUCTURE_MANIFEST.md
- [x] TERMINOLOGY.md 초안
- [ ] 공통 HTML·CSS
- [ ] index.html
- [ ] 제2권·제3권 안내글
- [ ] 작품 독서 가이드
- [ ] 제1장 제1절 원문 문단 경계 확정

## W02 — 제1부 상품과 화폐

- 제1장 상품
- 제2장 교환과정
- 제3장 화폐 또는 상품유통
- 제1장은 절 단위로 분할
- 제1판 부록 「가치형태」의 별도 수록 여부 결정

## W03 — 제2부와 제3부

- 제4장부터 제11장
- 화폐의 자본 전환
- 노동력의 구매와 판매
- 노동과정과 가치증식과정
- 절대적 잉여가치

## W04 — 제4부와 제5부

- 제12장부터 제18장
- 상대적 잉여가치
- 협업
- 분업과 매뉴팩처
- 기계와 대공업

## W05 — 제6부와 제7부

- 제19장부터 제25장
- 임금
- 단순재생산
- 잉여가치의 자본화
- 자본주의적 축적의 일반법칙

## W06 — 제8부

- 제26장부터 제33장
- 이른바 시초축적
- 토지 수탈
- 산업자본가의 형성
- 근대 식민이론

## W07 — 전권 검수와 배포

- 문단 대응 검사
- 첫 문장·마지막 문장 대조
- 각주 유형 구분
- 인용문·표·수치·단위 검수
- 이전·목차·다음 내비게이션 검사
- canonical 및 메타 설명 검사
- sitemap 반영
- 최종 배포

## 파일 구조

```text
reread/capital-volume-1/
├── index.html
├── introduction-volumes-2-and-3.html
├── reading-guide.html
├── prefatory/
├── part-01/
│   ├── index.html
│   ├── chapter-01/
│   │   ├── index.html
│   │   ├── section-01.html
│   │   ├── section-02.html
│   │   ├── section-03.html
│   │   └── section-04.html
│   ├── chapter-02.html
│   └── chapter-03/
├── part-02/ ... part-08/
├── appendix/
├── assets/style.css
├── SOURCE_MANIFEST.md
├── STRUCTURE_MANIFEST.md
├── TERMINOLOGY.md
├── CHAPTER_TEMPLATE.html
├── SECTION_TEMPLATE.html
└── paragraph-mapping-report.json
```

## 장별 완료 조건

1. 독일어 원문 블록과 한국어 번역 블록에 빈칸이 없다.
2. 대응 범위가 모든 블록에 기록되어 있다.
3. 저자 각주·편집자 주·역자 주가 구분되어 있다.
4. 인용문과 표가 본문에서 누락되지 않았다.
5. 첫 문장과 마지막 문장의 의미가 직접 대조되었다.
6. 수치·단위·수식이 원문과 일치한다.
7. 내비게이션과 canonical이 실제 경로와 일치한다.

## 다음 작업 단위

W01-2: 공통 템플릿, CSS, index.html, paragraph-mapping-report.json 생성.
