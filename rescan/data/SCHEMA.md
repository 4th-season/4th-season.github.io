# Re:Scan 데이터 규격 1.0

## 목록 파일
`index.json`은 홈 카드와 데이터 탐색에 사용한다.

필수 필드: `schemaVersion`, `series`, `section`, `items`.

각 항목 필수 필드: `id`, `title`, `subtitle`, `grade`, `mode`, `category`, `status`, `dataPath`.

상태값:
- `planned`: 준비 중이며 실행 페이지로 이동시키지 않는다.
- `sample`: 규격 검증용 샘플이다.
- `published`: 공개 가능한 정식 데이터다.
- `hidden`: 목록에 표시하지 않는다.

## 체크리스트 파일
필수 필드:
- 기본 정보: `schemaVersion`, `id`, `series`, `section`, `grade`, `mode`, `status`, `title`, `subtitle`, `description`, `period`
- 문항 구조: `categories`, `scale`, `questions`
- 결과 구조: `results`, `disclaimer`, `relatedLinks`

문항 필수 필드: `id`, `category`, `text`, `reverse`.

결과 구간 필수 필드: `min`, `max`, `level`, `summary`.

## 등급과 mode
- A: `scored` — 점수 구간과 생활 신호 수준을 제공한다.
- B: `pattern` — 점수보다 반복 패턴과 영역 해석을 강조한다.
- C: `reflection` — 공식 점수보다 체크 항목과 성찰 질문을 중심으로 한다.
- D: `guide` — 점수 계산을 사용하지 않고 도움 안내를 제공한다.

## 결과 구간 규칙
- 첫 구간의 `min`은 가능한 최저점과 같아야 한다.
- 마지막 구간의 `max`는 가능한 최고점과 같아야 한다.
- 구간 사이에 빈틈이나 중복이 없어야 한다.
- `guide` mode는 점수 구간 대신 안내 단계만 사용한다.

## 필수값 누락 처리
- 목록의 필수값이 빠지면 해당 카드를 표시하지 않는다.
- 체크리스트의 기본 정보가 빠지면 실행하지 않고 데이터 오류 안내를 표시한다.
- 문항·척도·결과 구간이 비어 있으면 계산을 중단한다.
- 알 수 없는 `grade`, `mode`, `status` 값은 오류로 처리한다.
- `relatedLinks`가 비어 있는 것은 허용한다.

모든 JSON 파일은 UTF-8로 저장하며 한글, 가운데점, 대괄호 등 특수문자를 그대로 사용한다.
