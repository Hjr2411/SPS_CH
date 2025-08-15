// Configuração do Firebase - Integrada diretamente
const firebaseConfig = {
    apiKey: "AIzaSyAeCrURSs0TBXlYF3TKLi4q98VwrGaKe_Q",
    authDomain: "spsch-849e5.firebaseapp.com",
    databaseURL: "https://spsch-849e5-default-rtdb.firebaseio.com",
    projectId: "spsch-849e5",
    storageBucket: "spsch-849e5.firebasestorage.app",
    messagingSenderId: "698967090558",
    appId: "1:698967090558:web:978781fd27b86c36203f2f",
    measurementId: "G-C5D3774P2G"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Variáveis globais
let currentUser = null;
let allTickets = [];
let allUsers = [];
let filteredTickets = [];
let currentCyclePeriod = 'day';
let cycleCharts = {};

// Elementos DOM
const loginScreen = document.getElementById('loginScreen');
const userScreen = document.getElementById('userScreen');
const adminScreen = document.getElementById('adminScreen');
const loginForm = document.getElementById('loginForm');
const ticketForm = document.getElementById('ticketForm');
const userForm = document.getElementById('userForm');
const loginError = document.getElementById('loginError');

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    createInitialData();
});

// Configurar event listeners
function setupEventListeners() {
    // Login
    loginForm.addEventListener('submit', handleLogin);
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('adminLogoutBtn').addEventListener('click', logout);
    
    // Formulário de chamado
    ticketForm.addEventListener('submit', handleTicketSubmit);
    
    // Tabs do admin
    document.getElementById('dashboardTab').addEventListener('click', () => showTab('dashboard'));
    document.getElementById('cycleTab').addEventListener('click', () => showTab('cycle'));
    document.getElementById('usersTab').addEventListener('click', () => showTab('users'));
    document.getElementById('ticketsTab').addEventListener('click', () => showTab('tickets'));
    
    // Filtros
    document.getElementById('applyFilters').addEventListener('click', applyFilters);
    
    // Fechamento de Ciclo
    document.querySelectorAll('.cycle-btn').forEach(btn => {
        btn.addEventListener('click', () => selectCyclePeriod(btn.dataset.period));
    });
    document.getElementById('generateCycleReport').addEventListener('click', generateCycleReport);
    document.getElementById('exportCycleData').addEventListener('click', exportCycleData);
    document.getElementById('exportTicketsBtn').addEventListener('click', exportTicketsData);
    
    // Modal de usuário
    document.getElementById('addUserBtn').addEventListener('click', () => openUserModal());
    document.getElementById('cancelUserBtn').addEventListener('click', closeUserModal);
    document.querySelector('.close').addEventListener('click', closeUserModal);
    document.getElementById('userForm').addEventListener('submit', handleUserSubmit);
    
    // Fechar modal clicando fora
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('userModal');
        if (event.target === modal) {
            closeUserModal();
        }
    });
    
    // Definir data atual no formulário
    document.getElementById('dataEncaminhamento').valueAsDate = new Date();
    document.getElementById('cycleDate').valueAsDate = new Date();
}

// Inicializar aplicação
function initializeApp() {
    // Verificar se há usuário logado
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        if (currentUser.admin) {
            showAdminScreen();
        } else {
            showUserScreen();
        }
    } else {
        showLoginScreen();
    }
}

// Criar dados iniciais
function createInitialData() {
    // Criar estrutura inicial se não existir
    database.ref('app').once('value', (snapshot) => {
        if (!snapshot.exists()) {
            const initialData = {
                users: {
                    'helio': {
                        nome: 'Helio',
                        senhaHash: '12345678', // Em produção, usar hash real
                        admin: true,
                        ativo: true
                    }
                },
                listas: {
                    equipamentos: ["HLR","HHUA","HLREDA","HSS","RTC","VPNSIX","SGV","Claro flex"],
                    cenarios: ["Voz","Dados","Voz e dados","Não localizado no SPSWeb","Falha no equipamento","Franquia de dados","Assinante não possui HSS","4G/5G inativo","Restrito/RESTRICTED"]
                }
            };
            database.ref('app').set(initialData);
        }
    });
}

