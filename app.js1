// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    authDomain: "sistema-chamados-xxxxx.firebaseapp.com",
    databaseURL: "https://sistema-chamados-xxxxx-default-rtdb.firebaseio.com/",
    projectId: "sistema-chamados-xxxxx",
    storageBucket: "sistema-chamados-xxxxx.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:xxxxxxxxxxxxxxxx"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Variáveis globais
let currentUser = null;
let allTickets = [];
let allUsers = [];
let filteredTickets = [];

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
    document.getElementById('usersTab').addEventListener('click', () => showTab('users'));
    document.getElementById('ticketsTab').addEventListener('click', () => showTab('tickets'));
    
    // Filtros
    document.getElementById('applyFilters').addEventListener('click', applyFilters);
    
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
        deleted: false
    };
    
    try {
        await database.ref('app/chamados').push(ticketData);
        alert('Chamado salvo com sucesso!');
        clearTicketForm();
    } catch (error) {
        console.error('Erro ao salvar chamado:', error);
        alert('Erro ao salvar chamado. Tente novamente.');
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
    equipamentoSelect.innerHTML = '<option value="">Selecione...</option>';
    listas.equipamentos.forEach(eq => {
        equipamentoSelect.innerHTML += `<option value="${eq}">${eq}</option>`;
    });
    
    // Popular select de cenários no formulário de usuário
    const cenarioSelect = document.getElementById('cenario');
    cenarioSelect.innerHTML = '<option value="">Selecione...</option>';
    listas.cenarios.forEach(cenario => {
        cenarioSelect.innerHTML += `<option value="${cenario}">${cenario}</option>`;
    });
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
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(equipmentCounts),
            datasets: [{
                data: Object.values(equipmentCounts),
                backgroundColor: [
                    '#0078d4', '#106ebe', '#005a9e', '#004578',
                    '#003d65', '#00344f', '#002b3a', '#002329'
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
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(scenarioCounts),
            datasets: [{
                label: 'Quantidade',
                data: Object.values(scenarioCounts),
                backgroundColor: '#0078d4'
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
    
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(analystCounts),
            datasets: [{
                data: Object.values(analystCounts),
                backgroundColor: [
                    '#0078d4', '#106ebe', '#005a9e', '#004578',
                    '#003d65', '#00344f', '#002b3a', '#002329'
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

// Gerenciamento de usuários
function loadUsers() {
    const tbody = document.querySelector('#usersTable tbody');
    tbody.innerHTML = '';
    
    allUsers.forEach(user => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${user.nome}</td>
            <td>${user.admin ? 'Sim' : 'Não'}</td>
            <td>
                <button onclick="editUser('${user.username}')" class="btn-secondary">Editar</button>
                <button onclick="deleteUser('${user.username}')" class="btn-secondary">Excluir</button>
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
        
    } catch (error) {
        console.error('Erro ao salvar usuário:', error);
        alert('Erro ao salvar usuário. Tente novamente.');
    }
}

function editUser(username) {
    openUserModal(username);
}

async function deleteUser(username) {
    if (username === 'helio') {
        alert('Não é possível excluir o usuário administrador principal.');
        return;
    }
    
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
        try {
            // Marcar como inativo ao invés de deletar
            await database.ref('app/users/' + username + '/ativo').set(false);
            await loadAllData();
            loadUsers();
        } catch (error) {
            console.error('Erro ao excluir usuário:', error);
            alert('Erro ao excluir usuário. Tente novamente.');
        }
    }
}

// Gerenciamento de chamados
function loadTickets() {
    const tbody = document.querySelector('#ticketsTable tbody');
    tbody.innerHTML = '';
    
    allTickets.forEach(ticket => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${ticket.analista}</td>
            <td>${ticket.chamado}</td>
            <td>${ticket.linha}</td>
            <td>${ticket.equipamento}</td>
            <td>${ticket.cenario}</td>
            <td>${formatDate(ticket.dataEncaminhamento)}</td>
            <td>
                <button onclick="deleteTicket('${ticket.id}')" class="btn-secondary">Excluir</button>
            </td>
        `;
    });
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
        } catch (error) {
            console.error('Erro ao excluir chamado:', error);
            alert('Erro ao excluir chamado. Tente novamente.');
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
}

function hideError() {
    loginError.classList.remove('show');
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

