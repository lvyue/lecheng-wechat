/**
 * Created by lvyue on 15/10/26.
 */
var util = require('../lib/utils.js'),
	config = require('../lib/url-config.js');
var Menu = function(weChat) {
	"use strict";
	if (!(this instanceof Menu))
		return new Menu(weChat);
	this._ = weChat;
};
Menu.prototype.add = function(data, callback) {
	"use strict";
	if ((typeof callback) !== "function") {
		callback = function(err) {
			if (err)
				return console.error(err);
		};
	}
	this._.getAccessToken(function(err, token) {
		if (err)
			return callback(err);
		util.post(config.menu.add.format(token), data, callback); // 发送请求
	});
};
module.exports = Menu;