//添加数组IndexOf方法

if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function(elt /*, from*/ ) {
    var len = this.length >>> 0;

    var from = Number(arguments[1]) || 0;
    from = (from < 0) ?
      Math.ceil(from) :
      Math.floor(from);
    if (from < 0)
      from += len;

    for (; from < len; from++) {
      if (from in this && this[from] === elt)
        return from;
    }
    return -1;
  };
}


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

function isLocal() {
  var host = window.location.host;
  return host.indexOf('127.0.0.1') > -1 || host.indexOf('localhost') > -1 || host.indexOf('192.168.1.15') > -1;
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

function getColor() {
  var str = "#";
  //定义一个十六进制的数组
  var arr = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];
  for (var i = 0; i < 6; i++) {
    var num = parseInt(Math.random() * 16);
    str += arr[num];
  }
  return str;
}

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
}