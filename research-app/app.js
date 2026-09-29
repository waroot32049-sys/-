
(function(){
'use strict';
var APP_NS='classroomResearchApp.v3';
var currentUser={name:'ผู้ใช้งาน',username:'default-user'};
var state={data:{},references:[],lastSaved:null,googleClientId:''};
var accessToken=null,tokenClient=null,lastSearch=[];

function q(s){return document.querySelector(s)}
function qa(s){return Array.prototype.slice.call(document.querySelectorAll(s))}
function dataKey(){return APP_NS+'.data.'+currentUser.username}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]})}
function safeStore(k,v){try{localStorage.setItem(k,v)}catch(e){}}
function safeRead(k){try{return localStorage.getItem(k)}catch(e){return null}}

function showAppUser(){
  var chip=q('#userChip'),label=q('#userLabel'),av=q('#userAvatar');
  if(chip)chip.style.display='flex';
  if(label)label.textContent=currentUser.name+' ('+currentUser.username+')';
  if(av)av.textContent=(currentUser.name||'U').charAt(0).toUpperCase();
  var auth=q('#authScreen');if(auth)auth.classList.add('hidden');
}
window.quickLogin=function(){
  var name=(q('#quickName')&&q('#quickName').value.trim())||'';
  var username=(q('#quickUsername')&&q('#quickUsername').value.trim())||'';
  if(!name){var m=q('#loginMsg');if(m)m.textContent='กรอกชื่อ-สกุลก่อน';return}
  username=username.toLowerCase().replace(/[^a-z0-9._-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'')||('user-'+Date.now());
  currentUser={name:name,username:username};
  safeStore(APP_NS+'.session',JSON.stringify(currentUser));
  showAppUser();loadUserData();
};
window.enterDefault=function(){
  currentUser={name:'ผู้ใช้งาน',username:'default-user'};
  safeStore(APP_NS+'.session',JSON.stringify(currentUser));
  showAppUser();loadUserData();
};
window.logoutUser=function(){
  saveSilent();
  try{localStorage.removeItem(APP_NS+'.session')}catch(e){}
  var auth=q('#authScreen');if(auth)auth.classList.remove('hidden');
};

function collect(){
  qa('[data-k]').forEach(function(el){state.data[el.getAttribute('data-k')]=String(el.value||'').trim()});
  var g=q('#googleClientId');if(g)state.googleClientId=String(g.value||'').trim();
}
function loadUserData(){
  state={data:{},references:[],lastSaved:null,googleClientId:''};
  var raw=safeRead(dataKey());
  if(raw){try{var parsed=JSON.parse(raw);if(parsed)state=Object.assign(state,parsed)}catch(e){}}
  qa('[data-k]').forEach(function(el){el.value=state.data[el.getAttribute('data-k')]||''});
  var g=q('#googleClientId');if(g)g.value=state.googleClientId||'';
  renderRefs();refreshDashboard();renderReport();
}
function saveSilent(){
  collect();state.lastSaved=new Date().toISOString();
  safeStore(dataKey(),JSON.stringify(state));refreshDashboard();
}
window.saveAll=function(){saveSilent();alert('บันทึกข้อมูลแล้ว')};

function refreshDashboard(){
  var vals=Object.keys(state.data).map(function(k){return state.data[k]});
  var filled=vals.filter(function(x){return String(x||'').trim()}).length;
  var total=Math.max(1,qa('[data-k]').length);
  var pct=Math.round(filled/total*100);
  var bar=q('#progBar');if(bar)bar.style.width=pct+'%';
  var txt=q('#progTxt');if(txt)txt.textContent=pct+'%';
  var rc=q('#refCount');if(rc)rc.textContent=state.references.length;
  var groups=[['ch1Background','objectives'],['ch2Synthesis'],['population','instrumentData'],['resultsNarrative'],['ch5Summary','discussion']];
  var done=groups.filter(function(g){return g.every(function(k){return String(state.data[k]||'').trim()})}).length;
  var cc=q('#chapterCount');if(cc)cc.textContent=done+'/5';
  var ls=q('#lastSaved');if(ls)ls.textContent=state.lastSaved?new Date(state.lastSaved).toLocaleString('th-TH'):'ยังไม่บันทึก';
}
function initNav(){
  qa('[data-k]').forEach(function(el){el.addEventListener('change',saveSilent)});
}
function citationFromRecord(r){
  var au=(r.creators||[]).filter(Boolean).join(', ')||'ไม่ปรากฏผู้แต่ง';
  var y=(String(r.date||'').match(/\d{4}/)||[])[0]||'ม.ป.ป.';
  var src=r.source?'. '+r.source:'';
  var id=(r.identifiers||[]).filter(function(x){return /^https?:/i.test(x)})[0]||r.url||'';
  return (au+'. ('+y+'). '+(r.title||'ไม่ปรากฏชื่อเรื่อง')+src+'. '+id).trim();
}
window.addReference=function(r){
  var citation=citationFromRecord(r);
  var exists=state.references.some(function(x){return x.citation===citation});
  if(!exists){state.references.push({citation:citation,meta:r});saveSilent();renderRefs();alert('เพิ่มรายการอ้างอิงแล้ว')}
};
window.addManualRef=function(){
  var el=q('#manualRef');if(!el)return;
  var t=el.value.trim();if(!t)return;
  state.references.push({citation:t,meta:{manual:true}});el.value='';saveSilent();renderRefs();
};
window.removeRef=function(i){state.references.splice(i,1);saveSilent();renderRefs()};
function renderRefs(){
  var box=q('#refList');if(!box)return;
  if(!state.references.length){box.innerHTML='<p class="help">ยังไม่มีรายการ</p>';return}
  box.innerHTML=state.references.map(function(r,i){
    return '<div class="ref"><div>'+esc(r.citation)+'</div><button class="danger" style="margin-top:8px" onclick="removeRef('+i+')">ลบ</button></div>';
  }).join('');
}

function searchTerms(){var e=q('#searchQ');return e?e.value.trim():''}
function searchLimit(){var e=q('#resultLimit');var n=e?Number(e.value):20;return Math.max(5,Math.min(30,n||20))}
function updateExternalLinks(){
  var kw=searchTerms(),e;
  e=q('#gsLink');if(e)e.href='https://scholar.google.com/scholar?q='+encodeURIComponent(kw);
  e=q('#scopusLink');if(e)e.href='https://www.scopus.com/results/results.uri?s='+encodeURIComponent(kw);
  e=q('#wosLink');if(e)e.href='https://www.webofscience.com/wos/woscc/basic-search';
  e=q('#thaiJoLink');if(e)e.href='https://www.tci-thaijo.org/?q='+encodeURIComponent(kw);
}
function renderSearchCards(items,label){
  lastSearch=items||[];
  var st=q('#searchStatus');if(st)st.textContent=label+' พบ '+lastSearch.length+' รายการ';
  var box=q('#searchResults');if(!box)return;
  if(!lastSearch.length){box.innerHTML='<p class="help">ไม่พบรายการ ลองใช้คำค้นที่สั้นลง</p>';return}
  box.innerHTML=lastSearch.map(function(r,i){
    var meta=esc((r.creators||[]).join(', ')||'ไม่ปรากฏผู้แต่ง')+' · '+esc(r.date||'ไม่ปรากฏปี')+' · '+esc(r.source||r.provider||'');
    var cited=r.citedBy!=null?'<div class="small">อ้างถึง '+Number(r.citedBy).toLocaleString('th-TH')+' ครั้ง ตามฐาน '+esc(r.provider||'')+'</div>':'';
    var link=r.url&&/^https?:/i.test(r.url)?'<a class="btn secondary" target="_blank" rel="noopener" href="'+esc(r.url)+'">เปิดต้นฉบับ/ระเบียน</a>':'';
    return '<div class="ref"><h4>'+esc(r.title||'ไม่ปรากฏชื่อเรื่อง')+'</h4><div class="meta">'+meta+'</div>'+cited+'<p>'+esc((r.description||'').slice(0,700))+'</p><div class="row"><button onclick="addReference(lastSearch['+i+'])">เพิ่มอ้างอิง</button>'+link+'</div></div>';
  }).join('');
}
window.searchOpenAlex=async function(silent){
  var kw=searchTerms();if(!kw){if(!silent)alert('กรอกคำค้นก่อน');return []}
  updateExternalLinks();var st=q('#searchStatus');if(st&&!silent)st.textContent='กำลังค้น OpenAlex...';
  try{
    var u='https://api.openalex.org/works?search='+encodeURIComponent(kw)+'&per-page='+searchLimit()+'&sort=cited_by_count:desc';
    var res=await fetch(u);if(!res.ok)throw new Error('HTTP '+res.status);
    var j=await res.json();
    var rows=(j.results||[]).map(function(x){
      return {title:x.title||'',creators:(x.authorships||[]).map(function(a){return a.author&&a.author.display_name}).filter(Boolean),date:x.publication_year?String(x.publication_year):'',source:x.primary_location&&x.primary_location.source?x.primary_location.source.display_name:'',identifiers:[x.doi,x.id].filter(Boolean),url:x.doi||(x.primary_location&&x.primary_location.landing_page_url)||x.id||'',description:'',provider:'OpenAlex',citedBy:x.cited_by_count};
    });
    if(!silent)renderSearchCards(rows,'OpenAlex');return rows;
  }catch(e){if(st&&!silent)st.textContent='OpenAlex ใช้งานไม่ได้ชั่วคราว';return []}
};
window.searchCrossref=async function(silent){
  var kw=searchTerms();if(!kw){if(!silent)alert('กรอกคำค้นก่อน');return []}
  updateExternalLinks();var st=q('#searchStatus');if(st&&!silent)st.textContent='กำลังค้น Crossref...';
  try{
    var u='https://api.crossref.org/works?query.bibliographic='+encodeURIComponent(kw)+'&rows='+searchLimit();
    var res=await fetch(u);if(!res.ok)throw new Error('HTTP '+res.status);
    var j=await res.json();
    var rows=((j.message&&j.message.items)||[]).map(function(x){
      var dp=(x['published-print']||x['published-online']||{})['date-parts']||[];var year=(dp[0]&&dp[0][0])?String(dp[0][0]):'';
      var doi=x.DOI?'https://doi.org/'+x.DOI:'';
      return {title:(x.title&&x.title[0])||'',creators:(x.author||[]).map(function(a){return [a.given,a.family].filter(Boolean).join(' ')}),date:year,source:(x['container-title']&&x['container-title'][0])||'',identifiers:[doi,x.URL].filter(Boolean),url:doi||x.URL||'',description:String(x.abstract||'').replace(/<[^>]+>/g,''),provider:'Crossref',citedBy:x['is-referenced-by-count']};
    });
    if(!silent)renderSearchCards(rows,'Crossref');return rows;
  }catch(e){if(st&&!silent)st.textContent='Crossref ใช้งานไม่ได้ชั่วคราว';return []}
};
window.searchSemanticScholar=async function(silent){
  var kw=searchTerms();if(!kw){if(!silent)alert('กรอกคำค้นก่อน');return []}
  var st=q('#searchStatus');if(st&&!silent)st.textContent='กำลังค้น Semantic Scholar...';
  try{
    var u='https://api.semanticscholar.org/graph/v1/paper/search?query='+encodeURIComponent(kw)+'&limit='+searchLimit()+'&fields=title,authors,year,venue,url,externalIds,abstract,citationCount';
    var res=await fetch(u);if(!res.ok)throw new Error('HTTP '+res.status);
    var j=await res.json();
    var rows=(j.data||[]).map(function(x){
      var doi=x.externalIds&&x.externalIds.DOI?'https://doi.org/'+x.externalIds.DOI:'';
      return {title:x.title||'',creators:(x.authors||[]).map(function(a){return a.name}).filter(Boolean),date:x.year?String(x.year):'',source:x.venue||'',identifiers:[doi,x.url].filter(Boolean),url:doi||x.url||'',description:x.abstract||'',provider:'Semantic Scholar',citedBy:x.citationCount};
    });
    if(!silent)renderSearchCards(rows,'Semantic Scholar');return rows;
  }catch(e){if(st&&!silent)st.textContent='Semantic Scholar อาจจำกัดการเรียกจากเบราว์เซอร์';return []}
};
window.searchThaiJo=function(){
  var kw=searchTerms();if(!kw)return alert('กรอกคำค้นก่อน');
  updateExternalLinks();
  window.open('https://www.tci-thaijo.org/?q='+encodeURIComponent(kw),'_blank','noopener');
  var st=q('#searchStatus');if(st)st.textContent='เปิด ThaiJO สำหรับตรวจค้นแล้ว';
  return [];
};
window.searchAllSources=async function(){
  var kw=searchTerms();if(!kw)return alert('กรอกคำค้นก่อน');
  updateExternalLinks();var st=q('#searchStatus');if(st)st.textContent='กำลังค้น OpenAlex, Crossref และ Semantic Scholar...';
  var out=await Promise.all([window.searchOpenAlex(true),window.searchCrossref(true),window.searchSemanticScholar(true)]);
  var seen={},merged=[];
  out.forEach(function(arr){arr.forEach(function(x){var key=((x.identifiers||[]).filter(function(v){return /doi.org/i.test(v)})[0]||x.title||'').toLowerCase();if(key&&!seen[key]){seen[key]=1;merged.push(x)}})});
  merged.sort(function(a,b){return (b.citedBy||0)-(a.citedBy||0)});
  renderSearchCards(merged.slice(0,Math.max(30,searchLimit()*2)),'รวมหลายฐาน');
};

window.calcIOC=function(){
  var a=(q('#iocRatings').value||'').split(',').map(Number).filter(function(x){return isFinite(x)});
  if(!a.length)return;
  var v=a.reduce(function(s,x){return s+x},0)/a.length;
  q('#iocOut').innerHTML='IOC = <b>'+v.toFixed(3)+'</b> '+(v>=0.5?'<span class="good">ผ่านเกณฑ์ทั่วไป ≥ 0.50</span>':'<span class="bad">ควรพิจารณาปรับปรุง</span>');
};
window.checkAlpha=function(){
  var v=Number(q('#alphaValue').value);q('#alphaOut').innerHTML=isFinite(v)?'α = <b>'+v.toFixed(3)+'</b> '+(v>=0.7?'<span class="good">ถึงเกณฑ์ทั่วไป 0.70</span>':'<span class="bad">ต่ำกว่า 0.70</span>'):'';
};
window.checkItem=function(){
  var p=Number(q('#pValue').value),r=Number(q('#rValue').value);if(!isFinite(p)||!isFinite(r))return;
  q('#itemOut').innerHTML='p='+p.toFixed(2)+' '+((p>=0.2&&p<=0.8)?'✓ ช่วงทั่วไป .20–.80':'ควรพิจารณา')+'<br>r='+r.toFixed(2)+' '+(r>=0.2?'✓ ≥ .20':'ควรพิจารณา');
};
function scoreNums(id){return (q(id).value||'').split(/[\s,]+/).map(Number).filter(function(x){return isFinite(x)})}
function mean(a){return a.reduce(function(s,x){return s+x},0)/a.length}
function sd(a){if(a.length<2)return 0;var m=mean(a);return Math.sqrt(a.reduce(function(s,x){return s+Math.pow(x-m,2)},0)/(a.length-1))}
window.calcStats=function(){
  var pre=scoreNums('#preScores'),post=scoreNums('#postScores'),out=[];
  if(pre.length)out.push('ก่อนเรียน: n='+pre.length+', Mean='+mean(pre).toFixed(3)+', SD='+sd(pre).toFixed(3));
  if(post.length)out.push('หลังเรียน: n='+post.length+', Mean='+mean(post).toFixed(3)+', SD='+sd(post).toFixed(3));
  if(pre.length===post.length&&pre.length>1){var d=post.map(function(x,i){return x-pre[i]});var sdd=sd(d);var t=sdd===0?0:mean(d)/(sdd/Math.sqrt(d.length));out.push('ผลต่างเฉลี่ย='+mean(d).toFixed(3)+', paired t='+t.toFixed(3)+', df='+(d.length-1));}
  q('#statsOut').textContent=out.join('\n');
};

window.exportJson=function(){
  collect();var blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='classroom-research-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(function(){URL.revokeObjectURL(a.href)},500);
};

function initDrive(){
  var input=q('#importFile');
  if(input)input.addEventListener('change',async function(e){var file=e.target.files[0];if(!file)return;try{var s=JSON.parse(await file.text());state=Object.assign(state,s);safeStore(dataKey(),JSON.stringify(state));loadUserData()}catch(err){alert('ไฟล์ไม่ถูกต้อง')}});
}
async function ensureGoogleIdentity(){
  if(window.google&&google.accounts&&google.accounts.oauth2)return true;
  return await new Promise(function(resolve){
    var old=document.getElementById('google-gsi-runtime');
    if(old){old.addEventListener('load',function(){resolve(true)},{once:true});setTimeout(function(){resolve(!!(window.google&&google.accounts))},3000);return}
    var s=document.createElement('script');s.id='google-gsi-runtime';s.src='https://accounts.google.com/gsi/client';s.async=true;s.defer=true;
    s.onload=function(){resolve(true)};s.onerror=function(){resolve(false)};document.head.appendChild(s);
  });
}
async function initTokenClient(){
  var cid=(q('#googleClientId').value||'').trim();if(!cid){alert('กรอก Google OAuth Client ID ก่อน');return false}
  var ok=await ensureGoogleIdentity();if(!ok||!window.google||!google.accounts||!google.accounts.oauth2){alert('โหลดระบบ Google ไม่สำเร็จ');return false}
  state.googleClientId=cid;saveSilent();
  tokenClient=google.accounts.oauth2.initTokenClient({client_id:cid,scope:'https://www.googleapis.com/auth/drive.file',callback:function(r){if(r.error){q('#driveStatus').textContent='เชื่อมต่อไม่สำเร็จ';return}accessToken=r.access_token;q('#driveStatus').innerHTML='<span class="good">เชื่อมต่อแล้ว</span>'}});
  return true;
}
window.connectDrive=async function(){var ok=await initTokenClient();if(ok&&tokenClient)tokenClient.requestAccessToken({prompt:'consent'})};
async function driveFolder(){
  var h={Authorization:'Bearer '+accessToken};
  var res=await fetch("https://www.googleapis.com/drive/v3/files?q="+encodeURIComponent("name='Classroom Research Backups' and mimeType='application/vnd.google-apps.folder' and trashed=false")+"&fields=files(id,name)&spaces=drive",{headers:h});
  var j=await res.json();if(j.files&&j.files.length)return j.files[0].id;
  res=await fetch('https://www.googleapis.com/drive/v3/files?fields=id',{method:'POST',headers:{Authorization:'Bearer '+accessToken,'Content-Type':'application/json'},body:JSON.stringify({name:'Classroom Research Backups',mimeType:'application/vnd.google-apps.folder'})});
  j=await res.json();return j.id;
}
window.backupDrive=async function(){
  collect();if(!accessToken){window.connectDrive();alert('เชื่อม Google Drive ก่อน แล้วกดสำรองอีกครั้ง');return}
  try{
    var folder=await driveFolder(),boundary='----research'+Date.now();
    var meta={name:'ResearchBackup-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json',parents:[folder],mimeType:'application/json'};
    var body='--'+boundary+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'+JSON.stringify(meta)+'\r\n--'+boundary+'\r\nContent-Type: application/json\r\n\r\n'+JSON.stringify(state)+'\r\n--'+boundary+'--';
    var res=await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name',{method:'POST',headers:{Authorization:'Bearer '+accessToken,'Content-Type':'multipart/related; boundary='+boundary},body:body});
    if(!res.ok)throw new Error(await res.text());var j=await res.json();q('#driveStatus').innerHTML='<span class="good">สำรองแล้ว: '+esc(j.name)+'</span>';
  }catch(e){q('#driveStatus').textContent='สำรองไม่สำเร็จ'}
};
window.restoreDrive=async function(){
  if(!accessToken){window.connectDrive();alert('เชื่อม Google Drive ก่อน แล้วกดกู้คืนอีกครั้ง');return}
  try{
    var folder=await driveFolder(),h={Authorization:'Bearer '+accessToken};
    var u='https://www.googleapis.com/drive/v3/files?q='+encodeURIComponent("'"+folder+"' in parents and name contains 'ResearchBackup-' and trashed=false")+'&orderBy=modifiedTime desc&pageSize=1&fields=files(id,name,modifiedTime)';
    var res=await fetch(u,{headers:h}),j=await res.json();if(!j.files||!j.files.length)return alert('ยังไม่มีไฟล์สำรอง');
    res=await fetch('https://www.googleapis.com/drive/v3/files/'+j.files[0].id+'?alt=media',{headers:h});var s=await res.json();
    if(!confirm('กู้คืนจาก '+j.files[0].name+' หรือไม่?'))return;state=Object.assign(state,s);safeStore(dataKey(),JSON.stringify(state));loadUserData();
  }catch(e){q('#driveStatus').textContent='กู้คืนไม่สำเร็จ'}
};

function sec(title,txt){return '<h3>'+esc(title)+'</h3><p>'+esc(txt||'-')+'</p>'}
function renderReport(){
  collect();var d=state.data,refs=state.references.map(function(x){return '<p style="text-indent:0">'+esc(x.citation)+'</p>'}).join('')||'<p style="text-indent:0">-</p>';
  var box=q('#report');if(!box)return;
  box.innerHTML='<div class="cover"><h1>'+esc(d.title||d.draftTitle||'ชื่อเรื่องวิจัย')+'</h1><p>'+esc(d.researcher||'ผู้วิจัย')+'</p><p>'+esc(d.organization||'หน่วยงาน')+'</p><p>ปีการศึกษา '+esc(d.academicYear||'-')+'</p></div>'+
  '<div class="pagebreak"><h2>บทคัดย่อ</h2><p>สรุปปัญหา วิธีดำเนินการวิจัย และข้อค้นพบสำคัญ</p></div>'+
  '<div class="pagebreak"><h2>บทที่ 1<br>บทนำ</h2>'+sec('ความเป็นมาและความสำคัญของปัญหา',d.ch1Background)+sec('วัตถุประสงค์การวิจัย',d.objectives)+sec('สมมติฐาน',d.hypotheses)+sec('ขอบเขตการวิจัย',d.scope)+sec('นิยามศัพท์เฉพาะ',d.definitions)+sec('ประโยชน์ที่คาดว่าจะได้รับ',d.benefits)+'</div>'+
  '<div class="pagebreak"><h2>บทที่ 2<br>เอกสารและงานวิจัยที่เกี่ยวข้อง</h2>'+sec('กรอบแนวคิด/ทฤษฎีหลัก',d.ch2Framework)+sec('การสังเคราะห์เอกสารและงานวิจัยที่เกี่ยวข้อง',d.ch2Synthesis)+sec('ช่องว่างจากงานเดิม',d.researchGap)+'</div>'+
  '<div class="pagebreak"><h2>บทที่ 3<br>วิธีดำเนินการวิจัย</h2>'+sec('ประชากร/กลุ่มตัวอย่าง',d.population)+sec('วิธีเลือกกลุ่มตัวอย่าง',d.sampling)+sec('เครื่องมือในการแก้ปัญหา/นวัตกรรม',d.instrumentIntervention)+sec('เครื่องมือในการเก็บรวบรวมข้อมูล',d.instrumentData)+sec('การสร้างและตรวจคุณภาพเครื่องมือ',d.instrumentQuality)+sec('การเก็บรวบรวมข้อมูล',d.dataCollection)+sec('สถิติและวิธีวิเคราะห์ข้อมูล',d.analysisPlan)+sec('ตารางเวลาปฏิบัติการวิจัย',d.timeline)+'</div>'+
  '<div class="pagebreak"><h2>บทที่ 4<br>ผลการวิเคราะห์ข้อมูล</h2>'+sec('ผลการวิเคราะห์ตามวัตถุประสงค์',d.resultsNarrative)+sec('ตาราง/แผนภูมิ/คำอธิบาย',d.resultsTables)+'</div>'+
  '<div class="pagebreak"><h2>บทที่ 5<br>สรุป อภิปรายผล และข้อเสนอแนะ</h2>'+sec('สรุปวิธีดำเนินการ',d.ch5MethodSummary)+sec('สรุปผลการวิจัย',d.ch5Summary)+sec('อภิปรายผล',d.discussion)+sec('ข้อเสนอแนะในการนำผลไปใช้',d.recommendUse)+sec('ข้อเสนอแนะสำหรับการวิจัยต่อไป',d.recommendFuture)+'</div>'+
  '<div class="pagebreak"><h2>บรรณานุกรม</h2>'+refs+'</div>'+
  '<div class="pagebreak"><h2>ภาคผนวก</h2><p>แนบเครื่องมือวิจัย แบบทดสอบ แบบสอบถาม แบบประเมิน ตารางคะแนน และหลักฐานที่เกี่ยวข้อง</p></div>';
}
window.openPrint=function(){
  renderReport();
  location.hash='printView';
  setTimeout(function(){window.print()},250);
};

function init(){
  var sess=safeRead(APP_NS+'.session');if(sess){try{currentUser=JSON.parse(sess)||currentUser}catch(e){}}
  showAppUser();initNav();initDrive();loadUserData();updateExternalLinks();
  var sq=q('#searchQ');if(sq)sq.addEventListener('input',updateExternalLinks);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
