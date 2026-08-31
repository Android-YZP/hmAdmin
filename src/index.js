const IDENTIFIER = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/activation-codes") {
      const table = env.ACTIVATION_CODE_TABLE || "hm_activation_code";
      if (!IDENTIFIER.test(table)) return json({ success: false, message: "表名配置不合法" }, 500);

      try {
        const columnsResult = await env.DB
          .prepare(`PRAGMA table_info("${table}")`)
          .all();
        const columns = columnsResult.results.map((row) => row.name);
        if (!columns.length) return json({ success: false, message: `找不到数据表：${table}` }, 404);

        const result = await env.DB
          .prepare(`SELECT * FROM "${table}" LIMIT 100`)
          .all();
        return json({ success: true, table, columns, rows: result.results });
      } catch (error) {
        return json({ success: false, message: error instanceof Error ? error.message : String(error) }, 500);
      }
    }

    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response("Huimeng Worker is running.");
  },
};
