const https = require('https');
const fs = require('fs');
const path = require('path');
const querystring = require('querystring');

const envFile = path.resolve(__dirname, '.env.local');
const envText = fs.existsSync(envFile) ? fs.readFileSync(envFile, 'utf8') : '';
const keyLine = envText.split(/\r?\n/).find((line) => line.startsWith('GOOGLE_MAPS_API_KEY='));
const key = keyLine ? keyLine.split('=')[1].trim() : process.env.GOOGLE_MAPS_API_KEY;

console.log('KEY present:', !!key);
console.log('KEY source:', keyLine ? '.env.local' : 'process.env');

const queries = ['lekki', 'lekki phase 1', 'lekki phase 1 lagos', 'lekki, lagos'];

(async () => {
  for (const q of queries) {
    const params = querystring.stringify({
      address: q,
      key,
      region: 'NG',
      components: 'country:NG',
      language: 'en'
    });
    const url = `https://maps.googleapis.com/maps/api/geocode/json?${params}`;
    console.log('QUERY:', q);
    await new Promise((resolve) => {
      https.get(url, (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            console.log(' status=', data.status, 'error=', data.error_message || null, 'results=', data.results?.length || 0);
            if (data.results?.length) {
              console.log(' first=', data.results[0].formatted_address);
            }
          } catch (e) {
            console.log(' parse error', e.message);
          }
          console.log('---');
          resolve();
        });
      }).on('error', (err) => {
        console.log('request error', err.message);
        resolve();
      });
    });
  }
})();
