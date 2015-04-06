/**
 *
 * @authors 熊洋 (xywindows@gmail.com)
 * @date    2014-06-03 21:36:05
 * @description
 */
define(['util/Observable'], function(Observable) {
  var Direct;

  Direct = Q.Class.define(Observable, {

    /*异常*/
    exceptions: {
      TRANSPORT: 'xhr',
      PARSE: 'parse', //解析
      LOGIN: 'login', //登陆
      SERVER: 'exception' //服务器错误
    },

    init: function() {
      var me = this;

      //事务
      me.transactions = {};
      me.providers = {};
    },

    /**
     * 添加一个提供商和创建代理或存根方法
     * 执行服务器端的方法。
     * 如果提供程序尚未 连接，它会自动连接。
     */
    addProvider: function(provider) {
      var args = arguments,
        i, len;

      //传入和多个provider
      if (args.length > 1) {
        for (i = 0, len = args.length; i < len; i++) {
          this.addProvider(args[i]);
        }
        return;
      }

      //构造参数
      if (Q.isPlainObject(provider)) {
        provider = new Direct.PROVIDERS[provider.type](provider);
      }

      provider.id = provider.id || Q.id();
      //加入缓存
      this.providers[provider.id] = provider;

      provider.bind('data', this.onProviderData, this);
      provider.bind('exception', this.onProviderException, this);

      //开启连接
      if (!provider.isConnected()) {
        provider.connect();
      }

      return provider;
    },

    /**
     * 获取provider
     * @param  {string}     id      providerID
     */
    getProvider: function(id) {
      return this.providers[id];
    },

    /**
     * 删除provider
     * @param  {string}     id      providerID
     */
    removeProvider: function(id) {
      var provider = id.id ? id : this.providers[id];

      provider.unbind('data', this.onProviderData, this);
      provider.unbind('exception', this.onProviderException, this);

      delete this.providers[provider.id];
      return provider;
    },

    /**
     * 添加事务
     * @param {[type]} transaction [description]
     */
    addTransaction: function(transaction) {
      this.transactions[transaction.tid] = transaction;
      return transaction;
    },

    /**
     * 移除事务
     * @param  {[type]} transaction [description]
     */
    removeTransaction: function(transaction) {
      delete this.transactions[transaction.tid];
      return transaction;
    },

    /**
     * 获取事务
     * @param  {[type]} tid [description]
     */
    getTransaction: function(tid) {
      return this.transactions[tid.tid || tid];
    },

    /**
     * provider  data事件处理函数
     */
    onProviderData: function(event, provider, e) {
      if (Q.isArray(e)) { //数组迭代
        for (var i = 0, len = e.length; i < len; i++) {
          this.onProviderData(event, provider, e[i]);
        }
      }

      if (e.name && e.name != 'event' && e.name != 'exception') {
        this.fire(e.name, e);
      } else if (e.type == 'exception') {
        this.fire('exception', e);
      }

      this.fire('event', e, provider);
    },

    createEvent: function(response, extraProps) {
      return new Direct.eventTypes[response.type](Q.extend({}, response, extraProps));
    }
  });

  Direct = new Direct();
  Direct.TID = 1;
  Direct.PROVIDERS = {};

  /*-------------------------事件对象--------------------------*/

  Direct.Event = Q.Class.define({
    status: true,

    init: function(config) {
      Q.extend(this, config);
    },

    getData: function() {
      return this.data;
    }
  });

  Direct.RemotingEvent = Q.Class.define(Direct.Event, {
    type: 'rpc',

    getTransaction: function() {
      return this.transaction || Direct.getTransaction(this.tid);
    }
  });

  Direct.ExceptionEvent = Q.Class.define(Direct.RemotingEvent, {
    status: false,
    type: 'exception'
  });

  Direct.eventTypes = {
    'event': Direct.Event,
    'rpc': Direct.RemotingEvent,
    'exception': Direct.ExceptionEvent
  };


  /*---------------------------事务-----------------------------*/

  Direct.Transaction = function(config) {
    var me = this;

    Q.extend(me, config);

    me.tid = ++Direct.TID;
    //重试次数
    me.retryCount = 0;
  };

  Direct.Transaction.prototype = {
    send: function() {
      this.provider.queueTransaction(this);
    },

    retry: function() {
      this.retryCount++;
      this.send();
    },

    getProvider: function() {
      return this.provider;
    }
  }

  return Direct;
})