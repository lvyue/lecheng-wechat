/**
 * Created by lvyue on 15/10/26.
 */
var https = require('https'),
	util = require('../utils'),
	config = require('../url-config.js');
// 获取用户信息
var Users = function (wechat) {
	if (!(this instanceof Users)) {
		return new Users(wechat);
	}
	this._ = wechat;
	this.langs = ['zh_CN', 'zh_TW', 'en'];
};
Users.prototype.info = function (openid, callback, lang) {
	if ((typeof callback) !== 'function') { // 回调函数校验
		callback = function (err, data) {
			if (err) {
				return console.error(error);
			}
			console.log(data);
		};
	}
	if ((typeof openid) !== 'string') { // openid检查
		callback(new Error('openid error'));
	}
	if ((typeof lang) !== 'string' || this.langs.indexOf(lang) === -1) { // 语言检查
		lang = this.langs[0];
	}
	this._.getToken(function (err, token) {
		if (err) {
			return callback(err);
		}
		// 获取用户信息
		https.get(config.user.info.format(token, openid, lang), function (res) {
			util.streamHelper(res, (err, buf) => {
				if (err)
					return callback(err);
				var _result = JSON.parse(buf.toString());
				if (_result.errcode !== 0)
					return callback(new WechatError.ApiInvokeError(_result.errcode + ":" + _result.errmsg));
				return callback(null, _result);
			});
		});
	});
};
module.exports = Users;