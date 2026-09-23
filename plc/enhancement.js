
(function(){
  const radarLabels=[
    'ผู้เรียนสามารถเข้าถึงสิ่งที่เรียนและเข้าใจบทเรียน',
    'ผู้เรียนสามารถเชื่อมโยงความรู้หรือประสบการณ์เดิมกับการเรียนรู้ใหม่',
    'ผู้เรียนได้สร้างความรู้เอง หรือได้สร้างประสบการณ์ใหม่จากการเรียนรู้',
    'ผู้เรียนได้รับการกระตุ้นและเกิดแรงจูงใจในการเรียนรู้',
    'ผู้เรียนได้รับการพัฒนาทักษะความเชี่ยวชาญจากการเรียนรู้',
    'ผู้เรียนได้รับข้อมูลสะท้อนกลับเพื่อปรับปรุงการเรียนรู้',
    'ผู้เรียนได้รับการพัฒนาการเรียนรู้ในบรรยากาศชั้นเรียนที่เหมาะสม',
    'ผู้เรียนสามารถกำกับการเรียนรู้และมีการเรียนรู้แบบนำตนเอง'
  ];
  const radarLines=[
    ['ผู้เรียนสามารถเข้าถึงสิ่งที่เรียน','และเข้าใจบทเรียน'],
    ['ผู้เรียนสามารถเชื่อมโยงความรู้หรือ','ประสบการณ์เดิมกับการเรียนรู้ใหม่'],
    ['ผู้เรียนได้สร้างความรู้เอง หรือได้สร้าง','ประสบการณ์ใหม่จากการเรียนรู้'],
    ['ผู้เรียนได้รับการกระตุ้นและ','เกิดแรงจูงใจในการเรียนรู้'],
    ['ผู้เรียนได้รับการพัฒนาทักษะ','ความเชี่ยวชาญจากการเรียนรู้'],
    ['ผู้เรียนได้รับข้อมูลสะท้อนกลับ','เพื่อปรับปรุงการเรียนรู้'],
    ['ผู้เรียนได้รับการพัฒนาการเรียนรู้','ในบรรยากาศชั้นเรียนที่เหมาะสม'],
    ['ผู้เรียนสามารถกำกับการเรียนรู้','และมีการเรียนรู้แบบนำตนเอง']
  ];

  function radarData(){
    if(!state.radar) state.radar={scores:Array(8).fill(''),note:''};
    if(!Array.isArray(state.radar.scores)||state.radar.scores.length!==8) state.radar.scores=Array(8).fill('');
    return state.radar;
  }
  function polar(cx,cy,r,a){
    const rad=(a-90)*Math.PI/180;
    return [cx+r*Math.cos(rad),cy+r*Math.sin(rad)];
  }
  function radarSvg(scores){
    const W=1220,H=680,cx=610,cy=340,R=235,levels=[0,20,40,60,80,100];
    const vals=scores.map(v=>{const n=parseFloat(v);return Number.isFinite(n)?Math.max(0,Math.min(100,n)):null});
    let grid='',axes='',labels='',poly='',pts='';
    levels.forEach(lv=>{
      const rr=R*(lv/100),arr=[];
      for(let i=0;i<8;i++) arr.push(polar(cx,cy,rr,i*45).join(','));
      grid+='<polygon class="radar-grid" points="'+arr.join(' ')+'"/>';
      if(lv>0) grid+='<text class="radar-value" x="'+(cx+6)+'" y="'+(cy-rr+4)+'">'+lv+'</text>';
    });
    for(let i=0;i<8;i++){
      const p=polar(cx,cy,R,i*45);
      axes+='<line class="radar-axis" x1="'+cx+'" y1="'+cy+'" x2="'+p[0]+'" y2="'+p[1]+'"/>';
      const lp=polar(cx,cy,R+86,i*45);
      let anchor='middle'; if(lp[0]<cx-55)anchor='end'; else if(lp[0]>cx+55)anchor='start';
      const lines=radarLines[i];
      labels+='<text class="radar-label" text-anchor="'+anchor+'" x="'+lp[0]+'" y="'+(lp[1]-8)+'">'+
        '<tspan x="'+lp[0]+'" dy="0">'+(i+1)+'. '+esc(lines[0])+'</tspan>'+
        '<tspan x="'+lp[0]+'" dy="16">'+esc(lines[1])+'</tspan></text>';
    }
    const valid=vals.filter(v=>v!==null).length;
    if(valid>=3){
      const arr=[];
      for(let i=0;i<8;i++){
        const v=vals[i]===null?0:vals[i],p=polar(cx,cy,R*(v/100),i*45);
        arr.push(p.join(','));
        pts+='<circle class="radar-point" cx="'+p[0]+'" cy="'+p[1]+'" r="4.5"/>';
      }
      poly='<polygon class="radar-area" points="'+arr.join(' ')+'"/>';
    }
    const empty=valid<3?'<text x="'+cx+'" y="'+(cy+6)+'" text-anchor="middle" class="radar-label">กรอกคะแนนอย่างน้อย 3 ตัวชี้วัดเพื่อแสดงกราฟ</text>':'';
    return '<svg class="radar-svg" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="กราฟเรดาร์ผลการสังเกตชั้นเรียน 8 ตัวชี้วัด">'+grid+axes+poly+pts+labels+empty+'</svg>';
  }

  function areaRadarSvg(areas){
    const W=900,H=620,cx=450,cy=300,R=220,levels=[0,20,40,60,80,100];
    const items=(areas||[]).map(x=>({name:String(x.name||''),value:Math.max(0,Math.min(100,parseFloat(x.value)||0))}));
    const n=items.length||1;
    let grid='',axes='',labels='',poly='',pts='';
    levels.forEach(lv=>{
      const rr=R*(lv/100),arr=[];
      for(let j=0;j<n;j++) arr.push(polar(cx,cy,rr,j*(360/n)).join(','));
      if(n>=3) grid+='<polygon class="radar-grid" points="'+arr.join(' ')+'"/>';
      if(lv>0) grid+='<text class="radar-value" x="'+(cx+7)+'" y="'+(cy-rr+4)+'">'+lv+'</text>';
    });
    const points=[];
    items.forEach((it,j)=>{
      const angle=j*(360/n),end=polar(cx,cy,R,angle);
      axes+='<line class="radar-axis" x1="'+cx+'" y1="'+cy+'" x2="'+end[0]+'" y2="'+end[1]+'"/>';
      const lp=polar(cx,cy,R+62,angle);
      let anchor='middle'; if(lp[0]<cx-40)anchor='end'; else if(lp[0]>cx+40)anchor='start';
      const words=it.name.split(' '),cut=Math.ceil(words.length/2),l1=words.slice(0,cut).join(' '),l2=words.slice(cut).join(' ');
      labels+='<text class="radar-label" text-anchor="'+anchor+'" x="'+lp[0]+'" y="'+(lp[1]-9)+'"><tspan x="'+lp[0]+'" dy="0">'+esc(l1)+'</tspan>'+(l2?'<tspan x="'+lp[0]+'" dy="16">'+esc(l2)+'</tspan>':'')+'<tspan x="'+lp[0]+'" dy="17" class="radar-value">'+it.value+'%</tspan></text>';
      const p=polar(cx,cy,R*(it.value/100),angle);
      points.push(p.join(','));
      pts+='<circle class="radar-point" cx="'+p[0]+'" cy="'+p[1]+'" r="5"/>';
    });
    if(items.length>=3) poly='<polygon class="radar-area" points="'+points.join(' ')+'"/>';
    return '<div class="radar-wrap"><svg class="radar-svg" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="กราฟเรดาร์ความก้าวหน้ารายด้าน">'+grid+axes+poly+pts+labels+'</svg></div>'+
      '<div class="grid g3" style="margin-top:10px">'+items.map(it=>'<div class="soft"><b>'+esc(it.name)+'</b><br><strong style="font-size:22px;color:var(--g)">'+it.value+'%</strong></div>').join('')+'</div>';
  }

  function radarEditor(){
    const r=radarData();
    return '<div class="score-grid">'+radarLabels.map((x,i)=>
      '<div class="score-row"><span>'+(i+1)+'. '+esc(x)+'</span><input class="radarScoreEnh" data-i="'+i+'" type="number" min="0" max="100" step="1" placeholder="0–100" value="'+esc(r.scores[i])+'"></div>'
    ).join('')+'</div>'+
    '<div class="field" style="margin-top:9px"><label>หมายเหตุการวิเคราะห์กราฟ</label><textarea id="radarNoteEnh">'+esc(r.note||'')+'</textarea></div>'+
    '<button class="btn" id="saveRadarEnh" style="margin-top:9px">บันทึกคะแนนกราฟ</button>';
  }
  function radarSummary(){
    const r=radarData(),arr=r.scores.map((v,i)=>({i,v:parseFloat(v)})).filter(x=>Number.isFinite(x.v));
    if(!arr.length) return 'ยังไม่มีคะแนนตัวชี้วัดสำหรับวิเคราะห์กราฟ';
    const mean=(arr.reduce((a,b)=>a+b.v,0)/arr.length).toFixed(2);
    const hi=[...arr].sort((a,b)=>b.v-a.v)[0],lo=[...arr].sort((a,b)=>a.v-b.v)[0];
    return 'คะแนนเฉลี่ย '+mean+' คะแนน จาก '+arr.length+' ตัวชี้วัด โดยค่าที่สูงสุดคือ “'+radarLabels[hi.i]+'” '+hi.v+' คะแนน และค่าที่ควรติดตามเพิ่มเติมคือ “'+radarLabels[lo.i]+'” '+lo.v+' คะแนน';
  }
  function safe(v,fallback='ยังไม่มีข้อมูลบันทึกในระบบ'){
    const t=String(v??'').trim(); return t?t:fallback;
  }
  function teacherFeedbackData(){
    const a=state.forms.r13||{},b=state.forms.r14||{},c=state.forms.r21||{},d=state.forms.r22||{},e=state.forms.r23||{};
    return {
      teacher:e.model||a.model||state.owner.model||'',
      subject:a.subject||state.school.subject||'',
      grade:a.grade||state.school.grade||'',
      learner:[a.student,e.student].filter(x=>String(x||'').trim()).join(' / '),
      strengths:[a.good,e.good].filter(x=>String(x||'').trim()).join(' / '),
      improve:[a.improve,e.improve,b.improveNext].filter(x=>String(x||'').trim()).join(' / '),
      reflection:[b.reflections,b.goodNext,c.summary].filter(x=>String(x||'').trim()).join(' / '),
      redesign:[d.shared,d.use,d.result].filter(x=>String(x||'').trim()).join(' / '),
      radar:radarSummary()
    };
  }
  function teacherFeedbackHtml(compact=false){
    const d=teacherFeedbackData();
    const head=compact?'':'<h2>รายงานแจ้งผลการสังเกตชั้นเรียนและการพัฒนาการจัดการเรียนรู้</h2>'+
      '<p class="noindent"><b>โรงเรียน:</b> '+esc(state.school.name)+'</p>'+
      '<p class="noindent"><b>ครูผู้รับการแจ้งผล:</b> '+esc(d.teacher||'ยังไม่ได้ระบุ')+'</p>'+
      '<p class="noindent"><b>รายวิชา:</b> '+esc(d.subject||'-')+' &nbsp; <b>ชั้น:</b> '+esc(d.grade||'-')+'</p>';
    return head+
      '<div class="feedback-box"><h4>สรุปผลการสังเกตชั้นเรียน</h4><div>'+esc(safe(d.learner))+'</div></div>'+
      '<div class="feedback-box"><h4>จุดเด่นที่พบ</h4><div>'+esc(safe(d.strengths))+'</div></div>'+
      '<div class="feedback-box"><h4>ประเด็นที่ควรปรับปรุง</h4><div>'+esc(safe(d.improve))+'</div></div>'+
      '<div class="feedback-box"><h4>สรุปผลการสะท้อนคิด</h4><div>'+esc(safe(d.reflection))+'</div></div>'+
      '<div class="feedback-box"><h4>แนวทางปรับปรุงและออกแบบการสอนใหม่</h4><div>'+esc(safe(d.redesign))+'</div></div>'+
      '<div class="feedback-box"><h4>ผลวิเคราะห์ 8 ตัวชี้วัด</h4><div>'+esc(d.radar)+'</div></div>';
  }
  function localBookStyles(){
    return '<style>@page{size:A4;margin:15mm}body{font-family:"TH Sarabun New","Sarabun","Tahoma",sans-serif;color:#111;line-height:1.55;font-size:16px}.paper{page-break-after:always}.paper h2{text-align:center;font-size:21px}.paper h3{font-size:17px;margin:14px 0 5px}.paper p{text-align:justify;text-indent:2.5em;margin:5px 0}.paper .noindent{text-indent:0}.report-table{width:100%;border-collapse:collapse;margin:8px 0}.report-table th,.report-table td{border:1px solid #777;padding:5px 6px;font-size:13px;vertical-align:top}.feedback-box{border-left:4px solid #287f70;background:#f4faf8;padding:10px 12px;margin:9px 0}.feedback-box h4{margin:0 0 5px}</style>';
  }
  function printWindow(title,body){
    const w=window.open('','_blank');
    if(!w){toast('เบราว์เซอร์บล็อกหน้าต่างพิมพ์');return}
    w.document.write('<!doctype html><html lang="th"><head><meta charset="utf-8"><title>'+esc(title)+'</title>'+localBookStyles()+'</head><body>'+body+'</body></html>');
    w.document.close(); w.focus(); setTimeout(()=>w.print(),450);
  }
  function printTeacherFeedback(){
    const d=teacherFeedbackData();
    const body='<div class="paper">'+teacherFeedbackHtml(false)+
      '<p class="noindent" style="margin-top:35px">ลงชื่อ .......................................................... ครูผู้รับการแจ้งผล</p>'+
      '<p class="noindent">ลงชื่อ .......................................................... ผู้บริหาร/ผู้ให้ข้อเสนอแนะ</p>'+
      '<p class="noindent">วันที่ ............ เดือน ........................ พ.ศ. ............</p></div>';
    printWindow('รายงานแจ้งผลครู',body);
  }
  function teamTable(){
    const rows=[{role:'Model Teacher',name:state.owner.model,level:state.owner.level,email:state.owner.email},...state.team];
    return '<table class="report-table"><thead><tr><th>บทบาท</th><th>ชื่อ-นามสกุล</th><th>วิทยฐานะ/ตำแหน่ง</th><th>อีเมล</th></tr></thead><tbody>'+
      rows.map(x=>'<tr><td>'+esc(x.role)+'</td><td>'+esc(x.name||'-')+'</td><td>'+esc(x.level||'-')+'</td><td>'+esc(x.email||'-')+'</td></tr>').join('')+'</tbody></table>';
  }
  function scheduleTable(){
    return '<table class="report-table"><thead><tr><th>ลำดับ</th><th>กิจกรรม</th><th>วัน/เวลาเป้าหมาย</th><th>วงรอบ</th><th>ชั่วโมง</th><th>สถานะ</th></tr></thead><tbody>'+
      state.schedule.map(x=>'<tr><td>'+esc(x.code)+'</td><td>'+esc(x.activity)+'</td><td>'+esc(x.date||'-')+'</td><td>'+esc(x.round||'-')+'</td><td>'+esc(x.hours||'-')+'</td><td>'+esc(x.status)+'</td></tr>').join('')+'</tbody></table>';
  }
  function printPlan(){
    const sc=state.school;
    const body='<div class="paper"><h2>แผนปฏิบัติการดำเนินงานชุมชนแห่งการเรียนรู้ทางวิชาชีพ (PLC Action Plan)</h2>'+
      '<p class="noindent"><b>แผนการดำเนินงาน ภาคเรียนที่</b> '+esc(sc.term)+' <b>ปีการศึกษา</b> '+esc(sc.year)+'</p>'+
      '<p class="noindent"><b>Model Teacher:</b> '+esc(state.owner.model||'-')+' &nbsp; <b>วิทยฐานะ:</b> '+esc(state.owner.level||'-')+'</p>'+
      '<p class="noindent"><b>โรงเรียน:</b> '+esc(sc.name)+' &nbsp; <b>สังกัด:</b> '+esc(sc.agency)+' &nbsp; <b>จังหวัด:</b> '+esc(sc.province)+'</p>'+
      '<p class="noindent"><b>รายวิชา:</b> '+esc(sc.subject||'-')+' &nbsp; <b>ชั้น:</b> '+esc(sc.grade||'-')+' &nbsp; <b>นักเรียนชาย:</b> '+esc(sc.male||'-')+' &nbsp; <b>หญิง:</b> '+esc(sc.female||'-')+' &nbsp; <b>รวม:</b> '+esc(sc.total||'-')+'</p>'+
      '<h3>สมาชิกทีม PLT</h3>'+teamTable()+'<h3>แผนการดำเนินกิจกรรมและเวลาเป้าหมาย</h3>'+scheduleTable()+
      '<p class="noindent" style="margin-top:30px">ลงชื่อ .......................................................... ผู้จัดทำแผน</p>'+
      '<h3>ความคิดเห็น/ข้อเสนอแนะ</h3><p>................................................................................................................................................................................</p>'+
      '<p class="noindent" style="margin-top:30px">ลงชื่อ .......................................................... ผู้อำนวยการโรงเรียน</p></div>';
    printWindow('PLC Action Plan',body);
  }
  function formReport(id){
    const r=state.forms[id]||{};
    if(id==='r11'||id==='r21'){
      const activity=id==='r11'?'วิเคราะห์ผลการจัดการเรียนรู้และผลสัมฤทธิ์ในการสอบระดับชาติ':'วิเคราะห์ชิ้นงานนักเรียนหลังจากเปิดชั้นเรียน';
      return '<div class="paper"><h2>บันทึกชุมชนการเรียนรู้วิชาชีพ (Professional Learning Community : PLC)</h2>'+
        '<p class="noindent"><b>โรงเรียน:</b> '+esc(state.school.name)+' &nbsp; <b>สังกัด:</b> '+esc(state.school.agency)+'</p>'+
        '<p class="noindent"><b>กิจกรรม:</b> '+activity+'</p>'+
        '<p class="noindent"><b>ชื่อเครือข่าย:</b> '+esc(r.network||'-')+' &nbsp; <b>ครั้งที่:</b> '+esc(r.times||'-')+' &nbsp; <b>วันที่:</b> '+esc(r.date||'-')+'</p>'+
        '<p class="noindent"><b>ภาคเรียนที่:</b> '+esc(state.school.term)+' <b>ปีการศึกษา:</b> '+esc(state.school.year)+' &nbsp; <b>จำนวน:</b> '+esc(r.hours||'-')+' ชั่วโมง &nbsp; <b>เวลา:</b> '+esc(r.time||'-')+'</p>'+
        '<h3>1. ประเด็น</h3><p>'+esc(safe(r.issue))+'</p>'+
        '<h3>2. การอภิปรายประเด็น</h3><p><b>ขอบข่ายปัญหาที่พบ:</b> '+esc(safe(r.scope))+'</p><p><b>หลักฐานประจักษ์พยานของปัญหา:</b> '+esc(safe(r.evidence))+'</p><p><b>วิเคราะห์สาเหตุของปัญหา:</b> '+esc(safe(r.cause))+'</p><p><b>สรุปสาเหตุ:</b> '+esc(safe(r.causeSum))+'</p>'+
        '<h3>3. การอภิปรายการดำเนินการ</h3><p>'+esc(safe(r.discuss))+'</p>'+
        '<h3>4. สรุปสิ่งที่ได้รับจากการอภิปราย</h3><p>'+esc(safe(r.summary))+'</p>'+
        '<h3>5. ความรู้และหลักการนำมาใช้ในกิจกรรม</h3><p>'+esc(safe(r.principle))+'</p>'+
        '<h3>6. การประชุมครั้งต่อไป</h3><p>'+esc(safe(r.next))+'</p>'+
        '<h3>ความคิดเห็น/ข้อเสนอแนะของผู้อำนวยการ</h3><p>'+esc(safe(r.director))+'</p>'+
        '<p class="noindent" style="margin-top:30px">ลงชื่อ .......................................................... ผู้อำนวยการโรงเรียน</p></div>';
    }
    if(id==='r13'){
      return '<div class="paper"><h2>การเปิดชั้นเรียนและผลการสังเกตการสอน รอบที่ 1</h2>'+
        '<p class="noindent"><b>Model Teacher:</b> '+esc(r.model||'-')+' &nbsp; <b>แผนการจัดการเรียนรู้ที่:</b> '+esc(r.plan||'-')+'</p>'+
        '<p class="noindent"><b>กลุ่มสาระ/รายวิชา:</b> '+esc(r.subject||'-')+' &nbsp; <b>ชั้น:</b> '+esc(r.grade||'-')+' &nbsp; <b>หน่วย:</b> '+esc(r.unit||'-')+' &nbsp; <b>เรื่อง:</b> '+esc(r.topic||'-')+'</p>'+
        '<h3>องค์ประกอบแผนการจัดการเรียนรู้</h3>'+
        '<p><b>มาตรฐาน/ตัวชี้วัด:</b> '+esc(safe(r.standard))+'</p><p><b>จุดประสงค์:</b> '+esc(safe(r.objective))+'</p><p><b>สมรรถนะสำคัญ:</b> '+esc(safe(r.competency))+'</p><p><b>คุณลักษณะอันพึงประสงค์:</b> '+esc(safe(r.attribute))+'</p><p><b>หลักฐานการเรียนรู้:</b> '+esc(safe(r.evidence))+'</p><p><b>สาระสำคัญ/ความคิดรวบยอด:</b> '+esc(safe(r.concept))+'</p><p><b>สาระการเรียนรู้:</b> '+esc(safe(r.content))+'</p><p><b>การบูรณาการ:</b> '+esc(safe(r.integration))+'</p><p><b>กระบวนการจัดการเรียนรู้:</b> '+esc(safe(r.process))+'</p>'+
        '<h3>สรุปผลการสังเกตชั้นเรียน</h3><p><b>สิ่งเกิดขึ้นกับผู้เรียน:</b> '+esc(safe(r.student))+'</p><p><b>สิ่งที่ Model Teacher ปฏิบัติได้ดี:</b> '+esc(safe(r.good))+'</p><p><b>สิ่งที่ควรปรับปรุงในการสอนครั้งต่อไป:</b> '+esc(safe(r.improve))+'</p>'+
        '<h3>ผู้ร่วมสังเกตการสอน / บทบาทในทีม</h3><p>'+esc(safe(r.members))+'</p><h3>ความคิดเห็น/ข้อเสนอแนะ</h3><p>'+esc(safe(r.comment))+'</p>'+
        '<p class="noindent" style="margin-top:30px">ลงชื่อ .......................................................... ผู้บริหารสถานศึกษา</p></div>';
    }
    if(id==='r14'){
      return '<div class="paper"><h2>รายงานการประชุมสะท้อนคิดหลังจากการสังเกตการสอน</h2>'+
        '<p class="noindent"><b>ชื่อโครงการ:</b> โครงการพัฒนาครูและบุคลากรทางการศึกษา โดยใช้กระบวนการชุมชนแห่งการเรียนรู้ทางวิชาชีพ (PLC)</p>'+
        '<p class="noindent"><b>ชื่อทีม:</b> '+esc(r.team||'-')+' &nbsp; <b>วัน เดือน ปี:</b> '+esc(r.date||'-')+' &nbsp; <b>เวลาประชุม:</b> '+esc(r.time||'-')+'</p>'+
        '<p class="noindent"><b>ชั่วโมง PLC:</b> '+esc(r.hours||'-')+' &nbsp; <b>จำนวนสมาชิกที่เข้าร่วม:</b> '+esc(r.members||'-')+' คน</p>'+
        '<h3>ผลการดำเนินกิจกรรมในครั้งนี้</h3><p>'+esc(safe(r.result))+'</p>'+
        '<h3>ผลการสะท้อนของสมาชิก</h3><p>'+esc(safe(r.reflections))+'</p>'+
        '<h3>สิ่งที่นำไปเป็นแนวทางปฏิบัติที่ดีในครั้งต่อไป</h3><p>'+esc(safe(r.goodNext))+'</p>'+
        '<h3>สิ่งที่ควรปรับปรุงในการจัดกิจกรรมครั้งต่อไป</h3><p>'+esc(safe(r.improveNext))+'</p>'+
        '<h3>ความคิดเห็น/ข้อเสนอแนะ</h3><p>'+esc(safe(r.comment))+'</p><p class="noindent" style="margin-top:30px">ลงชื่อ .......................................................... ผู้บริหารสถานศึกษา</p></div>';
    }
    if(id==='r22'){
      const checked=(r.parts||[]).map((v,i)=>v?(i+1)+'. '+lessonParts[i]:null).filter(Boolean);
      return '<div class="paper"><h2>ร่องรอยการทำงานร่วมกับทีมและผลการออกแบบบทเรียน</h2>'+
        '<p class="noindent"><b>ชื่อกลุ่ม:</b> '+esc(r.group||'-')+' &nbsp; <b>กิจกรรม:</b> การออกแบบแผนการจัดการเรียนรู้</p>'+
        '<p class="noindent"><b>เรื่อง:</b> '+esc(r.topic||'-')+' &nbsp; <b>ชั้น:</b> '+esc(r.grade||'-')+' &nbsp; <b>วันที่:</b> '+esc(r.date||'-')+' &nbsp; <b>เวลา:</b> '+esc(r.time||'-')+'</p>'+
        '<h3>บทบาทในกิจกรรมครั้งนี้</h3><p>'+esc(safe(r.members))+'</p>'+
        '<h3>องค์ประกอบแผนที่ทีมร่วมกันวิพากษ์และเพิ่มเติม</h3><p class="noindent">'+esc(checked.length?checked.join(' • '):'ยังไม่มีการทำเครื่องหมาย')+'</p>'+
        '<h3>บันทึกการสนทนา</h3><p>'+esc(safe(r.discussion))+'</p><h3>แนวคิดร่วม / แนวปฏิบัติร่วม</h3><p>'+esc(safe(r.shared))+'</p>'+
        '<h3>สรุปผลการทำกิจกรรม PLC</h3><p>'+esc(safe(r.summary))+'</p><h3>ความรู้/หลักการที่นำมาใช้</h3><p>'+esc(safe(r.principle))+'</p>'+
        '<h3>กิจกรรมที่ทำ</h3><p>'+esc(safe(r.activity))+'</p><h3>ผลที่ได้จากกิจกรรม</h3><p>'+esc(safe(r.result))+'</p><h3>การนำไปใช้</h3><p>'+esc(safe(r.use))+'</p>'+
        '<p class="noindent"><b>การรับรองของผู้บริหารสถานศึกษา:</b> '+esc(r.cert||'-')+'</p><h3>ความคิดเห็น</h3><p>'+esc(safe(r.comment))+'</p>'+
        '<p class="noindent" style="margin-top:30px">ลงชื่อ .......................................................... ผู้บริหารสถานศึกษา</p></div>';
    }
    if(id==='r23'){
      return '<div class="paper"><h2>การเปิดชั้นเรียนและผลการสังเกตการสอน รอบที่ 2</h2>'+
        '<p class="noindent"><b>Model Teacher:</b> '+esc(r.model||'-')+' &nbsp; <b>แผนการจัดการเรียนรู้ที่:</b> '+esc(r.plan||'-')+'</p>'+
        '<h3>สิ่งเกิดขึ้นกับผู้เรียน</h3><p>'+esc(safe(r.student))+'</p>'+
        '<h3>สิ่งที่ Model Teacher ปฏิบัติได้ดี</h3><p>'+esc(safe(r.good))+'</p>'+
        '<h3>สิ่งที่ Model Teacher ควรปรับปรุงในการสอนครั้งต่อไป</h3><p>'+esc(safe(r.improve))+'</p>'+
        '<h3>ผู้ร่วมสังเกตการสอน / บทบาทในทีม</h3><p>'+esc(safe(r.members))+'</p><h3>ความคิดเห็น/ข้อเสนอแนะ</h3><p>'+esc(safe(r.comment))+'</p>'+
        '<p class="noindent"><b>วันสังเกต:</b> '+esc(r.date||'-')+' &nbsp; <b>สถานที่/ห้อง:</b> '+esc(r.place||'-')+'</p>'+
        '<p class="noindent" style="margin-top:30px">ลงชื่อ .......................................................... ผู้บริหารสถานศึกษา</p></div>';
    }
    return '<div class="paper"><h2>รายงาน PLC</h2><p>ยังไม่มีรูปแบบรายงานสำหรับหัวข้อนี้</p></div>';
  }
  function printForm(id){ printWindow('แบบบันทึก PLC',formReport(id)); }

  const originalDashboard=dashboard;
  dashboard=function(){
    const p=progress(),areas=areaStats(),overall=avg(areas.map(x=>x.value));
    const hours=state.schedule.reduce((a,x)=>a+(parseFloat(x.hours)||0),0);
    const forms=['r11','r13','r14','r21','r22','r23'],fc=forms.filter(formComplete).length;
    const next=state.schedule.find(x=>x.status!=='เสร็จแล้ว');
    document.querySelector('#content').innerHTML=
      '<div class="note">กราฟบนแดชบอร์ดแสดงจากข้อมูลที่บันทึกจริงในระบบ คะแนนกราฟ 8 ตัวชี้วัดต้องกรอกตามผลประเมินจริง ระบบไม่สร้างคะแนนแทนผู้ประเมิน</div>'+
      '<div class="grid g4"><div class="card metric"><span class="muted">ความคืบหน้าแผน</span><br><strong>'+p.pct+'%</strong><div class="bar"><i style="width:'+p.pct+'%"></i></div></div>'+
      '<div class="card metric"><span class="muted">ความก้าวหน้าเฉลี่ยรายด้าน</span><br><strong>'+overall+'%</strong></div>'+
      '<div class="card metric"><span class="muted">กิจกรรมเสร็จแล้ว</span><br><strong>'+p.done+'/8</strong></div>'+
      '<div class="card metric"><span class="muted">ชั่วโมง PLC ที่บันทึก</span><br><strong>'+hours+'</strong> ชม.</div></div>'+
      '<div class="dash-chart-grid"><div class="card"><div class="head"><div><h2>กราฟวิเคราะห์ผลการสังเกตชั้นเรียน 8 ตัวชี้วัด</h2><div class="muted">รูปแบบเรดาร์ตามภาพแนบ • คะแนน 0–100</div></div></div><div class="radar-wrap">'+radarSvg(radarData().scores)+'</div>'+radarEditor()+'</div>'+
      '<div><div class="card"><h2>กราฟความก้าวหน้ารายด้าน</h2><div class="muted">กราฟเรดาร์รูปแบบเดียวกับภาพแนบ • คำนวณจากความครบถ้วนของบันทึกและสถานะกิจกรรม</div>'+areaRadarSvg(areas)+'</div>'+
      '<div class="card"><h2>สถานะกิจกรรมตามแผน</h2>'+statusStackHtml()+'<div class="soft" style="margin-top:12px"><b>กิจกรรมถัดไป</b><br>'+(next?esc(next.code+' '+next.activity)+(next.date?'<br><span class="muted">'+esc(next.date)+'</span>':''):'ดำเนินการครบทุกกิจกรรมแล้ว')+'</div></div></div></div>'+
      '<div class="card"><div class="head"><div><h2>สรุปบันทึกการสังเกตชั้นเรียน</h2><div class="muted">สรุปผล • ปรับปรุง • ออกแบบการสอนใหม่ • พร้อมแจ้งผลครู</div></div><div class="quick-actions"><button class="btn" id="printTeacherEnh">พิมพ์รายงานแจ้งผลครู</button><button class="btn alt" id="openFiveChapterEnh">เปิดรายงาน 5 บท</button><button class="btn alt" id="printFiveChapterEnh">พิมพ์เล่ม 5 บท / PDF</button></div></div><div class="report-mini">'+teacherFeedbackHtml(true)+'</div></div>'+
      '<div class="card"><h2>รายละเอียดกิจกรรมตามแผน</h2><div class="timeline">'+state.schedule.map(x=>'<div class="step"><b>'+x.code+'</b><div><b>'+esc(x.activity)+'</b><div class="muted">'+(x.date?esc(x.date):'ยังไม่กำหนดวัน')+(x.round?' • '+esc(x.round):'')+(x.hours?' • '+esc(x.hours)+' ชม.':'')+'</div></div><div><span class="badge '+(x.status==='เสร็จแล้ว'?'done':x.status==='กำลังดำเนินการ'?'wait':'')+'">'+esc(x.status)+'</span></div></div>').join('')+'</div></div>'+
      '<div class="card"><div class="grid g3"><div class="soft"><b>แบบบันทึกที่เริ่มกรอก</b><br>'+fc+'/6 แบบ</div><div class="soft"><b>ผลวิเคราะห์กราฟ</b><br>'+esc(radarSummary())+'</div><div class="soft"><b>อัปเดตล่าสุด</b><br>'+fmtTime(state.updatedAt)+'</div></div></div>';
    const sv=document.querySelector('#saveRadarEnh');
    if(sv)sv.onclick=()=>{
      const r=radarData();
      document.querySelectorAll('.radarScoreEnh').forEach(x=>r.scores[+x.dataset.i]=x.value);
      r.note=(document.querySelector('#radarNoteEnh')||{}).value||'';
      state.radar=r; save('บันทึกคะแนนกราฟแล้ว'); dashboard();
    };
    document.querySelector('#printTeacherEnh').onclick=printTeacherFeedback;
    document.querySelector('#openFiveChapterEnh').onclick=()=>{current='report';render()};
    document.querySelector('#printFiveChapterEnh').onclick=printBook;
  };

  function enhanceCurrentPage(){
    const ctn=document.querySelector('#content'); if(!ctn)return;
    if(current==='plan'){
      const h=ctn.querySelector('.head'); if(h&&!h.querySelector('[data-enh-printplan]')){
        const b=document.createElement('button');b.className='btn alt';b.textContent='พิมพ์แผนตามแบบ';b.dataset.enhPrintplan='1';h.appendChild(b);b.onclick=printPlan;
      }
    }
    if(['r11','r13','r14','r21','r22','r23'].includes(current)){
      const h=ctn.querySelector('.head'); if(h&&!h.querySelector('[data-enh-printform]')){
        const b=document.createElement('button');b.className='btn alt';b.textContent='พิมพ์แบบบันทึกตามต้นฉบับ';b.dataset.enhPrintform=current;h.appendChild(b);b.onclick=()=>printForm(current);
      }
    }
    if(current==='report'){
      const h=ctn.querySelector('.head'); if(h&&!h.querySelector('[data-enh-teacher]')){
        const b=document.createElement('button');b.className='btn alt';b.textContent='พิมพ์รายงานแจ้งผลครู';b.dataset.enhTeacher='1';h.appendChild(b);b.onclick=printTeacherFeedback;
      }
    }
  }
  const originalRender=render;
  render=function(){ originalRender(); setTimeout(enhanceCurrentPage,0); };

  if(session){
    setTimeout(()=>render(),0);
  }
})();