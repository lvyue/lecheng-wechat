const Wechat = require('../lib/wechat');

const wechat = new Wechat({});


// wechat.handler({method:"GET",query:{"signature":"111"}},{},{});
wechat.location((msg,done) => {
    return "";
},false).text((msg,done)=>{return ""});
console.log(wechat.handlers);
process.exit();