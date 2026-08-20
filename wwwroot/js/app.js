function getDefaultData() {
    return {
        consolePricePerHalf: 100, // 100 DA per 30 min
        products: [
            { id: 1, name: 'قهوة سوداء', category: 'coffee', price: 50, cost: 20, stock: 50, minStock: 10, emoji: '☕' },
            { id: 2, name: 'قهوة حليب', category: 'coffee', price: 80, cost: 35, stock: 50, minStock: 10, emoji: '☕' },
            { id: 3, name: 'كوكا كولا', category: 'drinks', price: 50, cost: 30, stock: 40, minStock: 10, emoji: '🥤' },
            { id: 4, name: 'ماء معدني', category: 'drinks', price: 30, cost: 15, stock: 60, minStock: 15, emoji: '💧' },
            { id: 5, name: 'شيبس ليز', category: 'chips', price: 50, cost: 30, stock: 30, minStock: 8, emoji: '🍿' },
            { id: 6, name: 'قاطو شوكولا', category: 'cake', price: 60, cost: 30, stock: 25, minStock: 5, emoji: '🍫' },
            { id: 7, name: 'ساندويتش', category: 'food', price: 150, cost: 80, stock: 15, minStock: 3, emoji: '🥪' }
        ],
        pcSessions: {},
        consoleSessions: {},
        transactions: [],
        consoles: [
            { id: 'xbox1', name: 'Xbox Series X #1', type: 'Xbox Series X', icon: '🎮' },
            { id: 'xbox2', name: 'Xbox Series X #2', type: 'Xbox Series X', icon: '🎮' },
            { id: 'xbox3', name: 'Xbox Series X #3', type: 'Xbox Series X', icon: '🎮' },
            { id: 'ps5', name: 'PlayStation 5', type: 'PS5', icon: '🕹️' }
        ],
        nextProductId: 8
    };
}

function getData() {
    const stored = localStorage.getItem('gamingZoneData');
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch(e) {
            return getDefaultData();
        }
    }
    const def = getDefaultData();
    saveData(def);
    return def;
}

function saveData(data) {
    localStorage.setItem('gamingZoneData', JSON.stringify(data));
}

let currentUser = null;
let currentModalSession = null;
let modalCart = [];
let quickSaleCart = [];

function initDashboard() {
    currentUser = localStorage.getItem('currentUser') || 'owner';
    document.body.className = `dashboard-page role-${currentUser}`;

    const names = { owner: 'المالك', morning: 'عامل الصباح', evening: 'عامل المساء' };
    const avatars = { owner: '👑', morning: '🌅', evening: '🌙' };
    const shifts = { owner: 'كامل الصلاحيات', morning: 'وردية الصباح', evening: 'وردية المساء' };

    if(document.getElementById('userName')) document.getElementById('userName').textContent = names[currentUser];
    if(document.getElementById('userAvatar')) document.getElementById('userAvatar').textContent = avatars[currentUser];
    if(document.getElementById('userShift')) document.getElementById('userShift').textContent = shifts[currentUser];
    if(document.getElementById('shiftBadge')) document.getElementById('shiftBadge').textContent = shifts[currentUser];

    setupNavigation();
    updateClock();
    setInterval(updateClock, 1000);

    renderPCGrid();
    renderConsolesGrid();
    renderProductsTable();
    updateOverview();
    renderQuickSaleProducts();
    startConsoleTimers();

    const addForm = document.getElementById('addProductForm');
    if (addForm) {
        addForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addProduct();
        });
    }
}

function updateClock() {
    const clock = document.getElementById('liveClock');
    if (clock) {
        clock.textContent = new Date().toLocaleTimeString('ar-DZ');
    }
}

function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.dataset.section;
            if(!section) return;
            
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            this.classList.add('active');
            
            document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
            const targetSection = document.getElementById(`section-${section}`);
            if(targetSection) targetSection.classList.add('active');

            if (section === 'overview') updateOverview();
            if (section === 'inventory') renderInventory();
            if (section === 'reports') generateReport();

            document.getElementById('sidebar').classList.remove('open');
        });
    });
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = '/index.html';
}

