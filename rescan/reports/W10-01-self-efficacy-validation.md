# W10-01 자기효능감 검증 보고서

## 대상 파일
- `rescan/data/checklists/self-efficacy.json`
- `rescan/tistory/self-efficacy.html`
- `rescan/data/index.json`

## 구조 검증
- mode: `scored`
- grade: `A`
- 문항 수: 12
- 응답 척도: 0~3
- 가능한 총점: 0~36
- 결과 구간: 0~8 / 9~17 / 18~26 / 27~36
- 구간 공백 및 중복 없음
- 4개 영역별 3문항 배정
- 긍정형 7문항 역채점, 부담형 5문항 정방향 채점

## 내용 검증
- 시작하기, 문제 해결, 지속과 재시도, 도움과 자원 활용을 분리함
- 능력이나 성취 가능성을 판정하지 않는다는 제한 문구 포함
- 결과 단계별 성찰 질문과 행동 제안 포함
- 영역별 안내 문구 포함
- 참고 문헌 2건 포함

## 화면·연결 검증
- 정식 점검 링크: `/rescan/checklist.html?id=self-efficacy`
- 목록 데이터 경로와 실제 JSON 경로 일치
- 안내 HTML 경로와 목록 경로 일치
- 모바일 1열 전환 CSS 포함
- 간이점검 5문항 미응답 방지 포함

## 판정
W10-01 배포 구조 적합. 실제 GitHub Pages 배포 후 URL 응답과 브라우저 렌더링은 별도 확인 필요.
