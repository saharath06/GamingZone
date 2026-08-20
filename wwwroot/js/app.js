// ============================================
// GAMING ZONE MANAGEMENT SYSTEM
// Complete Application Logic
// ============================================

// ===== DATA INITIALIZATION =====
function getDefaultData() {
    return {
        passwords: {
            owner: 'owner123',
            morning: 'morning123',
            evening: 'evening123'
        },
        consolePricePerHalf: 100, // 100 DA per 30 min
        products: [
            { id: 1, name: 'قهوة سوداء', category: 'coffee', price: 50, cost: 20, stock: 50, minStock: 10, emoji: '☕' },
            { id: 2, name: 'قهوة بالحليب', category: 'coffee', price: 80, cost: 35, stock: 50, minStock: 10, emoji: '☕' },
            { id: 3, name: 'نسكافيه', category: 'coffee', price: 60, cost: 25, stock: 30, minStock: 5, emoji: '☕' },
            { id: 4, name: 'كوكا كولا', category: 'drinks', price: 50, cost: 30, stock: 40, minStock: 10, emoji: '🥤' },
            { id: 5, name: 'فانتا', category: 'drinks', price: 50, cost: 30, stock: 40, minStock: 10, emoji: '🥤' },
            { id: 6, name: 'ماء معدني', category: 'drinks', price: 30, cost: 15, stock: 60, minStock: 15, emoji: '💧' },
            { id: 7, name: 'عصير', category: 'drinks', price: 80, cost: 45, stock: 30, minStock: 8, emoji: '🧃' },
            { id: 8, name: 'شيبس ليز', category: 'chips', price: 50, cost: 30, stock: 30, minStock: 8, emoji: '🍿' },
            { id: 9, name: 'شيبس دوريتوس', category: 'chips', price: 80, cost: 50, stock: 25, minStock: 5, emoji: '🌮' },
            { id: 10, name: 'بسكويت', category: 'chips', price: 30, cost: 15, stock: 40, minStock: 10, emoji: '🍪' },
            { id: 11, name: 'كرواصون', category: 'cake', price: 50, cost: 25, stock: 20, minStock: 5, emoji: '🥐' },
            { id: 12, name: 'قاطو شوكولا', category: 'cake', price: 60, cost: 30, stock: 15, minStock: 5, emoji: '🍫' },
            { id: 13, name: 'كيك', category: 'cake', price: 80, cost: 40, stock: 15, minStock: 3, emoji: '🍰' },
            { id: 14, name: 'ساندويتش', category: 'food', price: 150, cost: 80, stock: 10, minStock: 3, emoji: '🥪' },
            { id: 15, name: 'بيتزا صغيرة', category: 'food', price: 200, cost: 100, stock: 8, minStock: 2, emoji: '🍕' },
        ],
        // PC sessions (keyed by pc number)
        pcSessions: {},
        // Console sessions
        consoleSessions: {},
        // All transactions
        transactions: [],
        // Quick sale cart
        quickSaleCart: [],
        // Console definitions
        consoles: [
            { id: 'xbox1', name: 'Xbox Series X #1', type: 'Xbox Series X', icon: '🎮' },
            { id: 'xbox2', name: 'Xbox Series X #2', type: 'Xbox Series X', icon: '🎮' },
            { id: 'xbox3', name: 'Xbox Series X #3', type: 'Xbox Series X', icon: '🎮' },
            { id: 'ps5', name: 'PlayStation 5', type: 'PS5', icon: '🕹️' },
        ],
        nextProductId: 16
    };
}

function getData() {
    const stored = localStorage.getItem('gamingZoneData');
    if (stored) {
        const data = JSON.parse(stored);
        // Ensure all keys exist
        const defaults = getDefaultData();
        for (let key in defaults) {
            if (!(key in data)) data[key] = defaults[key];
        }
        return data;
    }
    return getDefaultData();
}

function saveData(data) {
    localStorage.setItem('gamingZoneData', JSON.stringify(data));
}

// ===== CURRENT STATE =====
let currentUser = null;
let currentModalSession = null;
let modalCart = [];
let quickSaleCart = [];
let consoleTimers = {};

// ===== NOTIFICATION =====
function showNotification(message, type = 'success') {
    const container = document.getElementById('notificationContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `notification-toast ${type}`;
    
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    toast.innerHTML = `<span>${icons[type] || '📢'}</span> ${message}`;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideInLeft 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ===== DASHBOARD INIT =====
function initDashboard() {
    currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    // Set body role class
    document.body.className = `dashboard-page role-${currentUser}`;

    // Set user info
    const names = { owner: 'المالك', morning: 'عامل الصباح', evening: 'عامل المساء' };
    const avatars = { owner: '👑', morning: '🌅', evening: '🌙' };
    const shifts = { owner: 'كل الورديات', morning: 'وردية الصباح', evening: 'وردية المساء' };

    document.getElementById('userName').textContent = names[currentUser];
    document.getElementById('userAvatar').textContent = avatars[currentUser];
    document.getElementById('userShift').textContent = shifts[currentUser];
    document.getElementById('shiftBadge').textContent = shifts[currentUser];

    // Setup navigation
    setupNavigation();
    
    // Start clock
    updateClock();
    setInterval(updateClock, 1000);

    // Render everything
    renderPCGrid();
    renderConsolesGrid();
    renderProductsTable();
    updateOverview();
    renderQuickSaleProducts();

    // Start console timers
    startConsoleTimers();

    // Set report dates
    const today = new Date().toISOString().split('T')[0];
    const reportFrom = document.getElementById('reportFrom');
    const reportTo = document.getElementById('reportTo');
    if (reportFrom) reportFrom.value = today;
    if (reportTo) reportTo.value = today;

    // Setup product form
    const addForm = document.getElementById('addProductForm');
    if (addForm) {
        addForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addProduct();
        });
    }
}

