# W10-03 자기비난 체크리스트 검증 보고서

- 검증일: 2026-07-24
- 대상 데이터: `rescan/data/checklists/self-criticism.json`
- 대상 안내글: `rescan/tistory/self-criticism.html`
- 목록 파일: `rescan/data/index.json`
- 상태: 통과

## 1. 데이터 구조 검증

- `id`: `self-criticism`
- `grade`: `B`
- `mode`: `pattern`
- `status`: `published`
- 응답 척도: 0~3점, 4단계
- 전체 문항: 12개
- 문항 ID: `sc01`~`sc12`, 중복 없음
- 역채점 문항: 4개 (`sc04`, `sc06`, `sc08`, `sc10`)
- 일반채점 문항: 8개

## 2. 영역 배분 검증

| 영역 | 문항 수 | 문항 |
|---|---:|---|
| 내면의 말 | 3 | sc01, sc05, sc09 |
| 실수 해석 | 3 | sc02, sc06, sc10 |
| 비교와 가치 | 3 | sc03, sc07, sc11 |
| 회복 반응 | 3 | sc04, sc08, sc12 |

- 4개 영역에 각 3문항 균등 배분
- 긍정형과 부정형 문항 혼합
- 같은 영역 연속 노출을 줄이는 balanced 순서 정책 적용

## 3. 점수 및 결과 구간 검증

- 가능한 최저점: 0점
- 가능한 최고점: 36점
- 결과 구간:
  - 0~8점
  - 9~17점
  - 18~26점
  - 27~36점
- 구간 중복 없음
- 구간 누락 없음
- 최저점·최고점 일치
- `results`와 `patternResults` 동시 제공
- 현재 `scoring.js`의 pattern 우선 처리 및 기존 results 호환 조건 충족

## 4. 결과 콘텐츠 검증

- 각 결과 단계에 다음 항목 포함:
  - 단계명
  - 설명 문장
  - 성찰 질문 2개
  - 행동 제안 2~3개
- 고점 구간에서 사람의 가치나 성격을 단정하지 않음
- 책임 인정과 자기공격의 차이를 구분함
- 무가치감, 자해 생각, 생활 기능 저하가 있는 경우 즉시 도움을 요청하도록 안전 안내 포함
- 진단 도구가 아니라는 제한 문구 포함

## 5. 영역별 안내 검증

- 4개 영역 각각 `low`, `mid`, `high` 안내 제공
- 영역별 설명이 총점 결과와 충돌하지 않음
- 내면의 말, 실수 해석, 비교와 가치, 회복 반응에 대응하는 구체적 행동 제안 포함

## 6. 안내 HTML 검증

- 모바일 viewport 설정
- 1열 전환 반응형 레이아웃 적용
- 자기비난과 책임 인정의 차이 설명
- 4개 영역 설명 카드 제공
- 5문항 간이점검 제공
- 미응답 차단 처리
- 간이점수 범위 0~15점 처리
- 정식 점검 링크: `/rescan/checklist.html?id=self-criticism`
- 안전 안내 및 비진단 고지 포함

## 7. 목록 연결 검증

- `rescan/data/index.json`에 `self-criticism` 등록
- category: `자기이해`
- mode: `pattern`
- dataPath: `/rescan/data/checklists/self-criticism.json`
- articlePath: `/rescan/tistory/self-criticism.html`
- 검색 키워드: 자기비난, 자책, 내면의말, 실수, 비교, 회복

## 최종 판정

W10-03 자기비난 체크리스트는 데이터 구조, 문항 배분, 역채점, 점수 구간, pattern 호환성, 안내글, 목록 연결 기준을 충족했습니다.
