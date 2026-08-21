/* Gaming Zone v4 - Custom Names + Emoji Picker + Single Page Invoice */

// ===== الأيقونات المتاحة =====
const EMOJI_LIBRARY = {
    coffee: ['☕','🫖','🍵','🥛','🧋','🍶','🥃','🍷','🫗','♨️'],
    drinks: ['🥤','🧃','🧉','🍹','🍸','🍺','🍻','🥂','🍾','🥥','🍋','🍊','💧'],
    chips: ['🍿','🥨','🥜','🌰','🫘','🍘','🍙','🍚','🍢','🥠','🍫','🍬','🍭'],
    cake: ['🍰','🎂','🧁','🍮','🍩','🥐','🥖','🍪','🥧','🫓','🥯','🍞','🥞'],
    food: ['🍔','🍟','🌭','🥪','🌮','🌯','🫔','🥙','🧆','🍕','🥘','🍝','🍜','🍲','🥟','🍱','🍣'],
    other: ['📦','🎁','🛍️','🎯','🎮','🎲','🃏','🎨','📱','💻','🖥️','⌨️','🖱️','🎧','📸','🎬']
};

const ALL_EMOJIS = [
    '☕','🫖','🍵','🥛','🧋','🍶','🥃','🍷','♨️',
    '🥤','🧃','🧉','🍹','🍸','🍺','🍻','🥂','🥥','💧',
    '🍿','🥨','🥜','🌰','🫘','🍘','🍙','🍚','🍢','🥠',
    '🍫','🍬','🍭','🍰','🎂','🧁','🍮','🍩','🥐','🥖',
    '🍪','🥧','🫓','🥯','🍞','🥞','🍔','🍟','🌭','🥪',
    '🌮','🌯','🫔','🥙','🧆','🍕','🥘','🍝','🍜','🍲',
    '🥟','🍱','🍣','🍤','🍙','🍘','🍡','🍧','🍨','🍦',
    '🍎','🍏','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍒',
    '🥝','🍍','🥭','🍑','🥑','🥕','🌽','🥔','🍄','🧀',
    '📦','🎁','🛍️','🎯','🎮','🎲','🃏','📱','💻','🎧'
];

