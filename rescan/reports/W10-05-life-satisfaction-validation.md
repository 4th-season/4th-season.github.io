# W10-05 삶의 만족도 검증 보고서

- 작업일: 2026-07-24
- 대상 데이터: `rescan/data/checklists/life-satisfaction.json`
- 대상 안내 페이지: `rescan/tistory/life-satisfaction.html`
- 목록 파일: `rescan/data/index.json`

## 1. 데이터 구조 검증

- `id`: `life-satisfaction`
- `mode`: `reflection`
- `grade`: `A`
- `status`: `published`
- 공통 계산 엔진의 `reflection` 모드와 호환됨
- `results`와 `reflectionResults`를 함께 제공하여 기존 화면과 성찰형 결과 선택 로직을 모두 지원함

## 2. 문항 검증

- 전체 문항 수: 12
- 응답 척도: 0~3점
- 문항 ID: `ls01`~`ls12`, 중복 없음
- 역채점 문항: 6개
- 각 영역별 문항 수: 3개

| 영역 | 문항 수 | 확인 내용 |
|---|---:|---|
| 생활의 안정 | 3 | 수면·식사·휴식·시간·경제 부담 |
| 관계와 소속감 | 3 | 일상 공유·고립감·비교 반응 |
| 활동과 역할 | 3 | 기여감·역할 부담·몰입 활동 |
| 방향과 의미 | 3 | 중요 가치·방향감·결핍 중심 평가 |

## 3. 점수 구간 검증

가능한 총점은 0~36점이다.

- 0~8점
- 9~17점
- 18~26점
- 27~36점

검증 결과:

- 시작점 0 일치
- 종료점 36 일치
- 구간 중복 없음
- 구간 누락 없음
- `results`와 `reflectionResults`의 구간 및 안내 내용 일치

## 4. 결과 내용 검증

- 행복·성공·삶의 가치를 단일 점수로 판정하지 않음
- 만족과 불만족이 동시에 존재할 수 있다는 성찰형 구조 유지
- 총점보다 네 영역의 차이를 우선해서 읽도록 안내함
- 각 결과 단계에 성찰 질문과 구체적 행동 제안을 포함함
- 높은 부담 구간에서 기본 생활 조건과 지원 연결을 우선하도록 구성함
- 무기력·절망감·자해 사고에 대한 즉시 도움 안내 포함

## 5. 안내 HTML 검증

- 모바일 뷰포트 설정 확인
- 네 영역 카드형 설명 확인
- 만족/불만족 병렬 비교 구성 확인
- 5문항 간이점검 포함
- 간이점검 미응답 차단 확인
- 0~10점 간이 결과 3구간 분기 확인
- 정식 점검 링크: `/rescan/checklist.html?id=life-satisfaction`
- 비표준화·비진단형 자료라는 고지 포함

## 6. 목록 등록 검증

`rescan/data/index.json`에 다음 항목을 등록함.

- `id`: `life-satisfaction`
- `mode`: `reflection`
- `category`: `자기이해`
- `dataPath`: `/rescan/data/checklists/life-satisfaction.json`
- `articlePath`: `/rescan/tistory/life-satisfaction.html`

등록 후 공개 항목 수: 16개

## 7. 남은 검증

실제 GitHub Pages 배포 후 다음 항목은 W10-06 통합 검증에서 확인한다.

- 공개 URL 응답 상태
- 정식 체크리스트 문항 렌더링
- 역채점 및 총점 계산
- 영역별 비율 표시
- 결과·성찰 질문·행동 제안 출력
- 모바일 실제 화면
- 홈 목록 검색과 필터
- sitemap 반영
