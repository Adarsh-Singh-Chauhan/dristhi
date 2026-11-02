(() => {
  "use strict";

  const $ = (selector, root=document) => root.querySelector(selector);
  const sessionKey = "drishti_demo_session_v2";
  const dataKey = "drishti_demo_data_v2";
  const DEMO_MINUTES = 40;
  const DEMO_MS = DEMO_MINUTES * 60 * 1000;
  const accounts = {
    user: { email:"demo.user@drishti.in", password:"DRISHTI-USER-40", label:"User workspace" },
    admin: { email:"demo.superadmin@drishti.in", password:"DRISHTI-ADMIN-40", label:"Superadmin control room" }
  };
  const statusLabels = {
    received:"Received", under_review:"Under review", verified_false:"Verified false",
    supported_by_sources:"Supported by sources", misleading_context:"Misleading context",
    insufficient_evidence:"Insufficient evidence", closed:"Closed"
  };
  const outcomeStatuses = ["verified_false","supported_by_sources","misleading_context"];
  const allStatuses = Object.keys(statusLabels);
  const now = Date.now();
  const isoAgo = (minutes) => new Date(now - minutes * 60000).toISOString();
  const uid = (prefix) => prefix + "-" + Math.random().toString(36).slice(2,7).toUpperCase();
  let session = null;
  let timerHandle = null;
  let activePage = "overview";
  let latestResult = null;
  let selectedCaseId = "";
  let caseFilter = "all";
  let caseSearch = "";

  const seedData = () => ({
    cases: [
      {
        id:"DR-DEMO-1042", title:"Forwarded claim about a nationwide service shutdown",
        category:"misinformation", status:"under_review", platform:"WhatsApp",
        claim:"URGENT: An official announcement says this service will be shut down tomorrow. Forward this to everyone before it is too late!!!",
        source_url:"https://www.pib.gov.in/", owner:accounts.user.email, reporter:"Aarav Mehta",
        evidence_summary:"The supplied sample contains no circular number, department reference or original publication. Urgency and forwarding language are not proof that the claim is false.",
        evidence_sources:["https://www.pib.gov.in/"], reviewer_notes:"Compare the original department notice and publication date before reaching a conclusion.",
        created_at:isoAgo(72), updated_at:isoAgo(24),
        timeline:[
          {at:isoAgo(72),title:"Case submitted",detail:"Created by demo.user@drishti.in"},
          {at:isoAgo(24),title:"Moved to under review",detail:"Assigned to the sample review desk"}
        ]
      },
      {
        id:"DR-DEMO-1043", title:"Edited public-official video submitted for review",
        category:"deepfake", status:"received", platform:"Instagram",
        claim:"A short clip attributes a new statement to a public official. The source post does not include the original full recording or date.",
        source_url:"https://newsonair.gov.in/", owner:"reviewer.sample@drishti.in", reporter:"Demo reporter",
        evidence_summary:"", evidence_sources:[], reviewer_notes:"",
        created_at:isoAgo(38), updated_at:isoAgo(38),
        timeline:[{at:isoAgo(38),title:"Case submitted",detail:"Created by reviewer.sample@drishti.in"}]
      },
      {
        id:"DR-DEMO-1044", title:"Shortened URL in a forwarded message",
        category:"phishing", status:"insufficient_evidence", platform:"Telegram",
        claim:"A forwarded message includes a shortened link and says recipients must verify their account immediately.",
        source_url:"https://cert-in.org.in/", owner:accounts.user.email, reporter:"Demo user",
        evidence_summary:"A shortened URL and urgent language do not establish that the destination is malicious. The destination was not safely expanded in this sample.",
        evidence_sources:["https://www.cert-in.org.in/"], reviewer_notes:"No live URL scan is performed by the demo.",
        created_at:isoAgo(190), updated_at:isoAgo(130),
        timeline:[
          {at:isoAgo(190),title:"Case submitted",detail:"Created by demo.user@drishti.in"},
          {at:isoAgo(130),title:"Insufficient evidence recorded",detail:"No safe destination evidence was supplied"}
        ]
      },
      {
        id:"DR-DEMO-1045", title:"Old photograph presented as a current flood alert",
        category:"misinformation", status:"misleading_context", platform:"Facebook",
        claim:"A genuine photograph is being shared as a current local flood incident, but its original date and location are not included.",
        source_url:"https://www.pib.gov.in/", owner:"reviewer.sample@drishti.in", reporter:"Demo reporter",
        evidence_summary:"This sample case demonstrates a context issue: an authentic image may be reused with a new date or location. A source comparison is necessary.",
        evidence_sources:["https://www.pib.gov.in/","https://www.newsonair.gov.in/"], reviewer_notes:"Illustrative only. This does not refer to a specific verified incident.",
        created_at:isoAgo(340), updated_at:isoAgo(265),
        timeline:[
          {at:isoAgo(340),title:"Case submitted",detail:"Created by reviewer.sample@drishti.in"},
          {at:isoAgo(265),title:"Context concern recorded",detail:"Sample reviewer attached source references"}
        ]
      }
    ],
    analyses: [
      {id:"AN-DEMO-001",summary:"Forwarded service shutdown claim",platform:"WhatsApp",score:58,priority:"medium",created_at:isoAgo(50),signals:2},
      {id:"AN-DEMO-002",summary:"Public-official video clip",platform:"Instagram",score:32,priority:"medium",created_at:isoAgo(180),signals:1}
    ],
    sos: [
      {id:"SOS-DEMO-021",title:"Suspicious public notice being circulated",details:"A public notice is being forwarded with a request to share immediately. I could not find the original department link.",status:"under_review",urgency:"high",owner:accounts.user.email,location_shared:false,location_label:"Not shared",created_at:isoAgo(95),review_notes:"Check the primary department website."},
      {id:"SOS-DEMO-022",title:"Impersonation account reported",details:"A social account appears to be using a department logo and requesting personal details.",status:"open",urgency:"urgent",owner:"reviewer.sample@drishti.in",location_shared:true,location_label:"Fictional sample point · Indore region",created_at:isoAgo(28),review_notes:""}
    ],
    iocs: [
      {id:"IOC-DEMO-011",type:"domain",value:"notice-check.example",severity:"medium",status:"under_review",source:"Sample analyst ticket DEMO-77",notes:"Reserved example domain used only for this walkthrough.",created_at:isoAgo(150)},
      {id:"IOC-DEMO-012",type:"ip",value:"203.0.113.42",severity:"low",status:"false_positive",source:"Documentation sample / TEST-NET",notes:"Reserved documentation address. Not a live threat indicator.",created_at:isoAgo(300)},
      {id:"IOC-DEMO-013",type:"domain",value:"secure-account.example",severity:"high",status:"confirmed",source:"Sample incident report DEMO-81",notes:"Fictional example domain. No lookup or scan has been run.",created_at:isoAgo(65)}
    ],
    alerts: [
      {id:"AL-DEMO-01",title:"Welcome to the DRISHTI sandbox",message:"Explore the user workspace and switch to the Superadmin demo to follow a sample case through review.",level:"info",target:"all",read:false,created_at:isoAgo(20)},
      {id:"AL-DEMO-02",title:"Verification reminder",message:"A review-priority score is not a verdict. Use primary sources and record uncertainty.",level:"medium",target:accounts.user.email,read:false,created_at:isoAgo(80)}
    ],
    contacts: [
      {id:"CT-DEMO-01",name:"Riya Sharma",relationship:"Family",phone:"+91 98XX XXX 210"},
      {id:"CT-DEMO-02",name:"Aman Verma",relationship:"Trusted contact",phone:"+91 97XX XXX 840"}
    ],
    users: [
      {email:accounts.user.email,name:"Demo User",role:"user",created_at:isoAgo(1000),status:"active",cases:2},
      {email:"reviewer.sample@drishti.in",name:"Sample Reporter",role:"user",created_at:isoAgo(2400),status:"active",cases:2},
      {email:accounts.admin.email,name:"Demo Superadmin",role:"superadmin",created_at:isoAgo(800),status:"active",cases:0}
    ],
    audit: [
      {id:"AUD-001",action:"Case moved to under review",actor:accounts.admin.email,entity:"DR-DEMO-1042",at:isoAgo(24)},
      {id:"AUD-002",action:"Evidence sources attached",actor:accounts.admin.email,entity:"DR-DEMO-1045",at:isoAgo(265)},
      {id:"AUD-003",action:"IOC status changed to false positive",actor:accounts.admin.email,entity:"IOC-DEMO-012",at:isoAgo(290)}
    ],
    notices: []
  });

  function loadData() {
    try {
      const parsed = JSON.parse(sessionStorage.getItem(dataKey) || "null");
      if (parsed && Array.isArray(parsed.cases) && Array.isArray(parsed.sos)) return parsed;
    } catch (_) {}
    const fresh = seedData();
    sessionStorage.setItem(dataKey, JSON.stringify(fresh));
    return fresh;
  }
  let db = loadData();
  function saveData() {
    try { sessionStorage.setItem(dataKey, JSON.stringify(db)); }
    catch (_) { toast("This tab could not store more demo data. End the session and start again."); }
  }
  function audit(action, entity) {
    db.audit.unshift({id:uid("AUD"),action,actor:session ? session.email : "demo",entity,at:new Date().toISOString()});
    db.audit = db.audit.slice(0,100);
    saveData();
  }
  function toast(message) {
    const region=$("#toast-region");
    const item=document.createElement("div");
    item.className="toast";
    item.textContent=message;
    region.append(item);
    window.setTimeout(()=>item.remove(),3400);
  }
  function el(tag, className, text) {
    const n=document.createElement(tag);
    if(className) n.className=className;
    if(text!==undefined && text!==null) n.textContent=String(text);
    return n;
  }
  function button(label, action, variant="button-secondary") {
    const b=el("button","button "+variant,label);
    b.type="button";
    b.addEventListener("click",action);
    return b;
  }
  function panel(title, subtitle) {
    const p=el("section","panel");
    if(title || subtitle) {
      const head=el("div","panel-head");
      const copy=el("div","");
      if(title) copy.append(el("h2","",title));
      if(subtitle) copy.append(el("p","",subtitle));
      head.append(copy);p.append(head);
    }
    return p;
  }
  function metric(label,value,foot,icon,footClass="") {
    const c=el("article","stat-card");
    const top=el("div","stat-top");top.append(el("span","",label),el("span","stat-icon",icon||"◈"));
    c.append(top,el("div","stat-value",value),el("div","stat-foot "+footClass,foot||""));
    return c;
  }
  function chip(label,type="") { return el("span","chip "+type,label); }
  function formatDate(value, withTime=true) {
    const d=new Date(value);
    if(Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("en-IN",withTime?{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}:{day:"2-digit",month:"short",year:"numeric"});
  }
  function statusType(status) {
    if(["verified_false","confirmed","supported_by_sources","resolved"].includes(status)) return "teal";
    if(["urgent","high","under_review","received"].includes(status)) return "amber";
    if(["dismissed","false_positive","misleading_context"].includes(status)) return "purple";
    return "";
  }
  function getOwnCases() { return db.cases.filter(c=>c.owner===accounts.user.email); }
  function getVisibleCases() { return session && session.role==="admin" ? db.cases : getOwnCases(); }
  function getMyAlerts() { return db.alerts.filter(a=>a.target==="all" || a.target===accounts.user.email); }
  function remainingMs() {
    try {
      const s=JSON.parse(sessionStorage.getItem(sessionKey)||"null");
      return s && s.expiresAt ? s.expiresAt-Date.now() : 0;
    } catch (_) { return 0; }
  }
  function currentRole() { return session ? session.role : ""; }
  function startSession(role) {
    let expiry=0;
    try { expiry=JSON.parse(sessionStorage.getItem(sessionKey)||"null")?.expiresAt||0; } catch (_) {}
    if(!expiry || expiry<=Date.now()) expiry=Date.now()+DEMO_MS;
    session={role,email:accounts[role].email,expiresAt:expiry};
    sessionStorage.setItem(sessionKey,JSON.stringify(session));
    renderWorkspace();
    updateTimer();
    clearInterval(timerHandle);
    timerHandle=window.setInterval(updateTimer,1000);
    audit("Demo workspace opened",role==="admin"?"Superadmin tour":"User tour");
  }
  function switchRole() {
    session=null;
    clearInterval(timerHandle);
    $("#demo-app").classList.add("hidden");
    $("#login-screen").classList.remove("hidden");
    $("#login-message").textContent="Choose the other role to continue the same sandbox session. Your demo timer will not reset.";
    $("#demo-email").value="";
    $("#demo-password").value="";
  }
  function endSession(expired=false) {
    clearInterval(timerHandle);
    sessionStorage.removeItem(sessionKey);
    sessionStorage.removeItem(dataKey);
    db=seedData();session=null;latestResult=null;selectedCaseId="";
    $("#demo-app").classList.add("hidden");
    $("#login-screen").classList.remove("hidden");
    $("#login-message").textContent=expired
      ? "Your 40-minute demo session has ended. Start a new session to explore again."
      : "Demo session ended. All sample changes in this tab have been cleared.";
    toast(expired?"Demo time expired.":"Demo data cleared.");
  }
  function updateTimer() {
    if(!session) return;
    const left=session.expiresAt-Date.now();
    if(left<=0) { endSession(true); return; }
    const secs=Math.floor(left/1000);
    $("#timer").textContent=String(Math.floor(secs/60)).padStart(2,"0")+":"+String(secs%60).padStart(2,"0");
    $("#timer-progress").style.width=(left/DEMO_MS*100)+"%";
  }
  function roleNav() {
    if(session.role==="admin") return [
      {group:"COMMAND",items:[
        ["overview","Overview","⌂"],["case-desk","Evidence case desk","▤",db.cases.filter(c=>["received","under_review"].includes(c.status)).length],
        ["sos-queue","SOS review queue","⚑",db.sos.filter(s=>["open","under_review"].includes(s.status)).length]
      ]},
      {group:"INTELLIGENCE",items:[["atlas","Global signal atlas","◎"],["threats","Threat intelligence","⌁"]]},
      {group:"PLATFORM",items:[["users","User accounts","♙"],["notices","In-app notices","▧"],["audit","Audit trail","◷"],["methodology","Methodology & limits","ⓘ"]]}
    ];
    return [
      {group:"MY WORKSPACE",items:[["overview","Overview","⌂"],["analyse","Analyse a claim","⌕"],["my-cases","My case files","▤",getOwnCases().length]]},
      {group:"SAFETY & SUPPORT",items:[["safety","Alerts & SOS","⚑",getMyAlerts().filter(a=>!a.read).length],["contacts","Trusted contacts","♙"]]},
      {group:"LEARN",items:[["history","Analysis history","◷"],["guide","How to use DRISHTI","ⓘ"],["methodology","Methodology & limits","⌁"]]}
    ];
  }
  const pageMeta = {
    overview:["WORKSPACE / OVERVIEW","Good morning.","A clear view of your information review activity."],
    analyse:["USER WORKSPACE / ANALYSIS","Inspect before you share.","Submit a public claim and understand which signals may need attention."],
    "my-cases":["USER WORKSPACE / CASE FILES","Your case files.","Track the claims you have submitted for human review."],
    "case-desk":["SUPERADMIN / CASE MANAGEMENT","Evidence case desk.","Review the claim, provenance and context before recording an outcome."],
    "sos-queue":["SUPERADMIN / SAFETY OPERATIONS","SOS review queue.","Triage user-submitted requests. Demo actions never contact real services."],
    safety:["USER WORKSPACE / SAFETY","Alerts & safety.","Review in-app notices and submit a sample internal safety request."],
    contacts:["USER WORKSPACE / TRUSTED CONTACTS","Trusted contacts.","Manage fictional contacts for the safety workflow walkthrough."],
    history:["USER WORKSPACE / ACTIVITY","Analysis history.","A private sample log of analysis actions in this browser session."],
    atlas:["SUPERADMIN / GLOBAL VIEW","Global signal atlas.","Fictional incident markers and analyst-entered network examples."],
    threats:["SUPERADMIN / THREAT INTELLIGENCE","Threat intelligence registry.","Manage sample public indicators with source provenance and review status."],
    users:["SUPERADMIN / PLATFORM","User accounts.","A read-only overview of fictional accounts in the demo environment."],
    notices:["SUPERADMIN / COMMUNICATION","In-app notices.","Create a sample notice and see how it appears in the user workspace."],
    audit:["SUPERADMIN / GOVERNANCE","Admin audit trail.","Review the history of privileged demo actions."],
    guide:["USER WORKSPACE / HELP","Use DRISHTI with confidence.","A walkthrough of the user journey from analysis to evidence-led review."],
    methodology:["PRODUCT / METHODOLOGY","Know what the signals mean.","Understand the baseline engine, evidence standard and important limitations."]
  };
  function renderWorkspace() {
    $("#login-screen").classList.add("hidden");
    $("#demo-app").classList.remove("hidden");
    $("#workspace-role").textContent=session.role==="admin"?"SUPERADMIN TOUR":"USER WORKSPACE";
    $("#workspace-email").textContent=session.email;
    $("#role-dot").parentElement.parentElement.classList.toggle("admin",session.role==="admin");
    activePage="overview";selectedCaseId="";
    renderNav();
    renderPage();
  }
  function renderNav() {
    const nav=$("#demo-nav");nav.replaceChildren();
    roleNav().forEach(group=>{
      nav.append(el("div","nav-group",group.group));
      group.items.forEach(([id,label,icon,count])=>{
        const b=el("button","nav-item"+(activePage===id?" active":""),"");
        b.type="button";b.dataset.page=id;
        b.append(el("span","nav-ico",icon),el("span","",label));
        if(count) b.append(el("span","nav-count",count));
        b.addEventListener("click",()=>navigate(id));
        nav.append(b);
      });
    });
  }
  function navigate(page) {
    activePage=page;selectedCaseId="";
    renderNav();renderPage();
    window.scrollTo({top:0,behavior:"smooth"});
  }
  function renderPage() {
    const meta=pageMeta[activePage]||pageMeta.overview;
    $("#page-breadcrumb").textContent=meta[0].split("/").pop().trim();
    $("#page-kicker").textContent=meta[0];
    $("#page-title").textContent=meta[1];
    if(activePage==="overview" && session.role==="user") $("#page-title").innerHTML='Good morning. <em>Welcome back.</em>';
    if(activePage==="overview" && session.role==="admin") $("#page-title").innerHTML='Good morning. <em>Review desk ready.</em>';
    $("#page-description").textContent=meta[2];
    $("#page-date").textContent=new Date().toLocaleDateString("en-IN",{weekday:"short",day:"2-digit",month:"short",year:"numeric"}).toUpperCase();
    const root=$("#demo-content");root.replaceChildren();
    const fn={
      overview:session.role==="admin"?renderAdminOverview:renderUserOverview,
      analyse:renderAnalysis,
      "my-cases":()=>renderCaseWorkspace(root,false),
      "case-desk":()=>renderCaseWorkspace(root,true),
      safety:renderSafety,
      contacts:renderContacts,
      history:renderHistory,
      atlas:renderAtlas,
      threats:renderThreats,
      "sos-queue":renderSOSQueue,
      users:renderUsers,
      notices:renderNotices,
      audit:renderAudit,
      guide:renderGuide,
      methodology:renderMethodology
    }[activePage]||renderUserOverview;
    fn(root);
  }
  function addTable(container, headers, rows) {
    const wrap=el("div","table-wrap");
    const table=el("table","table"),thead=el("thead",""),tr=el("tr","");
    headers.forEach(x=>tr.append(el("th","",x)));
    thead.append(tr);table.append(thead);
    const tbody=el("tbody","");
    rows.forEach(row=>{const r=el("tr","");row.forEach(cell=>{const td=el("td","");if(cell instanceof Node) td.append(cell);else td.textContent=String(cell??"");r.append(td)});tbody.append(r)});
    table.append(tbody);wrap.append(table);container.append(wrap);
  }
  function activityRow(icon,title,detail) {
    const row=el("div","activity-row");row.append(el("span","activity-mark",icon));
    const copy=el("div","");copy.append(el("b","",title),el("small","",detail));row.append(copy);return row;
  }
  function quickAction(icon,title,detail,action) {
    const b=el("button","quick-action","");b.type="button";b.append(el("i","",icon),el("b","",title),el("small","",detail));b.addEventListener("click",action);return b;
  }
  function renderUserOverview(root) {
    const own=getOwnCases(),open=own.filter(c=>["received","under_review"].includes(c.status)).length;
    const alerts=getMyAlerts(),unread=alerts.filter(a=>!a.read).length;
    const recentAnalyses=db.analyses.filter(a=>a.owner===accounts.user.email);
    const welcome=el("section","welcome-panel");
    welcome.append(chip("YOUR PERSONAL REVIEW WORKSPACE","teal"),el("h2","","Think clearly. Verify the source. Share responsibly."),el("p","","Run an explainable first-pass review, turn a concern into a case file and follow its status. Automated indicators help prioritise attention; only evidence and human review support a conclusion."));
    const actions=el("div","welcome-actions");
    actions.append(button("Analyse a message →",()=>navigate("analyse"),"button-primary"),button("View my cases",()=>navigate("my-cases")));
    welcome.append(actions);root.append(welcome);
    const stats=el("div","grid grid-4");
    stats.append(metric("MY CASE FILES",own.length,"All submitted sample cases","▤"),metric("AWAITING REVIEW",open,"Received or under review","◷",open?"warn":"good"),metric("UNREAD ALERTS",unread,"In-app demo notices","⚑",unread?"warn":"good"),metric("ANALYSIS RUNS",recentAnalyses.length,"Saved in this demo session","⌕"));
    stats.style.marginTop="13px";root.append(stats);
    const grid=el("div","grid grid-2");grid.style.marginTop="13px";
    const cases=panel("Recent case activity","Your latest submitted claims");
    const rows=own.slice().sort((a,b)=>b.updated_at.localeCompare(a.updated_at)).slice(0,4);
    if(!rows.length) cases.append(el("div","empty-state","No cases submitted yet. Run an analysis to create your first case file."));
    else addTable(cases,["CASE / CLAIM","STATUS","UPDATED"],rows.map(c=>[
      (()=>{const n=el("span","strong",c.title);return n})(),
      chip(statusLabels[c.status]||c.status,statusType(c.status)),
      formatDate(c.updated_at)
    ]));
    const recent=panel("Recent activity","Actions within this sandbox tab");
    const items=[];
    own.slice(0,2).forEach(c=>items.push(activityRow("▤",c.title,c.id+" · "+statusLabels[c.status])));
    recentAnalyses.slice(0,2).forEach(a=>items.push(activityRow("⌕","Analysis completed",a.summary+" · "+formatDate(a.created_at))));
    if(!items.length) recent.append(el("div","empty-state","Your actions will appear here."));
    else items.forEach(i=>recent.append(i));
    grid.append(cases,recent);root.append(grid);
    const q=panel("Quick actions","Continue exploring the DRISHTI workflow");
    const quick=el("div","quick-grid");
    quick.append(quickAction("⌕","Analyse a claim","Inspect a message",()=>navigate("analyse")),quickAction("▤","Create a case","Send for human review",()=>navigate("my-cases")),quickAction("⚑","Safety & SOS","Submit an internal request",()=>navigate("safety")));
    q.append(quick);q.style.marginTop="13px";root.append(q);
  }
  function renderAdminOverview(root) {
    const openCases=db.cases.filter(c=>["received","under_review"].includes(c.status)).length;
    const openSos=db.sos.filter(s=>["open","under_review"].includes(s.status)).length;
    const stats=el("div","grid grid-4");
    stats.append(metric("OPEN CASE FILES",openCases,"Require human review","▤",openCases?"warn":"good"),metric("SOS REQUESTS",openSos,"Open / under review","⚑",openSos?"warn":"good"),metric("NETWORK INDICATORS",db.iocs.length,"Sample public IOC entries","⌁"),metric("AUDIT EVENTS",db.audit.length,"Privileged demo actions","◷"));
    root.append(stats);
    const banner=el("section","welcome-panel");banner.style.marginTop="13px";
    banner.append(chip("SUPERADMIN · DEMONSTRATION ROLE","purple"),el("h2","","Evidence first. Every decision traceable."),el("p","","This tour uses fictional reporter accounts and sample records. You can add evidence references, record review outcomes and inspect the audit trail without touching the production environment."));
    const actionRow=el("div","welcome-actions");actionRow.append(button("Open evidence case desk →",()=>navigate("case-desk"),"button-primary"),button("Review SOS queue",()=>navigate("sos-queue")));banner.append(actionRow);root.append(banner);
    const grid=el("div","grid grid-2");grid.style.marginTop="13px";
    const queue=panel("Priority review queue","Oldest open sample items");
    const pending=db.cases.filter(c=>["received","under_review"].includes(c.status)).sort((a,b)=>a.created_at.localeCompare(b.created_at)).slice(0,5);
    if(!pending.length) queue.append(el("div","empty-state","No open case files."));
    else addTable(queue,["CASE","CATEGORY","STATUS"],pending.map(c=>[
      (()=>{const x=el("button","","");x.textContent=c.title;x.addEventListener("click",()=>{selectedCaseId=c.id;navigate("case-desk")});return x})(),
      c.category.replace(/_/g," "),
      chip(statusLabels[c.status],statusType(c.status))
    ]));
    const chart=panel("Case review mix","Illustrative distribution of demo case statuses");
    chart.append(makeStatusChart());grid.append(queue,chart);root.append(grid);
    const activity=panel("Latest admin activity","Recorded within the demo audit log");
    db.audit.slice(0,5).forEach(a=>activity.append(activityRow("◷",a.action,a.actor+" · "+a.entity+" · "+formatDate(a.at))));
    activity.style.marginTop="13px";root.append(activity);
  }
  function makeStatusChart() {
    const groups=[
      ["Received",db.cases.filter(c=>c.status==="received").length],
      ["Review",db.cases.filter(c=>c.status==="under_review").length],
      ["False",db.cases.filter(c=>c.status==="verified_false").length],
      ["Supported",db.cases.filter(c=>c.status==="supported_by_sources").length],
      ["Context",db.cases.filter(c=>c.status==="misleading_context").length],
      ["Other",db.cases.filter(c=>["insufficient_evidence","closed"].includes(c.status)).length]
    ];
    const max=Math.max(1,...groups.map(x=>x[1]));
    const chart=el("div","chart-bars");
    groups.forEach(([label,value])=>{
      const col=el("div","chart-column");col.append(el("small","",value));
      const bar=el("i","");bar.style.height=(value/max*82)+"px";col.append(bar,el("b","",label));chart.append(col);
    });
    return chart;
  }

  const sampleClaims = [
    {label:"Forwarded government notice",platform:"WhatsApp",text:"URGENT: An official announcement says this service will be shut down tomorrow. Forward this to everyone before it is too late!!!",url:""},
    {label:"Suspicious account link",platform:"Telegram",text:"Your account will be blocked immediately. Verify now using this link: https://bit.ly/demo-check and forward this to everyone.",url:"https://bit.ly/demo-check"},
    {label:"Public video claim",platform:"Instagram",text:"A short clip says a public official made a new announcement. The post does not link to the original full recording or provide a publication date.",url:""}
  ];
  function analyseText(text) {
    const value=text.toLowerCase(), signals=[];
    const rules=[
      ["urgency","Urgency language",18,["urgent","act now","immediately","right now","तुरंत","अभी"],"Urgent wording can pressure readers to react before checking the original source."],
      ["share_pressure","Forwarding pressure",22,["forward this","forward to everyone","share with everyone","सबको भेजें","आगे भेजें","फॉरवर्ड करें"],"The message explicitly encourages rapid redistribution rather than independent verification."],
      ["authority","Authority claim without an in-text source",18,["official announcement","government has announced","police confirmed","सरकार ने आदेश","आधिकारिक घोषणा"],"The text invokes an authority but does not include a verifiable primary-source reference."],
      ["forwarded","Forward-chain marker",12,["forwarded many times","forwarded as received","fwd:","फॉरवर्डेड"],"The original publisher, date or surrounding context may be missing."],
      ["panic","Panic or threat language",18,["everyone is at risk","will be shut down","panic","दहशत","हड़कंप","खतरा"],"Alarm-oriented language can amplify fear; the underlying risk still needs evidence."]
    ];
    rules.forEach(([key,label,weight,phrases,detail])=>{
      const matches=phrases.filter(p=>value.includes(p));
      if(matches.length) signals.push({key,label,weight,matched:matches,detail});
    });
    const shorteners=["bit.ly","tinyurl.com","t.co","is.gd","cutt.ly","rb.gy"];
    if(shorteners.some(d=>value.includes(d))){
      signals.push({key:"shortened_link",label:"Shortened link",weight:12,matched:["URL shortener"],detail:"The destination is obscured. Expand and inspect it safely; a shortened URL alone does not prove maliciousness."});
    }
    const letters=text.replace(/[^A-Za-z]/g,""),upper=letters.replace(/[^A-Z]/g,"").length;
    if(letters.length>35 && upper/letters.length>.48) signals.push({key:"capitalisation",label:"Excessive capitalisation",weight:8,matched:["High uppercase ratio"],detail:"Unusually heavy capitalisation can be attention-seeking, but it is not a reliable deception indicator by itself."});
    if(/!{3,}|\?{3,}/.test(text)) signals.push({key:"punctuation",label:"Repeated punctuation",weight:6,matched:["Repeated punctuation"],detail:"Repeated punctuation is a formatting pattern only; it does not establish factual accuracy."});
    const score=Math.min(100,signals.reduce((n,s)=>n+s.weight,0));
    const priority=score>=60?"high":score>=30?"medium":"low";
    const label=priority==="high"?"High review priority":priority==="medium"?"Needs review":"Low signal detected";
    const summary=priority==="high"?"Several selected warning patterns were detected. Check the original source and context before sharing."
      :priority==="medium"?"Some review patterns were detected. Look for the primary source, date and independent confirmation."
      :"Few configured warning patterns matched. This does not establish that the claim is accurate or safe.";
    return {
      id:uid("AN"),score,priority,label,summary,signals,
      checks:["Find the earliest available publication of the claim.","Locate the primary notice, statement, dataset or full recording.","Check the publication date, location and surrounding context.","Compare independent, credible sources before reaching a conclusion.","For images or video, investigate original media and provenance.","Do not enter credentials on unfamiliar or shortened links."],
      method:"Deterministic rule-based demo baseline",
      disclaimer:"This score is review priority, not a probability that the claim is false. This local demo does not browse the web or verify sources."
    };
  }
  function renderAnalysis(root) {
    const grid=el("div","grid grid-2");
    const inputPanel=panel("Submit a claim","Use public content that you are authorised to review.");
    const samples=el("div","sample-row");
    sampleClaims.forEach((sample,index)=>{
      const b=el("button","sample-button",sample.label);b.type="button";b.addEventListener("click",()=>{
        $("#analysis-text").value=sample.text;$("#analysis-platform").value=sample.platform;$("#analysis-url").value=sample.url||"";updateCharCount();
      });samples.append(b);
    });
    inputPanel.append(samples);
    const form=el("form","form-grid");form.id="analysis-form";
    const platform=el("div","field");platform.append(el("label","","SOURCE PLATFORM"));
    const select=document.createElement("select");select.id="analysis-platform";
    ["WhatsApp","Instagram","Telegram","Facebook","X","Website","Other"].forEach(x=>{const o=el("option","",x);o.value=x;select.append(o)});platform.append(select);
    const url=el("div","field");url.append(el("label","","PUBLIC SOURCE URL (OPTIONAL)"));
    const source=document.createElement("input");source.id="analysis-url";source.type="url";source.placeholder="https://official-source.gov.in/notice";url.append(source);
    const message=el("div","field");message.append(el("label","","MESSAGE / CLAIM TO INSPECT"));
    const textarea=document.createElement("textarea");textarea.id="analysis-text";textarea.required=true;textarea.minLength=20;textarea.maxLength=10000;textarea.placeholder="Paste a public claim or suspicious message…";textarea.value=sampleClaims[0].text;message.append(textarea);
    const bottom=el("div","panel-head");bottom.style.marginTop="3px";bottom.append(el("span","char-count",""));const counter=el("span","char-count","0 / 10,000");counter.id="char-counter";bottom.append(counter);
    const note=el("div","form-help","Do not paste passwords, private group conversations or unnecessary personal information. The demo uses local rules only.");
    const submit=el("button","button button-primary","Run signal analysis →");submit.type="submit";
    form.append(platform,url,message,bottom,note,submit);inputPanel.append(form);
    const resultPanel=panel("Analysis report","Run an analysis to see matched signals and next steps.");resultPanel.id="analysis-report";
    resultPanel.append(el("div","empty-state","Your report will appear here. Choose a sample claim or enter your own text."));
    grid.append(inputPanel,resultPanel);root.append(grid);
    updateCharCount();
    textarea.addEventListener("input",updateCharCount);
    form.addEventListener("submit",event=>{
      event.preventDefault();
      const text=textarea.value.trim();
      if(text.length<20){toast("Enter at least 20 characters.");return;}
      const sourceUrl=source.value.trim();
      if(sourceUrl){try{const parsed=new URL(sourceUrl);if(!["http:","https:"].includes(parsed.protocol))throw new Error();}catch(_){toast("Enter a valid HTTP or HTTPS source URL.");return;}}
      latestResult=analyseText(text);
      latestResult.text=text;latestResult.platform=select.value;latestResult.source_url=sourceUrl;
      db.analyses.unshift({id:latestResult.id,summary:text.slice(0,90),platform:select.value,score:latestResult.score,priority:latestResult.priority,created_at:new Date().toISOString(),signals:latestResult.signals.length,owner:accounts.user.email});
      db.analyses=db.analyses.slice(0,50);saveData();
      renderAnalysisReport(resultPanel,latestResult);
      toast("Analysis complete. No factual verdict was generated.");
    });
  }
  function updateCharCount() {
    const n=$("#analysis-text"),c=$("#char-counter");
    if(n&&c)c.textContent=n.value.length.toLocaleString()+" / 10,000";
  }
  function renderAnalysisReport(root,result) {
    root.replaceChildren();
    const header=el("div","panel-head");header.append(el("div","",""),chip(result.priority.toUpperCase()+" PRIORITY",result.priority==="high"?"red":result.priority==="medium"?"amber":"teal"));
    const title=el("h2","","Review-priority result");title.style.margin="0 0 13px";root.append(header,title);
    const block=el("div","score-block");
    const ring=el("div","score-ring");ring.style.background="conic-gradient("+(result.priority==="high"?"var(--red)":result.priority==="medium"?"var(--amber)":"var(--teal)")+" "+(result.score*3.6)+"deg,#263b46 0deg)";ring.append(el("span","",result.score));
    const copy=el("div","score-copy");copy.append(el("small","","REVIEW PRIORITY / 100"),el("h3","",result.label),el("p","",result.summary));
    block.append(ring,copy);root.append(block);
    const sig=panel("Detected signals",result.signals.length+" selected patterns matched");
    if(!result.signals.length)sig.append(el("div","empty-state","No configured warning patterns matched. This is not proof that the content is true."));
    result.signals.forEach(s=>{
      const row=el("div","signal-row");row.append(el("i","","⌁"));
      const content=el("div","");content.append(el("b","",s.label),el("small","",s.detail),el("small","","Matched: "+s.matched.join(", ")));row.append(content);sig.append(row);
    });
    const checks=panel("Recommended verification checks","Use primary evidence before sharing or concluding.");
    const ul=el("ol","check-list");result.checks.forEach(c=>ul.append(el("li","",c)));checks.append(ul);
    const caution=el("div","callout","This is an explainable, deterministic demo heuristic. It does not fetch the source URL, verify a government notice, analyse media or determine whether a claim is true or false.");
    root.append(sig,checks,caution);
    const action=el("div","welcome-actions");action.style.marginTop="12px";
    action.append(button("Create a case file →",()=>createCaseFromAnalysis(result),"button-primary"),button("Run another analysis",()=>navigate("analyse")));
    root.append(action);
  }
  function createCaseFromAnalysis(result) {
    const item={
      id:uid("DR-DEMO"),title:(result.text.split(/[.!?\n]/)[0]||"User-submitted claim").slice(0,110),
      category:result.signals.some(s=>s.key==="shortened_link")?"phishing":"misinformation",
      status:"received",platform:result.platform,claim:result.text,source_url:result.source_url,
      owner:accounts.user.email,reporter:"Demo User",evidence_summary:"",evidence_sources:[],reviewer_notes:"",
      created_at:new Date().toISOString(),updated_at:new Date().toISOString(),
      timeline:[{at:new Date().toISOString(),title:"Case created from analysis",detail:"Review-priority score "+result.score+" · human review required"}]
    };
    db.cases.unshift(item);audit("Case file submitted",item.id);saveData();selectedCaseId=item.id;
    toast("Case "+item.id+" submitted to the demo review queue.");
    navigate("my-cases");
  }

  function renderCaseWorkspace(root,isAdmin) {
    let cases=getVisibleCases().slice().sort((a,b)=>b.updated_at.localeCompare(a.updated_at));
    if(caseFilter!=="all")cases=cases.filter(c=>c.status===caseFilter);
    if(caseSearch)cases=cases.filter(c=>(c.title+" "+c.id+" "+c.category).toLowerCase().includes(caseSearch.toLowerCase()));
    if(!selectedCaseId || !getVisibleCases().some(c=>c.id===selectedCaseId))selectedCaseId=cases[0]?.id||"";
    const layout=el("div","case-layout");
    const left=panel(isAdmin?"Review queue":"Submitted by you",isAdmin?db.cases.length+" demo case files across sample reporters":getOwnCases().length+" case files in your sample account");
    const tools=el("div","form-grid");
    const search=el("input","");search.type="search";search.placeholder="Search case ID or title…";search.value=caseSearch;search.className="input";
    search.addEventListener("input",()=>{caseSearch=search.value;renderCaseWorkspace(root,isAdmin);});
    const filter=el("select","input");
    [["all","All statuses"],...allStatuses.map(s=>[s,statusLabels[s]])].forEach(([v,l])=>{const o=el("option","",l);o.value=v;if(v===caseFilter)o.selected=true;filter.append(o)});
    filter.addEventListener("change",()=>{caseFilter=filter.value;renderCaseWorkspace(root,isAdmin);});
    tools.append(search,filter);left.append(tools);
    const list=el("div","case-list");
    cases.forEach(c=>{
      const b=el("button","case-list-item"+(selectedCaseId===c.id?" selected":""));
      b.type="button";b.append(el("b","",c.title),el("small","",c.id+" · "+statusLabels[c.status]+" · "+formatDate(c.updated_at)));
      b.addEventListener("click",()=>{selectedCaseId=c.id;renderCaseWorkspace(root,isAdmin);});
      list.append(b);
    });
    if(!cases.length)list.append(el("div","empty-state","No cases match this filter."));
    left.append(list);
    const detail=el("section","panel");
    const chosen=getVisibleCases().find(c=>c.id===selectedCaseId);
    if(chosen)renderCaseDetail(detail,chosen,isAdmin);
    else detail.append(el("div","empty-state","Select a case file to view its evidence and timeline."));
    layout.append(left,detail);root.append(layout);
  }
  function renderCaseDetail(root,item,isAdmin) {
    const head=el("div","case-detail-head"),title=el("div","");
    title.append(el("h2","",item.title),el("div","meta",item.id+" · "+item.category.replace(/_/g," ").toUpperCase()+" · "+item.platform+" · "+formatDate(item.created_at)));
    head.append(title,chip(statusLabels[item.status]||item.status,statusType(item.status)));root.append(head);
    root.append(el("div","callout","Signal detection is not a factual finding. Review the primary source, date, context and independent corroboration."));
    const claim=panel("Submitted claim","Original text supplied by the reporter");
    const p=el("p","",item.claim);p.style.whiteSpace="pre-wrap";claim.append(p);
    if(item.source_url){const a=el("a","source-link","Open submitted source ↗");a.href=item.source_url;a.target="_blank";a.rel="noreferrer";claim.append(a);}
    root.append(claim);
    const evidence=panel("Evidence record",(item.evidence_sources||[]).length+" source references");
    evidence.append(el("p","",item.evidence_summary||"No reviewer evidence summary has been added yet."));
    (item.evidence_sources||[]).forEach((source,i)=>{const a=el("a","source-link","Evidence source "+(i+1)+" ↗");a.href=source;a.target="_blank";a.rel="noreferrer";evidence.append(a);});
    if(item.reviewer_notes)evidence.append(el("p","","Reviewer notes: "+item.reviewer_notes));
    root.append(evidence);
    const timeline=panel("Case history","Chronological sample events");
    const t=el("div","timeline");
    (item.timeline||[]).slice().reverse().forEach(ev=>{
      const row=el("div","timeline-item");row.append(el("i","timeline-dot"));
      const c=el("div","");c.append(el("b","",ev.title),el("small","",formatDate(ev.at)+" · "+ev.detail));row.append(c);t.append(row);
    });
    timeline.append(t);root.append(timeline);
    if(isAdmin){
      const review=panel("Superadmin review","A reviewed outcome requires an evidence summary and at least one HTTP/HTTPS source URL.");
      const form=el("form","form-grid");form.id="review-form";
      const statusField=el("div","field");statusField.append(el("label","","REVIEW OUTCOME"));
      const select=el("select","input");
      allStatuses.forEach(s=>{const o=el("option","",statusLabels[s]);o.value=s;if(s===item.status)o.selected=true;select.append(o);});statusField.append(select);
      const summary=el("div","field");summary.append(el("label","","EVIDENCE SUMMARY"));
      const textarea=el("textarea","input");textarea.rows=4;textarea.maxLength=3000;textarea.placeholder="What does the primary evidence establish? What remains uncertain?";textarea.value=item.evidence_summary||"";summary.append(textarea);
      const sources=el("div","field");sources.append(el("label","","EVIDENCE SOURCE URLS · ONE PER LINE"));
      const input=el("textarea","input");input.rows=3;input.maxLength=5000;input.placeholder="https://official-source.example/notice";input.value=(item.evidence_sources||[]).join("\n");sources.append(input);
      const notes=el("div","field");notes.append(el("label","","INTERNAL REVIEWER NOTES"));
      const noteInput=el("textarea","input");noteInput.rows=2;noteInput.maxLength=2000;noteInput.value=item.reviewer_notes||"";notes.append(noteInput);
      const msg=el("small","form-help","This is a browser-only demonstration. No public alert, takedown or external report will be triggered.");
      const save=el("button","button button-primary","Save review decision");save.type="submit";
      form.append(statusField,summary,sources,notes,msg,save);
      form.addEventListener("submit",event=>{
        event.preventDefault();
        const newStatus=select.value,urls=input.value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
        if(outcomeStatuses.includes(newStatus)&&(!textarea.value.trim()||!urls.length)){toast("A final outcome needs an evidence summary and at least one source URL.");return;}
        try{urls.forEach(u=>{const parsed=new URL(u);if(!["http:","https:"].includes(parsed.protocol))throw new Error();});}
        catch(_){toast("Evidence sources must be valid HTTP or HTTPS URLs.");return;}
        item.status=newStatus;item.evidence_summary=textarea.value.trim();item.evidence_sources=urls;item.reviewer_notes=noteInput.value.trim();item.updated_at=new Date().toISOString();
        item.timeline=item.timeline||[];item.timeline.push({at:item.updated_at,title:"Review updated: "+statusLabels[newStatus],detail:"Saved by "+accounts.admin.email});
        audit("Case review saved · "+statusLabels[newStatus],item.id);saveData();toast("Case review saved in the sandbox.");
        renderPage();
      });
      root.append(review,form);
    }
  }
  function renderSafety(root) {
    const grid=el("div","grid grid-2");
    const formPanel=panel("Submit an internal SOS request","Use this demo to understand the form. No one is contacted.");
    const form=el("form","form-grid");
    const titleField=fieldInput("INCIDENT TITLE","text","Incident title","Suspicious public message reported");
    const detailsField=fieldInput("WHAT HAPPENED?","textarea","Incident details","I received a suspicious public message and would like it reviewed against an original source.");
    const urgencyField=fieldSelect("URGENCY","sos-urgency",["normal","high","urgent"]);
    const sourceField=fieldInput("PUBLIC SOURCE URL (OPTIONAL)","url","https://source.example");
    const locationLabel=el("label","field");const checkbox=document.createElement("input");checkbox.type="checkbox";checkbox.id="fake-location";checkbox.style.width="auto";
    const checkRow=el("div","");checkRow.style.display="flex";checkRow.style.gap="8px";checkRow.style.alignItems="center";checkRow.append(checkbox,el("span","","Include fictional sample location (never uses device GPS)"));locationLabel.append(checkRow);
    const help=el("div","form-help","Production location sharing is opt-in and captures a one-time snapshot only when an SOS is submitted. This sandbox uses a labelled fictional location.");
    const submit=el("button","button button-primary","Submit demo SOS →");submit.type="submit";
    form.append(titleField,detailsField,urgencyField,sourceField,locationLabel,help,submit);formPanel.append(form);
    form.addEventListener("submit",event=>{
      event.preventDefault();
      if(titleField.querySelector("input").value.trim().length<4||detailsField.querySelector("textarea").value.trim().length<10){toast("Add an incident title and details.");return;}
      const record={id:uid("SOS"),title:titleField.querySelector("input").value.trim(),details:detailsField.querySelector("textarea").value.trim(),urgency:urgencyField.querySelector("select").value,status:"open",owner:accounts.user.email,location_shared:checkbox.checked,location_label:checkbox.checked?"Fictional sample location · Indore region":"Not shared",source_url:sourceField.querySelector("input").value.trim(),created_at:new Date().toISOString(),review_notes:""};
      db.sos.unshift(record);audit("Demo SOS submitted",record.id);saveData();toast("Demo SOS placed in the sample review queue.");renderPage();
    });
    const queue=panel("My safety requests","Sample request history");
    db.sos.filter(s=>s.owner===accounts.user.email).forEach(s=>queue.append(sosCard(s,false)));
    if(!db.sos.some(s=>s.owner===accounts.user.email))queue.append(el("div","empty-state","No sample safety requests yet."));
    grid.append(formPanel,queue);root.append(grid);
    const note=el("div","callout","DRISHTI SOS is an internal review request, not an emergency dispatch service. It does not call police, emergency services or trusted contacts. In immediate danger, use local emergency channels.");note.style.marginTop="12px";root.append(note);
  }
  function fieldInput(label,type,placeholder,value="") {
    const f=el("div","field");f.append(el("label","",label));
    const n=type==="textarea"?el("textarea","input"):document.createElement("input");
    if(type==="textarea"){n.rows=4;n.value=value;}else{n.type=type;n.placeholder=placeholder||"";n.value=value;}
    f.append(n);return f;
  }
  function fieldSelect(label,id,values) {
    const f=el("div","field");f.append(el("label","",label));
    const s=el("select","input");s.id=id;
    values.forEach(v=>{const o=el("option","",v.replace(/_/g," "));o.value=v;s.append(o);});
    f.append(s);return f;
  }
  function sosCard(item,isAdmin) {
    const c=el("article","notice-card");
    const top=el("div","panel-head");top.append(el("h3","",item.title),chip(item.status.replace(/_/g," "),statusType(item.status)));c.append(top);
    c.append(el("p","",item.details),el("small","",item.id+" · "+item.urgency.toUpperCase()+" · "+formatDate(item.created_at)));
    c.append(el("small","",item.location_label||"Location not shared"));
    if(isAdmin){
      const row=el("div","form-grid");const sel=el("select","input");["open","under_review","resolved","dismissed"].forEach(v=>{const o=el("option","",v.replace(/_/g," "));o.value=v;if(item.status===v)o.selected=true;sel.append(o);});
      const note=el("input","input");note.placeholder="Reviewer note";note.value=item.review_notes||"";
      row.append(sel,note,button("Save review",()=>{item.status=sel.value;item.review_notes=note.value;item.updated_at=new Date().toISOString();audit("SOS request reviewed · "+item.status,item.id);saveData();toast("SOS review updated.");renderPage();},"button-primary"));
      c.append(row);
    }else if(item.review_notes)c.append(el("small","", "Reviewer note: "+item.review_notes));
    return c;
  }
  function renderSOSQueue(root) {
    const open=db.sos.filter(s=>["open","under_review"].includes(s.status)).length;
    const stats=el("div","grid grid-3");stats.append(metric("TOTAL REQUESTS",db.sos.length,"All fictional SOS entries","⚑"),metric("OPEN QUEUE",open,"Awaiting review","◷"),metric("LOCATION SHARED",db.sos.filter(s=>s.location_shared).length,"Opt-in sample points only","◎"));
    root.append(stats);
    const list=panel("Incoming safety requests","Only simulated reports are shown. No dispatch is possible.");
    db.sos.forEach(s=>list.append(sosCard(s,true)));
    if(!db.sos.length)list.append(el("div","empty-state","No demo SOS requests."));
    root.append(list);
    root.append(el("div","callout","Location points in this demo are synthetic labels. Production maps display only explicit one-time GPS shares and approximate analyst-entered public IOC coordinates."));
  }
  function renderContacts(root) {
    const grid=el("div","grid grid-2");
    const formPanel=panel("Add a trusted contact","Fictional contact data stored only in this tab.");
    const form=el("form","form-grid");
    const name=fieldInput("CONTACT NAME","text","Full name");
    const relationship=fieldSelect("RELATIONSHIP","contact-relationship",["Family","Friend","Colleague","Trusted contact"]);
    const phone=fieldInput("PHONE (DEMO ONLY)","tel","+91 98XX XXX XXX");
    const save=el("button","button button-primary","Add contact");save.type="submit";
    form.append(name,relationship,phone,el("div","form-help","Use fictional contact details in this public demo. No call or message can be sent."),save);formPanel.append(form);
    form.addEventListener("submit",event=>{
      event.preventDefault();const n=name.querySelector("input").value.trim(),p=phone.querySelector("input").value.trim();
      if(!n||p.length<7){toast("Enter a contact name and sample phone number.");return;}
      db.contacts.push({id:uid("CT"),name:n,relationship:relationship.querySelector("select").value,phone:p});audit("Trusted contact added","demo contact");saveData();toast("Sample contact added.");renderPage();
    });
    const list=panel("Your trusted contacts",db.contacts.length+" saved sample contact(s)");
    db.contacts.forEach(contact=>{
      const row=el("article","notice-card");const head=el("div","panel-head");head.append(el("h3","",contact.name),chip(contact.relationship.toUpperCase()));
      head.append(button("Remove",()=>{db.contacts=db.contacts.filter(x=>x.id!==contact.id);audit("Trusted contact removed",contact.id);saveData();renderPage();},"button-secondary"));
      row.append(head,el("small","",contact.phone+" · "+contact.id));list.append(row);
    });
    grid.append(formPanel,list);root.append(grid);
  }
  function renderHistory(root) {
    const list=panel("Analysis history","Recent sample analyses recorded in this browser session.");
    const rows=db.analyses.filter(a=>a.owner===accounts.user.email).sort((a,b)=>b.created_at.localeCompare(a.created_at));
    if(!rows.length)list.append(el("div","empty-state","No analysis runs yet. Visit Analyse a claim to create a sample report."));
    else addTable(list,["REFERENCE","SOURCE","REVIEW SCORE","SIGNALS","DATE"],rows.map(a=>[
      a.id,a.platform,chip(a.score+"/100",a.priority==="high"?"red":a.priority==="medium"?"amber":"teal"),a.signals,formatDate(a.created_at)
    ]));
    root.append(list);
  }
  function renderGuide(root) {
    const grid=el("div","grid grid-2");
    const steps=panel("User journey","Follow these steps in order to understand the product.");
    [
      ["01","Submit a claim","Paste a public message, choose the platform and optionally provide the source URL."],
      ["02","Inspect the signals","Read the matched patterns and the reasons they were flagged. The score is not a truth percentage."],
      ["03","Verify independently","Find primary sources, check dates and compare independent publications."],
      ["04","Create a case file","When follow-up is needed, create a structured case with a neutral title and source context."],
      ["05","Follow the review","Use My case files to see the status and any reviewer evidence summary."]
    ].forEach(([n,t,d])=>{const row=activityRow(n,t,d);steps.append(row);});
    const mobile=panel("Use DRISHTI on your phone","The production app is a Progressive Web App.");
    mobile.append(el("p","","Android: open the HTTPS workspace in Chrome → browser menu → Install app / Add to Home screen."));
    mobile.append(el("p","","iPhone: open the HTTPS workspace in Safari → Share → Add to Home Screen."));
    mobile.append(el("p","","The cached app shell can open offline; authentication, analysis and persistent case actions still require the live API and database."));
    mobile.append(button("Open illustrated user guide ↗",()=>window.open("guide.html","_blank","noopener"),"button-primary"));
    grid.append(steps,mobile);root.append(grid);
  }
  function renderMethodology(root) {
    const grid=el("div","grid grid-2");
    const method=panel("What the current baseline checks","Explainable, deterministic pattern matching.");
    [
      ["Urgency language","Words such as urgent, immediately or तुरंत."],
      ["Forwarding pressure","Requests to forward or share a message widely."],
      ["Authority claims","Official or government claims without an in-text primary source."],
      ["Panic wording","Alarm-oriented phrases that can pressure readers."],
      ["Shortened links","Selected URL shortener domains that obscure the destination."],
      ["Formatting patterns","Excessive capitalisation and repeated punctuation."]
    ].forEach(([a,b])=>method.append(activityRow("⌁",a,b)));
    const limits=panel("What it does not establish","Do not use an automated signal as a public verdict.");
    [
      "It does not browse the internet or fetch the linked source.",
      "It does not confirm whether an institution made a statement.",
      "It does not inspect image, audio or video files.",
      "It does not detect every manipulated or AI-generated media item.",
      "It does not identify the author, intent or person behind an IP address.",
      "It does not report users, contact emergency services or take down content."
    ].forEach(x=>limits.append(el("div","signal-row","• "+x)));
    limits.append(el("div","callout","A genuine urgent alert can trigger a false positive. A subtle or unfamiliar false claim can be missed. Human verification and source evidence remain essential."));
    grid.append(method,limits);root.append(grid);
  }
  function renderAtlas(root) {
    const p=panel("Global signal atlas","Fictional points for the guided tour — no live user locations.");
    const map=document.createElement("div");
    map.innerHTML='<svg class="atlas" viewBox="0 0 1000 470" role="img" aria-label="Fictional global demonstration map"><defs><linearGradient id="ocean" x2="1" y2="1"><stop stop-color="#123343"/><stop offset="1" stop-color="#091724"/></linearGradient><pattern id="gridlines" width="50" height="47" patternUnits="userSpaceOnUse"><path d="M50 0H0V47" fill="none" stroke="#8ac9c7" stroke-opacity=".12"/></pattern></defs><rect width="1000" height="470" rx="16" fill="url(#ocean)"/><rect width="1000" height="470" rx="16" fill="url(#gridlines)"/><g fill="#2a5868" stroke="#75a7ac" stroke-opacity=".35" stroke-width="2"><path d="M72 84l42-25 67 8 43 29 13 36-24 22-14 38-40 6-19-25-35-7-17-32-29-18zM183 205l30 12 26 42-11 40-17 47-22 46-18-31-6-47-18-38 13-45zM390 83l32-20 49 7 25 24-8 28-39 14-34-18zM430 143l35 14 36 44-9 51-22 66-34 60-26-43-6-67 11-59zM488 87l67-31 91 8 39 26 53-8 75 41 39 42-24 34-56-5-21 23-49-11-29 26-43-18-28 16-33-28-48-1-28-35-41-11-12-35zM813 286l43-15 63 18 21 38-34 29-61-9-38-28z"/></g><g><circle cx="234" cy="159" r="7" fill="#69dccb"/><circle cx="234" cy="159" r="19" fill="none" stroke="#69dccb" stroke-opacity=".5"><animate attributeName="r" values="9;26;9" dur="4s" repeatCount="indefinite"/></circle><circle cx="558" cy="172" r="7" fill="#b2a8e9"/><circle cx="558" cy="172" r="19" fill="none" stroke="#b2a8e9" stroke-opacity=".5"><animate attributeName="r" values="9;25;9" dur="3.7s" repeatCount="indefinite"/></circle><circle cx="705" cy="275" r="7" fill="#69dccb"/><circle cx="705" cy="275" r="19" fill="none" stroke="#69dccb" stroke-opacity=".5"><animate attributeName="r" values="9;25;9" dur="4.2s" repeatCount="indefinite"/></circle></g><text x="28" y="442" fill="#85aab5" font-size="11" letter-spacing="2">SYNTHETIC SAMPLE MAP · NOT REAL INCIDENT LOCATIONS</text></svg>';
    p.append(map);
    const legend=el("div","atlas-legend");legend.innerHTML='<span><i></i> Fictional user-shared SOS point</span><span><i class="purple"></i> Fictional public IOC point</span>';p.append(legend);
    p.append(el("div","callout","Production maps are limited to explicit one-time SOS GPS shares and analyst-entered approximate public IOC locations. IP geolocation does not identify a person or show live movement."));
    root.append(p);
  }
  function validPublicIpv4(value) {
    const parts=value.split(".");
    if(parts.length!==4||parts.some(x=>!/^(0|[1-9]\d{0,2})$/.test(x)||Number(x)>255))return false;
    const [a,b]=parts.map(Number);
    if(a===0||a===10||a===127||a>=224||a===169&&b===254||a===172&&b>=16&&b<=31||a===192&&b===168)return false;
    if(a===192&&b===0||a===198&&(b===18||b===19)||a===203&&b===0)return false;
    return true;
  }
  function validDomain(value) {
    return value.length<=253 && /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(value);
  }
  function renderThreats(root) {
    const grid=el("div","grid grid-2");
    const formPanel=panel("Add a public indicator","Demo-only IOC register. No network lookup or scanning is run.");
    const form=el("form","form-grid");
    const type=fieldSelect("INDICATOR TYPE","ioc-kind",["domain","ip"]);
    const value=fieldInput("PUBLIC IP ADDRESS / DOMAIN","text","example.org");
    const severity=fieldSelect("SEVERITY","ioc-severity",["low","medium","high","critical"]);
    const source=fieldInput("SOURCE / EVIDENCE REFERENCE","text","Incident ticket or approved feed");
    const notes=fieldInput("ANALYST NOTES","textarea","Why this indicator needs review.");
    const msg=el("div","form-help","Private, local and reserved IP ranges must not be treated as public threat indicators. Use fictional examples only.");
    const save=el("button","button button-primary","Add to demo registry");save.type="submit";
    form.append(type,value,severity,source,notes,msg,save);formPanel.append(form);
    form.addEventListener("submit",event=>{
      event.preventDefault();
      const kind=type.querySelector("select").value,v=value.querySelector("input").value.trim().toLowerCase().replace(/\.$/,""),src=source.querySelector("input").value.trim();
      if(kind==="ip"&&!validPublicIpv4(v)){toast("Enter a valid public IPv4 address. Private or reserved ranges are rejected.");return;}
      if(kind==="domain"&&!validDomain(v)){toast("Enter a valid domain name without protocol or URL path.");return;}
      if(src.length<3){toast("Add a source or evidence reference.");return;}
      db.iocs.unshift({id:uid("IOC"),type:kind,value:v,severity:severity.querySelector("select").value,status:"under_review",source:src,notes:notes.querySelector("textarea").value,created_at:new Date().toISOString()});
      audit("Public IOC added",v);saveData();toast("Sample indicator added to the registry.");renderPage();
    });
    const list=panel("Registered indicators",db.iocs.length+" demo records");
    db.iocs.forEach(item=>{
      const c=el("article","notice-card");const head=el("div","panel-head");head.append(el("h3","",item.value),chip(item.severity.toUpperCase(),item.severity==="critical"||item.severity==="high"?"red":"amber"));c.append(head);
      c.append(el("p","",item.type.toUpperCase()+" · "+item.status.replace(/_/g," ")+" · "+item.source),el("small","",item.notes||"No analyst notes"));
      const select=el("select","input");
      ["under_review","confirmed","false_positive"].forEach(v=>{const o=el("option","",v.replace(/_/g," "));o.value=v;if(v===item.status)o.selected=true;select.append(o);});
      c.append(select,button("Update status",()=>{item.status=select.value;audit("IOC review status updated",item.id);saveData();toast("Indicator status updated.");renderPage();},"button-secondary"));
      list.append(c);
    });
    grid.append(formPanel,list);root.append(grid);
    root.append(el("div","callout","The production IOC module stores analyst-entered public indicators and provenance. It is not a malware scanner, does not scan private networks and does not identify visitors."));
  }
  function renderUsers(root) {
    const stats=el("div","grid grid-3");stats.append(metric("DEMO ACCOUNTS",db.users.length,"Fictional identities only","♙"),metric("USER ACCOUNTS",db.users.filter(u=>u.role==="user").length,"Standard role","◎"),metric("SUPERADMIN",db.users.filter(u=>u.role==="superadmin").length,"Single demo admin","⌘"));root.append(stats);
    const p=panel("Registered demo accounts","Read-only sample account directory. No passwords or real account data are exposed.");
    addTable(p,["ACCOUNT","ROLE","STATUS","CASE FILES","JOINED"],db.users.map(u=>[el("span","strong",u.name+" · "+u.email),chip(u.role,u.role==="superadmin"?"purple":"teal"),u.status,u.cases,formatDate(u.created_at,false)]));
    root.append(p);
  }
  function renderNotices(root) {
    const grid=el("div","grid grid-2");
    const formPanel=panel("Publish a sample notice","This creates an in-app demo notification only.");
    const form=el("form","form-grid"),title=fieldInput("NOTICE TITLE","text","Verification update"),message=fieldInput("MESSAGE","textarea","Write a short notice for demo users."),level=fieldSelect("PRIORITY","notice-level",["info","medium","high"]),target=fieldSelect("RECIPIENT","notice-target",["all","user"]);
    const save=el("button","button button-primary","Publish demo notice");save.type="submit";form.append(title,message,level,target,save);formPanel.append(form);
    form.addEventListener("submit",event=>{
      event.preventDefault();const t=title.querySelector("input").value.trim(),m=message.querySelector("textarea").value.trim();if(t.length<4||m.length<10){toast("Add a notice title and at least 10 characters.");return;}
      db.alerts.unshift({id:uid("AL"),title:t,message:m,level:level.querySelector("select").value,target:target.querySelector("select").value==="all"?"all":accounts.user.email,read:false,created_at:new Date().toISOString()});
      audit("In-app demo notice published",t);saveData();toast("Demo notice published.");renderPage();
    });
    const out=panel("Recent in-app notices",db.alerts.length+" sample and demo notices");
    db.alerts.forEach(a=>{const c=el("article","notice-card");c.append(el("div","case-head","",""));c.append(el("b","",a.title),chip(a.level.toUpperCase(),a.level==="high"?"red":"amber"),el("p","",a.message),el("small","",a.target==="all"?"All demo users":a.target+" · "+formatDate(a.created_at)));out.append(c);});
    grid.append(formPanel,out);root.append(grid);
  }
  function renderAudit(root) {
    const p=panel("Privileged action history","Events are recorded as sample data in this session's browser storage.");
    const rows=db.audit.slice().sort((a,b)=>b.at.localeCompare(a.at));
    if(!rows.length)p.append(el("div","empty-state","No audit events yet."));
    else addTable(p,["TIME","ACTION","ACTOR","ENTITY"],rows.map(a=>[formatDate(a.at),a.action,a.actor,a.entity]));
    root.append(p);
    root.append(el("div","callout","Production audit events are written by the backend. Client-side demo records are illustrative and can be modified by the browser owner."));
  }

  function renderAlertsInto(root,interactive) {
    const alerts=interactive?getMyAlerts():db.alerts;
    if(!alerts.length)root.append(el("div","empty-state","No notices yet."));
    alerts.forEach(a=>{
      const c=el("article","notice-card"),top=el("div","panel-head");
      top.append(el("h3","",a.title),chip(a.level.toUpperCase(),a.level==="high"?"red":a.level==="medium"?"amber":"teal"));
      c.append(top,el("p","",a.message),el("small","",formatDate(a.created_at)+" · "+(a.target==="all"?"All demo users":"Targeted notice")));
      if(interactive&&!a.read){c.append(button("Mark as read",()=>{a.read=true;saveData();renderPage();toast("Notice marked as read.");}));}
      root.append(c);
    });
  }
  function renderNoticesUser(root) {
    const p=panel("Your notifications","Notices addressed to this demo user.");
    renderAlertsInto(p,true);root.append(p);
  }
  function renderUserCasesShortcut(root) { renderCaseWorkspace(root,false); }

  function renderPlaceholder(root) { root.append(el("div","empty-state","This module is not available in the selected role.")); }

  $("#demo-login").addEventListener("submit",event=>{
    event.preventDefault();
    const email=$("#demo-email").value.trim().toLowerCase(),pass=$("#demo-password").value;
    const match=Object.entries(accounts).find(([,a])=>a.email===email&&a.password===pass);
    if(!match){$("#login-message").textContent="Demo ID or password did not match. Use the role credentials shown above.";return;}
    $("#login-message").textContent="";startSession(match[0]);
  });
  document.querySelectorAll("[data-launch]").forEach(b=>b.addEventListener("click",()=>startSession(b.dataset.launch)));
  $("#switch-role").addEventListener("click",switchRole);
  $("#top-switch").addEventListener("click",switchRole);
  $("#exit-demo").addEventListener("click",()=>endSession(false));

  // Route selection and views that depend on role are intentionally local to this simulator.
  const originalRenderPage=renderPage;
  // Replace the generic nav action after workspace setup with a role-aware page renderer.
  function renderRolePage() {
    if(!session)return;
    if(activePage==="safety" && session.role==="admin") return renderSOSQueue($("#demo-content"));
    if(activePage==="notices" && session.role==="user") return renderNoticesUser($("#demo-content"));
    originalRenderPage();
  }
  // Role-specific route normalisation.
  const originalNavigate=navigate;
  navigate=function(page) {
    if(session.role==="user" && page==="notices") page="safety";
    if(session.role==="admin" && page==="safety") page="sos-queue";
    originalNavigate(page);
  };
  // Update nav links to include notice centre for users.
  function roleNavPatched() {
    return roleNav();
  }
  const restore=(()=>{})();

  // The original renderer maps page IDs to the page implementations above.
  // User safety view includes an in-app notices list at the top.
  const originalSafety=renderSafety;
  renderSafety=function(root) {
    const notices=panel("Recent alerts","In-app demo notifications");
    renderAlertsInto(notices,true);
    root.append(notices);
    originalSafety(root);
  };

  // User role receives its own notification centre route alias.
  const baseRoleNav=roleNav;
  roleNav=function() {
    const groups=baseRoleNav();
    if(session.role==="user") {
      groups[1].items.unshift(["notices","Notification centre","▧",getMyAlerts().filter(a=>!a.read).length]);
    }
    return groups;
  };
  // Keep session continuity across refreshes in the same tab; the countdown is never reset by switching roles.
  try {
    const saved=JSON.parse(sessionStorage.getItem(sessionKey)||"null");
    if(saved&&saved.expiresAt>Date.now()&&accounts[saved.role]&&saved.email===accounts[saved.role].email) {
      session=saved;renderWorkspace();clearInterval(timerHandle);timerHandle=window.setInterval(updateTimer,1000);updateTimer();
    } else if(saved) { sessionStorage.removeItem(sessionKey); }
  } catch (_) { sessionStorage.removeItem(sessionKey); }
})();
