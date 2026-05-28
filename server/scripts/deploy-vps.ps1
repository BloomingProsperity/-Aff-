[CmdletBinding()]
param(
  [string] $HostName = "45.8.114.249",
  [string] $User = "root",
  [string] $IdentityFile = "$env:USERPROFILE\.ssh\greencloud_hkai_api_rsa",
  [string] $RemotePath = "/opt/hkai-shop/server"
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ServerRoot = Resolve-Path (Join-Path $ScriptDir "..")
$RepoRoot = Resolve-Path (Join-Path $ServerRoot "..")
$Commit = (& git -C $RepoRoot rev-parse --short=7 HEAD).Trim()
$Version = (Get-Content -LiteralPath (Join-Path $ServerRoot "package.json") -Raw | ConvertFrom-Json).version

if (-not $Commit) {
  throw "Cannot determine git commit for deployment."
}

$Remote = "$User@$HostName"
$Archive = Join-Path ([System.IO.Path]::GetTempPath()) "hkai-server-$Commit.tgz"
$RemoteArchive = "/tmp/hkai-server-$Commit.tgz"
$RemoteScript = "/tmp/hkai-server-deploy-$Commit.sh"
$LocalRemoteScript = Join-Path ([System.IO.Path]::GetTempPath()) "hkai-server-deploy-$Commit.sh"

if (Test-Path -LiteralPath $Archive) {
  Remove-Item -LiteralPath $Archive -Force
}

tar -czf $Archive -C $ServerRoot --exclude node_modules --exclude .env .

$RemoteScriptBody = @"
set -euo pipefail

REMOTE_PATH='$RemotePath'
ARCHIVE='$RemoteArchive'
COMMIT='$Commit'
VERSION='$Version'

test -d "`$REMOTE_PATH"
test -f "`$REMOTE_PATH/.env"

STAMP="`$(date +%Y%m%d-%H%M%S)"
tar --exclude node_modules --exclude .env -czf "/root/hkai-server-backup-`$STAMP.tgz" -C "`$REMOTE_PATH" .
tar -xzf "`$ARCHIVE" -C "`$REMOTE_PATH"

cd "`$REMOTE_PATH"
APP_COMMIT="`$COMMIT" APP_VERSION="`$VERSION" node - <<'NODE'
const fs = require("fs");
const path = ".env";
let text = fs.readFileSync(path, "utf8");
function setEnv(name, value) {
  const line = `${name}=${String(value || "").trim()}`;
  const re = new RegExp(`^${name}=.*$`, "m");
  text = re.test(text) ? text.replace(re, line) : `${text.replace(/\s*$/, "")}\n${line}\n`;
}
setEnv("APP_COMMIT", process.env.APP_COMMIT);
setEnv("APP_VERSION", process.env.APP_VERSION);
fs.writeFileSync(path, text, { mode: 0o600 });
NODE

npm ci --omit=dev
set -a
. ./.env
set +a
npm run migrate
systemctl restart hkai-sms
sleep 2
systemctl is-active hkai-sms
curl -sS --max-time 8 http://127.0.0.1:8788/api/health
"@

Set-Content -LiteralPath $LocalRemoteScript -Value $RemoteScriptBody -Encoding UTF8

scp -i $IdentityFile $Archive "$Remote`:$RemoteArchive"
scp -i $IdentityFile $LocalRemoteScript "$Remote`:$RemoteScript"
ssh -i $IdentityFile $Remote "bash $RemoteScript"