// ===== CLOCK =====
function updateClock() {
    const now = new Date();
    const clock = document.getElementById('liveClock');
    if (clock) {
        clock.textContent = now.toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
}

// ===== NAVIGATION =====
function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.dataset.section;
            
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            this.classList.add('active');
            
            document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
            document.getElementById(`section-${section}`).classList.add('active');

            // Refresh section data
            if (section === 'overview') updateOverview();
            if (section === 'inventory') renderInventory();
            if (section === 'reports') generateReport();

            // Close sidebar on mobile
            document.getElementById('sidebar').classList.remove('open');
        });
    });
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

// ===== LOGOUT =====
function logout() {
    // Record shift end
    const data = getData();
    data.transactions.push({
        id: Date.now(),
        type: 'shift_end',
        worker: currentUser,
        time: new Date().toISOString(),
        details: `انتهاء وردية ${currentUser === 'morning' ? 'الصباح' : currentUser === 'evening' ? 'المساء' : 'المالك'}`
    });
    saveData(data);
    
    localStorage.removeItem('currentUser');
    localStorage.removeItem('loginTime');
    window.location.href = 'index.html';
}

// ===== PC GRID =====
function renderPCGrid() {
    const grid = document.getElementById('pcGrid');
    if (!grid) return;
    
    const data = getData();
    let html = '';
    
    for (let i = 1; i <= 8; i++) {
        const session = data.pcSessions[`pc${i}`] || null;
        const isActive = session && session.active;
        const consumption = session ? session.consumption || [] : [];
        const consTotal = consumption.reduce((sum, c) => sum + (c.price * c.qty), 0);
        
        html += `
        <div class="pc-card ${isActive ? 'active' : ''}">
            <div class="pc-card-header">
                <div class="pc-name">
                    <i class="fas fa-desktop"></i>
                    PC ${i}
                </div>
                <span class="pc-status ${isActive ? 'busy' : 'free'}">
                    ${isActive ? '🟢 مشغول' : '⚫ فارغ'}
                </span>
            </div>
            <div class="pc-card-body">
                ${isActive ? `
                    <div class="pc-consumption">
                        <strong>🛒 الاستهلاكات:</strong>
                        <div class="pc-consumption-list">
                            ${consumption.length > 0 ? consumption.map(c => `
                                <div class="consumption-item">
                                    <span>${c.name} × ${c.qty}</span>
                                    <span>${c.price * c.qty} دج</span>
                                </div>
                            `).join('') : '<p class="empty-msg" style="padding:5px">لا توجد استهلاكات</p>'}
                        </div>
                    </div>
                    <div class="pc-total">
                        <span>إجمالي المشتريات:</span>
                        <span class="pc-total-amount">${consTotal} دج</span>
                    </div>
                ` : `
                    <p class="empty-msg" style="padding:15px 0">الجهاز متاح</p>
                `}
            </div>
            <div class="pc-card-actions">
                ${!isActive ? `
                    <button class="btn-sm btn-add" onclick="startPCSession(${i})">
                        <i class="fas fa-play"></i> بدء جلسة
                    </button>
                ` : `
                    <button class="btn-sm btn-add" onclick="openConsumptionModal('pc', ${i})">
                        <i class="fas fa-plus"></i> إضافة استهلاك
                    </button>
                    <button class="btn-sm btn-checkout" onclick="openCheckoutModal('pc', ${i})">
                        <i class="fas fa-cash-register"></i> حساب
                    </button>
                    <button class="btn-sm btn-clear" onclick="endPCSession(${i})">
                        <i class="fas fa-stop"></i> إنهاء
                    </button>
                `}
            </div>
        </div>`;
    }
    
    grid.innerHTML = html;
}

function startPCSession(pcNum) {
    const data = getData();
    data.pcSessions[`pc${pcNum}`] = {
        active: true,
        startTime: new Date().toISOString(),
        consumption: [],
        worker: currentUser
    };
    saveData(data);
    renderPCGrid();
    updateOverview();
    showNotification(`تم تشغيل PC ${pcNum}`, 'success');
}

function endPCSession(pcNum) {
    if (!confirm(`هل تريد إنهاء جلسة PC ${pcNum}؟ سيتم مسح كل الاستهلاكات غير المحسوبة.`)) return;
    
    const data = getData();
    delete data.pcSessions[`pc${pcNum}`];
    saveData(data);
    renderPCGrid();
    updateOverview();
    showNotification(`تم إنهاء جلسة PC ${pcNum}`, 'info');
}

