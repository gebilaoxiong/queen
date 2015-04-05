/**
 *
 * @authors 熊洋 (xywindows@gmail.com)
 * @date    2014-03-25 01:04:52
 * @description
 */
define([
  'data/proxy/Proxy',
  'data/Api'
], function(DataProxy, DataApi) {

  var DirectProxy = Q.Class.define(DataProxy, {

    /*
			paramOrder : Array/String 
			默认为undefined。 需要在服务端执行的参数列表。 
			指定必须在服务端执行的参数，它们可以是： 
				(1) 一个字符串数组
				(2) 字符串参数，使用空格、逗号或者管道符号(指|)进行分隔。 
			例如，可以接受以下任何一种: 
			paramOrder: ['param1','param2','param3']
			paramOrder: 'param1 param2 param3'
			paramOrder: 'param1,param2,param3'
			paramOrder: 'param1|param2|param'

		*/
    paramOrder: undefined,

    /*
		paramsAsHash : Boolean 
			使用命名参数集合发送参数(默认为 true)。 
			使用一个 paramOrder 可以使此配置项无效。  
		*/
    paramsAsHash: true,

    /*
			directFn : Function 
				在执行请求时调用的方法。
				directFn是定义Store的api配置参数 的一个简单可选方法，
				它将不会实现一个完整的CRUD api。 
		*/
    directFn: undefined,

    init: function(config) {
      Q.extend(this, config);

      if (typeof this.paramOrder == 'string') {
        this.paramOrder = this.paramOrder.split(/[\s,|]/);
      }

      this.callParent(arguments);
    },

    doRequest: function(action, rs, params, reader, callback, scope, options) {
      var args = [],
        directFn = this.api[action] || this.directFn;

      switch (action) {
        case DataApi.actions.create:
          args.push(params.jsonData);
          break;
        case DataApi.actions.read:
          // If the method has no parameters, ignore the paramOrder/paramsAsHash.
          if (directFn.directCfg.method.len > 0) {
            if (this.paramOrder) {
              for (var i = 0, len = this.paramOrder.length; i < len; i++) {
                args.push(params[this.paramOrder[i]]);
              }
            } else if (this.paramsAsHash) {
              args.push(params);
            }
          }
          break;
        case DataApi.actions.update:
          args.push(params.jsonData); // <-- update(Hash/Hash[])
          break;
        case DataApi.actions.destroy:
          args.push(params.jsonData); // <-- destroy(Int/Int[])
          break;
      }

      var trans = {
        params: params || {},
        request: {
          callback: callback,
          scope: scope,
          arg: options
        },
        reader: reader
      };

      args.push(this.createCallback(action, rs, trans), this);
      directFn.apply(window, args);
    },

    createCallback: function(action, rs, trans) {
      var me = this;

      return function(result, res) {
        if (!res.status) {

          if (action === DataApi.actions.read) {
            me.fire('loadexception', me, trans, res, null);
          }
          me.fire('exception', me, 'remote', action, trans, res, null);
          trans.request.callback.call(trans.request.scope, null, trans.request.arg, false);
        }

        if (action === DataApi.actions.read) {
          me.onRead(action, trans, result, res);
        } else {
          me.onWrite(action, trans, result, res, rs)
        }
      }
    },

    onRead: function(action, trans, result, res) {
      var records;

      try {
        records = trans.reader.readRecords(result);
      } catch (ex) {
        // @deprecated: Fire old loadexception for backwards-compat.
        this.fire("loadexception", this, trans, res, ex);

        this.fire('exception', this, 'response', action, trans, res, ex);
        trans.request.callback.call(trans.request.scope, null, trans.request.arg, false);
        return;
      }

      this.fire('load', this, res, trans.request.arg);
      trans.request.callback.call(trans.request.scope, records, trans.request.arg, true);
    },

    onWrite: function(action, trans, result, res, rs) {
      var data = trans.reader.extractData(trans.reader.getRoot(result), false),
        success = trans.reader.getSuccess(result);

      success = (success !== false);

      if (success) {
        this.fire("write", this, action, data, res, rs, trans.request.arg);
      } else {
        this.fire('exception', this, 'remote', action, trans, result, rs);
      }
      trans.request.callback.call(trans.request.scope, data, res, success);
    }
  });

  return DirectProxy;
});