const os = require("os");
const { spawn } = require("child_process");

function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "localhost";
}

const ip = getLocalIp();
const port = process.env.PORT || "3000";

console.log("");
console.log("  ▲ Next.js (development)");
console.log(`  - Local:        http://localhost:${port}`);
console.log(`  - Network:      http://${ip}:${port}`);
console.log("");

const child = spawn("next", ["dev", "-H", "0.0.0.0", "-p", port], {
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => process.exit(code ?? 0));