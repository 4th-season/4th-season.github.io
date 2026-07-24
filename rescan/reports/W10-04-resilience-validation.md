# W10-04 회복탄력성 체크리스트 검증 보고서

## 1. 검증 대상

- 데이터: `rescan/data/checklists/resilience.json`
- 안내 페이지: `rescan/tistory/resilience.html`
- 목록: `rescan/data/index.json`
- 정식 점검 주소: `/rescan/checklist.html?id=resilience`

## 2. 데이터 구조 검증

- `id`: `resilience`
- `grade`: `A`
- `mode`: `scored`
- 응답 척도: 0~3점
- 문항 수: 12개
- 역채점 문항: 5개 (`rs03`, `rs05`, `rs06`, `rs08`, `rs10`)
- 총점 범위: 0~36점
- 결과 구간: 0~8 / 9~17 / 18~26 / 27~36
- 결과 구간 중복: 없음
- 결과 구간 누락: 없음
- 문항 ID 중복: 없음
- 미등록 category 참조: 없음

## 3. 영역 균형 검증

| 영역 | 문항 수 | 문항 ID |
|---|---:|---|
| 감정 회복 | 3 | rs01, rs05, rs09 |
| 유연한 대응 | 3 | rs02, rs06, rs10 |
| 관계 자원 | 3 | rs03, rs07, rs11 |
| 의미와 지속 | 3 | rs04, rs08, rs12 |

네 영역을 각각 3문항으로 구성해 특정 영역이 총점을 과도하게 좌우하지 않도록 했다.

## 4. 점수 엔진 호환성

- `scored` 모드는 현재 `ReScanScoring.calculate()` 지원 대상이다.
- 0~3점 척도와 `reverse` 필드는 현재 역채점 공식과 호환된다.
- `results`가 가능한 총점 0~36 전체를 연속적으로 포함한다.
- 각 결과에 `level`, `summary`, `questions`, `actions`를 포함했다.
- `categoryGuides`에 네 category의 `low`, `mid`, `high` 안내를 모두 포함했다.

## 5. 내용 안전성 검증

- 회복탄력성을 고정된 성격, 의지 또는 사람의 가치로 판정하지 않는다.
- 사건의 크기, 건강, 수면, 경제적 조건, 관계와 지원 환경에 따라 결과가 달라질 수 있음을 고지했다.
- 높은 점수 결과에 생활 기능 회복과 주변 도움 연결을 우선하도록 안내했다.
- 무기력, 불안, 절망감, 일상 기능 저하 또는 자해 생각이 있을 때 가까운 사람·지역 정신건강기관·의료 전문가에게 즉시 도움을 요청하도록 안내했다.
- 기존 표준화 척도의 문항을 복제하지 않고 생활 장면 중심의 비진단형 문항으로 별도 구성했다.

## 6. 안내 HTML 검증

- 모바일 viewport 포함
- 650px 이하 단일 열 반응형 적용
- 회복탄력성의 비진단적 의미 설명 포함
- 네 영역 설명 카드 포함
- 5문항 간이점검 포함
- 간이점검 미응답 차단 포함
- 간이점수 0~10점 결과 분기 포함
- 정식 12문항 점검 링크 포함
- 위기 상황 도움 안내 포함
- 참고 자료와 비표준화 검사 고지 포함

## 7. 참고 기반

- Connor, K. M., & Davidson, J. R. T. (2003). Development of a new resilience scale: The Connor-Davidson Resilience Scale (CD-RISC).
- Smith, B. W., et al. (2008). The Brief Resilience Scale: Assessing the Ability to Bounce Back.
- Jung, Y. E., et al. (2012). The Korean version of the Connor-Davidson Resilience Scale: An extended validation.

## 8. 최종 판정

- 데이터 파일: 통과
- 점수 범위: 통과
- 영역 균형: 통과
- 정식 점검 연결: 통과
- 목록 등록: 통과
- 모바일 정적 구조: 통과
- 비진단·안전 문구: 통과

배포 환경에서의 실제 브라우저 로딩과 사용자 상호작용은 W10-06 통합 검증에서 다시 확인한다.
