/**
 *
 * @authors 熊洋 (xywindows@gmail.com)
 * @date    2014-06-03 22:58:37
 * @description
 */
define([
  'controls/Direct',
  'direct/Provider'
], function(Direct, Provider) {
  var JsonProvider;

  JsonProvider = Q.Class.define(Provider, {

    /**
     * 解析接收信息
     */
    parseResponse: function(xhr) {

      if (Q.isDefined(xhr.responseText)) {

        //我还真想不通xhr啥时候会返回object
        if (typeof xhr.responseText == 'object') {
          return xhr.responseText;
        }
        //解析成json
        return Q.JSON.parse(xhr.responseText);
      }

      return null;
    },

    getEvents: function(xhr) {
      var data = null,
        events, event, i, len;

      try {
        
        data = this.parseResponse(xhr);

      } catch (e) {

        //返回解析错误对象
        event = new Direct.ExceptionEvent({
          data: e,
          xhr: xhr,
          code: Direct.exceptions.PARSE,
          message: 'Error parsing json response: \n\n ' + data
        });

        return [event];
      }

      events = [];

      if (Q.isArray(data)) {
        for (i = 0, len = data.length; i < len; i++) {
          events.push(Direct.createEvent(data[i]));
        }
      } else {
        events.push(Direct.createEvent(data));
      }

      return events;
    }
  });

  return JsonProvider;
})