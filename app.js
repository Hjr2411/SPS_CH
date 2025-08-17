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
      equipamentos:["HLR","HHUA","HLREDA","HSS","RTC","VPNSIX","SGV","Claro flex"],
      cenarios:["Voz","Dados","Voz e dados","Não localizado no SPSWeb","Falha no equipamento","Franquia de dados","Assinante não possui HSS","4G/5G inativo","RESTRICTED","IMEI", "SEM VOLTE"               
               ]
    });
  }
  // Chamados demo (se quiser gráficos na 1ª execução)
  const callsSnap = await db.ref('app/chamados').once('value');
  if(!callsSnap.exists()){
    const now = Date.now();
    const base = [
      {analista:'Lucas', chamado:'C-1001', linha:'551199999001', equipamento:'HLR', cenario:'Voz', dataEncaminhamento:'2025-08-01'},
      {analista:'Rodrigo', chamado:'C-1002', linha:'551199999002', equipamento:'HSS', cenario:'Dados', dataEncaminhamento:'2025-08-03'},
      {analista:'Fernando', chamado:'C-1003', linha:'551199999003', equipamento:'RTC', cenario:'Falha no equipamento', dataEncaminhamento:'2025-08-05'},
      {analista:'Isabelle', chamado:'C-1004', linha:'551199999004', equipamento:'VPNSIX', cenario:'Voz e dados', dataEncaminhamento:'2025-08-08'},
      {analista:'Helio', chamado:'C-1005', linha:'551199999005', equipamento:'HLREDA', cenario:'RESTRICTED', dataEncaminhamento:'2025-08-10'},
      {analista:'Helio', chamado:'C-1006', linha:'551199999006', equipamento:'SGV', cenario:'Dados', dataEncaminhamento:'2025-08-12'},
      // Adicionando algumas duplicatas para teste
      {analista:'Lucas', chamado:'C-1007', linha:'551199999001', equipamento:'HSS', cenario:'Dados', dataEncaminhamento:'2025-08-15'},
      {analista:'Fernando', chamado:'C-1008', linha:'551199999003', equipamento:'HLR', cenario:'Voz', dataEncaminhamento:'2025-08-18'}
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

