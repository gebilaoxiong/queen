define(['state/Provider'], function(Provider) {

  var rreadCookies = /\s?(.*?)=(.*?);/g,

    CookieProvider;

  CookieProvider = Q.Class.define(Provider, {

    init: function(config) {
      this.callParent(arguments);

      this.path = "/"

      /*有效期*/
      this.expires = new Date(new Date().getTime() + (1000 * 60 * 60 * 24 * 7)); //7 days

      this.domain = null;

      this.secure = false;

      Q.extend(this, config);

      this.state = this.readCookies();
    },

    readCookies: function() {
      rreadCookies.lastIndex = 0;

      var cookies = {},
        cookiesStr = document.cookie + ';',
        matches,
        name, value;

      while (matches = rreadCookies.exec(cookiesStr)) {
        name = matches[1];
        value = matches[2];

        if (name && name.substring(0, 3) == 'ys-') {
          cookies[name.substr(3)] = this.decodeValue(value);
        }
      }

      return cookies;
    },

    // private
    set: function(name, value) {
      if (typeof value == "undefined" || value === null) {
        this.clear(name);
        return;
      }
      this.setCookie(name, value);
      this.callParent(arguments);
    },

    // private
    clear: function(name) {
      this.clearCookie(name);
      this.callParent(arguments);
    },

    setCookie: function(name, value) {
      document.cookie = "ys-" + name + "=" + this.encodeValue(value) +
        ((this.expires == null) ? "" : ("; expires=" + this.expires.toGMTString())) +
        ((this.path == null) ? "" : ("; path=" + this.path)) +
        ((this.domain == null) ? "" : ("; domain=" + this.domain)) +
        ((this.secure == true) ? "; secure" : "");
    },

    // private
    clearCookie: function(name) {
      document.cookie = "ys-" + name + "=null; expires=Thu, 01-Jan-70 00:00:01 GMT" +
        ((this.path == null) ? "" : ("; path=" + this.path)) +
        ((this.domain == null) ? "" : ("; domain=" + this.domain)) +
        ((this.secure == true) ? "; secure" : "");
    }
  });

  return CookieProvider;
});