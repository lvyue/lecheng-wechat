const [xml2js, request, _, utils, crypto] = [require('xml2js'), require('request'), require('lodash'), require('./utils'), require('crypto')];
// Wechat url config
const config = require('./url-config.js');

// "menu", "assistant", "user", "qrcode", "template"
const _defaultModules = ["user", "qrcode", "template"];
const _defaultEvents = ["subscribe", "unsubscribe", "scan", "report", "click", "view", "text", "image", "voice", "video", "shortvideo", "location", "link", "error", "all"];
const Wechat = function (options) {
    "use strict";
    if (!(this instanceof Wechat)) {
        return new Wechat(options);
    }
    this.appId = options.appId;
    this.appSecret = options.appSecret;
    this.token = options.appToken;
    this.encodingAESKey = options.encodingAESKey;
    this.appAccount = options.appAccount || options.appId;
    this.redis = options.redis;
    this.useEncrypt = _.isBoolean(options.encrypt) ? options.encrypt : false;
    this.tokenKey = "wechat.access_token:" + this.appId; // token 存储key
    this.jsTicketKey = "wechat.js_ticket:" + this.appId; //js Ticket
    var self = this;
    // 载入module
    (_defaultModules.concat(Array.isArray(options.modules) ? options.modules : [])).sort().filter((item, index, arr) => {
        if (index == 0)
            return true;
        return arr[index - 1] != item;
    }).forEach((clazz) => { //load clazz
        try {
            self[clazz] = require("./modules/" + clazz)(self);
        } catch (err) {// skip
            console.error(`load [$clazz] module error:`, err);
        }
    });
    this.handlers = { all: { invoke: function (msg) { return "" }, hold: false } };
};

Wechat.prototype.decrypt = function (msg, msgType) {
    try {
        let _encodingAESKey = new Buffer(this.encodingAESKey + "=", 'base64'); // 密钥base64解码
        let decipher = crypto.Decipheriv('aes-256-cbc', _encodingAESKey, _encodingAESKey.slice(0, 16)); // 创建aes-256-cbc 解密
        decipher.setAutoPadding(false); // 取消自动填充
        return decipher.update(msg, msgType, 'utf8') + decipher.final('utf8'); // 解密数据
    } catch (err) {
        console.error("数据解密失败", err);
        return msg;
    }
};
Wechat.prototype.htonl = function (n) { // 主机子节序 to 网络子节序
    var buf = new Buffer(4);
    buf[0] = (n & 0xFF000000) >> 24;
    buf[1] = (n & 0x00FF0000) >> 16;
    buf[2] = (n & 0x0000FF00) >> 8;
    buf[3] = (n & 0x000000FF) >> 0;
    return buf;
};
Wechat.prototype.ntohl = function (buf) { // 网络子节序 解析
    if (buf && buf.length) {
        var sourceNumber = 0;
        for (var i = 0; i < 4; i++) {
            sourceNumber <<= 8;
            sourceNumber |= buf[i] & 0xff;
        }
        return sourceNumber;
    } else {
        return 0;
    }
};
Wechat.prototype.padding = function (n) { // 计算padding
    var len = n % 32;
    if (len == 0) {
        len = 32;
    } else {
        len = 32 - len;
    }
    var buf = new Buffer(len);
    for (var i = 0; i < len; i++) {
        buf[i] = len;
    }
    return buf;
};
Wechat.prototype.formatDecryptMsg = function (msg, charset, output) {
    charset = charset || "utf-8";
    output = output || "utf-8";
    var self = this;
    var buf = new Buffer(msg, charset); // string to buf
    var paddingLength = msg.charCodeAt(msg.length - 1); // 获取padding块大小
    var netBuf = buf.slice(16, 20); // 网络子节序
    buf = buf.slice(20, buf.length - paddingLength); // 消息体 ＋  微信ID
    var msgLength = this.ntohl(netBuf); // 通过网络子节序，计算消息长度
    var wechatId = buf.slice(msgLength, buf.length).toString(output); // 获取微信ID
    var msg = buf.slice(0, msgLength).toString(output); // 截取微信消息长度
    return {
        msg: msg,
        length: msgLength,
        wechatId: wechatId
    };
};
Wechat.prototype.encrypt = function (msg) {
    try {
        var self = this,
            msgBuf = new Buffer(msg, "utf-8"), // msg to buffer
            msgBufLength = msgBuf.length, // msg length
            preBuf = self.randomPrefix(16), // 16位随机串
            netBuf = self.htonl(msgBufLength), // 网络子节序
            appBuf = new Buffer(self.appId, "utf-8"), // 微信号ID
            appBufLength = appBuf.length, // 微信号ID 长度
            paddingBuf = self.padding(20 + msgBufLength + appBufLength); // pading 块
        let _encodingAESKey = new Buffer(this.encodingAESKey + "=", 'base64'); // 密钥base64解码
        let cipher = crypto.createCipheriv('aes-256-cbc', _encodingAESKey, _encodingAESKey.slice(0, 16)); // 创建aes-256-cbc 解密
        cipher.setAutoPadding(false); // 取消自动填充
        return cipher.update(Buffer.concat([preBuf, netBuf, msgBuf, appBuf, paddingBuf]), "binary", 'base64') + cipher.final('base64'); // 解密数据
    } catch (err) {
        console.error("数据加密失败", err);
        return msg;
    }
};

