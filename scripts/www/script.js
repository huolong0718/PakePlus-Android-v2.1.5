// 安装收入记账APP JavaScript

// 当前登录用户
let currentUser = null;

// 用户认证管理

// 获取用户列表
function getUsers() {
    const usersJson = localStorage.getItem('users');
    return usersJson ? JSON.parse(usersJson) : {};
}

// 保存用户列表
function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}



// 检查用户是否存在
function userExists(username) {
    const users = getUsers();
    return users.hasOwnProperty(username);
}

// 验证密码
function validatePassword(username, password) {
    const users = getUsers();
    return users[username] === password;
}

// 添加新用户
function addUser(username, password) {
    const users = getUsers();
    users[username] = password;
    saveUsers(users);
    
    // 初始化新用户的数据结构
    initializeUserData(username);
}

// 初始化用户数据
function initializeUserData(username) {
    const userData = {
        incomeRecords: [],
        expenseRecords: [],
        clientPayments: {},
        paymentLogs: [],
        systemPassword: '123456'
    };
    localStorage.setItem(`userData_${username}`, JSON.stringify(userData));
}

// 获取用户数据
function getUserData() {
    if (!currentUser) return null;
    
    const userDataJson = localStorage.getItem(`userData_${currentUser}`);
    if (!userDataJson) {
        initializeUserData(currentUser);
        return getUserData();
    }
    
    return JSON.parse(userDataJson);
}

// 保存用户数据
function saveUserData(userData) {
    if (!currentUser) return;
    localStorage.setItem(`userData_${currentUser}`, JSON.stringify(userData));
}

// 获取保存的登录信息
function getSavedLoginInfo() {
    const savedInfoJson = localStorage.getItem('savedLoginInfo');
    return savedInfoJson ? JSON.parse(savedInfoJson) : null;
}

// 保存登录信息
function saveLoginInfo(username, password) {
    localStorage.setItem('savedLoginInfo', JSON.stringify({ username, password }));
}

// 清除保存的登录信息
function clearSavedLoginInfo() {
    localStorage.removeItem('savedLoginInfo');
}

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    // 检查是否已保存登录信息
    const savedLoginInfo = getSavedLoginInfo();
    if (savedLoginInfo) {
        document.getElementById('username').value = savedLoginInfo.username;
        document.getElementById('loginPassword').value = savedLoginInfo.password;
        document.getElementById('rememberMe').checked = true;
    }
    
    // 绑定登录和注册事件
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
});

// 登录处理
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    // 验证用户
    if (!userExists(username)) {
        showNotification('账号不存在，请先注册');
        return;
    }
    
    if (!validatePassword(username, password)) {
        showNotification('密码错误，请重新输入');
        return;
    }
    
    // 设置当前用户
    currentUser = username;
    
    // 保存登录信息
    if (rememberMe) {
        saveLoginInfo(username, password);
    } else {
        clearSavedLoginInfo();
    }
    
    // 显示主应用
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    
    // 初始化应用
    initializeApp();
    
    showNotification('登录成功！');
}

// 注册处理
function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // 验证输入
    if (userExists(username)) {
        showNotification('账号已存在，请选择其他账号');
        return;
    }
    
    if (password.length < 6) {
        showNotification('密码长度不能少于6位');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('两次输入的密码不一致');
        return;
    }
    
    // 添加新用户
    addUser(username, password);
    
    // 切换到登录表单
    switchToLogin();
    
    // 填充用户名
    document.getElementById('username').value = username;
    
    showNotification('注册成功，请登录！');
}

// 切换到登录表单
function switchToLogin() {
    document.getElementById('registerFormContainer').style.display = 'none';
    document.getElementById('loginFormContainer').style.display = 'block';
}

// 切换到注册表单
function switchToRegister() {
    document.getElementById('loginFormContainer').style.display = 'none';
    document.getElementById('registerFormContainer').style.display = 'block';
}

// 初始化应用
function initializeApp() {
    // 设置默认日期为今天
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
    document.getElementById('expenseDate').value = today;
    
    // 默认隐藏相关部分
    toggleIncomeForm(true);
    toggleExpenseForm(true);
    toggleExpenseSummary(true);
    toggleExpensesList(true);
    togglePaymentLogs(true);
    
    // 加载所有数据
    loadAllData();
    
    // 绑定事件
    document.getElementById('incomeForm').addEventListener('submit', addIncomeRecord);
    document.getElementById('expenseForm').addEventListener('submit', addExpenseRecord);
    document.getElementById('search').addEventListener('input', searchIncomeRecords);
    document.getElementById('clearAll').addEventListener('click', clearAllRecords);
    document.getElementById('addStandardRow').addEventListener('click', function() { addTableRow(false); });
    document.getElementById('addManualAreaRow').addEventListener('click', function() { addTableRow(true); });
    document.getElementById('changePassword').addEventListener('click', showChangePasswordModal);
    
    // 为初始行绑定事件
    bindRowEvents(document.querySelector('.item-row'));
    
    // 计算初始总计
    calculateTotal();
}

// 显示修改密码模态框
function showChangePasswordModal() {
    const formContent = `
        <div class="form-group" style="margin-bottom: 15px;">
            <label for="currentPassword" style="display: block; margin-bottom: 5px; font-weight: bold;">当前密码:</label>
            <input type="password" id="currentPassword" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 3px; font-size: 16px;">
        </div>
        <div class="form-group" style="margin-bottom: 15px;">
            <label for="newPassword" style="display: block; margin-bottom: 5px; font-weight: bold;">新密码:</label>
            <input type="password" id="newPassword" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 3px; font-size: 16px;">
        </div>
        <div class="form-group" style="margin-bottom: 15px;">
            <label for="confirmPassword" style="display: block; margin-bottom: 5px; font-weight: bold;">确认新密码:</label>
            <input type="password" id="confirmPassword" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 3px; font-size: 16px;">
        </div>
    `;
    
    showModal('修改系统密码', formContent, function() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // 验证当前密码
        if (currentPassword !== getSystemPassword()) {
            showNotification('当前密码错误');
            return;
        }
        
        // 验证新密码
        if (newPassword.length < 6) {
            showNotification('新密码长度不能少于6位');
            return;
        }
        
        // 验证确认密码
        if (newPassword !== confirmPassword) {
            showNotification('两次输入的密码不一致');
            return;
        }
        
        // 更新密码
        setSystemPassword(newPassword);
        showNotification('密码修改成功');
    });
}

// 数据管理

// 系统密码管理
function getSystemPassword() {
    const userData = getUserData();
    return userData.systemPassword;
}

function setSystemPassword(newPassword) {
    const userData = getUserData();
    userData.systemPassword = newPassword;
    saveUserData(userData);
}

// 客户结款金额管理
function getClientPayments() {
    const userData = getUserData();
    return userData.clientPayments || {};
}

function saveClientPayments(payments) {
    const userData = getUserData();
    userData.clientPayments = payments;
    saveUserData(userData);
}

