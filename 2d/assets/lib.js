const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const f=(n,d=2)=>n.toLocaleString('vi-VN',{maximumFractionDigits:d}),cl=(v,a,b)=>Math.max(a,Math.min(b,v));
const hx=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)),mix=(a,b,t)=>{const x=hx(a),y=hx(b);return'#'+x.map((v,i)=>Math.round(v+(y[i]-v)*cl(t,0,1)).toString(16).padStart(2,'0')).join('')};
let cur=0;
function tabs(cb){$$('.tab').forEach((b,i)=>b.onclick=()=>{cur=i;$$('.tab').forEach((x,j)=>x.classList.toggle('on',i==j));$$('.pn').forEach((p,j)=>p.hidden=i!=j);cb&&cb(i)})}
function loop(fn){let l=0;(function t(ts){const dt=Math.min(.05,(ts-l)/1000||0);l=ts;fn(dt);requestAnimationFrame(t)})(0)}
function quiz(id,Q){const H=$('#'+id);H.innerHTML=Q.map((q,i)=>`<div class="q" id="${id}q${i}"><b>Câu ${i+1}.</b> ${q.q}<div style="margin-top:6px">${q.o?q.o.map((o,j)=>`<label><input type="radio" name="${id}r${i}" value="${j}"> ${o}</label>`).join(''):`<input type="text" id="${id}n${i}" inputmode="decimal" placeholder="đáp số">`}</div><div class="row"><button class="btn g" data-i="${i}">Kiểm tra</button><span id="${id}s${i}"></span></div></div>`).join('');
 H.querySelectorAll('button').forEach(b=>b.onclick=()=>{const i=+b.dataset.i,q=Q[i];let ok=0,has=1;
  if(q.o){const c=document.querySelector(`input[name=${id}r${i}]:checked`);has=!!c;ok=c&&+c.value==q.a}else{const s=$('#'+id+'n'+i).value.replace(/\s/g,'').replace(',','.');has=s!=='';ok=has&&Math.abs(parseFloat(s)-q.n)<=Math.max(Math.abs(q.n)*.015,.011)}
  if(!has){$('#'+id+'s'+i).innerHTML='<span class="sm">Hãy chọn hoặc nhập đáp án.</span>';return}
  $('#'+id+'q'+i).className='q '+(ok?'good':'bad');$('#'+id+'s'+i).innerHTML=`<span class="${ok?'ok':'er'}">${ok?'Chính xác!':'Chưa đúng.'}</span> <span class="sm">${q.e||''}</span>`})}
/* ống nghiệm */
let _tid=0;
function Tube(host,label){const id='t'+(++_tid);host.innerHTML=`<svg viewBox="0 0 140 290"><defs><clipPath id="${id}c"><path d="M40 40V215A30 30 0 0 0 100 215V40Z"/></clipPath></defs>
<g class="fl" style="display:none"><path d="M70 262c-16-10-16-26-6-36c0 8 6 10 6 4c0-10 6-14 8-22c8 12 18 24 8 40c-4 8-12 12-16 14z" fill="#ffa94d"/><path d="M70 262c-8-5-8-13-3-18c0 4 3 5 3 2c0-5 3-7 4-11c4 6 9 12 4 20c-2 4-6 6-8 7z" fill="#ffe066"/></g>
<g clip-path="url(#${id}c)"><rect class="lq" x="30" y="245" width="80" height="0" fill="#cfe8f3" fill-opacity=".7"/><rect class="pc" x="30" y="245" width="80" height="0" fill="#fff" opacity="0"/><rect class="pb" x="30" y="245" width="80" height="0" fill="#fff"/><g class="sd"></g><g class="bb" visibility="hidden"><circle cx="52" cy="230" r="3"/><circle cx="66" cy="222" r="2.5" style="animation-delay:.4s"/><circle cx="78" cy="232" r="3.5" style="animation-delay:.9s"/><circle cx="90" cy="225" r="2.5" style="animation-delay:.2s"/><circle cx="60" cy="238" r="2" style="animation-delay:1.2s"/><circle cx="84" cy="236" r="2.5" style="animation-delay:.7s"/></g></g>
<g class="gs" visibility="hidden"><circle cx="62" cy="28" r="7" fill="#ccc"/><circle cx="78" cy="22" r="8" fill="#ccc" style="animation-delay:.6s"/><circle cx="70" cy="30" r="6" fill="#ccc" style="animation-delay:1.2s"/></g>
<path d="M40 40V215A30 30 0 0 0 100 215V40" fill="none" stroke="var(--st)" stroke-width="3"/><path d="M34 40H106" stroke="var(--st)" stroke-width="4" stroke-linecap="round"/><path d="M50 60V205" stroke="#fff" stroke-opacity=".4" stroke-width="4" stroke-linecap="round"/><text x="70" y="283" text-anchor="middle" style="fill:var(--ink);font:600 12px sans-serif">${label||''}</text></svg>`;
 const q=s=>host.querySelector(s),lq=q('.lq'),pc=q('.pc'),pb=q('.pb'),sd=q('.sd'),bb=q('.bb'),gs=q('.gs'),fl=q('.fl'),gc=gs.querySelectorAll('circle');
 return{set(s){const L=cl(s.level||0,0,1),h=L*165,y=245-h;lq.setAttribute('y',y);lq.setAttribute('height',h+5);lq.setAttribute('fill',s.color||'#cfe8f3');lq.setAttribute('fill-opacity',s.op??.7);
  const p=s.ppt;pc.setAttribute('y',y);pc.setAttribute('height',h+5);pc.setAttribute('fill',p?p.c:'#fff');pc.style.opacity=p?p.amt*(s.settle===false?.85:.35):0;
  const ph=p?p.amt*34:0;pb.setAttribute('y',245-ph);pb.setAttribute('height',ph+5);pb.setAttribute('fill',p?p.c:'#fff');
  const so=s.solid;sd.innerHTML=so&&so.amt>.02?solid(so):'';bb.setAttribute('visibility',s.bub&&L>0?'visible':'hidden');bb.style.opacity=cl(.4+(s.bub||0),0,1);
  gs.setAttribute('visibility',s.gas?'visible':'hidden');if(s.gas)gc.forEach(c=>c.setAttribute('fill',s.gas));fl.style.display=s.heat?'block':'none'}}}