/* ========== PC LOGIC ========== */
function renderPCGrid() {
    const grid = document.getElementById('pcGrid');
    if (!grid) return;
    const data = getData();
    let html = '';
    
    for (let i = 1; i <= 8; i++) {
        const session = data.pcSessions[`pc${i}`];
        const isActive = session && session.active;
        const consumption = session ? session.consumption || [] : [];
        const consTotal = consumption.reduce((sum, c) => sum + (c.price * c.qty), 0);
        
        html += `
        <div class="pc-card ${isActive ? 'active' : ''}">
            <div class="pc-card-header">
                <div class="pc-name"><i class="fas fa-desktop"></i> PC #${i}</div>
                <span class="pc-status ${isActive ? 'busy' : 'free'}">${isActive ? '🟢 في اللعب' : '⚫ شاغر'}</span>
            </div>
            <div class="pc-card-body">
                ${isActive ? `
                    <div style="font-weight:600; margin-bottom:5px;">🛒 استهلاكات الزبون:</div>
                    <div class="pc-consumption-list">
                        ${consumption.length > 0 ? consumption.map(c => `
                            <div class="consumption-item"><span>${c.name} × ${c.qty}</span><span>${c.price * c.qty} دج</span></div>
                        `).join('') : '<p class="empty-msg" style="padding:5px">لا توجد سلع مضافة</p>'}
                    </div>
                    <div class="pc-total"><span>مجموع السلع:</span><span class="pc-total-amount">${consTotal} دج</span></div>
                ` : `<p class="empty-msg">الجهاز متاح للجلوس</p>`}
            </div>
            <div class="pc-card-actions">
                ${!isActive ? `
                    <button class="btn-sm btn-add" onclick="startPCSession(${i})"><i class="fas fa-play"></i> فتح الجهاز</button>
                ` : `
                    <button class="btn-sm btn-add" onclick="openConsumptionModal('pc', ${i})"><i class="fas fa-plus"></i> إضافة سلع</button>
                    <button class="btn-sm btn-checkout" onclick="openCheckoutModal('pc', ${i})"><i class="fas fa-receipt"></i> حساب وخروج</button>
                `}
            </div>
        </div>`;
    }
    grid.innerHTML = html;
}

function startPCSession(pcNum) {
    const data = getData();
    data.pcSessions[`pc${pcNum}`] = { active: true, startTime: new Date().toISOString(), consumption: [], worker: currentUser };
    saveData(data);
    renderPCGrid();
    updateOverview();
}

/* ========== CONSOLE LOGIC ========== */
function renderConsolesGrid() {
    const grid = document.getElementById('consolesGrid');
    if (!grid) return;
    const data = getData();
    let html = '';
    
    data.consoles.forEach(console => {
        const session = data.consoleSessions[console.id];
        const isActive = session && session.remainingMinutes > 0;
        const consumption = session ? session.consumption || [] : [];
        const consTotal = consumption.reduce((sum, c) => sum + (c.price * c.qty), 0);
        const timeTotal = session ? (session.totalHalves || 0) * data.consolePricePerHalf : 0;
        const remaining = session ? session.remainingMinutes || 0 : 0;
        const mins = Math.floor(remaining);
        const secs = Math.floor((remaining - mins) * 60);
        
        html += `
        <div class="console-card ${isActive ? 'active' : ''}">
            <div class="console-card-header">
                <div class="console-name"><span style="font-size:20px">${console.icon}</span> <span>${console.name}</span></div>
                <span class="pc-status ${isActive ? 'busy' : 'free'}">${isActive ? '🟢 يلعب الآن' : '⚫ متوقف'}</span>
            </div>
            <div class="console-timer">
                <div class="timer-display" id="timer-${console.id}">${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}</div>
                <div class="console-price-info">النصف ساعة = <strong>${data.consolePricePerHalf} دج</strong> ${isActive ? `| وقت اللعب: <strong>${timeTotal} دج</strong>` : ''}</div>
                <div class="timer-controls">
                    <button class="btn-timer add-time" onclick="addConsoleTime('${console.id}', 30)"><i class="fas fa-plus"></i> +30 دقيقة</button>
                    <button class="btn-timer add-time" onclick="addConsoleTime('${console.id}', 60)"><i class="fas fa-plus"></i> +1 ساعة</button>
                    ${isActive ? `<button class="btn-timer remove-time" onclick="removeConsoleTime('${console.id}')">-30 د</button>` : ''}
                </div>
            </div>
            ${isActive ? `
                <div class="pc-card-body">
                    <div class="pc-consumption-list">
                        ${consumption.map(c => `<div class="consumption-item"><span>${c.name} × ${c.qty}</span><span>${c.price * c.qty} دج</span></div>`).join('')}
                    </div>
                    <div class="pc-total"><span>المجموع الكلي:</span><span class="pc-total-amount">${consTotal + timeTotal} دج</span></div>
                </div>
                <div class="pc-card-actions">
                    <button class="btn-sm btn-add" onclick="openConsumptionModal('console', '${console.id}')"><i class="fas fa-plus"></i> إضافة سلع</button>
                    <button class="btn-sm btn-checkout" onclick="openCheckoutModal('console', '${console.id}')"><i class="fas fa-receipt"></i> حساب وخروج</button>
                </div>
            ` : ''}
        </div>`;
    });
    grid.innerHTML = html;
}

