# lecheng-wechat
乐橙谷微信模块是[乐橙谷](http://www.lechenggu.com)研发组开源的微信服务端开发组件。  
Install with：  
```js
npm install lecheng-wechat --save
```
Require:  
* Node v4.0 +
* [Redis v2.6.1+](https://www.npmjs.com/package/redis)  

## Usage Example  
```js
var router = require('express').Router();
var Wechat = require('lecheng-wechat');
var wechat = new Wechat({
    appId: 'wxxxx', // 微信服务号id
    appName: "乐橙谷", //微信名称
    appAccount: 'lechenggu', // 微信服务号账户
    appSecret: 'xxx', // 验证key
    appToken: 'xxx', // 验证Token
    msgSecret: false, //消息体是否加密 
    encodingAESKey: 'xxx' // 加密消息签名
});

router.use((req,res,next) =>{
    wechat.handler(req,res); // handler request
});

wechat.subscribe((msg,done) => {
    // deal 
    done({
        MsgType: "text",
        Content: "Welcome !"
    });
},true);

module.exports = router;
```