(() => {
  const $ = (selector) => document.querySelector(selector);
  const configuredApiBase = typeof window.DRISHTI_API_BASE === "string" ? window.DRISHTI_API_BASE.trim() : "";
  const localHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const apiBase = (configuredApiBase || (localHost ? "http://127.0.0.1:8000" : "")).replace(/\/$/, "");
  const tokenKey = "drishti_access_token";
  let token = sessionStorage.getItem(tokenKey) || "";
  const authPanel = $("#auth-panel");
  const dashboard = $("#dashboard");
  const denied = $("#access-denied");
  let lastSosReports = [];
  let lastNetworkIndicators = [];
  const api = async (path, options = {}) => {
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    if (token) headers.Authorization = "Bearer " + token;
    const response = await fetch(apiBase + path, { ...options, headers });
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
    await Promise.all([loadOverview(), loadSos(), loadCases(), loadAlerts(), loadNetworkIndicators(), loadUsers(), loadAudit()]);
  }
  async function verifySession() {
    if (!token) return;
    try {
      const user = await api("/api/v1/auth/me");
      if (!["superadmin", "admin"].includes(user.role)) {
        authPanel.classList.add("hidden");
        denied.classList.remove("hidden");
        $("#denied-message").textContent = "Signed in as " + user.email + ", but this account does not have Superadmin access. Follow the first-Superadmin setup guide.";
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
      if (!["superadmin", "admin"].includes(user.role)) {
        token = "";
        sessionStorage.removeItem(tokenKey);
        showAuthMessage("This account is not the Superadmin account. Use the first-Superadmin setup guide.");
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
      $("#stat-network").textContent = data.network_indicators ?? 0;
      $("#stat-cases-open").textContent = data.open_cases ?? 0;
    } catch (error) { $("#stat-open").textContent = "—"; $("#sos-list").textContent = error.message; }
  }
  async function loadSos() {
    const root = $("#sos-list");
    root.replaceChildren(element("div", "empty", "Loading SOS requests…"));
    try {
      const items = await api("/api/v1/admin/sos");
      lastSosReports = items;
      renderGlobalMap();
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
        if (item.location_shared && Number.isFinite(Number(item.latitude)) && Number.isFinite(Number(item.longitude))) {
          const lat = Number(item.latitude);
          const lon = Number(item.longitude);
          card.append(element("div", "meta", "GPS snapshot shared by the user for this SOS only · " + lat.toFixed(5) + ", " + lon.toFixed(5) + (item.location_accuracy_m ? " · ±" + Math.round(item.location_accuracy_m) + " m" : "")));
          const mapLink = element("a", "map-open-link", "Open shared incident location ↗");
          mapLink.href = "https://www.openstreetmap.org/?mlat=" + encodeURIComponent(lat) + "&mlon=" + encodeURIComponent(lon) + "#map=15/" + encodeURIComponent(lat) + "/" + encodeURIComponent(lon);
          mapLink.target = "_blank"; mapLink.rel = "noreferrer"; card.append(mapLink);
        }
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

  function renderGlobalMap() {
    const root = $("#global-map-markers");
    if (!root) return;
    root.replaceChildren();
    const NS = "http://www.w3.org/2000/svg";
    const points = [];
    lastSosReports.forEach((item) => {
      if (item.location_shared && Number.isFinite(Number(item.latitude)) && Number.isFinite(Number(item.longitude))) {
        points.push({ kind: "gps", lat: Number(item.latitude), lon: Number(item.longitude), label: "User-consented SOS location · " + item.title });
      }
    });
    lastNetworkIndicators.forEach((item) => {
      if (item.latitude !== null && item.longitude !== null && Number.isFinite(Number(item.latitude)) && Number.isFinite(Number(item.longitude))) {
        points.push({ kind: "ioc", lat: Number(item.latitude), lon: Number(item.longitude), label: item.indicator_type.toUpperCase() + " indicator · " + item.indicator + (item.location_label ? " · " + item.location_label : "") });
      }
    });
    points.forEach((point) => {
      const x = ((point.lon + 180) / 360) * 1000;
      const y = ((90 - point.lat) / 180) * 470;
      const marker = document.createElementNS(NS, "circle");
      marker.setAttribute("cx", String(Math.max(7, Math.min(993, x))));
      marker.setAttribute("cy", String(Math.max(7, Math.min(463, y))));
      marker.setAttribute("r", point.kind === "gps" ? "7" : "6");
      marker.setAttribute("class", point.kind === "gps" ? "map-marker-gps" : "map-marker-ioc");
      const title = document.createElementNS(NS, "title");
      title.textContent = point.label + " · " + point.lat.toFixed(4) + ", " + point.lon.toFixed(4);
      marker.append(title);
      root.append(marker);
    });
    const gpsCount = points.filter((point) => point.kind === "gps").length;
    const iocCount = points.filter((point) => point.kind === "ioc").length;
    $("#map-summary").textContent = points.length
      ? gpsCount + " user-consented incident location(s) · " + iocCount + " manually geolocated public indicator(s). Coordinates are snapshots or analyst estimates, not live tracking."
      : "No mapped records yet. SOS locations appear only after a user opts in; IOC locations require analyst-supplied approximate coordinates.";
  }

  async function loadCases() {
    const root = $("#case-list");
    root.replaceChildren(element("div", "empty", "Loading evidence case files…"));
    try {
      const items = await api("/api/v1/admin/cases");
      root.replaceChildren();
      if (!items.length) { root.append(element("div", "empty", "No user case files have been submitted yet.")); return; }
      items.forEach((item) => {
        const card = element("article", "card");
        const header = element("div", "panel-head");
        header.append(element("h3", "", item.title));
        header.append(element("span", "pill " + (item.status === "verified_false" ? "high" : "medium"), item.status.replace(/_/g, " ")));
        card.append(header);
        card.append(element("div", "meta", item.category.replace(/_/g, " ").toUpperCase() + " · " + item.source_platform.toUpperCase() + " · " + item.reporter_email + " · " + item.created_at));
        card.append(element("p", "", item.claim_text));
        if (item.source_url) {
          try { const url = new URL(item.source_url); if (["https:", "http:"].includes(url.protocol)) { const a=element("a","map-open-link","Open submitted source ↗"); a.href=url.href; a.target="_blank"; a.rel="noreferrer"; card.append(a); } } catch {}
        }
        const form = element("div", "form-grid");
        const statusLabel = element("label", "", "Reviewer outcome");
        const select = document.createElement("select");
        ["under_review", "verified_false", "supported_by_sources", "misleading_context", "insufficient_evidence", "closed"].forEach((value) => {
          const option = document.createElement("option"); option.value=value; option.textContent=value.replace(/_/g," ");
          if (value===item.status) option.selected=true; select.append(option);
        });
        statusLabel.append(select); form.append(statusLabel);
        const evidenceLabel = element("label", "", "Evidence summary (required for verified outcomes)");
        const evidence = document.createElement("textarea"); evidence.maxLength=3000; evidence.value=item.evidence_summary || ""; evidence.placeholder="Summarise what primary sources establish, and what remains uncertain."; evidenceLabel.append(evidence); form.append(evidenceLabel);
        const sourcesLabel = element("label", "", "Evidence source URLs · one per line");
        const sources = document.createElement("textarea"); sources.maxLength=6000; sources.value=(item.evidence_sources || []).join("\n"); sources.placeholder="https://official-source.example/notice"; sourcesLabel.append(sources); form.append(sourcesLabel);
        const notesLabel = element("label", "", "Internal reviewer notes");
        const notes = document.createElement("textarea"); notes.maxLength=3000; notes.value=item.reviewer_notes || ""; notesLabel.append(notes); form.append(notesLabel);
        const save = element("button", "button", "Save case review"); save.type="button";
        save.addEventListener("click", async () => {
          save.disabled=true;
          try {
            const evidenceSources=sources.value.split(/\r?\n/).map((value)=>value.trim()).filter(Boolean);
            await api("/api/v1/admin/cases/"+encodeURIComponent(item.id), {method:"PATCH", body:JSON.stringify({status:select.value,evidence_summary:evidence.value,evidence_sources:evidenceSources,reviewer_notes:notes.value})});
            await Promise.all([loadCases(),loadOverview(),loadAudit()]);
          } catch(error) { alert(error.message); save.disabled=false; }
        });
        form.append(save); card.append(form); root.append(card);
      });
    } catch (error) { root.replaceChildren(element("div", "empty", error.message)); }
  }

  async function loadNetworkIndicators() {
    const root = $("#network-list");
    try {
      const items = await api("/api/v1/admin/network-indicators");
      lastNetworkIndicators = items;
      renderGlobalMap();
      root.replaceChildren();
      if (!items.length) { root.append(element("div", "empty", "No network indicators recorded yet.")); return; }
      items.forEach((item) => {
        const card = element("article", "card");
        const header = element("div", "panel-head");
        header.append(element("h3", "", item.indicator));
        header.append(element("span", "pill " + item.severity, item.severity));
        card.append(header);
        card.append(element("div", "meta", item.indicator_type.toUpperCase() + " · " + item.status.replace("_", " ") + " · " + item.source_label));
        if (item.location_label || item.country) card.append(element("div", "meta", [item.location_label, item.country].filter(Boolean).join(" · ") + " · approximate GeoIP / analyst location"));
        if (item.latitude !== null && item.longitude !== null) card.append(element("div", "meta", "Map point: " + Number(item.latitude).toFixed(4) + ", " + Number(item.longitude).toFixed(4)));
        if (item.notes) card.append(element("p", "", item.notes));
        const actions = element("div", "actions");
        const select = document.createElement("select");
        ["under_review", "confirmed", "false_positive"].forEach((status) => {
          const option = document.createElement("option"); option.value = status;
          option.textContent = status.replace("_", " "); if (status === item.status) option.selected = true;
          select.append(option);
        });
        const save = element("button", "button secondary", "Update status"); save.type = "button";
        save.addEventListener("click", async () => {
          save.disabled = true;
          try {
            await api("/api/v1/admin/network-indicators/" + encodeURIComponent(item.id), { method: "PATCH", body: JSON.stringify({ status: select.value }) });
            await Promise.all([loadNetworkIndicators(), loadOverview(), loadAudit()]);
          } catch (error) { alert(error.message); save.disabled = false; }
        });
        actions.append(select, save); card.append(actions); root.append(card);
      });
    } catch (error) {
      root.replaceChildren(element("div", "empty", error.message));
    }
  }

  async function loadUsers() {
    const root = $("#user-list");
    try {
      const users = await api("/api/v1/admin/users");
      root.replaceChildren();
      if (!users.length) { root.append(element("div", "empty", "No registered accounts yet.")); return; }
      users.slice(0, 100).forEach((user) => {
        const row = element("div", "user-row");
        const details = element("div", "user-row-main");
        details.append(element("strong", "", user.email));
        details.append(element("small", "", "Joined " + user.created_at));
        row.append(details, element("span", "pill " + (user.role === "superadmin" ? "high" : "medium"), user.role));
        root.append(row);
      });
    } catch (error) { root.replaceChildren(element("div", "empty", error.message)); }
  }

  async function loadAudit() {
    const root = $("#audit-list");
    try {
      const items = await api("/api/v1/admin/audit");
      root.replaceChildren();
      if (!items.length) { root.append(element("div", "empty", "No admin actions have been recorded yet.")); return; }
      items.forEach((item) => {
        const row = element("div", "audit-row");
        row.append(element("strong", "", item.action.replace(/_/g, " ")));
        row.append(element("small", "", (item.actor_email || "System") + " · " + item.entity_type + " · " + item.created_at));
        root.append(row);
      });
    } catch (error) { root.replaceChildren(element("div", "empty", error.message)); }
  }

  $("#network-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = $("#ioc-message"); status.textContent = "Saving indicator…";
    const lat = $("#ioc-lat").value.trim(); const lon = $("#ioc-lon").value.trim();
    if ((lat && !lon) || (!lat && lon)) { status.textContent = "Enter both latitude and longitude or leave both blank."; return; }
    const payload = {
      indicator_type: $("#ioc-type").value,
      indicator: $("#ioc-value").value,
      severity: $("#ioc-severity").value,
      location_label: $("#ioc-location").value || null,
      country: $("#ioc-country").value || null,
      latitude: lat ? Number(lat) : null,
      longitude: lon ? Number(lon) : null,
      source_label: $("#ioc-source").value,
      notes: $("#ioc-notes").value || null,
    };
    try {
      await api("/api/v1/admin/network-indicators", { method: "POST", body: JSON.stringify(payload) });
      $("#network-form").reset(); status.textContent = "Indicator added to the review queue.";
      await Promise.all([loadNetworkIndicators(), loadOverview(), loadAudit()]);
    } catch (error) { status.textContent = error.message; }
  });
  $("#refresh-cases").addEventListener("click", loadCases);
  $("#refresh-iocs").addEventListener("click", loadNetworkIndicators);
  $("#refresh-users").addEventListener("click", loadUsers);
  $("#refresh-audit").addEventListener("click", loadAudit);

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
  $("#refresh").addEventListener("click", async () => { await Promise.all([loadOverview(), loadSos(), loadCases(), loadAlerts(), loadNetworkIndicators(), loadUsers(), loadAudit()]); });
  $("#sign-out").addEventListener("click", () => { token = ""; sessionStorage.removeItem(tokenKey); dashboard.classList.add("hidden"); denied.classList.add("hidden"); authPanel.classList.remove("hidden"); showAuthMessage("You have signed out."); });
  verifySession();
})();