// Funções de autenticação
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.toLowerCase();
    const password = document.getElementById('password').value;
    
    try {
        const snapshot = await database.ref('app/users/' + username).once('value');
        const user = snapshot.val();
        
        if (user && user.senhaHash === password && user.ativo) {
            currentUser = {
                nome: user.nome,
                admin: user.admin,
                username: username
            };
            
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            if (user.admin) {
                showAdminScreen();
            } else {
                showUserScreen();
            }
            
            hideError();
        } else {
            showError('Usuário ou senha incorretos');
        }
    } catch (error) {
        console.error('Erro no login:', error);
        showError('Erro ao fazer login. Tente novamente.');
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    showLoginScreen();
}

// Funções de navegação
function showLoginScreen() {
    hideAllScreens();
    loginScreen.classList.add('active');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    hideError();
}

function showUserScreen() {
    hideAllScreens();
    userScreen.classList.add('active');
    document.getElementById('currentUser').textContent = currentUser.nome;
    document.getElementById('analista').value = currentUser.nome;
    clearTicketForm();
    loadUserLists(); // Carregar listas para os selects
}

// Função para carregar listas na tela de usuário
async function loadUserLists() {
    try {
        const listasSnapshot = await database.ref('app/listas').once('value');
        if (listasSnapshot.exists()) {
            const listas = listasSnapshot.val();
            populateSelectOptions(listas);
        }
    } catch (error) {
        console.error('Erro ao carregar listas:', error);
    }
}

function showAdminScreen() {
    hideAllScreens();
    adminScreen.classList.add('active');
    document.getElementById('currentAdminUser').textContent = currentUser.nome;
    showTab('dashboard');
    loadAllData();
}

function hideAllScreens() {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
}

// Funções de chamados
async function handleTicketSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(ticketForm);
    const now = Date.now();
    const ticketData = {
        analista: formData.get('analista'),
        chamado: formData.get('chamado'),
        linha: formData.get('linha'),
        equipamento: formData.get('equipamento'),
        cenario: formData.get('cenario'),
        dataEncaminhamento: formData.get('dataEncaminhamento'),
        createdAt: now,
        updatedAt: now,
        createdBy: currentUser.username,
        deleted: false,
        status: 'Aberto'
    };
    
    try {
        await database.ref('app/chamados').push(ticketData);
        showSuccessMessage('Chamado salvo com sucesso!');
        clearTicketForm();
    } catch (error) {
        console.error('Erro ao salvar chamado:', error);
        showError('Erro ao salvar chamado. Tente novamente.');
    }
}

function clearTicketForm() {
    document.getElementById('chamado').value = '';
    document.getElementById('linha').value = '';
    document.getElementById('equipamento').value = '';
    document.getElementById('cenario').value = '';
    document.getElementById('dataEncaminhamento').valueAsDate = new Date();
}

// Funções de administração
function showTab(tabName) {
    // Remover classe active de todas as abas
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Ativar aba selecionada
    document.getElementById(tabName + 'Tab').classList.add('active');
    document.getElementById(tabName + 'Content').classList.add('active');
    
    // Carregar dados específicos da aba
    switch(tabName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'cycle':
            loadCycleAnalysis();
            break;
        case 'users':
            loadUsers();
            break;
        case 'tickets':
            loadTickets();
            break;
    }
}

