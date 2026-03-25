const path = require('path');

module.exports = {
  apps: [{
    name: "apple-rebilly-checkout",
    script: path.join(__dirname, "../backend/server.js"),
    instances: 1,
    exec_mode: "fork",
    watch: false,
    env: {
      NODE_ENV: "production",
      PORT: 3001
    }
  }]
};