function addConsoleTime(consoleId, minutes) {
    const data = getData();
    if (!data.consoleSessions[consoleId]) {
        data.consoleSessions[consoleId] = { startTime: new Date().toISOString(), remainingMinutes: 0, totalHalves: 0, consumption: [], worker: currentUser };
    }
    const session = data.consoleSessions[consoleId];
    session.remainingMinutes += minutes;
    session.totalHalves += (minutes / 30);
    saveData(data);
    renderConsolesGrid();
    updateOverview();
}

function removeConsoleTime(consoleId) {
    const data = getData();
    const session = data.consoleSessions[consoleId];
    if (session && session.remainingMinutes >= 30) {
        session.remainingMinutes -= 30;
        session.totalHalves = Math.max(0, session.totalHalves - 1);
        saveData(data);
        renderConsolesGrid();
    }
}

function startConsoleTimers() {
    setInterval(() => {
        const data = getData();
        let changed = false;
        for (let id in data.consoleSessions) {
            const session = data.consoleSessions[id];
            if (session.remainingMinutes > 0) {
                session.remainingMinutes -= 1/60;
                if (session.remainingMinutes <= 0) session.remainingMinutes = 0;
                changed = true;
                const timerEl = document.getElementById(`timer-${id}`);
                if (timerEl) {
                    const mins = Math.floor(session.remainingMinutes);
                    const secs = Math.floor((session.remainingMinutes - mins) * 60);
                    timerEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
                }
            }
        }
        if (changed) saveData(data);
    }, 1000);
}

/* ========== QUICK SALE ========== */
function renderQuickSaleProducts() {
    const data = getData();
    const categories = { all: '📦 الكل', coffee: '☕ ساخنة', drinks: '🥤 باردة', chips: '🍿 شيبس', cake: '🍰 قاطو', food: '🍔 وجبات' };
    const tabsContainer = document.getElementById('qsCategoryTabs');
    if (!tabsContainer) return;
    tabsContainer.innerHTML = Object.entries(categories).map(([k, v]) => `<button class="cat-tab ${k === 'all' ? 'active' : ''}" onclick="filterQS('${k}', this)">${v}</button>`).join('');
    renderQSGrid('all');
}

function filterQS(cat, btn) {
    document.querySelectorAll('#qsCategoryTabs .cat-tab').forEach(t => t.classList.remove('active'));
    if(btn) btn.classList.add('active');
    renderQSGrid(cat);
}

function renderQSGrid(cat) {
    const data = getData();
    const grid = document.getElementById('qsProductsGrid');
    if (!grid) return;
    const prods = cat === 'all' ? data.products : data.products.filter(p => p.category === cat);
    grid.innerHTML = prods.map(p => `
        <div class="product-item" onclick="addToQS(${p.id})">
            <div class="product-emoji">${p.emoji}</div>
            <div class="product-name">${p.name}</div>
            <div class="product-price">${p.price} دج</div>
            <div style="font-size:10px;color:var(--text-secondary)">باقي: ${p.stock}</div>
        </div>
    `).join('') || '<p class="empty-msg">لا توجد منتجات</p>';
}

