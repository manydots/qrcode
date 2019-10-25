var Koa = require('koa');
var app = new Koa();
const bodyparser = require('koa-bodyparser');
const path = require('path');
const views = require('koa-views');
const static = require('koa-static');
const koaBody = require('koa-body');
const router = require('./routes/index');
var serverName = process.env.NAME || 'Unknown';
var port = process.env.port || 3031;
var url = `http://127.0.0.1:${port}`;

app.use(bodyparser({
	enableTypes: ['json', 'form', 'text']
}));
app.use(static(__dirname, './public'));

// 加载模板引擎,文件会自动拼接此后缀
app.use(views(path.join(__dirname, './views'), {
	extension: 'ejs'
}));

app.use(koaBody({
	multipart: true,
	formidable: {
		maxFieldsSize: 100 * 1024 * 1024,
		multipart: true
	}
}))

// 加载路由中间件
app.use(router.routes());
// 监听端口
app.listen(port, () => {
	console.log('Server listening at port %d', port);
	console.log('Visit http://127.0.0.1:%d', port);
	console.log('Hello, I\'m %s, how can I help?', serverName);
});