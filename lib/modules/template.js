/**
 * Created by lvyue on 15/10/26.
 */
var util = require('../lib/utils.js'),
	config = require('../lib/url-config.js');
String.prototype.format = function() {
	"use strict";
	var args = arguments;
	return this.replace(/\{(\d+)\}/g, function(s, i) {
		return args[i];
	});
};
var Template = function(weChat) {
	"use strict";
	if (!(this instanceof Template)) {
		return new Template(weChat);
	}
	this._ = weChat;
};
Template.prototype.send = function(data, callback) {
	"use strict";
	if ((typeof callback) !== "function") {
		callback = function(err) {
			if (err) {
				return console.error(err);
			}
		}
	}
	this._.getAccessToken(function(err, token) {
		if (err) {
			return callback(err);
		}
		util.post(config.template.send.format(token), data, callback); // 发送请求
	});
};
module.exports = Template;