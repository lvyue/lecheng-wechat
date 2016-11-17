/**
 * Created by lvyue on 15/10/26.
 */
var util = require('../utils.js'),
	config = require('../url-config.js'),
	http = require('http');
var Media = function(weChat) {
	"use strict";
	if (!(this instanceof Media))
		return new Media(weChat);
	this._ = weChat;
};
Media.prototype.download = function(mediaId, callback) {
	"use strict";
	if ((typeof callback) !== "function") {
		callback = function(err) {
			if (err)
				console.error(err);
		};
	}
	this._.getToken(function(err, token) {
		if (err)
			return callback(err);
		http.get(config.media.download.format(token, mediaId), function(res) {
			util.streamHelper(res,(err1,buf)=>{
				if (err1)
					return callback(err1);
				callback(null, {
					type: res.headers["content-type"],
					data: buffer
				});
			});
		}).on('error', function(err2) {
			callback(err2);
		}); // 发送请求
	});
};
module.exports = Media;