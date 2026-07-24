# W11-01 사회적 연결감 검증 보고서

- 작업일: 2026-07-24
- 대상 데이터: `rescan/data/checklists/social-connectedness.json`
- 대상 안내 페이지: `rescan/tistory/social-connectedness.html`
- 목록 파일: `rescan/data/index.json`

## 1. 개념 경계 검토

사회적 연결감은 관계의 수만이 아니라 다음 요소를 함께 살펴보는 개념으로 구성했다.

- 관계와 역할의 구조
- 관계가 제공하는 연락·지원 기능
- 관계와 상호작용의 질
- 소속감과 내 자리가 있다는 주관적 경험
- 연결이 줄어든 뒤 다시 이어 가는 행동

객관적으로 접촉과 관계가 적은 `사회적 고립`과, 현재 연결이 원하거나 필요한 연결에 미치지 못한다고 느끼는 `외로움`을 같은 상태로 처리하지 않았다. 혼자 보내는 시간이 많더라도 만족할 수 있고, 주변 사람이 많더라도 외로울 수 있다는 점을 안내문과 고지문에 반영했다.

## 2. 문헌 검토

문항을 그대로 복제하지 않고 개념 경계와 영역 구성을 검토하는 데 다음 자료를 사용했다.

- Russell, Peplau & Cutrona (1980), *The Revised UCLA Loneliness Scale: Concurrent and Discriminant Validity Evidence*
- Lee & Robbins (1995), *Measuring Belongingness: The Social Connectedness and the Social Assurance Scales*
- WHO Commission on Social Connection (2025), *From loneliness to social connection: charting a path to healthier societies*
- CDC (2024), *Social Connection*

WHO와 CDC의 구조·기능·질 구분, 외로움과 사회적 고립의 구분을 영역 설계와 설명에 반영했다. Lee와 Robbins의 소속감·연결감 개념은 `소속감과 내 자리` 영역의 출발점으로 참고했다.

## 3. 데이터 구조 검증

- `schemaVersion`: `1.2.0`
- `id`: `social-connectedness`
- `grade`: `B`
- `mode`: `reflection`
- `status`: `published`
- 응답 기간: 최근 4주
- `contentReview.status`: `literature-reviewed`
- `results`와 `reflectionResults` 동시 제공

## 4. 문항 검증

- 전체 문항 수: 12
- 문항 ID: `cn01`~`cn12`, 중복 없음
- 응답 척도: 0~3점
- 역채점 문항: 7개
- 각 영역별 문항 수: 3개

| 영역 | 문항 수 | 확인 내용 |
|---|---:|---|
| 연락 가능한 관계 | 3 | 안부 교환, 연락 대상, 응답 기대 가능성 |
| 소속감과 내 자리 | 3 | 참여할 자리, 배제감, 있는 모습으로 머물 수 있는 공간 |
| 일상 공유와 함께하는 활동 | 3 | 소소한 일 공유, 공동 시간, 정기 활동 |
| 고립 신호와 재연결 | 3 | 연결 감소 인식, 연락 지연, 사람·공간·활동 탐색 |

검토 결과:

- 한 문항에 서로 다른 결과 행동을 과도하게 결합하지 않음
- 친구 수와 모임 수를 직접 점수화하지 않음
- 가족·친구·동료 등 특정 관계 형태를 필수로 전제하지 않음
- 온라인 또는 대면 연결 중 하나만 정상적인 방식으로 제시하지 않음
- 지원 부족을 개인의 성격이나 관계 능력 부족으로 해석하지 않음

## 5. 점수 구간 검증

가능한 총점은 0~36점이다.

- 0~8점: 연결 자원이 비교적 유지
- 9~17점: 일부 연결 장면에서 빈틈
- 18~26점: 단절감과 고립 신호가 누적
- 27~36점: 안전한 연결과 지원 확인을 우선

검증 결과:

- 시작점 0 일치
- 종료점 36 일치
- 구간 중복 없음
- 구간 누락 없음
- `results`와 `reflectionResults`의 구간 일치
- 모든 단계에 성찰 질문과 행동 제안 포함
- 결과 구간이 임상적 절단점이나 인구 규준이 아니라는 고지 포함

## 6. 안전성과 해석 검증

- 외로움·사회적 고립·우울증 진단으로 표현하지 않음
- 높은 점수를 관계 능력이나 사람의 가치 문제로 설명하지 않음
- 건강, 이동, 시간, 비용, 돌봄, 지역 환경 등 연결 조건을 함께 안내함
- 높은 부담 구간에서 개인 연락처뿐 아니라 지역기관·의료·상담 자원을 포함함
- 심한 절망감, 일상 기능 저하, 자해 사고가 있는 경우 즉각적인 도움을 우선하도록 안내함

## 7. 안내 HTML 검증

- 모바일 뷰포트 설정 확인
- 사회적 고립과 외로움 비교 설명 포함
- 네 영역 카드형 설명 포함
- 5문항 간이점검 포함
- 미응답 차단 포함
- 0~10점 간이 결과 3단계 분기
- 정식 점검 링크: `/rescan/checklist.html?id=social-connectedness`
- 비표준화·비진단형 자료와 자체 결과 구간 고지 포함

## 8. 목록 등록 검증

`rescan/data/index.json`에 다음 항목을 등록했다.

- `id`: `social-connectedness`
- `title`: `사회적 연결감`
- `mode`: `reflection`
- `category`: `관계`
- `dataPath`: `/rescan/data/checklists/social-connectedness.json`
- `articlePath`: `/rescan/tistory/social-connectedness.html`

등록 후 공개 체크리스트 수: 17개

## 9. 제한사항과 다음 검증

이번 검토는 문헌 기반 내용 검토와 정적 구조 검증이다. 다음은 완료되지 않았다.

- 전문가 패널 CVI
- 사용자 인지면접
- 내적 합치도와 재검사 신뢰도
- 탐색적·확인적 요인분석
- 인구집단별 규준화

W11-06 통합 검증에서 공개 URL, 결과 계산, 검색·분류, sitemap을 점검하고 W11-07에서 5종 전체 문항의 내용타당성과 브라우저 완주를 다시 확인한다.
