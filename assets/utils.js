// utils.js -> helpers gerais
export function toast(msg, type = "info", timeout = 2400) {
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), timeout);
}

export function formatDate(ts) {
  // ts pode ser Timestamp Firestore, Date ou string
  let d;
  if (!ts) return "-";
  if (typeof ts?.toDate === "function") d = ts.toDate();
  else d = new Date(ts);
  return d.toLocaleString("pt-BR");
}
