import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { readBackupStatus } from "../src/lib/backupStatus.js";

test("backup status reports safe recent backup metadata", async () => {
  const dir = await mkdtemp(join(tmpdir(), "hkai-backup-status-"));
  try {
    const file = join(dir, "status.json");
    await writeFile(file, JSON.stringify({
      ok: true,
      finishedAt: new Date().toISOString(),
      file: "hkai-sms-20260528-213602.sql.gz",
      sizeBytes: 21_504,
      sha256: "a".repeat(64),
      backupDir: "/root/hkai-db-backups",
      databaseUrl: "postgres://secret",
    }));

    const status = await readBackupStatus({ backupStatusFile: file, backupStaleHours: 36 });

    assert.equal(status.enabled, true);
    assert.equal(status.status, "ok");
    assert.equal(status.file, "hkai-sms-20260528-213602.sql.gz");
    assert.equal(status.sizeBytes, 21_504);
    assert.equal(status.sha256Suffix, "aaaaaa");
    assert.equal(JSON.stringify(status).includes("/root"), false);
    assert.equal(JSON.stringify(status).includes("postgres://"), false);
    assert.equal(JSON.stringify(status).includes("secret"), false);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("backup status fails closed when missing or stale", async () => {
  const missing = await readBackupStatus({ backupStatusFile: join(tmpdir(), "missing-hkai-backup-status.json") });
  assert.equal(missing.status, "missing");
  assert.equal(missing.ok, false);

  const dir = await mkdtemp(join(tmpdir(), "hkai-backup-status-"));
  try {
    const file = join(dir, "status.json");
    await writeFile(file, JSON.stringify({
      ok: true,
      finishedAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
      file: "../secret.sql.gz",
      sizeBytes: -1,
      sha256: "not-a-real-sha",
    }));

    const stale = await readBackupStatus({ backupStatusFile: file, backupStaleHours: 36 });

    assert.equal(stale.status, "stale");
    assert.equal(stale.ok, false);
    assert.equal(stale.file, "secret.sql.gz");
    assert.equal(stale.sizeBytes, 0);
    assert.equal(stale.sha256Suffix, "");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

