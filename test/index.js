const Wechat = require('../lib/wechat');

const wechat =  new Wechat({});


wechat.handler({method:"GET",query:{"signature":"111"}},{},{});

process.exit();