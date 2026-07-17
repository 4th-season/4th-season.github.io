(() => {
  "use strict";

  const normalizeTitle = (value) => value
    .replace(/^\s*\[?Re\s*:?\s*Think\]?\s*/i, "")
    .replace(/^\s*현대철학사전\s*[;:·|-]?\s*/i, "")
    .replace(/\s*\|\s*Re\s*:?\s*Think\s*$/i, "")
    .trim();

  const renderHero = () => {
    if (document.querySelector(".rethink-common-hero")) return;

    const originalHeading = document.querySelector("h1");
    const documentTitle = document.title.split("|")[0].trim();
    const rawTitle = originalHeading?.textContent?.trim() || documentTitle;
    const title = normalizeTitle(rawTitle) || "현대철학을 통해 오늘의 삶을 다시 묻다";

    const hero = document.createElement("header");
    hero.className = "rethink-common-hero";
    hero.setAttribute("aria-labelledby", "rethink-common-hero-title");
    hero.innerHTML = `
      <div class="rethink-common-hero__inner">
        <p class="rethink-common-hero__series">Re:Think · 현대철학사전</p>
        <h1 class="rethink-common-hero__title" id="rethink-common-hero-title"></h1>
        <span class="rethink-common-hero__line" aria-hidden="true"></span>
      </div>`;
    hero.querySelector("h1").textContent = title;

    document.body.prepend(hero);
    document.body.classList.add("rethink-common-hero-ready");

    if (originalHeading) {
      originalHeading.setAttribute("aria-hidden", "true");
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderHero, { once: true });
  } else {
    renderHero();
  }
})();