async function loadAllData() {
    try {
        // Carregar usuários
        const usersSnapshot = await database.ref('app/users').once('value');
        allUsers = [];
        if (usersSnapshot.exists()) {
            const usersData = usersSnapshot.val();
            Object.keys(usersData).forEach(key => {
                if (usersData[key].ativo) { // Só carregar usuários ativos
                    allUsers.push({
                        username: key,
                        ...usersData[key]
                    });
                }
            });
        }
        
        // Carregar chamados
        const ticketsSnapshot = await database.ref('app/chamados').once('value');
        allTickets = [];
        if (ticketsSnapshot.exists()) {
            const ticketsData = ticketsSnapshot.val();
            Object.keys(ticketsData).forEach(key => {
                if (!ticketsData[key].deleted) { // Só carregar chamados não deletados
                    allTickets.push({
                        id: key,
                        ...ticketsData[key]
                    });
                }
            });
        }
        
        // Carregar listas
        const listasSnapshot = await database.ref('app/listas').once('value');
        if (listasSnapshot.exists()) {
            const listas = listasSnapshot.val();
            populateSelectOptions(listas);
        }
        
        filteredTickets = [...allTickets];
        
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
    }
}

// Função para popular selects com listas dinâmicas
function populateSelectOptions(listas) {
    // Popular select de equipamentos no formulário de usuário
    const equipamentoSelect = document.getElementById('equipamento');
    if (equipamentoSelect) {
        equipamentoSelect.innerHTML = '<option value="">Selecione...</option>';
        listas.equipamentos.forEach(eq => {
            equipamentoSelect.innerHTML += `<option value="${eq}">${eq}</option>`;
        });
    }
    
    // Popular select de cenários no formulário de usuário
    const cenarioSelect = document.getElementById('cenario');
    if (cenarioSelect) {
        cenarioSelect.innerHTML = '<option value="">Selecione...</option>';
        listas.cenarios.forEach(cenario => {
            cenarioSelect.innerHTML += `<option value="${cenario}">${cenario}</option>`;
        });
    }
}

// Dashboard
function loadDashboard() {
    updateStats();
    updateCharts();
    populateFilters();
}

function updateStats() {
    const today = new Date().toISOString().split('T')[0];
    const thisWeek = getWeekStart();
    const thisMonth = new Date().toISOString().slice(0, 7);
    
    const todayTickets = filteredTickets.filter(ticket => ticket.dataEncaminhamento === today).length;
    const weekTickets = filteredTickets.filter(ticket => ticket.dataEncaminhamento >= thisWeek).length;
    const monthTickets = filteredTickets.filter(ticket => ticket.dataEncaminhamento.startsWith(thisMonth)).length;
    
    document.getElementById('totalTickets').textContent = filteredTickets.length;
    document.getElementById('todayTickets').textContent = todayTickets;
    document.getElementById('weekTickets').textContent = weekTickets;
    document.getElementById('monthTickets').textContent = monthTickets;
}

function getWeekStart() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - dayOfWeek);
    return weekStart.toISOString().split('T')[0];
}

function updateCharts() {
    updateEquipmentChart();
    updateScenarioChart();
    updateAnalystChart();
}

