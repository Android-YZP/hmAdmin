import { Client } from "pg";

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
      const table = env.ACTIVATION_CODE_TABLE || "activation_codes";
      if (!IDENTIFIER.test(table)) return json({ success: false, message: "表名配置不合法" }, 500);

      const client = new Client({ connectionString: env.HYPERDRIVE.connectionString });
      try {
        await client.connect();
        const columnsResult = await client.query(
          `SELECT column_name FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = $1
           ORDER BY ordinal_position`,
          [table]
        );
        const columns = columnsResult.rows.map((row) => row.column_name);
        if (!columns.length) return json({ success: false, message: `找不到数据表：${table}` }, 404);

        const result = await client.query(`SELECT * FROM "${table}" LIMIT 100`);
        return json({ success: true, table, columns, rows: result.rows });
      } catch (error) {
        return json({ success: false, message: error instanceof Error ? error.message : String(error) }, 500);
      } finally {
        await client.end().catch(() => {});
      }
    }

    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response("Huimeng Worker is running.");
  },
};
