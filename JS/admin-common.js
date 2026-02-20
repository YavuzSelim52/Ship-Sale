(() => {
  function normalizeImage(src) {
    if (!src) return "/images/ship1.JPG";
    if (src.startsWith("/") || src.startsWith("http://") || src.startsWith("https://")) return src;
    return `/${src}`;
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    window.location.href = "/admin/login";
  }

  document.querySelectorAll("[data-admin-logout]").forEach((btn) => {
    btn.addEventListener("click", logout);
  });

  const active = document.body.getAttribute("data-admin-nav");
  if (active) {
    const link = document.querySelector(`[data-admin-link="${active}"]`);
    if (link) link.classList.add("active");
  }

  window.AdminCommon = {
    normalizeImage
  };
})();
