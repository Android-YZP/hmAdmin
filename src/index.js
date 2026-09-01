const IDENTIFIER = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
const CARD_DAYS = { TRIAL: 3, MONTH: 30, YEAR: 365, PERMANENT: 36135 };

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function makeCode() {
  return crypto.randomUUID().replaceAll("-", "").toUpperCase().match(/.{1,4}/g).join("-");
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
          if (code) { where.push("code LIKE ?"); binds.push(`%${code}%`); }
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
          else statement = env.DB.prepare(`UPDATE "${table}" SET status = 0, device_id = NULL, device_name = NULL, platform = NULL, app_version = NULL, package_name = NULL, activated_at = NULL, expires_at = NULL, update_time = datetime('now') WHERE id = ? AND deleted = 0`).bind(id);
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
