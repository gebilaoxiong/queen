define(['util/Observable'], function(observable) {

  var rquery = /\?/,

    Connection = Q.Class.define(observable, {

      init: function(config) {
        Q.extend(this, config);
        this.callParent(arguments);
      },

      timeout: 30000,

      /*是否自动终止正在发生的请求*/
      autoAbort: false,

      /*如果为true 禁止get时候的浏览器缓存*/
      disableCaching: true,

      /*禁用缓存参数*/
      disableCachingParam: '_',

      /*
			extraParams 额外参数
			*/
      request: function(o) {
        var me = this,
          params, url, method, cb, form, serForm, disableCachingParam;

        if (me.fire('beforrequest', me, o) !== false) {
          if (o.el) {
            //.....
          }
          params = o.params;
          url = o.url || me.url;
          cb = { //callback
            success: me.handleResponse,
            failure: me.handleFailure,
            scope: me,
            argument: {
              options: o
            },
            timeout: o.timeout || me.timeout
          };

          //通过fn获取参数
          if (Q.isFunction(params)) {
            params = params.call(o.scope || window, o);
          }

          //将参数转变为string
          if (Q.isObject(params)) {
            params = Q.Object.toQueryString(params);
          }

          //扩展参数
          if (me.extraParams) {

            //转换为string
            if (Q.isObject(extraParams)) {
              extraParams = Q.Object.toQueryString(extraParams);
            }

            params = (params.indexOf('&') >= 0 && extraParams.length) ?
              params + '&' + extraParams :
              extraParams;
          }

          //url
          if (Q.isFunction(url)) {
            url = url.call(o.scope || window, o);
          }

          //表单提交
          if ((form = Q.dom.get(o.form))) {
            url = url || form.action;
            //表单中存在file
            if (o.isUpload || /multipart\/form-data/i.test(form.getAttribute("enctype"))) {
              return me.doFormUpload.call(me, o, params, url);
            }
            serForm = Q.Element.serialize(form);
            param = param ?
              param + '&' + serForm :
              serForm;
          }


          //提交方法
          method = o.method || me.method || ((params || o.xmlData || o.jsonData) ? 'POST' : 'GET');

          //uppercase
          method = method ? String(method).toUpperCase() : method;

          //get的时候是否禁用缓存
          if (method === 'GET' && (me.disableCaching && o.disableCaching !== false) || o.disableCaching === true) {
            //禁用缓存参数
            disableCachingParam = o.disableCachingParam || me.disableCachingParam;
            url += rquery.test(url) ? '&' : '?' + disableCachingParam + '=' + (new Date()).valueOf();
          }

          o.headers = Q.applyIf(o.headers || {}, me.defaultHeaders || {});

          //取消正在进行中的
          if (o.autoAbort === true || me.autoAbort) {
            me.abort();
          }

          if ((method === 'GET' || o.xmlData || o.jsonData) && params) {
            url = url + (rquery.test(url) ? '&' : '?') + params;
            params = '';
          }

          return (me.transId = Q.ajax.request(method, url, cb, params, o));
        } else {
          return o.callback ? o.callback.call(o.scope, o, undefined, undefined) : null;
        }
      },

      //取消
      abort: function(transId) {
        if (transId || this.isLoading()) {
          Q.ajax.abort(transId || this.transId);
        }
      },

      //提交含有 file字段的表单
      doFormUpload: function(opts, data, url) {

      },

      isLoading: function(transId) {
        return transId ? Q.ajax.isCallInProgress(transId) : !!this.transId;
      },

      handleResponse: function(response) {
        var options = response.argument.options;
        this.transId = false;

        response.argument = options ? options.argument : null;
        //发出事件
        this.fire('requestcomplete', this, response, options);

        //调用相应回调
        if (options.success) {
          options.success.call(options.scope, response, options);
        }
        if (options.callback) {
          options.callback.call(options.scope, options, true, response);
        }
      },

      // private
      handleFailure: function(response, e) {
        var options = response.argument.options;
        this.transId = false;

        response.argument = options ? options.argument : null;

        //发出事件
        this.fire('requestexception', this, response, options, e);
        //调用相应回调
        if (options.failure) {
          options.failure.call(options.scope, response, options);
        }
        if (options.callback) {
          options.callback.call(options.scope, options, false, response);
        }
      }

    });

  return Connection;
});