define([
  'util/Observable',
  'data/Api',
  'data/Record',
  'controls/Exception'
], function(Observable, DataApi, DataRecord, Exception) {

  var Proxy = Q.Class.define(Observable, {

    type: 'Proxy',

    init: function(conn) {
      conn = conn || {};

      this.api = conn.api;
      this.url = conn.url;
      this.restful = conn.restful;
      this.liteners = conn.liteners;

      this.prettyUrls = conn.prettyUrls;


      this.callParent(arguments);

      try {
        DataApi.prepare(this);
      } catch (e) {
        if (e instanceof DataApi.Error) {
          console.log(e);
        }
      }

      //转变为构造函数事件
      this.relayEvents(Proxy, ['beforewrite', 'write', 'Exception']);
    },

    restful: false,

    /*
			1.
			proxy.setApi({
			    read    : '/users/read',
			    create  : '/users/create',
			    update  : '/users/update',
			    destroy : '/users/destroy'
			});
			
			2.
			proxy.setApi('read','/users/read')

		*/
    setApi: function() {
      var vald;

      if (arguments.length == 1) {
        valid = DataApi.isValid(arguments[0]);

        if (valid === true) {
          this.api = arguments[0];
        } else {
          throw new DataApi.Exception('invalid', valid);
        }

      } else if (arguments.length == 2) {

        if (!DataApi.isAction(arguments[0])) {
          throw new DataApi.Exception('invalid', arguments[0]);
        }

        this.api[arguments[0]] = arguments[1];
      }
      DataApi.prepare(this);
    },

    isApiAction: function(action) {
      return !!this.api[action];
    },

    /*发送请求*/
    request: function(action, rs, params, reader, callback, scope, options) {

      if (!this.api[action] && !this.load) {
        throw new Proxy.Exception('action-undefined', action);
      }

      params = params || {};

      //触发相应的事件
      //如果为read操作则触发beforeload，其他为beforewrite
      if ((action === DataApi.actions.read ?
          this.fire('beforeload', this, params) :
          this.fire('beforewrite', this, action, rs, params)) !== false) {
        this.doRequest.apply(this, arguments);
      } else { //阻止后直接触发回调
        callback.call(scope || this, null, options, false);
      }
    },

    load: null,

    doRequest: function(action, rs, params, reader, callback, scope, options) {
      this.load(params, reader, callback, scope, options);
    },

    onRead: Q.noop,

    onWrite: Q.noop,

    buildUrl: function(action, record) {
      var url, provides, match;

      record = record || null;

      url = (this.conn && this.conn.url) ? this.conn.url :
        this.api[action] ? this.api[action].url :
        this.url;

      if (!url) {
        throw new DataApi.Exception('invalid-url', action);
      }

      match = url.match(/(.*)(\.json|\.xml|\.html)$/);

      if (match) {
        provides = match[2]; //.json
        url = match[1]; //"/users
      }

      if ((this.restful || this.prettyUrls) && record instanceof DataRecord && !record.phantom) {
        url += '/' + record.id;
      }

      return provides == null ? url : url + provides;
    },

    destroy: function() {
      this.unbind();
    }

  })

  Q.extend(Proxy, Observable.prototype);

  Proxy.Exception = Q.Class.define(Exception, {
    init: function(message, arg) {
      this.arg = arg;
      this.callParent(arguments);
    },

    name: 'controls.data.proxy.Proxy',

    lang: {
      'action-undefined': "DataProxy attempted to execute an API-action but found an undefined url / function.  Please review your Proxy url/api-configuration.",
      'api-invalid': 'Recieved an invalid API-configuration.  Please ensure your proxy API-configuration contains only the actions from Ext.data.Api.actions.'
    }
  })

  return Proxy;
})