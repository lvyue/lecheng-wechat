var util = require('util');

var AbstractError = function(msg, constr) {
    Error.captureStackTrace(this, constr || this)
    this.message = msg || 'Error'
}
util.inherits(AbstractError, Error)
AbstractError.prototype.name = 'Abstract Error'

var ApiInvokeError = function(msg) {
    ApiInvokeError.super_.call(this, msg, this.constructor)
}
util.inherits(ApiInvokeError, AbstractError)
ApiInvokeError.prototype.name = 'Assistant Error'
// module.exports = {};
module.exports.ApiInvokeError = ApiInvokeError;