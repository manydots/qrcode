const Router = require('koa-router');
const QrCode = require('qr-image');
const send = require('koa-send');
const Tools = require('../utils/index');
const path = require('path');
const fs = require('fs');

const canVisit = [{
	path: '/',
	pageType: 'qrcode',
	title: '二维码生成',
	source: 'qrcode',
	isCheck: true,
	method:'get'
}, {
	path: '/qrcode',
	pageType: 'qrcode',
	title: '二维码生成',
	source: 'qrcode',
	isCheck: true,
	method:'get'
}, {
	path: '/qrGet',
	pageType: 'qrcode',
	title: '二维码生成',
	source: 'qrcode',
	isCheck: true,
	method:'get'
}, {
	path: '/upload',
	pageType: 'upload',
	title: '文件上传',
	source: 'upload',
	isCheck: true,
	method:'get'
}, {
	path: '/download',
	pageType: 'download',
	title: '下载文件',
	source: 'download',
	isCheck: true,
	method:'get'
}, {
	path: '/ts',
	pageType: 'ts',
	title: '测试页面',
	source: 'ts',
	isCheck: true,
	method:'get'
}];

const notNeedDeal = [{
	path: '/public,/test',
	type: 'startsWith'
}, {
	path: '.js,.js.map,.ico,.ico,.png',
	type: 'endsWith'
}]

//相邻目录下
const sourcePath = path.resolve(__dirname, '../public/uploads');
//console.log(path.basename(Tools.findSync(nl)[0]))

// 所有路由匹配,特殊路由放前
let router = new Router();
router.get('/download/:name', async (ctx) => {
	let ip = Tools.getClientIp(ctx, 'nginx');
	const name = ctx.params.name;
	console.log(`下载文件：${name}`);
	const path = `public/uploads/${name}`;
	//{ root: __dirname + '/public' }
	//console.log(ctx.path)
	ctx.attachment(path);
	await send(ctx, path);
})

router.get('*', async ctx => {
	let canLoad = true;
	console.log('上一次访问referer:',ctx.headers.referer);
	//拒绝无user-agent请求，初步判定为爬虫
	if(ctx.headers['user-agent'] && ctx.headers['user-agent'] !=''){
		console.log('当前访问user-agent:',ctx.headers['user-agent']);
		//console.log(ctx.headers)
	}else{

		ctx.body = Tools.Codes(-3, 'code_visit_error', '异常访问');
		return;
	}
	if (!Tools.checkPath(ctx, notNeedDeal)) {
		//需要处理的路由
		for (let item of canVisit) {
			if (ctx.url.startsWith('/qrGet') && item.isCheck == true) {
				//console.log(ctx.query.qrUrl);
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

			} else if (ctx.url.startsWith('/download') && item.isCheck == true) {
				//const allFiles = fs.readdirSync(sourcePath);
				const allFiles = Tools.findSync(sourcePath, true);
				//var stat = fs.statSync(sourcePath);

				//传递fmt函数到ejs模板
				await ctx.render('download', {
					title: '文件下载',
					pageType: 'download',
					files: allFiles,
					fmt: Tools.formatDate
				});
				break;
			} else {
				if (ctx.url == item.path && item.isCheck == true) {
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

		let ip = Tools.getClientIp(ctx, 'nginx');
		if (!canLoad) {
			await ctx.render('error', {
				title: '当前访问的资源不存在:Not Found',
				pageType: 'index'
			});
			console.log("this's sourse * Not Found ", ctx.url)
		} else {
			console.log('当前访问的路由:', ctx.url);
		}

	}
});

router.post('/qrt', async (ctx, next) => {
	console.log('qrt')
	ctx.body = 'test'
});
router.post('/qr', async (ctx, next) => {
	let ip = Tools.getClientIp(ctx, 'nginx');
	const data = ctx.request.body;
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
	//console.log(ctx.request)
	let ip = Tools.getClientIp(ctx, 'nginx');
	try {
		// 上传单个文件
		if (!ctx.request.files || !ctx.request.files.uploadImage) {
			ctx.body = Tools.Codes(-2, 'files_is_empty', '文件为空');
			return;
		}
		let file = ctx.request.files.uploadImage;
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
		//const fileDir = 'public/uploads';
		const ext = file.name.split('.').pop(); // 获取上传文件扩展名
		const filename = 'TestUp'; //file.name.split('.').shift()
		let filePath = sourcePath + '/' + filename + '.' + ext;
		console.log(sourcePath, filePath)
		if (!fs.existsSync(sourcePath)) {
			fs.mkdirSync(sourcePath, err => {

				if (err) {
					console.log('创建失败')
					ctx.body = Tools.Codes(-1, 'upload_error', '上传失败');
					return
				}
			});

			let upStream = fs.createWriteStream(filePath);
			render.pipe(upStream);
			ctx.body = Tools.Codes(0, 'upload_success', '上传成功');

			return;
		} else {

			// 创建写入流
			let upStream = fs.createWriteStream(filePath);
			render.pipe(upStream);
			ctx.body = Tools.Codes(0, 'upload_success', '上传成功');
			return
		}
	} catch (err) {
		console.log(err)
	}

});

module.exports = router;