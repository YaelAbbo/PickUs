const os = require('os');
const { spawn } = require('child_process');

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  const candidates = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        candidates.push(iface.address);
      }
    }
  }

  const candidateLocalIp = candidates
    .toSorted()
    .find((ip) => ip.startsWith('192.') || ip.startsWith('10.') || ip.startsWith('172.'));
  const localIp = candidateLocalIp ?? candidates[0] ?? 'localhost';

  return localIp;
}

const ip = getLocalIp();
process.env.EXPO_PUBLIC_API_URL = `http://${ip}/api`;
process.env.REACT_NATIVE_PACKAGER_HOSTNAME = ip;

console.log('--------------------------------------------------');
console.log(`Detected Local IP: ${ip}`);
console.log(`Setting EXPO_PUBLIC_API_URL=${process.env.EXPO_PUBLIC_API_URL}`);
console.log(`Setting REACT_NATIVE_PACKAGER_HOSTNAME=${ip}`);
console.log('--------------------------------------------------');

const child = spawn('npx', ['expo', 'start'], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

child.on('exit', (code) => {
  process.exit(code);
});
