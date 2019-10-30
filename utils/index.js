'use strict';

let fs = require('fs-extra');
let globby = require('globby');
let path = require('path');
let redis = require('./redis');
/**
 * @desc  函数防抖---“立即执行版本” 和 “非立即执行版本” 的组合版本
 * @param  fn 需要执行的函数
 * @param  delay 延迟执行时间（毫秒）
 * @param  immediate---true 表立即执行[触发事件后函数不会立即执行，而是在 n 秒后执行，如果在 n 秒内又触发了事件，则会重新计算函数执行时间]，
 *                     false 表非立即执行[触发事件后函数会立即执行，然后 n 秒内不触发事件才能继续执行函数的效果]
 **/
function debounce(fn, delay, immediate) {
    let timer;
    return function() {
        let self = this;
        let args = arguments;
        if (timer) {
            clearTimeout(timer)
        };
        if (immediate) {
            var callNow = !timer;
            timer = setTimeout(() => {
                timer = null;
            }, delay);
            if (callNow) {
                fn.apply(self, args);
            }
        } else {
            timer = setTimeout(function() {
                fn.apply(self, args)
            }, delay);
        }
    }
}

function getClientIp(ctx, proxyType) {
    let req = ctx.req;
    let ip = req.connection.remoteAddress || req.socket.remoteAddress || (req.connection.socket ? req.connection.socket.remoteAddress : null);
    // 如果使用了nginx代理

    if (proxyType === 'nginx') {
        // headers上的信息容易被伪造,但是我不care,自有办法过滤,例如'x-nginx-proxy'和'x-real-ip'我在nginx配置里做了一层拦截把他们设置成了'true'和真实ip,所以不用担心被伪造
        // 如果没用代理的话,我直接通过req.connection.remoteAddress获取到的也是真实ip,所以我不care
        ip = req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || ip;
    }
    const ipArr = ip.split(',');
    // 如果使用了nginx代理,如果没配置'x-real-ip'只配置了'x-forwarded-for'为$proxy_add_x_forwarded_for,如果客户端也设置了'x-forwarded-for'进行伪造ip
    // 则req.headers['x-forwarded-for']的格式为ip1,ip2只有最后一个才是真实的ip
    if (proxyType === 'nginx') {
        ip = ipArr[ipArr.length - 1];
    }
    if (ip.indexOf('::ffff:') !== -1) {
        ip = ip.substring(7);
    }
    
    redis.addRedis('ip',ip);
    redis.readRedis('ip',function(ips){
        console.log(`redis已访问IP:${ips}`);
    })
    return ip;
}

function isLocal() {
    var host = window.location.host;
    return host.indexOf('127.0.0.1') > -1 || host.indexOf('localhost') > -1 || host.indexOf('192.168.1.15') > -1;
}


function IsURL(strUrl) {
    var strRegex = "^((https|http|ftp|rtsp|mms)?://)" +
        "?(([0-9a-z_!~*'().&=+$%-]+: )?[0-9a-z_!~*'().&=+$%-]+@)?" //ftp的user@  
        +
        "(([0-9]{1,3}\.){3}[0-9]{1,3}" // IP形式的URL- 199.194.52.184  
        +
        "|" // 允许IP和DOMAIN（域名） 
        +
        "([0-9a-z_!~*'()-]+\.)*" // 域名- www.  
        +
        "([0-9a-z][0-9a-z-]{0,61})?[0-9a-z]\." // 二级域名  
        +
        "[a-z]{2,6})" // first level domain- .com or .museum  
        +
        "(:[0-9]{1,4})?" // 端口- :80  
        +
        "((/?)|" // a slash isn't required if there is no file name  
        +
        "(/[0-9a-z_!~*'().;?:@&=+$,%#-]+)+/?)$";
    var re = new RegExp(strRegex);
    return re.test(strUrl);
}

function Codes(code, type, str) {
    return {
        code: code,
        msg: str,
        type: type
    }
}

