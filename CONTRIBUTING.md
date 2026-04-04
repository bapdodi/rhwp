# Contributing to rhwp

rhwp에 관심을 가져주셔서 감사합니다!

"모두의 한글"은 이름 그대로 모두의 참여로 완성됩니다. 코드 기여, 버그 리포트, 문서 개선, HWP 샘플 파일 제공 — 어떤 형태든 환영합니다.

## 처음 참여하시나요?

### 1. 프로젝트 체험하기

코드를 보기 전에 먼저 사용해보세요:

- **[온라인 데모](https://edwardkim.github.io/rhwp/)** — 브라우저에서 바로 HWP 파일 열기
- **[VS Code 확장](https://marketplace.visualstudio.com/items?itemName=edwardkim.rhwp-vscode)** — VS Code에서 HWP 미리보기
- **[npm 패키지](https://www.npmjs.com/package/@rhwp/editor)** — 3줄로 HWP 에디터 임베드

### 2. 개발 환경 설정 (5분)

```bash
# 클론
git clone https://github.com/edwardkim/rhwp.git
cd rhwp

# 빌드 + 테스트
cargo build
cargo test

# 웹 에디터 실행 (선택)
cd rhwp-studio
npm install
npx vite --port 7700
# http://localhost:7700 에서 확인
```

### 3. 첫 기여 찾기

- [`good first issue`](https://github.com/edwardkim/rhwp/labels/good%20first%20issue) 라벨이 붙은 이슈
- 렌더링 불일치 제보 (한컴과 비교하여 스크린샷 첨부)
- 문서 오타/개선
- [Discussions](https://github.com/edwardkim/rhwp/discussions)에서 질문/아이디어 제안

## 기여 방법

### 버그 리포트

HWP 파일이 한컴과 다르게 렌더링되면 알려주세요:

1. [이슈 생성](https://github.com/edwardkim/rhwp/issues/new?template=bug_report.md)
2. **한컴 스크린샷** + **rhwp 스크린샷** 비교 첨부
3. 가능하면 HWP 파일 첨부 (개인정보 제거 후)

디버깅 정보를 함께 제공하면 수정이 빨라집니다 (아래 "디버깅 가이드" 참고).

### 코드 기여 — Fork & PR 워크플로우

컨트리뷰터는 **Fork 기반**으로 작업합니다. 저장소에 직접 push할 수 없으며, PR을 통해 코드를 제출합니다.

```
[본인 Fork]                              [edwardkim/rhwp]

1. Fork (GitHub UI)
   edwardkim/rhwp → myid/rhwp

2. Clone
   git clone https://github.com/myid/rhwp.git
   cd rhwp

3. 브랜치 생성 + 작업
   git checkout -b fix/issue-123
   (코드 수정 + 테스트)

4. Push (본인 Fork에)
   git push origin fix/issue-123

5. PR 생성 (GitHub UI)                   ──→ devel 브랜치로 PR
                                              CI 자동 실행 (빌드+테스트+Clippy)
                                              메인테이너 코드 리뷰
                                              승인 후 merge
```

**중요:**
- PR 대상 브랜치는 **`devel`** 입니다 (`main` 아님)
- PR을 생성하면 CI가 자동으로 빌드 + 테스트 + Clippy를 실행합니다
- CI가 통과하지 않으면 merge할 수 없습니다
- 메인테이너의 코드 리뷰 승인 후 merge됩니다

### PR 전 체크리스트

```bash
cargo test                       # 783+ 테스트 통과
cargo clippy -- -D warnings      # 린트 경고 0건
```

두 명령이 모두 통과하는지 확인한 후 PR을 생성해주세요.

### HWP 샘플 파일 제공

다양한 HWP 파일로 테스트할수록 렌더링 품질이 올라갑니다. 개인정보가 없는 공공 문서나 테스트용 파일을 제공해주시면 큰 도움이 됩니다.

## 브랜치 규칙

| 브랜치 | 용도 | 보호 규칙 |
|--------|------|----------|
| `main` | 릴리즈 (안정 버전) | PR 필수 + CI 통과 + 리뷰 1명 |
| `devel` | 개발 통합 (PR 대상) | CI 통과 필수 |

- 컨트리뷰터 PR → `devel`
- 릴리즈 시 `devel` → `main` + 태그

## 디버깅 가이드

렌더링 버그를 조사할 때 코드 수정 없이 사용할 수 있는 3종 도구:

```bash
# 1. 문단/표 식별 (디버그 오버레이)
cargo run --bin rhwp -- export-svg sample.hwp --debug-overlay

# 2. 페이지 배치 목록
cargo run --bin rhwp -- dump-pages sample.hwp -p 3

# 3. 특정 문단 상세 (ParaShape, LINE_SEG, 표 속성)
cargo run --bin rhwp -- dump sample.hwp -s 0 -p 45
```

디버그 오버레이는 문단/표에 라벨을 표시합니다:
- 문단: `s{섹션}:pi={인덱스} y={좌표}`
- 표: `s{섹션}:pi={인덱스} ci={컨트롤} {행}x{열} y={좌표}`

이 정보를 이슈에 첨부하면 버그 수정이 빨라집니다.

## 프로젝트 구조

```
src/
├── model/          ← 순수 데이터 구조 (의존성 없음)
├── parser/         ← HWP/HWPX 파일 → 모델 변환
├── document_core/  ← 편집 명령 + 조회 (CQRS)
├── renderer/       ← 레이아웃, 페이지네이션, SVG/Canvas
├── serializer/     ← 모델 → HWP 파일 저장
└── wasm_api.rs     ← WASM 바인딩

rhwp-studio/        ← 웹 에디터 (TypeScript + Vite)
```

의존성 방향: `model` ← `parser` ← `document_core` ← `renderer` ← `wasm_api`

## 코드 스타일

- `cargo clippy -- -D warnings` 경고 0건 (CI에서 강제)
- `unwrap()` 최소화
- 모든 문서는 한국어로 작성

## HWP 단위 참고

- 1 inch = 7,200 HWPUNIT
- 1 mm ≈ 283.465 HWPUNIT

## 소통

- **[Discussions](https://github.com/edwardkim/rhwp/discussions)** — 질문, 아이디어, 기술 토론
- **[Issues](https://github.com/edwardkim/rhwp/issues)** — 버그 리포트, 기능 요청

## Notice

본 제품은 한글과컴퓨터의 한글 문서 파일(.hwp) 공개 문서를 참고하여 개발하였습니다.

## License

이 프로젝트는 [MIT License](LICENSE)로 배포됩니다. 기여하신 코드도 동일한 라이선스가 적용됩니다.
