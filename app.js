/* ============ LONGEVITY PILOT COMMAND — live model ============ */

// ---- Pilot Path data (computed, 9-week plan to exactly 60 acq, $82,773 total) ----
const PILOT = {
  spentToDate: 37773, leadsToDate: 1521, acqToDate: 6,
  budgetCap: 77000, totalPilotSpend: 82773, target: 60,
  rows: [
    {wk:1,spend:5000,leads:312,paid:219,bio:94,contact:0.28,contacted:87.5,close:0.0170,acq:1.49,cum:7.5,rev:1789,dials:2715,cpl:8.7,drd:181},
    {wk:2,spend:5000,leads:312,paid:219,bio:94,contact:0.31,contacted:96.9,close:0.0210,acq:2.04,cum:9.5,rev:2442,dials:3005,cpl:9.6,drd:200},
    {wk:3,spend:5000,leads:312,paid:219,bio:94,contact:0.34,contacted:106.3,close:0.0250,acq:2.65,cum:12.2,rev:3185,dials:3296,cpl:10.5,drd:220},
    {wk:4,spend:5000,leads:312,paid:219,bio:94,contact:0.37,contacted:115.6,close:0.0295,acq:3.41,cum:15.6,rev:4097,dials:3587,cpl:11.5,drd:239},
    {wk:5,spend:5000,leads:312,paid:219,bio:94,contact:0.40,contacted:125.0,close:0.0426,acq:5.32,cum:20.9,rev:6388,dials:3878,cpl:12.4,drd:259},
    {wk:6,spend:5000,leads:312,paid:219,bio:94,contact:0.42,contacted:131.2,close:0.0539,acq:7.08,cum:28.0,rev:8496,dials:4072,cpl:13.0,drd:271},
    {wk:7,spend:5000,leads:312,paid:219,bio:94,contact:0.44,contacted:137.5,close:0.0653,acq:8.98,cum:37.0,rev:10774,dials:4266,cpl:13.7,drd:284},
    {wk:8,spend:5000,leads:312,paid:219,bio:94,contact:0.45,contacted:140.6,close:0.0767,acq:10.78,cum:47.8,rev:12936,dials:4363,cpl:14.0,drd:291},
    {wk:9,spend:5000,leads:312,paid:219,bio:94,contact:0.46,contacted:143.8,close:0.0852,acq:12.24,cum:60.0,rev:14692,dials:4460,cpl:14.3,drd:297}
  ],
  jul:{spend:20000,leads:1250,acq:9.6,rev:11513,cum:15.6,avgclose:0.0236},
  aug:{spend:25000,leads:1562,acq:44.4,rev:53287,cum:60.0,avgclose:0.0655}
};

// ---- constants ----
// Model convention (matches original dashboard): total leads = spend / cpl.
// Bio link supplies BIO_SHARE of the TOTAL at $0; paid is the rest. Baseline ties to 6 wins.
const PRICE=1200, BIO_SHARE=0.30, DIALS_PER_CONTACTED=3000/96.7, REPS=3, WK_PER_MO=4.3;

// ---- inputs ----
const S={spend:5800,cpl:15,contact:0.25,close:0.0621};

// ---- core model ----
function model(spend,cpl,contact,close){
  const total=spend/cpl;            // total lead flow bought at this CPL
  const bio=total*BIO_SHARE;         // 30% arrive free via bio link
  const paid=total-bio;              // remaining 70% are paid
  const blendedCPL=spend/total;
  const contacted=total*contact;
  const acq=contacted*close;
  const rev=acq*PRICE;
  const profit=rev-spend;
  const roas=rev/spend;
  const cac=acq>0?spend/acq:Infinity;
  const beAcq=spend/PRICE;
  const beClose=contacted>0?beAcq/contacted:0;
  const never=total-contacted;
  const dials=contacted*DIALS_PER_CONTACTED;
  return {spend,cpl,contact,close,paid,bio,total,blendedCPL,contacted,acq,rev,profit,roas,cac,
    beAcq,beClose,never,dials,revMo:rev*WK_PER_MO,profitMo:profit*WK_PER_MO,
    callsPerLead:dials/total,dialsPerRepDay:dials/5/REPS,contribution:PRICE-cac};
}

// ---- formatters ----
const $=id=>document.getElementById(id);
const fUSD=v=>'$'+Math.round(v).toLocaleString();
const fUSD1=v=>'$'+(Math.round(v*10)/10).toLocaleString();
const fN=(v,d=1)=>Number(v).toLocaleString(undefined,{minimumFractionDigits:d,maximumFractionDigits:d});
const fPct=(v,d=2)=>(v*100).toFixed(d)+'%';

