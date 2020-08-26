const http = require('http');
const fs = require('fs');
const unzip = require('unzipper')
const https = require('https')

const client_id = 'Iv1.5f77bd0e081f2e25';
const redirect_uri = 'http://localhost:8081/auth';
const client_secret = '0d1758f4b4daae75f2b6ad142ff644644197d1f4';
const state = 'ghj123'
// const postUrl = `https://github.com/login/oauth/access_token?client_id=${encodeURIComponent(client_id)}&client_secret=${encodeURIComponent(client_secret)}&code=${'7b1d814d1c2e2b89bce3'}&redirect_uri=${redirect_uri}&state=${encodeURIComponent(state)}`

// Create an HTTP server
const server = http.createServer((req, res) => {
  console.log(req)
  if (req.url.match(/^\/auth/)) {
    return auth(req, res)
  }
  if (req.url.match(/^\/favicon.ico/)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    return;
  }

  const fileSys = () => {
    let matched = req.url.match(/filename=([^&]+)/);
    let filename = (matched && matched[1]);
    // console.log(filename);
    if (!filename) {
      return;
    }

    // let writeStream = fs.createWriteStream('../server/public/' + filename);

    let writeStream = unzip.Extract({ path: '../server/public' });
    req.pipe(writeStream);

    // 与 pipe 等效
    // req.on('data', trunk => {
    //   writeStream.write(trunk);
    // })
    // req.on('end', trunk => {
    //   writeStream.end(trunk);
    // })

    req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('okay');
    })
  }
  // OAuth Start
  console.log(req.headers);

  const options = {
    hostname: 'api.github.com',
    port: 443,
    path: '/user',
    method: 'GET',
    headers: {
      Authorization: `token ${req.headers.xtoken}`,
      'User-Agent': 'ghjOauth',
    },
  };
  console.log('options ' + options);
  const request = https.request(options, (response) => {
    let body = '';
    response.on('data', (d) => {
      if (d) {
        body += d.toString();
      }
    });

    response.on('end', () => {
      console.log(body);
      let user = JSON.parse(body);
      const writeStrem = unzip.Extract({ path: '../server/public' });
      req.pipe(writeStrem);
      req.on('end', () => {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('okay');
      });
    });
  });
  request.on('error', (e) => {
    console.error(e);
  });
  request.end();
});
server.listen(8081)



function auth (req, res) {
  const code = req.url.match(/code=([^&]+)/)[1]
  console.log('auth', code)
  const options = {
    hostname: 'github.com',
    port: 443,
    path: `/login/oauth/access_token?client_id=${encodeURIComponent(client_id)}&client_secret=${encodeURIComponent(client_secret)}&code=${code}&redirect_uri=${redirect_uri}&state=${encodeURIComponent(state)}`,
    method: 'POST'
  };
  
  const reqhtts = https.request(options, (response) => {
    // console.log('statusCode:', res.statusCode);
    // console.log('headers:', res.headers);
  
    response.on('data', (d) => {
      console.log(d.toString());
      let result = d.toString().match(/access_token([^&]+)/);
      if (result) {
        let token = result[1];
        res.writeHead(200, {
          'access_token': token,
          'Content-Type': 'text/html'
        });
        res.end(`<a href="http://localhost:8080/publish?token${token}">publish</a>`);
      } else {
        res.writeHead(200, {
          'Content-Type': 'text/plain'
        });
        res.end('error');
      }
    });
  });
  reqhtts.on('error', (e) => {
    console.error(e);
  });
  reqhtts.end();
}