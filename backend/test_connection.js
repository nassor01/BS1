const http = require('http');

const data = JSON.stringify({
  status: 'confirmed'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/bookings/1/status', // Assuming sending a test ID 1, might return 404 or 400 but at least confirms connection
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log('StatusCode:', res.statusCode);
  res.on('data', (d) => {
    process.stdout.write(d);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();