function getDefaultData(){
    return {
        pcPricePerHour:50,
        consolePricePerHalf:100,
        pcCount:9,
        products:[
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

function getSettings(){
    try{
        return JSON.parse(localStorage.getItem('gzSettings')||'{}');
    }catch(e){return {};}
}
function saveSettings(s){localStorage.setItem('gzSettings',JSON.stringify(s));}

function getUserName(role){
    const s=getSettings();
    if(role==='owner') return s.ownerName||'المالك';
    if(role==='morning') return s.morningName||'عامل الصباح';
    if(role==='evening') return s.eveningName||'عامل المساء';
    return role;
}

function getData(){
    try{
        const s=localStorage.getItem('gamingZoneData');
        if(!s)return getDefaultData();
        const d=JSON.parse(s);
        const def=getDefaultData();
        for(let k in def)if(!(k in d))d[k]=def[k];
        if(!d.pcCount)d.pcCount=9;
        // تحديث الأسعار من الإعدادات
        const settings=getSettings();
        if(settings.pcPrice)d.pcPricePerHour=settings.pcPrice;
        if(settings.consolePrice)d.consolePricePerHalf=settings.consolePrice;
        return d;
    }catch(e){return getDefaultData();}
}
function saveData(d){localStorage.setItem('gamingZoneData',JSON.stringify(d));}

let currentUser=null,currentModal=null,modalCart=[],qsCart=[],editingProdId=null;
let pieC=null,barC=null;
let selectedEmojiAdd='☕',selectedEmojiEdit='☕';

function getToday(){
    const d=new Date();
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function getShift(){return currentUser==='owner'?'all':currentUser;}
function getMyTx(){
    const d=getData(),t=getToday(),s=getShift();
    const all=d.transactions.filter(x=>x.date===t);
    return s==='all'?all:all.filter(x=>x.shift===s);
}
function addTx(type,amount,details){
    const d=getData();
    const shift=getShift()==='all'?'owner':getShift();
    const tx={
        id:Date.now()+'_'+Math.floor(Math.random()*1000),
        date:getToday(),
        shift:shift,
        type:type,
        amount:Number(amount)||0,
        details:details,
        worker:currentUser,
        time:new Date().toLocaleTimeString('ar-DZ',{hour:'2-digit',minute:'2-digit'})
    };
    d.transactions.push(tx);
    saveData(d);
    return tx;
}

function initDashboard(){
    currentUser=localStorage.getItem('currentUser')||'owner';
    document.body.className='dashboard-page role-'+currentUser;
    
    const A={owner:'👑',morning:'🌅',evening:'🌙'};
    const S={owner:'كامل الصلاحيات',morning:'وردية الصباح ☀️',evening:'وردية المساء 🌙'};
    const e=id=>document.getElementById(id);
    
    if(e('userName'))e('userName').textContent=getUserName(currentUser);
    if(e('userAvatar'))e('userAvatar').textContent=A[currentUser];
    if(e('userShift'))e('userShift').textContent=S[currentUser];
    if(e('shiftBadge'))e('shiftBadge').textContent=S[currentUser];
    
    setupNav();
    updateClock();setInterval(updateClock,1000);
    renderPC();renderCon();renderProdTable();updateOv();renderQS();
    startConTimers();startPCTimers();
    renderEmojiPicker('emojiPickerAdd','prodEmoji','add');
    loadSettingsForm();
    
    const f=e('addProductForm');
    if(f)f.addEventListener('submit',ev=>{ev.preventDefault();addProd();});
}

function updateClock(){
    const c=document.getElementById('liveClock');
    if(c)c.textContent=new Date().toLocaleTimeString('ar-DZ');
}
function setupNav(){
    document.querySelectorAll('.nav-item').forEach(i=>{
        i.addEventListener('click',function(ev){
            ev.preventDefault();
            const s=this.dataset.section;if(!s)return;
            document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.content-section').forEach(x=>x.classList.remove('active'));
            const t=document.getElementById('section-'+s);
            if(t)t.classList.add('active');
            if(s==='overview')updateOv();
            if(s==='stats')renderCharts();
            if(s==='reports')genReport();
            document.getElementById('sidebar').classList.remove('open');
        });
    });
}
function toggleSidebar(){document.getElementById('sidebar').classList.toggle('open');}
function logout(){localStorage.removeItem('currentUser');window.location.href='/index.html';}

/* ===== EMOJI PICKER ===== */
function renderEmojiPicker(containerId,hiddenId,type){
    const container=document.getElementById(containerId);
    if(!container)return;
    container.innerHTML=ALL_EMOJIS.map(em=>'<div class="emoji-option" onclick="selectEmoji(\''+em+'\',\''+hiddenId+'\',\''+type+'\',this)">'+em+'</div>').join('');
}

function selectEmoji(em,hiddenId,type,element){
    document.getElementById(hiddenId).value=em;
    if(type==='add')selectedEmojiAdd=em;
    else selectedEmojiEdit=em;
    element.parentElement.querySelectorAll('.emoji-option').forEach(x=>x.classList.remove('selected'));
    element.classList.add('selected');
}

/* ===== SETTINGS ===== */
function loadSettingsForm(){
    if(currentUser!=='owner')return;
    const s=getSettings();
    const d=getData();
    const e=id=>document.getElementById(id);
    if(e('morningWorkerName'))e('morningWorkerName').value=s.morningName||'';
    if(e('morningWorkerPass'))e('morningWorkerPass').value=s.morningPass||'morning123';
    if(e('eveningWorkerName'))e('eveningWorkerName').value=s.eveningName||'';
    if(e('eveningWorkerPass'))e('eveningWorkerPass').value=s.eveningPass||'evening123';
    if(e('ownerName'))e('ownerName').value=s.ownerName||'';
    if(e('ownerPass'))e('ownerPass').value=s.ownerPass||'owner123';
    if(e('pcPriceInput'))e('pcPriceInput').value=d.pcPricePerHour;
    if(e('consolePriceInput'))e('consolePriceInput').value=d.consolePricePerHalf;
}

function saveWorkersSettings(){
    const s=getSettings();
    s.morningName=document.getElementById('morningWorkerName').value.trim();
    s.morningPass=document.getElementById('morningWorkerPass').value.trim()||'morning123';
    s.eveningName=document.getElementById('eveningWorkerName').value.trim();
    s.eveningPass=document.getElementById('eveningWorkerPass').value.trim()||'evening123';
    s.ownerName=document.getElementById('ownerName').value.trim();
    s.ownerPass=document.getElementById('ownerPass').value.trim()||'owner123';
    saveSettings(s);
    alert('✅ تم حفظ الإعدادات\n\nستُطبّق الأسماء والكلمات الجديدة في المرة القادمة عند تسجيل الدخول.');
    // تحديث الاسم الظاهر فوراً
    document.getElementById('userName').textContent=getUserName(currentUser);
}

function savePrices(){
    const s=getSettings();
    const pcP=parseInt(document.getElementById('pcPriceInput').value);
    const conP=parseInt(document.getElementById('consolePriceInput').value);
    if(pcP>0)s.pcPrice=pcP;
    if(conP>0)s.consolePrice=conP;
    saveSettings(s);
    // تحديث في البيانات
    const d=getData();
    if(pcP>0)d.pcPricePerHour=pcP;
    if(conP>0)d.consolePricePerHalf=conP;
    saveData(d);
    renderPC();renderCon();
    alert('✅ تم حفظ الأسعار الجديدة');
}

/* ===== END SHIFT + SINGLE PAGE INVOICE ===== */
function endShift(){
    if(currentUser==='owner'){alert('المالك لا يحتاج إنهاء وردية');return;}
    const my=getMyTx();
    const tot=my.reduce((s,t)=>s+(Number(t.amount)||0),0);
    const nm=currentUser==='morning'?'الصباح ☀️':'المساء 🌙';
    if(!confirm('⚠️ إنهاء وردية '+nm+'؟\n\nإجمالي: '+tot+' دج\nعمليات: '+my.length+'\n\nسيتم طباعة فاتورة المحاسبة تلقائياً في صفحة واحدة.'))return;
    
    buildAccountingInvoice(my,tot,nm);
    addTx('shift_end',0,'انتهاء وردية '+nm+' - الإجمالي: '+tot+' دج');
    
    setTimeout(()=>{
        window.print();
        setTimeout(()=>{
            alert('✅ تم إنهاء الوردية وطباعة فاتورة المحاسبة');
            logout();
        },1000);
    },500);
}

function buildAccountingInvoice(transactions,total,shiftName){
    const now=new Date();
    const dateStr=now.toLocaleDateString('ar-DZ',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
    const timeStr=now.toLocaleTimeString('ar-DZ',{hour:'2-digit',minute:'2-digit'});
    
    const pcTotal=transactions.filter(t=>t.type==='pc_time').reduce((s,t)=>s+t.amount,0);
    const consTotal=transactions.filter(t=>t.type==='console_time').reduce((s,t)=>s+t.amount,0);
    const prodTotal=transactions.filter(t=>t.type==='product_sale').reduce((s,t)=>s+t.amount,0);
    const pcCount=transactions.filter(t=>t.type==='pc_time').length;
    const consCount=transactions.filter(t=>t.type==='console_time').length;
    const prodCount=transactions.filter(t=>t.type==='product_sale').length;
    
    const workerName=getUserName(currentUser);
    const ownerName=getSettings().ownerName||'المالك';
    const realTransactions=transactions.filter(t=>t.type!=='shift_end');
    
    let html='<div class="acc-container">';
    
    // Header مختصر
    html+='<div class="acc-header">';
    html+='<div class="acc-logo">🎮</div>';
    html+='<h1>GAMING ZONE</h1>';
    html+='<p>نظام إدارة صالة الألعاب</p>';
    html+='</div>';
    
    html+='<div class="acc-title">📋 فاتورة محاسبة نهاية الوردية 📋</div>';
    
    html+='<div class="acc-body">';
    
    // Meta grid
    html+='<div class="acc-meta">';
    html+='<div class="acc-meta-row"><span><strong>👤 العامل:</strong></span><span>'+workerName+'</span></div>';
    html+='<div class="acc-meta-row"><span><strong>👑 المسلَّم إليه:</strong></span><span>'+ownerName+'</span></div>';
    html+='<div class="acc-meta-row"><span><strong>📅 التاريخ:</strong></span><span>'+dateStr+'</span></div>';
    html+='<div class="acc-meta-row"><span><strong>🕐 وقت الإغلاق:</strong></span><span>'+timeStr+'</span></div>';
    html+='<div class="acc-meta-row"><span><strong>⏰ الوردية:</strong></span><span>'+shiftName+'</span></div>';
    html+='<div class="acc-meta-row"><span><strong>📊 عدد العمليات:</strong></span><span>'+realTransactions.length+'</span></div>';
    html+='</div>';
    
    // ملخص المداخيل
    html+='<div class="acc-section-title">💰 ملخص المداخيل حسب النوع</div>';
    html+='<table class="acc-table"><thead><tr><th>النوع</th><th style="text-align:center">عدد العمليات</th><th style="text-align:left">المبلغ</th></tr></thead><tbody>';
    html+='<tr><td>🖥️ أجهزة الكمبيوتر</td><td style="text-align:center">'+pcCount+'</td><td style="text-align:left" class="num">'+pcTotal+' دج</td></tr>';
    html+='<tr><td>🎮 أجهزة الكونسول</td><td style="text-align:center">'+consCount+'</td><td style="text-align:left" class="num">'+consTotal+' دج</td></tr>';
    html+='<tr><td>🛒 السلع والمشروبات</td><td style="text-align:center">'+prodCount+'</td><td style="text-align:left" class="num">'+prodTotal+' دج</td></tr>';
    html+='</tbody></table>';
    
    // تفاصيل مختصرة
    if(realTransactions.length>0){
        html+='<div class="acc-section-title">📋 تفاصيل العمليات ('+realTransactions.length+' عملية)</div>';
        html+='<table class="acc-table"><thead><tr><th>الوقت</th><th>النوع</th><th>التفاصيل</th><th style="text-align:left">المبلغ</th></tr></thead><tbody>';
        const types={pc_time:'🖥️ PC',console_time:'🎮 كونسول',product_sale:'🛒 سلع'};
        realTransactions.forEach(t=>{
            const shortDetails=t.details.length>60?t.details.substring(0,60)+'...':t.details;
            html+='<tr><td>'+t.time+'</td><td>'+(types[t.type]||t.type)+'</td><td style="font-size:9px">'+shortDetails+'</td><td style="text-align:left" class="num">'+t.amount+' دج</td></tr>';
        });
        html+='</tbody></table>';
    }
    
    // الملخص النهائي
    html+='<div class="acc-summary">';
    html+='<div class="acc-sum-row"><span>💰 مداخيل الأجهزة (PC + كونسول):</span><span>'+(pcTotal+consTotal)+' دج</span></div>';
    html+='<div class="acc-sum-row"><span>🛒 مداخيل السلع والمشروبات:</span><span>'+prodTotal+' دج</span></div>';
    html+='<div class="acc-grand"><span>💵 المبلغ الإجمالي للتسليم:</span><span>'+total+' دج</span></div>';
    html+='</div>';
    
    // التوقيعات
    html+='<div class="acc-signature">';
    html+='<div class="acc-sign-box"><div class="acc-sign-line">توقيع العامل</div><div>'+workerName+'</div></div>';
    html+='<div class="acc-sign-box"><div class="acc-sign-line">توقيع المالك</div><div>'+ownerName+'</div></div>';
    html+='</div>';
    
    html+='</div>';
    
    // Footer
    html+='<div class="acc-footer">';
    html+='<p class="thanks">🎮 GAMING ZONE 🎮</p>';
    html+='<p>طُبعت في: '+dateStr+' - '+timeStr+'</p>';
    html+='</div>';
    
    html+='</div>';
    
    document.getElementById('printInvoice').innerHTML=html;
}

/* ===== PC ===== */
function renderPC(){
    const g=document.getElementById('pcGrid');if(!g)return;
    const d=getData();let h='';
    for(let i=1;i<=d.pcCount;i++){
        const s=d.pcSessions['pc'+i];
        const a=s&&s.active;
        const el=a?s.elapsedMinutes||0:0;
        const hr=Math.floor(el/60),mn=Math.floor(el%60);
        const pcCost=Math.round((el/60)*d.pcPricePerHour);
        const co=s?s.consumption||[]:[];
        const ct=co.reduce((a,c)=>a+c.price*c.qty,0);
        
        h+='<div class="pc-card '+(a?'active':'')+'">';
        h+='<div class="pc-card-header"><div class="pc-name"><i class="fas fa-desktop"></i> PC #'+i+'</div>';
        h+='<span class="pc-status '+(a?'busy':'free')+'">'+(a?'🟢 يلعب':'⚫ شاغر')+'</span></div>';
        h+='<div class="pc-card-body">';
        if(a){
            h+='<div class="pc-timer-display" id="pct-'+i+'">'+String(hr).padStart(2,'0')+':'+String(mn).padStart(2,'0')+'</div>';
            h+='<div class="pc-price-info">الساعة = <strong>'+d.pcPricePerHour+' دج</strong> (نسبي) | الوقت: <strong>'+pcCost+' دج</strong></div>';
            h+='<div style="font-weight:600;margin-top:5px">🛒 سلع:</div><div class="consumption-list">';
            h+=co.length?co.map(c=>'<div class="consumption-item"><span>'+c.name+' ×'+c.qty+'</span><span>'+c.price*c.qty+' دج</span></div>').join(''):'<p class="empty-msg" style="padding:3px">لا توجد</p>';
            h+='</div><div class="pc-total"><span>الوقت+السلع:</span><span class="pc-total-amount">'+(pcCost+ct)+' دج</span></div>';
        }else{
            h+='<p class="empty-msg">الجهاز متاح</p>';
        }
        h+='</div><div class="pc-card-actions">';
        if(a){
            h+='<button class="btn-sm btn-add" onclick="openConModal(\'pc\','+i+')"><i class="fas fa-plus"></i> سلع</button>';
            h+='<button class="btn-sm btn-checkout" onclick="openChkModal(\'pc\','+i+')"><i class="fas fa-receipt"></i> حساب</button>';
        }else{
            h+='<button class="btn-sm btn-add" onclick="startPC('+i+')"><i class="fas fa-play"></i> فتح</button>';
        }
        h+='</div></div>';
    }
    g.innerHTML=h;
}

function startPC(n){
    const d=getData();
    d.pcSessions['pc'+n]={active:true,startTime:Date.now(),elapsedMinutes:0,consumption:[],worker:currentUser};
    saveData(d);renderPC();updateOv();
}

function startPCTimers(){
    setInterval(()=>{
        const d=getData();let ch=false;
        for(let k in d.pcSessions){
            const s=d.pcSessions[k];
            if(s&&s.active){
                s.elapsedMinutes=(Date.now()-s.startTime)/60000;
                ch=true;
                const num=k.replace('pc','');
                const el=document.getElementById('pct-'+num);
                if(el){
                    const hr=Math.floor(s.elapsedMinutes/60);
                    const mn=Math.floor(s.elapsedMinutes%60);
                    el.textContent=String(hr).padStart(2,'0')+':'+String(mn).padStart(2,'0');
                }
            }
        }
        if(ch)saveData(d);
    },5000);
}

/* ===== CONSOLES ===== */
function renderCon(){
    const g=document.getElementById('consolesGrid');if(!g)return;
    const d=getData();let h='';
    d.consoles.forEach(c=>{
        const s=d.consoleSessions[c.id];
        const a=s&&s.remainingMinutes>0;
        const co=s?s.consumption||[]:[];
        const ct=co.reduce((a,x)=>a+x.price*x.qty,0);
        const tt=s?(s.totalHalves||0)*d.consolePricePerHalf:0;
        const rm=s?s.remainingMinutes||0:0;
        const mi=Math.floor(rm),sc=Math.floor((rm-mi)*60);
        
        h+='<div class="console-card '+(a?'active':'')+'">';
        h+='<div class="console-card-header"><div class="console-name"><span style="font-size:18px">'+c.icon+'</span> '+c.name+'</div>';
        h+='<span class="pc-status '+(a?'busy':'free')+'">'+(a?'🟢 يلعب':'⚫ متوقف')+'</span></div>';
        h+='<div class="console-timer"><div class="timer-display" id="tm-'+c.id+'">'+String(mi).padStart(2,'0')+':'+String(sc).padStart(2,'0')+'</div>';
        h+='<div class="console-price-info">نصف ساعة = <strong>'+d.consolePricePerHalf+' دج</strong> '+(a?'| الوقت: <strong>'+tt+' دج</strong>':'')+'</div>';
        h+='<div class="timer-controls">';
        h+='<button class="btn-timer add-time" onclick="addConTime(\''+c.id+'\',30)">+30 د</button>';
        h+='<button class="btn-timer add-time" onclick="addConTime(\''+c.id+'\',60)">+1 س</button>';
        if(a)h+='<button class="btn-timer remove-time" onclick="rmConTime(\''+c.id+'\')">-30 د</button>';
        h+='</div></div>';
        if(a){
            h+='<div class="pc-card-body"><div class="consumption-list">'+co.map(x=>'<div class="consumption-item"><span>'+x.name+' ×'+x.qty+'</span><span>'+x.price*x.qty+' دج</span></div>').join('')+'</div>';
            h+='<div class="pc-total"><span>الوقت+السلع:</span><span class="pc-total-amount">'+(tt+ct)+' دج</span></div></div>';
            h+='<div class="pc-card-actions">';
            h+='<button class="btn-sm btn-add" onclick="openConModal(\'console\',\''+c.id+'\')"><i class="fas fa-plus"></i> سلع</button>';
            h+='<button class="btn-sm btn-checkout" onclick="openChkModal(\'console\',\''+c.id+'\')"><i class="fas fa-receipt"></i> حساب</button>';
            h+='</div>';
        }
        h+='</div>';
    });
    g.innerHTML=h;
}

function addConTime(id,min){
    const d=getData();
    if(!d.consoleSessions[id])d.consoleSessions[id]={startTime:Date.now(),remainingMinutes:0,totalHalves:0,consumption:[],worker:currentUser};
    d.consoleSessions[id].remainingMinutes+=min;
    d.consoleSessions[id].totalHalves+=(min/30);
    saveData(d);renderCon();updateOv();
}
function rmConTime(id){
    const d=getData(),s=d.consoleSessions[id];
    if(s&&s.remainingMinutes>=30){
        s.remainingMinutes-=30;
        s.totalHalves=Math.max(0,s.totalHalves-1);
        saveData(d);renderCon();
    }
}
function startConTimers(){
    setInterval(()=>{
        const d=getData();let ch=false;
        for(let id in d.consoleSessions){
            const s=d.consoleSessions[id];
            if(s&&s.remainingMinutes>0){
                s.remainingMinutes-=1/60;
                if(s.remainingMinutes<0)s.remainingMinutes=0;
                ch=true;
                const el=document.getElementById('tm-'+id);
                if(el){
                    const m=Math.floor(s.remainingMinutes);
                    const sec=Math.floor((s.remainingMinutes-m)*60);
                    el.textContent=String(m).padStart(2,'0')+':'+String(sec).padStart(2,'0');
                }
            }
        }
        if(ch)saveData(d);
    },1000);
}

/* ===== SESSION MODAL ===== */
function openConModal(type,id){
    currentModal={type:type,id:id};
    modalCart=[];
    const d=getData();
    if(type==='pc'){
        document.getElementById('modalTitle').textContent='إضافة سلع لـ PC #'+id;
        document.getElementById('modalDeviceInfo').innerHTML='<i class="fas fa-desktop" style="color:var(--neon-blue)"></i> PC #'+id;
    }else{
        const c=d.consoles.find(x=>x.id===id);
        document.getElementById('modalTitle').textContent='إضافة سلع لـ '+c.name;
        document.getElementById('modalDeviceInfo').innerHTML=c.icon+' '+c.name;
    }
    const g=document.getElementById('modalProductsGrid');
    g.innerHTML=d.products.map(p=>'<div class="product-item" onclick="addMC('+p.id+')"><div class="product-emoji">'+p.emoji+'</div><div class="product-name">'+p.name+'</div><div class="product-price">'+p.price+' دج</div></div>').join('');
    renderMC();
    document.getElementById('sessionModal').classList.add('active');
}
function addMC(id){
    const d=getData(),p=d.products.find(x=>x.id===id);
    if(!p||p.stock<=0){alert('السلعة غير متوفرة');return;}
    const e=modalCart.find(x=>x.id===id);
    if(e){if(e.qty<p.stock)e.qty++;else alert('لا يوجد مخزون كافي');}
    else{modalCart.push({id:p.id,name:p.name,price:p.price,qty:1});}
    renderMC();
}
function renderMC(){
    const c=document.getElementById('modalCartItems'),t=document.getElementById('modalCartTotal');
    if(!modalCart.length){c.innerHTML='<p class="empty-msg" style="padding:4px">لم تختر سلعاً</p>';t.textContent='0 دج';return;}
    c.innerHTML=modalCart.map(x=>'<div class="cart-item"><span>'+x.name+' ×'+x.qty+'</span><span style="color:var(--neon-green)">'+x.price*x.qty+' دج</span></div>').join('');
    t.textContent=modalCart.reduce((s,x)=>s+x.price*x.qty,0)+' دج';
}

function saveSessionCon(){
    if(!modalCart.length){closeM('sessionModal');return;}
    const d=getData();
    const type=currentModal.type,id=currentModal.id;
    const s=type==='pc'?d.pcSessions['pc'+id]:d.consoleSessions[id];
    if(!s){alert('خطأ: الجلسة غير موجودة');return;}
    let total=0;const details=[];
    modalCart.forEach(ci=>{
        const e=s.consumption.find(x=>x.id===ci.id);
        if(e)e.qty+=ci.qty;
        else s.consumption.push({id:ci.id,name:ci.name,price:ci.price,qty:ci.qty});
        const p=d.products.find(x=>x.id===ci.id);
        if(p)p.stock=Math.max(0,p.stock-ci.qty);
        total+=ci.price*ci.qty;
        details.push(ci.name+'×'+ci.qty);
    });
    saveData(d);
    const dn=type==='pc'?'PC#'+id:d.consoles.find(c=>c.id===id).name;
    addTx('product_sale',total,dn+': '+details.join(', '));
    closeM('sessionModal');
    if(type==='pc')renderPC();else renderCon();
    updateOv();renderProdTable();
    alert('✅ تم إضافة السلع: '+total+' دج');
}

/* ===== CHECKOUT ===== */
function openChkModal(type,id){
    currentModal={type:type,id:id};
    const d=getData();
    const s=type==='pc'?d.pcSessions['pc'+id]:d.consoleSessions[id];
    if(!s)return;
    const dn=type==='pc'?'PC #'+id:d.consoles.find(c=>c.id===id).name;
    const co=s.consumption||[];
    const ct=co.reduce((a,c)=>a+c.price*c.qty,0);
    let tt=0,tl='';
    if(type==='pc'){
        const mins=s.elapsedMinutes||0;
        tt=Math.round((mins/60)*d.pcPricePerHour);
        tl='وقت اللعب ('+Math.floor(mins/60)+' س '+Math.floor(mins%60)+' د × '+d.pcPricePerHour+' دج/ساعة)';
    }else{
        tt=(s.totalHalves||0)*d.consolePricePerHalf;
        tl='وقت اللعب ('+(s.totalHalves||0)+' × نصف ساعة × '+d.consolePricePerHalf+' دج)';
    }
    let html='<div style="font-size:15px;font-weight:700;margin-bottom:8px">'+dn+'</div>';
    html+='<div style="display:flex;justify-content:space-between;margin:4px 0"><span>'+tl+':</span><strong style="color:var(--neon-blue)">'+tt+' دج</strong></div>';
    html+='<div style="font-weight:600;margin-top:8px;font-size:12px">السلع:</div>';
    html+='<div style="background:var(--bg-input);padding:8px;border-radius:6px;margin:4px 0;font-size:12px">';
    if(co.length){co.forEach(c=>{html+='<div style="display:flex;justify-content:space-between;padding:2px 0"><span>'+c.name+' ×'+c.qty+'</span><span>'+c.price*c.qty+' دج</span></div>';});}
    else{html+='<span style="color:var(--text-muted)">لا توجد سلع</span>';}
    html+='</div>';
    html+='<div style="display:flex;justify-content:space-between;margin:4px 0"><span>مجموع السلع:</span><strong style="color:var(--neon-orange)">'+ct+' دج</strong></div>';
    html+='<div style="display:flex;justify-content:space-between;font-size:20px;font-weight:900;margin-top:12px;padding-top:10px;border-top:1px solid var(--border-color)"><span>💰 المطلوب من الزبون:</span><span style="color:var(--neon-green)">'+(tt+ct)+' دج</span></div>';
    document.getElementById('checkoutSummary').innerHTML=html;
    document.getElementById('checkoutModal').classList.add('active');
}

function confirmChk(){
    const d=getData();
    const type=currentModal.type,id=currentModal.id;
    const s=type==='pc'?d.pcSessions['pc'+id]:d.consoleSessions[id];
    if(!s)return;
    const dn=type==='pc'?'PC #'+id:d.consoles.find(c=>c.id===id).name;
    let tt=0;
    if(type==='pc'){const mins=s.elapsedMinutes||0;tt=Math.round((mins/60)*d.pcPricePerHour);}
    else{tt=(s.totalHalves||0)*d.consolePricePerHalf;}
    if(tt>0) addTx(type==='pc'?'pc_time':'console_time',tt,dn+': وقت اللعب');
    if(type==='pc')delete d.pcSessions['pc'+id];else delete d.consoleSessions[id];
    saveData(d);
    closeM('checkoutModal');
    renderPC();renderCon();updateOv();
    alert('✅ تم قبض: '+tt+' دج (وقت اللعب)');
}
function closeM(id){document.getElementById(id).classList.remove('active');}

/* ===== QUICK SALE ===== */
function renderQS(){
    const d=getData();
    const cats={all:'📦 الكل',coffee:'☕ ساخنة',drinks:'🥤 باردة',chips:'🍿 شيبس',cake:'🍰 قاطو',food:'🍔 وجبات',other:'📦 أخرى'};
    const tabs=document.getElementById('qsCategoryTabs');
    if(!tabs)return;
    tabs.innerHTML=Object.entries(cats).map(([k,v])=>'<button class="cat-tab '+(k==='all'?'active':'')+'" onclick="filterQS(\''+k+'\',this)">'+v+'</button>').join('');
    renderQSG('all');
}
function filterQS(c,btn){
    document.querySelectorAll('#qsCategoryTabs .cat-tab').forEach(t=>t.classList.remove('active'));
    if(btn)btn.classList.add('active');
    renderQSG(c);
}
function renderQSG(c){
    const d=getData();
    const g=document.getElementById('qsProductsGrid');
    if(!g)return;
    const p=c==='all'?d.products:d.products.filter(x=>x.category===c);
    g.innerHTML=p.map(x=>'<div class="product-item" onclick="addQS('+x.id+')"><div class="product-emoji">'+x.emoji+'</div><div class="product-name">'+x.name+'</div><div class="product-price">'+x.price+' دج</div></div>').join('')||'<p class="empty-msg">لا توجد</p>';
}
function addQS(id){
    const d=getData(),p=d.products.find(x=>x.id===id);
    if(!p||p.stock<=0){alert('غير متوفرة');return;}
    const e=qsCart.find(x=>x.id===id);
    if(e){if(e.qty<p.stock)e.qty++;}
    else qsCart.push({id:p.id,name:p.name,price:p.price,qty:1});
    renderQSC();
}
function renderQSC(){
    const c=document.getElementById('qsInvoiceItems'),t=document.getElementById('qsTotal');
    if(!c)return;
    if(!qsCart.length){c.innerHTML='<p class="empty-msg">اختر سلعاً</p>';t.textContent='0 دج';return;}
    c.innerHTML=qsCart.map((item,idx)=>'<div class="invoice-item"><div class="item-info"><span class="item-remove" onclick="rmQS('+idx+')"><i class="fas fa-trash"></i></span> <span>'+item.name+'</span></div><div><button class="qty-btn" onclick="chQS('+idx+',-1)">-</button> <span>'+item.qty+'</span> <button class="qty-btn" onclick="chQS('+idx+',1)">+</button></div><div style="font-weight:700;color:var(--neon-green)">'+item.price*item.qty+' دج</div></div>').join('');
    t.textContent=qsCart.reduce((s,c)=>s+c.price*c.qty,0)+' دج';
}
function chQS(i,d){
    const data=getData(),item=qsCart[i],p=data.products.find(x=>x.id===item.id);
    item.qty+=d;
    if(item.qty<=0)qsCart.splice(i,1);
    else if(p&&item.qty>p.stock)item.qty=p.stock;
    renderQSC();
}
function rmQS(i){qsCart.splice(i,1);renderQSC();}
function completeQS(){
    if(!qsCart.length){alert('اختر سلعاً');return;}
    const d=getData();
    const tot=qsCart.reduce((s,c)=>s+c.price*c.qty,0);
    qsCart.forEach(item=>{const p=d.products.find(x=>x.id===item.id);if(p)p.stock=Math.max(0,p.stock-item.qty);});
    saveData(d);
    addTx('product_sale',tot,'بيع مباشر: '+qsCart.map(c=>c.name+'×'+c.qty).join(', '));
    qsCart=[];
    renderQSC();renderProdTable();updateOv();
    alert('✅ تم البيع: '+tot+' دج');
}

/* ===== PRODUCTS ===== */
function addProd(){
    const d=getData();
    const nm=document.getElementById('prodName').value.trim();
    const em=document.getElementById('prodEmoji').value||selectedEmojiAdd||'📦';
    const cat=document.getElementById('prodCategory').value;
    const pr=parseInt(document.getElementById('prodPrice').value);
    const st=parseInt(document.getElementById('prodStock').value);
    const ms=parseInt(document.getElementById('prodMinStock').value)||5;
    d.products.push({id:d.nextProductId++,name:nm,category:cat,price:pr,stock:st,minStock:ms,emoji:em});
    saveData(d);
    document.getElementById('addProductForm').reset();
    document.getElementById('prodEmoji').value='☕';
    selectedEmojiAdd='☕';
    renderProdTable();renderQS();updateOv();
    alert('✅ تمت إضافة '+nm);
}

function renderProdTable(){
    const tb=document.getElementById('productsTableBody');
    if(!tb)return;
    const d=getData();
    const cats={coffee:'☕ ساخنة',drinks:'🥤 باردة',chips:'🍿 مقرمشات',cake:'🍰 حلويات',food:'🍔 وجبات',other:'📦 أخرى'};
    tb.innerHTML=d.products.map(p=>{
        let sc='stock-ok',st='متوفر';
        if(p.stock<=0){sc='stock-out';st='نفد';}
        else if(p.stock<=p.minStock){sc='stock-low';st='منخفض';}
        return '<tr>'+
            '<td style="font-size:22px;text-align:center">'+p.emoji+'</td>'+
            '<td><strong>'+p.name+'</strong></td>'+
            '<td>'+(cats[p.category]||p.category)+'</td>'+
            '<td style="color:var(--neon-green)">'+p.price+' دج</td>'+
            '<td><strong>'+p.stock+'</strong></td>'+
            '<td><span class="stock-badge '+sc+'">'+st+'</span></td>'+
            '<td><button class="btn-sm btn-edit" onclick="openEditProd('+p.id+')"><i class="fas fa-edit"></i></button> <button class="btn-sm btn-clear" onclick="delProd('+p.id+')"><i class="fas fa-trash"></i></button></td>'+
        '</tr>';
    }).join('');
}

function openEditProd(id){
    const d=getData(),p=d.products.find(x=>x.id===id);
    if(!p)return;
    editingProdId=id;
    document.getElementById('editProdId').value=id;
    document.getElementById('editName').value=p.name;
    document.getElementById('editEmoji').value=p.emoji;
    document.getElementById('editCategory').value=p.category;
    document.getElementById('editPrice').value=p.price;
    document.getElementById('editStock').value=p.stock;
    document.getElementById('editMinStock').value=p.minStock;
    selectedEmojiEdit=p.emoji;
    renderEmojiPicker('emojiPickerEdit','editEmoji','edit');
    // تحديد الأيقونة الحالية
    setTimeout(()=>{
        document.querySelectorAll('#emojiPickerEdit .emoji-option').forEach(el=>{
            if(el.textContent===p.emoji)el.classList.add('selected');
        });
    },50);
    document.getElementById('editProductModal').classList.add('active');
}

function saveEditProd(){
    const d=getData();
    const id=parseInt(document.getElementById('editProdId').value);
    const p=d.products.find(x=>x.id===id);
    if(!p)return;
    p.name=document.getElementById('editName').value.trim();
    p.emoji=document.getElementById('editEmoji').value||selectedEmojiEdit||p.emoji;
    p.category=document.getElementById('editCategory').value;
    p.price=parseInt(document.getElementById('editPrice').value);
    p.stock=parseInt(document.getElementById('editStock').value);
    p.minStock=parseInt(document.getElementById('editMinStock').value)||5;
    saveData(d);
    closeM('editProductModal');
    renderProdTable();renderQS();updateOv();
    alert('✅ تم التعديل');
}

function delProd(id){
    if(!confirm('حذف نهائي؟'))return;
    const d=getData();
    d.products=d.products.filter(p=>p.id!==id);
    saveData(d);
    renderProdTable();renderQS();updateOv();
}

/* ===== OVERVIEW ===== */
function updateOv(){
    const d=getData();
    let ap=0,ac=0;
    for(let k in d.pcSessions)if(d.pcSessions[k]&&d.pcSessions[k].active)ap++;
    for(let k in d.consoleSessions)if(d.consoleSessions[k]&&d.consoleSessions[k].remainingMinutes>0)ac++;
    const my=getMyTx();
    const st=my.reduce((s,t)=>s+(Number(t.amount)||0),0);
    const pt=my.filter(t=>t.type==='pc_time'||t.type==='console_time').reduce((s,t)=>s+t.amount,0);
    const pd=my.filter(t=>t.type==='product_sale').reduce((s,t)=>s+t.amount,0);
    const opsCount=my.filter(t=>t.type!=='shift_end').length;
    const e=id=>document.getElementById(id);
    if(e('activePCs'))e('activePCs').textContent=ap;
    if(e('activeConsoles'))e('activeConsoles').textContent=ac;
    if(e('shiftRevenue'))e('shiftRevenue').textContent=st+' دج';
    if(e('dailyTotal'))e('dailyTotal').textContent=st+' دج';
    if(e('pcRevenue'))e('pcRevenue').textContent=pt+' دج';
    if(e('productRevenue'))e('productRevenue').textContent=pd+' دج';
    if(e('totalOrders'))e('totalOrders').textContent=opsCount;
    const bx=e('lowStockAlerts');
    if(bx){
        const low=d.products.filter(p=>p.stock<=p.minStock);
        bx.innerHTML=low.length?low.map(p=>'<div style="background:rgba(255,136,0,0.1);border:1px solid rgba(255,136,0,0.3);padding:6px 10px;border-radius:6px;margin-bottom:4px;font-size:12px">⚠️ <strong>'+p.emoji+' '+p.name+'</strong> - متبقي: <strong style="color:var(--neon-orange)">'+p.stock+'</strong></div>').join(''):'<p class="empty-msg" style="padding:4px">✅ المخزون جيد</p>';
    }
}

/* ===== CHARTS + REPORTS ===== */
function renderCharts(){
    const d=getData(),t=getToday();
    const tr=d.transactions.filter(x=>x.date===t);
    const pc=tr.filter(x=>x.type==='pc_time').reduce((s,x)=>s+x.amount,0);
    const co=tr.filter(x=>x.type==='console_time').reduce((s,x)=>s+x.amount,0);
    const pd=tr.filter(x=>x.type==='product_sale').reduce((s,x)=>s+x.amount,0);
    if(pieC)pieC.destroy();
    const pCtx=document.getElementById('revenuePieChart');
    if(pCtx){pieC=new Chart(pCtx,{type:'doughnut',data:{labels:['PC','كونسول','سلع'],datasets:[{data:[pc||1,co||1,pd||1],backgroundColor:['#00d4ff','#7b2ffa','#ff8800'],borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{color:'#e8e8f0',font:{family:'Tajawal'}}}}}});}
    if(barC)barC.destroy();
    const bCtx=document.getElementById('revenueBarChart');
    if(bCtx){barC=new Chart(bCtx,{type:'bar',data:{labels:['PC','كونسول','سلع'],datasets:[{label:'دج',data:[pc,co,pd],backgroundColor:['#00d4ff','#7b2ffa','#ff8800'],borderRadius:8}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{grid:{color:'#222244'},ticks:{color:'#7777aa'}},x:{grid:{display:false},ticks:{color:'#e8e8f0',font:{family:'Tajawal'}}}}}});}
}
function genReport(){
    const d=getData(),t=getToday();
    const tr=d.transactions.filter(x=>x.date===t);
    const tot=tr.reduce((s,x)=>s+x.amount,0);
    const pc=tr.filter(x=>x.type==='pc_time').reduce((s,x)=>s+x.amount,0);
    const co=tr.filter(x=>x.type==='console_time').reduce((s,x)=>s+x.amount,0);
    const pd=tr.filter(x=>x.type==='product_sale').reduce((s,x)=>s+x.amount,0);
    const mn=tr.filter(x=>x.shift==='morning').reduce((s,x)=>s+x.amount,0);
    const ev=tr.filter(x=>x.shift==='evening').reduce((s,x)=>s+x.amount,0);
    const e=id=>document.getElementById(id);
    if(e('reportTotal'))e('reportTotal').textContent=tot+' دج';
    if(e('reportPC'))e('reportPC').textContent=pc+' دج';
    if(e('reportConsole'))e('reportConsole').textContent=co+' دج';
    if(e('reportProducts'))e('reportProducts').textContent=pd+' دج';
    if(e('reportMorning'))e('reportMorning').textContent=mn+' دج';
    if(e('reportEvening'))e('reportEvening').textContent=ev+' دج';
    const lg=e('transactionLog');
    if(lg){
        const tp={pc_time:'🖥️ PC',console_time:'🎮 كونسول',product_sale:'🛒 سلع',shift_end:'🚪 نهاية وردية'};
        const sh={morning:'🌅 صباح',evening:'🌙 مساء',owner:'👑 مالك'};
        lg.innerHTML=[...tr].reverse().map(x=>'<tr><td>'+x.time+'</td><td>'+(tp[x.type]||x.type)+'</td><td>'+x.details+'</td><td style="color:var(--neon-green);font-weight:700">'+x.amount+' دج</td><td>'+(sh[x.shift]||x.shift)+'</td></tr>').join('')||'<tr><td colspan="5" class="empty-msg">لا توجد عمليات</td></tr>';
    }
}

function exportData(){
    const d=getData();
    const b=new Blob([JSON.stringify(d,null,2)],{type:'application/json'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(b);
    a.download='gaming-zone-'+getToday()+'.json';
    a.click();
}
function clearAllData(){
    if(confirm('⚠️ تصفير كل البيانات؟'))
        if(confirm('تأكيد نهائي؟')){
            localStorage.removeItem('gamingZoneData');
            location.reload();
        }
}
