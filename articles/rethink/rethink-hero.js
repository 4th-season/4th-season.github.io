(() => {
  "use strict";

  const normalizeTitle = (value) => value
    .replace(/^\s*\[?Re\s*:?\s*Think\]?\s*/i, "")
    .replace(/^\s*현대철학사전\s*[;:·|-]?\s*/i, "")
    .replace(/\s*\|\s*Re\s*:?\s*Think\s*$/i, "")
    .trim();

  const compactDescription = (value, limit = 90) => {
    const text = value.replace(/\s+/g, " ").trim();
    if (text.length <= limit) return text;

    const firstSentence = text.match(/^.*?[.!?。](?:\s|$)/)?.[0]?.trim();
    if (firstSentence && firstSentence.length >= 45 && firstSentence.length <= limit) {
      return firstSentence;
    }

    return `${text.slice(0, limit).replace(/\s+\S*$/, "")}…`;
  };

  const renderHero = () => {
    if (document.querySelector(".rethink-common-hero")) return;

    const originalHeading = document.querySelector("h1");
    const documentTitle = document.title.split("|")[0].trim();
    const rawTitle = originalHeading?.textContent?.trim() || documentTitle;
    const title = normalizeTitle(rawTitle) || "현대철학을 통해 오늘의 삶을 다시 묻다";
    const metaContent = document.querySelector('meta[name="description"]')?.content?.trim() || "";
    const description = compactDescription(metaContent);

    const hero = document.createElement("header");
    hero.className = "rethink-common-hero";
    hero.setAttribute("aria-labelledby", "rethink-common-hero-title");
    hero.innerHTML = `
      <div class="rethink-common-hero__inner">
        <p class="rethink-common-hero__series">Re:Think · 현대철학사전</p>
        <div class="rethink-common-hero__title-slot"></div>
        ${description ? '<p class="rethink-common-hero__description"></p>' : ""}
        <span class="rethink-common-hero__line" aria-hidden="true"></span>
      </div>`;

    const titleSlot = hero.querySelector(".rethink-common-hero__title-slot");
    const heroHeading = originalHeading || document.createElement("h1");
    heroHeading.classList.add("rethink-common-hero__title");
    heroHeading.id = "rethink-common-hero-title";
    heroHeading.textContent = title;
    heroHeading.removeAttribute("style");
    heroHeading.removeAttribute("aria-hidden");
    titleSlot.replaceWith(heroHeading);

    const descriptionNode = hero.querySelector(".rethink-common-hero__description");
    if (descriptionNode) descriptionNode.textContent = description;

    document.body.prepend(hero);
    document.body.classList.add("rethink-common-hero-ready");

    document.querySelectorAll(".rta-title-like").forEach((node) => {
      if (normalizeTitle(node.textContent || "") === title) {
        node.classList.add("rethink-repeated-title");
      }
    });

    if (metaContent) {
      document.querySelectorAll(".rthink-wrap > p:first-child, .rta-wrap > p:first-child").forEach((node) => {
        const nodeText = (node.textContent || "").replace(/\s+/g, " ").trim();
        if (nodeText === metaContent.replace(/\s+/g, " ").trim()) {
          node.classList.add("rethink-repeated-meta");
        }
      });
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderHero, { once: true });
  } else {
    renderHero();
  }
})();
