/* ---------- Demo data ---------- */
const $=s=>document.querySelector(s);
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt=n=>'₹'+n.toLocaleString('en-IN');
const md=d=>String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const off=n=>{const d=new Date();d.setDate(d.getDate()+n);return md(d)};
const nice=s=>{if(!s)return '-';const[m,d]=s.split('-');return d+' '+['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m-1]};

/* demo:true = the customer whose phone is shown on screen */
const customers=[
 {name:'Aarav',phone:'+91 98765 00001',bday:off(0),anniv:'',tag:'VIP',optin:true,demo:true},
 {name:'Priya',phone:'+91 98765 00002',bday:off(3),anniv:off(0),tag:'VIP',optin:true},
 {name:'Rohan',phone:'+91 98765 00003',bday:off(10),anniv:'',tag:'New',optin:true},
 {name:'Sneha',phone:'+91 98765 00004',bday:off(-20),anniv:off(25),tag:'Regular',optin:true},
 {name:'Vikram',phone:'+91 98765 00005',bday:off(40),anniv:'',tag:'Regular',optin:true},
 {name:'Anita',phone:'+91 98765 00006',bday:off(7),anniv:'',tag:'New',optin:false}
];
const products=[
 {name:'Wireless Earbuds',price:2499},{name:'Smartwatch Active',price:3999},
 {name:'Power Bank 10000mAh',price:1599},{name:'Laptop Stand',price:1799}
];
let rules=[
 {k:'hi, hello, hey',t:'Hi! Welcome to ShopEase 👋 Ask about price, order status, hours or returns.'},
 {k:'price, cost, offer',t:'Our earbuds start at ₹2,499 and smartwatches at ₹3,999. Use code WELCOME10 for 10% off.'},
 {k:'order, track, shipping',t:'Please share your order ID (for example #1001) and we will check the status.'},
 {k:'hours, open, time',t:'We are open 10am to 7pm, Monday to Saturday.'},
 {k:'return, refund, exchange',t:'You can return any item within 7 days. Reply "agent" to talk to our team.'}
];
const FALLBACK='Thanks for messaging ShopEase. Our team will reply soon. Type "hi" to see what I can help with.';
const demoC=customers.find(c=>c.demo);
const fill=(t,c)=>t.replace(/\{name\}/g,c.name);

/* ---------- Message delivery ---------- */
const logs=[];
/* Single place that sends a message. For real WhatsApp, replace the body with a call to the
   WhatsApp Business Cloud API (do this from a server, never from browser code):
   POST https://graph.facebook.com/v20.0/<PHONE_NUMBER_ID>/messages
   { messaging_product:'whatsapp', to:c.phone, type:'text', text:{body:text} }
   Business-initiated messages (confirmations, broadcasts, reminders) must use approved templates. */
function deliver(c,text,type){
  logs.unshift({time:new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'}),to:c.name,type,text});
  renderLog();
  if(c.demo) botSay(text);
}

/* ---------- Phone chat ---------- */
const chat=$('#chat');
function bubble(text,out){
  const d=document.createElement('div');
  d.className='b'+(out?' out':'');
  const t=new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
  d.innerHTML=esc(text)+`<small>${t}${out?' ✓✓':''}</small>`;
  chat.appendChild(d); chat.scrollTop=chat.scrollHeight;
}
function botSay(text,delay=500){
  $('#status').textContent='typing…';
  setTimeout(()=>{bubble(text,false);$('#status').textContent='online'},delay);
}
function customerSends(text){
  bubble(text,true);
  if(!$('#arOn').checked){logs.unshift({time:new Date().toLocaleTimeString(),to:demoC.name,type:'inbound',text:text+' (auto-reply off)'});renderLog();return}
  const low=text.toLowerCase();
  const hit=rules.find(r=>r.k.split(',').some(k=>k.trim()&&low.includes(k.trim())));
  deliver(demoC,hit?hit.t:FALLBACK,'auto-reply');
}
$('#msgForm').addEventListener('submit',e=>{
  e.preventDefault(); const v=$('#msgIn').value.trim(); if(!v)return;
  $('#msgIn').value=''; customerSends(v);
});
$('#chips').innerHTML=['Hi','What is the price?','Where is my order?','Return policy','Random question'].map(t=>`<button type="button">${t}</button>`).join('');
$('#chips').addEventListener('click',e=>{if(e.target.matches('button'))customerSends(e.target.textContent)});

/* ---------- Tabs ---------- */
document.querySelector('.tabs').addEventListener('click',e=>{
  const b=e.target.closest('[data-tab]'); if(!b)return;
  document.querySelectorAll('.tabs button').forEach(x=>x.setAttribute('aria-selected',x===b));
  document.querySelectorAll('.tp').forEach(p=>p.hidden=p.id!=='tab-'+b.dataset.tab);
});

/* ---------- 1. Auto-reply rules ---------- */
function renderRules(){
  $('#rules').innerHTML=rules.map((r,i)=>`<div class="item"><div><b>${esc(r.k)}</b><small>${esc(r.t)}</small></div><button class="btn alt sm" data-del="${i}">Delete</button></div>`).join('')||'<p class="empty">No rules yet.</p>';
}
$('#rules').addEventListener('click',e=>{const d=e.target.closest('[data-del]');if(d){rules.splice(+d.dataset.del,1);renderRules()}});
$('#rAdd').onclick=()=>{
  const k=$('#rKey').value.trim(),t=$('#rTxt').value.trim(); if(!k||!t)return;
  rules.push({k:k.toLowerCase(),t}); $('#rKey').value=$('#rTxt').value=''; renderRules();
};

/* ---------- 2. Orders and shipping updates ---------- */
const orders=[]; const STEPS=['Confirmed','Shipped','Out for delivery','Delivered'];
$('#oCust').innerHTML=customers.map((c,i)=>`<option value="${i}">${c.name}</option>`).join('');
$('#oItem').innerHTML=products.map((p,i)=>`<option value="${i}">${p.name} (${fmt(p.price)})</option>`).join('');
$('#oAdd').onclick=()=>{
  const c=customers[+$('#oCust').value],p=products[+$('#oItem').value];
  const o={id:'#'+(1001+orders.length),c,p,step:0}; orders.unshift(o);
  deliver(c,`Hi ${c.name}, your order ${o.id} for ${p.name} (${fmt(p.price)}) is confirmed. We will message you when it ships. 🎉`,'order');
  renderOrders();
};
function renderOrders(){
  $('#orders').innerHTML=orders.map((o,i)=>`<div class="item"><div><b>${o.id}</b> ${esc(o.p.name)}<small>${esc(o.c.name)} · <span class="pill ${o.step===3?'g':'y'}">${STEPS[o.step]}</span></small></div>
  ${o.step<3?`<button class="btn sm" data-next="${i}">Send "${STEPS[o.step+1]}" update</button>`:''}</div>`).join('')||'<p class="empty">No orders yet.</p>';
}
$('#orders').addEventListener('click',e=>{
  const b=e.target.closest('[data-next]'); if(!b)return;
  const o=orders[+b.dataset.next]; o.step++;
  const msg=[null,
   `Good news ${o.c.name}! Order ${o.id} has shipped. Track it here: https://track.example.com/SE${o.id.slice(1)}. Expected in 3 days.`,
   `Your order ${o.id} is out for delivery today. Please keep your phone handy.`,
   `Order ${o.id} was delivered. Thank you for shopping with us! Reply "review" to share feedback.`][o.step];
  deliver(o.c,msg,'shipping'); renderOrders();
});

/* ---------- 3. Broadcast ---------- */
const recips=()=>customers.filter(c=>$('#bSeg').value==='All'||c.tag===$('#bSeg').value);
function renderBcast(){
  const r=recips(),ok=r.filter(c=>c.optin);
  $('#bPrev').textContent=`Preview: "${fill($('#bTxt').value,ok[0]||customers[0])}" · ${ok.length} will receive it, ${r.length-ok.length} skipped (no opt-in).`;
  $('#custs').innerHTML=r.map(c=>`<div class="item"><div><b>${c.name}</b><small>${c.phone}</small></div><span><span class="pill">${c.tag}</span> <span class="pill ${c.optin?'g':'y'}">${c.optin?'Opted in':'No opt-in'}</span></span></div>`).join('');
}
['bSeg','bTxt'].forEach(id=>$('#'+id).addEventListener('input',renderBcast));
$('#bSend').onclick=()=>{
  const ok=recips().filter(c=>c.optin);
  if(!ok.length||!$('#bTxt').value.trim())return;
  ok.forEach(c=>deliver(c,fill($('#bTxt').value,c),'broadcast'));
  toastLog(`Broadcast sent to ${ok.length} customers`);
};

/* ---------- 4. Abandoned cart recovery ---------- */
$('#cItem').innerHTML=products.map((p,i)=>`<option value="${i}">${p.name} (${fmt(p.price)})</option>`).join('');
let cartItems=[],timers=[],cStatus={sent:0,recovered:0},left=false;
function renderCart(){
  const total=cartItems.reduce((s,p)=>s+p.price,0);
  $('#cartList').innerHTML=cartItems.length?cartItems.map(p=>esc(p.name)+' · '+fmt(p.price)).join('<br>')+`<br><b>Total ${fmt(total)}</b>`:'Cart is empty.';
  $('#cStat').textContent=`Reminders sent: ${cStatus.sent} · Carts recovered: ${cStatus.recovered}`;
}
$('#cAdd').onclick=()=>{cartItems.push(products[+$('#cItem').value]);renderCart()};
$('#cLeave').onclick=()=>{
  if(!cartItems.length||left)return; left=true;
  const names=cartItems.map(p=>p.name).join(', ');
  $('#cStat').textContent='Customer left. Reminder 1 in 6 seconds…';
  timers.push(setTimeout(()=>{cStatus.sent++;
    deliver(demoC,`Hi ${demoC.name}, you left ${names} in your cart. It is still waiting for you: https://shop.example.com/cart`,'cart');renderCart()},6000));
  timers.push(setTimeout(()=>{cStatus.sent++;
    deliver(demoC,`Last chance, ${demoC.name}! Use code COMEBACK10 for 10% off ${names}. The offer ends tonight.`,'cart');renderCart();left=false},14000));
};
$('#cBuy').onclick=()=>{
  if(!cartItems.length)return;
  const was=cStatus.sent>0&&left;
  timers.forEach(clearTimeout);timers=[];
  if(was||cStatus.sent>0) cStatus.recovered++;
  deliver(demoC,`Thanks ${demoC.name}! Your order of ${cartItems.length} item(s) is confirmed.`,'order');
  cartItems=[];left=false;renderCart();
};

/* ---------- 5. Birthday and anniversary wishes ---------- */
function renderWishes(){
  const t=md(new Date());
  $('#wList').innerHTML=customers.map(c=>`<div class="item"><div><b>${c.name}</b><small>Birthday ${nice(c.bday)} · Anniversary ${nice(c.anniv)}</small></div>
  <span>${c.bday===t?'<span class="pill g">Birthday today</span> ':''}${c.anniv===t?'<span class="pill g">Anniversary today</span>':''}</span></div>`).join('');
}
$('#wRun').onclick=()=>{
  const t=md(new Date()); let n=0;
  customers.filter(c=>c.optin).forEach(c=>{
    if(c.bday===t){deliver(c,fill($('#tB').value,c),'birthday');n++}
    if(c.anniv===t){deliver(c,fill($('#tA').value,c),'anniversary');n++}
  });
  toastLog(n?`${n} wishes sent`:'No birthdays or anniversaries today');
};

/* ---------- Log ---------- */
function toastLog(m){logs.unshift({time:new Date().toLocaleTimeString(),to:'System',type:'info',text:m});renderLog()}
function renderLog(){
  $('#lCount').textContent=logs.length?`(${logs.length})`:'';
  $('#log').innerHTML=logs.length?logs.map(l=>`<div class="le"><span>${l.time}</span><span><b>${esc(l.to)}</b></span><span><span class="pill">${l.type}</span></span><span>${esc(l.text)}</span><span>${l.type==='info'||l.type==='inbound'?'':'✓✓'}</span></div>`).join(''):'<p class="empty">Messages sent by your automations will appear here.</p>';
}
$('#lClr').onclick=()=>{logs.length=0;renderLog()};

/* ---------- Start ---------- */
botSay('Welcome to ShopEase! Type "hi" or tap a quick reply below to try the auto-reply.',200);
renderRules();renderOrders();renderBcast();renderCart();renderWishes();renderLog();