Wechat.prototype.randomPrefix = function (n) {
    var _str = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
    var _tmp = [];
    for (var i = 0; i < n; i++) {
        _tmp.push(_str.charAt(Math.floor(Math.random() * _str.length)));
    }
    return new Buffer(_tmp);
};

Wechat.prototype.encryptMsg = function (msg) {
    let msg_encrypt = this.encrypt(new Buffer(this.toXML(msg), "utf-8"));
    let timestamp = Math.floor(Date.now() / 1000);
    let nonce = (Math.random() * 100000).toString(16).replace('\.', '');
    let msg_signature = crypto.createHash('sha1').update([this.appToken, timestamp, nonce, msg_encrypt].sort().join('')).digest('hex');
    return '<xml><Encrypt><![CDATA[' + msg_encrypt + ']]></Encrypt><MsgSignature><![CDATA[' + msg_signature + ']]></MsgSignature><TimeStamp>' + timestamp + '</TimeStamp><Nonce><![CDATA[' + nonce + ']]></Nonce></xml>';
};

Wechat.prototype.handler = function (req, res) {
    "use strict";
    let _query = req.query;
    let _signature = crypto.createHash('sha1').update([this.token, _query.timestamp, _query.nonce].sort().join('')).digest('hex');
    if (_signature != _query.signature) // check error
        return res.status(200).end('');
    var self = this;
    if (req.method.toUpperCase() !== "GET") {
        utils.streamHelper(req, (err, buf) => {
            if (err)
                return self.dealMsg('error', { req: req, res: res, msg: err });
            if (this.useEncrypt) { // encrypt msg
                xml2js.parseString(buf.toString('utf-8'), (err2, xml) => {
                    if (err2)
                        return self.dealMsg('error', { req: req, res: res, msg: err2 });
                    var formatMsg = self.formatDecryptMsg(self.decrypt(xml.xml.Encrypt[0], 'base64'));
                    self.parseData({
                        req: req,
                        res: res,
                        xml: formatMsg.msg // 应用消息
                    });
                    return;
                });
            } else {
                self.parseData({
                    req: req,
                    res: res,
                    xml: buf
                });
            }
            return;
        });
        return;
    } else {
        return res.status(200).end(_query.echostr);
    }
};

Wechat.prototype.parseData = function (data) {
    "use strict";
    var parser = new xml2js.Parser({ explicitArray: false, trim: true });
    // 解析xml
    parser.parseString(data.xml, (err, result) => {
        let msgType = "error";
        if (err) {
            data.msg = err;
        } else {
            data.msg = result.xml;
            msgType = result.xml.MsgType.toLowerCase() === "event" ? (result.xml.Event.toLowerCase() === "location" ? "report" : result.xml.Event.toLowerCase()) : result.xml.MsgType.toLowerCase();
        }
        this.dealMsg(msgType.toLowerCase(), data);
        return;
    });
};

// 处理消息
Wechat.prototype.dealMsg = function (type, data) {
    let self = this;
    let __handler = this.handlers[type] || this.handlers.all;
    if (!_.isObject(__handler) || !_.isFunction(__handler.invoke))
        __handler = { invoke: function () { return ""; }, hold: false };
    if (__handler.hold) { // keep weeting
        __handler.invoke(data.msg, (msg) => {
            console.log("done msg ==>",JSON.stringify(msg));
            if (_.isPlainObject(msg))
                return self.send(data.req, data.res, _.extend({
                    ToUserName: data.msg.FromUserName,
                    FromUserName: data.msg.ToUserName
                }, msg));
            console.log("done msg ==> empty");                
            return self.send(data.req, data.res, "");
        });
    } else {
        self.send(data.req, data.res, "");
        __handler.invoke(data.msg); // 处理消息
    }
};

