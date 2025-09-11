// /services/chamados.js
// CRUD de Chamados usando Realtime Database em app/chamados
// Mapeamento:
// - titulo      ← chamado
// - descricao   ← descricao (observações)
// - status      ← deleted ? "Fechado" : "Aberto"
// - prioridade  ← (opcional) campo salvo se informado
// - criadoPor   ← analista
// - criadoEm    ← createdAt (epoch ms)
// - linha/msisdn, equipamento, cenario → campos diretos no RTDB

import { rtdb } from "../config/firebase_config.js";
import {
  ref, get, child, push, set, update, remove
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-database.js";
import { getSession } from "./auth.js";

const ROOT = "app/chamados";

// ---------- Helpers ----------
const toStr = (v) => (v == null ? "" : String(v));

function mapToUI(id, c) {
  return {
    id,
    titulo: toStr(c.chamado) || "(sem título)",
    descricao: toStr(c.descricao || ""),        // <- Observações
    prioridade: c.prioridade ? toStr(c.prioridade) : "Média",
    status: c.deleted ? "Fechado" : "Aberto",
    criadoEm: c.createdAt ?? null,
    criadoPor: { username: c.analista || "-" },
    linha: c.linha || c.msisdn || "",
    equipamento: c.equipamento || "",
    cenario: c.cenario || ""
  };
}

function normalizeForSave({ titulo, descricao, prioridade, status }, user) {
  return {
    chamado: toStr(titulo),
    descricao: toStr(descricao),           // <- Observações gravadas
    prioridade: prioridade ? toStr(prioridade) : undefined,
    deleted: status === "Fechado",
    createdAt: Date.now(),
    analista: user?.username || "desconhecido",
    // Campos específicos; podem ser complementados depois via updateChamado
    equipamento: "",
    linha: "",
    cenario: "",
    isDuplicate: false
  };
}

// ---------- API ----------
export async function listChamados({ busca = "", status = "", prioridade = "" } = {}) {
  const snap = await get(child(ref(rtdb), ROOT));
  const obj = snap.exists() ? snap.val() : {};
  const arr = Object.entries(obj).map(([id, c]) => mapToUI(id, c));

  const qBusca = busca.trim().toLowerCase();

  const filtered = arr.filter(c =>
    (!qBusca || [
      c.titulo, c.descricao, c.linha, c.criadoPor?.username, c.equipamento, c.cenario
    ].some(v => String(v || "").toLowerCase().includes(qBusca))) &&
    (!status || c.status === status) &&
    (!prioridade || c.prioridade === prioridade)
  );

  filtered.sort((a, b) => {
    const ta = Number(a.criadoEm || 0);
    const tb = Number(b.criadoEm || 0);
    if (tb !== ta) return tb - ta;
    return a.titulo.localeCompare(b.titulo, "pt-BR");
  });

  return filtered;
}

export async function createChamado({ titulo, descricao, prioridade = "Média", status = "Aberto" }) {
  const user = getSession();
  if (!user) throw new Error("Sessão expirada.");

  const novo = normalizeForSave({ titulo, descricao, prioridade, status }, user);
  const key = push(ref(rtdb, ROOT)).key;
  await set(ref(rtdb, `${ROOT}/${key}`), novo);
  return mapToUI(key, novo);
}

export async function updateChamado(id, fields) {
  // Aceita atualizar: titulo/descricao/status/prioridade/equipamento/linha/cenario/createdAt
  const patch = {};
  if (fields.titulo != null) patch["chamado"] = toStr(fields.titulo);
  if (fields.descricao != null) patch["descricao"] = toStr(fields.descricao);
  if (fields.status != null) patch["deleted"] = fields.status === "Fechado";
  if (fields.prioridade != null) patch["prioridade"] = toStr(fields.prioridade);

  if (fields.equipamento != null) patch["equipamento"] = toStr(fields.equipamento);
  if (fields.linha != null) patch["linha"] = toStr(fields.linha);
  if (fields.cenario != null) patch["cenario"] = toStr(fields.cenario);

  if (fields.createdAt != null && !Number.isNaN(Number(fields.createdAt))) {
    patch["createdAt"] = Number(fields.createdAt);
  }

  if (Object.keys(patch).length === 0) return;
  await update(ref(rtdb, `${ROOT}/${id}`), patch);
}

export async function deleteChamado(id) {
  await remove(ref(rtdb, `${ROOT}/${id}`));
}
