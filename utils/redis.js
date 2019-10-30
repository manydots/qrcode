var redis = require('redis');
var client = null;

function initRedis() {
	if (!client) {
		client = redis.createClient(6379, '127.0.0.1');
	}
	client.on('error', function(err) {
		console.log(err);
	});
};


function addRedis(key, value, callback) {
	if (!client) {
		initRedis();
	}
	if (client) {
		client.sadd(key, value, redis.print);
		if (callback) {
			callback();
		};
	}
}

function readRedis(key, callback, isShutDown) {
	if (!client) {
		initRedis();
	}
	if (client) {
		client.smembers(key, function(err, members) {
			if (err) {
				throw err
			};
			if (callback) {
				callback(members)
			}
			if (isShutDown) {
				client.quit();
			}
		});
	}
}
//console.log(client)
// addRedis('ip', '127.0.0.1')
// readRedis('ip', function(res) {
// 	console.log(res)
// })

module.exports = {
	addRedis: addRedis,
	readRedis: readRedis
};