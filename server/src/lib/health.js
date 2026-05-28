export async function healthStatus(db) {
  const checkedAt = new Date().toISOString();
  try {
    await db.query("SELECT 1 AS ok");
    return {
      httpStatus: 200,
      body: {
        ok: true,
        database: "ok",
        checkedAt,
      },
    };
  } catch {
    return {
      httpStatus: 503,
      body: {
        ok: false,
        database: "error",
        checkedAt,
      },
    };
  }
}
