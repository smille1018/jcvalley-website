#!/usr/bin/env python3
"""JC Valley 정적 사이트 빌드 스크립트 (의존성 없음).

src/pages/*.html 의 각 페이지에 공통 partial(head/header/footer)을 끼워 넣어
dist/ 에 완성된 HTML을 만든다. assets/ 는 그대로 복사한다.

페이지 파일 맨 위 front-matter 형식:
    <!--
    title: 페이지 제목
    description: 메타 설명
    page: about
    -->

사용법:  python3 build.py
"""
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).parent
SRC = ROOT / "src"
DIST = ROOT / "dist"
SITE_URL = "https://www.jcvalley.co"  # TODO: 실제 도메인 확정 시 교체

FRONT = re.compile(r"\A\s*<!--(.*?)-->\s*", re.S)


def partial(name: str) -> str:
    return (SRC / "partials" / f"{name}.html").read_text(encoding="utf-8")


def parse(text: str):
    meta = {}
    m = FRONT.match(text)
    if m:
        for line in m.group(1).strip().splitlines():
            if ":" in line:
                k, v = line.split(":", 1)
                meta[k.strip()] = v.strip()
        text = text[m.end():]
    return meta, text


def render(tpl: str, ctx: dict) -> str:
    return re.sub(r"\{\{\s*(\w+)\s*\}\}", lambda m: ctx.get(m.group(1), ""), tpl)


def main():
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir()
    shutil.copytree(ROOT / "assets", DIST / "assets")

    head, header, footer = partial("head"), partial("header"), partial("footer")
    urls = []
    for page in sorted((SRC / "pages").glob("*.html")):
        meta, body = parse(page.read_text(encoding="utf-8"))
        slug = page.name
        path = "/" if slug == "index.html" else f"/{slug}"
        ctx = {
            "title": meta.get("title", "JC VALLEY"),
            "description": meta.get("description", ""),
            "page": meta.get("page", page.stem),
            "canonical": SITE_URL + path,
            "site_url": SITE_URL,
        }
        html = (
            render(head, ctx)
            + render(header, ctx)
            + f'<main id="main">\n{body}\n</main>\n'
            + render(footer, ctx)
        )
        # 상대경로로 출력: 도메인 루트든 GitHub Pages 하위 경로(/repo/)든 그대로 동작
        (DIST / slug).write_text(relativize(html), encoding="utf-8")
        urls.append(ctx["canonical"])
        print(f"  built {slug}")

    sitemap = "\n".join(f"  <url><loc>{u}</loc></url>" for u in urls)
    (DIST / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f"{sitemap}\n</urlset>\n",
        encoding="utf-8",
    )
    (DIST / "robots.txt").write_text(
        f"User-agent: *\nAllow: /\n\nSitemap: {SITE_URL}/sitemap.xml\n", encoding="utf-8"
    )
    (DIST / ".nojekyll").write_text("", encoding="utf-8")  # GitHub Pages: 파일 그대로 서빙
    print(f"done → {DIST}")
    build_artifact()


# ---------------------------------------------------------------------------
# 공유용 claude.ai 아티팩트 버전 (dist-artifact/)
#  - 모든 내부 링크를 상대경로로 (아티팩트는 하위 경로에서 서빙됨)
#  - 첫 페이지(index.html)는 아티팩트가 <html>/<head>/<body>를 감싸므로 껍데기 제거
#  - 나머지 페이지는 완전한 HTML 그대로
# ---------------------------------------------------------------------------
ART = ROOT / "dist-artifact"


def relativize(html: str) -> str:
    html = re.sub(r'(href|src)="/"', r'\1="index.html"', html)
    html = re.sub(r'(href|src)="/(?!/)', r'\1="', html)
    return html


def unwrap(html: str) -> str:
    """index.html → 아티팩트 본문: doctype/html/head/body 태그만 걷어내고 내용은 유지."""
    html = re.sub(r"<!DOCTYPE[^>]*>\s*", "", html, flags=re.I)
    # 주의: <header>까지 지우지 않도록 태그 이름 뒤는 공백이나 '>'만 허용
    html = re.sub(r"</?(?:html|head)(?:\s[^>]*)?>\s*", "", html, flags=re.I)
    m = re.search(r"<body([^>]*)>", html, flags=re.I)
    if m:
        attrs = m.group(1)
        html = html[: m.start()] + html[m.end():]
        html = re.sub(r"</body>\s*", "", html, flags=re.I)
        page = re.search(r'data-page="([^"]+)"', attrs)
        if page:  # body의 data-page를 스크립트로 다시 붙임
            html = html.replace(
                "<script>document.documentElement.classList.add('js')</script>",
                "<script>document.documentElement.classList.add('js');"
                f"document.body.dataset.page='{page.group(1)}'</script>",
            )
    # 아티팩트 갤러리 이름 (설명 없이 이름만)
    html = re.sub(r"<title>.*?</title>", "<title>JC VALLEY 홈페이지 시안</title>", html, count=1)
    return html


def build_artifact():
    if ART.exists():
        shutil.rmtree(ART)
    shutil.copytree(DIST / "assets", ART / "assets")
    for page in DIST.glob("*.html"):
        html = relativize(page.read_text(encoding="utf-8"))
        if page.name == "index.html":
            html = unwrap(html)
        (ART / page.name).write_text(html, encoding="utf-8")
    print(f"artifact → {ART}")


if __name__ == "__main__":
    main()
