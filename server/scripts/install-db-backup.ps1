[CmdletBinding()]
param(
  [string] $HostName = "45.8.114.249",
  [string] $User = "root",
  [string] $IdentityFile = "$env:USERPROFILE\.ssh\greencloud_hkai_api_rsa",
  [string] $RemotePath = "/opt/hkai-shop/server",
  [string] $BackupDir = "/root/hkai-db-backups",
  [int] $KeepDays = 14,
  [string] $OnCalendar = "*-*-* 03:20:00"
)

$ErrorActionPreference = "Stop"

function ConvertTo-BashSingleQuoted {
  param([string] $Value)
  return "'" + ($Value -replace "'", "'`"`"'" ) + "'"
}

function Write-AsciiLf {
  param([string] $Path, [string] $Value)
  $Body = $Value.Replace("`r`n", "`n")
  $AsciiEncoding = New-Object System.Text.ASCIIEncoding
  [System.IO.File]::WriteAllText($Path, $Body, $AsciiEncoding)
}

$Remote = "$User@$HostName"
$TempDir = [System.IO.Path]::GetTempPath()
$BackupScript = Join-Path $TempDir "hkai-db-backup.sh"
$ServiceFile = Join-Path $TempDir "hkai-db-backup.service"
$TimerFile = Join-Path $TempDir "hkai-db-backup.timer"
$InstallScript = Join-Path $TempDir "hkai-db-backup-install.sh"

$BackupBody = @'
#!/usr/bin/env bash
set -euo pipefail

REMOTE_PATH=__REMOTE_PATH__
BACKUP_DIR=__BACKUP_DIR__
KEEP_DAYS=__KEEP_DAYS__

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"
test -f "$REMOTE_PATH/.env"

set -a
. "$REMOTE_PATH/.env"
set +a

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL missing" >&2
  exit 1
fi

eval "$(node - <<'NODE'
const url = new URL(process.env.DATABASE_URL);
const q = (value) => "'" + String(value || "").replace(/'/g, "'\"'\"'") + "'";
const database = decodeURIComponent(url.pathname.replace(/^\/+/, ""));
console.log("export PGHOST=" + q(url.hostname || "127.0.0.1"));
console.log("export PGPORT=" + q(url.port || "5432"));
console.log("export PGDATABASE=" + q(database));
console.log("export PGUSER=" + q(decodeURIComponent(url.username || "")));
console.log("export PGPASSWORD=" + q(decodeURIComponent(url.password || "")));
NODE
)"

STAMP="$(date +%Y%m%d-%H%M%S)"
TMP="$BACKUP_DIR/hkai-sms-$STAMP.sql.gz.tmp"
OUT="$BACKUP_DIR/hkai-sms-$STAMP.sql.gz"

pg_dump --no-owner --no-privileges -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" | gzip -9 > "$TMP"
chmod 600 "$TMP"
mv "$TMP" "$OUT"
sha256sum "$OUT" > "$OUT.sha256"
chmod 600 "$OUT.sha256"

find "$BACKUP_DIR" -type f \( -name 'hkai-sms-*.sql.gz' -o -name 'hkai-sms-*.sql.gz.sha256' \) -mtime +"$KEEP_DAYS" -delete
ls -lh "$OUT"
'@

$BackupBody = $BackupBody `
  -replace "__REMOTE_PATH__", (ConvertTo-BashSingleQuoted $RemotePath) `
  -replace "__BACKUP_DIR__", (ConvertTo-BashSingleQuoted $BackupDir) `
  -replace "__KEEP_DAYS__", ([string] [Math]::Max(1, $KeepDays))

$ServiceBody = @'
[Unit]
Description=Hkai SMS PostgreSQL backup
Wants=postgresql.service
After=network-online.target postgresql.service

[Service]
Type=oneshot
ExecStart=/usr/local/sbin/hkai-db-backup.sh
'@

$TimerBody = @'
[Unit]
Description=Run Hkai SMS PostgreSQL backup daily

[Timer]
OnCalendar=__ON_CALENDAR__
Persistent=true
RandomizedDelaySec=15m

[Install]
WantedBy=timers.target
'@

$TimerBody = $TimerBody -replace "__ON_CALENDAR__", $OnCalendar

$InstallBody = @'
set -euo pipefail

install -m 700 /tmp/hkai-db-backup.sh /usr/local/sbin/hkai-db-backup.sh
install -m 644 /tmp/hkai-db-backup.service /etc/systemd/system/hkai-db-backup.service
install -m 644 /tmp/hkai-db-backup.timer /etc/systemd/system/hkai-db-backup.timer

systemctl daemon-reload
systemctl enable --now hkai-db-backup.timer
/usr/local/sbin/hkai-db-backup.sh
systemctl list-timers --all hkai-db-backup.timer --no-pager
'@

Write-AsciiLf $BackupScript $BackupBody
Write-AsciiLf $ServiceFile $ServiceBody
Write-AsciiLf $TimerFile $TimerBody
Write-AsciiLf $InstallScript $InstallBody

scp -i $IdentityFile $BackupScript "$Remote`:/tmp/hkai-db-backup.sh"
scp -i $IdentityFile $ServiceFile "$Remote`:/tmp/hkai-db-backup.service"
scp -i $IdentityFile $TimerFile "$Remote`:/tmp/hkai-db-backup.timer"
scp -i $IdentityFile $InstallScript "$Remote`:/tmp/hkai-db-backup-install.sh"
ssh -i $IdentityFile $Remote "bash /tmp/hkai-db-backup-install.sh"
