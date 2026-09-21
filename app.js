(() => {
  const PLAN = window.PLAN_DATA;
  const KEY = "charukkhawe-budget-plan-2569-v3";
  const STATUSES = ["ยังไม่เริ่ม","กำลังดำเนินการ","รอเอกสาร/หลักฐาน","รอสรุปผล","เสร็จสิ้น"];
  const $ = (id) => document.getElementById(id);
  const money = (v) => new Intl.NumberFormat("th-TH",{style:"currency",currency:"THB",maximumFractionDigits:2}).format(Number(v||0));
  const nfmt = (v) => new Intl.NumberFormat("th-TH",{maximumFractionDigits:2}).format(Number(v||0));
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
  const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2,6);
  const todayISO = () => new Date().toISOString().slice(0,10);
  const dateTH = (s) => {
    if(!s) return "-";
    const d = new Date(s + "T00:00:00");
    return d.toLocaleDateString("th-TH",{day:"numeric",month:"long",year:"numeric"});
  };

  const initialState = () => ({
    settings:{
      schoolName:PLAN.school.name,
      fiscalYear:PLAN.school.fiscalYear,
      directorName:"สิบเอกวรุธ ภิชาเศวตว์",
      budgetOfficer:""
    },
    results:{},
    transactions:[]
  });

  let state = load();
  let editingEvidence = [];

  function load(){
    try{
      const raw = localStorage.getItem(KEY);
      if(!raw) return initialState();
      const obj = JSON.parse(raw);
      return {
        settings:{...initialState().settings,...(obj.settings||{})},
        results:obj.results||{},
        transactions:Array.isArray(obj.transactions)?obj.transactions:[]
      };
    }catch(e){ return initialState(); }
  }

  function save(){
    try{
      localStorage.setItem(KEY,JSON.stringify(state));
      renderAll();
      return true;
    }catch(e){
      alert("บันทึกข้อมูลไม่สำเร็จ อาจเกิดจากพื้นที่จัดเก็บของเบราว์เซอร์เต็ม โดยเฉพาะเมื่อแนบภาพจำนวนมาก กรุณาสำรองข้อมูลและลบภาพที่ไม่จำเป็น");
      return false;
    }
  }

  function projectById(id){ return PLAN.projects.find(p=>p.id===id); }
  function resultFor(id){
    return state.results[id] || {
      status:"ยังไม่เริ่ม",
      activityProgress:0,
      indicatorProgress:0,
      evidenceProgress:0,
      startDate:"",
      endDate:"",
      resultSummary:"",
      problems:"",
      suggestions:"",
      doneActivities:[],
      evidence:[]
    };
  }
  function overallFor(id){
    const r=resultFor(id);
    return Math.round((Number(r.activityProgress||0)+Number(r.indicatorProgress||0)+Number(r.evidenceProgress||0))/3);
  }
  function spentFor(id){
    return state.transactions.filter(t=>t.type==="expense" && t.projectId===id).reduce((a,b)=>a+Number(b.amount||0),0);
  }
  function totalSpent(){
    return state.transactions.filter(t=>t.type==="expense").reduce((a,b)=>a+Number(b.amount||0),0);
  }
  function totalIncome(){
    return state.transactions.filter(t=>t.type==="income").reduce((a,b)=>a+Number(b.amount||0),0);
  }
  function statusClass(s){
    if(s==="เสร็จสิ้น") return "green";
    if(s==="กำลังดำเนินการ") return "blue";
    if(s==="รอเอกสาร/หลักฐาน" || s==="รอสรุปผล") return "yellow";
    return "";
  }

  function gotoPage(id){
    document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id===id));
    document.querySelectorAll("#nav button").forEach(b=>b.classList.toggle("active",b.dataset.page===id));
    window.scrollTo({top:0,behavior:"smooth"});
  }
  document.querySelectorAll("#nav button").forEach(b=>b.addEventListener("click",()=>gotoPage(b.dataset.page)));
  document.querySelectorAll("[data-goto]").forEach(b=>b.addEventListener("click",()=>gotoPage(b.dataset.goto)));

  function renderMetrics(){
    const total=PLAN.projects.length;
    const done=PLAN.projects.filter(p=>resultFor(p.id).status==="เสร็จสิ้น").length;
    const avg=total?Math.round(PLAN.projects.reduce((a,p)=>a+overallFor(p.id),0)/total):0;
    const cards=[
      ["โครงการตามมติรับรอง",total+" โครงการ","วิชาการ 8 • งบประมาณ 3 • บุคคล 2 • ทั่วไป 11"],
      ["ความก้าวหน้าเฉลี่ย",avg+"%","เฉลี่ยจากกิจกรรม ตัวชี้วัด และหลักฐาน"],
      ["เบิกจ่ายจริง",money(totalSpent()),"จากรายการรายจ่ายที่บันทึกในระบบ"],
      ["ดำเนินการเสร็จ",done+" / "+total,"คิดเป็น "+(total?Math.round(done/total*100):0)+"% ของโครงการ"]
    ];
    $("dashboardMetrics").innerHTML=cards.map(x=>`<div class="metric"><div class="metric-label">${x[0]}</div><div class="metric-value">${x[1]}</div><div class="metric-note">${x[2]}</div></div>`).join("");
  }

  function renderAllocations(){
    const max=Math.max(...PLAN.allocations.map(x=>x.amount));
    $("allocationBars").innerHTML=PLAN.allocations.map(x=>`
      <div class="progress-row">
        <span class="small">${esc(x.department)}</span>
        <div><div class="progress-track"><span style="width:${max?x.amount/max*100:0}%"></span></div><div class="small muted" style="margin-top:4px">${x.percent}% • ${money(x.amount)}</div></div>
        <strong class="small">${nfmt(x.amount)}</strong>
      </div>`).join("");
  }

  function renderStatus(){
    $("statusSummary").innerHTML=STATUSES.map(s=>{
      const c=PLAN.projects.filter(p=>resultFor(p.id).status===s).length;
      return `<div class="status-line row between"><span><span class="pill ${statusClass(s)}">${esc(s)}</span></span><strong>${c}</strong></div>`;
    }).join("");
  }

  function deptAverage(dept){
    const arr=PLAN.projects.filter(p=>p.department===dept);
    return arr.length?Math.round(arr.reduce((a,p)=>a+overallFor(p.id),0)/arr.length):0;
  }
  function renderDepartmentProgress(){
    const depts=Object.keys(PLAN.school.approvalBreakdown);
    $("departmentProgress").innerHTML=depts.map(d=>{
      const pct=deptAverage(d);
      return `<div class="progress-row"><span class="small">${esc(d)}</span><div class="progress-track"><span style="width:${pct}%"></span></div><strong class="small">${pct}%</strong></div>`;
    }).join("");
  }

  function renderAttention(){
    const arr=[...PLAN.projects]
      .filter(p=>resultFor(p.id).status!=="เสร็จสิ้น")
      .sort((a,b)=>overallFor(a.id)-overallFor(b.id))
      .slice(0,6);
    $("attentionList").innerHTML=arr.length?arr.map(p=>`
      <div class="attention-item">
        <div class="row between"><strong class="small">${esc(p.name)}</strong><span class="pill ${statusClass(resultFor(p.id).status)}">${esc(resultFor(p.id).status)}</span></div>
        <div class="row between small muted" style="margin-top:6px"><span>${esc(p.department)}</span><span>${overallFor(p.id)}%</span></div>
      </div>`).join(""):'<div class="empty">ไม่มีรายการที่ต้องติดตาม</div>';
  }

  function fillFilters(){
    const currentDept=$("deptFilter").value;
    $("deptFilter").innerHTML='<option value="">ทุกฝ่าย</option>'+Object.keys(PLAN.school.approvalBreakdown).map(d=>`<option>${esc(d)}</option>`).join("");
    $("deptFilter").value=currentDept;
    const currentStatus=$("statusFilter").value;
    $("statusFilter").innerHTML='<option value="">ทุกสถานะ</option>'+STATUSES.map(s=>`<option>${esc(s)}</option>`).join("");
    $("statusFilter").value=currentStatus;

    const txProject=$("txProjectFilter").value;
    $("txProjectFilter").innerHTML='<option value="">ทุกโครงการ</option>'+PLAN.projects.map(p=>`<option value="${p.id}">${esc(p.id+" "+p.name)}</option>`).join("");
    $("txProjectFilter").value=txProject;

    const txDialogProject=$("txForm").elements.projectId.value;
    $("txForm").elements.projectId.innerHTML='<option value="">ไม่ระบุโครงการ</option>'+PLAN.projects.map(p=>`<option value="${p.id}">${esc(p.id+" "+p.name)}</option>`).join("");
    if(txDialogProject)$("txForm").elements.projectId.value=txDialogProject;

    $("projectForm").elements.status.innerHTML=STATUSES.map(s=>`<option>${esc(s)}</option>`).join("");
  }

  function renderProjects(){
    const q=$("projectSearch").value.trim().toLowerCase();
    const dept=$("deptFilter").value;
    const st=$("statusFilter").value;
    const arr=PLAN.projects.filter(p=>{
      const r=resultFor(p.id);
      const hay=[p.id,p.name,p.department,p.owner,...(p.responsibleStaff||[]),...(p.activities||[])].join(" ").toLowerCase();
      return (!q||hay.includes(q)) && (!dept||p.department===dept) && (!st||r.status===st);
    });
    $("projectCards").innerHTML=arr.length?arr.map(projectCard).join(""):'<div class="empty">ไม่พบโครงการตามเงื่อนไข</div>';
  }

  function projectCard(p){
    const r=resultFor(p.id), spent=spentFor(p.id), balance=Number(p.budget||0)-spent;
    const warn=p.sourceWarning?'<span class="pill red">ตรวจสอบต้นฉบับ</span>':'';
    return `<article class="project-card">
      <div class="row between">
        <h3>${esc(p.id+" • "+p.name)}</h3>
        <span class="pill ${statusClass(r.status)}">${esc(r.status)}</span>
      </div>
      <div class="meta">
        <span class="pill">${esc(p.department)}</span>
        <span class="pill">งบตามตาราง ${money(p.budget)}</span>
        <span class="pill">ใช้จริง ${money(spent)}</span>
        ${warn}
      </div>
      <div class="small muted">ผู้รับผิดชอบ: ${esc(p.owner)}${p.responsibleStaff?.length?" • "+esc(p.responsibleStaff.join(", ")):""} • อ้างอิงหน้า ${esc(p.sourcePage)}</div>
      <div class="project-progress">
        <div class="mini-progress"><strong>${Number(r.activityProgress||0)}%</strong><span>กิจกรรม</span></div>
        <div class="mini-progress"><strong>${Number(r.indicatorProgress||0)}%</strong><span>ตัวชี้วัด</span></div>
        <div class="mini-progress"><strong>${Number(r.evidenceProgress||0)}%</strong><span>หลักฐาน</span></div>
      </div>
      <div class="row between small" style="margin-top:9px"><span>ภาพรวม ${overallFor(p.id)}%</span><span>คงเหลือเทียบวงเงินตาราง ${money(balance)}</span></div>
      <div class="progress-track" style="margin-top:6px"><span style="width:${overallFor(p.id)}%"></span></div>
      <div class="project-actions">
        <button class="btn primary" onclick="window.APP.openProject('${p.id}')">บันทึกผล / หลักฐาน</button>
        <button class="btn" onclick="window.APP.printProject('${p.id}')">พิมพ์รายงาน PDF</button>
      </div>
    </article>`;
  }

  function renderProgressBoard(){
    $("progressBoard").innerHTML=PLAN.projects.map(p=>{
      const r=resultFor(p.id);
      return `<div class="progress-board-item">
        <div class="row between"><h4>${esc(p.id+" "+p.name)}</h4><span class="pill ${statusClass(r.status)}">${esc(r.status)}</span></div>
        <div class="triple">
          <div><div class="small muted">กิจกรรม</div><strong>${Number(r.activityProgress||0)}%</strong><div class="progress-track"><span style="width:${Number(r.activityProgress||0)}%"></span></div></div>
          <div><div class="small muted">ตัวชี้วัด</div><strong>${Number(r.indicatorProgress||0)}%</strong><div class="progress-track"><span style="width:${Number(r.indicatorProgress||0)}%"></span></div></div>
          <div><div class="small muted">หลักฐาน</div><strong>${Number(r.evidenceProgress||0)}%</strong><div class="progress-track"><span style="width:${Number(r.evidenceProgress||0)}%"></span></div></div>
        </div>
        <div class="row between small muted" style="margin-top:8px"><span>${esc(p.department)}</span><button class="link-btn" onclick="window.APP.openProject('${p.id}')">อัปเดต</button></div>
      </div>`;
    }).join("");
  }

  function renderTransactions(){
    const income=totalIncome(), expense=totalSpent();
    $("txMetrics").innerHTML=[
      ["รายรับที่บันทึก",money(income),"ยอดจริงในระบบ"],
      ["รายจ่ายที่บันทึก",money(expense),"ยอดจริงในระบบ"],
      ["คงเหลือจากรายการจริง",money(income-expense),"รายรับลบรายจ่าย"],
      ["จำนวนรายการ",state.transactions.length+" รายการ","รายการรับและจ่ายทั้งหมด"]
    ].map(x=>`<div class="metric"><div class="metric-label">${x[0]}</div><div class="metric-value">${x[1]}</div><div class="metric-note">${x[2]}</div></div>`).join("");

    const type=$("txTypeFilter").value, pid=$("txProjectFilter").value;
    const arr=[...state.transactions].filter(t=>(!type||t.type===type)&&(!pid||t.projectId===pid)).sort((a,b)=>(b.date||"").localeCompare(a.date||""));
    $("txRows").innerHTML=arr.length?arr.map(t=>{
      const p=projectById(t.projectId);
      return `<tr>
        <td>${dateTH(t.date)}</td><td>${esc(t.docNo||"-")}</td>
        <td><span class="pill ${t.type==="income"?"green":"yellow"}">${t.type==="income"?"รายรับ":"รายจ่าย"}</span></td>
        <td>${esc(t.title)}</td><td>${esc(p?p.id+" "+p.name:"-")}</td><td><strong>${money(t.amount)}</strong></td>
        <td><button class="btn danger" onclick="window.APP.deleteTx('${t.id}')">ลบ</button></td>
      </tr>`;
    }).join(""):'<tr><td colspan="7" class="empty">ยังไม่มีรายการ</td></tr>';
  }

  function renderReports(){
    $("reportProjectList").innerHTML=PLAN.projects.map(p=>{
      const r=resultFor(p.id);
      return `<div class="report-item"><div><h4>${esc(p.id+" "+p.name)}</h4><div class="small muted">${esc(p.department)} • ความก้าวหน้า ${overallFor(p.id)}% • ${esc(r.status)}</div></div><div class="row"><button class="btn" onclick="window.APP.openProject('${p.id}')">บันทึกผล</button><button class="btn primary" onclick="window.APP.printProject('${p.id}')">พิมพ์ PDF</button></div></div>`;
    }).join("");
  }

  function renderAudit(){
    $("auditContent").innerHTML=`
      <div class="source-banner">ระบบไม่ได้แก้ความคลาดเคลื่อนของต้นฉบับแบบอัตโนมัติ รายการด้านล่างถูกแยกไว้เพื่อให้โรงเรียนตรวจทานกับเอกสารฉบับที่อนุมัติจริงก่อนนำไปใช้อ้างอิงทางราชการ</div>
      ${PLAN.auditNotes.map(n=>`<div class="audit-item"><h4>${esc(n.title)}</h4><p>${esc(n.detail)}</p></div>`).join("")}
    `;
  }

  function renderSettings(){
    $("schoolName").value=state.settings.schoolName||PLAN.school.name;
    $("fiscalYear").value=state.settings.fiscalYear||PLAN.school.fiscalYear;
    $("directorName").value=state.settings.directorName||"";
    $("budgetOfficer").value=state.settings.budgetOfficer||"";
  }

  function renderAll(){
    fillFilters();
    renderMetrics();
    renderAllocations();
    renderStatus();
    renderDepartmentProgress();
    renderAttention();
    renderProjects();
    renderTransactions();
    renderProgressBoard();
    renderReports();
    renderAudit();
    renderSettings();
  }

  $("projectSearch").addEventListener("input",renderProjects);
  $("deptFilter").addEventListener("change",renderProjects);
  $("statusFilter").addEventListener("change",renderProjects);
  $("txTypeFilter").addEventListener("change",renderTransactions);
  $("txProjectFilter").addEventListener("change",renderTransactions);

  function openProject(id){
    const p=projectById(id); if(!p)return;
    const r=resultFor(id);
    $("projectDialogTitle").textContent=p.id+" "+p.name;
    $("projectDialogSub").textContent=p.department+" • งบตามตาราง "+money(p.budget)+" • ผู้รับผิดชอบ "+p.owner;
    const f=$("projectForm");
    f.elements.projectId.value=id;
    f.elements.status.value=r.status||"ยังไม่เริ่ม";
    f.elements.activityProgress.value=Number(r.activityProgress||0);
    f.elements.indicatorProgress.value=Number(r.indicatorProgress||0);
    f.elements.evidenceProgress.value=Number(r.evidenceProgress||0);
    f.elements.startDate.value=r.startDate||"";
    f.elements.endDate.value=r.endDate||"";
    f.elements.resultSummary.value=r.resultSummary||"";
    f.elements.problems.value=r.problems||"";
    f.elements.suggestions.value=r.suggestions||"";
    $("activityChecklist").innerHTML=p.activities.map((a,i)=>`
      <label class="activity-check"><input type="checkbox" data-activity-index="${i}" ${(r.doneActivities||[]).includes(i)?"checked":""}><span>${esc(a)}</span></label>
    `).join("");
    $("activityChecklist").querySelectorAll("input").forEach(ch=>ch.addEventListener("change",syncActivityProgress));
    editingEvidence=[...(r.evidence||[])];
    renderEvidencePreview();
    $("projectDialog").showModal();
  }

  function syncActivityProgress(){
    const boxes=[...$("activityChecklist").querySelectorAll("input")];
    const done=boxes.filter(x=>x.checked).length;
    $("projectForm").elements.activityProgress.value=boxes.length?Math.round(done/boxes.length*100):0;
  }

  function renderEvidencePreview(){
    $("evidencePreview").innerHTML=editingEvidence.length?editingEvidence.map((e,i)=>`
      <div class="evidence-card"><img src="${e.data}" alt="${esc(e.name||"หลักฐาน")}"><button type="button" onclick="window.APP.removeEvidence(${i})">×</button></div>
    `).join(""):'<div class="small muted">ยังไม่มีภาพหลักฐาน</div>';
  }
  function removeEvidence(i){ editingEvidence.splice(i,1); renderEvidencePreview(); }

  async function compressImage(file){
    return new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onerror=reject;
      reader.onload=()=>{
        const img=new Image();
        img.onerror=reject;
        img.onload=()=>{
          const max=1000;
          let w=img.width,h=img.height;
          if(Math.max(w,h)>max){
            const scale=max/Math.max(w,h);w=Math.round(w*scale);h=Math.round(h*scale);
          }
          const c=document.createElement("canvas");c.width=w;c.height=h;
          c.getContext("2d").drawImage(img,0,0,w,h);
          resolve({name:file.name,data:c.toDataURL("image/jpeg",0.65)});
        };
        img.src=reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  $("evidenceInput").addEventListener("change",async e=>{
    const files=[...e.target.files];
    const room=Math.max(0,6-editingEvidence.length);
    for(const file of files.slice(0,room)){
      if(!file.type.startsWith("image/")) continue;
      try{ editingEvidence.push(await compressImage(file)); }catch(err){}
    }
    e.target.value="";
    renderEvidencePreview();
  });

  $("saveProjectProgressBtn").addEventListener("click",e=>{
    e.preventDefault();
    const f=$("projectForm"); if(!f.reportValidity())return;
    const id=f.elements.projectId.value;
    const doneActivities=[...$("activityChecklist").querySelectorAll("input")].filter(x=>x.checked).map(x=>Number(x.dataset.activityIndex));
    state.results[id]={
      status:f.elements.status.value,
      activityProgress:Number(f.elements.activityProgress.value||0),
      indicatorProgress:Number(f.elements.indicatorProgress.value||0),
      evidenceProgress:Number(f.elements.evidenceProgress.value||0),
      startDate:f.elements.startDate.value,
      endDate:f.elements.endDate.value,
      resultSummary:f.elements.resultSummary.value.trim(),
      problems:f.elements.problems.value.trim(),
      suggestions:f.elements.suggestions.value.trim(),
      doneActivities,
      evidence:editingEvidence
    };
    if(save()) $("projectDialog").close();
  });

  $("addTxBtn").addEventListener("click",()=>{
    $("txForm").reset();
    $("txForm").elements.date.value=todayISO();
    fillFilters();
    $("txDialog").showModal();
  });
  $("saveTxBtn").addEventListener("click",e=>{
    e.preventDefault();
    const f=$("txForm"); if(!f.reportValidity())return;
    const fd=new FormData(f);
    state.transactions.push({
      id:uid("tx"),
      date:fd.get("date"),
      docNo:fd.get("docNo"),
      type:fd.get("type"),
      projectId:fd.get("projectId"),
      title:fd.get("title"),
      fundSource:fd.get("fundSource"),
      amount:Number(fd.get("amount"))
    });
    if(save()) $("txDialog").close();
  });
  function deleteTx(id){
    if(confirm("ลบรายการนี้หรือไม่?")){
      state.transactions=state.transactions.filter(t=>t.id!==id);
      save();
    }
  }

  function backup(){
    const payload={version:3,exportedAt:new Date().toISOString(),planFiscalYear:PLAN.school.fiscalYear,...state};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download="ban-charukkhawe-budget-2569-"+todayISO()+".json";
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),500);
  }
  $("backupBtn").addEventListener("click",backup);
  $("backupBtn2").addEventListener("click",backup);
  $("restoreFile").addEventListener("change",async e=>{
    const file=e.target.files[0]; if(!file)return;
    try{
      const obj=JSON.parse(await file.text());
      if(!obj.settings || !obj.results || !Array.isArray(obj.transactions)) throw new Error("invalid");
      state={settings:obj.settings,results:obj.results,transactions:obj.transactions};
      save(); alert("นำเข้าข้อมูลสำเร็จ");
    }catch(err){alert("ไฟล์สำรองไม่ถูกต้องหรือไม่ใช่ข้อมูลของระบบนี้");}
    e.target.value="";
  });
  $("resetBtn").addEventListener("click",()=>{
    if(confirm("ยืนยันคืนค่าระบบเป็นข้อมูลตั้งต้นจากแผนปฏิบัติการ? ผลการดำเนินงาน รายการรายรับรายจ่าย และภาพหลักฐานที่บันทึกในเครื่องจะถูกลบ")){
      state=initialState(); save();
    }
  });
  $("saveSettingsBtn").addEventListener("click",()=>{
    state.settings={
      schoolName:$("schoolName").value.trim()||PLAN.school.name,
      fiscalYear:Number($("fiscalYear").value||PLAN.school.fiscalYear),
      directorName:$("directorName").value.trim(),
      budgetOfficer:$("budgetOfficer").value.trim()
    };
    save(); alert("บันทึกการตั้งค่าแล้ว");
  });

  function printWindow(body,title){
    const w=window.open("","_blank");
    if(!w){alert("เบราว์เซอร์บล็อกหน้าต่างรายงาน กรุณาอนุญาต Pop-up สำหรับเว็บไซต์นี้");return;}
    const css=`
      @page{size:A4;margin:15mm}
      *{box-sizing:border-box}body{font-family:Tahoma,"Noto Sans Thai",sans-serif;color:#111;font-size:13px;line-height:1.5;margin:0}
      h1,h2,h3,h4{margin:0 0 8px}h1{font-size:20px}h2{font-size:17px}h3{font-size:15px;margin-top:16px}
      .center{text-align:center}.muted{color:#555}.box{border:1px solid #999;border-radius:8px;padding:10px;margin:10px 0}
      table{width:100%;border-collapse:collapse;margin:8px 0}th,td{border:1px solid #999;padding:6px;vertical-align:top;text-align:left}th{background:#f2f2f2}
      .kpi{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.kpi div{border:1px solid #aaa;padding:8px;text-align:center}
      .evidence{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.evidence img{width:100%;max-height:230px;object-fit:contain;border:1px solid #ccc}
      .sign{display:grid;grid-template-columns:1fr 1fr;gap:50px;margin-top:45px;text-align:center}
      .page-break{break-before:page}.no-break{break-inside:avoid}
    `;
    w.document.write('<!doctype html><html lang="th"><head><meta charset="utf-8"><title>'+esc(title)+'</title><style>'+css+'</style></head><body>'+body+'<script>setTimeout(()=>window.print(),500)<\/script></body></html>');
    w.document.close();
  }

  function printProject(id){
    const p=projectById(id); if(!p)return;
    const r=resultFor(id), spent=spentFor(id), balance=Number(p.budget||0)-spent;
    const txs=state.transactions.filter(t=>t.projectId===id && t.type==="expense");
    const activities=p.activities.map((a,i)=>`<tr><td>${i+1}</td><td>${esc(a)}</td><td style="text-align:center">${(r.doneActivities||[]).includes(i)?"ดำเนินการแล้ว":"ยังไม่เสร็จ"}</td></tr>`).join("");
    const txRows=txs.length?txs.map((t,i)=>`<tr><td>${i+1}</td><td>${dateTH(t.date)}</td><td>${esc(t.docNo||"-")}</td><td>${esc(t.title)}</td><td style="text-align:right">${money(t.amount)}</td></tr>`).join(""):'<tr><td colspan="5" style="text-align:center">ยังไม่มีรายการรายจ่ายที่บันทึก</td></tr>';
    const evidence=(r.evidence||[]).length?`<h3>ภาพหลักฐาน</h3><div class="evidence">${r.evidence.map(e=>`<img src="${e.data}" alt="หลักฐาน">`).join("")}</div>`:"";
    const body=`
      <div class="center"><h1>รายงานผลการดำเนินงานโครงการ</h1><h2>ตามแผนปฏิบัติการ ประจำปีงบประมาณ ${state.settings.fiscalYear||2569}</h2>
      <div>${esc(state.settings.schoolName||PLAN.school.name)}</div><div class="muted">${esc(PLAN.school.office)}</div></div>
      <div class="box"><strong>${esc(p.id+" "+p.name)}</strong><br>ฝ่าย: ${esc(p.department)}<br>ผู้รับผิดชอบตามแผน: ${esc(p.owner)}${p.responsibleStaff?.length?" / "+esc(p.responsibleStaff.join(", ")):""}<br>อ้างอิงตารางในแผน หน้า ${esc(p.sourcePage)}</div>
      ${p.sourceWarning?`<div class="box"><strong>หมายเหตุจากต้นฉบับ:</strong> ${esc(p.sourceWarning)}</div>`:""}
      <div class="kpi"><div><strong>${Number(r.activityProgress||0)}%</strong><br>ความก้าวหน้ากิจกรรม</div><div><strong>${Number(r.indicatorProgress||0)}%</strong><br>ผลตัวชี้วัด</div><div><strong>${Number(r.evidenceProgress||0)}%</strong><br>ความครบถ้วนหลักฐาน</div></div>
      <h3>ข้อมูลตามแผน</h3>
      <table><tr><th>งบประมาณตามตาราง</th><td>${money(p.budget)}</td><th>ใช้จริงที่บันทึก</th><td>${money(spent)}</td></tr><tr><th>คงเหลือเทียบวงเงินตาราง</th><td>${money(balance)}</td><th>สถานะ</th><td>${esc(r.status)}</td></tr><tr><th>เริ่มดำเนินการ</th><td>${dateTH(r.startDate)}</td><th>สิ้นสุด/สรุปผล</th><td>${dateTH(r.endDate)}</td></tr></table>
      ${p.fundNote?`<div class="box"><strong>หมายเหตุด้านงบประมาณ:</strong> ${esc(p.fundNote)}</div>`:""}
      <h3>กิจกรรมตามแผนและผลการดำเนินการ</h3>
      <table><thead><tr><th style="width:45px">ที่</th><th>กิจกรรม</th><th style="width:110px">สถานะ</th></tr></thead><tbody>${activities}</tbody></table>
      <h3>ตัวชี้วัด/เป้าหมายตามแผน</h3><div class="box">${(p.indicators||[]).map(x=>"• "+esc(x)).join("<br>")||"-"}</div>
      <h3>ผลการดำเนินงาน</h3><div class="box">${esc(r.resultSummary||"ยังไม่ได้บันทึกผลการดำเนินงาน").replace(/\n/g,"<br>")}</div>
      <h3>การใช้จ่ายจริง</h3><table><thead><tr><th>ที่</th><th>วันที่</th><th>เลขที่เอกสาร</th><th>รายการ</th><th>จำนวนเงิน</th></tr></thead><tbody>${txRows}</tbody></table>
      <h3>ปัญหา/อุปสรรค</h3><div class="box">${esc(r.problems||"ไม่มีข้อมูล").replace(/\n/g,"<br>")}</div>
      <h3>ข้อเสนอแนะ/แนวทางพัฒนาต่อ</h3><div class="box">${esc(r.suggestions||"ไม่มีข้อมูล").replace(/\n/g,"<br>")}</div>
      ${evidence}
      <div class="sign"><div>ลงชื่อ ..................................................<br>(..................................................)<br>ผู้รับผิดชอบโครงการ</div><div>ลงชื่อ ..................................................<br>( ${esc(state.settings.directorName||"..................................................")} )<br>ผู้บริหารสถานศึกษา</div></div>
    `;
    printWindow(body,"รายงานโครงการ "+p.id);
  }

  function printSummary(){
    const rows=PLAN.projects.map((p,i)=>{
      const r=resultFor(p.id);
      return `<tr><td>${i+1}</td><td>${esc(p.id)}</td><td>${esc(p.name)}</td><td>${esc(p.department)}</td><td style="text-align:right">${money(p.budget)}</td><td style="text-align:right">${money(spentFor(p.id))}</td><td style="text-align:center">${overallFor(p.id)}%</td><td>${esc(r.status)}</td></tr>`;
    }).join("");
    const allocRows=PLAN.allocations.map(a=>`<tr><td>${esc(a.department)}</td><td style="text-align:center">${a.percent}%</td><td style="text-align:right">${money(a.amount)}</td><td style="text-align:center">${deptAverage(a.department)}%</td></tr>`).join("");
    const body=`
      <div class="center"><h1>รายงานสรุปความก้าวหน้าแผนปฏิบัติการ</h1><h2>ประจำปีงบประมาณ ${state.settings.fiscalYear||2569}</h2><div>${esc(state.settings.schoolName||PLAN.school.name)}</div><div class="muted">${esc(PLAN.school.office)}</div></div>
      <h3>กรอบจัดสรรตามโครงสร้างงาน</h3><table><thead><tr><th>ฝ่าย</th><th>สัดส่วน</th><th>กรอบวงเงิน</th><th>ความก้าวหน้าเฉลี่ย</th></tr></thead><tbody>${allocRows}</tbody></table>
      <h3>สรุปโครงการตามมติรับรอง 24 โครงการ</h3><table><thead><tr><th>ที่</th><th>รหัส</th><th>โครงการ</th><th>ฝ่าย</th><th>งบตามตาราง</th><th>ใช้จริง</th><th>ก้าวหน้า</th><th>สถานะ</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="box"><strong>หมายเหตุ:</strong> รายงานนี้คำนวณจากผลการดำเนินงานและรายการการเงินที่บันทึกในเว็บแอป รายการคลาดเคลื่อนจากต้นฉบับให้ตรวจหน้า “ตรวจสอบข้อมูลจากไฟล์” ก่อนใช้อ้างอิงทางราชการ</div>
      <div class="sign"><div>ลงชื่อ ..................................................<br>( ${esc(state.settings.budgetOfficer||"..................................................")} )<br>ผู้รับผิดชอบงานงบประมาณ</div><div>ลงชื่อ ..................................................<br>( ${esc(state.settings.directorName||"..................................................")} )<br>ผู้บริหารสถานศึกษา</div></div>
    `;
    printWindow(body,"สรุปแผนปฏิบัติการ 2569");
  }

  $("printSummaryBtn").addEventListener("click",printSummary);
  $("printSummaryBtn2").addEventListener("click",printSummary);

  window.APP={openProject,printProject,deleteTx,removeEvidence};
  renderAll();
  if("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(()=>{});
})();