function clickOpen(href, target) {
    var a = document.createElement('a');
    var nodeName = 'GO_ALIPAY_AUTO';
    a.style.display = 'none';
    a.setAttribute('href', href);
    a.setAttribute('target', target || '_blank');
    a.setAttribute('id', nodeName);
    // 防止反复添加
    if (!document.getElementById(nodeName) || document.getElementById(nodeName).length == 0) {
        document.body.appendChild(a);
    }
    a.click();
    if (document.getElementById(nodeName)) {
        document.body.removeChild(document.getElementById(nodeName));
    }
}

const uploadLimit = {
    size: 1024 * 1024 * 5, //1M*50[1024 * 1024 * 50]
    types: [{
        type: 'application/*',
        smallType: ['vnd.ms-excel'] //'octet-stream' 其他类型文件eg:*.war
    }, {
        type: 'image/*',
        smallType: ['jpg', 'jpeg', 'png']
    }, {
        type: 'text/*',
        smallType: ['plain']
    }, {
        type: 'audio/*',
        smallType: ['mp3']
    }]
}

function uploadFilesCheck(type, size) {
    let sizeError = true,
        typeError = true;

    if (type && size && size != '') {
        for (let item of uploadLimit.types) {
            if (type.split('/').shift() == item.type.split('/').shift()) {
                if (item.smallType.indexOf(type.split('/').pop()) > -1) {
                    typeError = false;
                    if (size <= uploadLimit.size) {
                        sizeError = false;
                        break;
                    }
                }
            }

        }
    }
    //console.log(canUpload);
    return {
        sizeError: sizeError,
        typeError: typeError
    };
}

function checkPath(ctx, notNeedDeal) {
    let notNeed = false;
    for (let item of notNeedDeal) {
        if (item.type == 'startsWith') {
            for (let v of item.path.split(',')) {
                if (ctx.url.startsWith(v)) {
                    notNeed = true;
                    break;
                }
            }

        } else if (item.type == 'endsWith') {
            for (let v of item.path.split(',')) {
                if (ctx.url.endsWith(v)) {
                    notNeed = true;
                    break;
                }
            }
        }
    }
    return notNeed;
}

function findSync(startPath, flag) {
    let result = [];
    if (!flag) {
        function finder(paths) {
            let files = fs.readdirSync(paths);
            files.forEach((val, index) => {
                let fPath = path.join(paths, val);
                let stats = fs.statSync(fPath);
                if (stats.isDirectory()) {
                    finder(fPath)
                };
                if (stats.isFile()) {
                    result.push(fPath)
                };
            });

        };
        finder(startPath);
    } else {
        //result = fs.readdirSync(startPath);
        fs.readdirSync(startPath).forEach((val, index) => {
            //console.log(startPath+'\\'+val)
            //console.log(fs.statSync(startPath+'\\'+val))
            result.push({
                ctime: fs.statSync(startPath + '/' + val).ctime,
                filename: val,
                path: startPath + '/' + val
            })
        });
    }

    return result;
};

function formatDate(date, fmt) {
    if (typeof(date) != 'object') {
        return date;
    }
    date = new Date(date);
    if (fmt === undefined) {
        fmt = 'yyyy-MM-dd hh:mm:ss';
    }
    var o = {
        'M+': date.getMonth() + 1, //月份
        'd+': date.getDate(), //日
        'h+': date.getHours(), //小时
        'm+': date.getMinutes(), //分
        's+': date.getSeconds(), //秒
        'q+': Math.floor((date.getMonth() + 3) / 3), //季度
        'S': date.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length))
    };
    for (var k in o) {
        if (new RegExp('(' + k + ')').test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)));
    }
    return fmt;

};

module.exports = {
    debounce: debounce,
    isLocal: isLocal,
    getClientIp: getClientIp,
    IsURL: IsURL,
    Codes: Codes,
    clickOpen: clickOpen,
    uploadFilesCheck: uploadFilesCheck,
    checkPath: checkPath,
    findSync: findSync,
    formatDate: formatDate
};