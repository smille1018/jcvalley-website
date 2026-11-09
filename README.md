# JC VALLEY 웹사이트 (초안)

정적 HTML + Tailwind 멀티페이지 사이트. 콘텐츠는 Drive의 `jcvalley new website 시안.html`, 디자인은 Claude Design의 **JC VALLEY 디자인 시스템**(Guideline v1.0, 2026.09)을 따릅니다: https://claude.ai/artifact/4s7DYEdb2FntpKgwY5Qd1w

- 토큰(색·타입·여백·radius·그림자)은 `assets/css/site.css` 맨 위 `:root`에 원문 값 그대로 있습니다. 새 값을 만들지 말고 토큰을 쓰세요.
- 컴포넌트 클래스는 디자인 시스템과 같은 이름입니다: `.jc-btn`, `.jc-badge`, `.jc-card`, `.jc-input`, `.section-inverse`.
- 로고는 디자인 시스템의 SVG를 그대로 가져왔습니다 (`assets/img/`).
- 지킬 것: 그라디언트·글래스·패턴 금지, 네이비는 히어로·푸터·FUND 블록에만, 섹션 여백 128px, 버튼 radius 10(필 금지), 이모지 금지.

## 구조
```
src/partials/   head · header · footer (모든 페이지 공통)
src/pages/      index · about · partners · operations · portfolio · contact
assets/         css/site.css · js/site.js · img/
build.py        partial 합쳐서 dist/ 생성 + sitemap.xml · robots.txt
```

## 포지셔닝
주력은 **초기 스타트업에 투자하고 함께 만드는 액셀러레이터**입니다. 기관 협력(대학 · 공공 · 협회)은 "파트너십 → 협력 프로그램"으로 뒤에 둡니다.
메뉴: 회사 소개 · 투자 · 육성(`portfolio.html`) · 파트너십(`partners.html`, 하위 `operations.html`) · 지원하기(`contact.html`, `?type=partner`면 파트너십 선택).

## 모션 (assets/js/site.js · site.css "HOME — 모션 그래픽")
| 위치 | 모션 | 참고한 레퍼런스 |
| --- | --- | --- |
| 홈 히어로 | 로고 심볼(열린 원 + 점)을 키운 라인 아트, 서울 → 실리콘밸리 궤적을 따라 점 이동 | 소풍커넥트 라인 아트, Inspora 라인 그래픽 |
| 홈 헤드라인 | 단어가 흐려졌다 선명해지며 교체 | 퓨처플레이 키네틱 타이포, affectUI Blur Crossfade |
| 선언문 | 스크롤만큼 단어가 채워짐 | — |
| 숫자 | 점 450개가 스크롤에 따라 채워짐 | Inspora 기여도 그리드 |
| 창업가 여정 | 스크롤에 따라 선이 그려지고 단계 점등 | — |
| 파트너십 | 가운데 심볼에서 바깥으로 파트너 타일이 퍼짐 | affectUI Integration Grid |

모두 단색 · 라인만 씁니다(디자인 시스템의 그라디언트 · 글래스 금지 준수). 히어로 헤드라인만 타입 스케일 다음 단계(61px)를 씁니다. `prefers-reduced-motion`이면 모두 정지합니다.

## 빌드 / 미리보기
```bash
python3 build.py
python3 -m http.server 4173 --directory dist
```

## 배포 (GitHub Pages)
- 주소: https://smille1018.github.io/jcvalley-website/
- `main` 브랜치에 push하면 GitHub Actions(`.github/workflows/pages.yml`)가 `build.py`를 돌려 자동 배포합니다 (1분 내외).
- 실제 도메인을 연결할 때는 저장소 Settings → Pages → Custom domain에 입력하고, 도메인 등록업체 DNS에 CNAME을 추가합니다.

## 피드백용 공유 링크 (claude.ai 아티팩트, 보조)
`python3 build.py`가 `dist/`(실제 배포용)와 함께 `dist-artifact/`(아티팩트용: 상대경로, 첫 페이지 껍데기 제거)를 만듭니다.
- 공유 링크: https://claude.ai/artifact/KQfXd5eMSmP32rSJLZE9bd (비공개 — 페이지의 Share 메뉴에서 사람을 추가해야 열림)
- 수정 후에는 Claude에게 "아티팩트 다시 게시해줘"라고 하면 같은 링크가 갱신됩니다.

## KR / EN
요소에 `data-en="영문"`을 달면 EN 토글 시 교체됩니다. 입력칸은 `data-en-placeholder`.

## 남은 TODO (코드 내 `TODO` 주석 참고)
- 실제 도메인 (`build.py`의 `SITE_URL`)
- 연락처 이메일·주소·사업자정보 (Batch 1)
- 파트너/포트폴리오 로고 이미지 (Batch 5), 대표 사진·현장 사진 (Batch 6)
- 문의 폼 백엔드 연결 (Formspree / Netlify Forms / Cloudflare Worker 등)
- 운영 배포 전 Tailwind Play CDN → Tailwind CLI 빌드로 교체
- 개인정보처리방침 페이지
