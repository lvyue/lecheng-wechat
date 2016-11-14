const [sha1, emitter, xml2js, request, _, utils] = [require('sha1'), new (require('events')).EventEmitter(), require('xml2js'), require('request'), require('lodash'), require('./utils')];
// Wechat url config
const config = require('./url-config.js');

// "menu", "assistant", "user", "qrcode", "template"
var _defaultModules = ["user", "qrcode", "template"];

var Wechat = function (options) {
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
    this.key = "wechat.access_token:" + this.appId; // token 存储key
    this.jsTicketKey = "wechat.js_ticket:" + this.appId; //js Ticket
    var self = this;
    // 载入module
    (_defaultModules.concat(Array.isArray(options.modules) ? options.modules : [])).sort().filter((item, index, arr) => {
        if (index == 0)
            return true;
        return arr[index - 1] != item;
    }).forEach((module) => { //load module
        try {
            self.register(module, require("./modules/" + module));
        } catch (err) {
            // skip
            console.error(`load [$module] module error:`, err);
        }
    });
};

Wechat.prototype.handler = function (req, res) {
    "use strict";
    if (req.method.toUpperCase() !== "GET") {
        utils.streamHelper(req, (err, buf) => {
            if (err) {
                emitter.emit("error", err);
                return;
            }
            this.parseData({
                req: req,
                res: res,
                xml: buf
            });
            return;
        });
        return;
    } else {
        var _params = req.query,
            signature = _params.signature,
            timestamp = _params.timestamp,
            nonce = _params.nonce,
            echostr = _params.echostr;
        var _signature = sha1([this.token, timestamp, nonce].sort().join(''));
        return res.status(200).end((_signature === signature) ? echostr : '');
    }
};
Wechat.prototype.parseData = function (data) {
    "use strict";
    var parser = new xml2js.Parser({ explicitArray: false, trim: true });
    // 解析xml
    parser.parseString(data.xml, (err, result) => {
        if (err)
            return emitter.emit("error", err);
        data.msg = result.xml;
        return emitter.emit(result.xml.MsgType, data);
    });
};
Wechat.prototype.on = function (type, callback) {
    emitter.on(type, callback);
    return this;
};
//监听所有信息
Wechat.prototype.all = function (callback) {
    emitter.on("text", callback);
    emitter.on("image", callback);
    emitter.on("location", callback);
    emitter.on("link", callback);
    emitter.on("event", callback);
    emitter.on("voice", callback);
    emitter.on("video", callback);
    emitter.on("error", callback);
    return this;
};


//将 js 组装成 xml
Wechat.prototype.toXML = function (data) {
    //自动检测 MsgType
    var _pkg = _.clone(data);
    _pkg.CreateTime = Date.now() / 100;
    var _xml = new xml2js.Builder({ "rootName": "xml" }).buildObject(_pkg);
    return _xml;
};
Wechat.prototype.send = function (req, res, msg) {
    if (msg == "") {
        res.status(200).send(msg);
    } else {
        res.type("xml").status(200).send(this.toXML(msg));
    }
};
// 自动刷新Token并存储到指定位置
Wechat.prototype._flushToken = function (callback) {
    if ((typeof callback) !== "function") {
        callback = dprint;
    }
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
    if ((typeof callback) !== "function")
        callback = dprint;
    this.getToken((err, accessToken) => {
        if (err) return callback(err);
        request(config.token.js_ticket.format(accessToken),  (err, res) =>{
            if (err) return callback(err);
            var _data = JSON.parse(res.body);
            if (_data && _data.ticket) {
                callback(_data.ticket);
            }
        });
    });
};

Wechat.prototype.getToken = function (cb) {
    if ((typeof cb) !== "function") {
        cb = dprint;
    }
    var self = this;
    self.redis.incrby(self.key + ":flush", 2, function (err, flush) {
        if (err) {
            return cb(err);
        }
        if (flush == 2) { // 获得刷新权，刷新token
            self.redis.del(self.key + ":token", dprint); // 删除已过期token
            self._flushToken(function (token) {
                self.redis.multi()
                    .set(self.key + ":token", token) // 设置access token
                    .set(self.key + ":flush", 1) // 设置key 为 1
                    .expire(self.key + ":flush", 7000) // 设置key 过期时间为7000s
                    .exec(dprint);
                cb(null, token);
            });
        } else if (flush % 2 == 1) { // token 有效，直接获取
            self.redis.get(self.key + ":token", function (err, token) {
                if (err) {
                    return cb(err);
                }
                if (token) {
                    return cb(null, token); // access token 存在返回token
                }
                cb(new Error("获取access token失败"));
            });
        } else if (flush != 2 && flush % 2 == 0) { // 当前正在刷新数据，等待刷新
            setTimeout(function () { // 200ms 后再获取access token
                self.getToken(cb);
            }, 100);
        }
    });
};
Wechat.prototype.getTicket = function (cb) {
    if ((typeof cb) !== "function") {
        cb = dprint;
    }
    var self = this;
    self.redis.incrby(self.jsTicketKey + ":flush", 2, function (err, flush) {
        if (err) {
            return cb(err);
        }
        if (flush == 2) { // 获得刷新权，刷新token
            self.redis.del(self.jsTicketKey + ":token", dprint); // 删除已过期token
            self._flushTicket(function (token) {
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

Wechat.prototype.register = function (prop, clazz) {
    this[prop] = clazz(this);
};
var dprint = function (err) {
    if (err) {
        return console.error(err);
    }
};

module.exports = Wechat;