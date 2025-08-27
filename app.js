// app.js — SPS_Ch 1.1 (versão melhorada)
/* global firebase, Chart */

// ======================= CONFIG FIREBASE =======================
const firebaseConfig = {
  // Cole suas chaves reais do Firebase aqui:
  apiKey: "AIzaSyAeCrURSs0TBXlYF3TKLi4q98VwrGaKe_Q",
    authDomain: "spsch-849e5.firebaseapp.com",
    databaseURL: "https://spsch-849e5-default-rtdb.firebaseio.com",
    projectId: "spsch-849e5",
    storageBucket: "spsch-849e5.firebasestorage.app",
    messagingSenderId: "698967090558",
    appId: "1:698967090558:web:978781fd27b86c36203f2f",
    measurementId: "G-C5D3774P2G"
  
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ======================= TOAST =======================
const toastEl = document.getElementById('toast');
function toast(msg, ms = 2200){
  if(!toastEl) return alert(msg);
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  setTimeout(()=>toastEl.classList.remove('show'), ms);
}

// ======================= HASH (opcional - simples) =======================
// Para manter compatibilidade com senha em texto no seed, não aplicamos hash agora.
// Se desejar hash, implemente WebCrypto e grave senhaHash.

// ======================= SESSÃO =======================
const SESSION_KEY = 'sps_session_v11';
function setSession(u){
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    id: u.id, nome: u.nome, admin: !!u.admin, ts: Date.now() + 1000*60*60*24
  }));
}
function getSession(){
  const raw = localStorage.getItem(SESSION_KEY);
  if(!raw) return null;
  try{ const s = JSON.parse(raw); if(Date.now() > s.ts) return null; return s; }catch{ return null; }
}
function clearSession(){ localStorage.removeItem(SESSION_KEY); }

// ======================= STATE =======================
const state = {
  charts: {equip:null, cenario:null, analista:null, equipPublic:null, cenarioPublic:null, analistaPublic:null},
  lists: {equipamentos:[], cenarios:[]},
  duplicates: []
};

// ======================= ELEMENTOS =======================
const views = {
  loginView: document.getElementById('loginView'),
  userView: document.getElementById('userView'),
  adminView: document.getElementById('adminView'),
  dashView: document.getElementById('dashView')
};
const navLogin = document.getElementById('navLogin');
const navUser  = document.getElementById('navUser');
const navAdmin = document.getElementById('navAdmin');
const navDash = document.getElementById('navDash');
const userBadge = document.getElementById('userBadge');
const btnLogout = document.getElementById('btnLogout');

// Login form ids
const loginForm = document.getElementById('loginForm');
const usernameEl = document.getElementById('username');
const passwordEl = document.getElementById('password');
const loginError = document.getElementById('loginError');

// User form
const uAnalista = document.getElementById('uAnalista');
const uChamado = document.getElementById('uChamado');
const uLinha = document.getElementById('uLinha');
const uEquipamento = document.getElementById('uEquipamento');
const uCenario = document.getElementById('uCenario');
const uData = document.getElementById('uData');
const btnUserSalvar = document.getElementById('btnUserSalvar');
const btnUserNovo = document.getElementById('btnUserNovo');
const btnUserLimpar = document.getElementById('btnUserLimpar');

// User table
const userTableBody = document.querySelector('#userTable tbody');
const userSearch = document.getElementById('userSearch');
const userPageSize = document.getElementById('userPageSize');
const userPrev = document.getElementById('userPrev');
const userNext = document.getElementById('userNext');
const userPageInfo = document.getElementById('userPageInfo');

// Admin Users
const aUNome = document.getElementById('aUNome');
const aUSenha = document.getElementById('aUSenha');
const aUAdmin = document.getElementById('aUAdmin');
const aUAtivo = document.getElementById('aUAtivo');
const btnUserCreate = document.getElementById('btnUserCreate');
const btnUserUpdate = document.getElementById('btnUserUpdate');
const btnUserClear  = document.getElementById('btnUserClear');
const admUsersTableBody = document.querySelector('#admUsersTable tbody');
const admUserSearch = document.getElementById('admUserSearch');

// Admin Cenários
const aCenarioNome = document.getElementById('aCenarioNome');
const btnCenarioCreate = document.getElementById('btnCenarioCreate');
const btnCenarioUpdate = document.getElementById('btnCenarioUpdate');
const btnCenarioClear = document.getElementById('btnCenarioClear');
const admCenariosTableBody = document.querySelector('#admCenariosTable tbody');
const admCenarioSearch = document.getElementById('admCenarioSearch');

// Admin Calls
const fInicio = document.getElementById('fInicio');
const fFim = document.getElementById('fFim');
const fEquip = document.getElementById('fEquip');
const fCenario = document.getElementById('fCenario');
const fAnalista = document.getElementById('fAnalista');
const fIncluirExcluidos = document.getElementById('fIncluirExcluidos');
const btnAplicarFiltros = document.getElementById('btnAplicarFiltros');
const btnCSV = document.getElementById('btnCSV');
const admCallsTableBody = document.querySelector('#admCallsTable tbody');

// Tabs
const tabBtns = Array.from(document.querySelectorAll('.tab'));
const tabPanels = {
  tabUsers: document.getElementById('tabUsers'),
  tabCenarios: document.getElementById('tabCenarios'),
  tabChamados: document.getElementById('tabChamados'),
  tabDash: document.getElementById('tabDash')
};

// Dashboard público
const duplicateTableBody = document.querySelector('#duplicateTable tbody');

// ======================= NAV =======================
function showView(id){
  Object.values(views).forEach(v=>v.hidden = true);
  views[id].hidden = false;
  document.querySelectorAll('.nav-btn').forEach(b=>{
    if(b.dataset.view){ b.classList.toggle('active', b.dataset.view === id); }
  });
}

function applyAuthUI(){
  const s = getSession();
  if(!s){
    userBadge.textContent = 'Não logado';
    btnLogout.hidden = true;
    navUser.hidden = true; 
    navAdmin.hidden = true; 
    navDash.hidden = true;
    navLogin.hidden = false;
    showView('loginView');
  } else {
    userBadge.textContent = `${s.nome}${s.admin?' (admin)':''}`;
    btnLogout.hidden = false;
    navLogin.hidden = true; 
    navUser.hidden = false; 
    navDash.hidden = false; // Dashboard sempre visível para usuários logados
    navAdmin.hidden = !s.admin; // Admin só visível para admins
    showView(s.admin ? 'adminView' : 'userView');
    uAnalista.value = s.nome;
  }
}

// Verificação de permissão admin
function requireAdmin(){
  const s = getSession();
  if(!s || !s.admin){
    toast('Acesso negado: apenas administradores podem realizar esta ação');
    return false;
  }
  return true;
}

Array.from(document.querySelectorAll('.nav-btn')).forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const v = btn.dataset.view; 
    if(v === 'adminView' && !requireAdmin()) return;
    if(v) showView(v);
  });
});
btnLogout.addEventListener('click', ()=>{ clearSession(); applyAuthUI(); toast('Sessão encerrada'); });

// Tabs
tabBtns.forEach(b=> b.addEventListener('click', ()=>{
  tabBtns.forEach(x=>x.classList.remove('active'));
  b.classList.add('active');
  Object.values(tabPanels).forEach(p=>p.hidden=true);
  tabPanels[b.dataset.tab].hidden=false;
}));

