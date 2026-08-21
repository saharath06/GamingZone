/* Gaming Zone v6 - Cloud Sync + PC Timed Sessions */

const CLOUD_API='https://api.jsonbin.io/v3/b/';

function getCloud(){
    try{return JSON.parse(localStorage.getItem('gzCloud')||'{}');}
    catch(e){return {};}
}
function saveCloud(c){localStorage.setItem('gzCloud',JSON.stringify(c));}

function updateSyncUI(status,text){
    const ind=document.getElementById('syncIndicator');
    if(!ind)return;
    ind.className='sync-indicator '+status;
    document.getElementById('syncText').textContent=text;
}

async function cloudSave(data){
    const c=getCloud();
    if(!c.binId||!c.apiKey){updateSyncUI('offline','محلي فقط');return false;}
    updateSyncUI('syncing','يحفظ...');
    try{
        const res=await fetch(CLOUD_API+c.binId,{
            method:'PUT',
            headers:{'Content-Type':'application/json','X-Master-Key':c.apiKey},
            body:JSON.stringify(data)
        });
        if(res.ok){updateSyncUI('','✓ متزامن');return true;}
        updateSyncUI('offline','خطأ في الحفظ');return false;
    }catch(e){updateSyncUI('offline','لا يوجد إنترنت');return false;}
}

async function cloudLoad(){
    const c=getCloud();
    if(!c.binId||!c.apiKey)return null;
    updateSyncUI('syncing','يجلب البيانات...');
    try{
        const res=await fetch(CLOUD_API+c.binId+'/latest',{
            headers:{'X-Master-Key':c.apiKey}
        });
        if(res.ok){
            const j=await res.json();
            updateSyncUI('','✓ متزامن');
            return j.record;
        }
        updateSyncUI('offline','خطأ في التحميل');return null;
    }catch(e){updateSyncUI('offline','لا يوجد إنترنت');return null;}
}

async function saveCloudSettings(){
    const binId=document.getElementById('cloudBinId').value.trim();
    const apiKey=document.getElementById('cloudApiKey').value.trim();
    if(!binId||!apiKey){alert('يرجى ملء الحقلين');return;}
    saveCloud({binId,apiKey});
    alert('✅ تم حفظ الإعدادات\n\nسيتم رفع البيانات الحالية للسحابة الآن...');
    await cloudSave(getData());
    alert('✅ تمت المزامنة!\n\nالآن يمكنك فتح الموقع من الهاتف وسترى نفس البيانات.');
}

async function testCloud(){
    const c=getCloud();
    if(!c.binId||!c.apiKey){alert('❌ املأ الحقول أولاً');return;}
    updateSyncUI('syncing','جاري الاختبار...');
    const r=await cloudLoad();
    if(r){alert('✅ الاتصال ممتاز!\n\nآخر تحديث محفوظ في السحابة.');}
    else{alert('❌ فشل الاتصال. تحقق من:\n1. Bin ID صحيح\n2. API Key صحيح\n3. الإنترنت متصل');}
}

