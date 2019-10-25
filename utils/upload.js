const multer = require('koa-multer');
//配置    
let storage = multer.diskStorage({
	//文件保存路径
	destination: function(req, file, cb) {
		cb(null, 'public/uploads/') //注意路径必须存在
	},
	//修改文件名称
	filename: function(req, file, cb) {
		let fileFormat = (file.originalname).split(".");
		cb(null, Date.now() + "." + fileFormat[fileFormat.length - 1]);
	}
})
const limits = {
    fields: 10,//非文件字段的数量
    fileSize: 1 * 1024,//文件大小 单位 b
    files: 1//文件数量
}
//加载配置
let upload = multer({
	storage: storage,
	limits:limits
});
module.exports = {
	upload: upload
};