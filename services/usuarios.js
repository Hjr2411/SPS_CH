// usuarios.js -> CRUD na coleção "usuarios"
import { db } from "../config/firebase_config.js";
import {
  collection, addDoc, serverTimestamp, getDocs, query, orderBy, updateDoc, doc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { requireAdmin } from "./auth.js";

export async function listUsuarios() {
  const q = query(collection(db, "usuarios"), orderBy("criadoEm","desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function createUsuario({ username, password, role = "user", active = true }) {
  requireAdmin(); // garante (verifica sessão) e bloqueia se não admin
  if (!username || !password) throw new Error("Usuário e senha são obrigatórios.");
  const payload = { username, password, role, active, criadoEm: serverTimestamp() };
  const ref = await addDoc(collection(db, "usuarios"), payload);
  return { id: ref.id, ...payload };
}

export async function updateUsuario(id, fields) {
  requireAdmin();
  await updateDoc(doc(db, "usuarios", id), fields);
}

export async function deleteUsuario(id) {
  requireAdmin();
  await deleteDoc(doc(db, "usuarios", id));
}
