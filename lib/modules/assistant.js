/**
 * Created by lvyue on 15/10/26.
 */
var util = require('../lib/utils.js'),
    WechatError = require('../lib/wechat-error.js'),
    config = require('../lib/url-config.js');
String.prototype.format = function() {
    "use strict";
    var args = arguments;
    return this.replace(/\{(\d+)\}/g, function(s, i) {
        return args[i];
    });
};
var Assistant = function(weChat) {
    "use strict";
    if (!(this instanceof Assistant))
        return new Assistant(weChat);
    this._ = weChat;
};
Assistant.prototype.add = function(data, callback) {
    "use strict";
    if ((typeof callback) !== "function") {
        callback = function(err) {
            if (err)
                return console.error(err);
        }
    }
    this._.getAccessToken(function(err, token) {
        if (err)
            return callback(err);
        util.post(config.assistant.add.format(token), data, callback, null); // 发送请求
    });
};
Assistant.prototype.update = function(data, callback) {
    "use strict";
    if ((typeof callback) !== "function") {
        callback = function(err) {
            if (err)
                console.error(err);
        }
    }
    this._.getAccessToken(function(err, token) {
        if (err)
            return callback(err);
        util.post(config.assistant.update.format(token), data, callback, null); // 发送请求
    });
};
Assistant.prototype.send = function(data, callback) {
    "use strict";
    if ((typeof callback) !== "function") {
        callback = function(err) {
            if (err)
                console.error(err);
        }
    }
    this._.getAccessToken(function(err, token) {
        if (err)
            return callback(err);
        util.post(config.assistant.send.format(token), data, function(err, res) {
            if (err)
                return callback(err);
            var _len = 0,
                _buf = [];
            res.on('data', function(chunk) {
                _buf.push(chunk);
                _len += chunk.length;
            });
            res.on('end', function() {
                var buffer = null;
                switch (_buf.length) {
                    case 0:
                        buffer = new Buffer(0);
                        break;
                    case 1:
                        buffer = _buf[0];
                        break;
                    default:
                        buffer = new Buffer(_len);
                        for (var i = 0, pos = 0, l = _buf.length; i < l; i++) {
                            var chunk = _buf[i];
                            chunk.copy(buffer, pos);
                            pos += chunk.length;
                        }
                        break;
                }
                var _result = JSON.parse(buffer.toString());
                if (_result.errcode !== 0)
                    return callback(new WechatError.ApiInvokeError(_result.errcode + ":" + _result.errmsg));
                return callback(null, _result);
            });
        }); // 发送请求
    });
};
module.exports = Assistant;