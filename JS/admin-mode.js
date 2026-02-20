(() => {
  const path = window.location.pathname.toLowerCase();
  const isAdminArea = path.startsWith("/admin/");
  if (!isAdminArea || path === "/admin/login") {
    return;
  }

  document.body.classList.add("admin-mode");
  document.body.setAttribute("data-admin-mode", "1");

  const adminRoutes = new Map([
    ["/", "/admin/home"],
    ["/index.html", "/admin/home"],
    ["/listings.html", "/admin/listings"],
    ["/about.html", "/admin/about"],
    ["/contact.html", "/admin/contact"],
    ["/ship.html", "/admin/ship"],
    ["/admin.html", "/admin/panel"],
    ["/admin", "/admin/panel"]
  ]);

  const links = document.querySelectorAll("a[href]");
  links.forEach((link) => {
    const href = link.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) {
      return;
    }

    let url;
    try {
      url = new URL(href, window.location.origin);
    } catch {
      return;
    }

    if (url.origin !== window.location.origin) {
      return;
    }

    const targetPath = url.pathname.toLowerCase();
    if (targetPath.startsWith("/admin/")) {
      return;
    }

    const mapped = adminRoutes.get(targetPath);
    if (!mapped) {
      return;
    }

    url.pathname = mapped;
    link.setAttribute("href", `${url.pathname}${url.search}${url.hash}`);
  });

  if (document.getElementById("adminModeBar")) {
    return;
  }

  const bar = document.createElement("div");
  bar.id = "adminModeBar";
  bar.className = "admin-mode-bar";
  bar.innerHTML = `
    <span>Admin Alani Aktif</span>
    <div class="admin-mode-actions">
      <a href="/admin/panel" class="btn btn-sm btn-light">Admin Panel</a>
      <button type="button" class="btn btn-sm btn-danger" id="adminModeLogout">Cikis</button>
    </div>
  `;
  document.body.appendChild(bar);

  const logoutBtn = document.getElementById("adminModeLogout");
  logoutBtn?.addEventListener("click", async () => {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    window.location.href = "/admin/login";
  });
})();
