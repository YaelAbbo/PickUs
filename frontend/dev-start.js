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

  const ip192 = candidates.find((ip) => ip.startsWith('192.'));
  const ip10 = candidates.find((ip) => ip.startsWith('10.'));
  const ip172 = candidates.find((ip) => ip.startsWith('172.'));

  const localIp = ip192 ?? ip10 ?? ip172 ?? candidates[0] ?? 'localhost';

  return localIp;
}

const ip = getLocalIp();
process.env.EXPO_PUBLIC_API_URL = `http://${ip}/api`;
process.env.REACT_NATIVE_PACKAGER_HOSTNAME = ip;

process.env.EXPO_OFFLINE = '1';
process.env.EXPO_NO_TELEMETRY = '1';

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
