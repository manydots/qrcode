const Router = require('koa-router');
const QrCode = require('qr-image');
const Tools = require('../utils/index');
const path = require('path');
const fs = require('fs');


// 所有路由匹配,特殊路由放前
let router = new Router();
router.get('/ts', async ctx => {
	await ctx.render('ts', {
		title: '测试',
		pageType: '',
		img: null
	});
});

router.post('/qrc', async (ctx, next) => {
	console.log('/qrc');
	ctx.body = 'rrr'
})

router.post('/qr', async (ctx, next) => {
	const data = ctx.request.body;
	//console.log(ctx.query);
	//console.log(ctx.res)
	// 二维码尺寸，输入时为了保证精确性，请确保为21的公倍数，否则按四舍五入处理.
	// 如果为空,默认为5,即尺寸为105*105
	var size = Math.round(data.size / 21) || 5;

	// 白色外边距，输入时为了保证精确性，请确保为5的公倍数，否则按四舍五入处理.
	// 如果为空,默认为2,即尺寸为10
	var margin = Math.round(data.margin / 10) || 2;
	if (!Tools.IsURL(data.qrUrl)) {
		ctx.body = Tools.Codes(-1, 'qrcode_created_error', '传入url不规范');
	} else {
		// 如果有type参数,返回base64
		if (data.type) {
			var codeStr = QrCode.imageSync(data.qrUrl, {
				type: 'png',
				size: size,
				margin: margin
			});
			var base64 = 'data:image/jpeg;base64,' + codeStr.toString('base64');
			ctx.type = 'text/html;charset=utf-8';
			ctx.body = Tools.Codes(0, 'qrcode_created_success', base64);

			//如果没有type参数,返回图片
		} else {
			var code = QrCode.image(data.qrUrl, {
				type: 'png',
				size: size,
				margin: margin
			});
			ctx.type = 'image/png;charset=utf-8';
			///qr?text=http://blog.csdn.net/fo11owerconsole.log(code.pipe(ctx.res))
			ctx.body = code;
			//ctx.body = Tools.Codes(0, 'qrcode_created_success', code.pipe(ctx.res));
		}
	}
});


module.exports = router;