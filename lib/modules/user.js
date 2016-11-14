/**
 * Created by lvyue on 15/10/26.
 */
var https = require('https'),
	config = require('../lib/url-config.js');
// 获取用户信息
var Users = function(wechat) {
	if (!(this instanceof Users)) {
		return new Users(wechat);
	}
	this._ = wechat;
	this.langs = ['zh_CN', 'zh_TW', 'en'];
};
Users.prototype.info = function(openid, callback, lang) {
	if ((typeof callback) !== 'function') { // 回调函数校验
		callback = function(err, data) {
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
	this._.getAccessToken(function(err, token) {
		if (err) {
			return callback(err);
		}
		// 获取用户信息
		https.get(config.user.info.format(token, openid, lang), function(res) {
			res.on('data', function(d) {
				callback(null, JSON.parse(d.toString("utf-8")));
			}).once('error', function(err) {
				callback(err);
			});
		});
	});
};
module.exports = Users;