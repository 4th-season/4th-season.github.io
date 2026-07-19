#!/usr/bin/env python3
from __future__ import annotations

import json
import math
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


def visible_len(html: str) -> int:
    return max(1, len(re.sub(r'\s+', '', text_of(html))))


def is_heading_artifact(p: str) -> bool:
    t = text_of(p)
    letters = ''.join(ch for ch in t if ch.isalpha())
    return bool(t) and len(t.split()) <= 14 and letters and letters.upper() == letters


def partition_ko(ko_ps: list[str], en_ps: list[str]) -> tuple[list[list[str]], float]:
    """Order-preserving DP partition: every EN paragraph receives >=1 KO paragraph."""
    k, m = len(ko_ps), len(en_ps)
    if k < m or m == 0:
        raise ValueError("not enough Korean paragraphs")

    ko_len = [visible_len(p) for p in ko_ps]
    en_len = [visible_len(p) for p in en_ps]
    prefix = [0]
    for n in ko_len:
        prefix.append(prefix[-1] + n)
    ratio = prefix[-1] / max(1, sum(en_len))

    inf = float('inf')
    dp = [[inf] * (k + 1) for _ in range(m + 1)]
    prev = [[-1] * (k + 1) for _ in range(m + 1)]
    dp[0][0] = 0.0

    for i in range(1, m + 1):
        min_used = i
        max_used = k - (m - i)
        expected = max(1.0, en_len[i - 1] * ratio)
        for used in range(min_used, max_used + 1):
            start_min = i - 1
            start_max = used - 1
            for start in range(start_min, start_max + 1):
                if dp[i - 1][start] == inf:
                    continue
                actual = prefix[used] - prefix[start]
                rel = abs(actual - expected) / expected
                group_size = used - start
                cost = rel * rel + 0.006 * max(0, group_size - 1)
                candidate = dp[i - 1][start] + cost
                if candidate < dp[i][used]:
                    dp[i][used] = candidate
                    prev[i][used] = start

    if dp[m][k] == inf:
        raise ValueError("partition failed")

    cuts = []
    used = k
    for i in range(m, 0, -1):
        start = prev[i][used]
        cuts.append((start, used))
        used = start
    cuts.reverse()
    groups = [ko_ps[a:b] for a, b in cuts]
    normalized_cost = dp[m][k] / m
    return groups, normalized_cost


def make_pair(n: int, ko_group: list[str], en: str) -> str:
    ko = ''.join(ko_group)
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
    while en_ps and is_heading_artifact(en_ps[0]):
        removed.append(text_of(en_ps.pop(0)))

    result = {
        "file": str(path.relative_to(ROOT)),
        "ko_source_paragraphs": len(ko_ps),
        "en_source_paragraphs": len(en_ps),
        "removed_heading_artifacts": removed,
    }

    try:
        groups, cost = partition_ko(ko_ps, en_ps)
    except ValueError as exc:
        result.update(status="failed", error=str(exc))
        return result

    rebuilt = '\n'.join(make_pair(i + 1, group, en) for i, (group, en) in enumerate(zip(groups, en_ps)))
    start = html.find(pairs[0])
    end = html.rfind(pairs[-1]) + len(pairs[-1])
    new_html = html[:start] + rebuilt + html[end:]
    new_html = new_html.replace('전문번역 대응판 v1.3.1', '전문번역 문단 대응판 v1.4.0')
    path.write_text(new_html, encoding="utf-8")

    result.update(
        status="rewritten",
        pairs=len(en_ps),
        ko_group_sizes=[len(group) for group in groups],
        alignment_cost=round(cost, 4),
        review_priority="high" if cost > 0.35 else "medium" if cost > 0.18 else "low",
    )
    return result


def main() -> int:
    report = [process(path) for path in FILES if path.exists()]
    out = BOOK / "paragraph-mapping-report.json"
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if all(r["status"] == "rewritten" for r in report) else 1


if __name__ == "__main__":
    raise SystemExit(main())
