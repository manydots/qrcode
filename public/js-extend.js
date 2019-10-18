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