// ---- chart theme ----
Chart.defaults.color='#9fb4d8';
Chart.defaults.font.family="'Inter',sans-serif";
Chart.defaults.font.size=12;
const GRID={color:'rgba(120,170,255,0.09)'};
const charts={};
function grad(ctx,c1,c2){const g=ctx.createLinearGradient(0,0,0,300);g.addColorStop(0,c1);g.addColorStop(1,c2);return g;}
function mk(id,cfg){if(charts[id])charts[id].destroy();const el=$(id);if(!el)return;charts[id]=new Chart(el,cfg);}
const BLUE='#5aa9ff',CYAN='#00d0ff',ICE='#7fd6ff',GOOD='#38e0a8',BAD='#ff5d6c',WARN='#ffb547';

// ============ TAB: EXEC ============
function renderExec(m){
  const req=m.close; // current close is the operating point
  $('exec-kpis').innerHTML=kpi([
    ['WEEKLY SPEND',fUSD(m.spend),fN(m.total,0)+' leads',''],
    ['LEADS / WEEK',fN(m.total,0),Math.round(m.paid)+' paid · '+Math.round(m.bio)+' bio','accent'],
    ['WINS / WEEK',fN(m.acq,1),fUSD(m.rev)+'/wk',m.acq>=m.beAcq?'good':'bad'],
    ['CLOSE RATE',fPct(m.close),'acq / contacted',''],
    ['ROAS',fN(m.roas,2)+'×','CAC '+fUSD(m.cac)+(m.cac<PRICE?' < $1,200':' > $1,200'),m.roas>=1?'good':'bad']
  ]);
  $('exec-pl-cap').textContent=(m.profit>=0?'Profit ':'Loss ')+fUSD(Math.abs(m.profit))+' at current operating point';
  mk('c-exec-pl',{type:'bar',data:{labels:['Ad Spend','Revenue','Weekly Profit'],
    datasets:[{data:[-m.spend,m.rev,m.profit],
      backgroundColor:['rgba(255,93,108,.75)','rgba(56,224,168,.8)',m.profit>=0?'rgba(90,169,255,.85)':'rgba(255,93,108,.85)'],
      borderRadius:10,borderSkipped:false}]},
    options:baropts(v=>fUSD(v))});
  $('exec-mos-cap').textContent='Break-even '+fN(m.beAcq,2)+' wins · target '+fN(m.acq,1)+' wins';
  const mos=m.acq-m.beAcq;
  mk('c-exec-mos',{type:'bar',data:{labels:['Break-Even','Your Wins','Margin'],
    datasets:[{data:[m.beAcq,m.acq,mos],backgroundColor:['rgba(255,181,71,.7)','rgba(90,169,255,.85)',mos>=0?'rgba(56,224,168,.8)':'rgba(255,93,108,.8)'],borderRadius:10,borderSkipped:false}]},
    options:baropts(v=>fN(v,1))});
  // profit swing
  const xs=[];for(let c=0.03;c<=0.10001;c+=0.005)xs.push(c);
  mk('c-exec-swing',{type:'line',data:{labels:xs.map(c=>(c*100).toFixed(1)+'%'),
    datasets:[{label:'Monthly Profit',data:xs.map(c=>model(m.spend,m.cpl,m.contact,c).profitMo),
      borderColor:CYAN,backgroundColor:ctx=>grad(ctx.chart.ctx,'rgba(0,208,255,.35)','rgba(0,208,255,0)'),
      fill:true,tension:.4,borderWidth:3,pointRadius:0,pointHoverRadius:5}]},
    options:lineopts(v=>fUSD(v),'Close rate (acq / contacted)')});
  const v=$('exec-verdict');
  if(m.acq>=m.beAcq){
    v.innerHTML=`At <b>${fUSD(m.spend)}/week</b> the plan generates <b>${fN(m.total,0)} leads</b> and, at a <b>${fPct(m.close)}</b> close on ${fN(m.contacted,1)} contacted, closes <b>${fN(m.acq,1)} wins</b> — clearing <b>${fUSD(m.profit)}/week</b> (${fUSD(m.profitMo)}/mo) at <b>${fN(m.roas,2)}× ROAS</b>, CAC ${fUSD(m.cac)} under the $1,200 price. Break-even is ${fN(m.beAcq,2)} wins; you sit <b>${fN(m.acq-m.beAcq,1)} wins</b> above it.`;
  } else {
    v.innerHTML=`At <b>${fUSD(m.spend)}/week</b> the plan generates ${fN(m.total,0)} leads but only <b>${fN(m.acq,1)} wins</b> at a ${fPct(m.close)} close — <b class="">below the ${fN(m.beAcq,2)}-win break-even</b>. The week loses <b>${fUSD(Math.abs(m.profit))}</b>. Lift close to <b>${fPct(m.beClose)}</b> or raise contact to turn it profitable.`;
  }
}

