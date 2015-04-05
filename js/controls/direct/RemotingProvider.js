/**
 *
 * @authors 熊洋 (xywindows@gmail.com)
 * @date    2014-06-03 23:59:23
 * @description
 */
define([
  'controls/Direct',
  'direct/JsonProvider',
  'data/Ajax',
  'util/Timer'
], function(Direct, JsonProvider, Ajax, Timer) {
  var RemotingProvider;

  /*

  var userAPI = new RemotingProvider({
      url: rootUrl + 'DirectAPI/Router',
      actions: {
          User: [
              {
                  name: 'GetUserList',
                  len: 0//参数个数
              }
          ]
      }
  });


  调用的时候
  User.getUserList(callback);
   */

  RemotingProvider = Q.Class.define(JsonProvider, {

    /**
     * true或者 false 以启用或者禁用绑定方法调用。
     * 如果此值被指定为一个数值，将合并在指定时间内的调用 并且一次性发出
     */
    enableBuffer: 10,

    /**
     * 调用失败之后重新尝试的次数。默认为1.
     */
    maxRetries: 1,

    /**
     * 每次请求的超时时间。默认为 undefined.
     */
    timeout: undefined,

    init: function(config) {
      var me = this;

      me.callParent(arguments);

      //命名空间
      me.namespace = Q.isString(me.namespace) ? Q.ns(me.namespace) : me.namespace || window;
      //事务集合
      me.transactions = {};
      //调用缓冲
      me.callBuffer = [];
    },

    /**
     * 初始化调用api
     */
    initAPI: function() {
      var actions = this.actions,
        namespace = this.namespace,
        action, cls, methods,
        i, len, method;

      for (action in actions) {
        cls = namespace[action] || (namespace[action] = {});
        methods = actions[action];

        for (i = 0, len = methods.length; i < len; i++) {
          method = methods[i];
          //给namespce下创建一个对应的方法
          cls[method.name] = this.createHandler(action, method);
        }
      }
    },

    isConnected: function() {
      return !!this.connected;
    },

    /**
     * 连接
     */
    connect: function() {
      var me = this;

      if (me.url) {
        me.initAPI();
        me.connected = true;
        me.fire('connect', me);
      } else if (!this.url) {
        throw new Error('Error initializing RemotingProvider, no url configured.');
      }
    },

    /**
     * 断开连接
     */
    disconnect: function() {
      if (this.connected) {
        this.connected = false;
        this.fire('disconnect', this);
      }
    },

    /**
     * xhr回调
     */
    onData: function(opt, success, xhr) {
      var me = this,
        events, i, len,
        event, transac,
        transactions;

      if (success) {
        //获取事件对象数组
        events = me.getEvents(xhr);

        //迭代事件对象
        for (i = 0, len = events.length; i < len; i++) {
          event = events[i];
          transac = me.getTransaction(event);

          //触发data事件
          me.fire('data', me, event);

          if (transac) {
            //执行回调
            me.doCallback(transac, event, true);
            //移除事务
            Direct.removeTransaction(transac);
          }
        }
      }
      //失败处理函数
      else {
        //获取此次提交的所有事物
        transactions = [].concat(opt.ts);

        for (i = 0, len = transactions.length; i < len; i++) {
          transac = this.getTransaction(transactions[i]);

          //如果重试次数小于最大重试次数
          if (transac && transac.retryCount < this.maxRetries) {
            transac.retry();
          } else {
            event = new Direct.ExceptionEvent({
              data: event,
              transaction: transac,
              code: Direct.exceptions.TRANSPORT,
              message: 'Unable to connect to the server.',
              xhr: xhr
            })

            this.fire('data', this, event);

            //如果事物存在 执行回调
            //删除事物
            if (transac) {
              this.doCallback(transac, event, false);
              Direct.removeTransaction(transac);
            }
          }


        }
      }
    },


    getCallData: function(transaction) {
      return {
        action: transaction.action,
        method: transaction.method,
        data: transaction.data,
        type: 'rpc',
        tid: transaction.tid
      };
    },

    /**
     * 提交
     */
    doSend: function(data) {
      var o = {
          url: this.url,
          callback: this.onData,
          scope: this,
          ts: data,
          timeout: this.timeout
        },
        callData;

      //传送的是数组
      if (Q.isArray(data)) {
        callData = [];
        for (var i = 0, len = data.length; i < len; i++) {
          callData.push(this.getCallData(data[i]));
        }
      } else {
        callData = this.getCallData(data);
      }

      if (this.enableUrlEncode) {
        var params = {};
        params[Q.isString(this.enableUrlEncode) ? this.enableUrlEncode : 'data'] = JSON.stringify(callData);
        o.params = params;
      } else {
        o.jsonData = callData;
      }

      Ajax.request(o);
    },

    /**
     * 合并并发送
     */
    combineAndSend: function() {
      var len = this.callBuffer.length;

      //将缓冲区中的所有事务一起发送
      if (len > 0) {
        this.doSend(len == 1 ? this.callBuffer[0] : this.callBuffer);
        this.callBuffer = [];
      }
    },

    /**
     * 排列事务
     * 将事务放入缓冲中
     * 一段时间后合并发送
     */
    queueTransaction: function(transaction) {
      //表单
      if (transaction.form) {
        this.processForm(transaction);
        return;
      }

      //放入缓冲中
      this.callBuffer.push(transaction);

      //合并提交
      if (this.enableBuffer) {
        //定时器
        if (!this.callTask) {
          this.callTask = new Timer(this.combineAndSend, this);
        }
        //延时
        this.callTask.delay(Q.isNumber(this.enableBuffer) ? this.enableBuffer : 10);
      } else {
        this.combineAndSend();
      }

    },

    doCall: function(action, method, args) {
      var data, callback = args[method.len],
        scope = args[method.len + 1],
        transaction;

      if (method.len !== 0) {
        data = args.slice(0, method.len);
      }

      /*创建事务*/
      transaction = new Direct.Transaction({
        provider: this,
        args: args,
        action: action,
        method: method.name,
        data: data,
        cb: scope && Q.isFunction(callback) ? Q.proxy(callback, scope) : callback
      });


      if (this.fire('beforecall', this, transaction, method) !== false) {
        Direct.addTransaction(transaction);
        this.queueTransaction(transaction);
        this.fire('call', this, transaction, method);
      }

    },

    doForm: function(action, method, form, callback, scope) {
      var transaction = new Direct.Transaction({
          provider: this,
          action: action,
          method: method.name,
          args: [form, callback, scope],
          cb: scope && Q.isFunction(callback) ? Q.proxy(callback, scope) : callback,
          isForm: true
        }),
        isUpload, params;

      if (this.fire('beforecall', this, transaction, method) !== false) {
        Direct.addTransaction(transaction);
        //是否有文件上传
        isUpload = String(form.getAttribute('enctype')).toLowerCase() == 'multipart/form-data';
        params = {
          qTID: transaction.tid,
          qAction: action,
          qMethod: method.name,
          qType: 'rpc',
          qUpload: String(isUpload)
        };

        Q.extend(transaction, {
          form: Q.dom.get(form),
          isUpload: isUpload,
          params: callback && Q.isObject(callback.params) ? Q.extend(params, callback.params) : params
        })

        this.fire('call', this, transaction, method);
        this.processForm(transaction);
      }
    },

    processForm: function(transaction) {
      Ajax.request({
        url: this.url,
        params: transaction.params,
        callback: this.onData,
        scope: this,
        form: transaction.form,
        isUpload: transaction.isUpload,
        ts: transaction
      });
    },

    /**
     * 创建一个调用方法
     */
    createHandler: function(action, method) {
      var me = this,
        handler;

      if (!method.formHandler) {
        handler = function() {
          me.doCall(action, method, Array.prototype.slice.call(arguments, 0));
        };
      } else {
        handler = function(form, callback, scope) {
          me.doForm(action, method, form, callback, scope);
        };
      }

      handler.directCfg = {
        action: action,
        method: method
      };

      return handler;
    },

    getTransaction: function(opt) {
      return opt && opt.tid ? Direct.getTransaction(opt.tid) : null;
    },

    doCallback: function(transac, event) {
      var funcName = event.status ? 'success' : 'failure',
        callback,
        result;

      if (transac && transac.cb) {
        callback = transac.cb;
        result = Q.isDefined(event.result) ? event.result : event.data;

        if (Q.isFunction(callback)) {

          callback(result, event);

        } else {

          if (Q.isFunction(callback[funcName])) {
            callback[funcName].call(callback.scope, result, event);
          }
          if (Q.isFunction(callback.callback)) {
            callback.callback.call(callback.scope, result, event);
          }
        }
      }
    }
  });



  Direct.PROVIDERS['remoting'] = RemotingProvider;

  return RemotingProvider;
})