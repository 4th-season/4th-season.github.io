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
NOTE_RE = re.compile(r'^\s*\[\d+\]')
ATTRIBUTION_RE = re.compile(
    r'^(?:Christopher Pitt|Edward Dacre|Italian Proverb|Marriott|W\. K\. Marriott)\.?$',
    re.I,
)
DROP_EN_BODY_RE = re.compile(
    r'^Alexander never did what he said, Cesare never said what he did\.?$',
    re.I,
)
MANUAL_GROUP_SIZES = {
    "chapter-17.html": [7, 2, 1, 2, 13, 10, 14, 3],
    "chapter-18.html": [21, 6, 5, 4, 8, 4, 2],
}


def text_of(html: str) -> str:
    return re.sub(r'\s+', ' ', TAG_RE.sub('', html)).strip()


def visible_len(html: str) -> int:
    return max(1, len(re.sub(r'\s+', '', text_of(html))))


def first_sentence(html_group: list[str]) -> str:
    text = ' '.join(text_of(p) for p in html_group).strip()
    if not text:
        return ''
    parts = re.split(r'(?<=[.!?。])\s+', text, maxsplit=1)
    return parts[0][:240]


def last_sentence(html_group: list[str]) -> str:
    text = ' '.join(text_of(p) for p in html_group).strip()
    if not text:
        return ''
    parts = [p for p in re.split(r'(?<=[.!?。])\s+', text) if p]
    return parts[-1][-240:]


def is_heading_artifact(p: str) -> bool:
    t = text_of(p)
    letters = ''.join(ch for ch in t if ch.isalpha())
    return bool(t) and len(t.split()) <= 14 and letters and letters.upper() == letters


def is_note_or_attribution(p: str) -> bool:
    t = text_of(p)
    return bool(NOTE_RE.match(t) or ATTRIBUTION_RE.fullmatch(t))


def as_source_note(p: str) -> str:
    return re.sub(r'^<p(?:\s[^>]*)?>', '<p class="source-note">', p, count=1)


def fold_notes(paragraphs: list[str]) -> tuple[list[str], int]:
    folded: list[str] = []
    pending_leading: list[str] = []
    count = 0
    for p in paragraphs:
        if is_note_or_attribution(p):
            note = as_source_note(p)
            if folded:
                folded[-1] += note
            else:
                pending_leading.append(note)
            count += 1
            continue
        if pending_leading:
            p += ''.join(pending_leading)
            pending_leading.clear()
        folded.append(p)
    if pending_leading and folded:
        folded[-1] += ''.join(pending_leading)
    return folded, count


def drop_editorial_body(paragraphs: list[str]) -> tuple[list[str], list[str]]:
    kept: list[str] = []
    removed: list[str] = []
    for p in paragraphs:
        if DROP_EN_BODY_RE.fullmatch(text_of(p)):
            removed.append(text_of(p))
            continue
        kept.append(p)
    return kept, removed


def manual_partition(ko_ps: list[str], sizes: list[int], en_count: int) -> list[list[str]]:
    if len(sizes) != en_count:
        raise ValueError(f"manual size count {len(sizes)} != English paragraph count {en_count}")
    if sum(sizes) != len(ko_ps):
        raise ValueError(f"manual size total {sum(sizes)} != Korean paragraph count {len(ko_ps)}")
    groups: list[list[str]] = []
    start = 0
    for size in sizes:
        groups.append(ko_ps[start:start + size])
        start += size
    return groups


def partition_ko(ko_ps: list[str], en_ps: list[str]) -> tuple[list[list[str]], float]:
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
            for start in range(i - 1, used):
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
    return [ko_ps[a:b] for a, b in cuts], dp[m][k] / m


def make_pair(n: int, ko_group: list[str], en: str) -> str:
    return f'''<section class="parallel-pair" id="pair-{n:03d}">
  <header class="parallel-head"><strong>대응 문단 {n:03d}</strong><span>EN · KO</span></header>
  <div class="parallel-ko translation-visible">
<span class="language-label">한국어 전문번역</span>{''.join(ko_group)}
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
    en_ps, en_notes = fold_notes(en_ps)
    ko_ps, ko_notes = fold_notes(ko_ps)
    en_ps, removed_editorial = drop_editorial_body(en_ps)
    result = {
        "file": str(path.relative_to(ROOT)),
        "ko_source_paragraphs": len(ko_ps),
        "en_source_paragraphs": len(en_ps),
        "folded_en_notes": en_notes,
        "folded_ko_notes": ko_notes,
        "removed_heading_artifacts": removed,
        "removed_editorial_body": removed_editorial,
    }
    try:
        if path.name in MANUAL_GROUP_SIZES:
            groups = manual_partition(ko_ps, MANUAL_GROUP_SIZES[path.name], len(en_ps))
            cost = 0.0
            mapping_method = "manual-semantic-boundaries"
        else:
            groups, cost = partition_ko(ko_ps, en_ps)
            mapping_method = "length-partition"
    except ValueError as exc:
        result.update(status="failed", error=str(exc))
        return result
    rebuilt = '\n'.join(make_pair(i + 1, group, en) for i, (group, en) in enumerate(zip(groups, en_ps)))
    start = html.find(pairs[0])
    end = html.rfind(pairs[-1]) + len(pairs[-1])
    new_html = html[:start] + rebuilt + html[end:]
    new_html = re.sub(
        r'영문 원문·한국어 전문번역(?: 문단 대응판| 대응판| 문단 대응 교정판)? v1\.[0-9.]+',
        '영문 원문·한국어 전문번역 문단 대응 교정판 v1.4.2',
        new_html,
    )
    path.write_text(new_html, encoding="utf-8")
    anchors = [
        {
            "pair": i + 1,
            "ko_first": first_sentence(group),
            "en_first": first_sentence([en]),
            "ko_last": last_sentence(group),
            "en_last": last_sentence([en]),
        }
        for i, (group, en) in enumerate(zip(groups, en_ps))
    ]
    result.update(
        status="rewritten",
        pairs=len(en_ps),
        ko_group_sizes=[len(group) for group in groups],
        alignment_cost=round(cost, 4),
        review_priority="manual" if mapping_method.startswith("manual") else "high" if cost > 0.35 else "medium" if cost > 0.18 else "low",
        mapping_method=mapping_method,
        anchors=anchors,
    )
    return result


def main() -> int:
    report = [process(path) for path in FILES if path.exists()]
    (BOOK / "paragraph-mapping-report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if all(r["status"] == "rewritten" for r in report) else 1


if __name__ == "__main__":
    raise SystemExit(main())
