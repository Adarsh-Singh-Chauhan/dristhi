(() => {
  "use strict";
  const $ = (selector) => document.querySelector(selector);
  const sessionKey = "drishti_demo_session";
  const dataKey = "drishti_demo_cases";
  const accounts = {
    user: { email: "demo.user@drishti.in", password: "DRISHTI-USER-40", role: "user", label: "Mobile / User demo" },
    admin: { email: "demo.superadmin@drishti.in", password: "DRISHTI-ADMIN-40", role: "admin", label: "Superadmin demo" }
  };
  let activeTab = "overview";
  let timerHandle = null;
  let currentSession = null;
  const seedCases = [
    { id:"DR-DEMO-1042", title:"Forwarded claim about a nationwide service shutdown", category:"misinformation", status:"under_review", detail:"A sample forward uses urgent wording and asks recipients to share immediately. No primary circular is attached.", evidence:"No official circular has been provided in this sample. The wording alone cannot establish falsity.", source:"https://www.pib.gov.in/" },
    { id:"DR-DEMO-1043", title:"Edited public-official video submitted for review", category:"deepfake", status:"received", detail:"A sample report asks the reviewer to compare a clipped video with the original full recording and check the source date.", evidence:"Pending primary-source comparison.", source:"https://newsonair.gov.in/" },
    { id:"DR-DEMO-1044", title:"Suspicious shortened link in a forwarded message", category:"phishing", status:"insufficient_evidence", detail:"An example URL-shortener pattern was reported. The destination has not been safely expanded or independently checked.", evidence:"A shortened URL is not, by itself, proof of malware or fraud.", source:"https://www.cert-in.org.in/" }
  ];
  const getCases = () => {
    try { const parsed=JSON.parse(sessionStorage.getItem(dataKey)||"null"); return Array.isArray(parsed)?parsed:seedCases.map(x=>({...x})); }
    catch { return seedCases.map(x=>({...x})); }
  };
  const setCases = (items) => sessionStorage.setItem(dataKey,JSON.stringify(items));
  function startSession(role) {
    const account=accounts[role];
    currentSession={role,email:account.email,expiresAt:Date.now()+40*60*1000};
    sessionStorage.setItem(sessionKey,JSON.stringify(currentSession));
    setCases(seedCases.map(x=>({...x})));
    showApp();
  }
  function readSession() {
    try { const session=JSON.parse(sessionStorage.getItem(sessionKey)||"null"); return session && session.expiresAt>Date.now()?session:null; }
    catch { return null; }
  }
  function expireSession() {
    clearInterval(timerHandle);
    sessionStorage.removeItem(sessionKey);
    sessionStorage.removeItem(dataKey);
    currentSession=null;
    $("#demo-app").classList.add("hidden");
    $("#login-screen").classList.remove("hidden");
    $("#login-message").textContent="Your 40-minute demo has ended. Start a new sample session to continue.";
  }
  function updateTimer() {
    if (!currentSession || Date.now()>=currentSession.expiresAt) return expireSession();
    const seconds=Math.max(0,Math.floor((currentSession.expiresAt-Date.now())/1000));
    $("#timer").textContent=String(Math.floor(seconds/60)).padStart(2,"0")+":"+String(seconds%60).padStart(2,"0");
  }
  function showApp() {
    $("#login-screen").classList.add("hidden");
    $("#demo-app").classList.remove("hidden");
    $("#role-label").textContent=currentSession.role==="admin"?"SUPERADMIN TOUR":"MOBILE USER";
    $("#welcome").textContent=currentSession.role==="admin"?"Superadmin review room.":"Your DRISHTI workspace.";
    renderTabs();
    renderTab("overview");
    updateTimer();
    clearInterval(timerHandle);
    timerHandle=setInterval(updateTimer,1000);
  }
  function renderTabs() {
    const items=currentSession.role==="admin"
      ? [["overview","Overview"],["cases","Case review"],["globe","Signal atlas"],["audit","Audit trail"]]
      : [["overview","Overview"],["analyse","Analyse"],["cases","My case files"],["safety","Safety / SOS"],["guide","How to use"]];
    const nav=$("#demo-nav");nav.replaceChildren();
    items.forEach(([id,label])=>{const button=document.createElement("button");button.className="tab"+(id===activeTab?" active":"");button.textContent=label;button.type="button";button.addEventListener("click",()=>renderTab(id));nav.append(button)});
  }
  function renderTab(name) {
    activeTab=name;renderTabs();
    const root=$("#demo-content");root.replaceChildren();
    if(currentSession.role==="admin") {
      if(name==="overview") renderAdminOverview(root);
      else if(name==="cases") renderAdminCases(root);
      else if(name==="globe") renderGlobe(root);
      else renderAudit(root);
    } else {
      if(name==="overview") renderUserOverview(root);
      else if(name==="analyse") renderAnalyse(root);
      else if(name==="cases") renderUserCases(root);
      else if(name==="safety") renderSafety(root);
      else renderGuide(root);
    }
  }
  const el=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n};
  function renderUserOverview(root) {
    const cases=getCases();
    const grid=el("div","stat-grid");
    [["YOUR CASE FILES",cases.length],["UNDER REVIEW",cases.filter(c=>["received","under_review"].includes(c.status)).length],["EVIDENCE OUTCOMES",cases.filter(c=>["verified_false","supported_by_sources","misleading_context"].includes(c.status)).length],["SESSION", "40 MIN"]].forEach(([label,value])=>{const card=el("article","mini-stat");card.append(el("small","",label),el("strong","",String(value)));grid.append(card)});
    const intro=el("section","panel");intro.append(el("h3","","Start with a message. Finish with evidence."),el("p","","Paste a public claim or message you are authorised to review. DRISHTI surfaces selected language and link indicators, then lets you open a case for human follow-up."),el("button","btn primary","Analyse a sample claim →"));intro.lastChild.addEventListener("click",()=>renderTab("analyse"));
    root.append(grid,intro);
    const feature=el("section","panel");feature.style.marginTop="12px";feature.append(el("h3","","A careful result, not an instant verdict"),el("p","","The sample engine is intentionally explainable. A flagged message is not automatically false, and a low score is not proof that it is safe or accurate."));root.append(feature);
  }
  function renderAnalyse(root) {
    const grid=el("div","content-grid");
    const formPanel=el("section","panel");formPanel.append(el("h3","","Analyse a message"),el("p","","Use a sample claim or paste your own text. This screen runs a small local demonstration heuristic only."));
    const form=el("form","");form.innerHTML='<div class="field"><label for="sample-platform">Platform</label><select id="sample-platform"><option>WhatsApp</option><option>Telegram</option><option>Instagram</option><option>Facebook</option><option>X</option><option>Website</option><option>Other</option></select></div><div class="field"><label for="sample-text">Message / claim</label><textarea id="sample-text" required minlength="20" placeholder="Paste a public claim to inspect…">URGENT: An official announcement says this service will be shut down tomorrow. Forward this to everyone before it is too late!!!</textarea></div><button class="btn primary" type="submit">Inspect sample →</button>';
    const result=el("section","panel");result.id="sample-result";result.append(el("h3","","Review output"),el("p","","Submit text to see the illustrative signals."));
    form.addEventListener("submit",(event)=>{
      event.preventDefault();const text=$("#sample-text").value;const v=text.toLowerCase();const signals=[];
      [["Urgency wording",["urgent","immediately","right now","तुरंत"]],["Forwarding pressure",["forward this","forward to everyone","सबको भेजें","आगे भेजें"]],["Authority without a cited source",["official announcement","government has announced","सरकार ने आदेश"]],["Panic language",["panic","everyone is at risk","दहशत"]]].forEach(([label,phrases])=>{if(phrases.some(p=>v.includes(p)))signals.push(label)});
      const box=el("div","result-box");box.append(el("strong","",signals.length+" surface-level signal(s)"),el("p","","This is a triage hint only. No truth determination or source lookup is performed."));
      const ul=el("ul","");(signals.length?signals:["No configured sample pattern matched"]).forEach(x=>ul.append(el("li","",x)));box.append(ul);
      const caseBtn=el("button","btn primary","Create sandbox case file →");caseBtn.type="button";caseBtn.addEventListener("click",()=>{const cases=getCases();cases.unshift({id:"DR-DEMO-"+String(Date.now()).slice(-6),title:"User-submitted demo claim",category:"misinformation",status:"received",detail:text.slice(0,500),evidence:"Awaiting reviewer evidence.",source:""});setCases(cases);renderTab("cases")});
      result.replaceChildren(el("h3","","Review output"),box,caseBtn);
    });
    formPanel.append(form);grid.append(formPanel,result);root.append(grid);
  }
  function renderUserCases(root) {
    root.append(el("section","panel","","My submitted case files"));
    getCases().forEach(item=>{const card=caseCard(item);root.append(card)});
    if(!getCases().length)root.append(el("div","panel","","No cases created in this demo."));
  }
  function caseCard(item) {
    const card=el("article","case-card");const head=el("div","case-head");head.append(el("b","",item.title),el("span","status "+(["verified_false","supported_by_sources"].includes(item.status)?"good":""),item.status.replace(/_/g," ")));card.append(head);
    card.append(el("div","meta",item.id+" · "+item.category.replace(/_/g," ").toUpperCase()));
    card.append(el("p","",item.detail));if(item.evidence)card.append(el("p","","Reviewer note: "+item.evidence));
    return card;
  }
  function renderSafety(root) {
    const grid=el("div","content-grid");
    const formPanel=el("section","panel");
    formPanel.append(el("h3","","Safety & SOS demo"),el("p","","Explore how a user can prepare an internal review request. This demo does not contact any person or emergency service."));
    const form=el("form","");
    form.innerHTML='<div class="field"><label for="sos-title">Incident title</label><input id="sos-title" required maxlength="100" value="Suspicious public message reported"></div><div class="field"><label for="sos-detail">What happened?</label><textarea id="sos-detail" required minlength="10">I received a suspicious public message and would like it reviewed against an original source.</textarea></div><div class="field"><label><input id="sos-location" type="checkbox"> Include a fictional sample map point (demo only)</label></div><button class="btn primary" type="submit">Submit sample SOS →</button>';
    const list=el("section","panel");list.append(el("h3","","My demo requests"),el("p","","Sample SOS requests stay in this browser tab only."));
    const requests=[];
    form.addEventListener("submit",(event)=>{
      event.preventDefault();
      const item={title:$("#sos-title").value,details:$("#sos-detail").value,location:$("#sos-location").checked?"Fictional demo coordinate · not device GPS":"Location not shared",status:"received"};
      requests.unshift(item);
      const card=el("article","case-card");card.append(el("div","case-head",item.title),el("div","meta",item.status.toUpperCase()+" · "+item.location),el("p","",item.details));list.append(card);
      form.reset();
      form.querySelector("#sos-title").value="Suspicious public message reported";
      alert("Sample request added to the demo only. No external alert was sent.");
    });
    formPanel.append(form);grid.append(formPanel,list);root.append(grid);
    const note=el("section","panel");note.style.marginTop="12px";note.append(el("h3","","Before using a real SOS"),el("p","","In production, precise GPS is requested only when the user explicitly opts in on the SOS form. DRISHTI's SOS is an internal review queue, not a police or emergency-service dispatch. For immediate danger, contact local emergency services directly."));root.append(note);
  }
  function renderGuide(root) {
    const panel=el("section","panel");panel.append(el("h3","","Use DRISHTI on your phone"),el("p","","1. Open the real workspace from the main website. 2. Sign in with your own account once persistent storage is configured. 3. Paste a public claim and inspect the reasons. 4. Verify the primary source before you share. 5. Create a case file only when it needs follow-up. 6. Follow your case status in My case files."));
    panel.append(el("p","","On Android Chrome, open the website menu and choose Install app / Add to Home screen. On iPhone Safari, choose Share → Add to Home Screen. DRISHTI is a mobile-ready PWA, not a native Play Store app."));
    root.append(panel);
  }
  function renderAdminOverview(root) {
    const cases=getCases();const grid=el("div","stat-grid");
    [["TOTAL DEMO CASES",cases.length],["OPEN QUEUE",cases.filter(c=>["received","under_review"].includes(c.status)).length],["REVIEWED",cases.filter(c=>!["received","under_review"].includes(c.status)).length],["PUBLIC IOC SAMPLES",3]].forEach(([l,v])=>{const c=el("article","mini-stat");c.append(el("small","",l),el("strong","",String(v)));grid.append(c)});
    const panel=el("section","panel");panel.append(el("h3","","Superadmin command overview"),el("p","","This is an isolated read-only tour. The real control room uses a separate Superadmin account and a configured production database. These sample actions update this browser tab only."),el("button","btn secondary","Open case review queue"));panel.lastChild.addEventListener("click",()=>renderTab("cases"));
    root.append(grid,panel);
  }
  function renderAdminCases(root) {
    const intro=el("section","panel");intro.append(el("h3","","Case review queue"),el("p","","Select a review state. A final finding requires a recorded evidence summary and a source reference. This demo is not connected to a live case database."));root.append(intro);
    getCases().forEach(item=>{
      const card=caseCard(item);
      const actions=el("div","case-actions");const select=document.createElement("select");
      ["received","under_review","verified_false","supported_by_sources","misleading_context","insufficient_evidence","closed"].forEach(s=>{const o=document.createElement("option");o.value=s;o.textContent=s.replace(/_/g," ");if(s===item.status)o.selected=true;select.append(o)});
      const evidence=document.createElement("input");evidence.placeholder="Evidence URL (required for final outcome)";evidence.value=item.source||"";
      const save=el("button","btn primary","Save demo review");save.type="button";save.addEventListener("click",()=>{if(["verified_false","supported_by_sources","misleading_context"].includes(select.value)&&!/^https?:\/\//i.test(evidence.value)){alert("A final demo outcome needs an evidence URL.");return}const all=getCases();const target=all.find(x=>x.id===item.id);if(target){target.status=select.value;target.source=evidence.value;target.evidence=select.value==="verified_false"?"Demo-only finding. Validate original source and preserve the evidence trail.":select.value==="supported_by_sources"?"Demo-only review: supplied source supports the submitted claim.":"Sandbox status updated; this is not a real-world verdict.";setCases(all);renderTab("cases")}});
      actions.append(select,evidence,save);card.append(actions);root.append(card);
    });
  }
  function renderGlobe(root) {
    const panel=el("section","panel");panel.append(el("h3","","Global signal atlas"),el("p","","Fictional sample pins for the product walkthrough. Production map records are limited to user-consented SOS GPS snapshots and Superadmin-entered public network indicators with approximate GeoIP location."));
    const svg=document.createElement("div");svg.innerHTML='<svg class="globe" viewBox="0 0 900 430" role="img" aria-label="Illustrative global incident map"><defs><radialGradient id="sea"><stop stop-color="#24495b"/><stop offset="1" stop-color="#091723"/></radialGradient><pattern id="grid" width="45" height="45" patternUnits="userSpaceOnUse"><path d="M45 0H0V45" fill="none" stroke="#83cec6" stroke-opacity=".12"/></pattern></defs><rect width="900" height="430" rx="18" fill="url(#sea)"/><rect width="900" height="430" rx="18" fill="url(#grid)"/><g fill="#315d6c" stroke="#82b4b4" stroke-opacity=".25" stroke-width="2"><path d="M70 95l60-42 91 22 40 49-22 34-44 8-25 44-48-5-33-54zM200 224l49 7 28 52-14 70-34 48-28-55-22-66zM380 95l55-35 55 22-7 37-54 15zM432 162l59 2 39 69-15 69-54 70-37-61-5-81zM520 94l88-41 113 26 78 72-34 46-68-9-30 34-50-13-48 24-55-41-63-12-35-52zM760 280l52-17 69 33 4 38-65 20-48-32z"/></g><g><circle cx="235" cy="160" r="8" fill="#68dccb"/><circle cx="235" cy="160" r="18" fill="none" stroke="#68dccb" stroke-opacity=".6"><animate attributeName="r" values="10;25;10" dur="4s" repeatCount="indefinite"/></circle><circle cx="557" cy="173" r="7" fill="#b2a7ec"/><circle cx="557" cy="173" r="17" fill="none" stroke="#b2a7ec" stroke-opacity=".7"><animate attributeName="r" values="9;24;9" dur="3.6s" repeatCount="indefinite"/></circle><circle cx="702" cy="270" r="7" fill="#68dccb"/><circle cx="702" cy="270" r="17" fill="none" stroke="#68dccb" stroke-opacity=".7"><animate attributeName="r" values="9;24;9" dur="4.3s" repeatCount="indefinite"/></circle></g><text x="26" y="402" fill="#81a4b3" font-size="11" letter-spacing="2">DRISHTI / SYNTHETIC DEMO MAP · NOT LIVE TRACKING</text></svg>';
    panel.append(svg);const legend=el("div","legend");legend.innerHTML='<span><i></i> Consented sample incident location</span><span><i class="purple"></i> Public IOC sample</span>';panel.append(legend,el("p","","IP geolocation estimates a network edge or provider region. It does not reveal a person’s exact location, identity or live movement. The demo pins are fictional."));
    root.append(panel);
  }
  function renderAudit(root) {
    const panel=el("section","panel");panel.append(el("h3","","Demo audit trail"),el("p","","The production Superadmin console records privileged actions in a database audit table. This guided tour does not connect to that system."));
    [["09:42","Case opened","demo.user@drishti.in"],["09:47","Case moved to under review","demo.superadmin@drishti.in"],["09:53","Evidence source added","demo.superadmin@drishti.in"],["09:55","Sample outcome recorded","demo.superadmin@drishti.in"]].forEach(([t,a,u])=>{const row=el("article","case-card");row.append(el("b","",a),el("div","meta",t+" · "+u));panel.append(row)});root.append(panel);
  }
  $("#demo-login").addEventListener("submit",(event)=>{
    event.preventDefault();const email=$("#demo-email").value.trim().toLowerCase();const pass=$("#demo-password").value;
    const match=Object.entries(accounts).find(([,a])=>a.email===email&&a.password===pass);
    if(!match){$("#login-message").textContent="Demo ID or password is incorrect. Use one of the two sample accounts below.";return}
    $("#login-message").textContent="";startSession(match[0]);
  });
  document.querySelectorAll(".account-choice").forEach(button=>button.addEventListener("click",()=>{const a=accounts[button.dataset.role];$("#demo-email").value=a.email;$("#demo-password").value=a.password;$("#login-message").textContent="Sample credentials filled. Press Enter demo workspace."}));
  $("#exit-demo").addEventListener("click",()=>expireSession());
  currentSession=readSession();if(currentSession)showApp();
})();