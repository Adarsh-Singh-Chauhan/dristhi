(() => {
  const $ = (selector) => document.querySelector(selector);
  const configuredApiBase = typeof window.DRISHTI_API_BASE === "string" ? window.DRISHTI_API_BASE.trim() : "";
  const isLocalHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const API_BASE = (configuredApiBase || (isLocalHost ? "http://127.0.0.1:8000" : "")).replace(/\/$/, "");
  const tokenKey = "drishti_access_token";
  let token = sessionStorage.getItem(tokenKey) || "";
  let contacts = [];
  const authPanel = $("#auth-panel");
  const app = $("#app");
  const el = (tag, cls, value) => { const node = document.createElement(tag); if (cls) node.className = cls; if (value !== undefined) node.textContent = value; return node; };
  const api = async (path, options = {}) => {
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    if (token) headers.Authorization = "Bearer " + token;
    const response = await fetch(API_BASE + path, { ...options, headers });
    const raw = await response.text(); let data = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch {}
    if (!response.ok) throw new Error(data.detail || ("Request failed (" + response.status + ")"));
    return data;
  };
  async function start() {
    const user = await api("/api/v1/auth/me");
    authPanel.classList.add("hidden"); app.classList.remove("hidden");
    await refreshAll();
  }
  $("#login-form").addEventListener("submit", async (event) => {
    event.preventDefault(); $("#auth-message").textContent = "Signing in…";
    try { const result = await api("/api/v1/auth/login", { method:"POST", body:JSON.stringify({ email:$("#email").value, password:$("#password").value }) }); token = result.access_token; sessionStorage.setItem(tokenKey, token); await start(); }
    catch (error) { $("#auth-message").textContent = error.message; }
  });
  async function loadAlerts() {
    const root = $("#alert-list"); const items = await api("/api/v1/alerts");
    root.replaceChildren();
    if (!items.length) { root.append(el("div","empty","No in-app alerts yet.")); return; }
    items.forEach((item) => {
      const card = el("article","card"); const head = el("div","panel-head");
      head.append(el("h3","",item.title),el("span","pill "+item.level,item.level)); card.append(head,el("p","",item.message),el("div","meta",item.category+" · "+item.created_at));
      if (!item.read_at && item.user_id) { const button=el("button","button secondary","Mark as read"); button.type="button"; button.addEventListener("click",async()=>{await api("/api/v1/alerts/"+encodeURIComponent(item.id)+"/read",{method:"POST"});await loadAlerts();});card.append(button); }
      root.append(card);
    });
  }
  async function loadContacts() {
    contacts = await api("/api/v1/trusted-contacts");
    const root=$("#contact-list"), choices=$("#contact-choices"); root.replaceChildren(); choices.replaceChildren();
    if (!contacts.length) { root.append(el("div","empty","No trusted contacts saved.")); choices.append(el("div","empty","Add trusted contacts above to select them here.")); return; }
    contacts.forEach((contact) => {
      const line=el("div","contact"); const detail=el("span","",contact.name+" · "+(contact.email||contact.phone));
      const remove=el("button","button secondary","Remove"); remove.type="button"; remove.addEventListener("click",async()=>{try{await api("/api/v1/trusted-contacts/"+encodeURIComponent(contact.id),{method:"DELETE"});await loadContacts();}catch(error){alert(error.message);}});
      line.append(detail,remove);root.append(line);
      const check=el("label","checkline");const input=document.createElement("input");input.type="checkbox";input.value=contact.id;const text=el("span","",contact.name+" · "+(contact.email||contact.phone));check.append(input,text);choices.append(check);
    });
  }
  async function loadSos() {
    const root=$("#sos-history"); const items=await api("/api/v1/sos/mine"); root.replaceChildren();
    if(!items.length){root.append(el("div","empty","No SOS requests submitted."));return;}
    items.forEach((item)=>{const card=el("article","card");const head=el("div","panel-head");head.append(el("h3","",item.title),el("span","pill "+item.status,item.status.replace("_"," ")));card.append(head,el("p","",item.details),el("div","meta",item.urgency+" · "+item.created_at));if(item.review_notes)card.append(el("p","", "Reviewer note: "+item.review_notes));root.append(card);});
  }
  async function refreshAll() {
    try { await Promise.all([loadAlerts(),loadContacts(),loadSos()]); }
    catch(error) { $("#sos-message").textContent=error.message; }
  }
  $("#contact-form").addEventListener("submit",async(event)=>{
    event.preventDefault();$("#contact-message").textContent="Saving…";
    try {await api("/api/v1/trusted-contacts",{method:"POST",body:JSON.stringify({name:$("#contact-name").value,email:$("#contact-email").value||null,phone:$("#contact-phone").value||null})});$("#contact-form").reset();$("#contact-message").textContent="Trusted contact saved.";await loadContacts();}
    catch(error){$("#contact-message").textContent=error.message;}
  });
  $("#sos-form").addEventListener("submit",async(event)=>{
    event.preventDefault();$("#sos-message").textContent="Submitting SOS…";
    const selected=[...document.querySelectorAll("#contact-choices input:checked")].map((item)=>item.value);
    try {const result=await api("/api/v1/sos",{method:"POST",body:JSON.stringify({title:$("#sos-title").value,details:$("#sos-details").value,source_url:$("#sos-url").value||null,urgency:$("#sos-urgency").value,trusted_contact_ids:selected})});$("#sos-form").reset();$("#sos-message").textContent=result.message+" Selected contacts: "+result.selected_trusted_contacts+". No external messages sent.";await refreshAll();}
    catch(error){$("#sos-message").textContent=error.message;}
  });
  $("#refresh").addEventListener("click",refreshAll);
  if(token){start().catch((error)=>{token="";sessionStorage.removeItem(tokenKey);$("#auth-message").textContent=error.message;});}
})();