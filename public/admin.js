(() => {
  const $ = (selector) => document.querySelector(selector);
  const configuredApiBase = typeof window.DRISHTI_API_BASE === "string" ? window.DRISHTI_API_BASE.trim() : "";
  const isLocalHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const API_BASE = (configuredApiBase || (isLocalHost ? "http://127.0.0.1:8000" : "")).replace(/\/$/, "");
  const configuredApiBase = typeof window.DRISHTI_API_BASE === "string" ? window.DRISHTI_API_BASE.trim() : "";
  const localHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const apiBase = (configuredApiBase || (localHost ? "http://127.0.0.1:8000" : "")).replace(/\/$/, "");
  const tokenKey = "drishti_access_token";
  let token = sessionStorage.getItem(tokenKey) || "";
  const authPanel = $("#auth-panel");
  const dashboard = $("#dashboard");
  const denied = $("#access-denied");
  const api = async (path, options = {}) => {
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    if (token) headers.Authorization = "Bearer " + token;
    const response = await fetch(API_BASE + path, { ...options, headers });
    const raw = await response.text();
    let data = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch {}
    if (!response.ok) throw new Error(data.detail || ("Request failed (" + response.status + ")"));
    return data;
  };
  const showAuthMessage = (message) => { $("#auth-message").textContent = message; };
  const element = (tag, cls, value) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (value !== undefined) node.textContent = value;
    return node;
  };
  async function openDashboard() {
    authPanel.classList.add("hidden");
    denied.classList.add("hidden");
    dashboard.classList.remove("hidden");
    await Promise.all([loadOverview(), loadSos(), loadAlerts()]);
  }
  async function verifySession() {
    if (!token) return;
    try {
      const user = await api("/api/v1/auth/me");
      if (user.role !== "admin") {
        authPanel.classList.add("hidden");
        denied.classList.remove("hidden");
        $("#denied-message").textContent = "Signed in as " + user.email + ", but this account has no admin role. Follow the first-admin setup guide.";
        return;
      }
      await openDashboard();
    } catch (error) {
      token = "";
      sessionStorage.removeItem(tokenKey);
      authPanel.classList.remove("hidden");
      showAuthMessage(error.message);
    }
  }
  $("#login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    showAuthMessage("Signing in…");
    try {
      const result = await api("/api/v1/auth/login", { method: "POST", body: JSON.stringify({ email: $("#email").value, password: $("#password").value }) });
      token = result.access_token;
      sessionStorage.setItem(tokenKey, token);
      const user = await api("/api/v1/auth/me");
      if (user.role !== "admin") {
        token = "";
        sessionStorage.removeItem(tokenKey);
        showAuthMessage("This account is not an administrator. Use the first-admin setup guide.");
        return;
      }
      await openDashboard();
    } catch (error) { showAuthMessage(error.message); }
  });
  async function loadOverview() {
    try {
      const data = await api("/api/v1/admin/overview");
      $("#stat-users").textContent = data.users;
      $("#stat-open").textContent = data.open_sos;
      $("#stat-sos").textContent = data.total_sos;
      $("#stat-alerts").textContent = data.alerts;
    } catch (error) { $("#stat-open").textContent = "—"; $("#sos-list").textContent = error.message; }
  }
  async function loadSos() {
    const root = $("#sos-list");
    root.replaceChildren(element("div", "empty", "Loading SOS requests…"));
    try {
      const items = await api("/api/v1/admin/sos");
      root.replaceChildren();
      if (!items.length) { root.append(element("div", "empty", "No SOS reports have been submitted.")); return; }
      items.forEach((item) => {
        const card = element("article", "card");
        const header = element("div", "panel-head");
        header.append(element("h3", "", item.title));
        header.append(element("span", "pill " + item.urgency, item.urgency));
        card.append(header);
        card.append(element("div", "meta", "From " + item.reporter_email + " · " + item.created_at + " · " + item.status));
        card.append(element("p", "", item.details));
        if (item.source_url) {
          try { const url = new URL(item.source_url); if (["https:", "http:"].includes(url.protocol)) { const a = element("a", "", "Open source ↗"); a.href = url.href; a.target = "_blank"; a.rel = "noreferrer"; card.append(a); } } catch {}
        }
        card.append(element("div", "meta", (item.trusted_contact_ids || []).length + " trusted contact(s) selected. No external message was sent."));
        const form = element("div", "form-grid");
        const statusLabel = element("label", "", "Review status");
        const select = document.createElement("select");
        ["open", "under_review", "resolved", "dismissed"].forEach((value) => { const option = document.createElement("option"); option.value = value; option.textContent = value.replace("_", " "); if (value === item.status) option.selected = true; select.append(option); });
        statusLabel.append(select); form.append(statusLabel);
        const notesLabel = element("label", "", "Reviewer notes");
        const notes = document.createElement("textarea"); notes.value = item.review_notes || ""; notes.maxLength = 2000; notesLabel.append(notes); form.append(notesLabel);
        const save = element("button", "button", "Save review"); save.type = "button";
        save.addEventListener("click", async () => {
          save.disabled = true;
          try { await api("/api/v1/admin/sos/" + encodeURIComponent(item.id), { method: "PATCH", body: JSON.stringify({ status: select.value, review_notes: notes.value }) }); await loadSos(); await loadOverview(); }
          catch (error) { alert(error.message); save.disabled = false; }
        });
        form.append(save); card.append(form); root.append(card);
      });
    } catch (error) { root.replaceChildren(element("div", "empty", error.message)); }
  }
  async function loadAlerts() {
    const root = $("#alert-list");
    try {
      const items = await api("/api/v1/admin/alerts");
      root.replaceChildren();
      if (!items.length) { root.append(element("div", "empty", "No alerts yet.")); return; }
      items.forEach((item) => {
        const card = element("article", "card");
        const top = element("div", "panel-head");
        top.append(element("h3", "", item.title));
        top.append(element("span", "pill " + item.level, item.level));
        card.append(top, element("p", "", item.message), element("div", "meta", item.category + " · " + item.created_at + (item.user_id ? " · targeted" : " · broadcast")));
        root.append(card);
      });
    } catch (error) { root.replaceChildren(element("div", "empty", error.message)); }
  }
  $("#notice-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = $("#notice-message-status");
    status.textContent = "Publishing…";
    try {
      const target = $("#target-id").value.trim();
      await api("/api/v1/admin/alerts", { method: "POST", body: JSON.stringify({ title: $("#notice-title").value, message: $("#notice-message").value, level: $("#notice-level").value, category: "reviewed_notice", target_user_id: target || null }) });
      $("#notice-form").reset();
      status.textContent = "In-app notice published.";
      await Promise.all([loadAlerts(), loadOverview()]);
    } catch (error) { status.textContent = error.message; }
  });
  $("#refresh").addEventListener("click", async () => { await Promise.all([loadOverview(), loadSos(), loadAlerts()]); });
  verifySession();
})();