function getClientPayment(client) {
    const payments = getClientPayments();
    return parseFloat(payments[client] || 0);
}

function setClientPayment(client, amount) {
    // 直接获取用户数据并更新
    const userData = getUserData();
    
    // 记录旧金额
    const oldAmount = parseFloat(userData.clientPayments[client] || 0);
    
    // 确保clientPayments对象存在
    if (!userData.clientPayments) {
        userData.clientPayments = {};
    }
    
    // 更新结款金额
    userData.clientPayments[client] = amount;
    
    // 记录变动日志
    const logEntry = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString(),
        client: client,
        oldAmount: oldAmount,
        newAmount: amount,
        change: amount - oldAmount
    };
    
    // 添加到日志
    if (!userData.paymentLogs) {
        userData.paymentLogs = [];
    }
    userData.paymentLogs.unshift(logEntry);
    
    // 保存所有数据
    saveUserData(userData);
    
    // 直接重新计算并更新页面
    updateAnnualSummary();
    updateBrandSummary();
    updateClientSummary(getIncomeRecords());
}

// 获取结款变动日志
function getPaymentLogs() {
    const userData = getUserData();
    return userData.paymentLogs || [];
}

// 收入记录管理
function getIncomeRecords() {
    const userData = getUserData();
    return userData.incomeRecords || [];
}

// 保存收入记录
function saveIncomeRecords(records) {
    const userData = getUserData();
    userData.incomeRecords = records;
    saveUserData(userData);
}

// 获取支出记录
function getExpenseRecords() {
    const userData = getUserData();
    return userData.expenseRecords || [];
}

// 保存支出记录
function saveExpenseRecords(records) {
    const userData = getUserData();
    userData.expenseRecords = records;
    saveUserData(userData);
}

// 加载所有数据
function loadAllData() {
    // 加载收入记录
    const incomeRecords = getIncomeRecords();
    displayIncomeRecords(incomeRecords);
    updateStats(incomeRecords);
    updateClientSummary(incomeRecords);
    updateAnnualSummary();
    
    // 加载支出记录
    const expenseRecords = getExpenseRecords();
    displayExpenseRecords(expenseRecords);
    updateExpenseSummary();
}

// 表格行管理

// 添加表格行
function addTableRow(isManualArea = false) {
    const tbody = document.querySelector('#itemsTable tbody');
    const newRow = document.createElement('tr');
    newRow.className = 'item-row';
    newRow.dataset.type = isManualArea ? 'manual' : 'standard';
    
    if (isManualArea) {
        // 手动面积行：长高禁止输入，面积手动输入
        newRow.innerHTML = `
            <td><input type="text" class="item-name" placeholder="请输入项目名称" required></td>
            <td><input type="number" class="length" step="1" placeholder="0" min="0" disabled></td>
            <td><input type="number" class="height" step="1" placeholder="0" min="0" disabled></td>
            <td><input type="number" class="area" step="0.001" placeholder="0.000" min="0" required></td>
            <td><input type="number" class="unit-price" step="0.01" placeholder="0.00" min="0" required></td>
            <td><input type="number" class="subtotal" step="0.01" placeholder="0.00" readonly></td>
            <td><button type="button" class="btn btn-small btn-delete-row">删除</button></td>
        `;
    } else {
        // 标准行：带长高，自动计算面积
        newRow.innerHTML = `
            <td><input type="text" class="item-name" placeholder="请输入项目名称" required></td>
            <td><input type="number" class="length" step="1" placeholder="0" min="0" required></td>
            <td><input type="number" class="height" step="1" placeholder="0" min="0" required></td>
            <td><input type="number" class="area" step="0.001" placeholder="0.000" readonly></td>
            <td><input type="number" class="unit-price" step="0.01" placeholder="0.00" min="0" required></td>
            <td><input type="number" class="subtotal" step="0.01" placeholder="0.00" readonly></td>
            <td><button type="button" class="btn btn-small btn-delete-row">删除</button></td>
        `;
    }
    
    tbody.appendChild(newRow);
    bindRowEvents(newRow);
    calculateTotal();
}

// 绑定行事件
function bindRowEvents(row) {
    // 为删除按钮绑定事件
    const deleteBtn = row.querySelector('.btn-delete-row');
    deleteBtn.addEventListener('click', function() {
        // 确保至少保留一行
        const rows = document.querySelectorAll('.item-row');
        if (rows.length > 1) {
            row.remove();
            calculateTotal();
        } else {
            showNotification('至少需要保留一行记录');
        }
    });
    
    const rowType = row.dataset.type;
    
    if (rowType === 'standard') {
        // 标准行：监听长高输入事件，自动计算面积
        const lengthHeightInputs = row.querySelectorAll('.length, .height');
        lengthHeightInputs.forEach(input => {
            input.addEventListener('input', function() {
                calculateArea(row);
                calculateSubtotal(row);
                calculateTotal();
            });
        });
    } else {
        // 手动面积行：监听面积输入事件，重新计算小计
        const areaInput = row.querySelector('.area');
        areaInput.addEventListener('input', function() {
            calculateSubtotal(row);
            calculateTotal();
        });
    }
    
    // 监听单价输入事件，重新计算小计
    const unitPriceInput = row.querySelector('.unit-price');
    unitPriceInput.addEventListener('input', function() {
        calculateSubtotal(row);
        calculateTotal();
    });
}

// 计算面积（长/1000*高/1000）
function calculateArea(row) {
    const length = parseFloat(row.querySelector('.length').value) || 0;
    const height = parseFloat(row.querySelector('.height').value) || 0;
    
    const area = (length / 1000) * (height / 1000);
    row.querySelector('.area').value = area.toFixed(3);
    
    return area;
}

// 计算小计（面积*单价）
function calculateSubtotal(row) {
    const area = parseFloat(row.querySelector('.area').value) || 0;
    const unitPrice = parseFloat(row.querySelector('.unit-price').value) || 0;
    
    const subtotal = area * unitPrice;
    row.querySelector('.subtotal').value = subtotal.toFixed(2);
    
    return subtotal;
}

// 计算总计
function calculateTotal() {
    const rows = document.querySelectorAll('.item-row');
    let total = 0;
    
    rows.forEach(row => {
        const subtotal = parseFloat(row.querySelector('.subtotal').value) || 0;
        total += subtotal;
    });
    
    document.getElementById('totalAmountInput').textContent = `¥${total.toFixed(2)}`;
    document.getElementById('totalAmountHidden').value = total;
    
    return total;
}

// 收入记录管理

