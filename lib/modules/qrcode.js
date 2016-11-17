/**
 * Created by lvyue on 15/10/27.
 */
var utils = require("../utils.js"),
	config = require("../url-config.js");
var QRCode = function(weChat) {
	"use strict";
	if (!(this instanceof QRCode)) {
		return new QRCode(weChat);
	}
	this._ = weChat;
	this._type = ["QR_SCENE", "QR_LIMIT_SCENE"];
};
QRCode.prototype.add = function(type, expire, data, callback) {
	"use strict";
	if (this._type.indexOf(type) < 0) {
		type = this._type[0];
	}
	if ((typeof expire) !== "number") {
		expire = 2592000;
	}
	if (expire <= 0 || expire > 2592000) {
		expire = 2592000;
	}
	if ((typeof callback) !== 'function') {
		callback = function(err) {};
	}
	var body = {
		"expire_seconds": expire,
		"action_name": type,
		"action_info": data
	};
	if (type == this._type[1]) {
		delete body.expire_seconds;
	}
	this._.getToken(function(err, token) {
		if (err)
			return callback('获取AccessToken失败：',err);
		utils.post(config.qrcode.add.format(token), body, (err, buf)=> {
            if (err)
                return callback(err);
            var _result = JSON.parse(buf.toString());
            if (_result.errcode !== 0)
                return callback(new WechatError.ApiInvokeError(_result.errcode + ":" + _result.errmsg));
            return callback(null, _result);
        });
	});

};
module.exports = QRCode;