// ============ TAB: UNIT ============
function renderUnit(m){
  $('unit-kpis').innerHTML=kpi([
    ['CAC',fUSD(m.cac),'vs $1,200 price',m.cac<PRICE?'good':'bad'],
    ['CONTRIBUTION / WIN',fUSD(m.contribution),'price − CAC',m.contribution>=0?'good':'bad'],
    ['ROAS',fN(m.roas,2)+'×','revenue ÷ spend',m.roas>=1?'good':'bad'],
    ['WEEKLY PROFIT',fUSD(m.profit),fUSD(m.profitMo)+'/mo',m.profit>=0?'good':'bad'],
    ['BREAK-EVEN WINS',fN(m.beAcq,2),fPct(m.beClose)+' close',''],
  ]);
  const wins=[2,3,4,5,6,7,8];
  mk('c-unit-roas',{type:'line',data:{labels:wins,datasets:[{label:'ROAS',
    data:wins.map(w=>w*PRICE/m.spend),borderColor:BLUE,
    backgroundColor:ctx=>grad(ctx.chart.ctx,'rgba(90,169,255,.3)','rgba(90,169,255,0)'),fill:true,tension:.35,borderWidth:3,pointRadius:3,pointBackgroundColor:CYAN}]},
    options:lineopts(v=>v.toFixed(1)+'×','Weekly wins',[{y:1,label:'break-even 1.0×'}])});
  mk('c-unit-cac',{type:'line',data:{labels:wins,datasets:[{label:'CAC',
    data:wins.map(w=>m.spend/w),borderColor:CYAN,
    backgroundColor:ctx=>grad(ctx.chart.ctx,'rgba(0,208,255,.28)','rgba(0,208,255,0)'),fill:true,tension:.35,borderWidth:3,pointRadius:3,pointBackgroundColor:BLUE}]},
    options:lineopts(v=>fUSD(v),'Weekly wins',[{y:PRICE,label:'$1,200 price'}])});
  $('unit-verdict').innerHTML=`Because spend is fixed at <b>${fUSD(m.spend)}/week</b>, CAC and ROAS are a pure function of wins. Revenue overtakes spend at <b>${fN(m.beAcq,2)} wins</b>. Every win beyond that is <b>$1,200 of near-pure contribution</b> — the media cost is already sunk. At your ${fN(m.acq,1)} wins, CAC is <b>${fUSD(m.cac)}</b> and each client contributes <b>${fUSD(m.contribution)}</b>.`;
}

// ============ TAB: PATH ============
function renderPath(m){
  const reqClose=m.beAcq>0? (6/m.contacted):0; // close needed for 6 wins
  $('path-kpis').innerHTML=kpi([
    ['CONTACT RATE',fPct(m.contact,0),'of leads reached',''],
    ['CONTACTED / WK',fN(m.contacted,1),'of '+fN(m.total,0)+' leads','accent'],
    ['BREAK-EVEN CLOSE',fPct(m.beClose),fN(m.beAcq,2)+' wins',''],
    ['YOUR CLOSE',fPct(m.close),fN(m.acq,1)+' wins',m.acq>=m.beAcq?'good':'bad'],
    ['REVENUE / WK',fUSD(m.rev),fUSD(m.revMo)+'/mo',''],
  ]);
  const cs=[];for(let c=0.03;c<=0.10001;c+=0.01)cs.push(Math.round(c*1000)/1000);
  if(!cs.includes(Math.round(m.close*1000)/1000)){cs.push(Math.round(m.close*1000)/1000);cs.sort((a,b)=>a-b);}
  mk('c-path',{type:'bar',data:{labels:cs.map(c=>(c*100).toFixed(2)+'%'),
    datasets:[
      {label:'Wins / wk',data:cs.map(c=>m.contacted*c),backgroundColor:'rgba(90,169,255,.85)',borderRadius:8,yAxisID:'y'},
      {label:'Revenue / wk',type:'line',data:cs.map(c=>m.contacted*c*PRICE),borderColor:CYAN,borderWidth:3,tension:.35,pointRadius:0,yAxisID:'y1'}
    ]},options:{...baropts(v=>fN(v,1)),scales:{
      x:{grid:GRID},
      y:{position:'left',grid:GRID,ticks:{callback:v=>fN(v,0)}},
      y1:{position:'right',grid:{display:false},ticks:{callback:v=>fUSD(v)}}
    },plugins:{legend:{display:true,labels:{usePointStyle:true,boxWidth:8}}}}});
  const tb=$('path-table').querySelector('tbody');tb.innerHTML='';
  cs.forEach(c=>{const mm=model(m.spend,m.cpl,m.contact,c);
    const prof=mm.profit;let tag,txt;
    if(Math.abs(prof)<50){tag='blue';txt='break-even';}else if(prof>0){tag='good';txt='profit';}else{tag='bad';txt='loss';}
    const hot=Math.abs(c-m.close)<0.0001;
    tb.innerHTML+=`<tr class="${hot?'hot':''}"><td>${(c*100).toFixed(2)}%${hot?' ◂':''}</td><td>${fN(mm.acq,2)}</td><td>${fUSD(mm.rev)}</td><td>${prof>=0?'+':''}${fUSD(prof)}</td><td><span class="tag ${tag}">${txt}</span></td></tr>`;
  });
  $('path-verdict').innerHTML=`With contact fixed at <b>${fPct(m.contact,0)}</b>, the team reaches <b>${fN(m.contacted,1)} leads/week</b>. Each point of close rate is worth <b>${fN(m.contacted*0.01,2)} wins (${fUSD(m.contacted*0.01*PRICE)}/week)</b>. You need <b>${fPct(m.beClose)}</b> just to break even; you're currently modelling <b>${fPct(m.close)}</b>.`;
}

