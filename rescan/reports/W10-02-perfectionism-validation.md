# W10-02 완벽주의 체크리스트 검증 보고서

## 검증 대상
- 데이터: `/rescan/data/checklists/perfectionism.json`
- 안내글: `/rescan/tistory/perfectionism.html`
- 목록: `/rescan/data/index.json`

## 구조 검증
- mode: `pattern`
- grade: `B`
- 문항 수: 12
- 범주 수: 4
- 응답 척도: 0~3
- 가능한 총점: 0~36
- 역채점 문항: pf05, pf06, pf07, pf08
- `results` 포함: 통과
- `patternResults` 포함: 통과
- 결과 구간 연속성: 0~8 / 9~17 / 18~26 / 27~36, 통과

## 내용 검증
- 높은 기준·실수 두려움·시작 지연과 통제·결과 불만족을 각 3문항으로 균형 배치
- 높은 목표 자체를 문제로 단정하지 않고 기준 조절 가능성과 생활 영향을 중심으로 구성
- 진단·성격 판정 표현 배제
- 단계별 성찰 질문과 행동 제안 포함
- 영역별 안내 문구 포함
- 참고 문헌 2건 포함

## 연결 검증
- index id와 JSON id 일치
- dataPath와 실제 파일 경로 일치
- articlePath와 실제 HTML 경로 일치
- 정식 점검 링크: `/rescan/checklist.html?id=perfectionism`
- 기존 scoring.js의 pattern mode 및 역채점 방식과 호환

## 판정
W10-02 완벽주의 체크리스트는 Re:Scan 공개 목록 등록과 계산 구조 적용이 가능한 상태입니다.
