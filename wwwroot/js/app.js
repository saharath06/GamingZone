/* ============================================
   GAMING ZONE - COMPLETE SYSTEM v2
   فصل الحسابات + عداد PC + إحصائيات + طباعة
   ============================================ */

function getDefaultData(){
    return {
        pcPricePerHour: 50,
        consolePricePerHalf: 100,
        products: [
            {id:1,name:'قهوة سوداء',category:'coffee',price:50,stock:50,minStock:10,emoji:'☕'},
            {id:2,name:'قهوة حليب',category:'coffee',price:80,stock:50,minStock:10,emoji:'☕'},
            {id:3,name:'كوكا كولا',category:'drinks',price:50,stock:40,minStock:10,emoji:'🥤'},
            {id:4,name:'ماء معدني',category:'drinks',price:30,stock:60,minStock:15,emoji:'💧'},
            {id:5,name:'شيبس ليز',category:'chips',price:50,stock:30,minStock:8,emoji:'🍿'},
            {id:6,name:'قاطو شوكولا',category:'cake',price:60,stock:25,minStock:5,emoji:'🍫'},
            {id:7,name:'ساندويتش',category:'food',price:150,stock:15,minStock:3,emoji:'🥪'}
        ],
        pcSessions:{},
        consoleSessions:{},
        transactions:[],
        consoles:[
            {id:'xbox1',name:'Xbox Series X #1',type:'Xbox',icon:'🎮'},
            {id:'xbox2',name:'Xbox Series X #2',type:'Xbox',icon:'🎮'},
            {id:'xbox3',name:'Xbox Series X #3',type:'Xbox',icon:'🎮'},
            {id:'ps5',name:'PlayStation 5',type:'PS5',icon:'🕹️'}
        ],
        nextProductId:8
    };
}

function getData(){
    try{const d=JSON.parse(localStorage.getItem('gamingZoneData'));return d&&d.transactions?d:getDefaultData();}
    catch(e){return getDefaultData();}
}
function saveData(d){localStorage.setItem('gamingZoneData',JSON.stringify(d));}

let currentUser=null, currentModalSession=null, modalCart=[], quickSaleCart=[];
let pieChartInstance=null, barChartInstance=null;

function getShift(){
    if(currentUser==='owner') return 'all';
    return currentUser;
}

function getToday(){return new Date().toISOString().split('T')[0];}

function getMyTransactions(){
    const data=getData();
    const today=getToday();
    const shift=getShift();
    if(shift==='all') return data.transactions.filter(t=>t.date===today);
    return data.transactions.filter(t=>t.date===today && t.shift===shift);
}

function addTransaction(type, amount, details, extra={}){
    const data=getData();
    data.transactions.push({
        id:Date.now(),
        date:getToday(),
        shift:getShift()==='all'?'owner':getShift(),
        type:type, // 'pc_time','console_time','product_sale'
        amount:amount,
        details:details,
        worker:currentUser,
        time:new Date().toLocaleTimeString('ar-DZ',{hour:'2-digit',minute:'2-digit'}),
        ...extra
    });
    saveData(data);
}

/* ===== INIT ===== */
function initDashboard(){
    currentUser=localStorage.getItem('currentUser')||'owner';
    document.body.className=`dashboard-page role-${currentUser}`;
    const names={owner:'المالك',morning:'عامل الصباح',evening:'عامل المساء'};
    const avatars={owner:'👑',morning:'🌅',evening:'🌙'};
    const shifts={owner:'كامل الصلاحيات',morning:'وردية الصباح ☀️',evening:'وردية المساء 🌙'};
    const el=id=>document.getElementById(id);
    if(el('userName'))el('userName').textContent=names[currentUser];
    if(el('userAvatar'))el('userAvatar').textContent=avatars[currentUser];
    if(el('userShift'))el('userShift').textContent=shifts[currentUser];
    if(el('shiftBadge'))el('shiftBadge').textContent=shifts[currentUser];

    setupNavigation();
    updateClock();setInterval(updateClock,1000);
    renderPCGrid();renderConsolesGrid();renderProductsTable();
    updateOverview();renderQuickSaleProducts();startConsoleTimers();startPCTimers();

    const f=el('addProductForm');
    if(f)f.addEventListener('submit',e=>{e.preventDefault();addProduct();});
}