// ============ TAB: REP ============
function renderRep(m){
  const perWeekday=m.dials/5;
  $('rep-kpis').innerHTML=kpi([
    ['DIALS / WEEKDAY',fN(perWeekday,0),'to service lead flow',''],
    ['DIALS / WEEK',fN(m.dials,0),'across 3 reps','accent'],
    ['CALLS / LEAD',fN(m.callsPerLead,1),'dials per lead',''],
    ['DIALS / REP / DAY',fN(m.dialsPerRepDay,0),'at 3 reps',''],
    ['DIALS / ACQUISITION',fN(m.acq>0?m.dials/m.acq:0,0),'dials per win','accent'],
  ]);
  const teams=[3,4,5];
  mk('c-rep-cap',{type:'bar',data:{labels:teams.map(t=>t+' reps'),
    datasets:[{label:'Capacity (dials/weekday)',data:teams.map(t=>t*200),backgroundColor:'rgba(90,169,255,.8)',borderRadius:8}]},
    options:{...baropts(v=>fN(v,0)),plugins:{legend:{display:false},
      annotation:false}}});
  mk('c-rep-load',{type:'bar',data:{labels:teams.map(t=>t+' reps'),
    datasets:[{label:'Dials / rep / day',data:teams.map(t=>perWeekday/t),
      backgroundColor:['rgba(0,208,255,.85)','rgba(90,169,255,.8)','rgba(56,224,168,.8)'],borderRadius:8}]},
    options:{...baropts(v=>fN(v,0)),plugins:{legend:{display:false}}}});
  const days=[['Mon',5000],['Tue',5000],['Wed',5000],['Thu',5000],['Fri',5000],['Sat',2000],['Sun',2000]];
  // scale so weekday spend approximates chosen weekly spend
  const wdSpend=m.spend*0.86/5, weSpend=m.spend*0.14/2;
  const tb=$('rep-table').querySelector('tbody');tb.innerHTML='';
  const dayList=[['Mon',wdSpend,true],['Tue',wdSpend,true],['Wed',wdSpend,true],['Thu',wdSpend,true],['Fri',wdSpend,true],['Sat',weSpend,false],['Sun',weSpend,false]];
  dayList.forEach(([d,sp,wd])=>{
    const leads=sp/m.cpl;
    const contacted=leads*m.contact;
    const dials=wd?contacted*DIALS_PER_CONTACTED:0;
    tb.innerHTML+=`<tr><td>${d}</td><td>${fUSD(sp)}</td><td>${fN(leads,0)}</td><td>${fN(dials,0)}</td><td>${wd?fN(dials/REPS,0):'—'}</td><td>${wd?fN(dials/leads,1):'—'}</td></tr>`;
  });
  $('rep-verdict').innerHTML=`At <b>${fPct(m.contact,0)}</b> contact the plan needs <b>${fN(perWeekday,0)} dials every weekday</b> — <b>${fN(m.callsPerLead,1)} calls per lead</b>, or <b>${fN(m.dialsPerRepDay,0)} dials per rep per day</b> across the 3-rep team. That's the calling engine behind every downstream win; the higher the contact target, the harder the dial rate the reps must sustain.`;
}