function addToQS(id) {
    const data = getData();
    const p = data.products.find(x => x.id === id);
    if (!p || p.stock <= 0) { alert('السلعة نفدت من المخزون!'); return; }
    const exist = quickSaleCart.find(x => x.id === id);
    if (exist) {
        if(exist.qty < p.stock) exist.qty++;
        else alert('وصلت للحد الأقصى المتوفر');
    } else {
        quickSaleCart.push({ id: p.id, name: p.name, price: p.price, qty: 1 });
    }
    renderQSCart();
}

function renderQSCart() {
    const container = document.getElementById('qsInvoiceItems');
    const totalEl = document.getElementById('qsTotal');
    if (!container) return;
    if (quickSaleCart.length === 0) {
        container.innerHTML = '<p class="empty-msg">اختر سلعاً لإضافتها للفاتورة</p>';
        totalEl.textContent = '0 دج';
        return;
    }
    container.innerHTML = quickSaleCart.map((item, idx) => `
        <div class="invoice-item">
            <div class="item-info"><span class="item-remove" onclick="removeQS(${idx})"><i class="fas fa-trash"></i></span> <span>${item.name}</span></div>
            <div>
                <button class="qty-btn" onclick="changeQSQty(${idx}, -1)">-</button>
                <span style="margin:0 5px">${item.qty}</span>
                <button class="qty-btn" onclick="changeQSQty(${idx}, 1)">+</button>
            </div>
            <div style="font-weight:700; color:var(--neon-green)">${item.price * item.qty} دج</div>
        </div>
    `).join('');
    totalEl.textContent = quickSaleCart.reduce((s, c) => s + (c.price * c.qty), 0) + ' دج';
}

function changeQSQty(idx, delta) {
    const data = getData();
    const item = quickSaleCart[idx];
    const p = data.products.find(x => x.id === item.id);
    item.qty += delta;
    if(item.qty <= 0) quickSaleCart.splice(idx, 1);
    else if(p && item.qty > p.stock) item.qty = p.stock;
    renderQSCart();
}

function removeQS(idx) { quickSaleCart.splice(idx, 1); renderQSCart(); }

function completeQuickSale() {
    if (quickSaleCart.length === 0) return;
    const data = getData();
    const total = quickSaleCart.reduce((s, c) => s + (c.price * c.qty), 0);
    quickSaleCart.forEach(item => {
        const p = data.products.find(x => x.id === item.id);
        if (p) p.stock = Math.max(0, p.stock - item.qty);
    });
    data.transactions.push({
        id: Date.now(),
        type: 'quick_sale',
        time: new Date().toISOString(),
        worker: currentUser,
        consumption: [...quickSaleCart],
        grandTotal: total,
        details: `بيع مباشر: ${quickSaleCart.map(c => c.name + ' × ' + c.qty).join(', ')}`
    });
    saveData(data);
    quickSaleCart = [];
    renderQSCart();
    renderProductsTable();
    updateOverview();
    alert(`تم البيع بنجاح! المبلغ المقبوض: ${total} دج`);
}

/* ========== MODAL CONSUMPTION ========== */
function openConsumptionModal(type, id) {
    currentModalSession = { type, id };
    modalCart = [];
    const modal = document.getElementById('sessionModal');
    const title = document.getElementById('modalTitle');
    const devInfo = document.getElementById('modalDeviceInfo');
    
    if (type === 'pc') {
        title.textContent = `إضافة استهلاك لـ PC #${id}`;
        devInfo.innerHTML = `<i class="fas fa-desktop" style="color:var(--neon-blue)"></i> جهاز كمبيوتر رقم ${id}`;
    } else {
        const data = getData();
        const c = data.consoles.find(x => x.id === id);
        title.textContent = `إضافة استهلاك لـ ${c.name}`;
        devInfo.innerHTML = `<span>${c.icon}</span> ${c.name}`;
    }
    renderModalProducts();
    renderModalCart();
    modal.classList.add('active');
}

function renderModalProducts() {
    const data = getData();
    const grid = document.getElementById('modalProductsGrid');
    grid.innerHTML = data.products.map(p => `
        <div class="product-item" onclick="addToModalCart(${p.id})">
            <div class="product-emoji">${p.emoji}</div>
            <div class="product-name">${p.name}</div>
            <div class="product-price">${p.price} دج</div>
            <div style="font-size:10px; color:var(--text-secondary)">باقي: ${p.stock}</div>
        </div>
    `).join('');
}

