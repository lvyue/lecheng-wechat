/**
 * Created by lvyue on 15/10/26.
 */
"use strict";
module.exports = {
	token: {
		"access_token": "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid={0}&secret={1}",
		"js_ticket": "https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token={0}&type=jsapi"
	},
	user: {
		"info": "https://api.weixin.qq.com/cgi-bin/user/info?access_token={0}&openid={1}&lang={2}" // 获取用户信息地址
	},
	assistant: {
		"add": "https://api.weixin.qq.com/customservice/kfaccount/add?access_token={0}",
		"update": "https://api.weixin.qq.com/customservice/kfaccount/update?access_token={0}",
		"send": "https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token={0}"
	},
	menu: {
		"add": "https://api.weixin.qq.com/cgi-bin/menu/create?access_token={0}" // 创建菜单
	},
	qrcode: {
		"add": "https://api.weixin.qq.com/cgi-bin/qrcode/create?access_token={0}"
	},
	template: {
		"send": "https://api.weixin.qq.com/cgi-bin/message/template/send?access_token={0}" // 发送模板消息
	},
	media: {
		"download": "http://file.api.weixin.qq.com/cgi-bin/media/get?access_token={0}&media_id={1}"
	}

};