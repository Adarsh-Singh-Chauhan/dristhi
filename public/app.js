(function () {
  "use strict";

  const configuredApiBase = typeof window.DRISHTI_API_BASE === "string" ? window.DRISHTI_API_BASE.trim() : "";
  const isLocalHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const API_BASE = (configuredApiBase || (isLocalHost ? "http://127.0.0.1:8000" : "")).replace(/\/$/, "");
  const tokenKey = "drishti_access_token";
  let token = sessionStorage.getItem(tokenKey) || "";
  let accountStorageReady = false;
  let authMode = "login";
  let toastTimer;

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  function toast(message) {
    const node = $("#toast");
    node.textContent = message;
    node.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => node.classList.remove("show"), 3200);
  }

  async function api(path, options) {
    const config = options || {};
    const headers = Object.assign({ "Content-Type": "application/json" }, config.headers || {});
    if (token) headers.Authorization = "Bearer " + token;
    const response = await fetch(API_BASE + path, Object.assign({}, config, { headers: headers }));
    if (response.status === 204) return null;
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.detail || "Request failed (" + response.status + ")");
    return payload;
  }

  function setApiStatus(state, label) {
    const node = $("#api-status");
    node.className = "api-status " + state;
    node.innerHTML = "<i></i> " + label;
  }

  async function checkApi() {
    const authButton = $("#auth-open");
    const historyToggle = $("#save-history");
    try {
      const health = await api("/health");
      accountStorageReady = health.storage !== "unconfigured";
      authButton.disabled = !accountStorageReady;
      authButton.innerHTML = accountStorageReady ? 'Sign in <span>↗</span>' : "Accounts pending";
      authButton.title = accountStorageReady ? "Sign in to save reports" : "Sign-in and saved history will be enabled after persistent database setup.";
      historyToggle.disabled = !accountStorageReady;
      if (!accountStorageReady) historyToggle.checked = false;
      setApiStatus("online", accountStorageReady ? "API connected" : "Analysis live · Accounts pending");
      if (!accountStorageReady) loadHistory();
    } catch (_) {
      accountStorageReady = false;
      authButton.disabled = true;
      authButton.textContent = "API unavailable";
      authButton.title = "The backend API is not responding.";
      historyToggle.disabled = true;
      historyToggle.checked = false;
      setApiStatus("offline", "Local demo mode");
      loadHistory();
    }
  }

  function setAuth(user) {
    const chip = $("#user-chip");
    const button = $("#auth-open");
    if (user) {
      chip.classList.remove("hidden");
      button.classList.add("hidden");
      $("#user-email").textContent = user.email;
      $("#save-history").checked = true;
    } else {
      chip.classList.add("hidden");
      button.classList.remove("hidden");
      $("#user-email").textContent = "";
    }
  }

  async function loadMe() {
    if (!token) return setAuth(null);
    try {
      setAuth(await api("/api/v1/auth/me"));
    } catch (_) {
      token = "";
      sessionStorage.removeItem(tokenKey);
      setAuth(null);
      toast("Your session expired. Please sign in again.");
    }
  }

  function showView(name) {
    $$(".view").forEach((view) => view.classList.toggle("active", view.id === "view-" + name));
    $$(".nav-link").forEach((button) => button.classList.toggle("active", button.dataset.view === name));
    $("#crumb-title").textContent = name === "analysis" ? "Overview" : name === "history" ? "Analysis history" : "Methodology";
    if (name === "history") loadHistory();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function localDemoAnalysis(text) {
    const value = text.toLowerCase();
    const indicators = [];
    const checks = [
      ["urgency_language", "Urgency language", 18, ["act now", "immediately", "urgent", "तुरंत", "अभी"], "Urgent wording may pressure readers to react before checking the source."],
      ["share_pressure", "Forwarding pressure", 22, ["forward this", "forward to everyone", "share with everyone", "सबको भेजें", "आगे भेजें", "फॉरवर्ड करें"], "The message encourages rapid redistribution rather than independent verification."],
      ["authority_claim", "Authority claim without an in-text source", 18, ["official announcement", "government has announced", "police confirmed", "सरकार ने आदेश", "आधिकारिक घोषणा"], "An authority is invoked without a verifiable primary-source reference in the submitted text."],
      ["forward_chain", "Forward-chain marker", 12, ["forwarded many times", "forwarded as received", "fwd:", "फॉरवर्डेड"], "The original publisher or context may be missing."],
      ["panic_language", "Panic or threat language", 18, ["panic", "everyone is at risk", "will be shut down", "दहशत", "हड़कंप", "खतरा"], "Alarm-oriented wording may amplify fear; check whether the risk is supported by evidence."]
    ];
    let score = 0;
    checks.forEach((rule) => {
      const matches = rule[3].filter((phrase) => value.includes(phrase));
      if (matches.length) {
        score += rule[2];
        indicators.push({ key: rule[0], label: rule[1], weight: rule[2], matched_terms: matches, detail: rule[4] });
      }
    });
    if (/https?:\/\/(bit\.ly|tinyurl\.com|t\.co|is\.gd|cutt\.ly|rb\.gy)\//i.test(text)) {
      score += 12;
      indicators.push({ key: "shortened_link", label: "Shortened URL detected", weight: 12, matched_terms: ["shortened URL"], detail: "Inspect the expanded destination safely before opening it." });
    }
    if (score > 100) score = 100;
    const priority = score >= 60 ? "high" : score >= 30 ? "medium" : "low";
    return {
      score: score,
      priority: priority,
      label: priority === "high" ? "High review priority" : priority === "medium" ? "Needs review" : "Low signal detected",
      summary: priority === "high" ? "Several surface-level signals were detected. Verify the claim and its source before sharing." : priority === "medium" ? "Some review signals were detected. Check the original source and context." : "Few baseline warning patterns were detected. This does not confirm that the content is accurate.",
      indicators: indicators,
      recommended_checks: [
        "Find the earliest available publication of the claim.",
        "Look for a primary source such as the original notice, dataset or full statement.",
        "Check the date, location and surrounding context.",
        "Compare independent, credible sources before reaching a conclusion.",
        "If media is attached, check whether it is old, cropped or out of context.",
        "Do not open unfamiliar links or enter credentials on untrusted pages."
      ],
      method: "local-demo-rules",
      disclaimer: "Local demo only. This is not a fact-check, truth probability or political classification. Human verification is required."
    };
  }

  function renderReport(result, sourceLabel) {
    $("#empty-report").classList.add("hidden");
    $("#report").classList.remove("hidden");
    $("#score-value").textContent = String(result.score);
    const gaugeColor = result.priority === "high" ? "#ef8b80" : result.priority === "medium" ? "#f6bd67" : "#59d7c4";
    $("#score-gauge").style.background = "conic-gradient(" + gaugeColor + " " + (result.score * 3.6) + "deg, rgba(123,150,169,.13) 0deg)";
    $("#priority-label").textContent = result.label;
    $("#priority-label").style.color = gaugeColor;
    $("#result-summary").textContent = result.summary;
    $("#indicator-count").textContent = result.indicators.length + " signal" + (result.indicators.length === 1 ? "" : "s");

    const list = $("#indicator-list");
    list.replaceChildren();
    if (!result.indicators.length) {
      const empty = document.createElement("p");
      empty.className = "no-indicators";
      empty.textContent = "No configured warning patterns matched. This is not proof of accuracy.";
      list.appendChild(empty);
    } else {
      result.indicators.forEach((item) => {
        const card = document.createElement("article");
        card.className = "indicator-item";
        const top = document.createElement("div");
        top.className = "indicator-top";
        const title = document.createElement("b");
        title.textContent = item.label;
        const weight = document.createElement("span");
        weight.textContent = "+" + item.weight + " signal points";
        const detail = document.createElement("p");
        detail.textContent = item.detail;
        top.append(title, weight);
        card.append(top, detail);
        list.appendChild(card);
      });
    }

    const checks = $("#check-list");
    checks.replaceChildren();
    result.recommended_checks.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      checks.appendChild(li);
    });
    $("#report-disclaimer").textContent = result.disclaimer;
    $("#report-source").textContent = "Analysis method: " + result.method + " · " + sourceLabel;
  }

  $("#content").addEventListener("input", (event) => {
    $("#char-count").textContent = event.target.value.length.toLocaleString() + " / 10,000";
  });

  $("#sample-button").addEventListener("click", () => {
    $("#content").value = "URGENT: An official announcement says this service will be shut down tomorrow. Forward this to everyone before it is too late!!!";
    $("#char-count").textContent = $("#content").value.length.toLocaleString() + " / 10,000";
    $("#platform").value = "whatsapp";
    toast("Illustrative sample loaded. It is not a real announcement.");
  });

  $("#analysis-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const content = $("#content").value.trim();
    if (content.length < 20) return toast("Please enter at least 20 characters.");
    const button = $(".analyze-button");
    button.disabled = true;
    button.querySelector("span").textContent = "Analysing…";
    try {
      let result;
      let source = "FastAPI backend";
      try {
        result = await api("/api/v1/analyze", {
          method: "POST",
          body: JSON.stringify({
            content: content,
            source_platform: $("#platform").value,
            source_url: $("#source-url").value.trim() || null,
            save_to_history: $("#save-history").checked
          })
        });
        setApiStatus("online", accountStorageReady ? "API connected" : "Analysis live · Accounts pending");
        if (result.saved) toast("Analysis saved to your account history.");
        else if (token && !$("#save-history").checked) toast("Analysis complete. History saving is off.");
      } catch (error) {
        if (token && /401|expired|Sign in/i.test(error.message)) throw error;
        result = localDemoAnalysis(content);
        source = "Local demo engine · API unavailable";
        setApiStatus("offline", "Local demo mode");
        toast("API unavailable: showing an illustrative local-demo result.");
      }
      renderReport(result, source);
    } catch (error) {
      toast(error.message || "Unable to analyse this message.");
    } finally {
      button.disabled = false;
      button.querySelector("span").textContent = "Analyse message";
    }
  });

  function openAuth(mode) {
    authMode = mode || "login";
    $("#auth-title").innerHTML = authMode === "login" ? "Welcome <em>back.</em>" : "Create your <em>account.</em>";
    $("#auth-description").textContent = authMode === "login" ? "Sign in to save your analysis history." : "Create an account to keep your analysis reports together.";
    $("#auth-submit").textContent = authMode === "login" ? "Sign in →" : "Create account →";
    $("#auth-switch-label").textContent = authMode === "login" ? "New to DRISHTI?" : "Already have an account?";
    $("#auth-mode-toggle").textContent = authMode === "login" ? "Create an account" : "Sign in instead";
    $("#auth-message").textContent = "";
    $("#auth-dialog").showModal();
  }

  $("#auth-open").addEventListener("click", () => openAuth("login"));
  $("#auth-close").addEventListener("click", () => $("#auth-dialog").close());
  $("#auth-mode-toggle").addEventListener("click", () => openAuth(authMode === "login" ? "register" : "login"));

  $("#auth-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = $("#auth-message");
    message.textContent = "Connecting securely…";
    const email = $("#auth-email").value.trim();
    const password = $("#auth-password").value;
    const endpoint = authMode === "login" ? "/api/v1/auth/login" : "/api/v1/auth/register";
    try {
      const result = await api(endpoint, { method: "POST", body: JSON.stringify({ email: email, password: password }) });
      token = result.access_token;
      sessionStorage.setItem(tokenKey, token);
      await loadMe();
      $("#auth-dialog").close();
      toast(authMode === "login" ? "Signed in successfully." : "Account created. Welcome to DRISHTI.");
      setApiStatus("online", "API connected");
      if ($("#view-history").classList.contains("active")) loadHistory();
    } catch (error) {
      message.textContent = error.message + " (Is the backend running?)";
    }
  });

  $("#sign-out").addEventListener("click", () => {
    token = "";
    sessionStorage.removeItem(tokenKey);
    setAuth(null);
    toast("You have been signed out.");
  });

  function renderHistory(items) {
    const root = $("#history-content");
    root.replaceChildren();
    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "history-empty";
      const icon = document.createElement("span");
      icon.textContent = "◷";
      const title = document.createElement("b");
      title.textContent = "No saved reports yet";
      const help = document.createElement("p");
      help.textContent = "Run an analysis while signed in to add one here.";
      empty.append(icon, title, help);
      root.appendChild(empty);
      return;
    }
    const list = document.createElement("div");
    list.className = "history-list";
    items.forEach((item) => {
      const card = document.createElement("article");
      card.className = "history-item";
      const main = document.createElement("div");
      const title = document.createElement("b");
      title.textContent = (item.content_excerpt || "Saved analysis").slice(0, 125);
      const meta = document.createElement("div");
      meta.className = "history-meta";
      meta.textContent = item.source_platform.toUpperCase() + " · " + new Date(item.created_at).toLocaleString();
      const detail = document.createElement("p");
      detail.textContent = item.priority.toUpperCase() + " REVIEW PRIORITY · " + item.indicators.length + " indicators";
      main.append(title, meta, detail);
      const actions = document.createElement("div");
      actions.className = "history-actions";
      const score = document.createElement("span");
      score.className = "history-score";
      score.textContent = item.score + "/100";
      const del = document.createElement("button");
      del.className = "delete-history";
      del.textContent = "Delete";
      del.addEventListener("click", async () => {
        if (!window.confirm("Delete this saved report?")) return;
        try {
          await api("/api/v1/history/" + encodeURIComponent(item.id), { method: "DELETE" });
          toast("Saved report deleted.");
          loadHistory();
        } catch (error) {
          toast(error.message);
        }
      });
      actions.append(score, del);
      card.append(main, actions);
      list.appendChild(card);
    });
    root.appendChild(list);
  }

  async function loadHistory() {
    if (!accountStorageReady) {
      $("#history-content").innerHTML = '<div class="history-empty"><span>◷</span><b>Account history is not enabled yet</b><p>Connect persistent PostgreSQL storage to enable sign-in and saved reports. Anonymous message analysis is available now.</p></div>';
      return;
    }
    if (!token) {
      $("#history-content").innerHTML = '<div class="history-empty"><span>◷</span><b>Sign in to view your history</b><p>Saved reports are private to your account.</p></div>';
      return;
    }
    $("#history-content").innerHTML = '<div class="history-empty"><span>◌</span><b>Loading saved reports…</b><p>Fetching your account history.</p></div>';
    try {
      renderHistory(await api("/api/v1/history"));
    } catch (error) {
      $("#history-content").innerHTML = '<div class="history-empty"><span>!</span><b>Could not load history</b><p></p></div>';
      $("#history-content p").textContent = error.message;
    }
  }

  $("#refresh-history").addEventListener("click", loadHistory);
  $$(".nav-link").forEach((button) => button.addEventListener("click", () => showView(button.dataset.view)));

  checkApi();
  loadMe();
})();