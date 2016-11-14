/**
 * Created by lvyue on 15/10/29.
 */
/**
 * Created by lvyue on 15/10/26.
 */
var https = require("https"),
    url = require("url");
module.exports = {
    post: function(path, data, callback) {
        "use strict";
        if (typeof callback !== "function") {
            callback = function(err) {
                if (err) return console.error("请求%s：", path, err);
            };
        }
        var options = url.parse(path);
        var msg = new Buffer(JSON.stringify(data)); // 参数解析
        options.method = "POST"
        options.port = 443;
        options.headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            "Content-Length": msg.length
        };
        var req = https.request(options, function(res) {
            callback(null, res);
        });
        req.on('error', function(err) {
            if (err)
                callback(err);
        });
        req.write(msg + '\n');
        req.end();
    }
};