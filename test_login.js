import http from 'http';
const data = JSON.stringify({ phone: '9876543210' });
const req = http.request({
  hostname: 'localhost', port: 5000, path: '/api/auth/send-otp',
  method: 'POST', headers: {'Content-Type': 'application/json'}
}, (res) => { res.on('data', (d) => process.stdout.write(d)) });
req.write(data); req.end();
