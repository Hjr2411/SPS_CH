// /services/auth.js
// Login simples usando Realtime Database em app/users/<username>
// Campos aceitos no nó: { password, ativo, admin, nome }

import { rtdb } from "../config/firebase_config.js";
import { ref, get, child } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-database.js";

const SESSION_KEY = "sps_session";
const DEBUG = false; // mude p/ true se quiser ver logs no console

// ---------- sessão ----------
export function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; }
}
export function setSession(user) { localStorage.setItem(SESSION_KEY, JSON.stringify(user)); }
export function clearSession() { localStorage.removeItem(SESSION_KEY); }
export function logout() { clearSession(); }
export function requireAuth() {
  const s = getSession();
  if (!s) { window.location.replace("./index.html"); return null; }
  return s;
}
export function requireAdmin(user = getSession()) {
  if (!user || user.role !== "admin") {
    alert("Apenas administradores.");
    window.location.replace("./dashboard.html");
  }
}

// ---------- helpers ----------
function log(...args){ if (DEBUG) console.log("[auth]", ...args); }

function mapUser(usernameKey, data) {
  if (!data) return null;
  return {
    id: usernameKey,
    username: data.nome ?? usernameKey,
    role: data.admin ? "admin" : "user",
    active: !!data.ativo,
    password: data.password ?? ""
  };
}

async function getUserByKey(usernameKey) {
  const snap = await get(child(ref(rtdb), `app/users/${usernameKey}`));
  if (!snap.exists()) return null;
  const u = mapUser(usernameKey, snap.val());
  log("getUserByKey:", usernameKey, u);
  return u;
}

async function getUserByNome(nome) {
  const snap = await get(child(ref(rtdb), "app/users"));
  if (!snap.exists()) return null;
  const all = snap.val();
  for (const [key, val] of Object.entries(all)) {
    if ((val?.nome || "").toLowerCase() === String(nome).toLowerCase()) {
      const u = mapUser(key, val);
      log("getUserByNome:", nome, "->", u);
      return u;
    }
  }
  return null;
}

// ---------- login ----------
/**
 * Tenta:
 * 1) app/users/<username digitado>
 * 2) busca por campo "nome" == username digitado (case-insensitive)
 */
export async function login(username, password) {
  const u = String(username || "").trim();
  const p = String(password || "");
  if (!u || !p) throw new Error("Informe usuário e senha.");

  // 1) chave do nó
  let user = await getUserByKey(u);

  // 2) fallback por 'nome'
  if (!user) user = await getUserByNome(u);

  if (!user) throw new Error("Usuário não encontrado.");
  if (!user.active) throw new Error("Usuário inativo.");
  if (user.password !== p) throw new Error("Senha inválida.");

  setSession({ uid: user.id, username: user.username, role: user.role });
  log("login OK:", user);
  return user;
}