function updateClock(){const c=document.getElementById('liveClock');if(c)c.textContent=new Date().toLocaleTimeString('ar-DZ');}

function setupNavigation(){
    document.querySelectorAll('.nav-item').forEach(item=>{
        item.addEventListener('click',function(e){
            e.preventDefault();
            const s=this.dataset.section;if(!s)return;
            document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.content-section').forEach(x=>x.classList.remove('active'));
            const t=document.getElementById(`section-${s}`);if(t)t.classList.add('active');
            if(s==='overview')updateOverview();
            if(s==='stats')renderCharts();
            if(s==='reports')generateReport();
            document.getElementById('sidebar').classList.remove('open');
        });
    });
}
function toggleSidebar(){document.getElementById('sidebar').classList.toggle('open');}
function logout(){localStorage.removeItem('currentUser');window.location.href='/index.html';}

/* ===== END SHIFT ===== */
function endShift(){
    if(currentUser==='owner'){alert('المالك لا يحتاج إنهاء وردية');return;}
    const myTrans=getMyTransactions();
    const total=myTrans.reduce((s,t)=>s+t.amount,0);
    const shiftName=currentUser==='morning'?'الصباح':'المساء';
    if(!confirm(`⚠️ إنهاء وردية ${shiftName}؟\n\nإجمالي ورديتك: ${total} دج\nعدد العمليات: ${myTrans.length}\n\nبعد التأكيد لن تتمكن من إضافة عمليات جديدة.`))return;
    
    addTransaction('shift_end',0,`انتهاء وردية ${shiftName} - الإجمالي: ${total} دج`);
    alert(`✅ تم إنهاء الوردية بنجاح!\nإجمالي ورديتك: ${total} دج\nسيتم تسجيلك للخروج.`);
    logout();
}

/* ===== PC GRID ===== */
function renderPCGrid(){
    const grid=document.getElementById('pcGrid');if(!grid)return;
    const data=getData();let html='';
    for(let i=1;i<=8;i++){
        const s=data.pcSessions[`pc${i}`];
        const active=s&&s.active;
        const elapsed=active?s.elapsedMinutes||0:0;
        const hrs=Math.floor(elapsed/60);
        const mins=Math.floor(elapsed%60);
        const pcCost=Math.ceil(elapsed/60)*data.pcPricePerHour;
        const cons=s?s.consumption||[]:[];
        const consTotal=cons.reduce((a,c)=>a+c.price*c.qty,0);

        html+=`<div class="pc-card ${active?'active':''}">
            <div class="pc-card-header">
                <div class="pc-name"><i class="fas fa-desktop"></i> PC #${i}</div>
                <span class="pc-status ${active?'busy':'free'}">${active?'🟢 يلعب':'⚫ شاغر'}</span>
            </div>
            <div class="pc-card-body">
                ${active?`
                    <div class="pc-timer-display" id="pc-timer-${i}">${String(hrs).padStart(2,'0')}:${String(mins).padStart(2,'0')}</div>
                    <div class="pc-price-info">الساعة = <strong>${data.pcPricePerHour} دج</strong> | وقت اللعب: <strong>${pcCost} دج</strong></div>
                    <div style="font-weight:600;margin-top:6px">🛒 سلع مستهلكة:</div>
                    <div class="consumption-list">
                        ${cons.length?cons.map(c=>`<div class="consumption-item"><span>${c.name} ×${c.qty}</span><span>${c.price*c.qty} دج</span></div>`).join(''):'<p class="empty-msg" style="padding:3px">لا توجد سلع</p>'}
                    </div>
                    <div class="pc-total"><span>الوقت + السلع:</span><span class="pc-total-amount">${pcCost+consTotal} دج</span></div>
                `:'<p class="empty-msg">الجهاز متاح</p>'}
            </div>
            <div class="pc-card-actions">
                ${!active?`<button class="btn-sm btn-add" onclick="startPC(${i})"><i class="fas fa-play"></i> فتح</button>`:`
                    <button class="btn-sm btn-add" onclick="openConsumptionModal('pc',${i})"><i class="fas fa-plus"></i> سلع</button>
                    <button class="btn-sm btn-checkout" onclick="openCheckoutModal('pc',${i})"><i class="fas fa-receipt"></i> حساب</button>
                `}
            </div>
        </div>`;
    }
    grid.innerHTML=html;
}

