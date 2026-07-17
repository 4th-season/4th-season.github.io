(() => {
  "use strict";

  const group = location.pathname.match(/\/articles\/(resite|reread|rethink)\//)?.[1];
  if (!group) return;

  const configs = {
    resite: { series: "Re:Site · 현대사회 개념사전", prefix: /^\s*\[?Re\s*:?\s*Site\]?\s*/i },
    reread: { series: "Re:Read · 고전 새로 읽기", prefix: /^\s*\[?Re\s*:?\s*Read\]?\s*/i },
    rethink: { series: "Re:Think · 현대철학사전", prefix: /^\s*\[?Re\s*:?\s*Think\]?\s*/i }
  };
  const config = configs[group];

  const normalizeTitle = (value) => value
    .replace(config.prefix, "")
    .replace(/^\s*(현대사회\s*개념사전|현대철학사전|고전\s*새로\s*읽기)\s*[;:·|-]?\s*/i, "")
    .replace(new RegExp(`\\s*\\|\\s*Re\\s*:?\\s*${group.slice(2)}\\s*$`, "i"), "")
    .trim();

  const compactDescription = (value, limit = 90) => {
    const text = value.replace(/\s+/g, " ").trim();
    if (text.length <= limit) return text;
    const sentence = text.match(/^.*?[.!?。](?:\s|$)/)?.[0]?.trim();
    if (sentence && sentence.length >= 45 && sentence.length <= limit) return sentence;
    return `${text.slice(0, limit).replace(/\s+\S*$/, "")}…`;
  };

  const renderHero = () => {
    if (document.querySelector(".series-common-hero")) return;

    const originalHeading = document.querySelector("h1");
    const legacyHero = group === "reread" ? originalHeading?.closest("header.hero") : null;
    const rawTitle = originalHeading?.textContent?.trim() || document.title.split("|")[0].trim();
    const title = normalizeTitle(rawTitle) || "오늘의 삶을 다시 읽는 지식 지도";
    const metaContent = document.querySelector('meta[name="description"]')?.content?.trim() || "";
    const description = compactDescription(metaContent);

    const hero = document.createElement("header");
    hero.className = "series-common-hero";
    hero.setAttribute("aria-labelledby", "series-common-hero-title");
    hero.innerHTML = `<div class="series-common-hero__inner"><p class="series-common-hero__series"></p><div class="series-common-hero__title-slot"></div>${description ? '<p class="series-common-hero__description"></p>' : ""}<span class="series-common-hero__line" aria-hidden="true"></span></div>`;
    hero.querySelector(".series-common-hero__series").textContent = config.series;

    const heading = originalHeading || document.createElement("h1");
    heading.classList.add("series-common-hero__title");
    heading.id = "series-common-hero-title";
    heading.textContent = title;
    heading.removeAttribute("style");
    heading.removeAttribute("aria-hidden");
    hero.querySelector(".series-common-hero__title-slot").replaceWith(heading);

    const descriptionNode = hero.querySelector(".series-common-hero__description");
    if (descriptionNode) descriptionNode.textContent = description;

    document.body.prepend(hero);
    document.body.classList.add(`series-${group}`, "series-common-hero-ready");
    if (legacyHero) legacyHero.classList.add("series-repeated-block");

    document.querySelectorAll(".rta-title-like, [style*='font-size:1.42']").forEach((node) => {
      const candidate = normalizeTitle(node.textContent || "");
      if (candidate && (candidate === title || title.includes(candidate))) node.classList.add("series-repeated-title");
    });

    if (metaContent) {
      const exactMeta = metaContent.replace(/\s+/g, " ").trim();
      document.querySelectorAll("main > p:first-child, article > p:first-child, .rthink-wrap > p:first-child, .rta-wrap > p:first-child").forEach((node) => {
        if ((node.textContent || "").replace(/\s+/g, " ").trim() === exactMeta) node.classList.add("series-repeated-meta");
      });
    }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", renderHero, { once: true });
  else renderHero();
})();
