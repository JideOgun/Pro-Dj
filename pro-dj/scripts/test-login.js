const https = require('https');

async function testLogin() {
  const data = JSON.stringify({
    email: 'jideogun93@gmail.com',
    password: 'Dickens3114'
  });

  const options = {
    hostname: 'pro-dj.vercel.app',
    port: 443,
    path: '/api/debug-login-test',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: result });
        } catch (error) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

console.log('🧪 Testing login endpoint...');
console.log('📧 Email: jideogun93@gmail.com');
console.log('🔑 Password: Dickens3114');
console.log('');

testLogin()
  .then(({ status, data }) => {
    console.log(`📊 Status: ${status}`);
    console.log('📄 Response:');
    console.log(JSON.stringify(data, null, 2));
  })
  .catch((error) => {
    console.error('❌ Error:', error.message);
  });