function startPC(n){
    const d=getData();
    d.pcSessions[`pc${n}`]={active:true,startTime:Date.now(),elapsedMinutes:0,consumption:[],worker:currentUser};
    saveData(d);renderPCGrid();updateOverview();
}

function startPCTimers(){
    setInterval(()=>{
        const d=getData();let changed=false;
        for(let k in d.pcSessions){
            const s=d.pcSessions[k];
            if(s&&s.active){
                s.elapsedMinutes=(Date.now()-s.startTime)/60000;
                changed=true;
                const num=k.replace('pc','');
                const el=document.getElementById(`pc-timer-${num}`);
                if(el){
                    const h=Math.floor(s.elapsedMinutes/60);
                    const m=Math.floor(s.elapsedMinutes%60);
                    el.textContent=`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
                }
            }
        }
        if(changed)saveData(d);
    },5000);
}

/* ===== CONSOLE GRID ===== */
function renderConsolesGrid(){
    const grid=document.getElementById('consolesGrid');if(!grid)return;
    const d=getData();let html='';
    d.consoles.forEach(c=>{
        const s=d.consoleSessions[c.id];
        const active=s&&s.remainingMinutes>0;
        const cons=s?s.consumption||[]:[];
        const consTotal=cons.reduce((a,x)=>a+x.price*x.qty,0);
        const timeTotal=s?(s.totalHalves||0)*d.consolePricePerHalf:0;
        const rem=s?s.remainingMinutes||0:0;
        const m=Math.floor(rem),sec=Math.floor((rem-m)*60);

        html+=`<div class="console-card ${active?'active':''}">
            <div class="console-card-header">
                <div class="console-name"><span style="font-size:18px">${c.icon}</span> ${c.name}</div>
                <span class="pc-status ${active?'busy':'free'}">${active?'🟢 يلعب':'⚫ متوقف'}</span>
            </div>
            <div class="console-timer">
                <div class="timer-display" id="timer-${c.id}">${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}</div>
                <div class="console-price-info">نصف ساعة = <strong>${d.consolePricePerHalf} دج</strong> ${active?`| الوقت: <strong>${timeTotal} دج</strong>`:''}</div>
                <div class="timer-controls">
                    <button class="btn-timer add-time" onclick="addConsoleTime('${c.id}',30)">+30 د</button>
                    <button class="btn-timer add-time" onclick="addConsoleTime('${c.id}',60)">+1 س</button>
                    ${active?`<button class="btn-timer remove-time" onclick="removeConsoleTime('${c.id}')">-30 د</button>`:''}
                </div>
            </div>
            ${active?`<div class="pc-card-body">
                <div class="consumption-list">${cons.map(x=>`<div class="consumption-item"><span>${x.name} ×${x.qty}</span><span>${x.price*x.qty} دج</span></div>`).join('')}</div>
                <div class="pc-total"><span>الوقت + السلع:</span><span class="pc-total-amount">${timeTotal+consTotal} دج</span></div>
            </div>
            <div class="pc-card-actions">
                <button class="btn-sm btn-add" onclick="openConsumptionModal('console','${c.id}')"><i class="fas fa-plus"></i> سلع</button>
                <button class="btn-sm btn-checkout" onclick="openCheckoutModal('console','${c.id}')"><i class="fas fa-receipt"></i> حساب</button>
            </div>`:''}
        </div>`;
    });
    grid.innerHTML=html;
}

function addConsoleTime(id,min){
    const d=getData();
    if(!d.consoleSessions[id])d.consoleSessions[id]={startTime:Date.now(),remainingMinutes:0,totalHalves:0,consumption:[],worker:currentUser};
    d.consoleSessions[id].remainingMinutes+=min;
    d.consoleSessions[id].totalHalves+=(min/30);
    saveData(d);renderConsolesGrid();updateOverview();
}
function removeConsoleTime(id){
    const d=getData(),s=d.consoleSessions[id];
    if(s&&s.remainingMinutes>=30){s.remainingMinutes-=30;s.totalHalves=Math.max(0,s.totalHalves-1);saveData(d);renderConsolesGrid();}
}
function startConsoleTimers(){
    setInterval(()=>{
        const d=getData();let ch=false;
        for(let id in d.consoleSessions){
            const s=d.consoleSessions[id];
            if(s&&s.remainingMinutes>0){s.remainingMinutes-=1/60;if(s.remainingMinutes<0)s.remainingMinutes=0;ch=true;
                const el=document.getElementById(`timer-${id}`);
                if(el){const m=Math.floor(s.remainingMinutes),sec=Math.floor((s.remainingMinutes-m)*60);el.textContent=`${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;}
            }
        }
        if(ch)saveData(d);
    },1000);
}

/* ===== CONSUMPTION MODAL ===== */
function openConsumptionModal(type,id){
    currentModalSession={type,id};modalCart=[];
    const d=getData();
    if(type==='pc'){
        document.getElementById('modalTitle').textContent=`إضافة سلع لـ PC #${id}`;
        document.getElementById('modalDeviceInfo').innerHTML=`<i class="fas fa-desktop" style="color:var(--neon-blue)"></i> PC #${id}`;
    }else{
        const c=d.consoles.find(x=>x.id===id);
        document.getElementById('modalTitle').textContent=`إضافة سلع لـ ${c.name}`;
        document.getElementById('modalDeviceInfo').innerHTML=`${c.icon} ${c.name}`;
    }
    const grid=document.getElementById('modalProductsGrid');
    grid.innerHTML=d.products.map(p=>`<div class="product-item" onclick="addToModalCart(${p.id})"><div class="product-emoji">${p.emoji}</div><div class="product-name">${p.name}</div><div class="product-price">${p.price} دج</div></div>`).join('');
    renderModalCart();
    document.getElementById('sessionModal').classList.add('active');
}
function addToModalCart(id){
    const d=getData(),p=d.products.find(x=>x.id===id);if(!p||p.stock<=0)return;
    const e=modalCart.find(x=>x.id===id);
    if(e){if(e.qty<p.stock)e.qty++;}else modalCart.push({id:p.id,name:p.name,price:p.price,qty:1});
    renderModalCart();
}
function renderModalCart(){
    const c=document.getElementById('modalCartItems'),t=document.getElementById('modalCartTotal');
    if(!modalCart.length){c.innerHTML='<p class="empty-msg" style="padding:4px">لم تختر سلعاً</p>';t.textContent='0 دج';return;}
    c.innerHTML=modalCart.map((x,i)=>`<div class="cart-item"><span>${x.name} ×${x.qty}</span><span style="color:var(--neon-green)">${x.price*x.qty} دج</span></div>`).join('');
    t.textContent=modalCart.reduce((s,x)=>s+x.price*x.qty,0)+' دج';
}
function saveSessionConsumption(){
    if(!modalCart.length){closeModal('sessionModal');return;}
    const d=getData(),{type,id}=currentModalSession;
    const s=type==='pc'?d.pcSessions[`pc${id}`]:d.consoleSessions[id];if(!s)return;
    let totalProducts=0;
    const details=[];
    modalCart.forEach(ci=>{
        const e=s.consumption.find(x=>x.id===ci.id);
        if(e)e.qty+=ci.qty;else s.consumption.push({...ci});
        const p=d.products.find(x=>x.id===ci.id);if(p)p.stock=Math.max(0,p.stock-ci.qty);
        totalProducts+=ci.price*ci.qty;
        details.push(`${ci.name}×${ci.qty}`);
    });
    addTransaction('product_sale',totalProducts,`${type==='pc'?'PC#'+id:d.consoles.find(c=>c.id===id).name}: ${details.join(', ')}`);
    saveData(d);closeModal('sessionModal');
    if(type==='pc')renderPCGrid();else renderConsolesGrid();
    updateOverview();renderProductsTable();
}

/* ===== CHECKOUT ===== */
function openCheckoutModal(type,id){
    currentModalSession={type,id};
    const d=getData(),s=type==='pc'?d.pcSessions[`pc${id}`]:d.consoleSessions[id];if(!s)return;
    const devName=type==='pc'?`PC #${id}`:d.consoles.find(c=>c.id===id).name;
    const cons=s.consumption||[];
    const consTotal=cons.reduce((a,c)=>a+c.price*c.qty,0);
    let timeTotal=0,timeLabel='';
    if(type==='pc'){
        const hrs=Math.ceil((s.elapsedMinutes||0)/60);
        timeTotal=hrs*d.pcPricePerHour;
        timeLabel=`وقت اللعب (${hrs} ساعة × ${d.pcPricePerHour} دج)`;
    }else{
        timeTotal=(s.totalHalves||0)*d.consolePricePerHalf;
        timeLabel=`وقت اللعب (${s.totalHalves||0} × نصف ساعة × ${d.consolePricePerHalf} دج)`;
    }
    const grand=timeTotal+consTotal;
    document.getElementById('checkoutSummary').innerHTML=`
        <div style="font-size:15px;font-weight:700;margin-bottom:8px">${devName}</div>
        <div style="display:flex;justify-content:space-between;margin:4px 0"><span>${timeLabel}:</span><strong style="color:var(--neon-blue)">${timeTotal} دج</strong></div>
        <div style="font-weight:600;margin-top:8px;font-size:12px">السلع المستهلكة:</div>
        <div style="background:var(--bg-input);padding:8px;border-radius:6px;margin:4px 0;font-size:12px">
            ${cons.length?cons.map(c=>`<div style="display:flex;justify-content:space-between;padding:2px 0"><span>${c.name} ×${c.qty}</span><span>${c.price*c.qty} دج</span></div>`).join(''):'<span style="color:var(--text-muted)">لا توجد سلع</span>'}
        </div>
        <div style="display:flex;justify-content:space-between;margin:4px 0"><span>مجموع السلع:</span><strong style="color:var(--neon-orange)">${consTotal} دج</strong></div>
        <div style="display:flex;justify-content:space-between;font-size:20px;font-weight:900;margin-top:12px;padding-top:10px;border-top:1px solid var(--border-color)">
            <span>💰 المطلوب:</span><span style="color:var(--neon-green)">${grand} دج</span>
        </div>`;
    document.getElementById('checkoutModal').classList.add('active');
}

function confirmCheckout(){
    const d=getData(),{type,id}=currentModalSession;
    const s=type==='pc'?d.pcSessions[`pc${id}`]:d.consoleSessions[id];if(!s)return;
    const devName=type==='pc'?`PC #${id}`:d.consoles.find(c=>c.id===id).name;
    let timeTotal=0;
    if(type==='pc'){timeTotal=Math.ceil((s.elapsedMinutes||0)/60)*d.pcPricePerHour;}
    else{timeTotal=(s.totalHalves||0)*d.consolePricePerHalf;}
    
    if(timeTotal>0) addTransaction(type==='pc'?'pc_time':'console_time',timeTotal,`${devName}: وقت اللعب`);
    
    if(type==='pc')delete d.pcSessions[`pc${id}`];else delete d.consoleSessions[id];
    saveData(d);closeModal('checkoutModal');
    renderPCGrid();renderConsolesGrid();updateOverview();
    alert(`✅ تم الدفع: ${timeTotal} دج (وقت اللعب)`);
}
function closeModal(id){document.getElementById(id).classList.remove('active');}

/* ===== QUICK SALE ===== */
function renderQuickSaleProducts(){
    const d=getData(),cats={all:'📦 الكل',coffee:'☕ ساخنة',drinks:'🥤 باردة',chips:'🍿 شيبس',cake:'🍰 قاطو',food:'🍔 وجبات'};
    const tabs=document.getElementById('qsCategoryTabs');if(!tabs)return;
    tabs.innerHTML=Object.entries(cats).map(([k,v])=>`<button class="cat-tab ${k==='all'?'active':''}" onclick="filterQS('${k}',this)">${v}</button>`).join('');
    renderQSGrid('all');
}
function filterQS(c,btn){document.querySelectorAll('#qsCategoryTabs .cat-tab').forEach(t=>t.classList.remove('active'));if(btn)btn.classList.add('active');renderQSGrid(c);}
function renderQSGrid(c){
    const d=getData(),grid=document.getElementById('qsProductsGrid');if(!grid)return;
    const p=c==='all'?d.products:d.products.filter(x=>x.category===c);
    grid.innerHTML=p.map(x=>`<div class="product-item" onclick="addToQS(${x.id})"><div class="product-emoji">${x.emoji}</div><div class="product-name">${x.name}</div><div class="product-price">${x.price} دج</div></div>`).join('')||'<p class="empty-msg">لا توجد سلع</p>';
}
function addToQS(id){
    const d=getData(),p=d.products.find(x=>x.id===id);if(!p||p.stock<=0)return;
    const e=quickSaleCart.find(x=>x.id===id);if(e){if(e.qty<p.stock)e.qty++;}else quickSaleCart.push({id:p.id,name:p.name,price:p.price,qty:1});
    renderQSCart();
}
function renderQSCart(){
    const c=document.getElementById('qsInvoiceItems'),t=document.getElementById('qsTotal');if(!c)return;
    if(!quickSaleCart.length){c.innerHTML='<p class="empty-msg">اختر سلعاً</p>';t.textContent='0 دج';return;}
    c.innerHTML=quickSaleCart.map((item,idx)=>`
        <div class="invoice-item">
            <div class="item-info"><span class="item-remove" onclick="removeQS(${idx})"><i class="fas fa-trash"></i></span> <span>${item.name}</span></div>
            <div>
                <button class="qty-btn" onclick="changeQSQty(${idx},-1)">-</button>
                <span style="margin:0 4px">${item.qty}</span>
                <button class="qty-btn" onclick="changeQSQty(${idx},1)">+</button>
            </div>
            <div style="font-weight:700;color:var(--neon-green)">${item.price*item.qty} دج</div>
        </div>`).join('');
    t.textContent=quickSaleCart.reduce((s,c)=>s+c.price*c.qty,0)+' دج';
}
function changeQSQty(idx,d){
    const data=getData(),item=quickSaleCart[idx],p=data.products.find(x=>x.id===item.id);
    item.qty+=d;if(item.qty<=0)quickSaleCart.splice(idx,1);else if(p&&item.qty>p.stock)item.qty=p.stock;
    renderQSCart();
}
function removeQS(idx){quickSaleCart.splice(idx,1);renderQSCart();}
function completeQuickSale(){
    if(!quickSaleCart.length)return;
    const d=getData(),total=quickSaleCart.reduce((s,c)=>s+c.price*c.qty,0);
    quickSaleCart.forEach(item=>{const p=d.products.find(x=>x.id===item.id);if(p)p.stock=Math.max(0,p.stock-item.qty);});
    addTransaction('product_sale',total,`بيع مباشر: ${quickSaleCart.map(c=>c.name+'×'+c.qty).join(', ')}`);
    saveData(d);quickSaleCart=[];renderQSCart();renderProductsTable();updateOverview();
    alert(`✅ تم البيع: ${total} دج`);
}

/* ===== PRODUCTS MANAGEMENT ===== */
function addProduct(){
    const d=getData(),name=document.getElementById('prodName').value.trim();
    const category=document.getElementById('prodCategory').value;
    const price=parseInt(document.getElementById('prodPrice').value);
    const stock=parseInt(document.getElementById('prodStock').value);
    const minStock=parseInt(document.getElementById('prodMinStock').value)||5;
    const emojis={coffee:'☕',drinks:'🥤',chips:'🍿',cake:'🍰',food:'🍔',other:'📦'};
    d.products.push({id:d.nextProductId++,name,category,price,stock,minStock,emoji:emojis[category]||'📦'});
    saveData(d);document.getElementById('addProductForm').reset();
    renderProductsTable();renderQuickSaleProducts();updateOverview();
    alert(`تمت إضافة ${name}!`);
}
function renderProductsTable(){
    const tb=document.getElementById('productsTableBody');if(!tb)return;
    const d=getData(),cats={coffee:'☕ ساخنة',drinks:'🥤 باردة',chips:'🍿 مقرمشات',cake:'🍰 حلويات',food:'🍔 وجبات',other:'📦 أخرى'};
    tb.innerHTML=d.products.map(p=>{
        let stClass='stock-ok',stText='متوفر';
        if(p.stock<=0){stClass='stock-out';stText='نفد';}
        else if(p.stock<=p.minStock){stClass='stock-low';stText='منخفض';}
        return `<tr>
            <td><strong>${p.emoji} ${p.name}</strong></td>
            <td>${cats[p.category]||p.category}</td>
            <td style="color:var(--neon-green)">${p.price} دج</td>
            <td><strong>${p.stock}</strong></td>
            <td><span class="stock-badge ${stClass}">${stText}</span></td>
            <td><button class="btn-sm btn-clear" onclick="deleteProduct(${p.id})"><i class="fas fa-trash"></i></button></td>
        </tr>`;
    }).join('');
}
function deleteProduct(id){
    if(!confirm('حذف هذه السلعة؟'))return;
    const d=getData();d.products=d.products.filter(p=>p.id!==id);
    saveData(d);renderProductsTable();renderQuickSaleProducts();updateOverview();
}

/* ===== OVERVIEW & STATS ===== */
function updateOverview(){
    const d=getData();
    let actPCs=0,actCons=0;
    for(let k in d.pcSessions)if(d.pcSessions[k]&&d.pcSessions[k].active)actPCs++;
    for(let k in d.consoleSessions)if(d.consoleSessions[k]&&d.consoleSessions[k].remainingMinutes>0)actCons++;

    const myTrans=getMyTransactions();
    const shiftTotal=myTrans.reduce((s,t)=>s+t.amount,0);
    const pcTotal=myTrans.filter(t=>t.type==='pc_time').reduce((s,t)=>s+t.amount,0);
    const prodTotal=myTrans.filter(t=>t.type==='product_sale').reduce((s,t)=>s+t.amount,0);

    const el=id=>document.getElementById(id);
    if(el('activePCs'))el('activePCs').textContent=actPCs;
    if(el('activeConsoles'))el('activeConsoles').textContent=actCons;
    if(el('shiftRevenue'))el('shiftRevenue').textContent=shiftTotal+' دج';
    if(el('dailyTotal'))el('dailyTotal').textContent=shiftTotal+' دج';
    if(el('pcRevenue'))el('pcRevenue').textContent=pcTotal+' دج';
    if(el('productRevenue'))el('productRevenue').textContent=prodTotal+' دج';
    if(el('totalOrders'))el('totalOrders').textContent=myTrans.length;

    const box=el('lowStockAlerts');
    if(box){
        const low=d.products.filter(p=>p.stock<=p.minStock);
        box.innerHTML=low.length?low.map(p=>`
            <div style="background:rgba(255,136,0,0.1);border:1px solid rgba(255,136,0,0.3);padding:6px 10px;border-radius:6px;margin-bottom:4px;font-size:12px;">
                ⚠️ <strong>${p.emoji} ${p.name}</strong> - متبقي: <strong style="color:var(--neon-orange)">${p.stock}</strong> (الحد: ${p.minStock})
            </div>`).join(''):'<p class="empty-msg" style="padding:4px">✅ جميع السلع متوفرة بكميات كافية</p>';
    }
}

/* ===== CHARTS ===== */
function renderCharts(){
    const d=getData(),today=getToday();
    const trans=d.transactions.filter(t=>t.date===today);
    const pcTotal=trans.filter(t=>t.type==='pc_time').reduce((s,t)=>s+t.amount,0);
    const consTotal=trans.filter(t=>t.type==='console_time').reduce((s,t)=>s+t.amount,0);
    const prodTotal=trans.filter(t=>t.type==='product_sale').reduce((s,t)=>s+t.amount,0);

    if(pieChartInstance)pieChartInstance.destroy();
    const pieCtx=document.getElementById('revenuePieChart');
    if(pieCtx){
        pieChartInstance=new Chart(pieCtx,{
            type:'doughnut',
            data:{
                labels:['أجهزة PC','الكونسول','السلع والمشروبات'],
                datasets:[{
                    data:[pcTotal||1,consTotal||1,prodTotal||1],
                    backgroundColor:['#00d4ff','#7b2ffa','#ff8800'],
                    borderWidth:0
                }]
            },
            options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{color:'#e8e8f0',font:{family:'Tajawal'}}}}}
        });
    }

    if(barChartInstance)barChartInstance.destroy();
    const barCtx=document.getElementById('revenueBarChart');
    if(barCtx){
        barChartInstance=new Chart(barCtx,{
            type:'bar',
            data:{
                labels:['أجهزة PC','الكونسول','السلع'],
                datasets:[{
                    label:'المداخيل (دج)',
                    data:[pcTotal,consTotal,prodTotal],
                    backgroundColor:['#00d4ff','#7b2ffa','#ff8800'],
                    borderRadius:8
                }]
            },
            options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{grid:{color:'#222244'},ticks:{color:'#7777aa'}},x:{grid:{display:false},ticks:{color:'#e8e8f0',font:{family:'Tajawal'}}}}}
        });
    }
}