function updateEquipmentChart() {
    const ctx = document.getElementById('equipmentChart').getContext('2d');
    const equipmentCounts = {};
    
    filteredTickets.forEach(ticket => {
        equipmentCounts[ticket.equipamento] = (equipmentCounts[ticket.equipamento] || 0) + 1;
    });
    
    // Destruir gráfico anterior se existir
    if (window.equipmentChartInstance) {
        window.equipmentChartInstance.destroy();
    }
    
    window.equipmentChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(equipmentCounts),
            datasets: [{
                data: Object.values(equipmentCounts),
                backgroundColor: [
                    '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd',
                    '#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function updateScenarioChart() {
    const ctx = document.getElementById('scenarioChart').getContext('2d');
    const scenarioCounts = {};
    
    filteredTickets.forEach(ticket => {
        scenarioCounts[ticket.cenario] = (scenarioCounts[ticket.cenario] || 0) + 1;
    });
    
    // Destruir gráfico anterior se existir
    if (window.scenarioChartInstance) {
        window.scenarioChartInstance.destroy();
    }
    
    window.scenarioChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(scenarioCounts),
            datasets: [{
                label: 'Quantidade',
                data: Object.values(scenarioCounts),
                backgroundColor: '#2563eb'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function updateAnalystChart() {
    const ctx = document.getElementById('analystChart').getContext('2d');
    const analystCounts = {};
    
    filteredTickets.forEach(ticket => {
        analystCounts[ticket.analista] = (analystCounts[ticket.analista] || 0) + 1;
    });
    
    // Destruir gráfico anterior se existir
    if (window.analystChartInstance) {
        window.analystChartInstance.destroy();
    }
    
    window.analystChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(analystCounts),
            datasets: [{
                data: Object.values(analystCounts),
                backgroundColor: [
                    '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd',
                    '#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function populateFilters() {
    // Equipamentos
    const equipamentos = [...new Set(allTickets.map(ticket => ticket.equipamento))];
    const equipamentoSelect = document.getElementById('filterEquipamento');
    equipamentoSelect.innerHTML = '<option value="">Todos</option>';
    equipamentos.forEach(eq => {
        equipamentoSelect.innerHTML += `<option value="${eq}">${eq}</option>`;
    });
    
    // Cenários
    const cenarios = [...new Set(allTickets.map(ticket => ticket.cenario))];
    const cenarioSelect = document.getElementById('filterCenario');
    cenarioSelect.innerHTML = '<option value="">Todos</option>';
    cenarios.forEach(cenario => {
        cenarioSelect.innerHTML += `<option value="${cenario}">${cenario}</option>`;
    });
    
    // Analistas
    const analistas = [...new Set(allTickets.map(ticket => ticket.analista))];
    const analistaSelect = document.getElementById('filterAnalista');
    analistaSelect.innerHTML = '<option value="">Todos</option>';
    analistas.forEach(analista => {
        analistaSelect.innerHTML += `<option value="${analista}">${analista}</option>`;
    });
}

function applyFilters() {
    const dateFrom = document.getElementById('filterDateFrom').value;
    const dateTo = document.getElementById('filterDateTo').value;
    const equipamento = document.getElementById('filterEquipamento').value;
    const cenario = document.getElementById('filterCenario').value;
    const analista = document.getElementById('filterAnalista').value;
    
    filteredTickets = allTickets.filter(ticket => {
        let matches = true;
        
        if (dateFrom && ticket.dataEncaminhamento < dateFrom) matches = false;
        if (dateTo && ticket.dataEncaminhamento > dateTo) matches = false;
        if (equipamento && ticket.equipamento !== equipamento) matches = false;
        if (cenario && ticket.cenario !== cenario) matches = false;
        if (analista && ticket.analista !== analista) matches = false;
        
        return matches;
    });
    
    updateStats();
    updateCharts();
}

// Fechamento de Ciclo
function loadCycleAnalysis() {
    selectCyclePeriod(currentCyclePeriod);
}

function selectCyclePeriod(period) {
    currentCyclePeriod = period;
    
    // Atualizar botões
    document.querySelectorAll('.cycle-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-period="${period}"]`).classList.add('active');
    
    // Atualizar input de data conforme o período
    const dateInput = document.getElementById('cycleDate');
    const today = new Date();
    
    switch(period) {
        case 'day':
            dateInput.type = 'date';
            dateInput.valueAsDate = today;
            break;
        case 'week':
            dateInput.type = 'week';
            dateInput.value = getWeekValue(today);
            break;
        case 'month':
            dateInput.type = 'month';
            dateInput.value = today.toISOString().slice(0, 7);
            break;
        case 'year':
            dateInput.type = 'number';
            dateInput.value = today.getFullYear();
            dateInput.min = '2020';
            dateInput.max = '2030';
            break;
    }
}

function getWeekValue(date) {
    const year = date.getFullYear();
    const week = getWeekNumber(date);
    return `${year}-W${week.toString().padStart(2, '0')}`;
}

function getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

function generateCycleReport() {
    const selectedDate = document.getElementById('cycleDate').value;
    const period = currentCyclePeriod;
    
    let startDate, endDate, periodTitle;
    
    switch(period) {
        case 'day':
            startDate = endDate = selectedDate;
            periodTitle = `Dia ${formatDate(selectedDate)}`;
            break;
        case 'week':
            const weekData = getWeekRange(selectedDate);
            startDate = weekData.start;
            endDate = weekData.end;
            periodTitle = `Semana de ${formatDate(startDate)} a ${formatDate(endDate)}`;
            break;
        case 'month':
            const monthData = getMonthRange(selectedDate);
            startDate = monthData.start;
            endDate = monthData.end;
            periodTitle = `Mês ${monthData.monthName}/${monthData.year}`;
            break;
        case 'year':
            startDate = `${selectedDate}-01-01`;
            endDate = `${selectedDate}-12-31`;
            periodTitle = `Ano ${selectedDate}`;
            break;
    }
    
    // Filtrar chamados do período
    const periodTickets = allTickets.filter(ticket => {
        return ticket.dataEncaminhamento >= startDate && ticket.dataEncaminhamento <= endDate;
    });
    
    // Calcular estatísticas
    const stats = calculatePeriodStats(periodTickets);
    
    // Atualizar interface
    document.getElementById('cyclePeriodTitle').textContent = `Relatório - ${periodTitle}`;
    document.getElementById('cyclePeriodRange').textContent = periodTitle;
    document.getElementById('cycleTotalTickets').textContent = periodTickets.length;
    document.getElementById('cycleTopEquipment').textContent = stats.topEquipment || 'Nenhum';
    document.getElementById('cycleTopScenario').textContent = stats.topScenario || 'Nenhum';
    document.getElementById('cycleTopAnalyst').textContent = stats.topAnalyst || 'Nenhum';
    
    document.getElementById('cycleResults').style.display = 'block';
    
    // Atualizar gráficos de ciclo
    updateCycleCharts(periodTickets, period, selectedDate);
}

function getWeekRange(weekValue) {
    const [year, week] = weekValue.split('-W');
    const firstDayOfYear = new Date(year, 0, 1);
    const daysToAdd = (parseInt(week) - 1) * 7 - firstDayOfYear.getDay() + 1;
    const startDate = new Date(firstDayOfYear.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    const endDate = new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000);
    
    return {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
    };
}

function getMonthRange(monthValue) {
    const [year, month] = monthValue.split('-');
    const startDate = `${year}-${month}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                       'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    
    return {
        start: startDate,
        end: endDate,
        monthName: monthNames[parseInt(month) - 1],
        year: year
    };
}

function calculatePeriodStats(tickets) {
    if (tickets.length === 0) {
        return { topEquipment: null, topScenario: null, topAnalyst: null };
    }
    
    const equipmentCounts = {};
    const scenarioCounts = {};
    const analystCounts = {};
    
    tickets.forEach(ticket => {
        equipmentCounts[ticket.equipamento] = (equipmentCounts[ticket.equipamento] || 0) + 1;
        scenarioCounts[ticket.cenario] = (scenarioCounts[ticket.cenario] || 0) + 1;
        analystCounts[ticket.analista] = (analystCounts[ticket.analista] || 0) + 1;
    });
    
    return {
        topEquipment: Object.keys(equipmentCounts).reduce((a, b) => equipmentCounts[a] > equipmentCounts[b] ? a : b),
        topScenario: Object.keys(scenarioCounts).reduce((a, b) => scenarioCounts[a] > scenarioCounts[b] ? a : b),
        topAnalyst: Object.keys(analystCounts).reduce((a, b) => analystCounts[a] > analystCounts[b] ? a : b)
    };
}

function updateCycleCharts(periodTickets, period, selectedDate) {
    updateTimelineChart(periodTickets, period, selectedDate);
    updateComparativeChart(periodTickets, period, selectedDate);
}

function updateTimelineChart(periodTickets, period, selectedDate) {
    const ctx = document.getElementById('timelineChart').getContext('2d');
    
    // Destruir gráfico anterior se existir
    if (cycleCharts.timeline) {
        cycleCharts.timeline.destroy();
    }
    
    let labels, data;
    
    switch(period) {
        case 'day':
            // Mostrar por horas (simulado - agrupando todos os chamados do dia)
            labels = ['00-06h', '06-12h', '12-18h', '18-24h'];
            data = [0, 0, 0, periodTickets.length]; // Simulado
            break;
        case 'week':
            labels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
            data = new Array(7).fill(0);
            periodTickets.forEach(ticket => {
                const dayOfWeek = new Date(ticket.dataEncaminhamento).getDay();
                data[dayOfWeek]++;
            });
            break;
        case 'month':
            const daysInMonth = new Date(selectedDate.split('-')[0], selectedDate.split('-')[1], 0).getDate();
            labels = Array.from({length: Math.min(daysInMonth, 31)}, (_, i) => (i + 1).toString());
            data = new Array(labels.length).fill(0);
            periodTickets.forEach(ticket => {
                const day = parseInt(ticket.dataEncaminhamento.split('-')[2]) - 1;
                if (day < data.length) data[day]++;
            });
            break;
        case 'year':
            labels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            data = new Array(12).fill(0);
            periodTickets.forEach(ticket => {
                const month = parseInt(ticket.dataEncaminhamento.split('-')[1]) - 1;
                data[month]++;
            });
            break;
    }
    
    cycleCharts.timeline = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Chamados',
                data: data,
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function updateComparativeChart(periodTickets, period, selectedDate) {
    const ctx = document.getElementById('comparativeChart').getContext('2d');
    
    // Destruir gráfico anterior se existir
    if (cycleCharts.comparative) {
        cycleCharts.comparative.destroy();
    }
    
    // Comparar com período anterior
    const currentCount = periodTickets.length;
    const previousCount = getPreviousPeriodCount(period, selectedDate);
    
    cycleCharts.comparative = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Período Anterior', 'Período Atual'],
            datasets: [{
                label: 'Chamados',
                data: [previousCount, currentCount],
                backgroundColor: ['#64748b', '#2563eb']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function getPreviousPeriodCount(period, selectedDate) {
    let previousStart, previousEnd;
    
    switch(period) {
        case 'day':
            const prevDay = new Date(selectedDate);
            prevDay.setDate(prevDay.getDate() - 1);
            previousStart = previousEnd = prevDay.toISOString().split('T')[0];
            break;
        case 'week':
            const weekData = getWeekRange(selectedDate);
            const prevWeekStart = new Date(weekData.start);
            prevWeekStart.setDate(prevWeekStart.getDate() - 7);
            const prevWeekEnd = new Date(weekData.end);
            prevWeekEnd.setDate(prevWeekEnd.getDate() - 7);
            previousStart = prevWeekStart.toISOString().split('T')[0];
            previousEnd = prevWeekEnd.toISOString().split('T')[0];
            break;
        case 'month':
            const [year, month] = selectedDate.split('-');
            const prevMonth = parseInt(month) - 1;
            const prevYear = prevMonth === 0 ? parseInt(year) - 1 : year;
            const prevMonthStr = prevMonth === 0 ? '12' : prevMonth.toString().padStart(2, '0');
            const prevMonthData = getMonthRange(`${prevYear}-${prevMonthStr}`);
            previousStart = prevMonthData.start;
            previousEnd = prevMonthData.end;
            break;
        case 'year':
            const prevYear = parseInt(selectedDate) - 1;
            previousStart = `${prevYear}-01-01`;
            previousEnd = `${prevYear}-12-31`;
            break;
    }
    
    return allTickets.filter(ticket => {
        return ticket.dataEncaminhamento >= previousStart && ticket.dataEncaminhamento <= previousEnd;
    }).length;
}

function exportCycleData() {
    const selectedDate = document.getElementById('cycleDate').value;
    const period = currentCyclePeriod;
    
    // Gerar dados do período atual
    generateCycleReport();
    
    // Criar dados para exportação
    const exportData = {
        periodo: period,
        data: selectedDate,
        totalChamados: document.getElementById('cycleTotalTickets').textContent,
        equipamentoMaisSolicitado: document.getElementById('cycleTopEquipment').textContent,
        cenarioMaisFrequente: document.getElementById('cycleTopScenario').textContent,
        analistaMaisAtivo: document.getElementById('cycleTopAnalyst').textContent,
        geradoEm: new Date().toLocaleString('pt-BR')
    };
    
    // Converter para JSON e fazer download
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-ciclo-${period}-${selectedDate}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

function exportTicketsData() {
    // Criar CSV com todos os chamados
    const headers = ['Analista', 'Chamado', 'Linha', 'Equipamento', 'Cenário', 'Data', 'Status'];
    const csvContent = [
        headers.join(','),
        ...allTickets.map(ticket => [
            ticket.analista,
            ticket.chamado,
            ticket.linha,
            ticket.equipamento,
            ticket.cenario,
            ticket.dataEncaminhamento,
            ticket.status || 'Aberto'
        ].join(','))
    ].join('\n');
    
    const dataBlob = new Blob([csvContent], {type: 'text/csv'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chamados-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}

// Gerenciamento de usuários
function loadUsers() {
    const tbody = document.querySelector('#usersTable tbody');
    tbody.innerHTML = '';
    
    allUsers.forEach(user => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${user.nome}</td>
            <td><span class="badge ${user.admin ? 'primary' : 'secondary'}">${user.admin ? 'Sim' : 'Não'}</span></td>
            <td><span class="badge success">Ativo</span></td>
            <td>
                <button onclick="editUser('${user.username}')" class="btn-secondary">Editar</button>
                <button onclick="deleteUser('${user.username}')" class="btn-danger">Excluir</button>
            </td>
        `;
    });
}

function openUserModal(username = null) {
    const modal = document.getElementById('userModal');
    const title = document.getElementById('userModalTitle');
    
    if (username) {
        const user = allUsers.find(u => u.username === username);
        title.textContent = 'Editar Usuário';
        document.getElementById('modalUsername').value = user.nome;
        document.getElementById('modalPassword').value = user.senhaHash;
        document.getElementById('modalAdmin').checked = user.admin;
        modal.dataset.editingUser = username;
    } else {
        title.textContent = 'Adicionar Usuário';
        document.getElementById('modalUsername').value = '';
        document.getElementById('modalPassword').value = '';
        document.getElementById('modalAdmin').checked = false;
        delete modal.dataset.editingUser;
    }
    
    modal.style.display = 'block';
}

function closeUserModal() {
    document.getElementById('userModal').style.display = 'none';
}

async function handleUserSubmit(e) {
    e.preventDefault();
    
    const modal = document.getElementById('userModal');
    const nome = document.getElementById('modalUsername').value;
    const senhaHash = document.getElementById('modalPassword').value;
    const admin = document.getElementById('modalAdmin').checked;
    const username = nome.toLowerCase();
    
    const userData = { 
        nome, 
        senhaHash, // Em produção, usar hash real
        admin,
        ativo: true
    };
    
    try {
        if (modal.dataset.editingUser) {
            // Editar usuário existente
            await database.ref('app/users/' + modal.dataset.editingUser).update(userData);
        } else {
            // Adicionar novo usuário
            await database.ref('app/users/' + username).set(userData);
        }
        
        await loadAllData();
        loadUsers();
        closeUserModal();
        showSuccessMessage('Usuário salvo com sucesso!');
        
    } catch (error) {
        console.error('Erro ao salvar usuário:', error);
        showError('Erro ao salvar usuário. Tente novamente.');
    }
}

function editUser(username) {
    openUserModal(username);
}

async function deleteUser(username) {
    if (username === 'helio') {
        showError('Não é possível excluir o usuário administrador principal.');
        return;
    }
    
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
        try {
            // Marcar como inativo ao invés de deletar
            await database.ref('app/users/' + username + '/ativo').set(false);
            await loadAllData();
            loadUsers();
            showSuccessMessage('Usuário excluído com sucesso!');
        } catch (error) {
            console.error('Erro ao excluir usuário:', error);
            showError('Erro ao excluir usuário. Tente novamente.');
        }
    }
}

// Gerenciamento de chamados
function loadTickets() {
    const tbody = document.querySelector('#ticketsTable tbody');
    tbody.innerHTML = '';
    
    allTickets.forEach(ticket => {
        const row = tbody.insertRow();
        const status = ticket.status || 'Aberto';
        const statusClass = status === 'Aberto' ? 'warning' : status === 'Fechado' ? 'success' : 'primary';
        
        row.innerHTML = `
            <td>${ticket.analista}</td>
            <td>${ticket.chamado}</td>
            <td>${ticket.linha}</td>
            <td>${ticket.equipamento}</td>
            <td>${ticket.cenario}</td>
            <td>${formatDate(ticket.dataEncaminhamento)}</td>
            <td><span class="badge ${statusClass}">${status}</span></td>
            <td>
                <button onclick="toggleTicketStatus('${ticket.id}')" class="btn-primary">
                    ${status === 'Aberto' ? 'Fechar' : 'Reabrir'}
                </button>
                <button onclick="deleteTicket('${ticket.id}')" class="btn-danger">Excluir</button>
            </td>
        `;
    });
}

async function toggleTicketStatus(ticketId) {
    const ticket = allTickets.find(t => t.id === ticketId);
    const newStatus = ticket.status === 'Fechado' ? 'Aberto' : 'Fechado';
    
    try {
        await database.ref('app/chamados/' + ticketId + '/status').set(newStatus);
        await database.ref('app/chamados/' + ticketId + '/updatedAt').set(Date.now());
        await loadAllData();
        loadTickets();
        showSuccessMessage(`Chamado ${newStatus.toLowerCase()} com sucesso!`);
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        showError('Erro ao atualizar status. Tente novamente.');
    }
}

async function deleteTicket(ticketId) {
    if (confirm('Tem certeza que deseja excluir este chamado?')) {
        try {
            // Soft delete - marcar como deletado
            await database.ref('app/chamados/' + ticketId + '/deleted').set(true);
            await database.ref('app/chamados/' + ticketId + '/updatedAt').set(Date.now());
            await loadAllData();
            loadTickets();
            if (document.getElementById('dashboardContent').classList.contains('active')) {
                loadDashboard();
            }
            showSuccessMessage('Chamado excluído com sucesso!');
        } catch (error) {
            console.error('Erro ao excluir chamado:', error);
            showError('Erro ao excluir chamado. Tente novamente.');
        }
    }
}

// Funções utilitárias
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

function showError(message) {
    loginError.textContent = message;
    loginError.classList.add('show');
    setTimeout(() => {
        loginError.classList.remove('show');
    }, 5000);
}

function hideError() {
    loginError.classList.remove('show');
}

function showSuccessMessage(message) {
    // Criar elemento de sucesso se não existir
    let successElement = document.querySelector('.success-message');
    if (!successElement) {
        successElement = document.createElement('div');
        successElement.className = 'success-message';
        document.body.appendChild(successElement);
    }
    
    successElement.textContent = message;
    successElement.classList.add('show');
    setTimeout(() => {
        successElement.classList.remove('show');
    }, 3000);
}

// Listeners em tempo real do Firebase
database.ref('app/chamados').on('value', (snapshot) => {
    if (currentUser && currentUser.admin) {
        loadAllData().then(() => {
            if (document.getElementById('dashboardContent').classList.contains('active')) {
                loadDashboard();
            } else if (document.getElementById('ticketsContent').classList.contains('active')) {
                loadTickets();
            }
        });
    }
});

database.ref('app/users').on('value', (snapshot) => {
    if (currentUser && currentUser.admin) {
        loadAllData().then(() => {
            if (document.getElementById('usersContent').classList.contains('active')) {
                loadUsers();
            }
        });
    }
});