// ============ TAB: FUNNEL ============
function renderFunnel(m){
  const trapped=m.never*m.close*PRICE;
  $('funnel-kpis').innerHTML=kpi([
    ['LEADS / WK',fN(m.total,0),'top of funnel',''],
    ['CONTACTED',fN(m.contacted,1),fPct(m.contact,0)+' of leads','accent'],
    ['NEVER CONTACTED',fN(m.never,0),'largest leak','warn'],
    ['WINS',fN(m.acq,1),fPct(m.close)+' of contacted',m.acq>=m.beAcq?'good':'bad'],
    ['TRAPPED VALUE',fUSD(trapped),'/wk uncontacted','warn'],
  ]);
  mk('c-funnel',{type:'bar',data:{labels:['Leads','Contacted','Wins'],
    datasets:[{data:[m.total,m.contacted,m.acq],
      backgroundColor:['rgba(90,169,255,.85)','rgba(0,208,255,.85)','rgba(56,224,168,.85)'],borderRadius:10}]},
    options:{...baropts(v=>fN(v,0)),indexAxis:'y',scales:{x:{type:'logarithmic',grid:GRID},y:{grid:{display:false}}}}});
  const levers=[
    ['CPL −$2',model(m.spend,Math.max(1,m.cpl-2),m.contact,m.close).acq-m.acq],
    ['Close +1pt',model(m.spend,m.cpl,m.contact,m.close+0.01).acq-m.acq],
    ['Contact +5pts',model(m.spend,m.cpl,m.contact+0.05,m.close).acq-m.acq],
    ['Budget +20%',model(m.spend*1.2,m.cpl,m.contact,m.close).acq-m.acq],
  ];
  mk('c-funnel-lever',{type:'bar',data:{labels:levers.map(l=>l[0]),
    datasets:[{label:'Added wins/wk',data:levers.map(l=>l[1]),backgroundColor:'rgba(0,208,255,.8)',borderRadius:8}]},
    options:{...baropts(v=>'+'+fN(v,2)),plugins:{legend:{display:false}}}});
  $('funnel-verdict').innerHTML=`The funnel collapses from <b>${fN(m.total,0)} leads</b> to <b>${fN(m.acq,1)} wins</b>. The biggest leak is <b>${fN(m.never,0)} leads/week never contacted</b> — roughly <b>${fUSD(trapped)}/week</b> of value left on the table. Lifting contact from ${fPct(m.contact,0)} is the fastest way to add wins without spending another dollar.`;
}

// ============ TAB: MIX ============
function renderMix(m){
  const bioShare=m.bio/m.total;
  const paidCPL=m.spend/m.paid;      // effective cost of a paid lead (all spend buys the paid portion)
  const bioValue=m.bio*paidCPL;      // value of free bio leads at the paid rate
  $('mix-kpis').innerHTML=kpi([
    ['TOTAL LEADS / WK',fN(m.total,0),'paid + bio',''],
    ['BIO LEADS',fN(m.bio,0),(bioShare*100).toFixed(0)+'% · $0 CPL','good'],
    ['PAID LEADS',fN(m.paid,0),fUSD1(paidCPL)+' effective CPL',''],
    ['BIO VALUE / WK',fUSD(bioValue),'free demand','accent'],
    ['BLENDED CPL',fUSD1(m.blendedCPL),'vs '+fUSD1(paidCPL)+' paid','good'],
  ]);
  mk('c-mix-split',{type:'doughnut',data:{labels:['Paid ('+fUSD1(paidCPL)+' CPL)','Bio (free)'],
    datasets:[{data:[m.paid,m.bio],backgroundColor:['rgba(90,169,255,.85)','rgba(0,208,255,.85)'],borderColor:'rgba(5,10,24,.6)',borderWidth:3,hoverOffset:8}]},
    options:{responsive:true,maintainAspectRatio:false,cutout:'62%',plugins:{legend:{position:'bottom',labels:{usePointStyle:true,boxWidth:8,padding:16}}}}});
  const shares=[0.30,0.35,0.40,0.45,0.50];
  mk('c-mix-cpl',{type:'line',data:{labels:shares.map(s=>(s*100)+'%'),
    datasets:[{label:'Blended CPL',data:shares.map(s=>{const totalAtShare=m.paid/(1-s);return m.spend/totalAtShare;}),
      borderColor:CYAN,backgroundColor:ctx=>grad(ctx.chart.ctx,'rgba(0,208,255,.3)','rgba(0,208,255,0)'),fill:true,tension:.35,borderWidth:3,pointRadius:3,pointBackgroundColor:BLUE}]},
    options:lineopts(v=>fUSD1(v),'Bio share of total',[{y:paidCPL,label:fUSD1(paidCPL)+' paid CPL'}])});
  $('mix-verdict').innerHTML=`The organic bio link supplies <b>${fN(m.bio,0)} leads/week (${(bioShare*100).toFixed(0)}%)</b> at $0 CPL — equivalent to <b>${fUSD(bioValue)}</b> of paid demand for free. It pulls the blended cost to <b>${fUSD1(m.blendedCPL)}</b> vs the ${fUSD1(paidCPL)} paid rate. Growing bio share is the cheapest lever to improve the economics.`;
}

