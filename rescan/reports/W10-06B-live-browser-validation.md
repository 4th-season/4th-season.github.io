# W10-06B 공개 배포·실제 브라우저 검증 보고서

- 작업일: 2026-07-24
- 대상: Re:Scan W10 자기이해 체크리스트 5종
- 공개 기준 주소: `https://4th-season.com`
- 저장소 CNAME: `4th-season.com`

## 1. 검증 대상

- 자기효능감: `self-efficacy`
- 완벽주의: `perfectionism`
- 자기비난: `self-criticism`
- 회복탄력성: `resilience`
- 삶의 만족도: `life-satisfaction`

## 2. 이번 작업에서 추가한 자동 검증

### 브라우저 테스트 스크립트

- 파일: `rescan/tests/w10-live-smoke.mjs`
- 실행 환경: Playwright Chromium
- 공개 배포본을 직접 호출하도록 구성
- 최신 `index.json`과 결과 화면 코드가 배포될 때까지 재시도
- 실패 여부와 화면 캡처를 아티팩트로 저장

### GitHub Actions 워크플로

- 파일: `.github/workflows/rescan-w10-live-smoke.yml`
- main 브랜치의 Re:Scan·sitemap 변경 시 자동 실행
- 수동 실행도 지원
- 최대 20분 제한
- 공개 배포 반영을 최대 4분 동안 확인
- 성공·실패와 관계없이 보고서와 화면 캡처를 14일간 보관

## 3. 자동 검증 항목

### 정적 공개 파일

- Re:Scan 홈 HTTP 200
- `rescan/data/index.json` HTTP 200
- 공개 체크리스트 16개 이상 등록
- index id 중복 없음
- W10 5개 데이터 파일 HTTP 200
- 각 데이터의 id·문항 수·영역 수·척도 수 확인
- 각 문항 id 중복 확인
- 0~36점 결과 구간의 시작·종료·연속성 확인
- 영역별 안내 4개 확인
- 모든 결과 단계의 행동 제안 확인
- W10 안내 HTML 5개 HTTP 200
- 안내 HTML의 정식 점검 링크 확인
- W09·W10 안내 페이지 10개 sitemap 등록 확인

### 데스크톱 브라우저

- 1440×1000 뷰포트
- 홈 검색에서 `자기효능감` 단일 결과 확인
- `자기이해` 분류에 W10 5개 제목 노출 확인
- W10 5개 체크리스트 각각 12문항 렌더링
- 전체 응답 후 결과 화면 전환
- 영역 결과 4개 출력
- 영역별 백분율 진행 막대 출력
- 영역별 low·mid·high 안내 출력
- 성찰 질문 출력
- 행동 제안 출력
- 계산 안내 출력
- 총점 표시 확인
- 각 결과 화면 전체 캡처

### 모바일 브라우저

- 360×800 뷰포트
- 삶의 만족도 12문항 렌더링과 결과 전환
- 문항 화면과 결과 화면의 가로 넘침 여부 확인
- 영역 안내·행동 제안·계산 안내 출력 확인
- 모바일 결과 전체 캡처

### 오류 감시

- 브라우저 console error 수집
- pageerror 수집
- 오류가 한 건이라도 있으면 검증 실패 처리

## 4. 생성 파일

- `rescan/tests/w10-live-smoke.mjs`
- `.github/workflows/rescan-w10-live-smoke.yml`
- `rescan/reports/W10-06B-live-browser-validation.md`

## 5. 현재 확인 상태

- 저장소 반영: 완료
- 자동 검증 실행 조건 구성: 완료
- 커스텀 도메인 설정 파일 확인: 완료
- 현재 작업 환경의 외부 DNS 조회: 실패
- GitHub Actions 실제 실행 결과: 아직 이 보고서에 반영하지 않음

현재 환경에서는 `4th-season.com`을 직접 해석하지 못했으므로 공개 사이트가 정상 또는 비정상이라고 단정하지 않는다. GitHub Actions 실행이 완료되면 저장되는 JSON 보고서와 데스크톱·모바일 캡처를 기준으로 최종 판정한다.

## 6. 다음 확인

- GitHub Actions `ReScan W10 Live Smoke` 실행 결과 확인
- 실패 시 단계별 로그와 캡처 검토
- DNS·배포 지연·데이터·브라우저 오류를 구분해 수정
- 통과 시 W10 공개 검증 완료 처리
