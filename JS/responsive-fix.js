(() => {
  function syncLayout() {
    const root = document.documentElement;
    root.style.setProperty("--vh", `${window.innerHeight * 0.01}px`);

    // Force a quick reflow pass on history/page cache restores.
    root.classList.add("viewport-sync");
    requestAnimationFrame(() => root.classList.remove("viewport-sync"));

    // Close any open mobile navbar to avoid stale expanded state.
    document.querySelectorAll(".navbar-collapse.show").forEach((el) => {
      if (window.bootstrap?.Collapse) {
        window.bootstrap.Collapse.getOrCreateInstance(el).hide();
      } else {
        el.classList.remove("show");
      }
    });

    // Fix carried horizontal scroll state between page transitions.
    if (window.scrollX !== 0) {
      window.scrollTo({ left: 0, top: window.scrollY, behavior: "auto" });
    }
    document.documentElement.scrollLeft = 0;
    document.body.scrollLeft = 0;
  }

  window.addEventListener("pageshow", syncLayout);
  window.addEventListener("resize", syncLayout);
  document.addEventListener("DOMContentLoaded", syncLayout);

  document.addEventListener("click", (event) => {
    const link = event.target.closest(".navbar .nav-link");
    if (!link) return;
    document.querySelectorAll(".navbar-collapse.show").forEach((el) => {
      if (window.bootstrap?.Collapse) {
        window.bootstrap.Collapse.getOrCreateInstance(el).hide();
      } else {
        el.classList.remove("show");
      }
    });
  });
})();
