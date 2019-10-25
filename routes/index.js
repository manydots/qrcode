const Router = require('koa-router');
const QrCode = require('qr-image');
const Tools = require('../utils/index');
const path = require('path');
const fs = require('fs');

const canVisit = [{
	path: '/',
	pageType: 'qrcode',
	title: '二维码生成',
	source: 'qrcode',
	isCheck: true
}, {
	path: '/qrcode',
	pageType: 'qrcode',
	title: '二维码生成',
	source: 'qrcode',
	isCheck: true
}, {
	path: '/qrGet',
	pageType: 'qrcode',
	title: '二维码生成',
	source: 'qrcode',
	isCheck: true
}, {
	path: '/upload',
	pageType: 'upload',
	title: '文件上传',
	source: 'upload',
	isCheck: true
}];
// 所有路由匹配
let router = new Router();
router.get('*', async ctx => {
	let canLoad = true;
	if (ctx.url.startsWith('/public') || ctx.url.endsWith('.js') || ctx.url.endsWith('.js.map') || ctx.url.endsWith('.ico') || ctx.url.endsWith('.png')) {

	} else {
		console.log('当前访问的路由:', ctx.url)
		for (let item of canVisit) {
			//console.log(item)
			if (ctx.url.startsWith('/qrGet')) {
				console.log(ctx.query.qrUrl);
				if (!ctx.query.qrUrl || ctx.query.qrUrl == '') {
					ctx.body = Tools.Codes(-1, 'qrcode_created_error', '缺少url参数');
					break;
				} else {
					let data = ctx.request.body;
					if (!Tools.IsURL(ctx.query.qrUrl)) {
						ctx.body = Tools.Codes(-1, 'qrcode_created_error', '传入url不规范');
						break;
					} else {
						var size = Math.round(data.size / 21) || 5;
						var margin = Math.round(data.margin / 10) || 2;
						var code = QrCode.image(ctx.query.qrUrl, {
							type: 'png',
							size: size,
							margin: margin
						});
						ctx.type = 'image/png;charset=utf-8';
						//ctx.body = code.pipe(ctx.res);//线上异常
						ctx.body = code;
						break;
					}

				}

			} else {
				if (ctx.url == item.path) {
					await ctx.render(item.pageType, {
						title: item.title,
						pageType: item.source,
						img: null
					});
					canLoad = true;
					break;
				} else {
					canLoad = false;
				}
			}

		}
		if (!canLoad) {
			await ctx.render('error', {
				title: '当前访问的资源不存在:Not Found',
				pageType: 'index'
			});
			console.log("this's sourse * Not Found", canLoad)
		}
	}
});


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



//注：uploadImage是从前端输入框的name属性里获取的
router.post('/uploads', async (ctx, next) => {
	//console.log('/uploads')
	// 上传单个文件
	let file = ctx.request.files.uploadImage;
	if (!file) {
		ctx.body = Tools.Codes(-2, 'files_is_empty', '文件为空');
		return;
	}
	console.log(`文件名:${file.name},文件大小:${parseInt(file.size/1024)}k,文件类型:${file.type}`);
	//console.log(Tools.uploadFilesCheck(file.type, file.size));

	if (Tools.uploadFilesCheck(file.type, file.size).typeError == true) {
		ctx.body = Tools.Codes(-3, 'files_types_error', '文件类型不支持');
		return;
	} else {
		if (Tools.uploadFilesCheck(file.type, file.size).sizeError == true) {
			ctx.body = Tools.Codes(-3, 'files_sizes_error', '文件过大5M以下');
			return;
		}
	};
	console.log(file.path)
	// 创建可读流
	const render = fs.createReadStream(file.path);
	const fileDir = 'public/uploads';
	const ext = file.name.split('.').pop(); // 获取上传文件扩展名
	const filename = 'TestUp';//file.name.split('.').shift()
	let filePath = fileDir +'/'+ filename + '.' + ext;
 				
	if (!fs.existsSync(fileDir)) {
		fs.mkdirSync(fileDir, err => {
			console.log(err)
			console.log('创建失败')
		});
		ctx.body = Tools.Codes(-1, 'upload_error', '上传失败');
		return;
	} else {

		// 创建写入流
		const upStream = fs.createWriteStream(filePath);
		render.pipe(upStream);
		ctx.body = Tools.Codes(0, 'upload_success', '上传成功');
		return
	}


});

module.exports = router;