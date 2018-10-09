var content = $context.safari ? $context.safari.items.location.href : $context.link || $clipboard.text
if (content != "") {
  var weico_link = content.match(/https?:\/\/.*?weico\.cc[^\s]+?weibo_id=(\d+)/i);
  var weibo_link = content.match(/https?:\/\/(m\.weibo\.cn|weibo\.com)\/[^\/]+?\/(\w+)/i);
  var urlTest = /sinaimg.cn/.test(content);
  if (weico_link) {
    var url = weico_link[0];
    var id = weico_link[1];
    var link = "https://m.weibo.cn/status/" + id;
    $ui.alert({
      title: "Copy or Open it?",
      message: content.replace(url, link),
      actions: [{
          title: "Safari",
          style: "cancel",
          handler: function() {
            $app.openURL(link)
          }
        },
        {
          title: "Copy",
          handler: function() {
            $clipboard.set({
              "type": "public.plain-text",
              "value": link
            })
            $ui.toast("Copied Success!")
          }
        }
      ]
    })
  } else if (weibo_link) {
    var id = weibo_link[2];
    if (/\/u\/|\/profile\//.test(content)) {
      $http.get({
        url: "https://m.weibo.cn/api/container/getIndex?type=uid&value=" + id,
        handler: function(resp) {
          var data = resp.data.data.userInfo
          var urlWeico = "weibointernational://search?keyword=" + encodeURI(data.screen_name)
          $app.openURL(urlWeico)
        }
      })
    } else {
      if (!/^\d+$/.test(id)) {
        id = mid2id(id);
      }
      var link = "weibointernational://detail?weiboid=" + id;
      $app.openURL(link)
    }
  } else if (urlTest == false) {
    $ui.toast("Not Weico OR Weibo (Picture) URL!")
    $app.close()
  } else {
    var link = main(content);
    $ui.alert({
      title: "Copy or Open it?",
      message: "Original User URL is " + content.replace(content, link),
      actions: [{
          title: "Weico",
          style: "Cancel",
          handler: function() {
            uid = findUid(content)
            $http.get({
              url: "https://m.weibo.cn/api/container/getIndex?type=uid&value=" + uid,
              handler: function(resp) {
                var data = resp.data.data.userInfo
                var urlWeico = "weibointernational://search?keyword=" + encodeURI(data.screen_name)
                $app.openURL(urlWeico)
              }
            })
          }
        },
        {
          title: "Copy",
          handler: function() {
            $clipboard.text = main(content)
            $ui.toast("Copied Success!")
          }
        }
      ]
    })
  }
} else {
  $ui.toast("Nothing in Clipboard!")
}
//62进制字典
var str62keys = [
  "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
  "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"
];
/** 
 * 62进制值转换为10进制 
 * @param {String} str62 62进制值 
 * @return {String} 10进制值 
 */
function str62to10(str62) {
  var i10 = 0;
  for (var i = 0; i < str62.length; i++) {
    var n = str62.length - i - 1;
    var s = str62[i];
    i10 += str62keys.indexOf(s) * Math.pow(62, n);
  }
  return i10;
};
/** 
 * 10进制值转换为62进制 
 * @param {String} int10 10进制值 
 * @return {String} 62进制值 
 */
function int10to62(int10) {
  var s62 = '';
  var r = 0;
  while (int10 != 0) {
    r = int10 % 62;
    s62 = str62keys[r] + s62;
    int10 = Math.floor(int10 / 62);
  }
  return s62;
};
/** 
 * mid字符转换为id 
 * @param {String} mid 微博URL字符，如 "wr4mOFqpbO" 
 * @return {String} 微博id，如 "201110410216293360" 
 */
function mid2id(mid) {
  var id = '';
 
  for (var i = mid.length - 4; i > -4; i = i - 4) //从最后往前以4字节为一组读取URL字符  
  {
    var offset1 = i < 0 ? 0 : i;
    var offset2 = i + 4;
    var str = mid.substring(offset1, offset2);
 
    str = str62to10(str).toString();
    if (offset1 > 0) //若不是第一组，则不足7位补0  
    {
      while (str.length < 7) {
        str = '0' + str;
      }
    }
    id = str + id;
  }
  return id;
};
/** 
 * id转换为mid字符 
 * @param {String} id 微博id，如 "201110410216293360" 
 * @return {String} 微博mid字符，如 "wr4mOFqpbO" 
 */
function id2mid(id) {
  var mid = '';
 
  for (var i = id.length - 7; i > -7; i = i - 7) //从最后往前以7字节为一组读取id  
  {
    var offset1 = i < 0 ? 0 : i;
    var offset2 = i + 7;
    var num = id.substring(offset1, offset2);
 
    num = int10to62(num);
    mid = num + mid;
  }
  return mid;
};
 
//微博图片反查
function decodeBase62(number) {
  var alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  var out = 0
  var len = number.length - 1
  for (var t = 0; t <= len; t++) {
    out = out + alphabet.indexOf(number.substr(t, 1)) * Math.pow(62, len - t)
  }
  return out
}
 
function decode16Unit(number) {
  return parseInt(number, 16)
}
 
function decode(number) {
  if (number.startsWith('00')) {
    return decodeBase62(number)
  } else {
    return decode16Unit(number)
  }
}
 
function findNumber(url) {
  var lastIndexOfSlash = url.lastIndexOf('/')
  var number = url.substr(lastIndexOfSlash + 1, 8)
  return number
}
 
function findUid(url) {
  var number = findNumber(url)
  var uid = decode(number)
  return uid
}
 
function constructHomePageUrl(uid) {
  var prefixUrl = 'http://weibo.com/u/'
  return prefixUrl + uid
}
 
function main(url) {
  var uid = findUid(url)
  var homePageUrl = constructHomePageUrl(uid)
  console.log(homePageUrl)
  return homePageUrl
}