// ============ TAB: RISK ============
function renderRisk(m){
  $('risk-kpis').innerHTML=kpi([
    ['OPERATING POINT',fPct(m.contact,0)+' × '+fPct(m.close),'contact × close','accent'],
    ['BREAK-EVEN',fN(m.beAcq,2)+' wins','below = loss',''],
    ['DOWNSIDE',fN(model(m.spend,m.cpl,Math.max(.1,m.contact-.05),Math.max(.01,m.close-.02)).acq,2)+' wins','−5pt / −2pt','bad'],
    ['UPSIDE',fN(model(m.spend,m.cpl,m.contact+.05,m.close+.02).acq,2)+' wins','+5pt / +2pt','good'],
  ]);
  const contacts=[0.15,0.20,0.25,0.30,0.35,0.40,0.45];
  const closes=[0.02,0.03,0.04,0.05,0.06,0.08,0.10];
  let h='<thead><tr><th>Contact \\ Close</th>'+closes.map(c=>'<th>'+(c*100).toFixed(0)+'%</th>').join('')+'</tr></thead><tbody>';
  contacts.forEach(ct=>{
    h+='<tr><td><b>'+(ct*100).toFixed(0)+'%</b></td>';
    closes.forEach(cl=>{const wins=m.total*ct*cl;const ok=wins>=m.beAcq;
      const near=Math.abs(ct-m.contact)<0.03&&Math.abs(cl-m.close)<0.006;
      h+=`<td style="background:${ok?'rgba(56,224,168,.14)':'rgba(255,93,108,.10)'};color:${ok?'#38e0a8':'#ff8a94'};font-weight:${near?'800':'500'};${near?'outline:1.5px solid #00d0ff;':''}">${fN(wins,1)}</td>`;
    });h+='</tr>';
  });
  h+='</tbody>';$('risk-table').innerHTML=h;
  $('risk-verdict').innerHTML=`The plan sits at <b>${fPct(m.contact,0)} contact × ${fPct(m.close)} close = ${fN(m.acq,1)} wins</b>. Break-even is ${fN(m.beAcq,2)} wins. ${m.acq>=m.beAcq?`You have a <b>${fN(m.acq-m.beAcq,1)}-win cushion</b>.`:`You're <b>${fN(m.beAcq-m.acq,1)} wins short</b> of break-even.`} Green cells clear break-even at ${fUSD(m.spend)} spend; the safest structural move is lifting contact rate.`;
}

// ============ TAB: PILOT PATH ============
let pilotBuilt=false;
function renderJulyWeeks(){
  const weekDates=['Jul 3–9','Jul 10–16','Jul 17–23','Jul 24–31'];
  const jul=PILOT.rows.slice(0,4);
  const el=document.getElementById('july-weeks');if(!el)return;
  el.innerHTML=jul.map((r,i)=>{
    const paidCPL=r.spend/r.paid;
    const check=`Convert <b>${(r.close*100).toFixed(2)}%</b> of ${fN(r.contacted,0)} contacted → <b>${fN(r.acq,1)} wins</b>`;
    return `<div class="wk-card">
      <div class="wk-top">
        <div class="wk-badge">
          <div class="wk-num">W${r.wk}</div>
          <div class="wl">Week ${r.wk}<b>${weekDates[i]}</b></div>
        </div>
        <div class="wk-acq"><div class="a">${fN(r.acq,1)}</div><div class="al">acq</div></div>
      </div>
      <div class="wk-rows">
        <div class="wk-row"><span class="k">Spend</span><span class="v hi">${fUSD(r.spend)}</span></div>
        <div class="wk-row"><span class="k">Leads (paid + bio)</span><span class="v">${fN(r.leads,0)} <span style="color:var(--muted);font-weight:400">(${fN(r.paid,0)}+${fN(r.bio,0)})</span></span></div>
        <div class="wk-row"><span class="k">Contact rate</span><span class="v">${(r.contact*100).toFixed(0)}%</span></div>
        <div class="wk-row"><span class="k">Contacted / wk</span><span class="v">${fN(r.contacted,1)}</span></div>
        <div class="wk-row"><span class="k">Close rate</span><span class="v">${(r.close*100).toFixed(2)}%</span></div>
        <div class="wk-row"><span class="k">Revenue</span><span class="v hi">${fUSD(r.rev)}</span></div>
        <div class="wk-row"><span class="k">Dials / week</span><span class="v">${fN(r.dials,0)}</span></div>
        <div class="wk-row"><span class="k">Calls / lead</span><span class="v">${fN(r.cpl,1)}</span></div>
        <div class="wk-row"><span class="k">Dials / rep / day</span><span class="v">${fN(r.drd,0)}</span></div>
      </div>
      <div class="wk-check"><span class="ci"></span><span>${check}</span></div>
      <div class="wk-cum"><span class="cn">${fN(r.cum,1)}</span><span class="ct">cumulative acq · target 60 by Sep 1</span></div>
    </div>`;
  }).join('');
}

