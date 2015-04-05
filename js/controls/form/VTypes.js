define(function() {
  /*封装一些常用的正则表达式 及验证方式*/
  var VTypes = {},

    regExps = {
      num: /^[0-9]+$/,

      alpha: /^[a-z,A-Z_]+$/,

      alphaNum: /^[a-zA-Z0-9_]+$/,

      email: /^(\w+)([\-+.\'][\w]+)*@(\w[\-\w]*\.){1,5}([A-Za-z]){2,6}$/,

      url: /(((^https?)|(^ftp)):\/\/([\-\w]+\.)+\w{2,3}(\/[%\-\w]+(\.\w{2,})?)*(([\w\-\.\?\\\/+@&#;`~=%!]*)(\.\w{2,})?)*\/?)/i

    },

    msgs = {

      num: '该输入项只能包含数字。',

      alpha: '该输入项只能包含半角字母和_',

      alphaNum: '该输入项只能包含半角字母,数字和_',

      email: '该输入项必须是电子邮件地址，格式如： "user@example.com"',

      url: '该输入项必须是URL地址，格式如： "http:/' + '/www.example.com"'

    };


  VTypes.register = function(type, exp, message) {

    VTypes[type] = function(value) {
      return exp.test(value);
    };

    VTypes[type + 'RegExp'] = exp;

    VTypes[type + 'Text'] = msgs[type];
  };

  Q.each(regExps, function(type) {
    VTypes.register(type, regExps[type], msgs[type]);
  });


  return VTypes;
});