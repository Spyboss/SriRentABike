const net = require('net');

const host = 'aws-1-ap-northeast-1.pooler.supabase.com';
const ports = [5432, 6543];

ports.forEach(port => {
  const socket = new net.Socket();
  socket.setTimeout(3000); // 3s timeout

  console.log(`Testing connection to ${host}:${port}...`);

  socket.on('connect', () => {
    console.log(`✅ Success: Connected to ${host}:${port}`);
    socket.destroy();
  });

  socket.on('timeout', () => {
    console.log(`❌ Timeout: Could not connect to ${host}:${port}`);
    socket.destroy();
  });

  socket.on('error', (err) => {
    console.log(`❌ Error connecting to ${host}:${port}: ${err.message}`);
    socket.destroy();
  });

  socket.connect(port, host);
});