function addToModalCart(id) {
    const data = getData();
    const p = data.products.find(x => x.id === id);
    if (!p || p.stock <= 0) return;
    const exist = modalCart.find(x => x.id === id);
    if (exist) { if (exist.qty < p.stock) exist.qty++; }
    else { modalCart.push({ id: p.id, name: p.name, price: p.price, qty: 1 }); }
    renderModalCart();
}

function renderModalCart() {
    const container = document.getElementById('modalCartItems');
    const totalEl = document.getElementById('modalCartTotal');
    if (modalCart.length === 0) {
        container.innerHTML = '<p class="empty-msg" style="padding:5px">لم تختر أي سلعة</p>';
        totalEl.textContent = '0 دج';
        return;
    }
    container.innerHTML = modalCart.map((item, idx) => `
        <div class="cart-item">
            <span>${item.name} × ${item.qty}</span>
            <span style="color:var(--neon-green)">${item.price * item.qty} دج</span>
        </div>
    `).join('');
    totalEl.textContent = modalCart.reduce((s, c) => s + (c.price * c.qty), 0) + ' دج';
}

function saveSessionConsumption() {
    if (modalCart.length === 0) { closeModal('sessionModal'); return; }
    const data = getData();
    const { type, id } = currentModalSession;
    const session = type === 'pc' ? data.pcSessions[`pc${id}`] : data.consoleSessions[id];
    if (!session) return;

    modalCart.forEach(cartItem => {
        const exist = session.consumption.find(c => c.id === cartItem.id);
        if (exist) exist.qty += cartItem.qty;
        else session.consumption.push({ ...cartItem });

        const p = data.products.find(x => x.id === cartItem.id);
        if (p) p.stock = Math.max(0, p.stock - cartItem.qty);
    });

    saveData(data);
    closeModal('sessionModal');
    if (type === 'pc') renderPCGrid();
    else renderConsolesGrid();
    updateOverview();
    renderProductsTable();
}

/* ========== CHECKOUT MODAL ========== */
function openCheckoutModal(type, id) {
    currentModalSession = { type, id };
    const data = getData();
    const session = type === 'pc' ? data.pcSessions[`pc${id}`] : data.consoleSessions[id];
    if(!session) return;

    const devName = type === 'pc' ? `PC #${id}` : data.consoles.find(c => c.id === id).name;
    const cons = session.consumption || [];
    const consTotal = cons.reduce((s, c) => s + (c.price * c.qty), 0);
    const timeTotal = type === 'console' ? (session.totalHalves || 0) * data.consolePricePerHalf : 0;
    const grandTotal = consTotal + timeTotal;

    const summary = document.getElementById('checkoutSummary');
    summary.innerHTML = `
        <div style="font-size:16px; font-weight:700; margin-bottom:10px;">الجهاز: ${devName}</div>
        ${type === 'console' ? `
            <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                <span>وقت اللعب (${session.totalHalves || 0} × نصف ساعة):</span>
                <strong>${timeTotal} دج</strong>
            </div>
        ` : ''}
        <div style="margin-top:10px; font-weight:600;">السلع والمشروبات المستهلكة:</div>
        <div style="background:var(--bg-input); padding:10px; border-radius:8px; margin:5px 0;">
            ${cons.length > 0 ? cons.map(c => `
                <div style="display:flex; justify-content:space-between; padding:3px 0;">
                    <span>${c.name} × ${c.qty}</span>
                    <span>${c.price * c.qty} دج</span>
                </div>
            `).join('') : '<p style="color:var(--text-muted)">لا توجد سلع</p>'}
        </div>
        <div style="display:flex; justify-content:space-between; font-size:20px; font-weight:900; margin-top:15px; border-top:1px solid var(--border-color); padding-top:10px;">
            <span>💰 المجموع المطلوب:</span>
            <span style="color:var(--neon-green)">${grandTotal} دج</span>
        </div>
    `;
    document.getElementById('checkoutModal').classList.add('active');
}

