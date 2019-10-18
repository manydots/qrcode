let http = require('http');
let qs = require('querystring');
const config = require('./config.json');

function pjax(option) {

    var params = {
        username: option.username,
        password: option.password,
        email: option.email,
        time: new Date().getTime()
    };

    var options = {
        hostname: config.tokenHttp,
        path: `/${config.tokenProject}/${option.cmd}?` + qs.stringify(params),
        method: 'POST',
        port: 80
    };
    //console.log(options)
    return new Promise(function(resolve, reject) {
        http.request(options, (res) => {
            var content = '';
            res.setEncoding('utf-8');
            //res.setHeader('Access-Control-Allow-Origin', '*');
            res.on('data', (chunk) => {
                content += chunk;
            });
            res.on('end', () => {
                if (!option.cmd || option.cmd == '') {
                    resolve({
                        "code": -8,
                        "msg": "调用方法为空"
                    });
                } else {
                    if (typeof content === 'string') {
                        resolve(JSON.parse(content));
                    } else {
                        resolve(content);
                    }

                }

            })
        }).end();
    });

}

module.exports = {
    pjax: pjax
};