/* ===== REPORTS ===== */
function generateReport(){
    const d=getData(),today=getToday();
    const trans=d.transactions.filter(t=>t.date===today);
    const total=trans.reduce((s,t)=>s+t.amount,0);
    const pcTotal=trans.filter(t=>t.type==='pc_time').reduce((s,t)=>s+t.amount,0);
    const consTotal=trans.filter(t=>t.type==='console_time').reduce((s,t)=>s+t.amount,0);
    const prodTotal=trans.filter(t=>t.type==='product_sale').reduce((s,t)=>s+t.amount,0);
    const morningTotal=trans.filter(t=>t.shift==='morning').reduce((s,t)=>s+t.amount,0);
    const eveningTotal=trans.filter(t=>t.shift==='evening').reduce((s,t)=>s+t.amount,0);

    const el=id=>document.getElementById(id);
    if(el('reportTotal'))el('reportTotal').textContent=total+' دج';
    if(el('reportPC'))el('reportPC').textContent=pcTotal+' دج';
    if(el('reportConsole'))el('reportConsole').textContent=consTotal+' دج';
    if(el('reportProducts'))el('reportProducts').textContent=prodTotal+' دج';
    if(el('reportMorning'))el('reportMorning').textContent=morningTotal+' دج';
    if(el('reportEvening'))el('reportEvening').textContent=eveningTotal+' دج';

    const log=el('transactionLog');
    if(log){
        const list=[...trans].reverse();
        const types={pc_time:'🖥️ وقت PC',console_time:'🎮 وقت كونسول',product_sale:'🛒 سلع',shift_end:'🚪 نهاية وردية'};
        const shifts={morning:'🌅 الصباح',evening:'🌙 المساء',owner:'👑 المالك'};
        log.innerHTML=list.map(t=>`<tr>
            <td>${t.time}</td>
            <td>${types[t.type]||t.type}</td>
            <td>${t.details}</td>
            <td style="color:var(--neon-green);font-weight:700">${t.amount} دج</td>
            <td>${shifts[t.shift]||t.shift}</td>
        </tr>`).join('')||'<tr><td colspan="5" class="empty-msg">لا توجد عمليات</td></tr>';
    }
}

/* ===== PRINT REPORT ===== */
function printReport(){
    generateReport();
    window.print();
}

/* ===== BACKUP ===== */
function exportData(){
    const d=getData(),blob=new Blob([JSON.stringify(d,null,2)],{type:'application/json'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=`gaming-zone-${getToday()}.json`;
    a.click();
}
function clearAllData(){
    if(confirm('تصفير كل البيانات؟')){localStorage.removeItem('gamingZoneData');location.reload();}
}
