/**
 * Created by lvyue on 15/10/26.
 */
var util = require('../utils.js'),
    WechatError = require('../error.js'),
    config = require('../url-config.js');
String.prototype.format = function () {
    "use strict";
    var args = arguments;
    return this.replace(/\{(\d+)\}/g, function (s, i) {
        return args[i];
    });
};
var Assistant = function (weChat) {
    "use strict";
    if (!(this instanceof Assistant))
        return new Assistant(weChat);
    this._ = weChat;
};
Assistant.prototype.add = function (data, callback) {
    "use strict";
    if ((typeof callback) !== "function") {
        callback = function (err) {
            if (err)
                return console.error(err);
        }
    }
    this._.getToken(function (err, token) {
        if (err)
            return callback(err);
        util.post(config.assistant.add.format(token), data, callback); // 发送请求
    });
};
Assistant.prototype.update = function (data, callback) {
    "use strict";
    if ((typeof callback) !== "function") {
        callback = function (err) {
            if (err)
                console.error(err);
        }
    }
    this._.getToken(function (err, token) {
        if (err)
            return callback(err);
        util.post(config.assistant.update.format(token), data, callback); // 发送请求
    });
};
Assistant.prototype.send = function (data, callback) {
    "use strict";
    if ((typeof callback) !== "function") {
        callback = function (err) {
            if (err)
                console.error(err);
        }
    }
    this._.getToken(function (err, token) {
        if (err)
            return callback(err);
        util.post(config.assistant.send.format(token), data, (err, buf)=> {
            if (err)
                return callback(err);
            var _result = JSON.parse(buffer.toString());
            if (_result.errcode !== 0)
                return callback(new WechatError.ApiInvokeError(_result.errcode + ":" + _result.errmsg));
            return callback(null, _result);
        }); // 发送请求
    });
};
module.exports = Assistant;