function solid(o){const a=cl(o.amt,0,1),c=o.c;if(o.kind=='powder')return[...Array(9)].map((_,i)=>`<circle cx="${46+i*6.5}" cy="${236+(i%3)*2}" r="${3.3*a+.6}" fill="${c}"/>`).join('');
 if(o.kind=='wire')return`<path d="M52 238q8 -14 16 0t16 0" stroke="${c}" stroke-width="${2+3*a}" fill="none" stroke-linecap="round"/>`;
 if(o.kind=='sheet')return`<rect x="58" y="${120}" width="${8*a+3}" height="120" fill="${c}" stroke="#555" stroke-width="1"/>`;
 return`<path d="M50 ${242}l11 -${9*a+3}l16 2l9 ${7*a+2}z" fill="${c}" stroke="#555" stroke-width="1.5" transform="scale(1)"/>`}
/* phòng thí nghiệm: R=[{id,n,c,k:'liq'|'sol'|'drop'}] ; react(items,heat,age,tube) trả về state + notes */
function Lab(host,o){const H=typeof host=='string'?$(host):host,N=o.tubes||2,R=o.reagents,T=[],st={sel:0};
 H.classList.add('lab');H.innerHTML=`<div class="tubes">${[...Array(N)].map((_,i)=>`<div class="tw${i?'':' on'}" data-i="${i}"><div class="th"></div></div>`).join('')}</div><div class="row" style="justify-content:center">${o.heat?'<button class="btn g hb">Đun nóng: tắt</button>':''}<button class="btn g cb">Rửa ống nghiệm</button></div><div class="shelf">${R.map(r=>`<button class="rg ${r.k=='sol'?'s':r.k=='drop'?'d':''}" data-id="${r.id}"><i style="background:${r.c}"></i><span>${r.n}</span></button>`).join('')}</div><div class="obs"></div>`;
 for(let i=0;i<N;i++)T.push({v:Tube(H.querySelectorAll('.th')[i],(o.labels||[])[i]||'Ống '+(i+1)),items:[],heat:0,age:0});
 const vol=o.vol||5,cap=o.cap||20,rd=id=>R.find(r=>r.id==id);
 const lv=items=>items.reduce((s,x)=>s+(rd(x.id).k=='liq'?x.amt:0),0);
 H.querySelectorAll('.tw').forEach(w=>w.onclick=()=>{st.sel=+w.dataset.i;H.querySelectorAll('.tw').forEach((x,j)=>x.classList.toggle('on',j==st.sel))});
 H.querySelectorAll('.rg').forEach(b=>b.onclick=()=>{const r=rd(b.dataset.id),t=T[st.sel];b.classList.add('pour');setTimeout(()=>b.classList.remove('pour'),600);
  let it=t.items.find(x=>x.id==r.id);if(r.k=='liq'){if(lv(t.items)+vol>cap)return;if(it)it.amt+=vol;else t.items.push({id:r.id,amt:vol})}else{if(it)it.amt=Math.min(it.amt+1,r.max||3);else t.items.push({id:r.id,amt:1})}t.age=0;draw()});
 H.querySelector('.cb').onclick=()=>{T[st.sel].items=[];T[st.sel].heat=0;T[st.sel].age=0;if(o.heat)H.querySelector('.hb').textContent='Đun nóng: tắt';draw()};
 if(o.heat)H.querySelector('.hb').onclick=function(){const t=T[st.sel];t.heat^=1;t.age=0;this.textContent='Đun nóng: '+(t.heat?'bật':'tắt');draw()};
 function draw(){T.forEach((t,i)=>{const s=o.react(t.items,t.heat,t.age,R)||{};s.level=s.level??lv(t.items)/cap;s.heat=t.heat;t.v.set(s);t.s=s});
  const s=T[st.sel].s||{},n=s.notes||[];H.querySelector('.obs').innerHTML=`<b>Ống ${st.sel+1}</b><br>${T[st.sel].items.length?(n.length?n.join('<br>'):'Chưa quan sát thấy hiện tượng.'):'Ống nghiệm trống: bấm vào hoá chất để rót hoặc cho vào ống.'}${s.eq?`<div class="eq">${s.eq.join('<br>')}</div>`:''}`}
 draw();return{tick(dt){let ch=0;T.forEach(t=>{if(t.items.length&&t.age<30){t.age+=dt;ch=1}});if(ch)draw()},draw,T}}
