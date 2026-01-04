// 安装收入记账APP JavaScript

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    // 设置默认日期为今天
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
    document.getElementById('expenseDate').value = today;
    
    // 默认隐藏支出相关部分
    toggleExpenseForm(true);
    toggleMonthlyExpenses(true);
    toggleExpensesList(true);
    
    // 加载所有数据
    loadAllData();
    
    // 绑定事件
    document.getElementById('incomeForm').addEventListener('submit', addIncomeRecord);
    document.getElementById('expenseForm').addEventListener('submit', addExpenseRecord);
    document.getElementById('search').addEventListener('input', searchIncomeRecords);
    document.getElementById('clearAll').addEventListener('click', clearAllRecords);
    document.getElementById('addRow').addEventListener('click', addTableRow);
    document.getElementById('changePassword').addEventListener('click', showChangePasswordModal);
    
    // 为初始行绑定事件
    bindRowEvents(document.querySelector('.item-row'));
    
    // 计算初始总计
    calculateTotal();
});

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
    let password = localStorage.getItem('systemPassword');
    // 首次使用，设置默认密码123456
    if (!password) {
        password = '123456';
        localStorage.setItem('systemPassword', password);
    }
    return password;
}

function setSystemPassword(newPassword) {
    localStorage.setItem('systemPassword', newPassword);
}

// 客户结款金额管理
function getClientPayments() {
    const paymentsJson = localStorage.getItem('clientPayments');
    return paymentsJson ? JSON.parse(paymentsJson) : {};
}

function saveClientPayments(payments) {
    localStorage.setItem('clientPayments', JSON.stringify(payments));
}

function getClientPayment(client) {
    const payments = getClientPayments();
    return parseFloat(payments[client] || 0);
}

function setClientPayment(client, amount) {
    const payments = getClientPayments();
    payments[client] = amount;
    saveClientPayments(payments);
}

// 收入记录管理
function getIncomeRecords() {
    const recordsJson = localStorage.getItem('incomeRecords');
    return recordsJson ? JSON.parse(recordsJson) : [];
}

// 保存收入记录
function saveIncomeRecords(records) {
    localStorage.setItem('incomeRecords', JSON.stringify(records));
}

// 获取支出记录
function getExpenseRecords() {
    const recordsJson = localStorage.getItem('expenseRecords');
    return recordsJson ? JSON.parse(recordsJson) : [];
}

// 保存支出记录
function saveExpenseRecords(records) {
    localStorage.setItem('expenseRecords', JSON.stringify(records));
}

// 加载所有数据
function loadAllData() {
    // 加载收入记录
    const incomeRecords = getIncomeRecords();
    displayIncomeRecords(incomeRecords);
    updateStats(incomeRecords);
    updateClientSummary(incomeRecords);
    
    // 加载支出记录
    const expenseRecords = getExpenseRecords();
    displayExpenseRecords(expenseRecords);
    updateMonthlyExpenses(expenseRecords);
}

// 表格行管理

// 添加表格行
function addTableRow() {
    const tbody = document.querySelector('#itemsTable tbody');
    const newRow = document.createElement('tr');
    newRow.className = 'item-row';
    
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
    
    // 为输入框绑定事件，实时计算面积和小计
    const inputs = row.querySelectorAll('.length, .height, .unit-price');
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            calculateArea(row);
            calculateSubtotal(row);
            calculateTotal();
        });
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
        const length = parseFloat(row.querySelector('.length').value);
        const height = parseFloat(row.querySelector('.height').value);
        const area = parseFloat(row.querySelector('.area').value);
        const unitPrice = parseFloat(row.querySelector('.unit-price').value);
        const subtotal = parseFloat(row.querySelector('.subtotal').value);
        
        // 验证必填项
        if (!itemName || isNaN(length) || isNaN(height) || isNaN(unitPrice)) {
            showNotification('请填写完整的项目信息');
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
    
    // 添加新的初始行
    const newRow = document.createElement('tr');
    newRow.className = 'item-row';
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
        
        newRow.innerHTML = `
            <td><input type="text" class="item-name" placeholder="请输入项目名称" required value="${item.name}"></td>
            <td><input type="number" class="length" step="1" placeholder="0" min="0" required value="${item.length}"></td>
            <td><input type="number" class="height" step="1" placeholder="0" min="0" required value="${item.height}"></td>
            <td><input type="number" class="area" step="0.001" placeholder="0.000" readonly value="${item.area.toFixed(3)}"></td>
            <td><input type="number" class="unit-price" step="0.01" placeholder="0.00" min="0" required value="${item.unitPrice}"></td>
            <td><input type="number" class="subtotal" step="0.01" placeholder="0.00" readonly value="${item.subtotal.toFixed(2)}"></td>
            <td><button type="button" class="btn btn-small btn-delete-row">删除</button></td>
        `;
        
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
}

// 删除收入记录
function deleteIncomeRecord(id) {
    if (confirm('确定要删除这条收入记录吗？')) {
        const records = getIncomeRecords();
        const updatedRecords = records.filter(record => record.id !== id);
        saveIncomeRecords(updatedRecords);
        loadAllData();
        showNotification('收入记录已删除');
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
    
    if (Object.keys(clientTotals).length === 0) {
        clientSummary.innerHTML = '<div class="empty-state">暂无客户记录</div>';
        return;
    }
    
    // 获取客户结款金额
    const clientPayments = getClientPayments();
    
    const summaryHtml = Object.entries(clientTotals).map(([client, data]) => {
        const payment = parseFloat(clientPayments[client] || 0);
        const balance = data.totalAmount - payment;
        
        return `
        <div class="summary-card">
            <h3>${client}</h3>
            <div class="summary-info">地址: ${data.address}</div>
            ${data.password ? `<div class="summary-info">密码: ${data.password}</div>` : ''}
            <div class="summary-details">
                <div class="summary-row">
                    <span class="summary-label">总计金额:</span>
                    <span class="summary-value">¥${data.totalAmount.toFixed(2)}</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">已结金额:</span>
                    <span class="summary-value">¥${payment.toFixed(2)}</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">未结金额:</span>
                    <span class="summary-value ${balance > 0 ? 'balance-positive' : 'balance-zero'}">¥${balance.toFixed(2)}</span>
                </div>
            </div>
            <div class="summary-actions">
                <button class="btn btn-small btn-edit" onclick="editClientPayment('${client}', ${payment}, ${data.totalAmount})">修改结款</button>
            </div>
        </div>
        `;
    }).join('');
    
    clientSummary.innerHTML = summaryHtml;
}

// 更新月度支出汇总
function updateMonthlyExpenses(records) {
    const monthlyExpenses = document.getElementById('monthlyExpenses');
    
    // 按月份分组统计
    const monthlyTotals = {};
    records.forEach(record => {
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

// 其他功能

// 清空所有记录
function clearAllRecords() {
    if (confirm('确定要清空所有收入和支出记录吗？此操作不可恢复！')) {
        localStorage.removeItem('incomeRecords');
        localStorage.removeItem('expenseRecords');
        loadAllData();
        showNotification('所有记录已清空');
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
        if (password !== getSystemPassword()) {
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