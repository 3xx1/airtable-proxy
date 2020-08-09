require('dotenv').config();
const Client = require('ssh2-sftp-client');
const exec = require('ssh-exec');

// File Copy
let sftp = new Client();
sftp.connect({
  host: process.env.DEPLOY_TARGET,
  username: process.env.DEPLOY_USER,
  password: process.env.DEPLOY_PASSWORD
}).then(() => {
  sftp.put('app.js', '/api/app.js');
  sftp.put('consts.js', '/api/consts.js');
  sftp.put('package.json', '/api/package.json');
  sftp.put('.env', '/api/.env');  
}).then(() => {
  console.log('File transfer successful');

  exec('kill $(lsof -t -i:4200) && cd /api && yarn && yarn dev', {
    host: process.env.DEPLOY_TARGET,
    user: process.env.DEPLOY_USER,
    key: '~/.ssh/id_rsa',
    password: process.env.DEPLOY_PASSWORD  
  }).pipe(process.stdout);
}).catch(err => {
  console.log(err, 'catch error');
});