function confirmCheckout() {
    const data = getData();
    const { type, id } = currentModalSession;
    const session = type === 'pc' ? data.pcSessions[`pc${id}`] : data.consoleSessions[id];
    if(!session) return;

    const devName = type === 'pc' ? `PC #${id}` : data.consoles.find(c => c.id === id).name;
    const cons = session.consumption || [];
    const consTotal = cons.reduce((s, c) => s + (c.price * c.qty), 0);
    const timeTotal = type === 'console' ? (session.totalHalves || 0) * data.consolePricePerHalf : 0;
    const grandTotal = consTotal + timeTotal;

    data.transactions.push({
        id: Date.now(),
        type: type === 'pc' ? 'pc_session' : 'console_session',
        time: new Date().toISOString(),
        worker: currentUser,
        grandTotal: grandTotal,
        details: `${devName}: وقت ${timeTotal} دج + سلع ${consTotal} دج`
    });

    if(type === 'pc') delete data.pcSessions[`pc${id}`];
    else delete data.consoleSessions[id];

    saveData(data);
    closeModal('checkoutModal');
    renderPCGrid();
    renderConsolesGrid();
    updateOverview();
    alert(`تم إنهاء الجلسة وقبض: ${grandTotal} دج`);
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

/* ========== PRODUCTS MANAGEMENT ========== */
function addProduct() {
    const data = getData();
    const name = document.getElementById('prodName').value.trim();
    const category = document.getElementById('prodCategory').value;
    const price = parseInt(document.getElementById('prodPrice').value);
    const stock = parseInt(document.getElementById('prodStock').value);
    const minStock = parseInt(document.getElementById('prodMinStock').value) || 5;

    const emojis = { coffee: '☕', drinks: '🥤', chips: '🍿', cake: '🍰', food: '🍔', other: '📦' };

    data.products.push({
        id: data.nextProductId++,
        name, category, price, stock, minStock,
        emoji: emojis[category] || '📦'
    });

    saveData(data);
    document.getElementById('addProductForm').reset();
    renderProductsTable();
    renderQuickSaleProducts();
    updateOverview();
    alert(`تمت إضافة ${name} بنجاح!`);
}

function renderProductsTable() {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;
    const data = getData();
    const cats = { coffee: '☕ ساخنة', drinks: '🥤 باردة', chips: '🍿 مقرمشات', cake: '🍰 حلويات', food: '🍔 وجبات', other: '📦 أخرى' };

    tbody.innerHTML = data.products.map(p => {
        let stClass = 'stock-ok', stText = 'متوفر';
        if (p.stock <= 0) { stClass = 'stock-out'; stText = 'نفد'; }
        else if (p.stock <= p.minStock) { stClass = 'stock-low'; stText = 'منخفض'; }

        return `
        <tr>
            <td><strong>${p.emoji} ${p.name}</strong></td>
            <td>${cats[p.category] || p.category}</td>
            <td style="color:var(--neon-green)">${p.price} دج</td>
            <td><strong>${p.stock}</strong></td>
            <td><span class="stock-badge ${stClass}">${stText}</span></td>
            <td><button class="btn-sm btn-clear" onclick="deleteProduct(${p.id})"><i class="fas fa-trash"></i></button></td>
        </tr>`;
    }).join('');
}

function deleteProduct(id) {
    if(!confirm('هل تريد حذف هذه السلعة نهائياً؟')) return;
    const data = getData();
    data.products = data.products.filter(p => p.id !== id);
    saveData(data);
    renderProductsTable();
    renderQuickSaleProducts();
    updateOverview();
}

/* ========== OVERVIEW & STATS ========== */
function updateOverview() {
    const data = getData();
    let actPCs = 0;
    for(let k in data.pcSessions) if(data.pcSessions[k] && data.pcSessions[k].active) actPCs++;

    let actCons = 0;
    for(let k in data.consoleSessions) if(data.consoleSessions[k] && data.consoleSessions[k].remainingMinutes > 0) actCons++;

    const totalRev = data.transactions.reduce((s, t) => s + (t.grandTotal || 0), 0);
    const totalOps = data.transactions.length;

    if(document.getElementById('activePCs')) document.getElementById('activePCs').textContent = actPCs;
    if(document.getElementById('activeConsoles')) document.getElementById('activeConsoles').textContent = actCons;
    if(document.getElementById('totalRevenue')) document.getElementById('totalRevenue').textContent = totalRev + ' دج';
    if(document.getElementById('dailyTotal')) document.getElementById('dailyTotal').textContent = totalRev + ' دج';
    if(document.getElementById('totalOrders')) document.getElementById('totalOrders').textContent = totalOps;

    // تنبيهات السلع
    const alertsBox = document.getElementById('lowStockAlerts');
    if (alertsBox) {
        const low = data.products.filter(p => p.stock <= p.minStock);
        if (low.length > 0) {
            alertsBox.innerHTML = low.map(p => `
                <div style="background:rgba(255,136,0,0.1); border:1px solid rgba(255,136,0,0.3); padding:8px 12px; border-radius:8px; margin-bottom:6px; font-size:13px;">
                    ⚠️ السلعة: <strong>${p.emoji} ${p.name}</strong> - الكمية المتبقية: <strong style="color:var(--neon-orange)">${p.stock}</strong> فقط! (الحد الأدنى: ${p.minStock})
                </div>
            `).join('');
        } else {
            alertsBox.innerHTML = '<p class="empty-msg" style="padding:5px">✅ جميع السلع متوفرة بكميات جيدة في المخزن</p>';
        }
    }
}

/* ========== REPORTS ========== */
function generateReport() {
    const data = getData();
    const totalRev = data.transactions.reduce((s, t) => s + (t.grandTotal || 0), 0);
    const pcRev = data.transactions.filter(t => t.type === 'pc_session').reduce((s, t) => s + (t.grandTotal || 0), 0);
    const consRev = data.transactions.filter(t => t.type === 'console_session').reduce((s, t) => s + (t.grandTotal || 0), 0);
    const prodRev = data.transactions.filter(t => t.type === 'quick_sale').reduce((s, t) => s + (t.grandTotal || 0), 0);

    if(document.getElementById('reportTotalRevenue')) document.getElementById('reportTotalRevenue').textContent = totalRev + ' دج';
    if(document.getElementById('reportPCRevenue')) document.getElementById('reportPCRevenue').textContent = pcRev + ' دج';
    if(document.getElementById('reportConsoleRevenue')) document.getElementById('reportConsoleRevenue').textContent = consRev + ' دج';
    if(document.getElementById('reportProductRevenue')) document.getElementById('reportProductRevenue').textContent = prodRev + ' دج';

    const log = document.getElementById('transactionLog');
    if (log) {
        const trans = [...data.transactions].reverse();
        log.innerHTML = trans.map(t => {
            const date = new Date(t.time).toLocaleTimeString('ar-DZ');
            const types = { pc_session: '🖥️ كمبيوتر', console_session: '🎮 كونسول', quick_sale: '🛒 بيع مباشر' };
            const workers = { owner: '👑 المالك', morning: '🌅 الصباح', evening: '🌙 المساء' };
            return `
            <tr>
                <td>${date}</td>
                <td>${types[t.type] || t.type}</td>
                <td>${t.details || '-'}</td>
                <td style="color:var(--neon-green); font-weight:700;">${t.grandTotal || 0} دج</td>
                <td>${workers[t.worker] || t.worker}</td>
            </tr>`;
        }).join('') || '<tr><td colspan="5" class="empty-msg">لا توجد عمليات مسجلة</td></tr>';
    }
}

/* ========== INVENTORY & BACKUP ========== */
function renderInventory() {
    const data = getData();
    const box = document.getElementById('inventorySummary');
    if(!box) return;
    box.innerHTML = data.products.map(p => `
        <div class="stat-card">
            <div style="font-size:30px">${p.emoji}</div>
            <div class="stat-info">
                <h3>${p.stock} قطعة</h3>
                <p>${p.name} (السعر: ${p.price} دج)</p>
            </div>
        </div>
    `).join('');
}

function exportData() {
    const data = getData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `gaming-zone-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
}

function clearAllData() {
    if(confirm('هل أنت متأكد من تصفير كافة المعاملات والبدء من جديد؟')) {
        localStorage.removeItem('gamingZoneData');
        location.reload();
    }
}
