/**
 * Created by lvyue on 15/10/26.
 */
var util = require('../lib/utils.js'),
	config = require('../lib/url-config.js'),
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
	this._.getAccessToken(function(err, token) {
		if (err)
			return callback(err);
		http.get(config.media.download.format(token, mediaId), function(res) {
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