//将 js 组装成 xml
Wechat.prototype.toXML = function (data) {
    //自动检测 MsgType
    let _pkg = _.clone(data);
    _pkg.CreateTime = Math.floor(Date.now() / 1000);
    let _xml = new xml2js.Builder({ "rootName": "xml" }).buildObject(_pkg);
    return _xml;
};
Wechat.prototype.send = function (req, res, msg) {
    if (msg == "") {
        res.status(200).send(msg);
    } else {
        if (this.useEncrypt) {
            msg = this.encryptMsg(msg);
        } else {
            msg = this.toXML(msg);
        }
        res.type("xml").status(200).send(msg);
    }
};
// 自动刷新Token并存储到指定位置
Wechat.prototype._flushToken = function (callback) {
    if (!_.isFunction(callback))
        callback = dprint;
    request(config.token.access_token.format(this.appId, this.appSecret), (err, res) => {
        var _data = JSON.parse(res.body);
        if (_data && _data.access_token) {
            callback(_data.access_token);
        } else {
            callback(err);
        }
    });
};
// 自动刷新Token并存储到指定位置
Wechat.prototype._flushTicket = function (callback) {
    if (!_.isFunction(callback))
        callback = dprint;
    this.getToken((err, accessToken) => {
        if (err) return callback(err);
        request(config.token.js_ticket.format(accessToken), (err, res) => {
            if (err) return callback(err);
            var _data = JSON.parse(res.body);
            if (_data && _data.ticket) {
                callback(_data.ticket);
            }
        });
    });
};

Wechat.prototype.getToken = function (cb) {
    if (!_.isFunction(cb))
        cb = dprint;
    var self = this;
    self.redis.incrby(self.tokenKey + ":flush", 2, (err, flush) => {
        if (err)
            return cb(err);
        if (flush == 2) { // 获得刷新权，刷新token
            self.redis.del(self.tokenKey + ":token", dprint); // 删除已过期token
            self._flushToken((token) => {
                self.redis.multi()
                    .set(self.tokenKey + ":token", token) // 设置access token
                    .set(self.tokenKey + ":flush", 1) // 设置key 为 1
                    .expire(self.tokenKey + ":flush", 7000) // 设置key 过期时间为7000s
                    .exec(dprint);
                cb(null, token);
            });
        } else if (flush % 2 == 1) { // token 有效，直接获取
            self.redis.get(self.tokenKey + ":token", (err, token) => {
                if (err) {
                    return cb(err);
                }
                if (token) {
                    return cb(null, token); // access token 存在返回token
                }
                cb(new Error("获取access token失败"));
            });
        } else if (flush != 2 && flush % 2 == 0) { // 当前正在刷新数据，等待刷新
            setTimeout(() => { // 200ms 后再获取access token
                self.getToken(cb);
            }, 100);
        }
    });
};
Wechat.prototype.getTicket = function (cb) {
    if (!_.isFunction(cb))
        cb = dprint;
    var self = this;
    self.redis.incrby(self.jsTicketKey + ":flush", 2, (err, flush) => {
        if (err)
            return cb(err);
        if (flush == 2) { // 获得刷新权，刷新token
            self.redis.del(self.jsTicketKey + ":token", dprint); // 删除已过期token
            self._flushTicket((token) => {
                self.redis.multi()
                    .set(self.jsTicketKey + ":token", token) // 设置access token
                    .set(self.jsTicketKey + ":flush", 1) // 设置key 为 1
                    .expire(self.jsTicketKey + ":flush", 7000) // 设置key 过期时间为7000s
                    .exec(dprint);
                cb(null, token);
            });
        } else if (flush % 2 == 1) { // token 有效，直接获取
            self.redis.get(self.jsTicketKey + ":token", (err, token) => {
                if (err) {
                    return cb(err);
                }
                if (token) {
                    return cb(null, token); // access token 存在返回token
                }
                cb(new Error("获取JS ticket失败"));
            });
        } else if (flush != 2 && flush % 2 == 0) { // 当前正在刷新数据，等待刷新
            setTimeout(() => { // 200ms 后再获取access token
                self.getTicket(cb);
            }, 100);
        }
    });
};

// 处理事件保存
_defaultEvents.forEach((event) => {
    Wechat.prototype[event] = function (func, hold) {
        this.handlers[event] = { invoke: func, hold: _.isBoolean(hold) ? hold : true };
        return this;
    };
});
var dprint = function (err) {
    if (err) {
        return console.error(err);
    }
};


module.exports = Wechat;