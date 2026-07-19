#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BOOK = ROOT / "reread" / "the-prince"
FILES = [BOOK / "dedication.html"] + [BOOK / f"chapter-{i:02d}.html" for i in range(1, 27)]
PAIR_RE = re.compile(r'<section class="parallel-pair" id="pair-\d+">.*?</section>', re.S)
KO_RE = re.compile(r'<div class="parallel-ko translation-visible">\s*<span class="language-label">한국어 전문번역</span>(.*?)</div>', re.S)
EN_RE = re.compile(r'<div class="parallel-en original-body">\s*<span class="language-label">ENGLISH</span>(.*?)</div>', re.S)
P_RE = re.compile(r'<p(?:\s[^>]*)?>.*?</p>', re.S)
TAG_RE = re.compile(r'<[^>]+>')


def text_of(html: str) -> str:
    return re.sub(r'\s+', ' ', TAG_RE.sub('', html)).strip()


def is_heading_artifact(p: str) -> bool:
    t = text_of(p)
    letters = ''.join(ch for ch in t if ch.isalpha())
    return bool(t) and len(t.split()) <= 12 and letters and letters.upper() == letters


def make_pair(n: int, ko: str, en: str) -> str:
    return f'''<section class="parallel-pair" id="pair-{n:03d}">
  <header class="parallel-head"><strong>대응 문단 {n:03d}</strong><span>EN · KO</span></header>
  <div class="parallel-ko translation-visible">
<span class="language-label">한국어 전문번역</span>{ko}
  </div>
  <details class="original-fold">
    <summary>
      <span class="language-label">ENGLISH ORIGINAL</span>
      <span class="fold-guide">영문 원문 펼치기·접기</span>
    </summary>
    <div class="parallel-en original-body">
<span class="language-label">ENGLISH</span>{en}
    </div>
  </details>
</section>'''


def process(path: Path) -> dict:
    html = path.read_text(encoding="utf-8-sig")
    pairs = PAIR_RE.findall(html)
    if not pairs:
        return {"file": str(path.relative_to(ROOT)), "status": "no-pairs"}

    ko_ps, en_ps = [], []
    for pair in pairs:
        km = KO_RE.search(pair)
        em = EN_RE.search(pair)
        if km:
            ko_ps.extend(P_RE.findall(km.group(1)))
        if em:
            en_ps.extend(P_RE.findall(em.group(1)))

    removed = []
    while len(en_ps) > len(ko_ps) and en_ps and is_heading_artifact(en_ps[0]):
        removed.append(text_of(en_ps.pop(0)))

    result = {
        "file": str(path.relative_to(ROOT)),
        "ko": len(ko_ps),
        "en": len(en_ps),
        "difference": len(ko_ps) - len(en_ps),
        "removed_heading_artifacts": removed,
    }
    if len(ko_ps) != len(en_ps) or not ko_ps:
        result["status"] = "mismatch"
        return result

    rebuilt = '\n'.join(make_pair(i + 1, ko, en) for i, (ko, en) in enumerate(zip(ko_ps, en_ps)))
    start = html.find(pairs[0])
    end = html.rfind(pairs[-1]) + len(pairs[-1])
    new_html = html[:start] + rebuilt + html[end:]
    new_html = new_html.replace('전문번역 대응판 v1.3.1', '전문번역 문단 대응판 v1.4.0')
    path.write_text(new_html, encoding="utf-8")
    result["status"] = "rewritten"
    result["pairs"] = len(ko_ps)
    return result


def main() -> int:
    report = [process(path) for path in FILES if path.exists()]
    out = BOOK / "paragraph-mapping-report.json"
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