function renderPilot(){
  renderJulyWeeks();
  // weekly table
  const tb=document.querySelector('#pilot-weekly tbody');tb.innerHTML='';
  PILOT.rows.forEach(r=>{
    const hot=r.wk>=6;
    tb.innerHTML+=`<tr class="${hot?'hot':''}">
      <td><b>${r.wk}</b>${r.wk===4?' <span class="tag blue">Jul</span>':''}${r.wk===9?' <span class="tag blue">Sep 1</span>':''}</td>
      <td>${fUSD(r.spend)}</td><td>${fN(r.leads,0)}</td>
      <td>${(r.contact*100).toFixed(0)}%</td><td>${fN(r.contacted,1)}</td>
      <td>${(r.close*100).toFixed(2)}%</td><td>${fN(r.acq,2)}</td>
      <td><b>${fN(r.cum,1)}</b></td><td>${fUSD(r.rev)}</td>
      <td>${fN(r.cpl,1)}</td><td>${fN(r.drd,0)}</td></tr>`;
  });
  // month table
  const mt=document.querySelector('#pilot-month tbody');
  mt.innerHTML=`
    <tr><td><b>To Date</b> (Jun)</td><td>${fUSD(PILOT.spentToDate)}</td><td>${fN(PILOT.leadsToDate,0)}</td><td>${PILOT.acqToDate}</td><td>${PILOT.acqToDate}</td><td>${fUSD(PILOT.acqToDate*PRICE)}</td><td>—</td></tr>
    <tr><td><b>July</b> (wk 1–4)</td><td>${fUSD(PILOT.jul.spend)}</td><td>${fN(PILOT.jul.leads,0)}</td><td>+${fN(PILOT.jul.acq,1)}</td><td>${fN(PILOT.jul.cum,1)}</td><td>${fUSD(PILOT.jul.rev)}</td><td>${fPct(PILOT.jul.avgclose)}</td></tr>
    <tr class="hot"><td><b>August</b> (wk 5–9)</td><td>${fUSD(PILOT.aug.spend)}</td><td>${fN(PILOT.aug.leads,0)}</td><td>+${fN(PILOT.aug.acq,1)}</td><td><b>${fN(PILOT.aug.cum,0)}</b></td><td>${fUSD(PILOT.aug.rev)}</td><td>${fPct(PILOT.aug.avgclose)}</td></tr>`;
  $('pilot-flag').innerHTML=`✓ Lands exactly on 60 acq · $82,773 total pilot spend`;
  $('pilot-verdict').innerHTML=`Six acquisitions in month one is not the run-rate — it's the cold-start. The plan front-loads <b>contact rate (28% → 46%)</b> while close rate compounds, so momentum builds: July adds <b>~${fN(PILOT.jul.acq,0)} wins</b> (cum ${fN(PILOT.jul.cum,0)}), then August's higher-conversion weeks deliver <b>~${fN(PILOT.aug.acq,0)} more</b> to land exactly on <b>60</b>. Reps hold at 3 but dial harder — from <b>~8.7 to ~14.3 calls per lead</b> — as contact climbs. The final four weeks carry the target: they must convert at <b>3.8% → 6.0%</b> of contacted, roughly triple the early-pilot rate. That's the number to defend. Total spend runs <b>$82,773</b>, ~$5.8k over the original $77k envelope — the agreed trade to hit 60 exactly.`;

  if(pilotBuilt)return;pilotBuilt=true;
  const R=PILOT.rows;
  // cumulative chart: actual point + forward
  mk('c-pilot-cum',{type:'line',data:{
    labels:['Now',...R.map(r=>'W'+r.wk)],
    datasets:[
      {label:'Cumulative Acq',data:[PILOT.acqToDate,...R.map(r=>r.cum)],
        borderColor:CYAN,borderWidth:4,tension:.35,pointRadius:5,pointBackgroundColor:'#fff',pointBorderColor:CYAN,pointBorderWidth:2,
        backgroundColor:ctx=>grad(ctx.chart.ctx,'rgba(0,208,255,.35)','rgba(0,208,255,0)'),fill:true},
      {label:'Target (60)',data:new Array(R.length+1).fill(60),borderColor:'rgba(56,224,168,.9)',borderDash:[6,6],borderWidth:2,pointRadius:0,fill:false}
    ]},options:{...lineopts(v=>fN(v,0),''),plugins:{legend:{display:true,labels:{usePointStyle:true,boxWidth:8}}}}});
  // ramp chart dual axis
  mk('c-pilot-ramp',{type:'line',data:{labels:R.map(r=>'W'+r.wk),datasets:[
    {label:'Contact %',data:R.map(r=>r.contact*100),borderColor:BLUE,borderWidth:3,tension:.35,pointRadius:3,pointBackgroundColor:BLUE,yAxisID:'y'},
    {label:'Close %',data:R.map(r=>r.close*100),borderColor:CYAN,borderWidth:3,tension:.35,pointRadius:3,pointBackgroundColor:CYAN,yAxisID:'y1',
      backgroundColor:ctx=>grad(ctx.chart.ctx,'rgba(0,208,255,.25)','rgba(0,208,255,0)'),fill:true}
  ]},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},
    scales:{x:{grid:GRID},
      y:{position:'left',grid:GRID,ticks:{callback:v=>v+'%'},title:{display:true,text:'Contact',color:BLUE}},
      y1:{position:'right',grid:{display:false},ticks:{callback:v=>v+'%'},title:{display:true,text:'Close',color:CYAN}}},
    plugins:{legend:{display:false}}}});
  // month bar
  mk('c-pilot-month',{type:'bar',data:{labels:['July (wk1–4)','August (wk5–9)'],datasets:[
    {label:'Acquisitions',data:[PILOT.jul.acq,PILOT.aug.acq],backgroundColor:['rgba(90,169,255,.85)','rgba(0,208,255,.9)'],borderRadius:10,yAxisID:'y'},
    {label:'Spend',type:'line',data:[PILOT.jul.spend,PILOT.aug.spend],borderColor:GOOD,borderWidth:3,pointRadius:4,pointBackgroundColor:GOOD,yAxisID:'y1'}
  ]},options:{responsive:true,maintainAspectRatio:false,scales:{
    x:{grid:GRID},
    y:{position:'left',grid:GRID,ticks:{callback:v=>fN(v,0)+' acq'}},
    y1:{position:'right',grid:{display:false},ticks:{callback:v=>fUSD(v)}}},
    plugins:{legend:{display:true,labels:{usePointStyle:true,boxWidth:8}}}}});
}

