import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frontendRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const certificateDirectory = path.join(frontendRoot, ".certs");
const certificatePath = path.join(certificateDirectory, "dashforge-lan-cert.pem");
const keyPath = path.join(certificateDirectory, "dashforge-lan-key.pem");
const addressPath = path.join(certificateDirectory, "lan-ip.txt");
const lanIp = process.env.DASHFORGE_LAN_IP ?? "192.168.8.10";
const port = Number(process.env.DASHFORGE_PORT ?? "5173");
const octets = lanIp.split(".").map(Number);
if (
  octets.length !== 4 ||
  octets.some(
    (octet) => !Number.isInteger(octet) || octet < 0 || octet > 255,
  )
) {
  throw new Error(`DASHFORGE_LAN_IP must be an IPv4 address, received ${lanIp}`);
}
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(`DASHFORGE_PORT must be a valid TCP port, received ${port}`);
}

mkdirSync(certificateDirectory, { recursive: true });
const previousIp = existsSync(addressPath)
  ? readFileSync(addressPath, "utf8").trim()
  : "";
const certificateExpiresSoon =
  existsSync(certificatePath) &&
  existsSync(keyPath) &&
  spawnSync(
    "openssl",
    ["x509", "-checkend", "86400", "-noout", "-in", certificatePath],
    { stdio: "ignore" },
  ).status !== 0;
const certificateNeedsRefresh =
  !existsSync(certificatePath) ||
  !existsSync(keyPath) ||
  previousIp !== lanIp ||
  certificateExpiresSoon;

if (certificateNeedsRefresh) {
  console.log(`Generating a self-signed LAN certificate for ${lanIp}...`);
  const result = spawnSync(
    "openssl",
    [
      "req",
      "-x509",
      "-newkey",
      "rsa:2048",
      "-nodes",
      "-keyout",
      keyPath,
      "-out",
      certificatePath,
      "-days",
      "30",
      "-subj",
      `/CN=${lanIp}`,
      "-addext",
      `subjectAltName=IP:${lanIp},DNS:localhost`,
    ],
    { stdio: "inherit" },
  );
  if (result.status !== 0) {
    throw new Error("OpenSSL could not create the LAN certificate.");
  }
  writeFileSync(addressPath, `${lanIp}\n`, "utf8");
}

console.log(`DashForge LAN URL: https://${lanIp}:${port}`);
console.log(
  `Certificate: ${certificatePath} (expires in 30 days; trust it on the Mac or continue past the browser warning)`,
);

const vite = spawn("vite", ["--host", "0.0.0.0"], {
  cwd: frontendRoot,
  env: {
    ...process.env,
    DASHFORGE_LAN_HTTPS: "1",
    DASHFORGE_LAN_IP: lanIp,
    DASHFORGE_PORT: String(port),
  },
  stdio: "inherit",
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => vite.kill(signal));
}

vite.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 1);
  }
});