// 添加收入记录
function addIncomeRecord(e) {
    e.preventDefault();
    
    // 获取表单数据
    const date = document.getElementById('date').value;
    const client = document.getElementById('client').value.trim();
    const address = document.getElementById('address').value.trim();
    const password = document.getElementById('password').value.trim();
    const note = document.getElementById('note').value.trim();
    
    // 获取所有项目行数据
    const rows = document.querySelectorAll('.item-row');
    const items = [];
    
    for (const row of rows) {
        const itemName = row.querySelector('.item-name').value.trim();
        const unitPrice = parseFloat(row.querySelector('.unit-price').value);
        const subtotal = parseFloat(row.querySelector('.subtotal').value);
        const rowType = row.dataset.type;
        
        // 验证必填项
        if (!itemName || isNaN(unitPrice) || unitPrice <= 0) {
            showNotification('请填写完整的项目信息，所有项目必须有名称和有效的单价');
            return;
        }
        
        if (rowType === 'standard') {
            // 标准行：验证长高
            const length = parseFloat(row.querySelector('.length').value);
            const height = parseFloat(row.querySelector('.height').value);
            const area = parseFloat(row.querySelector('.area').value);
            
            if (isNaN(length) || length <= 0 || isNaN(height) || height <= 0) {
                showNotification('请填写完整的项目信息，标准行必须有有效的长和高');
                return;
            }
            
            items.push({
                name: itemName,
                length,
                height,
                area,
                unitPrice,
                subtotal
            });
        } else {
            // 手动面积行：验证面积
            const area = parseFloat(row.querySelector('.area').value);
            
            if (isNaN(area) || area <= 0) {
                showNotification('请填写完整的项目信息，手动面积行必须有有效的面积');
                return;
            }
            
            items.push({
                name: itemName,
                length: 0,
                height: 0,
                area,
                unitPrice,
                subtotal
            });
        }
    }
    
    // 计算总计
    const totalAmount = calculateTotal();
    
    // 创建记录对象
    const record = {
        id: Date.now().toString(),
        date,
        client,
        address,
        password,
        items,
        totalAmount,
        note
    };
    
    // 获取现有记录并添加新记录
    const records = getIncomeRecords();
    records.unshift(record); // 添加到开头
    
    // 保存记录
    saveIncomeRecords(records);
    
    // 重置表单
    resetIncomeForm();
    
    // 重新加载数据
    loadAllData();
    
    // 显示成功提示
    showNotification('收入记录添加成功！');
}

// 重置收入表单
function resetIncomeForm() {
    const form = document.getElementById('incomeForm');
    form.reset();
    
    // 设置默认日期为今天
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
    
    // 保留一行并清空
    const tbody = document.querySelector('#itemsTable tbody');
    const rows = tbody.querySelectorAll('.item-row');
    
    // 清空所有行
    rows.forEach(row => row.remove());
    
    // 添加新的初始行（标准行）
    const newRow = document.createElement('tr');
    newRow.className = 'item-row';
    newRow.dataset.type = 'standard';
    newRow.innerHTML = `
        <td><input type="text" class="item-name" placeholder="请输入项目名称" required></td>
        <td><input type="number" class="length" step="1" placeholder="0" min="0" required></td>
        <td><input type="number" class="height" step="1" placeholder="0" min="0" required></td>
        <td><input type="number" class="area" step="0.001" placeholder="0.000" readonly></td>
        <td><input type="number" class="unit-price" step="0.01" placeholder="0.00" min="0" required></td>
        <td><input type="number" class="subtotal" step="0.01" placeholder="0.00" readonly></td>
        <td><button type="button" class="btn btn-small btn-delete-row">删除</button></td>
    `;
    
    tbody.appendChild(newRow);
    bindRowEvents(newRow);
    calculateTotal();
}

