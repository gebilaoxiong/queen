define(function() {

  /*排序方法*/
  var SortTypes = {
    /*默认值*/
    none: function(s) {
      return s;
    },
    /*转换为字符串*/
    'string': function(s) {
      return String(s);
    },
    /*大写字符串*/
    asUpperText: function(s) {
      return String(s).toUpperCase();
    },
    /*转换为日期*/
    asDate: function(s, format) {
      var ret;

      if (!s) {
        return 0;
      }

      if (Q.isDate(s)) {
        return s.valueOf();
      }

      ret = Q.Date.parse(s, format);

      return isNaN(ret) ? 0 : ret.valueOf();
    },

    asFloat: function(s) {
      var ret = parseFloat(s);
      return isNaN(ret) ? 0 : ret;
    },

    asInt: function(s) {
      var ret = Number(s);
      return isNaN(ret) ? 0 : ret;
    }
  };

  return SortTypes;
})