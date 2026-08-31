const menuView = document.querySelector("#menu-view");
const codesView = document.querySelector("#codes-view");
const head = document.querySelector("#code-head");
const body = document.querySelector("#code-body");
const emptyState = document.querySelector("#empty-state");
const notice = document.querySelector("#notice");
const resultCount = document.querySelector("#result-count");
const tableName = document.querySelector("#table-name");

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showMenu() {
  menuView.classList.remove("hidden");
  codesView.classList.add("hidden");
  history.replaceState(null, "", "#menu");
}

async function showCodes() {
  menuView.classList.add("hidden");
  codesView.classList.remove("hidden");
  history.replaceState(null, "", "#activation-codes");
  await loadActivationCodes();
}

async function loadActivationCodes() {
  emptyState.hidden = false;
  emptyState.textContent = "正在连接数据库…";
  head.innerHTML = "";
  body.innerHTML = "";
  notice.textContent = "";

  try {
    const response = await fetch("/api/activation-codes");
    const payload = await response.json();
    if (!response.ok || !payload.success) throw new Error(payload.message || "查询失败");

    tableName.textContent = payload.table;
    head.innerHTML = `<tr>${payload.columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}</tr>`;
    body.innerHTML = payload.rows.map((row) =>
      `<tr>${payload.columns.map((column) => `<td>${escapeHtml(row[column])}</td>`).join("")}</tr>`
    ).join("");
    emptyState.hidden = payload.rows.length > 0;
    emptyState.textContent = payload.rows.length ? "" : "表中暂无数据";
    resultCount.textContent = `共 ${payload.rows.length} 条记录`;
  } catch (error) {
    emptyState.hidden = false;
    emptyState.textContent = "数据库连接失败";
    resultCount.textContent = "查询失败";
    notice.textContent = error.message;
  }
}

document.querySelector("#activation-menu").addEventListener("click", showCodes);
document.querySelector("#back-button").addEventListener("click", showMenu);
document.querySelector("#brand-link").addEventListener("click", (event) => {
  event.preventDefault();
  showMenu();
});
document.querySelector("#refresh-button").addEventListener("click", loadActivationCodes);

if (location.hash === "#activation-codes") showCodes();