// 显示收入记录
function displayIncomeRecords(records) {
    const recordsList = document.getElementById('recordsList');
    
    if (records.length === 0) {
        recordsList.innerHTML = '<div class="empty-state">暂无收入记录</div>';
        return;
    }
    
    const recordsHtml = records.map(record => `
        <div class="record-item" data-id="${record.id}">
            <div class="record-header">
                <span class="record-date">${formatDate(record.date)}</span>
                <span class="record-amount">¥${record.totalAmount.toFixed(2)}</span>
            </div>
            <div class="record-client">${record.client}</div>
            <div class="record-info">
                <strong>地址:</strong> ${record.address} ${record.password ? `<strong>密码:</strong> ${record.password}` : ''}
            </div>
            
            <!-- 显示安装项目表格 -->
            <div class="record-items">
                <table class="record-items-table">
                    <thead>
                        <tr>
                            <th>项目名称</th>
                            <th>长(mm)</th>
                            <th>高(mm)</th>
                            <th>面积(㎡)</th>
                            <th>单价(元)</th>
                            <th>小计(元)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${record.items.map(item => `
                            <tr>
                                <td>${item.name}</td>
                                <td>${item.length}</td>
                                <td>${item.height}</td>
                                <td>${item.area.toFixed(3)}</td>
                                <td>¥${item.unitPrice.toFixed(2)}</td>
                                <td>¥${item.subtotal.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                        <tr class="total-row">
                            <td colspan="5" style="text-align: right; font-weight: bold;">总计:</td>
                            <td style="font-weight: bold; color: #27ae60;">¥${record.totalAmount.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            ${record.note ? `<div class="record-note">${record.note}</div>` : ''}
            <div class="record-actions">
                <button class="btn btn-small btn-edit" onclick="editIncomeRecord('${record.id}')">编辑</button>
                <button class="btn btn-small btn-delete" onclick="deleteIncomeRecord('${record.id}')">删除</button>
            </div>
        </div>
    `).join('');
    
    recordsList.innerHTML = recordsHtml;
}

// 搜索收入记录
function searchIncomeRecords() {
    const searchTerm = document.getElementById('search').value.toLowerCase().trim();
    const records = getIncomeRecords();
    
    if (!searchTerm) {
        displayIncomeRecords(records);
        return;
    }
    
    const filteredRecords = records.filter(record => 
        record.client.toLowerCase().includes(searchTerm) ||
        record.address.toLowerCase().includes(searchTerm) ||
        record.items.some(item => item.name.toLowerCase().includes(searchTerm))
    );
    
    displayIncomeRecords(filteredRecords);
}

// 编辑收入记录
function editIncomeRecord(id) {
    // 显示密码输入框
    const modalOverlay = document.createElement('div');
    modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1001;
    `;
    
    // 创建模态框
    const modal = document.createElement('div');
    modal.style.cssText = `
        background-color: white;
        border-radius: 8px;
        padding: 20px;
        width: 90%;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;
    
    // 模态框内容
    modal.innerHTML = `
        <h3 style="margin-top: 0; margin-bottom: 20px;">编辑确认</h3>
        <div class="form-group" style="margin-bottom: 15px;">
            <label for="editPassword" style="display: block; margin-bottom: 5px; font-weight: bold;">请输入密码:</label>
            <input type="password" id="editPassword" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 3px; font-size: 16px;">
        </div>
        <div style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 10px;">
            <button id="modalCancel" class="btn btn-small" style="background-color: #95a5a6; color: white; margin-right: auto;">取消</button>
            <button id="modalConfirm" class="btn btn-small">确认</button>
        </div>
    `;
    
    // 添加到页面
    modalOverlay.appendChild(modal);
    document.body.appendChild(modalOverlay);
    
    // 绑定事件
    modalOverlay.addEventListener('click', function(e) {
        if (e.target === modalOverlay) {
            modalOverlay.remove();
        }
    });
    
    modal.querySelector('#modalCancel').addEventListener('click', function() {
        modalOverlay.remove();
    });
    
    modal.querySelector('#modalConfirm').addEventListener('click', function() {
        const password = document.getElementById('editPassword').value;
        
        // 验证密码
        if (password !== '123456') {
            showNotification('密码错误，无法编辑记录');
            modalOverlay.remove();
            return;
        }
        
        // 执行编辑操作
        (function() {
    const records = getIncomeRecords();
    const record = records.find(r => r.id === id);
    
    if (!record) return;
    
    // 填充表单
    document.getElementById('date').value = record.date;
    document.getElementById('client').value = record.client;
    document.getElementById('address').value = record.address;
    document.getElementById('password').value = record.password;
    document.getElementById('note').value = record.note;
    
    // 清空现有项目行
    const tbody = document.querySelector('#itemsTable tbody');
    tbody.innerHTML = '';
    
    // 添加记录中的项目行
    record.items.forEach((item, index) => {
        const newRow = document.createElement('tr');
        newRow.className = 'item-row';
        
        // 判断项目行类型：如果length和height都为0，则视为手动面积行
        const isManualArea = item.length === 0 && item.height === 0;
        newRow.dataset.type = isManualArea ? 'manual' : 'standard';
        
        if (isManualArea) {
            // 手动面积行：长高禁止输入
            newRow.innerHTML = `
                <td><input type="text" class="item-name" placeholder="请输入项目名称" required value="${item.name}"></td>
                <td><input type="number" class="length" step="1" placeholder="0" min="0" disabled value="${item.length}"></td>
                <td><input type="number" class="height" step="1" placeholder="0" min="0" disabled value="${item.height}"></td>
                <td><input type="number" class="area" step="0.001" placeholder="0.000" min="0" required value="${item.area.toFixed(3)}"></td>
                <td><input type="number" class="unit-price" step="0.01" placeholder="0.00" min="0" required value="${item.unitPrice}"></td>
                <td><input type="number" class="subtotal" step="0.01" placeholder="0.00" readonly value="${item.subtotal.toFixed(2)}"></td>
                <td><button type="button" class="btn btn-small btn-delete-row">删除</button></td>
            `;
        } else {
            // 标准行
            newRow.innerHTML = `
                <td><input type="text" class="item-name" placeholder="请输入项目名称" required value="${item.name}"></td>
                <td><input type="number" class="length" step="1" placeholder="0" min="0" required value="${item.length}"></td>
                <td><input type="number" class="height" step="1" placeholder="0" min="0" required value="${item.height}"></td>
                <td><input type="number" class="area" step="0.001" placeholder="0.000" readonly value="${item.area.toFixed(3)}"></td>
                <td><input type="number" class="unit-price" step="0.01" placeholder="0.00" min="0" required value="${item.unitPrice}"></td>
                <td><input type="number" class="subtotal" step="0.01" placeholder="0.00" readonly value="${item.subtotal.toFixed(2)}"></td>
                <td><button type="button" class="btn btn-small btn-delete-row">删除</button></td>
            `;
        }
        
        tbody.appendChild(newRow);
        bindRowEvents(newRow);
    });
    
    // 计算总计
    calculateTotal();
    
    // 删除原记录
    const updatedRecords = records.filter(r => r.id !== id);
    saveIncomeRecords(updatedRecords);
    
    // 重新加载数据
    loadAllData();
    
    // 滚动到表单
    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
    
    // 显示编辑提示
    showNotification('请修改记录内容后重新提交');
    
    // 关闭模态框
    modalOverlay.remove();
    })();
    });
}

// 删除收入记录
function deleteIncomeRecord(id) {
    if (confirm('确定要删除这条收入记录吗？')) {
        // 显示密码输入框
        showModal('删除确认', `
            <div class="form-group" style="margin-bottom: 15px;">
                <label for="deletePassword" style="display: block; margin-bottom: 5px; font-weight: bold;">请输入密码:</label>
                <input type="password" id="deletePassword" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 3px; font-size: 16px;">
            </div>
        `, function() {
            const password = document.getElementById('deletePassword').value;
            
            // 验证密码
            if (password !== '123456') {
                showNotification('密码错误，无法删除记录');
                return;
            }
            
            // 执行删除操作
            const records = getIncomeRecords();
            const updatedRecords = records.filter(record => record.id !== id);
            saveIncomeRecords(updatedRecords);
            loadAllData();
            showNotification('收入记录已删除');
        });
    }
}

// 支出记录管理

// 添加支出记录
function addExpenseRecord(e) {
    e.preventDefault();
    
    // 获取表单数据
    const date = document.getElementById('expenseDate').value;
    const item = document.getElementById('expenseItem').value.trim();
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const note = document.getElementById('expenseNote').value.trim();
    
    // 验证必填项
    if (!item || isNaN(amount)) {
        showNotification('请填写完整的支出信息');
        return;
    }
    
    // 创建记录对象
    const record = {
        id: Date.now().toString(),
        date,
        item,
        amount,
        note
    };
    
    // 获取现有记录并添加新记录
    const records = getExpenseRecords();
    records.unshift(record); // 添加到开头
    
    // 保存记录
    saveExpenseRecords(records);
    
    // 重置表单
    resetExpenseForm();
    
    // 重新加载数据
    loadAllData();
    
    // 显示成功提示
    showNotification('支出记录添加成功！');
}

// 重置支出表单
function resetExpenseForm() {
    const form = document.getElementById('expenseForm');
    form.reset();
    
    // 设置默认日期为今天
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('expenseDate').value = today;
}

// 显示支出记录
function displayExpenseRecords(records) {
    const recordsList = document.getElementById('expensesList');
    
    if (records.length === 0) {
        recordsList.innerHTML = '<div class="empty-state">暂无支出记录</div>';
        return;
    }
    
    const recordsHtml = records.map(record => `
        <div class="expense-item" data-id="${record.id}">
            <div class="expense-header">
                <span class="expense-date">${formatDate(record.date)}</span>
                <span class="expense-amount">¥${record.amount.toFixed(2)}</span>
            </div>
            <div class="expense-item-name">${record.item}</div>
            ${record.note ? `<div class="expense-note">${record.note}</div>` : ''}
            <div class="record-actions">
                <button class="btn btn-small btn-delete" onclick="deleteExpenseRecord('${record.id}')">删除</button>
            </div>
        </div>
    `).join('');
    
    recordsList.innerHTML = recordsHtml;
}

// 删除支出记录
function deleteExpenseRecord(id) {
    if (confirm('确定要删除这条支出记录吗？')) {
        const records = getExpenseRecords();
        const updatedRecords = records.filter(record => record.id !== id);
        saveExpenseRecords(updatedRecords);
        loadAllData();
        showNotification('支出记录已删除');
    }
}

// 统计和汇总

// 更新年度总计
function updateAnnualSummary() {
    const records = getIncomeRecords();
    const currentYear = new Date().getFullYear();
    
    // 筛选今年的记录
    const thisYearRecords = records.filter(record => {
        const recordYear = new Date(record.date).getFullYear();
        return recordYear === currentYear;
    });
    
    // 计算年度总计
    const annualTotal = thisYearRecords.reduce((sum, record) => sum + record.totalAmount, 0);
    
    // 计算年度已结款和未结款
    const clientPayments = getClientPayments();
    let annualPaid = 0;
    
    // 按客户分组计算总计
    const clientTotals = {};
    thisYearRecords.forEach(record => {
        if (!clientTotals[record.client]) {
            clientTotals[record.client] = 0;
        }
        clientTotals[record.client] += record.totalAmount;
    });
    
    // 计算已结款金额
    Object.keys(clientTotals).forEach(client => {
        const payment = parseFloat(clientPayments[client] || 0);
        // 已结款金额不能超过该客户的总金额
        annualPaid += Math.min(payment, clientTotals[client]);
    });
    
    const annualUnpaid = annualTotal - annualPaid;
    
    // 更新显示
    document.getElementById('annualTotal').textContent = `¥${annualTotal.toFixed(2)}`;
    document.getElementById('annualUnpaid').textContent = `¥${annualUnpaid.toFixed(2)}`;
    document.getElementById('annualPaid').textContent = `¥${annualPaid.toFixed(2)}`;
    
    // 设置点击事件，进入品牌汇总界面
    document.getElementById('annualSummaryTitle').onclick = function() {
        showBrandSummary();
    };
    
    // 设置鼠标悬停效果
    document.getElementById('annualSummaryTitle').style.cursor = 'pointer';
    document.getElementById('annualSummaryTitle').style.color = '#3498db';
}

// 显示年度汇总
function showAnnualSummary() {
    document.getElementById('annualSummaryTitle').style.display = 'block';
    document.getElementById('brandSummarySection').style.display = 'none';
    document.getElementById('storeDetailSection').style.display = 'none';
    document.getElementById('clientSummarySection').style.display = 'block';
    
    // 更新年度汇总数据
    updateAnnualSummary();
}

// 显示品牌汇总
function showBrandSummary() {
    document.getElementById('annualSummaryTitle').style.display = 'none';
    document.getElementById('brandSummarySection').style.display = 'block';
    document.getElementById('storeDetailSection').style.display = 'none';
    document.getElementById('clientSummarySection').style.display = 'none';
    
    // 更新品牌汇总数据
    updateBrandSummary();
}

// 显示店面明细
function showStoreDetails(brand) {
    document.getElementById('annualSummaryTitle').style.display = 'none';
    document.getElementById('brandSummarySection').style.display = 'none';
    document.getElementById('storeDetailSection').style.display = 'block';
    document.getElementById('clientSummarySection').style.display = 'none';
    
    // 设置标题
    document.getElementById('storeDetailTitle').textContent = `${brand} 明细`;
    
    // 更新店面明细数据
    updateStoreDetails(brand);
}

// 更新品牌汇总
function updateBrandSummary() {
    const records = getIncomeRecords();
    const brandSummary = document.getElementById('brandSummary');
    const currentYear = new Date().getFullYear();
    
    // 筛选今年的记录
    const thisYearRecords = records.filter(record => {
        const recordYear = new Date(record.date).getFullYear();
        return recordYear === currentYear;
    });
    
    // 按品牌分组统计
    const brandTotals = {};
    thisYearRecords.forEach(record => {
        if (!brandTotals[record.client]) {
            brandTotals[record.client] = {
                totalAmount: 0,
                records: []
            };
        }
        brandTotals[record.client].totalAmount += record.totalAmount;
        brandTotals[record.client].records.push(record);
    });
    
    // 获取客户结款金额
    const clientPayments = getClientPayments();
    
    if (Object.keys(brandTotals).length === 0) {
        brandSummary.innerHTML = '<div class="empty-state">暂无品牌记录</div>';
        return;
    }
    
    const summaryHtml = Object.entries(brandTotals).map(([brand, data]) => {
        const payment = parseFloat(clientPayments[brand] || 0);
        const balance = data.totalAmount - payment;
        
        return `
        <div class="summary-card" onclick="showStoreDetails('${brand}')" style="cursor: pointer;">
            <h3>${brand}</h3>
            <div class="summary-details">
                <div class="summary-row">
                    <span class="summary-label">总安装费用:</span>
                    <span class="summary-value">¥${data.totalAmount.toFixed(2)}</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">未结款金额:</span>
                    <span class="summary-value balance-positive">¥${balance.toFixed(2)}</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">已结款金额:</span>
                    <span class="summary-value balance-zero">¥${payment.toFixed(2)}</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">记录数:</span>
                    <span class="summary-value">${data.records.length}条</span>
                </div>
            </div>
        </div>
        `;
    }).join('');
    
    brandSummary.innerHTML = summaryHtml;
}

// 更新店面明细
function updateStoreDetails(brand) {
    const records = getIncomeRecords();
    const storeDetails = document.getElementById('storeDetails');
    const currentYear = new Date().getFullYear();
    
    // 筛选该品牌今年的记录
    const brandRecords = records.filter(record => {
        const recordYear = new Date(record.date).getFullYear();
        return record.client === brand && recordYear === currentYear;
    });
    
    if (brandRecords.length === 0) {
        storeDetails.innerHTML = '<div class="empty-state">暂无该品牌的记录</div>';
        return;
    }
    
    // 添加品牌汇总信息
    let brandTotal = 0;
    let brandPaid = 0;
    const clientPayments = getClientPayments();
    
    brandRecords.forEach(record => {
        brandTotal += record.totalAmount;
    });
    
    const payment = parseFloat(clientPayments[brand] || 0);
    brandPaid = Math.min(payment, brandTotal);
    const brandUnpaid = brandTotal - brandPaid;
    
    const summaryHtml = `
        <div class="summary-card" style="margin-bottom: 20px;">
            <h3>${brand} 汇总</h3>
            <div class="summary-details">
                <div class="summary-row">
                    <span class="summary-label">总安装费用:</span>
                    <span class="summary-value">¥${brandTotal.toFixed(2)}</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">已结款金额:</span>
                    <span class="summary-value balance-zero">¥${brandPaid.toFixed(2)}</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">未结款金额:</span>
                    <span class="summary-value balance-positive">¥${brandUnpaid.toFixed(2)}</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">记录数:</span>
                    <span class="summary-value">${brandRecords.length}条</span>
                </div>
            </div>
            <div class="summary-actions">
                <button class="btn btn-small btn-edit" onclick="shareBrandDetails('${brand}')">分享品牌明细</button>
            </div>
        </div>
    `;
    
    const detailsHtml = brandRecords.map(record => {
        // 计算该记录的已结款状态
        const isPaid = payment >= record.totalAmount;
        
        return `
        <div class="record-item" style="border-left-color: ${isPaid ? '#27ae60' : '#e74c3c'};">
            <div class="record-header">
                <span class="record-date">${formatDate(record.date)}</span>
                <span class="record-amount" style="color: ${isPaid ? '#27ae60' : '#e74c3c'};">¥${record.totalAmount.toFixed(2)}</span>
            </div>
            <div class="record-info">
                <strong>地址:</strong> ${record.address} ${record.password ? `<strong>密码:</strong> ${record.password}` : ''}
            </div>
            <div class="record-items">
                <table class="record-items-table">
                    <thead>
                        <tr>
                            <th>项目名称</th>
                            <th>长(mm)</th>
                            <th>高(mm)</th>
                            <th>面积(㎡)</th>
                            <th>单价(元)</th>
                            <th>小计(元)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${record.items.map(item => `
                            <tr>
                                <td>${item.name}</td>
                                <td>${item.length}</td>
                                <td>${item.height}</td>
                                <td>${item.area.toFixed(3)}</td>
                                <td>¥${item.unitPrice.toFixed(2)}</td>
                                <td>¥${item.subtotal.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ${record.note ? `<div class="record-note">${record.note}</div>` : ''}
            <div class="record-actions">
                <button class="btn btn-small btn-edit" onclick="shareRecord('${record.id}')">分享记录</button>
            </div>
        </div>
        `;
    }).join('');
    
    storeDetails.innerHTML = summaryHtml + detailsHtml;
}

// 分享品牌明细
function shareBrandDetails(brand) {
    // 这里可以实现分享功能，例如生成图片或导出数据
    showNotification('分享功能已触发，品牌: ' + brand);
    
    // 简单实现：将品牌明细转换为文本并提示用户复制
    const records = getIncomeRecords();
    const currentYear = new Date().getFullYear();
    const brandRecords = records.filter(record => {
        const recordYear = new Date(record.date).getFullYear();
        return record.client === brand && recordYear === currentYear;
    });
    
    let shareText = `${brand} 年度明细\n\n`;
    
    // 添加汇总信息
    let totalAmount = 0;
    brandRecords.forEach(record => {
        totalAmount += record.totalAmount;
    });
    shareText += `总计: ¥${totalAmount.toFixed(2)}\n\n`;
    
    // 添加每条记录的详细信息
    brandRecords.forEach((record, index) => {
        shareText += `${index + 1}. ${formatDate(record.date)}\n`;
        shareText += `   地址: ${record.address} ${record.password ? `密码: ${record.password}` : ''}\n`;
        shareText += `   金额: ¥${record.totalAmount.toFixed(2)}\n`;
        shareText += `   项目:\n`;
        record.items.forEach(item => {
            shareText += `     - ${item.name}: ${item.length}mm × ${item.height}mm = ${item.area.toFixed(3)}㎡ × ¥${item.unitPrice.toFixed(2)} = ¥${item.subtotal.toFixed(2)}\n`;
        });
        if (record.note) {
            shareText += `   备注: ${record.note}\n`;
        }
        shareText += `\n`;
    });
    
    // 创建一个临时文本区域用于复制
    const textarea = document.createElement('textarea');
    textarea.value = shareText;
    textarea.style.position = 'fixed';
    textarea.style.left = '-999999px';
    textarea.style.top = '-999999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    
    try {
        // 复制到剪贴板
        document.execCommand('copy');
        showNotification('品牌明细已复制到剪贴板，可直接粘贴分享');
    } catch (err) {
        showNotification('复制失败，请手动复制以下内容');
        // 显示文本供用户手动复制
        showModal('品牌明细', `<pre style="white-space: pre-wrap;">${shareText}</pre>`, null, null, true);
    }
    
    document.body.removeChild(textarea);
}

// 分享单条记录
function shareRecord(id) {
    const records = getIncomeRecords();
    const record = records.find(r => r.id === id);
    
    if (!record) return;
    
    let shareText = `安装记录\n\n`;
    shareText += `日期: ${formatDate(record.date)}\n`;
    shareText += `品牌: ${record.client}\n`;
    shareText += `地址: ${record.address} ${record.password ? `密码: ${record.password}` : ''}\n`;
    shareText += `总计金额: ¥${record.totalAmount.toFixed(2)}\n\n`;
    shareText += `安装项目:\n`;
    
    record.items.forEach(item => {
        shareText += `- ${item.name}: ${item.length}mm × ${item.height}mm = ${item.area.toFixed(3)}㎡ × ¥${item.unitPrice.toFixed(2)} = ¥${item.subtotal.toFixed(2)}\n`;
    });
    
    if (record.note) {
        shareText += `\n备注: ${record.note}`;
    }
    
    // 创建一个临时文本区域用于复制
    const textarea = document.createElement('textarea');
    textarea.value = shareText;
    textarea.style.position = 'fixed';
    textarea.style.left = '-999999px';
    textarea.style.top = '-999999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    
    try {
        // 复制到剪贴板
        document.execCommand('copy');
        showNotification('记录已复制到剪贴板，可直接粘贴分享');
    } catch (err) {
        showNotification('复制失败，请手动复制以下内容');
        // 显示文本供用户手动复制
        showModal('安装记录', `<pre style="white-space: pre-wrap;">${shareText}</pre>`, null, null, true);
    }
    
    document.body.removeChild(textarea);
}

// 更新统计信息
function updateStats(records) {
    const totalRecords = records.length;
    const totalAmount = records.reduce((sum, record) => sum + record.totalAmount, 0);
    
    document.getElementById('totalRecords').textContent = totalRecords;
    document.getElementById('totalAmount').textContent = `¥${totalAmount.toFixed(2)}`;
}

// 更新客户汇总
function updateClientSummary(records) {
    const clientSummary = document.getElementById('clientSummary');
    
    // 按客户名称分组统计
    const clientTotals = {};
    records.forEach(record => {
        if (!clientTotals[record.client]) {
            clientTotals[record.client] = {
                totalAmount: 0,
                address: record.address,
                password: record.password
            };
        }
        clientTotals[record.client].totalAmount += record.totalAmount;
    });
    
    // 获取客户结款金额
    const clientPayments = getClientPayments();
    
    // 计算每个客户的未结金额，并过滤掉未结金额为0的客户
    const activeClients = Object.entries(clientTotals).map(([client, data]) => {
        const payment = parseFloat(clientPayments[client] || 0);
        const balance = data.totalAmount - payment;
        return {
            client,
            ...data,
            payment,
            balance
        };
    }).filter(client => client.balance > 0) // 只保留未结金额大于0的客户
      .sort((a, b) => b.balance - a.balance); // 按未结金额从大到小排序
    
    if (activeClients.length === 0) {
        clientSummary.innerHTML = '<div class="empty-state">暂无未结款客户记录</div>';
        return;
    }
    
    const summaryHtml = activeClients.map(client => `
        <div class="summary-card">
            <h3>${client.client}</h3>
            <div class="summary-info">地址: ${client.address}</div>
            ${client.password ? `<div class="summary-info">密码: ${client.password}</div>` : ''}
            <div class="summary-details">
                <div class="summary-row">
                    <span class="summary-label">总计金额:</span>
                    <span class="summary-value">¥${client.totalAmount.toFixed(2)}</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">已结金额:</span>
                    <span class="summary-value">¥${client.payment.toFixed(2)}</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">未结金额:</span>
                    <span class="summary-value balance-positive">¥${client.balance.toFixed(2)}</span>
                </div>
            </div>
            <div class="summary-actions">
                <button class="btn btn-small btn-edit" onclick="editClientPayment('${client.client}', ${client.payment}, ${client.totalAmount})">修改结款</button>
            </div>
        </div>
        `).join('');
    
    clientSummary.innerHTML = summaryHtml;
}

// 更新支出汇总
function updateExpenseSummary() {
    const records = getExpenseRecords();
    const currentYear = new Date().getFullYear();
    
    // 筛选今年的记录
    const thisYearRecords = records.filter(record => {
        const recordYear = new Date(record.date).getFullYear();
        return recordYear === currentYear;
    });
    
    // 计算年度支出总计
    const annualExpenseTotal = thisYearRecords.reduce((sum, record) => sum + record.amount, 0);
    document.getElementById('annualExpenseTotal').textContent = `¥${annualExpenseTotal.toFixed(2)}`;
    
    // 更新月度支出汇总
    const monthlyExpenses = document.getElementById('monthlyExpenses');
    
    // 按月份分组统计
    const monthlyTotals = {};
    thisYearRecords.forEach(record => {
        const monthKey = record.date.substring(0, 7); // YYYY-MM
        if (!monthlyTotals[monthKey]) {
            monthlyTotals[monthKey] = 0;
        }
        monthlyTotals[monthKey] += record.amount;
    });
    
    if (Object.keys(monthlyTotals).length === 0) {
        monthlyExpenses.innerHTML = '<div class="empty-state">暂无支出记录</div>';
        return;
    }
    
    // 按月份排序（最新的月份在前）
    const sortedMonths = Object.entries(monthlyTotals).sort((a, b) => b[0].localeCompare(a[0]));
    
    const summaryHtml = sortedMonths.map(([month, amount]) => {
        const monthName = `${month.substring(0, 4)}年${month.substring(5)}月`;
        return `
            <div class="summary-card">
                <h3>${monthName}</h3>
                <div class="summary-amount" style="color: #e74c3c;">¥${amount.toFixed(2)}</div>
            </div>
        `;
    }).join('');
    
    monthlyExpenses.innerHTML = summaryHtml;
}

// 切换支出汇总
function toggleExpenseSummary(initialHide = false) {
    const container = document.getElementById('expenseSummaryContainer');
    const btn = document.querySelector('[onclick="toggleExpenseSummary()"]');
    
    if (initialHide || container.classList.contains('collapsed')) {
        container.classList.remove('collapsed');
        btn.classList.remove('collapsed');
        btn.textContent = '▼';
    } else {
        container.classList.add('collapsed');
        btn.classList.add('collapsed');
        btn.textContent = '▶';
    }
}

// 其他功能

// 清空所有记录
function clearAllRecords() {
    if (confirm('确定要清空所有收入和支出记录吗？此操作不可恢复！')) {
        // 显示密码输入框
        showModal('清空确认', `
            <div class="form-group" style="margin-bottom: 15px;">
                <label for="clearPassword" style="display: block; margin-bottom: 5px; font-weight: bold;">请输入密码:</label>
                <input type="password" id="clearPassword" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 3px; font-size: 16px;">
            </div>
        `, function() {
            const password = document.getElementById('clearPassword').value;
            
            // 验证密码
            if (password !== '123456') {
                showNotification('密码错误，无法清空记录');
                return;
            }
            
            // 执行清空操作
            // 使用正确的数据访问函数
            const userData = getUserData();
            userData.incomeRecords = [];
            userData.expenseRecords = [];
            saveUserData(userData);
            
            loadAllData();
            showNotification('所有记录已清空');
        });
    }
}

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 显示模态框
function showModal(title, content, onConfirm, onCancel) {
    // 创建模态框背景
    const modalOverlay = document.createElement('div');
    modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1001;
    `;
    
    // 创建模态框
    const modal = document.createElement('div');
    modal.style.cssText = `
        background-color: white;
        border-radius: 8px;
        padding: 20px;
        width: 90%;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;
    
    // 模态框内容
    modal.innerHTML = `
        <h3 style="margin-top: 0; margin-bottom: 20px;">${title}</h3>
        <div>${content}</div>
        <div style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 10px;">
            <button id="modalCancel" class="btn btn-small" style="background-color: #95a5a6; color: white; margin-right: auto;">取消</button>
            <button id="modalConfirm" class="btn btn-small">确认</button>
        </div>
    `;
    
    // 添加到页面
    modalOverlay.appendChild(modal);
    document.body.appendChild(modalOverlay);
    
    // 绑定事件
    modalOverlay.addEventListener('click', function(e) {
        if (e.target === modalOverlay) {
            modalOverlay.remove();
            if (onCancel) onCancel();
        }
    });
    
    modal.querySelector('#modalCancel').addEventListener('click', function() {
        modalOverlay.remove();
        if (onCancel) onCancel();
    });
    
    modal.querySelector('#modalConfirm').addEventListener('click', function() {
        if (onConfirm) onConfirm();
        modalOverlay.remove();
    });
}

// 编辑客户结款金额
function editClientPayment(client, currentPayment, totalAmount) {
    // 创建模态框元素
    const modalOverlay = document.createElement('div');
    modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1001;
    `;
    
    // 创建模态框
    const modal = document.createElement('div');
    modal.style.cssText = `
        background-color: white;
        border-radius: 8px;
        padding: 20px;
        width: 90%;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;
    
    // 模态框内容
    modal.innerHTML = `
        <h3 style="margin-top: 0; margin-bottom: 20px;">修改${client}的结款金额</h3>
        <div class="form-group" style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">当前总计金额:</label>
            <div style="padding: 8px; background-color: #f8f9fa; border: 1px solid #ddd; border-radius: 3px;">¥${totalAmount.toFixed(2)}</div>
        </div>
        <div class="form-group" style="margin-bottom: 15px;">
            <label for="newPayment" style="display: block; margin-bottom: 5px; font-weight: bold;">新的结款金额:</label>
            <input type="number" id="newPayment" step="0.01" min="0" max="${totalAmount}" value="${currentPayment}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 3px; font-size: 16px;">
        </div>
        <div class="form-group" style="margin-bottom: 15px;">
            <label for="paymentPassword" style="display: block; margin-bottom: 5px; font-weight: bold;">系统密码:</label>
            <input type="password" id="paymentPassword" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 3px; font-size: 16px;">
        </div>
        <div style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 10px;">
            <button id="modalCancel" class="btn btn-small" style="background-color: #95a5a6; color: white; margin-right: auto;">取消</button>
            <button id="modalConfirm" class="btn btn-small">确认</button>
        </div>
    `;
    
    // 添加到页面
    modalOverlay.appendChild(modal);
    document.body.appendChild(modalOverlay);
    
    // 绑定事件
    modalOverlay.addEventListener('click', function(e) {
        if (e.target === modalOverlay) {
            modalOverlay.remove();
        }
    });
    
    modal.querySelector('#modalCancel').addEventListener('click', function() {
        modalOverlay.remove();
    });
    
    modal.querySelector('#modalConfirm').addEventListener('click', function() {
        // 在模态框关闭前获取输入值
        const newPayment = parseFloat(modal.querySelector('#newPayment').value);
        const password = modal.querySelector('#paymentPassword').value;
        
        // 验证密码
        if (password !== '123456') {
            showNotification('密码错误，无法修改结款金额');
            modalOverlay.remove();
            return;
        }
        
        // 验证结款金额
        if (isNaN(newPayment) || newPayment < 0 || newPayment > totalAmount) {
            showNotification('结款金额无效，请重新输入');
            modalOverlay.remove();
            return;
        }
        
        // 更新结款金额
        setClientPayment(client, newPayment);
        
        // 重新加载数据
        loadAllData();
        
        // 显示成功提示
        showNotification(`已更新${client}的结款金额`);
        
        // 关闭模态框
        modalOverlay.remove();
    });
}

// 显示通知
function showNotification(message) {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #27ae60;
        color: white;
        padding: 15px 20px;
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        font-size: 16px;
        transition: transform 0.3s, opacity 0.3s;
    `;
    notification.textContent = message;
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 3秒后自动移除
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// 折叠功能

// 切换收入记录表单
function toggleIncomeForm(initialHide = false) {
    const container = document.getElementById('incomeFormContainer');
    const btn = document.querySelector('[onclick="toggleIncomeForm()"]');
    
    if (initialHide || container.classList.contains('collapsed')) {
        container.classList.remove('collapsed');
        btn.classList.remove('collapsed');
        btn.textContent = '▼';
    } else {
        container.classList.add('collapsed');
        btn.classList.add('collapsed');
        btn.textContent = '▶';
    }
}

// 切换支出记录表单
function toggleExpenseForm(initialHide = false) {
    const container = document.getElementById('expenseFormContainer');
    const btn = document.querySelector('[onclick="toggleExpenseForm()"]');
    
    if (initialHide || container.classList.contains('collapsed')) {
        container.classList.remove('collapsed');
        btn.classList.remove('collapsed');
        btn.textContent = '▼';
    } else {
        container.classList.add('collapsed');
        btn.classList.add('collapsed');
        btn.textContent = '▶';
    }
}

// 切换月度支出汇总
function toggleMonthlyExpenses(initialHide = false) {
    const container = document.getElementById('monthlyExpensesContainer');
    const btn = document.querySelector('[onclick="toggleMonthlyExpenses()"]');
    
    if (initialHide || container.classList.contains('collapsed')) {
        container.classList.remove('collapsed');
        btn.classList.remove('collapsed');
        btn.textContent = '▼';
    } else {
        container.classList.add('collapsed');
        btn.classList.add('collapsed');
        btn.textContent = '▶';
    }
}

// 切换支出记录列表
function toggleExpensesList(initialHide = false) {
    const container = document.getElementById('expensesListContainer');
    const btn = document.querySelector('[onclick="toggleExpensesList()"]');
    
    if (initialHide || container.classList.contains('collapsed')) {
        container.classList.remove('collapsed');
        btn.classList.remove('collapsed');
        btn.textContent = '▼';
    } else {
        container.classList.add('collapsed');
        btn.classList.add('collapsed');
        btn.textContent = '▶';
    }
}

// 切换结款变动日志
function togglePaymentLogs(initialHide = false) {
    const container = document.getElementById('paymentLogsContainer');
    const btn = document.querySelector('[onclick="togglePaymentLogs()"]');
    
    if (initialHide || container.classList.contains('collapsed')) {
        container.classList.remove('collapsed');
        btn.classList.remove('collapsed');
        btn.textContent = '▼';
        // 显示日志内容
        updatePaymentLogs();
    } else {
        container.classList.add('collapsed');
        btn.classList.add('collapsed');
        btn.textContent = '▶';
    }
}

// 更新结款变动日志显示
function updatePaymentLogs() {
    const logsContainer = document.getElementById('paymentLogs');
    const logs = getPaymentLogs();
    
    if (logs.length === 0) {
        logsContainer.innerHTML = '<div class="empty-state">暂无结款变动记录</div>';
        return;
    }
    
    const logsHtml = logs.map(log => {
        const changeClass = log.change > 0 ? 'balance-zero' : log.change < 0 ? 'balance-positive' : '';
        const changeText = log.change > 0 ? `+¥${log.change.toFixed(2)}` : log.change < 0 ? `-¥${Math.abs(log.change).toFixed(2)}` : '¥0.00';
        
        return `
        <div class="summary-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h3 style="margin: 0; font-size: 16px;">${log.client}</h3>
                <span style="color: #3498db; font-size: 14px;">${log.date} ${log.time}</span>
            </div>
            <div class="summary-details">
                <div class="summary-row">
                    <span class="summary-label">旧金额:</span>
                    <span class="summary-value">¥${log.oldAmount.toFixed(2)}</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">新金额:</span>
                    <span class="summary-value">¥${log.newAmount.toFixed(2)}</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">变动:</span>
                    <span class="summary-value ${changeClass}">${changeText}</span>
                </div>
            </div>
        </div>
        `;
    }).join('');
    
    logsContainer.innerHTML = logsHtml;
}

// 为记录详情表格添加样式
const style = document.createElement('style');
style.textContent = `
    .record-items {
        margin: 15px 0;
        overflow-x: auto;
    }
    
    .record-items-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 14px;
        background-color: white;
        border: 1px solid #ddd;
    }
    
    .record-items-table th,
    .record-items-table td {
        padding: 8px 12px;
        text-align: left;
        border-bottom: 1px solid #ddd;
    }
    
    .record-items-table th {
        background-color: #f8f9fa;
        font-weight: bold;
    }
    
    .record-items-table .total-row {
        background-color: #e8f4f8;
    }
    
    .record-info {
        margin: 10px 0;
        color: #666;
        font-size: 14px;
        line-height: 1.5;
    }
    
    @media (max-width: 600px) {
        .record-items-table {
            font-size: 12px;
        }
        
        .record-items-table th,
        .record-items-table td {
            padding: 6px 8px;
        }
        
        .record-info {
            font-size: 12px;
        }
    }
`;
document.head.appendChild(style);