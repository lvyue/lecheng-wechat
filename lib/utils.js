/**
 * Created by lvyue on 15/10/29.
 */
/**
 * Created by lvyue on 15/10/26.
 */
const [https, url] = [require("https"), require("url")];

var streamHelper = function (stream, callback) {
    "use strict";
    if (typeof callback !== "function")
        callback = function (err) {
            if (err) return console.error("请求%s：", path, err);
        };
    let [bufs, len] = [[], 0];
    stream.on('data', function (chunk) {
        bufs.push(chunk);
        len += chunk.length;
    });
    stream.on('end', function () {
        let buf = null;
        switch (bufs.length) {
            case 0:
                buf = new Buffer(0);
                break;
            case 1:
                buf = bufs[0];
                break;
            default:
                buf = new Buffer(len);
                for (let i = 0, pos = 0, l = bufs.length; i < l; i++) {
                    let chunk = bufs[i];
                    chunk.copy(buf, pos);
                    pos += chunk.length;
                }
                break;
        }
        callback(null, buf);
        return;
    });
    stream.on('error', callback);
};
var post = function (path, data, callback) {
    "use strict";
    if (typeof callback !== "function") {
        callback = function (err) {
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
    let req = https.request(options, function (res) {
        streamHelper(res, callback);
    });
    req.on('error', function (err) {
        if (err)
            callback(err);
    });
    req.write(msg + '\n');
    req.end();
};

module.exports = { streamHelper, post };