function getDefaultData(){
    return {
        pcPricePerHour:50,
        consolePricePerHalf:100,
        pcCount:9,
        products:[
            {id:1,name:'قهوة سوداء',category:'coffee',price:50,stock:50,minStock:10},
            {id:2,name:'قهوة حليب',category:'coffee',price:80,stock:50,minStock:10},
            {id:3,name:'كوكا كولا',category:'drinks',price:50,stock:40,minStock:10},
            {id:4,name:'ماء معدني',category:'drinks',price:30,stock:60,minStock:15},
            {id:5,name:'شيبس ليز',category:'chips',price:50,stock:30,minStock:8},
            {id:6,name:'قاطو شوكولا',category:'cake',price:60,stock:25,minStock:5},
            {id:7,name:'ساندويتش',category:'food',price:150,stock:15,minStock:3}
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
    try{return JSON.parse(localStorage.getItem('gzSettings')||'{}');}
    catch(e){return {};}
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
        const settings=getSettings();
        if(settings.pcPrice)d.pcPricePerHour=settings.pcPrice;
        if(settings.consolePrice)d.consolePricePerHalf=settings.consolePrice;
        return d;
    }catch(e){return getDefaultData();}
}

async function saveData(d){
    localStorage.setItem('gamingZoneData',JSON.stringify(d));
    // رفع للسحابة تلقائياً
    cloudSave(d);
}

let currentUser=null,currentModal=null,modalCart=[],qsCart=[],editingProdId=null;
let pieC=null,barC=null,openingPCNum=null;

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

async function addTx(type,amount,details){
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
    await saveData(d);
    return tx;
}

async function initDashboard(){
    currentUser=localStorage.getItem('currentUser')||'owner';
    document.body.className='dashboard-page role-'+currentUser;
    const A={owner:'👑',morning:'🌅',evening:'🌙'};
    const S={owner:'كامل الصلاحيات',morning:'وردية الصباح ☀️',evening:'وردية المساء 🌙'};
    const e=id=>document.getElementById(id);
    
    if(e('userName'))e('userName').textContent=getUserName(currentUser);
    if(e('userAvatar'))e('userAvatar').textContent=A[currentUser];
    if(e('userShift'))e('userShift').textContent=S[currentUser];
    if(e('shiftBadge'))e('shiftBadge').textContent=S[currentUser];
    
    // تحميل من السحابة أولاً
    const c=getCloud();
    if(c.binId&&c.apiKey){
        updateSyncUI('syncing','جاري المزامنة...');
        const cloudData=await cloudLoad();
        if(cloudData&&cloudData.transactions){
            localStorage.setItem('gamingZoneData',JSON.stringify(cloudData));
            updateSyncUI('','✓ متزامن');
        }
    }else{
        updateSyncUI('offline','محلي - غير متصل بالسحابة');
    }
    
    setupNav();
    updateClock();setInterval(updateClock,1000);
    renderPC();renderCon();renderProdTable();updateOv();renderQS();
    startConTimers();startPCTimers();
    loadSettingsForm();
    
    // مزامنة دورية كل 15 ثانية
    setInterval(async ()=>{
        const c=getCloud();
        if(c.binId&&c.apiKey){
            const cloudData=await cloudLoad();
            if(cloudData&&cloudData.transactions){
                const localTx=getData().transactions.length;
                const cloudTx=cloudData.transactions.length;
                if(cloudTx!==localTx){
                    localStorage.setItem('gamingZoneData',JSON.stringify(cloudData));
                    renderPC();renderCon();renderProdTable();updateOv();renderQS();
                }
            }
        }
    },15000);
    
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

function loadSettingsForm(){
    if(currentUser!=='owner')return;
    const s=getSettings();
    const d=getData();
    const c=getCloud();
    const e=id=>document.getElementById(id);
    if(e('morningWorkerName'))e('morningWorkerName').value=s.morningName||'';
    if(e('morningWorkerPass'))e('morningWorkerPass').value=s.morningPass||'morning123';
    if(e('eveningWorkerName'))e('eveningWorkerName').value=s.eveningName||'';
    if(e('eveningWorkerPass'))e('eveningWorkerPass').value=s.eveningPass||'evening123';
    if(e('ownerName'))e('ownerName').value=s.ownerName||'';
    if(e('ownerPass'))e('ownerPass').value=s.ownerPass||'owner123';
    if(e('pcPriceInput'))e('pcPriceInput').value=d.pcPricePerHour;
    if(e('consolePriceInput'))e('consolePriceInput').value=d.consolePricePerHalf;
    if(e('cloudBinId'))e('cloudBinId').value=c.binId||'';
    if(e('cloudApiKey'))e('cloudApiKey').value=c.apiKey||'';
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
    alert('✅ تم الحفظ');
    document.getElementById('userName').textContent=getUserName(currentUser);
}

async function savePrices(){
    const s=getSettings();
    const pcP=parseInt(document.getElementById('pcPriceInput').value);
    const conP=parseInt(document.getElementById('consolePriceInput').value);
    if(pcP>0)s.pcPrice=pcP;
    if(conP>0)s.consolePrice=conP;
    saveSettings(s);
    const d=getData();
    if(pcP>0)d.pcPricePerHour=pcP;
    if(conP>0)d.consolePricePerHalf=conP;
    await saveData(d);
    renderPC();renderCon();
    alert('✅ تم حفظ الأسعار');
}

/* ===== END SHIFT + INVOICE ===== */
async function endShift(){
    if(currentUser==='owner'){alert('المالك لا يحتاج إنهاء وردية');return;}
    const my=getMyTx();
    const tot=my.reduce((s,t)=>s+(Number(t.amount)||0),0);
    const nm=currentUser==='morning'?'الصباح ☀️':'المساء 🌙';
    if(!confirm('⚠️ إنهاء وردية '+nm+'؟\n\nإجمالي: '+tot+' دج\nعمليات: '+my.length))return;
    
    buildAccountingInvoice(my,tot,nm);
    await addTx('shift_end',0,'انتهاء وردية '+nm+' - الإجمالي: '+tot+' دج');
    
    setTimeout(()=>{
        window.print();
        setTimeout(()=>{alert('✅ تم إنهاء الوردية');logout();},1000);
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
    const realTx=transactions.filter(t=>t.type!=='shift_end');
    
    let h='<div class="acc-container">';
    h+='<div class="acc-header"><div class="acc-logo">🎮</div><h1>GAMING ZONE</h1><p>نظام إدارة صالة الألعاب</p></div>';
    h+='<div class="acc-title">📋 فاتورة محاسبة الوردية 📋</div><div class="acc-body">';
    h+='<div class="acc-meta">';
    h+='<div class="acc-meta-row"><span>👤 <strong>العامل:</strong></span><span>'+workerName+'</span></div>';
    h+='<div class="acc-meta-row"><span>👑 <strong>المستلم:</strong></span><span>'+ownerName+'</span></div>';
    h+='<div class="acc-meta-row"><span>📅 <strong>التاريخ:</strong></span><span>'+dateStr+'</span></div>';
    h+='<div class="acc-meta-row"><span>🕐 <strong>الوقت:</strong></span><span>'+timeStr+'</span></div>';
    h+='<div class="acc-meta-row"><span>⏰ <strong>الوردية:</strong></span><span>'+shiftName+'</span></div>';
    h+='<div class="acc-meta-row"><span>📊 <strong>العمليات:</strong></span><span>'+realTx.length+'</span></div></div>';
    h+='<div class="acc-section-title">💰 ملخص المداخيل</div>';
    h+='<table class="acc-table"><thead><tr><th>النوع</th><th style="text-align:center">العدد</th><th style="text-align:left">المبلغ</th></tr></thead><tbody>';
    h+='<tr><td>🖥️ أجهزة PC</td><td style="text-align:center">'+pcCount+'</td><td style="text-align:left" class="num">'+pcTotal+' دج</td></tr>';
    h+='<tr><td>🎮 الكونسول</td><td style="text-align:center">'+consCount+'</td><td style="text-align:left" class="num">'+consTotal+' دج</td></tr>';
    h+='<tr><td>🛒 السلع</td><td style="text-align:center">'+prodCount+'</td><td style="text-align:left" class="num">'+prodTotal+' دج</td></tr>';
    h+='</tbody></table>';
    if(realTx.length>0){
        h+='<div class="acc-section-title">📋 سجل العمليات</div>';
        h+='<table class="acc-table"><thead><tr><th>الوقت</th><th>النوع</th><th>التفاصيل</th><th style="text-align:left">المبلغ</th></tr></thead><tbody>';
        const tp={pc_time:'🖥️ PC',console_time:'🎮 كونسول',product_sale:'🛒 سلع'};
        realTx.forEach(t=>{
            const sh=t.details.length>55?t.details.substring(0,55)+'...':t.details;
            h+='<tr><td>'+t.time+'</td><td>'+(tp[t.type]||t.type)+'</td><td style="font-size:9px">'+sh+'</td><td style="text-align:left" class="num">'+t.amount+' دج</td></tr>';
        });
        h+='</tbody></table>';
    }
    h+='<div class="acc-summary">';
    h+='<div class="acc-sum-row"><span>💰 مداخيل الأجهزة:</span><span>'+(pcTotal+consTotal)+' دج</span></div>';
    h+='<div class="acc-sum-row"><span>🛒 مداخيل السلع:</span><span>'+prodTotal+' دج</span></div>';
    h+='<div class="acc-grand"><span>💵 الإجمالي للتسليم:</span><span>'+total+' دج</span></div></div>';
    h+='<div class="acc-signature">';
    h+='<div class="acc-sign-box"><div class="acc-sign-line">توقيع العامل</div><div>'+workerName+'</div></div>';
    h+='<div class="acc-sign-box"><div class="acc-sign-line">توقيع المالك</div><div>'+ownerName+'</div></div></div>';
    h+='</div><div class="acc-footer"><p class="thanks">🎮 GAMING ZONE 🎮</p></div></div>';
    document.getElementById('printInvoice').innerHTML=h;
}

/* ===== PC (with open/timed modes) ===== */
function renderPC(){
    const g=document.getElementById('pcGrid');if(!g)return;
    const d=getData();let h='';
    for(let i=1;i<=d.pcCount;i++){
        const s=d.pcSessions['pc'+i],a=s&&s.active;
        let displayText='',displayColor='var(--neon-blue)',modeText='';
        
        if(a){
            if(s.mode==='timed'){
                // وقت محدد - عداد تنازلي
                const elapsed=(Date.now()-s.startTime)/60000;
                const remaining=Math.max(0,s.totalMinutes-elapsed);
                const rh=Math.floor(remaining/60),rm=Math.floor(remaining%60);
                displayText=String(rh).padStart(2,'0')+':'+String(rm).padStart(2,'0');
                modeText='⏰ محدد '+s.totalMinutes+' د | مدفوع مسبقاً: <strong>'+s.paidAmount+' دج</strong>';
                if(remaining<=0){displayColor='var(--neon-red)';modeText='⏰ انتهى الوقت! | <strong>'+s.paidAmount+' دج</strong>';}
                else if(remaining<=5){displayColor='var(--neon-orange)';}
            }else{
                // وقت مفتوح - عداد تصاعدي
                const elapsed=s.elapsedMinutes||0;
                const eh=Math.floor(elapsed/60),em=Math.floor(elapsed%60);
                const cost=Math.round((elapsed/60)*d.pcPricePerHour);
                displayText=String(eh).padStart(2,'0')+':'+String(em).padStart(2,'0');
                modeText='∞ مفتوح | الحساب الحالي: <strong>'+cost+' دج</strong>';
            }
        }
        
        const co=s?s.consumption||[]:[],ct=co.reduce((a,c)=>a+c.price*c.qty,0);
        
        h+='<div class="pc-card '+(a?'active':'')+'">';
        h+='<div class="pc-card-header"><div class="pc-name"><i class="fas fa-desktop"></i> PC #'+i+'</div>';
        h+='<span class="pc-status '+(a?'busy':'free')+'">'+(a?(s.mode==='timed'?'⏰ محدد':'∞ مفتوح'):'⚫ شاغر')+'</span></div>';
        h+='<div class="pc-card-body">';
        if(a){
            h+='<div class="pc-timer-display" id="pct-'+i+'" style="color:'+displayColor+'">'+displayText+'</div>';
            h+='<div class="pc-price-info">'+modeText+'</div>';
            h+='<div style="font-weight:600;margin-top:5px">🛒 سلع مضافة:</div><div class="consumption-list">';
            h+=co.length?co.map(c=>'<div class="consumption-item"><span>'+c.name+' ×'+c.qty+'</span><span>'+c.price*c.qty+' دج</span></div>').join(''):'<p class="empty-msg" style="padding:3px">لا توجد</p>';
            h+='</div><div class="pc-total"><span>مجموع السلع:</span><span class="pc-total-amount">'+ct+' دج</span></div>';
        }else{
            h+='<p class="empty-msg">الجهاز شاغر</p>';
        }
        h+='</div><div class="pc-card-actions">';
        if(a){
            h+='<button class="btn-sm btn-add" onclick="openConModal(\'pc\','+i+')"><i class="fas fa-plus"></i> سلع</button>';
            h+='<button class="btn-sm btn-checkout" onclick="openChkModal(\'pc\','+i+')"><i class="fas fa-receipt"></i> حساب/إنهاء</button>';
        }else{
            h+='<button class="btn-sm btn-add" onclick="openPCModal('+i+')"><i class="fas fa-play"></i> تشغيل</button>';
        }
        h+='</div></div>';
    }
    g.innerHTML=h;
}

function openPCModal(n){
    openingPCNum=n;
    const d=getData();
    document.getElementById('pcOpenTitle').textContent='فتح PC #'+n;
    document.getElementById('price30').textContent=Math.round(d.pcPricePerHour/2)+' دج';
    document.getElementById('price60').textContent=d.pcPricePerHour+' دج';
    document.getElementById('price120').textContent=(d.pcPricePerHour*2)+' دج';
    document.getElementById('price180').textContent=(d.pcPricePerHour*3)+' دج';
    document.getElementById('pcOpenModal').classList.add('active');
}

async function startPCOpen(){
    const d=getData();
    d.pcSessions['pc'+openingPCNum]={active:true,mode:'open',startTime:Date.now(),elapsedMinutes:0,consumption:[],worker:currentUser};
    await saveData(d);
    closeM('pcOpenModal');
    renderPC();updateOv();
    alert('✅ تم فتح PC #'+openingPCNum+' بوقت مفتوح');
}

async function startPCTimed(minutes){
    const d=getData();
    const cost=Math.round((minutes/60)*d.pcPricePerHour);
    d.pcSessions['pc'+openingPCNum]={
        active:true,mode:'timed',
        startTime:Date.now(),
        totalMinutes:minutes,
        paidAmount:cost,
        consumption:[],worker:currentUser
    };
    await saveData(d);
    // ✅ إضافة الحساب مباشرة للوردية
    await addTx('pc_time',cost,'PC#'+openingPCNum+': '+minutes+' دقيقة (وقت محدد)');
    closeM('pcOpenModal');
    renderPC();updateOv();
    alert('✅ تم فتح PC #'+openingPCNum+' لمدة '+minutes+' دقيقة\n💰 تم تسجيل '+cost+' دج في ورديتك مباشرة');
}

async function startPCCustom(){
    const min=parseInt(document.getElementById('customMinutes').value);
    if(!min||min<=0){alert('أدخل عدد دقائق صحيح');return;}
    await startPCTimed(min);
    document.getElementById('customMinutes').value='';
}

function startPCTimers(){
    setInterval(()=>{
        const d=getData();let ch=false;
        for(let k in d.pcSessions){
            const s=d.pcSessions[k];
            if(s&&s.active){
                if(s.mode==='open'){
                    s.elapsedMinutes=(Date.now()-s.startTime)/60000;
                    ch=true;
                    const num=k.replace('pc','');
                    const el=document.getElementById('pct-'+num);
                    if(el){
                        const hr=Math.floor(s.elapsedMinutes/60),mn=Math.floor(s.elapsedMinutes%60);
                        el.textContent=String(hr).padStart(2,'0')+':'+String(mn).padStart(2,'0');
                    }
                }else if(s.mode==='timed'){
                    const elapsed=(Date.now()-s.startTime)/60000;
                    const remaining=Math.max(0,s.totalMinutes-elapsed);
                    const num=k.replace('pc','');
                    const el=document.getElementById('pct-'+num);
                    if(el){
                        const rh=Math.floor(remaining/60),rm=Math.floor(remaining%60);
                        el.textContent=String(rh).padStart(2,'0')+':'+String(rm).padStart(2,'0');
                        if(remaining<=0)el.style.color='var(--neon-red)';
                        else if(remaining<=5)el.style.color='var(--neon-orange)';
                    }
                }
            }
        }
        if(ch)localStorage.setItem('gamingZoneData',JSON.stringify(d));
    },3000);
}

/* ===== CONSOLES ===== */
function renderCon(){
    const g=document.getElementById('consolesGrid');if(!g)return;
    const d=getData();let h='';
    d.consoles.forEach(c=>{
        const s=d.consoleSessions[c.id],a=s&&s.remainingMinutes>0;
        const co=s?s.consumption||[]:[],ct=co.reduce((a,x)=>a+x.price*x.qty,0);
        const tt=s?(s.totalHalves||0)*d.consolePricePerHalf:0;
        const rm=s?s.remainingMinutes||0:0,mi=Math.floor(rm),sc=Math.floor((rm-mi)*60);
        
        h+='<div class="console-card '+(a?'active':'')+'">';
        h+='<div class="console-card-header"><div class="console-name"><span style="font-size:18px">'+c.icon+'</span> '+c.name+'</div>';
        h+='<span class="pc-status '+(a?'busy':'free')+'">'+(a?'🟢 يلعب':'⚫ متوقف')+'</span></div>';
        h+='<div class="console-timer"><div class="timer-display" id="tm-'+c.id+'">'+String(mi).padStart(2,'0')+':'+String(sc).padStart(2,'0')+'</div>';
        h+='<div class="console-price-info">نصف ساعة = <strong>'+d.consolePricePerHalf+' دج</strong>'+(a?' | مدفوع: <strong>'+tt+' دج</strong>':'')+'</div>';
        h+='<div class="timer-controls">';
        h+='<button class="btn-timer add-time" onclick="addConTime(\''+c.id+'\',30)">+30 د</button>';
        h+='<button class="btn-timer add-time" onclick="addConTime(\''+c.id+'\',60)">+1 س</button>';
        if(a)h+='<button class="btn-timer remove-time" onclick="rmConTime(\''+c.id+'\')">-30 د</button>';
        h+='</div></div>';
        if(a){
            h+='<div class="pc-card-body"><div class="consumption-list">'+co.map(x=>'<div class="consumption-item"><span>'+x.name+' ×'+x.qty+'</span><span>'+x.price*x.qty+' دج</span></div>').join('')+'</div>';
            h+='<div class="pc-total"><span>مجموع السلع:</span><span class="pc-total-amount">'+ct+' دج</span></div></div>';
            h+='<div class="pc-card-actions">';
            h+='<button class="btn-sm btn-add" onclick="openConModal(\'console\',\''+c.id+'\')"><i class="fas fa-plus"></i> سلع</button>';
            h+='<button class="btn-sm btn-checkout" onclick="openChkModal(\'console\',\''+c.id+'\')"><i class="fas fa-receipt"></i> إنهاء</button>';
            h+='</div>';
        }
        h+='</div>';
    });
    g.innerHTML=h;
}

async function addConTime(id,min){
    const d=getData();
    const price=(min/30)*d.consolePricePerHalf;
    if(!d.consoleSessions[id])d.consoleSessions[id]={startTime:Date.now(),remainingMinutes:0,totalHalves:0,consumption:[],worker:currentUser};
    d.consoleSessions[id].remainingMinutes+=min;
    d.consoleSessions[id].totalHalves+=(min/30);
    await saveData(d);
    // ✅ تسجيل الحساب مباشرة
    const consoleName=d.consoles.find(c=>c.id===id).name;
    await addTx('console_time',price,consoleName+': +'+min+' دقيقة');
    renderCon();updateOv();
}

async function rmConTime(id){
    const d=getData(),s=d.consoleSessions[id];
    if(s&&s.remainingMinutes>=30){
        s.remainingMinutes-=30;
        s.totalHalves=Math.max(0,s.totalHalves-1);
        await saveData(d);renderCon();
    }
}

function startConTimers(){
    setInterval(()=>{
        const d=getData();let ch=false;
        for(let id in d.consoleSessions){
            const s=d.consoleSessions[id];
            if(s&&s.remainingMinutes>0){
                s.remainingMinutes-=1/60;if(s.remainingMinutes<0)s.remainingMinutes=0;ch=true;
                const el=document.getElementById('tm-'+id);
                if(el){const m=Math.floor(s.remainingMinutes),sec=Math.floor((s.remainingMinutes-m)*60);el.textContent=String(m).padStart(2,'0')+':'+String(sec).padStart(2,'0');}
            }
        }
        if(ch)localStorage.setItem('gamingZoneData',JSON.stringify(d));
    },1000);
}

/* ===== SESSION PRODUCTS ===== */
function openConModal(type,id){
    currentModal={type:type,id:id};modalCart=[];
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
    g.innerHTML=d.products.map(p=>'<div class="product-item" onclick="addMC('+p.id+')"><div class="product-name">'+p.name+'</div><div class="product-price">'+p.price+' دج</div></div>').join('');
    renderMC();
    document.getElementById('sessionModal').classList.add('active');
}
function addMC(id){
    const d=getData(),p=d.products.find(x=>x.id===id);
    if(!p||p.stock<=0){alert('نفدت');return;}
    const e=modalCart.find(x=>x.id===id);
    if(e){if(e.qty<p.stock)e.qty++;}else modalCart.push({id:p.id,name:p.name,price:p.price,qty:1});
    renderMC();
}
function renderMC(){
    const c=document.getElementById('modalCartItems'),t=document.getElementById('modalCartTotal');
    if(!modalCart.length){c.innerHTML='<p class="empty-msg" style="padding:4px">لم تختر سلعاً</p>';t.textContent='0 دج';return;}
    c.innerHTML=modalCart.map(x=>'<div class="cart-item"><span>'+x.name+' ×'+x.qty+'</span><span style="color:var(--neon-green)">'+x.price*x.qty+' دج</span></div>').join('');
    t.textContent=modalCart.reduce((s,x)=>s+x.price*x.qty,0)+' دج';
}

async function saveSessionCon(){
    if(!modalCart.length){closeM('sessionModal');return;}
    const d=getData(),type=currentModal.type,id=currentModal.id;
    const s=type==='pc'?d.pcSessions['pc'+id]:d.consoleSessions[id];
    if(!s){alert('خطأ');return;}
    let total=0;const details=[];
    modalCart.forEach(ci=>{
        const e=s.consumption.find(x=>x.id===ci.id);
        if(e)e.qty+=ci.qty;else s.consumption.push({id:ci.id,name:ci.name,price:ci.price,qty:ci.qty});
        const p=d.products.find(x=>x.id===ci.id);if(p)p.stock=Math.max(0,p.stock-ci.qty);
        total+=ci.price*ci.qty;details.push(ci.name+'×'+ci.qty);
    });
    await saveData(d);
    const dn=type==='pc'?'PC#'+id:d.consoles.find(c=>c.id===id).name;
    await addTx('product_sale',total,dn+': '+details.join(', '));
    closeM('sessionModal');
    if(type==='pc')renderPC();else renderCon();
    updateOv();renderProdTable();
    alert('✅ تم: '+total+' دج');
}

/* ===== CHECKOUT ===== */
function openChkModal(type,id){
    currentModal={type:type,id:id};const d=getData();
    const s=type==='pc'?d.pcSessions['pc'+id]:d.consoleSessions[id];if(!s)return;
    const dn=type==='pc'?'PC #'+id:d.consoles.find(c=>c.id===id).name;
    const co=s.consumption||[],ct=co.reduce((a,c)=>a+c.price*c.qty,0);
    let tt=0,tl='',alreadyPaid=false;
    
    if(type==='pc'){
        if(s.mode==='timed'){
            tt=s.paidAmount||0;
            tl='وقت اللعب ('+s.totalMinutes+' د - مدفوع مسبقاً)';
            alreadyPaid=true;
        }else{
            const mins=s.elapsedMinutes||0;
            tt=Math.round((mins/60)*d.pcPricePerHour);
            tl='وقت اللعب ('+Math.floor(mins/60)+' س '+Math.floor(mins%60)+' د)';
        }
    }else{
        tt=(s.totalHalves||0)*d.consolePricePerHalf;
        tl='وقت اللعب (مسجل مسبقاً)';
        alreadyPaid=true;
    }
    
    let html='<div style="font-size:15px;font-weight:700;margin-bottom:8px">'+dn+'</div>';
    if(alreadyPaid){
        html+='<div style="background:rgba(0,255,136,0.1);border:1px solid rgba(0,255,136,0.3);padding:8px;border-radius:6px;margin-bottom:8px;color:var(--neon-green);font-size:12px">✅ '+tl+': <strong>'+tt+' دج (تم دفعه مسبقاً)</strong></div>';
    }else{
        html+='<div style="display:flex;justify-content:space-between;margin:4px 0"><span>'+tl+':</span><strong style="color:var(--neon-blue)">'+tt+' دج</strong></div>';
    }
    html+='<div style="font-weight:600;margin-top:8px;font-size:12px">السلع:</div>';
    html+='<div style="background:var(--bg-input);padding:8px;border-radius:6px;margin:4px 0;font-size:12px">';
    if(co.length){co.forEach(c=>{html+='<div style="display:flex;justify-content:space-between;padding:2px 0"><span>'+c.name+' ×'+c.qty+'</span><span>'+c.price*c.qty+' دج</span></div>';});}
    else{html+='<span style="color:var(--text-muted)">لا توجد</span>';}
    html+='</div>';
    html+='<div style="display:flex;justify-content:space-between;margin:4px 0"><span>مجموع السلع:</span><strong style="color:var(--neon-orange)">'+ct+' دج</strong></div>';
    
    const totalToPay=alreadyPaid?ct:(tt+ct);
    html+='<div style="display:flex;justify-content:space-between;font-size:20px;font-weight:900;margin-top:12px;padding-top:10px;border-top:1px solid var(--border-color)"><span>💰 المطلوب الآن:</span><span style="color:var(--neon-green)">'+totalToPay+' دج</span></div>';
    
    document.getElementById('checkoutSummary').innerHTML=html;
    document.getElementById('checkoutModal').classList.add('active');
}

async function confirmChk(){
    const d=getData(),type=currentModal.type,id=currentModal.id;
    const s=type==='pc'?d.pcSessions['pc'+id]:d.consoleSessions[id];if(!s)return;
    const dn=type==='pc'?'PC #'+id:d.consoles.find(c=>c.id===id).name;
    
    // للوقت المفتوح فقط - تسجيل الحساب الآن
    if(type==='pc'&&s.mode==='open'){
        const mins=s.elapsedMinutes||0;
        const tt=Math.round((mins/60)*d.pcPricePerHour);
        if(tt>0) await addTx('pc_time',tt,dn+': وقت مفتوح - '+Math.floor(mins)+' دقيقة');
    }
    
    if(type==='pc')delete d.pcSessions['pc'+id];else delete d.consoleSessions[id];
    await saveData(d);
    closeM('checkoutModal');
    renderPC();renderCon();updateOv();
    alert('✅ تم إنهاء الجلسة');
}
function closeM(id){document.getElementById(id).classList.remove('active');}

/* ===== QUICK SALE ===== */
function renderQS(){
    const d=getData(),cats={all:'الكل',coffee:'ساخنة',drinks:'باردة',chips:'شيبس',cake:'قاطو',food:'وجبات',other:'أخرى'};
    const tabs=document.getElementById('qsCategoryTabs');if(!tabs)return;
    tabs.innerHTML=Object.entries(cats).map(([k,v])=>'<button class="cat-tab '+(k==='all'?'active':'')+'" onclick="filterQS(\''+k+'\',this)">'+v+'</button>').join('');
    renderQSG('all');
}
function filterQS(c,btn){
    document.querySelectorAll('#qsCategoryTabs .cat-tab').forEach(t=>t.classList.remove('active'));
    if(btn)btn.classList.add('active');renderQSG(c);
}
function renderQSG(c){
    const d=getData(),g=document.getElementById('qsProductsGrid');if(!g)return;
    const p=c==='all'?d.products:d.products.filter(x=>x.category===c);
    g.innerHTML=p.map(x=>'<div class="product-item" onclick="addQS('+x.id+')"><div class="product-name">'+x.name+'</div><div class="product-price">'+x.price+' دج</div></div>').join('')||'<p class="empty-msg">لا توجد</p>';
}
function addQS(id){
    const d=getData(),p=d.products.find(x=>x.id===id);if(!p||p.stock<=0){alert('نفدت');return;}
    const e=qsCart.find(x=>x.id===id);if(e){if(e.qty<p.stock)e.qty++;}else qsCart.push({id:p.id,name:p.name,price:p.price,qty:1});
    renderQSC();
}
function renderQSC(){
    const c=document.getElementById('qsInvoiceItems'),t=document.getElementById('qsTotal');if(!c)return;
    if(!qsCart.length){c.innerHTML='<p class="empty-msg">اختر سلعاً</p>';t.textContent='0 دج';return;}
    c.innerHTML=qsCart.map((item,idx)=>'<div class="invoice-item"><div class="item-info"><span class="item-remove" onclick="rmQS('+idx+')"><i class="fas fa-trash"></i></span> <span>'+item.name+'</span></div><div><button class="qty-btn" onclick="chQS('+idx+',-1)">-</button> <span>'+item.qty+'</span> <button class="qty-btn" onclick="chQS('+idx+',1)">+</button></div><div style="font-weight:700;color:var(--neon-green)">'+item.price*item.qty+' دج</div></div>').join('');
    t.textContent=qsCart.reduce((s,c)=>s+c.price*c.qty,0)+' دج';
}
function chQS(i,d){
    const data=getData(),item=qsCart[i],p=data.products.find(x=>x.id===item.id);item.qty+=d;
    if(item.qty<=0)qsCart.splice(i,1);else if(p&&item.qty>p.stock)item.qty=p.stock;
    renderQSC();
}
function rmQS(i){qsCart.splice(i,1);renderQSC();}
async function completeQS(){
    if(!qsCart.length){alert('اختر سلعاً');return;}
    const d=getData(),tot=qsCart.reduce((s,c)=>s+c.price*c.qty,0);
    qsCart.forEach(item=>{const p=d.products.find(x=>x.id===item.id);if(p)p.stock=Math.max(0,p.stock-item.qty);});
    await saveData(d);
    await addTx('product_sale',tot,'بيع مباشر: '+qsCart.map(c=>c.name+'×'+c.qty).join(', '));
    qsCart=[];renderQSC();renderProdTable();updateOv();
    alert('✅ تم البيع: '+tot+' دج');
}

/* ===== PRODUCTS ===== */
async function addProd(){
    const d=getData();
    const nm=document.getElementById('prodName').value.trim();
    const cat=document.getElementById('prodCategory').value;
    const pr=parseInt(document.getElementById('prodPrice').value);
    const st=parseInt(document.getElementById('prodStock').value);
    const ms=parseInt(document.getElementById('prodMinStock').value)||5;
    d.products.push({id:d.nextProductId++,name:nm,category:cat,price:pr,stock:st,minStock:ms});
    await saveData(d);
    document.getElementById('addProductForm').reset();
    renderProdTable();renderQS();updateOv();
    alert('✅ تمت الإضافة');
}

function renderProdTable(){
    const tb=document.getElementById('productsTableBody');if(!tb)return;
    const d=getData(),cats={coffee:'ساخنة',drinks:'باردة',chips:'مقرمشات',cake:'حلويات',food:'وجبات',other:'أخرى'};
    tb.innerHTML=d.products.map(p=>{
        let sc='stock-ok',st='متوفر';
        if(p.stock<=0){sc='stock-out';st='نفد';}
        else if(p.stock<=p.minStock){sc='stock-low';st='منخفض';}
        return '<tr><td><strong>'+p.name+'</strong></td><td>'+(cats[p.category]||p.category)+'</td><td style="color:var(--neon-green)">'+p.price+' دج</td><td><strong>'+p.stock+'</strong></td><td><span class="stock-badge '+sc+'">'+st+'</span></td><td><button class="btn-sm btn-edit" onclick="openEditProd('+p.id+')"><i class="fas fa-edit"></i></button> <button class="btn-sm btn-clear" onclick="delProd('+p.id+')"><i class="fas fa-trash"></i></button></td></tr>';
    }).join('');
}

function openEditProd(id){
    const d=getData(),p=d.products.find(x=>x.id===id);if(!p)return;
    editingProdId=id;
    document.getElementById('editProdId').value=id;
    document.getElementById('editName').value=p.name;
    document.getElementById('editCategory').value=p.category;
    document.getElementById('editPrice').value=p.price;
    document.getElementById('editStock').value=p.stock;
    document.getElementById('editMinStock').value=p.minStock;
    document.getElementById('editProductModal').classList.add('active');
}

async function saveEditProd(){
    const d=getData(),id=parseInt(document.getElementById('editProdId').value),p=d.products.find(x=>x.id===id);
    if(!p)return;
    p.name=document.getElementById('editName').value.trim();
    p.category=document.getElementById('editCategory').value;
    p.price=parseInt(document.getElementById('editPrice').value);
    p.stock=parseInt(document.getElementById('editStock').value);
    p.minStock=parseInt(document.getElementById('editMinStock').value)||5;
    await saveData(d);
    closeM('editProductModal');
    renderProdTable();renderQS();updateOv();
    alert('✅ تم التعديل');
}

async function delProd(id){
    if(!confirm('حذف؟'))return;
    const d=getData();d.products=d.products.filter(p=>p.id!==id);
    await saveData(d);renderProdTable();renderQS();updateOv();
}

/* ===== OVERVIEW ===== */
function updateOv(){
    const d=getData();let ap=0,ac=0;
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
        bx.innerHTML=low.length?low.map(p=>'<div style="background:rgba(255,136,0,0.1);border:1px solid rgba(255,136,0,0.3);padding:6px 10px;border-radius:6px;margin-bottom:4px;font-size:12px">⚠️ <strong>'+p.name+'</strong> - المتبقي: <strong style="color:var(--neon-orange)">'+p.stock+'</strong></div>').join(''):'<p class="empty-msg" style="padding:4px">✅ المخزون ممتاز</p>';
    }
}

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
    const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='gaming-zone-'+getToday()+'.json';a.click();
}
async function clearAllData(){
    if(confirm('تصفير كل البيانات؟'))if(confirm('تأكيد نهائي؟')){
        localStorage.removeItem('gamingZoneData');
        await cloudSave(getDefaultData());
        location.reload();
    }
}
