const https = require('https');

const testEndpoints = [
  '/v1/api/tim-kiem/phim',
  '/danh-sach/tim-kiem',
  '/tim-kiem/test',
  '/api/tim-kiem/test',
  '/v1/api/danh-sach-tim-kiem',
];

async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const req = https.request('https://ophim1.com' + endpoint, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          console.log(`Endpoint: ${endpoint} - Status: ${res.statusCode}`);
          if (parsed.status) {
            console.log(`  ✓ Response status: ${parsed.status}`);
            console.log(`  Items found: ${parsed.data?.items?.length || 0}`);
          } else {
            console.log(`  Message: ${parsed.msg || parsed.message}`);
          }
        } catch (e) {
          console.log(`Endpoint: ${endpoint} - Parse error: ${data.substring(0, 100)}`);
        }
        console.log('---');
        resolve();
      });
    });
    req.on('error', (e) => {
      console.log(`Endpoint: ${endpoint} - Error: ${e.message}`);
      resolve();
    });
    req.setTimeout(3000, () => {
      console.log(`Endpoint: ${endpoint} - Timeout`);
      req.destroy();
      resolve();
    });
    req.end();
  });
}

(async () => {
  for (const endpoint of testEndpoints) {
    await testEndpoint(endpoint);
  }
})();
