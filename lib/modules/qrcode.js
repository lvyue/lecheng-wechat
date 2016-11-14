/**
 * Created by lvyue on 15/10/27.
 */
var utils = require("../lib/utils.js"),
	config = require("../lib/url-config.js");
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
	this._.getAccessToken(function(err, token) {
		if (err)
			return callback('获取AccessToken失败：',err);
		utils.post(config.qrcode.add.format(token), body, callback);
	});

};
module.exports = QRCode;