define(function() {

  /*错误类封装*/
  var Exception = function(message) {
    this.init(message);
  };

  Exception.prototype = new Error();

  Q.extend(Exception.prototype, Q.Abstract.prototype, {

    init: function(message) {
      this.type = this.type;

      this.message = this.lang[message] ? this.lang[message] : message;
    },

    lang: {},

    type: 'Exception',

    name: 'Error',

    getName: function() {
      return this.name;
    },

    getMessage: function() {
      return this.message;
    },

    toJson: function() {
      return Q.JSON.stringify(this);
    },

    log: function() {
      GLOBAL.log.error(this);
    }
  })

  return Exception;
})