// ======================= LISTAS / SEED =======================
async function seedIfEmpty(){
  // Usuário Helio
  const usersSnap = await db.ref('app/users').once('value');
  if(!usersSnap.exists()){
    await db.ref('app/users').set({
      helio: { nome:'Helio', password:'12345678', admin:true, ativo:true }
    });
  }
  // Listas
  const listasSnap = await db.ref('app/listas').once('value');
  if(!listasSnap.exists()){
    await db.ref('app/listas').set({
      equipamentos:["HLR","HHUA","HLREDA","HSS","RTC","VPNSIX","SGV","outro"],
    cenarios:["Voz","Dados","Voz e dados","Não localizado no SPSWeb",
              "Falha no equipamento","Franquia de dados",
              "Assinante não possui HSS","4G/5G inativo","RESTRICTED",
              "IMEI", "SEM VOLTE"               
               ]
    });
  }
  // Chamados demo (se quiser gráficos na 1ª execução)
  const callsSnap = await db.ref('app/chamados').once('value');
 // if(!callsSnap.exists()){
     if(1 == 1){
    const now = Date.now();
    const base = [ 
     
    {analista:'Lucas', chamado:'PDST-1910514', linha:'123456788923.0', equipamento:'HLR', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-01', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1907414', linha:'123456788924.0', equipamento:'HHUA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-01', obs:'nd'}
,{analista:'Rodrigo', chamado:'PDST-1909188', linha:'123456788925.0', equipamento:'nd', cenario:'DAdos e VOZ', dataEncaminhamento:'2025-07-01', obs:'nd'}
,{analista:'Rodrigo', chamado:'PDST-1909976', linha:'123456788926.0', equipamento:'HLREDA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-07-01', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1911318', linha:'123456788927.0', equipamento:'HLREDA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-01', obs:'nd'}
,{analista:'Rodrigo', chamado:'PDST-1910735', linha:'123456788928.0', equipamento:'nd', cenario:'Dados', dataEncaminhamento:'2025-07-01', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1911178', linha:'123456788929.0', equipamento:'HHUA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-01', obs:'nd'}
,{analista:'Fernando', chamado:'PDST-1910185', linha:'123456788930.0', equipamento:'VPNSIX', cenario:'Delete de IMSI', dataEncaminhamento:'2025-07-01', obs:'nd'}
,{analista:'Rodrigo', chamado:'PDST-1911888', linha:'123456788931.0', equipamento:'HLREDA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-07-01', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1912159', linha:'123456788932.0', equipamento:'HSS', cenario:'Assinante não possui HSS', dataEncaminhamento:'2025-08-01', obs:'nd'}
,{analista:'Rodrigo', chamado:'PDST-1911887', linha:'123456788933.0', equipamento:'HLREDA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-07-01', obs:'nd'}
,{analista:'Rodrigo', chamado:'PDST-1912172', linha:'123456788934.0', equipamento:'HLREDA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-07-01', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1912475', linha:'123456788935.0', equipamento:'HLREDA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-01', obs:'nd'}
,{analista:'Fernando', chamado:'PDST-1911540', linha:'123456788936.0', equipamento:'RTC', cenario:'Sem dados de consumo', dataEncaminhamento:'2025-07-01', obs:'nd'}
,{analista:'Fernando', chamado:'PDST-1908397', linha:'123456788937.0', equipamento:'nd', cenario:'Consumo da oferta errada', dataEncaminhamento:'2025-07-01', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1912940', linha:'123456788938.0', equipamento:'HLREDA', cenario:'Falha no equipamento', dataEncaminhamento:'2025-08-02', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1913422', linha:'123456788939.0', equipamento:'HLREDA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-02', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1913718', linha:'123456788940.0', equipamento:'HLREDA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-02', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1911856', linha:'123456788941.0', equipamento:'HLREDA', cenario:'Ofertas não espelhada no spsweb', dataEncaminhamento:'2025-08-02', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1913721', linha:'123456788942.0', equipamento:'HLREDA', cenario:'Não recebe ligações', dataEncaminhamento:'2025-08-02', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1914038', linha:'123456788943.0', equipamento:'HLREDA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-02', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1912159', linha:'123456788944.0', equipamento:'HHUA', cenario:'não possui provisionamento no HSS', dataEncaminhamento:'2025-08-02', obs:'nd'}
,{analista:'Rodrigo', chamado:'PDST-1908481', linha:'123456788945.0', equipamento:'nd', cenario:'DAdos e VOZ', dataEncaminhamento:'2025-08-04', obs:'nd'}
,{analista:'Rodrigo', chamado:'PDST-1915241', linha:'123456788946.0', equipamento:'nd', cenario:'não possui provisionamento no HSS', dataEncaminhamento:'2025-08-04', obs:'nd'}
,{analista:'Rodrigo', chamado:'PDST-1915575', linha:'123456788947.0', equipamento:'HHUA', cenario:'não possui provisionamento no HSS', dataEncaminhamento:'2025-08-04', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1905331', linha:'123456788948.0', equipamento:'HSS', cenario:'falha de dados', dataEncaminhamento:'2025-08-04', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1916019', linha:'123456788949.0', equipamento:'HLREDA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-04', obs:'nd'}
,{analista:'Rodrigo', chamado:'PDST-1915553', linha:'123456788950.0', equipamento:'HHUA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-04', obs:'nd'}
,{analista:'Rodrigo', chamado:'PDST-1916307', linha:'123456788951.0', equipamento:'HHUA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-04', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1915963', linha:'123456788952.0', equipamento:'HLR', cenario:'Não originar chamadas', dataEncaminhamento:'2025-08-04', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1915839', linha:'123456788953.0', equipamento:'nd', cenario:'franquia não espelhada no sistemas', dataEncaminhamento:'2025-08-04', obs:'nd'}
,{analista:'Rodrigo', chamado:'PDST-1915927', linha:'123456788954.0', equipamento:'HSS', cenario:'Franquia de dados', dataEncaminhamento:'2025-08-04', obs:'nd'}
,{analista:'Rodrigo', chamado:'PDST-1916219', linha:'123456788955.0', equipamento:'HLR', cenario:'Voz', dataEncaminhamento:'2025-07-04', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1916775', linha:'123456788956.0', equipamento:'HLREDA', cenario:'Falha no equipamento', dataEncaminhamento:'2025-07-04', obs:'nd'}
,{analista:'Rodrigo', chamado:'PDST-1917486', linha:'123456788957.0', equipamento:'HLREDA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-05', obs:'nd'}
,{analista:'Rodrigo', chamado:'PDST-1917724', linha:'123456788958.0', equipamento:'HLR', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-05', obs:'nd'}
,{analista:'Rodrigo', chamado:'PDST-1918489', linha:'123456788959.0', equipamento:'SGV', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-05', obs:'nd'}
,{analista:'Rodrigo', chamado:'PDST-1918436', linha:'123456788960.0', equipamento:'nd', cenario:'Voz e dados', dataEncaminhamento:'2025-08-05', obs:'nd'}
,{analista:'Rodrigo', chamado:'PDST-1917074', linha:'123456788961.0', equipamento:'nd', cenario:'Voz e dados', dataEncaminhamento:'2025-08-05', obs:'nd'}
,{analista:'Rodrigo', chamado:'PDST-1917973', linha:'123456788962.0', equipamento:'HHUA', cenario:'Voz e dados', dataEncaminhamento:'2025-08-05', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1916019', linha:'123456788963.0', equipamento:'HLREDA', cenario:'Falha no equipamento', dataEncaminhamento:'2025-08-06', obs:'nd'}
,{analista:'Rodrigo', chamado:'PDST-1919535', linha:'123456788964.0', equipamento:'IMSI incorreto', cenario:'Voz e dados', dataEncaminhamento:'2025-08-06', obs:'nd'}
,{analista:'Rodrigo', chamado:'PDST-1921429', linha:'123456788965.0', equipamento:'HLREDA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-05-06', obs:'nd'}
,{analista:'Rodrigo', chamado:'PDST-1920707', linha:'123456788966.0', equipamento:'HLR', cenario:'Voz e dados', dataEncaminhamento:'2025-05-06', obs:'nd'}
,{analista:'Isabelle', chamado:'PDST-1916128', linha:'123456788967.0', equipamento:'HLREDA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-06', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1922199', linha:'123456788968.0', equipamento:'HLREDA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-06', obs:'nd'}
,{analista:'Rodrigo', chamado:'PDST-1922224', linha:'123456788969.0', equipamento:'RTC', cenario:'DAdos e VOZ', dataEncaminhamento:'2025-08-06', obs:'nd'}
,{analista:'Fernando', chamado:'PDST-1922781', linha:'123456788970.0', equipamento:'HLREDA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-06', obs:'nd'}
,{analista:'Rodrigo', chamado:'PDST-1919522', linha:'123456788971.0', equipamento:'RTC', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-07', obs:'nd'}
,{analista:'Rodrigo', chamado:'PDST-1922933', linha:'123456788972.0', equipamento:'HLREDA', cenario:'DAdos e VOZ', dataEncaminhamento:'nd', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1923650', linha:'123456788973.0', equipamento:'HSS', cenario:'4G inativo', dataEncaminhamento:'2025-08-07', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1922880', linha:'123456788974.0', equipamento:'nd', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-07', obs:'nd'}
,{analista:'Rodrigo', chamado:'PDST-1920952', linha:'123456788975.0', equipamento:'HSS', cenario:'DAdos e VOZ', dataEncaminhamento:'nd', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1923976', linha:'123456788976.0', equipamento:'nd', cenario:'Não informado pelo HLR', dataEncaminhamento:'2025-08-07', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1924182', linha:'123456788977.0', equipamento:'HLREDA', cenario:'Ofertas não espelhada no spsweb', dataEncaminhamento:'2025-08-07', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1924137', linha:'123456788978.0', equipamento:'RTC', cenario:'franquia não espelhada no sistemas', dataEncaminhamento:'2025-08-07', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1924094', linha:'123456788979.0', equipamento:'HLR', cenario:'Falha no equipamento', dataEncaminhamento:'2025-08-07', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1924657', linha:'123456788980.0', equipamento:'Claro flex', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-07', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1924071', linha:'123456788981.0', equipamento:'HHUA', cenario:'Falha no equipamento', dataEncaminhamento:'2025-08-07', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1924890', linha:'123456788982.0', equipamento:'HLREDA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-07', obs:'nd'}
,{analista:'Rodrigo', chamado:'PDST-1909874', linha:'123456788983.0', equipamento:'nd', cenario:'nd', dataEncaminhamento:'nd', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1925368', linha:'123456788984.0', equipamento:'HLREDA', cenario:'Linha sem sinal', dataEncaminhamento:'2025-08-07', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1926306', linha:'123456788985.0', equipamento:'HHUA', cenario:'Não informado pelo HLR', dataEncaminhamento:'2025-08-08', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1926802', linha:'123456788986.0', equipamento:'HLREDA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-08', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1926889', linha:'123456788987.0', equipamento:'HLREDA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-08', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1926871', linha:'123456788988.0', equipamento:'nd', cenario:'IMEI não informado pelo HLR', dataEncaminhamento:'2025-08-08', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1926761', linha:'123456788989.0', equipamento:'HHUA', cenario:'Não informado pelo HLR', dataEncaminhamento:'2025-08-08', obs:'nd'}
,{analista:'Rodrigo', chamado:'PDST-1926224', linha:'123456788990.0', equipamento:'HHUA', cenario:'Linha sem sinal', dataEncaminhamento:'2025-08-08', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1927398', linha:'123456788991.0', equipamento:'HLREDA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-08', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1927267', linha:'123456788992.0', equipamento:'HLREDA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-08', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1924928', linha:'123456788993.0', equipamento:'HHUA', cenario:'Não informado pelo HLR', dataEncaminhamento:'2025-08-08', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1927091', linha:'123456788994.0', equipamento:'HLREDA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-08', obs:'nd'}
,{analista:'Isabelle', chamado:'PDST-1925877', linha:'123456788995.0', equipamento:'RTC', cenario:'não aparece pacote controle', dataEncaminhamento:'2025-08-08', obs:'nd'}
,{analista:'Fernando', chamado:'PDST-1926529', linha:'123456788996.0', equipamento:'RTC', cenario:'Não aprovisiona pacote de dados', dataEncaminhamento:'2025-08-08', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1926753', linha:'123456788997.0', equipamento:'HLR', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-08', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1920952', linha:'123456788998.0', equipamento:'HHUA', cenario:'Franquia de dados', dataEncaminhamento:'2025-08-08', obs:'nd'}
,{analista:'Fernando', chamado:'PDST-1928048', linha:'123456788999.0', equipamento:'HLREDA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-08', obs:'nd'}
,{analista:'Isabelle', chamado:'PDST-1927456', linha:'123456789000.0', equipamento:'HLREDA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-09', obs:'nd'}
,{analista:'Isabelle', chamado:'PDST-1927626', linha:'123456789001.0', equipamento:'0', cenario:'Não apresenta pacote de dados', dataEncaminhamento:'2025-08-09', obs:'nd'}
,{analista:'Isabelle', chamado:'PDST-1928545', linha:'123456789002.0', equipamento:'HLREDA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-09', obs:'nd'}
,{analista:'Isabelle', chamado:'PDST-1927398', linha:'123456789003.0', equipamento:'HLREDA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-09', obs:'nd'}
,{analista:'Isabelle', chamado:'PDST-1928878', linha:'123456789004.0', equipamento:'HLREDA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-09', obs:'nd'}
,{analista:'Isabelle', chamado:'PDST-1929087', linha:'123456789005.0', equipamento:'HLREDA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-09', obs:'nd'}
,{analista:'Isabelle', chamado:'PDST-1928335', linha:'123456789006.0', equipamento:'HLREDA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-09', obs:'nd'}
,{analista:'Isabelle', chamado:'PDST-1929152', linha:'123456789007.0', equipamento:'HLREDA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-09', obs:'nd'}
,{analista:'Isabelle', chamado:'PDST-1929096', linha:'123456789008.0', equipamento:'HLREDA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-09', obs:'nd'}
,{analista:'Isabelle', chamado:'PDST-1931537', linha:'123456789009.0', equipamento:'HHUA', cenario:'Não informado pelo HLR', dataEncaminhamento:'2025-08-11', obs:'nd'}
,{analista:'Isabelle', chamado:'PDST-1931592', linha:'123456789010.0', equipamento:'HLREDA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-11', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1931491', linha:'123456789011.0', equipamento:'HLREDA', cenario:'Falha no equipamento', dataEncaminhamento:'2025-08-11', obs:'nd'}
,{analista:'Fernando', chamado:'PDST-1932566', linha:'123456789012.0', equipamento:'HLREDA', cenario:'Não localizado no SPSWeb', dataEncaminhamento:'2025-08-11', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1932504', linha:'123456789013.0', equipamento:'HHUA', cenario:'4G/5G inativo', dataEncaminhamento:'2025-08-11', obs:'nd'}
,{analista:'Fernando', chamado:'PDST-1933045', linha:'123456789014.0', equipamento:'HLREDA', cenario:'Não localizado no SPSWeb', dataEncaminhamento:'2025-08-11', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1930844', linha:'123456789015.0', equipamento:'HLREDA', cenario:'Falha no equipamento', dataEncaminhamento:'2025-08-12', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1933095', linha:'123456789016.0', equipamento:'nd', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-12', obs:'nd'}
,{analista:'Isabelle', chamado:'PDST-1933117', linha:'123456789017.0', equipamento:'HLREDA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-12', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1930713', linha:'123456789018.0', equipamento:'RTC', cenario:'franquia não espelhada no sistemas', dataEncaminhamento:'2025-08-12', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1934437', linha:'123456789019.0', equipamento:'HLREDA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-12', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1934248', linha:'123456789020.0', equipamento:'HHUA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-12', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1933642', linha:'123456789021.0', equipamento:'HHUA', cenario:'Não informado pelo HLR', dataEncaminhamento:'2025-08-12', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1934894', linha:'123456789022.0', equipamento:'HLREDA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-12', obs:'nd'}
,{analista:'Isabelle', chamado:'PDST-1934986', linha:'123456789023.0', equipamento:'nd', cenario:'Pacotes não aparecem', dataEncaminhamento:'2025-08-12', obs:'nd'}
,{analista:'Lucas', chamado:'nd', linha:'123456789024.0', equipamento:'nd', cenario:'nd', dataEncaminhamento:'nd', obs:'nd'}
,{analista:'Fernando', chamado:'PDST-1935627', linha:'123456789025.0', equipamento:'RTC', cenario:'Assinante não localizado SPSWeb', dataEncaminhamento:'2025-08-12', obs:'nd'}
,{analista:'Fernando', chamado:'PDST-1935433', linha:'123456789026.0', equipamento:'HLREDA', cenario:'Assinante não localizado SPSWeb', dataEncaminhamento:'2025-08-12', obs:'nd'}
,{analista:'Fernando', chamado:'PDST-1934104', linha:'123456789027.0', equipamento:'HLR', cenario:'Assinante não localizado SPSWeb', dataEncaminhamento:'2025-08-12', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1935403', linha:'123456789028.0', equipamento:'HLREDA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-13', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1933045', linha:'123456789029.0', equipamento:'HLREDA', cenario:'Falha no equipamento', dataEncaminhamento:'2025-08-13', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1937005', linha:'123456789030.0', equipamento:'Claro flex/enviado para flex', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-13', obs:'nd'}
,{analista:'Fernando', chamado:'PDST-1937301', linha:'123456789031.0', equipamento:'HLREDA', cenario:'Assinante não localizado SPSWeb', dataEncaminhamento:'2025-08-13', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1937851', linha:'123456789032.0', equipamento:'RTC', cenario:'Assinante não localizado SPSWeb', dataEncaminhamento:'2025-08-13', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1937795', linha:'123456789033.0', equipamento:'Claro flex/enviado para flex', cenario:'RESTRICTED', dataEncaminhamento:'2025-08-13', obs:'nd'}
,{analista:'Fernando', chamado:'PDST-1938479', linha:'123456789034.0', equipamento:'HLREDA', cenario:'Assinante não localizado SPSWeb', dataEncaminhamento:'2025-08-13', obs:'nd'}
,{analista:'Isabelle', chamado:'PDST-1933278', linha:'123456789035.0', equipamento:'APN duplicada', cenario:'APN duplicada ', dataEncaminhamento:'2025-08-14', obs:'nd'}
,{analista:'Isabelle', chamado:'PDST-1931384', linha:'123456789036.0', equipamento:'HHUA', cenario:'Não informado pelo HLR', dataEncaminhamento:'2025-08-14', obs:'nd'}
,{analista:'Isabelle', chamado:'PDST-1939293', linha:'123456789037.0', equipamento:'HLREDA', cenario:'Assinante não localizado SPSWeb', dataEncaminhamento:'2025-08-14', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1940092', linha:'123456789038.0', equipamento:'HLREDA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-14', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1939629', linha:'123456789039.0', equipamento:'HHUA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-14', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1934612', linha:'123456789040.0', equipamento:'Claro flex/enviado para flex', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-14', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1940824', linha:'123456789041.0', equipamento:'HHUA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-14', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1935627', linha:'123456789042.0', equipamento:'RTC', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-14', obs:'nd'}
,{analista:'Fernando', chamado:'PDST-1940900', linha:'123456789043.0', equipamento:'HLREDA', cenario:'Assinante não localizado SPSWeb', dataEncaminhamento:'2025-08-14', obs:'nd'}
,{analista:'Fabricio', chamado:'PDST-1940702', linha:'123456789044.0', equipamento:'HHUA', cenario:'Assinante não localizado SPSWeb', dataEncaminhamento:'2025-08-14', obs:'nd'}
,{analista:'Isabelle', chamado:'PDST-1938811', linha:'123456789045.0', equipamento:'RTC', cenario:'Ofertas não espelhada no spsweb', dataEncaminhamento:'2025-08-15', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1941628', linha:'123456789046.0', equipamento:'HHUA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-15', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1938315', linha:'123456789047.0', equipamento:'HHUA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-15', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1942132', linha:'123456789048.0', equipamento:'RTC', cenario:'IMEI não informado pelo HLR', dataEncaminhamento:'2025-08-15', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1939900', linha:'123456789049.0', equipamento:'HHUA', cenario:'não recebe ligações', dataEncaminhamento:'2025-08-15', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1942115', linha:'123456789050.0', equipamento:'HLREDA', cenario:'Falha no equipamento', dataEncaminhamento:'2025-08-15', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1941462', linha:'123456789051.0', equipamento:'HLR', cenario:'Falha no equipamento', dataEncaminhamento:'2025-08-15', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1942688', linha:'123456789052.0', equipamento:'HHUA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-15', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1942915', linha:'123456789053.0', equipamento:'HLREDA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-15', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1942984', linha:'123456789054.0', equipamento:'HLREDA', cenario:'Falha no equipamento', dataEncaminhamento:'2025-08-15', obs:'nd'}
,{analista:'Isabelle', chamado:'PDST-1939531', linha:'123456789055.0', equipamento:'HLREDA', cenario:'Não realiza chamadas', dataEncaminhamento:'2025-08-15', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1943532', linha:'123456789056.0', equipamento:'HHUA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-15', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1938126', linha:'123456789057.0', equipamento:'HLREDA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-15', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1942339', linha:'123456789058.0', equipamento:'RTC', cenario:'Não informado pelo HLR', dataEncaminhamento:'2025-08-15', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1941516', linha:'123456789059.0', equipamento:'HHUA', cenario:'Não informado pelo HLR', dataEncaminhamento:'2025-08-15', obs:'nd'}
,{analista:'Isabelle', chamado:'PDST-1920874', linha:'123456789060.0', equipamento:'HLR', cenario:'Não apresenta o imei', dataEncaminhamento:'2025-08-15', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1943950', linha:'123456789061.0', equipamento:'RTC', cenario:'Não informado pelo HLR', dataEncaminhamento:'2025-08-15', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1943923', linha:'123456789062.0', equipamento:'RTC', cenario:'Não informado pelo HLR', dataEncaminhamento:'2025-08-15', obs:'nd'}
,{analista:'Isabelle', chamado:'PDST-1944200', linha:'123456789063.0', equipamento:'HLREDA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-18', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1942915', linha:'123456789064.0', equipamento:'HLREDA', cenario:'Falha no equipamento', dataEncaminhamento:'2025-08-18', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1946865', linha:'123456789065.0', equipamento:'HLREDA', cenario:'Falha no equipamento', dataEncaminhamento:'2025-08-18', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1945105', linha:'123456789066.0', equipamento:'HHUA', cenario:'Ofertas não espelhada no spsweb', dataEncaminhamento:'2025-08-18', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1947573', linha:'123456789067.0', equipamento:'HLREDA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-18', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1947579', linha:'123456789068.0', equipamento:'HLREDA', cenario:'Falha no equipamento', dataEncaminhamento:'2025-08-18', obs:'nd'}
,{analista:'Isabelle', chamado:'PDST-1942132', linha:'123456789069.0', equipamento:'HHUA', cenario:'Não informado pelo HLR', dataEncaminhamento:'2025-08-18', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1945825', linha:'123456789070.0', equipamento:'HHUA', cenario:'Não informado pelo HLR', dataEncaminhamento:'2025-08-18', obs:'nd'}
,{analista:'Isabelle', chamado:'PDST-1945792', linha:'123456789071.0', equipamento:'HLREDA', cenario:'Não informado pelo HLR', dataEncaminhamento:'2025-08-18', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1948184', linha:'123456789072.0', equipamento:'HHUA', cenario:'Não informado pelo HLR', dataEncaminhamento:'2025-08-18', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1943950', linha:'123456789073.0', equipamento:'RTC', cenario:'Não informado pelo HLR', dataEncaminhamento:'2025-08-18', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1942782', linha:'123456789074.0', equipamento:'HLREDA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-18', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1945629', linha:'123456789075.0', equipamento:'HLREDA', cenario:'dados', dataEncaminhamento:'2025-08-18', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1948571', linha:'123456789076.0', equipamento:'HLREDA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-18', obs:'nd'}
,{analista:'Fabricio', chamado:'PDST-1948547', linha:'81997315479.0', equipamento:'HHUA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-18', obs:'nd'}
,{analista:'Fabricio', chamado:'PDST-1944221', linha:'61985073796.0', equipamento:'HSS', cenario:'4G inativo', dataEncaminhamento:'2025-08-18', obs:'nd'}
,{analista:'Isabelle', chamado:'PDST-1948224', linha:'123456789076.0', equipamento:'HLREDA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-18', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1947187', linha:'123456789077.0', equipamento:'HLREDA', cenario:'Falha no equipamento', dataEncaminhamento:'2025-08-18', obs:'nd'}
,{analista:'Isabelle', chamado:'PDST-1940543', linha:'123456789078.0', equipamento:'HLREDA', cenario:'Não informado pelo HLR', dataEncaminhamento:'2025-08-18', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1950212', linha:'123456789079.0', equipamento:'HHUA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-19', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1949687', linha:'123456789080.0', equipamento:'Claro flex/enviado para flex', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-19', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1950274', linha:'123456789081.0', equipamento:'HLR', cenario:'Falha no equipamento', dataEncaminhamento:'2025-08-19', obs:'nd'}
,{analista:'Isabelle', chamado:'PDST-1944770', linha:'123456789082.0', equipamento:'HLREDA', cenario:'Não informado pelo HLR', dataEncaminhamento:'2025-08-19', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1950235', linha:'123456789083.0', equipamento:'HLREDA', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-19', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1949566', linha:'123456789084.0', equipamento:'HLREDA', cenario:'franquia não espelhada no sistemas', dataEncaminhamento:'2025-08-19', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1949567', linha:'123456789085.0', equipamento:'pré-pago/encaminhado', cenario:'Não localizado no spsweb', dataEncaminhamento:'2025-08-19', obs:'nd'}
,{analista:'Isabelle', chamado:'PDST-1940702', linha:'123456789086.0', equipamento:'HLREDA', cenario:'Não informado pelo HLR', dataEncaminhamento:'2025-08-19', obs:'nd'}
,{analista:'Isabelle', chamado:'PDST-1947838', linha:'21975766811.0', equipamento:'RTC', cenario:'dados', dataEncaminhamento:'2025-08-19', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1941516', linha:'123456789086.0', equipamento:'HHUA', cenario:'franquia não espelhada no sistemas', dataEncaminhamento:'2025-08-19', obs:'nd'}
,{analista:'Isabelle', chamado:'PDST-1934612', linha:'123456789087.0', equipamento:'hhua', cenario:'Não informado pelo HLR', dataEncaminhamento:'2025-08-19', obs:'nd'}
,{analista:'Lucas', chamado:'PDST-1951167', linha:'123456789088.0', equipamento:'RTC', cenario:'franquia não espelhada no sistemas', dataEncaminhamento:'2025-08-19', obs:'nd'}
,{analista:'Fernando', chamado:'PDST-1951846', linha:'123456789089.0', equipamento:'HLREDA', cenario:'Assinante não localizado SPSWeb', dataEncaminhamento:'2025-08-19', obs:'nd'}
,{analista:'Fernando', chamado:'PDST-1952514', linha:'123456789090.0', equipamento:'HLREDA', cenario:'Assinante não localizado SPSWeb', dataEncaminhamento:'2025-08-19', obs:'nd'}
,{analista:'Fernando', chamado:'PDST-1952558', linha:'123456789091.0', equipamento:'HLREDA', cenario:'Assinante não localizado SPSWeb', dataEncaminhamento:'2025-08-19', obs:'nd'}
,{analista:'Fernando', chamado:'PDST-1952506', linha:'123456789092.0', equipamento:'HLREDA', cenario:'Assinante não localizado SPSWeb', dataEncaminhamento:'2025-08-19', obs:'nd'}
,{analista:'Isabelle', chamado:'PDST-1953333', linha:'123456789093.0', equipamento:'HLREDA', cenario:'Falha no equipamento', dataEncaminhamento:'2025-08-20', obs:'nd'}
,{analista:'Fernando', chamado:'PDST-1953435', linha:'123456789094.0', equipamento:'HLREDA', cenario:'Assinante não localizado SPSWeb', dataEncaminhamento:'2025-08-20', obs:'nd'}
,{analista:'Fernando', chamado:'PDST-1953712', linha:'123456789095.0', equipamento:'HLREDA', cenario:'Assinante não localizado SPSWeb', dataEncaminhamento:'2025-08-20', obs:'nd'}
,{analista:'Fernando', chamado:'PDST-1953682', linha:'123456789096.0', equipamento:'HLREDA', cenario:'Assinante não localizado SPSWeb', dataEncaminhamento:'2025-08-20', obs:'nd'}
,{analista:'Fernando', chamado:'PDST-1953466', linha:'123456789097.0', equipamento:'HLREDA', cenario:'Assinante não localizado SPSWeb', dataEncaminhamento:'2025-08-20', obs:'nd'}
,{analista:'Isabelle', chamado:'PDST-1954233', linha:'123456789098.0', equipamento:'HLREDA', cenario:'Assinante não localizado SPSWeb', dataEncaminhamento:'2025-08-20', obs:'nd'}
,{analista:'Fabricio', chamado:'PDST-1952973', linha:'11966130498.0', equipamento:'HLREDA', cenario:'Falha no equipamento', dataEncaminhamento:'2025-08-20', obs:'nd'}
,{analista:'Fabricio', chamado:'PDST-1952572', linha:'41987171001.0', equipamento:'HLREDA', cenario:'Assinante não localizado SPSWeb', dataEncaminhamento:'2025-08-20', obs:'nd'}
,{analista:'Fabricio', chamado:'PDST-1951876', linha:'71997150080.0', equipamento:'HHUA', cenario:'falha em ligações', dataEncaminhamento:'2025-08-20', obs:'nd'}
,{analista:'Fabricio', chamado:'PDST-1951709', linha:'79981351236.0', equipamento:'HHUA', cenario:'falha em ligações', dataEncaminhamento:'2025-08-20', obs:'nd'}
,{analista:'Fernando', chamado:'PDST-1954672', linha:'123456789098.0', equipamento:'HLREDA', cenario:'Assinante não localizado SPSWeb', dataEncaminhamento:'2025-08-20', obs:'nd'}
,{analista:'Isabelle', chamado:'PDST-1954470', linha:'123456789099.0', equipamento:'HLREDA', cenario:'Assinante não localizado SPSWeb', dataEncaminhamento:'2025-08-20', obs:'nd'}
,{analista:'Isabelle', chamado:'PDST-1954103', linha:'123456789100.0', equipamento:'HHUA', cenario:'Falha no equipamento', dataEncaminhamento:'2025-08-20', obs:'nd'}
,{analista:'Isabelle', chamado:'PDST-1940543', linha:'123456789101.0', equipamento:'HHUA', cenario:'Não informado pelo HLR', dataEncaminhamento:'2025-08-20', obs:'nd'}
,{analista:'Isabelle', chamado:'PDST-1951754', linha:'123456789102.0', equipamento:'RTC', cenario:'cliente afirma nao consegue fazer ligações', dataEncaminhamento:'2025-08-21', obs:'nd'}
,{analista:'Isabelle', chamado:'PDST-1950782', linha:'123456789103.0', equipamento:'HHUA', cenario:'Linha sem apns ', dataEncaminhamento:'2025-08-21', obs:'nd'}
,{analista:'Isabelle', chamado:'PDST-1955360', linha:'123456789104.0', equipamento:'HLREDA', cenario:'linha sem serviço', dataEncaminhamento:'2025-08-21', obs:'nd'}
,{analista:'Fernando', chamado:'PDST-1955591', linha:'123456789105.0', equipamento:'HLREDA', cenario:'Assinante não localizado SPSWeb', dataEncaminhamento:'2025-08-21', obs:'nd'}
,{analista:'Isabelle', chamado:'PDST-1956084', linha:'123456789106.0', equipamento:'HHUA', cenario:'Não informado pelo HLR', dataEncaminhamento:'2025-08-21', obs:'nd'}
,{analista:'Fernando', chamado:'PDST-1956718', linha:'123456789107.0', equipamento:'HLREDA', cenario:'Assinante não localizado SPSWeb', dataEncaminhamento:'2025-08-21', obs:'nd'}
,{analista:'Isabelle', chamado:'PDST-1954337', linha:'123456789108.0', equipamento:'HHUA', cenario:'4G inativo', dataEncaminhamento:'2025-08-21', obs:'nd'}
,{analista:'Fernando', chamado:'PDST-1957288', linha:'123456789109.0', equipamento:'HHUA', cenario:'Não informado pelo HLR', dataEncaminhamento:'2025-08-21', obs:'nd'}
,{analista:'Fernando', chamado:'PDST-1957844', linha:'123456789110.0', equipamento:'HHUA', cenario:'Não informado pelo HLR', dataEncaminhamento:'2025-08-21', obs:'nd'}
,{analista:'Fernando', chamado:'PDST-1957122', linha:'123456789111.0', equipamento:'HHUA', cenario:'Não informado pelo HLR', dataEncaminhamento:'2025-08-21', obs:'nd'}
,{analista:'Isabelle', chamado:'PDST-1954253', linha:'6423781582.0', equipamento:'HLR', cenario:'Não informado pelo HLR', dataEncaminhamento:'2025-08-22', obs:'nd'}
,{analista:'Isabelle', chamado:'PDST-1954270', linha:'44984035638.0', equipamento:'HHUA', cenario:'Não informado pelo HLR', dataEncaminhamento:'2025-08-22', obs:'nd'}
,{analista:'Isabelle', chamado:'PDST-1952973', linha:'11966130498.0', equipamento:'hlreda', cenario:'x'', dataEncaminhamento:'2025-08-22', obs:'nd'}
,{analista:'Isabelle', chamado:'PDST-1957207', linha:'45974002554.0', equipamento:'HLREDA', cenario:'Localização BARRED', dataEncaminhamento:'2025-08-22', obs:'nd'}
,{analista:'Isabelle', chamado:'PDST-1956915', linha:'31995716303.0', equipamento:'HHUA', cenario:'Não informado pelo HLR', dataEncaminhamento:'2025-08-22', obs:'nd'}
,{analista:'Fernando', chamado:'PDST-1959846', linha:'nd', equipamento:'HLREDA', cenario:'Assinante não localizado SPSWeb', dataEncaminhamento:'2025-08-22', obs:'nd'}
,{analista:'Isabelle', chamado:'PDST-1936902', linha:'55999182833.0', equipamento:'HLREDA', cenario:'Falha no equipamento', dataEncaminhamento:'2025-08-22', obs:'nd'}
,{analista:'Isabelle', chamado:'PDST-1957202', linha:'19986034409.0', equipamento:'HLREDA', cenario:'Assinante não localizado SPSWeb', dataEncaminhamento:'nd', obs:'nd'}
,{analista:'Isabelle', chamado:'PDST-1960333', linha:'11978339929.0', equipamento:'HLREDA', cenario:'Assinante não localizado SPSWeb', dataEncaminhamento:'2025-08-25', obs:'nd'}
,{analista:'Isabelle', chamado:'PDST-1961624', linha:'11945467328.0', equipamento:'HLREDA', cenario:'Assinante não localizado SPSWeb', dataEncaminhamento:'2025-08-25', obs:'nd'}
,{analista:'Fernando', chamado:'PDST-1966572', linha:'nd', equipamento:'HLREDA', cenario:'Assinante não localizado SPSWeb', dataEncaminhamento:'2025-08-25', obs:'nd'}
,{analista:'Fabricio', chamado:'PDST-1955236', linha:'47989050043.0', equipamento:'RTC', cenario:'falha nos dados', dataEncaminhamento:'2025-08-26', obs:'nd'}
,{analista:'Fabricio', chamado:'PDST-1957082', linha:'51996191071.0', equipamento:'HLREDA', cenario:'falha na localização', dataEncaminhamento:'2025-08-26', obs:'nd'}
,{analista:'Fabricio', chamado:'PDST-1957202', linha:'19986034409.0', equipamento:'HLREDA', cenario:'Assinante não localizado SPSWeb', dataEncaminhamento:'2025-08-26', obs:'nd'}
,{analista:'Fabricio', chamado:'PDST-1950179', linha:'11991870256.0', equipamento:'HLREDA', cenario:'Assinante não localizado SPSWeb', dataEncaminhamento:'2025-08-26', obs:'nd'}
,{analista:'Fabricio', chamado:'PDST-1965679', linha:'11947212668.0', equipamento:'HLREDA', cenario:'Assinante não localizado SPSWeb', dataEncaminhamento:'2025-08-26', obs:'nd'}
,{analista:'Fabricio', chamado:'PDST-1965242', linha:'11976740912.0', equipamento:'HSS', cenario:'4G Inativo', dataEncaminhamento:'2025-08-26', obs:'nd'}
,{analista:'Fabricio', chamado:'PDST-1961213', linha:'11976786540.0', equipamento:'HLREDA', cenario:'Assinante não localizado SPSWeb', dataEncaminhamento:'2025-08-26', obs:'nd'}
,{analista:'Fabricio', chamado:'PDST-1961914', linha:'11995778459.0', equipamento:'HLREDA', cenario:'Assinante não localizado SPSWeb', dataEncaminhamento:'2025-08-26', obs:'nd'}

    
    
    ];
    const ref = db.ref('app/chamados');
    for(const r of base){
      await ref.push({ ...r, createdAt: now, updatedAt: now, createdBy: 'seed', deleted:false });
    }
  }
}

async function ensureLists(){
  const snap = await db.ref('app/listas').once('value');
  const lists = snap.val()||{equipamentos:[], cenarios:[]};
  state.lists = lists;
  fillSelect('uEquipamento', lists.equipamentos);
  fillSelect('uCenario', lists.cenarios);
  fillSelect('fEquip', ['(Todos)', ...lists.equipamentos]);
  fillSelect('fCenario', ['(Todos)', ...lists.cenarios]);
}
function fillSelect(id, arr){
  const sel = document.getElementById(id);
  if(!sel) return;
  sel.innerHTML = '';
  (arr||[]).forEach(v=>{
    const o = document.createElement('option'); o.value=v; o.textContent=v; sel.appendChild(o);
  });
}

// ======================= LOGIN =======================
loginForm.addEventListener('submit', handleLogin);

async function handleLogin(e){
  e.preventDefault();
  const nomeInput = (usernameEl.value||'').trim();
  const senhaInput = passwordEl.value||'';
  if(!nomeInput || !senhaInput){
    loginError.textContent = 'Informe nome e senha.'; return;
  }
  const key = nomeInput.toLowerCase(); // chave do nó (ex.: helio)
  const snap = await db.ref('app/users/'+key).once('value');
  if(!snap.exists()){
    loginError.textContent = 'Usuário não encontrado.';
    return;
  }
  const u = snap.val();
  if(u.ativo===false){ loginError.textContent = 'Usuário inativo.'; return; }
  const ok = (u.password === senhaInput); // simples (sem hash) para compatibilidade
  if(!ok){ loginError.textContent = 'Senha inválida.'; return; }

  setSession({ id:key, nome: (u.nome||nomeInput), admin: !!u.admin });
  usernameEl.value=''; passwordEl.value='';
  applyAuthUI();
  await refreshUserTable();
  await loadUsers();
  await loadCalls();
  await loadCenarios();
  await buildPublicCharts();
  toast('Bem-vindo!');
}

// ======================= DETECÇÃO DE DUPLICATAS =======================
function checkDuplicates(linha){
  return callsCache.filter(r => !r.deleted && r.linha === linha);
}

function analyzeDuplicates(){
  const linhaMap = {};
  callsCache.filter(r => !r.deleted).forEach(r => {
    if(!linhaMap[r.linha]) {
      linhaMap[r.linha] = [];
    }
    linhaMap[r.linha].push(r);
  });
  
  const duplicates = [];
  Object.entries(linhaMap).forEach(([linha, records]) => {
    if(records.length > 1) {
      const cenarios = [...new Set(records.map(r => r.cenario))];
      const analistas = [...new Set(records.map(r => r.analista))];
      duplicates.push({
        linha,
        count: records.length,
        cenarios: cenarios.join(', '),
        analistas: analistas.join(', ')
      });
    }
  });
  
  state.duplicates = duplicates.sort((a, b) => b.count - a.count);
  renderDuplicateAnalysis();
}

function renderDuplicateAnalysis(){
  if(!duplicateTableBody) return;
  duplicateTableBody.innerHTML = '';
  const frag = document.createDocumentFragment();
  
  state.duplicates.forEach(dup => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${esc(dup.linha)}</td>
      <td>${dup.count}</td>
      <td>${esc(dup.cenarios)}</td>
      <td>${esc(dup.analistas)}</td>
    `;
    frag.appendChild(tr);
  });
  
  duplicateTableBody.appendChild(frag);
}

// ======================= USER: CRUD CHAMADO =======================
btnUserSalvar.addEventListener('click', saveChamadoFromUser);
btnUserNovo.addEventListener('click', ()=>clearUserForm(true));
btnUserLimpar.addEventListener('click', ()=>clearUserForm());

function clearUserForm(resetFocus){
  uChamado.value=''; uLinha.value='';
  if(uEquipamento.options.length>0) uEquipamento.selectedIndex=0;
  if(uCenario.options.length>0) uCenario.selectedIndex=0;
  uData.value='';
  if(resetFocus) uChamado.focus();
}

async function saveChamadoFromUser(){
  const s = getSession(); if(!s) return toast('Sessão expirada');
  const analista = s.nome;
  const chamado = (uChamado.value||'').trim();
  const linha = (uLinha.value||'').trim();
  const equipamento = uEquipamento.value;
  const cenario = uCenario.value;
  const dataEncaminhamento = uData.value;
  if(!chamado||!linha||!equipamento||!cenario||!dataEncaminhamento) return toast('Preencha todos os campos');

  // Verificar duplicatas
  const duplicates = checkDuplicates(linha);
  let isDuplicate = duplicates.length > 0;

  const now = Date.now();
  const data = {
    analista, chamado, linha,
    equipamento: (equipamento||'').toUpperCase(),
    cenario,
    dataEncaminhamento,
    createdAt: now, updatedAt: now,
    createdBy: s.id, deleted:false,
    isDuplicate: isDuplicate
  };
  await db.ref('app/chamados').push(data);
  
  if(isDuplicate) {
    toast('Chamado salvo - ATENÇÃO: Linha duplicada detectada!');
  } else {
    toast('Chamado salvo');
  }
  
  clearUserForm(true);
  await refreshUserTable();
  await loadCalls();
  await buildPublicCharts();
}

// ======================= USER TABLE =======================
let userRows = []; let userPage=1;
userSearch.addEventListener('input', debounce(()=>renderUserTable(),300));
userPageSize.addEventListener('change', ()=>{userPage=1; renderUserTable();});
userPrev.addEventListener('click', ()=>{ if(userPage>1){userPage--; renderUserTable();}});
userNext.addEventListener('click', ()=>{ const ps=+userPageSize.value; if(userPage*ps < filteredUserRows().length){userPage++; renderUserTable();}});

async function refreshUserTable(){
  const s = getSession(); if(!s) return;
  const snap = await db.ref('app/chamados').orderByChild('analista').equalTo(s.nome).once('value');
  const val = snap.val()||{};
  userRows = Object.entries(val)
    .filter(([,r])=>!r.deleted)
    .map(([id,r])=>({id,...r}))
    .sort((a,b)=> (a.dataEncaminhamento||'').localeCompare(b.dataEncaminhamento||''));
  userPage=1; renderUserTable();
}
function filteredUserRows(){
  const q=(userSearch.value||'').toLowerCase();
  if(!q) return userRows;
  return userRows.filter(r=>Object.values({
    data:r.dataEncaminhamento, chamado:r.chamado, linha:r.linha, equip:r.equipamento, cenario:r.cenario
  }).join(' ').toLowerCase().includes(q));
}
function renderUserTable(){
  const rows = filteredUserRows();
  const ps = +userPageSize.value; const start=(userPage-1)*ps; const pageRows = rows.slice(start,start+ps);
  userTableBody.innerHTML='';
  const frag = document.createDocumentFragment();
  pageRows.forEach(r=>{
    const tr = document.createElement('tr');
    // Destacar duplicatas em vermelho
    if(r.isDuplicate || checkDuplicates(r.linha).length > 1) {
      tr.style.backgroundColor = '#ef444422';
      tr.style.borderLeft = '3px solid #ef4444';
    }
    tr.innerHTML = `<td>${r.dataEncaminhamento||''}</td><td>${esc(r.chamado)}</td><td>${esc(r.linha)}</td><td>${esc(r.equipamento)}</td><td>${esc(r.cenario)}</td>`;
    frag.appendChild(tr);
  });
  userTableBody.appendChild(frag);
  userPageInfo.textContent = `${Math.min(start+1, rows.length)}–${Math.min(start+pageRows.length, rows.length)} de ${rows.length}`;
}

// ======================= ADMIN: USUÁRIOS =======================
let usersCache = []; let currentUserEditId = null;

btnUserCreate.addEventListener('click', createUser);
btnUserUpdate.addEventListener('click', updateUser);
btnUserClear.addEventListener('click', ()=>{currentUserEditId=null; aUNome.value=''; aUSenha.value=''; aUAdmin.checked=false; aUAtivo.checked=true; btnUserUpdate.disabled=true;});
admUserSearch.addEventListener('input', debounce(renderUsersTable,300));

async function loadUsers(){
  if(!requireAdmin()) return;
  const snap = await db.ref('app/users').once('value');
  const val = snap.val()||{};
  usersCache = Object.entries(val).map(([id,u])=>({id,...u}));
  renderUsersTable();
}
async function createUser(){
  if(!requireAdmin()) return;
  const nome=(aUNome.value||'').trim(); const senha=aUSenha.value||'';
  if(!nome||!senha) return toast('Nome e senha obrigatórios');
  const key = nome.toLowerCase();
  if(usersCache.some(u=>u.id===key)) return toast('Nome já existe');
  const u = { nome, password: senha, admin: !!aUAdmin.checked, ativo: !!aUAtivo.checked };
  await db.ref('app/users/'+key).set(u);
  toast('Usuário criado');
  aUNome.value=''; aUSenha.value=''; aUAdmin.checked=false; aUAtivo.checked=true;
  await loadUsers();
}
async function updateUser(){
  if(!requireAdmin()) return;
  if(!currentUserEditId) return;
  const nome=(aUNome.value||'').trim();
  const s = getSession(); if(s && s.id===currentUserEditId && !aUAtivo.checked) return toast('Não é possível desativar a si mesmo');
  const patch = { nome, admin: !!aUAdmin.checked, ativo: !!aUAtivo.checked };
  if(aUSenha.value){ patch.password = aUSenha.value; }
  await db.ref('app/users/'+currentUserEditId).update(patch);
  toast('Usuário atualizado');
  await loadUsers();
}
function renderUsersTable(){
  const q=(admUserSearch.value||'').toLowerCase();
  const rows = usersCache.filter(u=>!q||u.nome.toLowerCase().includes(q));
  admUsersTableBody.innerHTML='';
  const frag = document.createDocumentFragment();
  rows.forEach(u=>{
    const tr=document.createElement('tr');
    tr.innerHTML = `<td>${esc(u.nome)}</td><td>${u.admin?'✔':''}</td><td>${u.ativo?'✔':'✖'}</td><td class="muted">${u.id}</td>`;
    const td = document.createElement('td');
    const b1=document.createElement('button'); b1.className='btn'; b1.textContent='Editar';
    const b2=document.createElement('button'); b2.className='btn ghost'; b2.textContent='Excluir';
    b1.onclick=()=>{ currentUserEditId=u.id; aUNome.value=u.nome; aUSenha.value=''; aUAdmin.checked=!!u.admin; aUAtivo.checked=!!u.ativo; btnUserUpdate.disabled=false; };
    b2.onclick=async()=>{
      const s=getSession(); if(s && s.id===u.id) return toast('Não é possível excluir a si mesmo');
      await db.ref('app/users/'+u.id).remove(); toast('Usuário excluído'); await loadUsers();
    };
    td.appendChild(b1); td.appendChild(b2); tr.appendChild(td);
    frag.appendChild(tr);
  });
  admUsersTableBody.appendChild(frag);
}

// ======================= ADMIN: CENÁRIOS =======================
let cenariosCache = []; let currentCenarioEditId = null;

btnCenarioCreate.addEventListener('click', createCenario);
btnCenarioUpdate.addEventListener('click', updateCenario);
btnCenarioClear.addEventListener('click', ()=>{currentCenarioEditId=null; aCenarioNome.value=''; btnCenarioUpdate.disabled=true;});
admCenarioSearch.addEventListener('input', debounce(renderCenariosTable,300));

async function loadCenarios(){
  if(!requireAdmin()) return;
  const snap = await db.ref('app/listas/cenarios').once('value');
  const val = snap.val()||[];
  cenariosCache = val.map((nome, index) => ({id: index, nome}));
  renderCenariosTable();
}

async function createCenario(){
  if(!requireAdmin()) return;
  const nome = (aCenarioNome.value||'').trim();
  if(!nome) return toast('Nome do cenário obrigatório');
  
  const snap = await db.ref('app/listas/cenarios').once('value');
  const cenarios = snap.val() || [];
  
  if(cenarios.includes(nome)) return toast('Cenário já existe');
  
  cenarios.push(nome);
  await db.ref('app/listas/cenarios').set(cenarios);
  toast('Cenário criado');
  aCenarioNome.value = '';
  await loadCenarios();
  await ensureLists();
}

async function updateCenario(){
  if(!requireAdmin()) return;
  if(currentCenarioEditId === null) return;
  const nome = (aCenarioNome.value||'').trim();
  if(!nome) return toast('Nome do cenário obrigatório');
  
  const snap = await db.ref('app/listas/cenarios').once('value');
  const cenarios = snap.val() || [];
  
  if(cenarios.includes(nome) && cenarios[currentCenarioEditId] !== nome) {
    return toast('Cenário já existe');
  }
  
  cenarios[currentCenarioEditId] = nome;
  await db.ref('app/listas/cenarios').set(cenarios);
  toast('Cenário atualizado');
  currentCenarioEditId = null;
  aCenarioNome.value = '';
  btnCenarioUpdate.disabled = true;
  await loadCenarios();
  await ensureLists();
}

async function deleteCenario(index){
  if(!requireAdmin()) return;
  const snap = await db.ref('app/listas/cenarios').once('value');
  const cenarios = snap.val() || [];
  
  cenarios.splice(index, 1);
  await db.ref('app/listas/cenarios').set(cenarios);
  toast('Cenário excluído');
  await loadCenarios();
  await ensureLists();
}

function renderCenariosTable(){
  const q=(admCenarioSearch.value||'').toLowerCase();
  const rows = cenariosCache.filter(c=>!q||c.nome.toLowerCase().includes(q));
  admCenariosTableBody.innerHTML='';
  const frag = document.createDocumentFragment();
  rows.forEach(c=>{
    const tr=document.createElement('tr');
    tr.innerHTML = `<td>${esc(c.nome)}</td>`;
    const td = document.createElement('td');
    const b1=document.createElement('button'); b1.className='btn'; b1.textContent='Editar';
    const b2=document.createElement('button'); b2.className='btn ghost'; b2.textContent='Excluir';
    b1.onclick=()=>{ currentCenarioEditId=c.id; aCenarioNome.value=c.nome; btnCenarioUpdate.disabled=false; };
    b2.onclick=()=>deleteCenario(c.id);
    td.appendChild(b1); td.appendChild(b2); tr.appendChild(td);
    frag.appendChild(tr);
  });
  admCenariosTableBody.appendChild(frag);
}

// ======================= ADMIN: CHAMADOS =======================
let callsCache = [];
btnAplicarFiltros.addEventListener('click', ()=>{ renderCallsTable(); buildCharts(callsFiltered()); });
btnCSV.addEventListener('click', ()=> exportCSV(callsFiltered(), 'chamados.csv'));

async function loadCalls(){
  const snap = await db.ref('app/chamados').once('value');
  const val = snap.val()||{};
  callsCache = Object.entries(val).map(([id,r])=>({id,...r}));
  renderCallsTable();
  buildCharts(callsFiltered());
  analyzeDuplicates();
}
function callsFiltered(){
  let rows = [...callsCache];
  if(!fIncluirExcluidos.checked) rows = rows.filter(r=>!r.deleted);
  if(fEquip.value && fEquip.value!=='(Todos)') rows = rows.filter(r=>r.equipamento===fEquip.value);
  if(fCenario.value && fCenario.value!=='(Todos)') rows = rows.filter(r=>r.cenario===fCenario.value);
  const a=(fAnalista.value||'').trim().toLowerCase(); if(a) rows = rows.filter(r=> (r.analista||'').toLowerCase().includes(a));
  const i=fInicio.value, f=fFim.value;
  if(i) rows = rows.filter(r=> (r.dataEncaminhamento||'') >= i);
  if(f) rows = rows.filter(r=> (r.dataEncaminhamento||'') <= f);
  return rows.sort((a,b)=> (a.dataEncaminhamento||'').localeCompare(b.dataEncaminhamento||''));
}
function renderCallsTable(){
  const rows = callsFiltered();
  admCallsTableBody.innerHTML='';
  const frag = document.createDocumentFragment();
  rows.forEach(r=>{
    const tr=document.createElement('tr');
    // Destacar duplicatas em vermelho
    if(r.isDuplicate || checkDuplicates(r.linha).length > 1) {
      tr.style.backgroundColor = '#ef444422';
      tr.style.borderLeft = '3px solid #ef4444';
    }
    tr.innerHTML = `<td>${r.dataEncaminhamento||''}</td><td>${esc(r.analista)}</td><td>${esc(r.chamado)}</td><td>${esc(r.linha)}</td><td>${esc(r.equipamento)}</td><td>${esc(r.cenario)}</td>`;
    const td=document.createElement('td');
    const b1=document.createElement('button'); b1.className='btn'; b1.textContent=r.deleted?'Restaurar':'Excluir';
    b1.onclick=()=> softDeleteChamado(r.id, !r.deleted);
    td.appendChild(b1); tr.appendChild(td); frag.appendChild(tr);
  });
  admCallsTableBody.appendChild(frag);
}
async function softDeleteChamado(id, del){
  if(!requireAdmin()) return;
  await db.ref('app/chamados/'+id).update({deleted: !!del});
  await loadCalls(); await refreshUserTable();
  await buildPublicCharts();
}

// ======================= DASHBOARD ADMIN =======================
function buildCharts(rows){
  const by = (key)=> rows.reduce((acc,r)=>{ const k=r[key]||'-'; acc[k]=(acc[k]||0)+1; return acc; },{});
  const equip = by('equipamento');
  const cenario = by('cenario');
  const analista = by('analista');

  const k = Object.entries;
  const top = (obj)=> k(obj).sort((a,b)=> b[1]-a[1]).slice(0,3).map(([n,v])=>`${n} (${v})`).join(', ')||'-';
  
  const kpiTotal = document.getElementById('kpiTotal');
  const kpiTopEquip = document.getElementById('kpiTopEquip');
  const kpiTopCenario = document.getElementById('kpiTopCenario');
  const kpiTopAnalista = document.getElementById('kpiTopAnalista');
  
  if(kpiTotal) kpiTotal.textContent = `Total: ${rows.length}`;
  if(kpiTopEquip) kpiTopEquip.textContent = `Top Equipamentos: ${top(equip)}`;
  if(kpiTopCenario) kpiTopCenario.textContent = `Top Cenários: ${top(cenario)}`;
  if(kpiTopAnalista) kpiTopAnalista.textContent = `Top Analista: ${top(analista)}`;

  state.charts.equip = upsertBarChart(state.charts.equip, 'chartEquip', equip);
  state.charts.cenario = upsertPieChart(state.charts.cenario, 'chartCenario', cenario);
  state.charts.analista = upsertBarChart(state.charts.analista, 'chartAnalista', analista);
}

// ======================= DASHBOARD PÚBLICO =======================
async function buildPublicCharts(){
  const rows = callsCache.filter(r => !r.deleted);
  const by = (key)=> rows.reduce((acc,r)=>{ const k=r[key]||'-'; acc[k]=(acc[k]||0)+1; return acc; },{});
  const equip = by('equipamento');
  const cenario = by('cenario');
  const analista = by('analista');

  const k = Object.entries;
  const top = (obj)=> k(obj).sort((a,b)=> b[1]-a[1]).slice(0,3).map(([n,v])=>`${n} (${v})`).join(', ')||'-';
  
  const kpiTotalPublic = document.getElementById('kpiTotalPublic');
  const kpiTopEquipPublic = document.getElementById('kpiTopEquipPublic');
  const kpiTopCenarioPublic = document.getElementById('kpiTopCenarioPublic');
  const kpiTopAnalistaPublic = document.getElementById('kpiTopAnalistaPublic');
  
  if(kpiTotalPublic) kpiTotalPublic.textContent = `Total: ${rows.length}`;
  if(kpiTopEquipPublic) kpiTopEquipPublic.textContent = `Top Equipamentos: ${top(equip)}`;
  if(kpiTopCenarioPublic) kpiTopCenarioPublic.textContent = `Top Cenários: ${top(cenario)}`;
  if(kpiTopAnalistaPublic) kpiTopAnalistaPublic.textContent = `Top Analista: ${top(analista)}`;

  state.charts.equipPublic = upsertBarChart(state.charts.equipPublic, 'chartEquipPublic', equip);
  state.charts.cenarioPublic = upsertPieChart(state.charts.cenarioPublic, 'chartCenarioPublic', cenario);
  state.charts.analistaPublic = upsertBarChart(state.charts.analistaPublic, 'chartAnalistaPublic', analista);
  
  analyzeDuplicates();
}

function upsertBarChart(inst, canvasId, obj){
  const ctx = document.getElementById(canvasId);
  if(!ctx) return null;
  const labels = Object.keys(obj); const data = Object.values(obj);
  if(inst){ inst.data.labels=labels; inst.data.datasets[0].data=data; inst.update(); return inst; }
  return new Chart(ctx,{ type:'bar', data:{ labels, datasets:[{ label:'Qtd', data, backgroundColor: '#3b82f6' }] }, options:{ responsive:true, plugins:{ legend:{display:false}, tooltip:{enabled:true} }, scales:{ y:{ beginAtZero:true } } } });
}
function upsertPieChart(inst, canvasId, obj){
  const ctx = document.getElementById(canvasId);
  if(!ctx) return null;
  const labels = Object.keys(obj); const data = Object.values(obj);
  if(inst){ inst.data.labels=labels; inst.data.datasets[0].data=data; inst.update(); return inst; }
  return new Chart(ctx,{ type:'doughnut', data:{ labels, datasets:[{ data, backgroundColor: ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'] }] }, options:{ responsive:true, plugins:{ legend:{position:'bottom'} } } });
}

// ======================= CSV =======================
function exportCSV(rows, filename){
  const cols=['dataEncaminhamento','analista','chamado','linha','equipamento','cenario'];
  const csv = [cols.join(';')].concat(rows.map(r=>cols.map(c=>`"${(r[c]??'').toString().replaceAll('"','""')}"`).join(';'))).join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url);
}

// ======================= HELPERS =======================
function debounce(fn,ms){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a),ms); }; }
function esc(s){ return (s??'').toString().replace(/[&<>\"]/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[m])); }

// ======================= INIT =======================
(async function init(){
  await seedIfEmpty();
  await ensureLists();
  applyAuthUI();
  await refreshUserTable();
  await loadUsers();
  await loadCalls();
  await loadCenarios();
  await buildPublicCharts();
})();