// ============ shared chart option builders ============
function baropts(fmt){return{responsive:true,maintainAspectRatio:false,
  plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>fmt(c.parsed.y!=null?c.parsed.y:c.parsed.x)}}},
  scales:{x:{grid:GRID},y:{grid:GRID,ticks:{callback:fmt}}}};}
function lineopts(fmt,xlabel,lines){return{responsive:true,maintainAspectRatio:false,
  interaction:{mode:'index',intersect:false},
  plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>fmt(c.parsed.y)}}},
  scales:{x:{grid:GRID,title:xlabel?{display:true,text:xlabel,color:'#6d82a8'}:undefined},
    y:{grid:GRID,ticks:{callback:fmt}}}};}

// ============ kpi builder ============
function kpi(list){return list.map(([lab,num,sub,cls])=>
  `<div class="kpi ${cls||''}"><div class="lab">${lab}</div><div class="num">${num}</div><div class="sub">${sub}</div></div>`).join('');}

// ============ recalc all live tabs ============
function recalc(){
  const m=model(S.spend,S.cpl,S.contact,S.close);
  renderExec(m);renderUnit(m);renderPath(m);renderRep(m);renderFunnel(m);renderMix(m);renderRisk(m);
}

// ============ inputs ============
function bindInputs(){
  const upd=()=>{
    S.spend=+$('s-spend').value;S.cpl=+$('s-cpl').value;
    S.contact=+$('s-contact').value/100;S.close=+$('s-close').value/100;
    $('v-spend').textContent=fUSD(S.spend);
    $('v-cpl').textContent=fUSD(S.cpl);
    $('v-contact').textContent=(S.contact*100).toFixed(0)+'%';
    $('v-close').textContent=(S.close*100).toFixed(2)+'%';
    recalc();
  };
  ['s-spend','s-cpl','s-contact','s-close'].forEach(id=>$(id).addEventListener('input',upd));
  $('reset').addEventListener('click',()=>{
    $('s-spend').value=5800;$('s-cpl').value=15;$('s-contact').value=25;$('s-close').value=6.21;upd();
  });
  upd();
}

// ============ tab switching ============
function bindTabs(){
  document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>{
    document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    const id=t.dataset.t;$('p-'+id).classList.add('active');
    if(id==='pilot')renderPilot();
    // reflow charts
    setTimeout(()=>{Object.values(charts).forEach(c=>c&&c.resize());},60);
  }));
}

// ============ init ============
renderPilot();
bindInputs();
bindTabs();
