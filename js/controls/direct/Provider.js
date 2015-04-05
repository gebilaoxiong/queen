/**
 *
 * @authors 熊洋 (xywindows@gmail.com)
 * @date    2014-06-03 17:12:49
 * @description
 */
define(['util/Observable'], function(Observable) {

  var Provider;

  Provider = Q.Class.define(Observable, {
    /**
     * 优先级
     * 请求的优先级。数值越小，优先级越高
     * 0意为“全双工”(一直开启)。
     * 所有Providers都默认为 1
     * 除了PollingProvider默认为 3。
     */
    priority: 1,

    init: function(config) {
      Q.extend(this, config);
      this.callParent(arguments);
    },

    /**
     * 是否处于连接状态
     */
    isConnected: function() {
      return false;
    },

    /**
     * 连接
     */
    connect:Q.noop,

    /**
     * 断开连接
     */
    disconnect:Q.noop
  });

  return Provider;
})