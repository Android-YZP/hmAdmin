const IDENTIFIER = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
const CARD_DAYS = { TRIAL: 3, MONTH: 30, YEAR: 365, PERMANENT: 36135 };

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function appResult(data, message = "操作成功", status = 200) {
  return json({ code: status === 200 ? 200 : 500, message, data }, status);
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function makeCode() {
  // 老项目：fastSimpleUUID 去横杠后截取前 20 位，再按 4 位分组。
  return crypto.randomUUID().replaceAll("-", "").slice(0, 20).toUpperCase().match(/.{4}/g).join("-");
}

function normalizeCode(code) { return String(code || "").trim().replaceAll(" ", "").toUpperCase(); }
function requireDeviceId(deviceId) {
  const value = String(deviceId || "").trim();
  if (!value) throw new Error("设备标识不能为空");
  if (value.length > 128) throw new Error("设备标识过长");
  return value;
}
function localDateToEpoch(value) {
  if (!value) return null;
  const [date, time = "00:00:00"] = String(value).split(" ");
  return Math.floor(Date.parse(`${date}T${time}+08:00`) / 1000);
}
function nowText() { return new Date().toLocaleString("sv-SE", { timeZone: "Asia/Shanghai", hour12: false }).replace("T", " "); }
function plusDaysText(days) { return new Date(Date.now() + days * 86400000).toLocaleString("sv-SE", { timeZone: "Asia/Shanghai", hour12: false }).replace("T", " "); }
function base64Bytes(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}
function base64Url(bytes) {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}
async function signLicense(item, env) {
  const privateKey = env.LICENSE_PRIVATE_KEY_PKCS8_BASE64;
  if (!privateKey) throw new Error("未配置激活许可证签名私钥");
  const payload = { v: 1, iss: "huimeng-admin", aud: "zv8kq2lm7rx4ca", licenseId: item.id, deviceId: item.device_id, plan: item.card_type, issuedAt: localDateToEpoch(item.activated_at), expiresAt: localDateToEpoch(item.expires_at) };
  const payloadJson = JSON.stringify(payload);
  const key = await crypto.subtle.importKey("pkcs8", base64Bytes(privateKey), { name: "Ed25519" }, false, ["sign"]);
  const signature = await crypto.subtle.sign({ name: "Ed25519" }, key, new TextEncoder().encode(payloadJson));
  return { licensePayload: payloadJson, licenseSignature: base64Url(new Uint8Array(signature)), keyId: env.LICENSE_KEY_ID || "ed25519-2026-01" };
}

async function getTable(env) {
  const table = env.ACTIVATION_CODE_TABLE || "hm_activation_code";
  if (!IDENTIFIER.test(table)) throw new Error("表名配置不合法");
  return table;
}

async function readJson(request) {
  try { return await request.json(); } catch { throw new Error("请求参数不是合法 JSON"); }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/app/activation/")) {
      try {
        const table = await getTable(env);
        const path = url.pathname.slice("/api/app/activation/".length);
        const data = request.method === "POST" ? await readJson(request) : {};
        if (!["activate", "check", "unbind"].includes(path)) return appResult(null, "不支持的请求", 405);
        const code = normalizeCode(data.code);
        const deviceId = data.deviceId ? requireDeviceId(data.deviceId) : "";
        const item = code ? await env.DB.prepare(`SELECT * FROM "${table}" WHERE code = ? AND deleted = 0 LIMIT 1`).bind(code).first() : null;

        if (!item) return appResult(null, code ? "激活码不存在" : "激活码不能为空", 400);
        if (item.status === 2) return appResult(null, "激活码已禁用", 400);
        if (item.expires_at && localDateToEpoch(item.expires_at) < Math.floor(Date.now() / 1000)) return appResult(null, "激活码已过期", 400);

        if (path === "activate" && request.method === "POST") {
          if (!deviceId) return appResult(null, "设备标识不能为空", 400);
          const wasActivated = item.status === 1;
          if (wasActivated && item.device_id !== deviceId) return appResult(null, "激活码已绑定其他设备", 400);
          const activatedAt = item.activated_at || nowText();
          const expiresAt = item.expires_at || plusDaysText(item.valid_days || CARD_DAYS[item.card_type] || 1);
          item.status = 1; item.device_id = deviceId; item.device_name = data.deviceName?.trim() || item.device_name || null; item.platform = data.platform?.trim() || item.platform || null; item.app_version = data.appVersion?.trim() || item.app_version || null; item.package_name = data.packageName?.trim() || item.package_name || null; item.activated_at = activatedAt; item.expires_at = expiresAt; item.card_type = item.card_type || "MONTH";
          const signature = await signLicense(item, env);
          if (!wasActivated) await env.DB.prepare(`UPDATE "${table}" SET status = 1, device_id = ?, device_name = ?, platform = ?, app_version = ?, package_name = ?, activated_at = ?, expires_at = ?, update_time = datetime('now') WHERE id = ?`).bind(item.device_id, item.device_name, item.platform, item.app_version, item.package_name, item.activated_at, item.expires_at, item.id).run();
          return appResult({ valid: true, code: item.code, deviceId: item.device_id, cardType: item.card_type, activatedAt: item.activated_at, expiresAt: item.expires_at, message: wasActivated ? "设备已激活" : "激活成功", ...signature });
        }

        if (path === "check" && request.method === "POST") {
          if (!deviceId) return appResult(null, "设备标识不能为空", 400);
          if (item.status !== 1 || item.device_id !== deviceId) return appResult(null, "当前设备未激活", 400);
          return appResult({ valid: true, code: item.code, deviceId: item.device_id, cardType: item.card_type, activatedAt: item.activated_at, expiresAt: item.expires_at, message: "校验通过" });
        }

        if (path === "unbind" && request.method === "POST") {
          if (!deviceId) return appResult(null, "设备标识不能为空", 400);
          if (item.status !== 1 || item.device_id !== deviceId) return appResult(null, "当前设备未激活", 400);
          await env.DB.prepare(`UPDATE "${table}" SET status = 0, device_id = NULL, device_name = NULL, platform = NULL, app_version = NULL, package_name = NULL, activated_at = NULL, update_time = datetime('now') WHERE id = ?`).bind(item.id).run();
          return appResult(null);
        }
        return appResult(null, "不支持的请求", 405);
      } catch (error) {
        return appResult(null, errorMessage(error), 500);
      }
    }

    if (url.pathname.startsWith("/api/activation-codes")) {
      try {
        const table = await getTable(env);
        const columnsResult = await env.DB
          .prepare(`PRAGMA table_info("${table}")`)
          .all();
        const columns = columnsResult.results.map((row) => row.name);
        if (!columns.length) return json({ success: false, message: `找不到数据表：${table}` }, 404);

        if (url.pathname === "/api/activation-codes" && request.method === "GET") {
          const page = Math.max(1, Number(url.searchParams.get("page") || 1));
          const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") || 10)));
          const code = url.searchParams.get("code")?.trim();
          const deviceId = url.searchParams.get("deviceId")?.trim();
          const status = url.searchParams.get("status");
          const where = ["deleted = 0"];
          const binds = [];
          if (code) { where.push("code LIKE ?"); binds.push(`%${code.replaceAll(" ", "").toUpperCase()}%`); }
          if (deviceId) { where.push("device_id LIKE ?"); binds.push(`%${deviceId}%`); }
          if (status !== null && status !== "") { where.push("status = ?"); binds.push(Number(status)); }
          const condition = where.join(" AND ");
          const totalResult = await env.DB.prepare(`SELECT COUNT(*) AS total FROM "${table}" WHERE ${condition}`).bind(...binds).first();
          const result = await env.DB.prepare(`SELECT * FROM "${table}" WHERE ${condition} ORDER BY id DESC LIMIT ? OFFSET ?`).bind(...binds, pageSize, (page - 1) * pageSize).all();
          return json({ success: true, table, columns, rows: result.results, page, pageSize, total: Number(totalResult?.total || 0) });
        }

        if (url.pathname === "/api/activation-codes/generate" && request.method === "POST") {
          const data = await readJson(request);
          const count = Number(data.count);
          const cardType = String(data.cardType || "");
          const validDays = cardType === "CUSTOM" ? Number(data.validDays) : CARD_DAYS[cardType];
          if (!Number.isInteger(count) || count < 1 || count > 500) return json({ success: false, message: "生成数量必须在 1 到 500 之间" }, 400);
          if (!Number.isInteger(validDays) || validDays < 1 || validDays > 36500) return json({ success: false, message: "有效天数必须在 1 到 36500 天之间" }, 400);
          if (!Object.hasOwn(CARD_DAYS, cardType) && cardType !== "CUSTOM") return json({ success: false, message: "卡类型不合法" }, 400);
          const statements = Array.from({ length: count }, () => env.DB.prepare(`INSERT INTO "${table}" (code, status, card_type, valid_days, remark, create_time, update_time, deleted) VALUES (?, 0, ?, ?, ?, datetime('now'), datetime('now'), 0)`).bind(makeCode(), cardType, validDays, data.remark?.trim() || null));
          await env.DB.batch(statements);
          return json({ success: true, count });
        }

        const action = url.pathname.match(/^\/api\/activation-codes\/(\d+)\/(expires-at|disable|enable|reset)$/);
        if (action && request.method === (action[2] === "expires-at" ? "PUT" : "POST")) {
          const id = Number(action[1]);
          let statement;
          if (action[2] === "expires-at") {
            const data = await readJson(request);
            const expiresAt = data.expiresAt ? String(data.expiresAt) : null;
            statement = env.DB.prepare(`UPDATE "${table}" SET expires_at = ?, update_time = datetime('now') WHERE id = ? AND deleted = 0`).bind(expiresAt, id);
          } else if (action[2] === "disable") statement = env.DB.prepare(`UPDATE "${table}" SET status = 2, update_time = datetime('now') WHERE id = ? AND deleted = 0`).bind(id);
          else if (action[2] === "enable") statement = env.DB.prepare(`UPDATE "${table}" SET status = 0, update_time = datetime('now') WHERE id = ? AND deleted = 0`).bind(id);
          else statement = env.DB.prepare(`UPDATE "${table}" SET status = 0, device_id = NULL, device_name = NULL, platform = NULL, app_version = NULL, package_name = NULL, activated_at = NULL, update_time = datetime('now') WHERE id = ? AND deleted = 0`).bind(id);
          const result = await statement.run();
          if (!result.meta.changes) return json({ success: false, message: "激活码不存在" }, 404);
          return json({ success: true });
        }

        return json({ success: false, message: "不支持的请求" }, 405);
      } catch (error) {
        return json({ success: false, message: errorMessage(error) }, 500);
      }
    }

    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response("Huimeng Worker is running.");
  },
};