// ===== CONSOLE GRID =====
function renderConsolesGrid() {
    const grid = document.getElementById('consolesGrid');
    if (!grid) return;
    
    const data = getData();
    let html = '';
    
    data.consoles.forEach(console => {
        const session = data.consoleSessions[console.id] || null;
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
                <div class="console-name">
                    <span class="console-icon">${console.icon}</span>
                    <div>
                        <span>${console.name}</span>
                        <span class="console-type">${console.type}</span>
                    </div>
                </div>
                <span class="pc-status ${isActive ? 'busy' : 'free'}">
                    ${isActive ? '🟢 مشغول' : '⚫ فارغ'}
                </span>
            </div>
            
            <div class="console-timer">
                <div class="timer-display" id="timer-${console.id}">
                    ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}
                </div>
                <div class="console-price-info">
                    نصف ساعة = <strong>${data.consolePricePerHalf} دج</strong>
                    ${isActive ? ` | المجموع: <strong>${timeTotal} دج</strong>` : ''}
                </div>
                <div class="timer-controls">
                    <button class="btn-timer add-time" onclick="addConsoleTime('${console.id}', 30)">
                        <i class="fas fa-plus"></i> +30 دقيقة
                    </button>
                    <button class="btn-timer add-time" onclick="addConsoleTime('${console.id}', 60)">
                        <i class="fas fa-plus"></i> +1 ساعة
                    </button>
                    ${isActive ? `
                        <button class="btn-timer remove-time" onclick="removeConsoleTime('${console.id}')">
                            <i class="fas fa-minus"></i> -30 دقيقة
                        </button>
                    ` : ''}
                </div>
            </div>

            ${isActive ? `
                <div class="pc-card-body">
                    <div class="pc-consumption">
                        <strong>🛒 الاستهلاكات:</strong>
                        <div class="pc-consumption-list">
                            ${consumption.length > 0 ? consumption.map(c => `
                                <div class="consumption-item">
                                    <span>${c.name} × ${c.qty}</span>
                                    <span>${c.price * c.qty} دج</span>
                                </div>
                            `).join('') : '<p class="empty-msg" style="padding:5px">لا توجد استهلاكات</p>'}
                        </div>
                    </div>
                    <div class="pc-total">
                        <span>إجمالي الكل:</span>
                        <span class="pc-total-amount">${consTotal + timeTotal} دج</span>
                    </div>
                </div>
                <div class="pc-card-actions">
                    <button class="btn-sm btn-add" onclick="openConsumptionModal('console', '${console.id}')">
                        <i class="fas fa-plus"></i> إضافة استهلاك
                    </button>
                    <button class="btn-sm btn-checkout" onclick="openCheckoutModal('console', '${console.id}')">
                        <i class="fas fa-cash-register"></i> حساب
                    </button>
                    <button class="btn-sm btn-clear" onclick="endConsoleSession('${console.id}')">
                        <i class="fas fa-stop"></i> إنهاء
                    </button>
                </div>
            ` : ''}
        </div>`;
    });
    
    grid.innerHTML = html;
}

function addConsoleTime(consoleId, minutes) {
    const data = getData();
    if (!data.consoleSessions[consoleId]) {
        data.consoleSessions[consoleId] = {
            startTime: new Date().toISOString(),
            remainingMinutes: 0,
            totalHalves: 0,
            consumption: [],
            worker: currentUser
        };
    }
    
    const session = data.consoleSessions[consoleId];
    session.remainingMinutes += minutes;
    session.totalHalves += (minutes / 30);
    
    saveData(data);
    renderConsolesGrid();
    updateOverview();
    showNotification(`تم إضافة ${minutes} دقيقة`, 'success');
}

function removeConsoleTime(consoleId) {
    const data = getData();
    const session = data.consoleSessions[consoleId];
    if (!session) return;
    
    if (session.remainingMinutes >= 30) {
        session.remainingMinutes -= 30;
        session.totalHalves -= 1;
        if (session.totalHalves < 0) session.totalHalves = 0;
    } else {
        session.remainingMinutes = 0;
    }
    
    saveData(data);
    renderConsolesGrid();
    updateOverview();
    showNotification('تم إزالة 30 دقيقة', 'info');
}

function endConsoleSession(consoleId) {
    if (!confirm('هل تريد إنهاء هذه الجلسة؟')) return;
    
    const data = getData();
    delete data.consoleSessions[consoleId];
    saveData(data);
    renderConsolesGrid();
    updateOverview();
    showNotification('تم إنهاء جلسة الكونسول', 'info');
}

// Console countdown timers
function startConsoleTimers() {
    setInterval(() => {
        const data = getData();
        let changed = false;
        
        for (let id in data.consoleSessions) {
            const session = data.consoleSessions[id];
            if (session.remainingMinutes > 0) {
                session.remainingMinutes -= 1/60; // subtract 1 second
                if (session.remainingMinutes <= 0) {
                    session.remainingMinutes = 0;
                    showNotification(`⏰ انتهى وقت ${id}!`, 'error');
                }
                changed = true;
                
                // Update display
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

// ===== CONSUMPTION MODAL =====
function openConsumptionModal(type, id) {
    currentModalSession = { type, id };
    modalCart = [];
    
    const modal = document.getElementById('sessionModal');
    const title = document.getElementById('modalTitle');
    const deviceInfo = document.getElementById('modalDeviceInfo');
    
    if (type === 'pc') {
        title.textContent = `إضافة استهلاك - PC ${id}`;
        deviceInfo.innerHTML = `<i class="fas fa-desktop" style="font-size:24px;color:var(--neon-blue)"></i> جهاز كمبيوتر رقم ${id}`;
    } else {
        const data = getData();
        const consoleDef = data.consoles.find(c => c.id === id);
        title.textContent = `إضافة استهلاك - ${consoleDef.name}`;
        deviceInfo.innerHTML = `<span style="font-size:24px">${consoleDef.icon}</span> ${consoleDef.name}`;
    }
    
    renderModalProducts();
    renderModalCart();
    modal.classList.add('active');
}

function renderModalProducts() {
    const data = getData();
    const categories = {
        all: '📦 الكل',
        coffee: '☕ مشروبات ساخنة',
        drinks: '🥤 مشروبات باردة',
        chips: '🍿 مقرمشات',
        cake: '🍰 حلويات',
        food: '🍔 وجبات',
        other: '📦 أخرى'
    };
    
    // Category tabs
    const tabsContainer = document.getElementById('modalCategoryTabs');
    tabsContainer.innerHTML = Object.entries(categories).map(([key, label]) => 
        `<button class="cat-tab ${key === 'all' ? 'active' : ''}" onclick="filterModalProducts('${key}', this)">${label}</button>`
    ).join('');
    
    // Products
    renderModalProductsGrid('all');
}

function filterModalProducts(category, btn) {
    document.querySelectorAll('#modalCategoryTabs .cat-tab').forEach(t => t.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderModalProductsGrid(category);
}

function renderModalProductsGrid(category) {
    const data = getData();
    const grid = document.getElementById('modalProductsGrid');
    const products = category === 'all' ? data.products : data.products.filter(p => p.category === category);
    
    grid.innerHTML = products.map(p => `
        <div class="product-item ${p.stock <= 0 ? 'out-of-stock' : ''}" onclick="addToModalCart(${p.id})">
            <div class="product-emoji">${p.emoji || '📦'}</div>
            <div class="product-name">${p.name}</div>
            <div class="product-price">${p.price} دج</div>
            <div class="product-stock-badge">${p.stock <= 0 ? 'نفذ المخزون' : `متبقي: ${p.stock}`}</div>
        </div>
    `).join('') || '<p class="empty-msg">لا توجد منتجات</p>';
}

function addToModalCart(productId) {
    const data = getData();
    const product = data.products.find(p => p.id === productId);
    if (!product || product.stock <= 0) return;
    
    const existing = modalCart.find(c => c.id === productId);
    if (existing) {
        if (existing.qty < product.stock) {
            existing.qty++;
        } else {
            showNotification('لا يوجد مخزون كافي!', 'error');
            return;
        }
    } else {
        modalCart.push({ id: product.id, name: product.name, price: product.price, qty: 1 });
    }
    
    renderModalCart();
}

function renderModalCart() {
    const container = document.getElementById('modalCartItems');
    const totalEl = document.getElementById('modalCartTotal');
    
    if (modalCart.length === 0) {
        container.innerHTML = '<p class="empty-msg">لم يتم إضافة منتجات</p>';
        totalEl.textContent = '0 دج';
        return;
    }
    
    container.innerHTML = modalCart.map((item, idx) => `
        <div class="cart-item">
            <div class="item-info">
                <span class="item-remove" onclick="removeFromModalCart(${idx})"><i class="fas fa-trash"></i></span>
                <span>${item.name}</span>
            </div>
            <div class="item-qty">
                <button class="qty-btn" onclick="changeModalQty(${idx}, -1)">-</button>
                <span>${item.qty}</span>
                <button class="qty-btn" onclick="changeModalQty(${idx}, 1)">+</button>
            </div>
            <div class="item-total">${item.price * item.qty} دج</div>
        </div>
    `).join('');
    
    const total = modalCart.reduce((sum, c) => sum + (c.price * c.qty), 0);
    totalEl.textContent = total + ' دج';
}

function changeModalQty(idx, delta) {
    const data = getData();
    const item = modalCart[idx];
    const product = data.products.find(p => p.id === item.id);
    
    item.qty += delta;
    if (item.qty <= 0) {
        modalCart.splice(idx, 1);
    } else if (product && item.qty > product.stock) {
        item.qty = product.stock;
        showNotification('لا يوجد مخزون كافي!', 'error');
    }
    renderModalCart();
}

function removeFromModalCart(idx) {
    modalCart.splice(idx, 1);
    renderModalCart();
}

function saveSessionConsumption() {
    if (modalCart.length === 0) {
        showNotification('أضف منتجات أولاً!', 'error');
        return;
    }
    
    const data = getData();
    const { type, id } = currentModalSession;
    
    let session;
    if (type === 'pc') {
        session = data.pcSessions[`pc${id}`];
    } else {
        session = data.consoleSessions[id];
    }
    
    if (!session) {
        showNotification('الجلسة غير موجودة!', 'error');
        return;
    }
    
    // Add items to session consumption
    modalCart.forEach(cartItem => {
        const existing = session.consumption.find(c => c.id === cartItem.id);
        if (existing) {
            existing.qty += cartItem.qty;
        } else {
            session.consumption.push({ ...cartItem });
        }
        
        // Decrease stock
        const product = data.products.find(p => p.id === cartItem.id);
        if (product) {
            product.stock -= cartItem.qty;
            if (product.stock < 0) product.stock = 0;
        }
    });
    
    saveData(data);
    closeModal('sessionModal');
    
    if (type === 'pc') {
        renderPCGrid();
    } else {
        renderConsolesGrid();
    }
    
    updateOverview();
    showNotification('تم إضافة الاستهلاكات بنجاح ✅', 'success');
}

// ===== CHECKOUT MODAL =====
function openCheckoutModal(type, id) {
    const data = getData();
    currentModalSession = { type, id };
    
    let session, deviceName, timeTotal = 0, consumptionTotal = 0;
    
    if (type === 'pc') {
        session = data.pcSessions[`pc${id}`];
        deviceName = `PC ${id}`;
    } else {
        session = data.consoleSessions[id];
        const consoleDef = data.consoles.find(c => c.id === id);
        deviceName = consoleDef ? consoleDef.name : id;
        timeTotal = (session.totalHalves || 0) * data.consolePricePerHalf;
    }
    
    if (!session) return;
    
    const consumption = session.consumption || [];
    consumptionTotal = consumption.reduce((sum, c) => sum + (c.price * c.qty), 0);
    const grandTotal = consumptionTotal + timeTotal;
    
    const summary = document.getElementById('checkoutSummary');
    summary.innerHTML = `
        <div class="checkout-section">
            <h4><i class="fas fa-${type === 'pc' ? 'desktop' : 'gamepad'}"></i> ${deviceName}</h4>
        </div>
        
        ${type === 'console' ? `
        <div class="checkout-section">
            <h4><i class="fas fa-clock"></i> وقت اللعب</h4>
            <div class="checkout-row">
                <span>${session.totalHalves || 0} × نصف ساعة (${data.consolePricePerHalf} دج)</span>
                <span>${timeTotal} دج</span>
            </div>
        </div>
        ` : ''}
        
        <div class="checkout-section">
            <h4><i class="fas fa-shopping-cart"></i> المشتريات</h4>
            ${consumption.length > 0 ? consumption.map(c => `
                <div class="checkout-row">
                    <span>${c.name} × ${c.qty}</span>
                    <span>${c.price * c.qty} دج</span>
                </div>
            `).join('') : '<p style="color:var(--text-muted)">لا توجد مشتريات</p>'}
            <div class="checkout-row" style="font-weight:700;margin-top:5px">
                <span>مجموع المشتريات</span>
                <span>${consumptionTotal} دج</span>
            </div>
        </div>
        
        <div class="checkout-grand-total">
            <span>💰 المبلغ الإجمالي</span>
            <span>${grandTotal} دج</span>
        </div>
    `;
    
    document.getElementById('checkoutModal').classList.add('active');
}

function confirmCheckout() {
    const data = getData();
    const { type, id } = currentModalSession;
    
    let session, deviceName, timeTotal = 0, consumptionTotal = 0;
    
    if (type === 'pc') {
        session = data.pcSessions[`pc${id}`];
        deviceName = `PC ${id}`;
    } else {
        session = data.consoleSessions[id];
        const consoleDef = data.consoles.find(c => c.id === id);
        deviceName = consoleDef ? consoleDef.name : id;
        timeTotal = (session.totalHalves || 0) * data.consolePricePerHalf;
    }
    
    if (!session) return;
    
    const consumption = session.consumption || [];
    consumptionTotal = consumption.reduce((sum, c) => sum + (c.price * c.qty), 0);
    const grandTotal = consumptionTotal + timeTotal;
    
    // Record transaction
    data.transactions.push({
        id: Date.now(),
        type: type === 'pc' ? 'pc_session' : 'console_session',
        device: deviceName,
        time: new Date().toISOString(),
        worker: currentUser,
        consumption: [...consumption],
        timeTotal: timeTotal,
        consumptionTotal: consumptionTotal,
        grandTotal: grandTotal,
        details: `${deviceName}: وقت ${timeTotal} دج + مشتريات ${consumptionTotal} دج`
    });
    
    // End session
    if (type === 'pc') {
        delete data.pcSessions[`pc${id}`];
    } else {
        delete data.consoleSessions[id];
    }
    
    saveData(data);
    closeModal('checkoutModal');
    
    renderPCGrid();
    renderConsolesGrid();
    updateOverview();
    
    showNotification(`✅ تم الدفع: ${grandTotal} دج`, 'success');
}

// ===== QUICK SALE =====
function renderQuickSaleProducts() {
    const data = getData();
    const categories = {
        all: '📦 الكل',
        coffee: '☕ ساخنة',
        drinks: '🥤 باردة',
        chips: '🍿 مقرمشات',
        cake: '🍰 حلويات',
        food: '🍔 وجبات',
        other: '📦 أخرى'
    };
    
    const tabsContainer = document.getElementById('qsCategoryTabs');
    if (!tabsContainer) return;
    
    tabsContainer.innerHTML = Object.entries(categories).map(([key, label]) => 
        `<button class="cat-tab ${key === 'all' ? 'active' : ''}" onclick="filterQSProducts('${key}', this)">${label}</button>`
    ).join('');
    
    renderQSProductsGrid('all');
}

function filterQSProducts(category, btn) {
    document.querySelectorAll('#qsCategoryTabs .cat-tab').forEach(t => t.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderQSProductsGrid(category);
}

function renderQSProductsGrid(category) {
    const data = getData();
    const grid = document.getElementById('qsProductsGrid');
    if (!grid) return;
    
    const products = category === 'all' ? data.products : data.products.filter(p => p.category === category);
    
    grid.innerHTML = products.map(p => `
        <div class="product-item ${p.stock <= 0 ? 'out-of-stock' : ''}" onclick="addToQuickSale(${p.id})">
            <div class="product-emoji">${p.emoji || '📦'}</div>
            <div class="product-name">${p.name}</div>
            <div class="product-price">${p.price} دج</div>
            <div class="product-stock-badge">${p.stock <= 0 ? 'نفذ' : `متبقي: ${p.stock}`}</div>
        </div>
    `).join('') || '<p class="empty-msg">لا توجد منتجات</p>';
}

function addToQuickSale(productId) {
    const data = getData();
    const product = data.products.find(p => p.id === productId);
    if (!product || product.stock <= 0) return;
    
    const existing = quickSaleCart.find(c => c.id === productId);
    if (existing) {
        if (existing.qty < product.stock) {
            existing.qty++;
        } else {
            showNotification('لا يوجد مخزون كافي!', 'error');
            return;
        }
    } else {
        quickSaleCart.push({ id: product.id, name: product.name, price: product.price, qty: 1 });
    }
    
    renderQuickSaleCart();
}

function renderQuickSaleCart() {
    const container = document.getElementById('qsInvoiceItems');
    const totalEl = document.getElementById('qsTotal');
    if (!container) return;
    
    if (quickSaleCart.length === 0) {
        container.innerHTML = '<p class="empty-msg">أضف منتجات للفاتورة</p>';
        totalEl.textContent = '0 دج';
        return;
    }
    
    container.innerHTML = quickSaleCart.map((item, idx) => `
        <div class="invoice-item">
            <div class="item-info">
                <span class="item-remove" onclick="removeFromQuickSale(${idx})"><i class="fas fa-trash"></i></span>
                <span>${item.name}</span>
            </div>
            <div class="item-qty">
                <button class="qty-btn" onclick="changeQSQty(${idx}, -1)">-</button>
                <span>${item.qty}</span>
                <button class="qty-btn" onclick="changeQSQty(${idx}, 1)">+</button>
            </div>
            <div class="item-total">${item.price * item.qty} دج</div>
        </div>
    `).join('');
    
    const total = quickSaleCart.reduce((sum, c) => sum + (c.price * c.qty), 0);
    totalEl.textContent = total + ' دج';
}

function changeQSQty(idx, delta) {
    const data = getData();
    const item = quickSaleCart[idx];
    const product = data.products.find(p => p.id === item.id);
    
    item.qty += delta;
    if (item.qty <= 0) {
        quickSaleCart.splice(idx, 1);
    } else if (product && item.qty > product.stock) {
        item.qty = product.stock;
        showNotification('لا يوجد مخزون كافي!', 'error');
    }
    renderQuickSaleCart();
}

function removeFromQuickSale(idx) {
    quickSaleCart.splice(idx, 1);
    renderQuickSaleCart();
}

function completeQuickSale() {
    if (quickSaleCart.length === 0) {
        showNotification('أضف منتجات أولاً!', 'error');
        return;
    }
    
    const data = getData();
    const total = quickSaleCart.reduce((sum, c) => sum + (c.price * c.qty), 0);
    
    // Decrease stock
    quickSaleCart.forEach(item => {
        const product = data.products.find(p => p.id === item.id);
        if (product) {
            product.stock -= item.qty;
            if (product.stock < 0) product.stock = 0;
        }
    });
    
    // Record transaction
    data.transactions.push({
        id: Date.now(),
        type: 'quick_sale',
        time: new Date().toISOString(),
        worker: currentUser,
        consumption: [...quickSaleCart],
        grandTotal: total,
        details: `بيع سريع: ${quickSaleCart.map(c => c.name + '×' + c.qty).join(', ')}`
    });
    
    saveData(data);
    
    quickSaleCart = [];
    renderQuickSaleCart();
    renderQuickSaleProducts();
    updateOverview();
    renderProductsTable();
    
    showNotification(`✅ تم البيع: ${total} دج`, 'success');
}

// ===== PRODUCTS MANAGEMENT =====
function addProduct() {
    const data = getData();
    
    const name = document.getElementById('prodName').value.trim();
    const category = document.getElementById('prodCategory').value;
    const price = parseInt(document.getElementById('prodPrice').value);
    const cost = parseInt(document.getElementById('prodCost').value) || 0;
    const stock = parseInt(document.getElementById('prodStock').value);
    const minStock = parseInt(document.getElementById('prodMinStock').value) || 5;
    
    const emojis = {
        coffee: '☕', drinks: '🥤', chips: '🍿', cake: '🍰', food: '🍔', other: '📦'
    };
    
    data.products.push({
        id: data.nextProductId++,
        name, category, price, cost, stock, minStock,
        emoji: emojis[category] || '📦'
    });
    
    saveData(data);
    
    document.getElementById('addProductForm').reset();
    renderProductsTable();
    renderQuickSaleProducts();
    showNotification(`تم إضافة "${name}" ✅`, 'success');
}

function renderProductsTable() {
    const data = getData();
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;
    
    const categoryNames = {
        coffee: '☕ مشروبات ساخنة',
        drinks: '🥤 مشروبات باردة',
        chips: '🍿 مقرمشات',
        cake: '🍰 حلويات',
        food: '🍔 وجبات',
        other: '📦 أخرى'
    };
    
    tbody.innerHTML = data.products.map(p => {
        let statusClass = 'stock-ok';
        let statusText = 'متوفر';
        if (p.stock <= 0) { statusClass = 'stock-out'; statusText = 'نفذ'; }
        else if (p.stock <= p.minStock) { statusClass = 'stock-low'; statusText = 'منخفض'; }
        
        return `
        <tr>
            <td><strong>${p.emoji} ${p.name}</strong></td>
            <td>${categoryNames[p.category] || p.category}</td>
            <td>${p.price} دج</td>
            <td>${p.cost} دج</td>
            <td>${p.stock}</td>
            <td><span class="stock-badge ${statusClass}">${statusText}</span></td>
            <td>
                <div class="table-actions">
                    <button class="btn-edit" onclick="editProduct(${p.id})" title="تعديل">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" onclick="deleteProduct(${p.id})" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

function editProduct(id) {
    const data = getData();
    const product = data.products.find(p => p.id === id);
    if (!product) return;
    
    const newName = prompt('اسم المنتج:', product.name);
    if (newName === null) return;
    
    const newPrice = prompt('سعر البيع:', product.price);
    if (newPrice === null) return;
    
    const newStock = prompt('الكمية:', product.stock);
    if (newStock === null) return;
    
    product.name = newName || product.name;
    product.price = parseInt(newPrice) || product.price;
    product.stock = parseInt(newStock) || product.stock;
    
    saveData(data);
    renderProductsTable();
    renderQuickSaleProducts();
    showNotification('تم تحديث المنتج ✅', 'success');
}

function deleteProduct(id) {
    if (!confirm('هل تريد حذف هذا المنتج؟')) return;
    
    const data = getData();
    data.products = data.products.filter(p => p.id !== id);
    saveData(data);
    renderProductsTable();
    renderQuickSaleProducts();
    showNotification('تم حذف المنتج', 'info');
}

function filterProducts() {
    const search = document.getElementById('productSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#productsTableBody tr');
    rows.forEach(row => {
        const name = row.querySelector('td:first-child').textContent.toLowerCase();
        row.style.display = name.includes(search) ? '' : 'none';
    });
}

// ===== OVERVIEW =====
function updateOverview() {
    const data = getData();
    
    // Active PCs
    let activePCs = 0;
    for (let key in data.pcSessions) {
        if (data.pcSessions[key] && data.pcSessions[key].active) activePCs++;
    }
    
    // Active Consoles
    let activeConsoles = 0;
    for (let key in data.consoleSessions) {
        if (data.consoleSessions[key] && data.consoleSessions[key].remainingMinutes > 0) activeConsoles++;
    }
    
    // Today's transactions
    const today = new Date().toISOString().split('T')[0];
    const todayTrans = data.transactions.filter(t => t.time && t.time.startsWith(today));
    
    // Filter by current worker (unless owner)
    let workerTrans = todayTrans;
    if (currentUser !== 'owner') {
        workerTrans = todayTrans.filter(t => t.worker === currentUser);
    }
    
    const totalRevenue = workerTrans.reduce((sum, t) => sum + (t.grandTotal || 0), 0);
    const totalOrders = workerTrans.filter(t => t.grandTotal > 0).length;
    
    // Update stats
    const el = (id) => document.getElementById(id);
    if (el('activePCs')) el('activePCs').textContent = activePCs;
    if (el('activeConsoles')) el('activeConsoles').textContent = activeConsoles;
    if (el('totalRevenue')) el('totalRevenue').textContent = totalRevenue + ' دج';
    if (el('totalOrders')) el('totalOrders').textContent = totalOrders;
    if (el('dailyTotal')) el('dailyTotal').textContent = totalRevenue + ' دج';
    
    // Active devices overview
    const overviewGrid = document.getElementById('activeDevicesOverview');
    if (overviewGrid) {
        let devicesHtml = '';
        
        for (let key in data.pcSessions) {
            if (data.pcSessions[key] && data.pcSessions[key].active) {
                const cons = data.pcSessions[key].consumption || [];
                const total = cons.reduce((s, c) => s + c.price * c.qty, 0);
                devicesHtml += `
                <div class="active-device-mini">
                    <i class="fas fa-desktop"></i>
                    <div class="device-mini-info">
                        <strong>${key.toUpperCase()}</strong>
                        <small>${total} دج مشتريات</small>
                    </div>
                </div>`;
            }
        }
        
        for (let key in data.consoleSessions) {
            const ses = data.consoleSessions[key];
            if (ses && ses.remainingMinutes > 0) {
                const cons = ses.consumption || [];
                const total = cons.reduce((s, c) => s + c.price * c.qty, 0);
                const consoleDef = data.consoles.find(c => c.id === key);
                devicesHtml += `
                <div class="active-device-mini">
                    <span style="font-size:20px">${consoleDef ? consoleDef.icon : '🎮'}</span>
                    <div class="device-mini-info">
                        <strong>${consoleDef ? consoleDef.name : key}</strong>
                        <small>${Math.floor(ses.remainingMinutes)} دق متبقية</small>
                    </div>
                </div>`;
            }
        }
        
        overviewGrid.innerHTML = devicesHtml || '<p class="empty-msg">لا توجد جلسات نشطة حالياً</p>';
    }
    
    // Low stock alerts
    const alertsContainer = document.getElementById('lowStockAlerts');
    if (alertsContainer) {
        const lowStock = data.products.filter(p => p.stock <= p.minStock);
        if (lowStock.length > 0) {
            alertsContainer.innerHTML = lowStock.map(p => `
                <div class="alert-item ${p.stock <= 0 ? 'critical' : ''}">
                    <i class="fas ${p.stock <= 0 ? 'fa-times-circle' : 'fa-exclamation-triangle'}"></i>
                    <span>${p.emoji} <strong>${p.name}</strong> - متبقي: <strong>${p.stock}</strong> ${p.stock <= 0 ? '(نفذ!)' : `(حد التنبيه: ${p.minStock})`}</span>
                </div>
            `).join('');
            
            // Update notification count
            const notifCount = document.getElementById('notifCount');
            if (notifCount) notifCount.textContent = lowStock.length;
        } else {
            alertsContainer.innerHTML = '<p class="empty-msg">✅ كل المنتجات متوفرة بكميات كافية</p>';
            const notifCount = document.getElementById('notifCount');
            if (notifCount) notifCount.textContent = '0';
        }
    }
}

// ===== REPORTS =====
function generateReport() {
    const data = getData();
    const from = document.getElementById('reportFrom')?.value;
    const to = document.getElementById('reportTo')?.value;
    const shift = document.getElementById('reportShift')?.value || 'all';
    
    let filtered = data.transactions.filter(t => t.grandTotal > 0);
    
    if (from) filtered = filtered.filter(t => t.time >= from);
    if (to) filtered = filtered.filter(t => t.time <= to + 'T23:59:59');
    if (shift !== 'all') filtered = filtered.filter(t => t.worker === shift);
    
    // Totals
    const totalRevenue = filtered.reduce((s, t) => s + (t.grandTotal || 0), 0);
    const pcRevenue = filtered.filter(t => t.type === 'pc_session').reduce((s, t) => s + (t.grandTotal || 0), 0);
    const consoleRevenue = filtered.filter(t => t.type === 'console_session').reduce((s, t) => s + (t.grandTotal || 0), 0);
    const productRevenue = filtered.filter(t => t.type === 'quick_sale').reduce((s, t) => s + (t.grandTotal || 0), 0);
    
    const el = (id) => document.getElementById(id);
    if (el('reportTotalRevenue')) el('reportTotalRevenue').textContent = totalRevenue + ' دج';
    if (el('reportPCRevenue')) el('reportPCRevenue').textContent = pcRevenue + ' دج';
    if (el('reportConsoleRevenue')) el('reportConsoleRevenue').textContent = consoleRevenue + ' دج';
    if (el('reportProductRevenue')) el('reportProductRevenue').textContent = productRevenue + ' دج';
    
    // Shifts comparison
    const morningTrans = data.transactions.filter(t => t.worker === 'morning' && t.grandTotal > 0);
    const eveningTrans = data.transactions.filter(t => t.worker === 'evening' && t.grandTotal > 0);
    if (from) {
        // Already filtered above, let's do specific for shifts
    }
    const morningTotal = morningTrans.reduce((s, t) => s + (t.grandTotal || 0), 0);
    const eveningTotal = eveningTrans.reduce((s, t) => s + (t.grandTotal || 0), 0);
    const maxShift = Math.max(morningTotal, eveningTotal, 1);
    
    if (el('morningBar')) el('morningBar').style.width = (morningTotal / maxShift * 100) + '%';
    if (el('eveningBar')) el('eveningBar').style.width = (eveningTotal / maxShift * 100) + '%';
    if (el('morningTotal')) el('morningTotal').textContent = morningTotal + ' دج';
    if (el('eveningTotal')) el('eveningTotal').textContent = eveningTotal + ' دج';
    
    // Top products
    const productSales = {};
    filtered.forEach(t => {
        (t.consumption || []).forEach(c => {
            if (!productSales[c.name]) productSales[c.name] = { name: c.name, qty: 0, total: 0 };
            productSales[c.name].qty += c.qty;
            productSales[c.name].total += c.price * c.qty;
        });
    });
    
    const topProducts = Object.values(productSales).sort((a, b) => b.total - a.total).slice(0, 10);
    const topContainer = document.getElementById('topProducts');
    if (topContainer) {
        topContainer.innerHTML = topProducts.length > 0 ? topProducts.map((p, i) => {
            let rankClass = '';
            if (i === 0) rankClass = 'gold';
            else if (i === 1) rankClass = 'silver';
            else if (i === 2) rankClass = 'bronze';
            
            return `
            <div class="top-product-item">
                <div class="top-rank ${rankClass}">${i + 1}</div>
                <div style="flex:1">
                    <strong>${p.name}</strong>
                    <small style="color:var(--text-secondary);display:block">بيع ${p.qty} قطعة</small>
                </div>
                <strong style="color:var(--neon-green)">${p.total} دج</strong>
            </div>`;
        }).join('') : '<p class="empty-msg">لا توجد بيانات</p>';
    }
    
    // Transaction log
    const logBody = document.getElementById('transactionLog');
    if (logBody) {
        const recentTrans = filtered.slice(-50).reverse();
        logBody.innerHTML = recentTrans.map(t => {
            const date = new Date(t.time);
            const timeStr = date.toLocaleString('ar-DZ', { 
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
            });
            const typeLabels = {
                pc_session: '🖥️ كمبيوتر',
                console_session: '🎮 كونسول',
                quick_sale: '🛒 بيع سريع'
            };
            const workerLabels = {
                owner: '👑 المالك',
                morning: '🌅 صباح',
                evening: '🌙 مساء'
            };
            
            return `
            <tr>
                <td>${timeStr}</td>
                <td>${typeLabels[t.type] || t.type}</td>
                <td>${t.details || '-'}</td>
                <td style="color:var(--neon-green);font-weight:700">${t.grandTotal || 0} دج</td>
                <td>${workerLabels[t.worker] || t.worker}</td>
            </tr>`;
        }).join('') || '<tr><td colspan="5" class="empty-msg">لا توجد معاملات</td></tr>';
    }
}

// ===== INVENTORY =====
function renderInventory() {
    const data = getData();
    const container = document.getElementById('inventorySummary');
    if (!container) return;
    
    const categoryNames = {
        coffee: '☕ مشروبات ساخنة',
        drinks: '🥤 مشروبات باردة',
        chips: '🍿 مقرمشات',
        cake: '🍰 حلويات',
        food: '🍔 وجبات',
        other: '📦 أخرى'
    };
    
    const grouped = {};
    data.products.forEach(p => {
        if (!grouped[p.category]) grouped[p.category] = [];
        grouped[p.category].push(p);
    });
    
    container.innerHTML = Object.entries(grouped).map(([cat, products]) => `
        <div class="inventory-card">
            <h4>${categoryNames[cat] || cat}</h4>
            ${products.map(p => {
                const percentage = p.minStock > 0 ? Math.min((p.stock / (p.minStock * 3)) * 100, 100) : 100;
                let barClass = 'good';
                if (p.stock <= 0) barClass = 'danger';
                else if (p.stock <= p.minStock) barClass = 'warning';
                
                return `
                <div class="inventory-item">
                    <span>${p.emoji} ${p.name}</span>
                    <div style="display:flex;align-items:center;gap:10px">
                        <span style="font-weight:700;${p.stock <= p.minStock ? 'color:var(--neon-orange)' : ''}">${p.stock}</span>
                        <div class="stock-bar">
                            <div class="stock-bar-fill ${barClass}" style="width:${percentage}%"></div>
                        </div>
                    </div>
                </div>`;
            }).join('')}
        </div>
    `).join('');
}

// ===== SETTINGS =====
function updatePasswords() {
    const data = getData();
    
    const ownerPass = document.getElementById('setOwnerPass').value;
    const morningPass = document.getElementById('setMorningPass').value;
    const eveningPass = document.getElementById('setEveningPass').value;
    
    if (ownerPass) data.passwords.owner = ownerPass;
    if (morningPass) data.passwords.morning = morningPass;
    if (eveningPass) data.passwords.evening = eveningPass;
    
    saveData(data);
    
    document.getElementById('setOwnerPass').value = '';
    document.getElementById('setMorningPass').value = '';
    document.getElementById('setEveningPass').value = '';
    
    showNotification('تم تحديث كلمات المرور ✅', 'success');
}

function updateConsolePrice() {
    const data = getData();
    const price = parseInt(document.getElementById('consolePriceHalf').value);
    if (price > 0) {
        data.consolePricePerHalf = price;
        saveData(data);
        showNotification(`سعر نصف ساعة: ${price} دج ✅`, 'success');
    }
}

function exportData() {
    const data = getData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gaming-zone-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('تم تصدير البيانات ✅', 'success');
}

function clearAllData() {
    if (!confirm('⚠️ هل أنت متأكد من مسح كل البيانات؟ لا يمكن التراجع!')) return;
    if (!confirm('⚠️⚠️ تأكيد نهائي: سيتم مسح كل شيء!')) return;
    
    localStorage.removeItem('gamingZoneData');
    location.reload();
}

// ===== MODAL HELPERS =====
function closeModal(id) {
    document.getElementById(id).classList.remove('active');
    modalCart = [];
}

// ===== PASSWORD CHECK FOR LOGIN (updated) =====
// The login page handles this directly, but for settings password changes
// we need to use stored passwords
function checkPassword(role, password) {
    const data = getData();
    return data.passwords[role] === password;
}