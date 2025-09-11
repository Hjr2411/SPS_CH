// auth.js -> login/logout/sessão simples usando Firestore (coleção "usuarios")
import { db } from "./config/firebase_config.js";
import {
  collection, query, where, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const SESSION_KEY = "sps_session";

export function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
  catch { return null; }
}

export function setSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function requireAuth() {
  const sess = getSession();
  if (!sess) {
    window.location.replace("./index.html");
    return null;
  }
  return sess;
}

export function requireAdmin(user = getSession()) {
  if (!user || user.role !== "admin") {
    alert("Acesso restrito a administradores.");
    window.location.replace("./dashboard.html");
  }
}

export async function login(username, password) {
  username = (username || "").trim();
  const q = query(
    collection(db, "usuarios"),
    where("username", "==", username),
    where("password", "==", password),
    where("active", "==", true)
  );
  const snap = await getDocs(q);
  if (snap.empty) throw new Error("Usuário/senha inválidos ou usuário inativo.");
  const doc = snap.docs[0];
  const user = { id: doc.id, ...doc.data() };
  setSession({ uid: user.id, username: user.username, role: user.role });
  return user;
}

export function logout() {
  clearSession();
}
