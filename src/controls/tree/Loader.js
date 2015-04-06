/**
 *
 * @authors 熊洋 (xywindows@gmail.com)
 * @date    2014-04-29 16:50:37
 * @description
 */
define([
  'util/Observable',
  'tree/NodeTypes',
  'data/Ajax'
], function(Observable, NodeTypes, Ajax) {

  var TreeLoader;

  TreeLoader = Q.Class.define(Observable, {

    type: 'TreeLoader',

    /**
     * 节点UI
     */
    uiProviders: {},

    /**
     * 加载前是否清空节点
     */
    clearOnLoad: true,

    /*基本参数*/
    baseParams: undefined,

    paramOrder: undefined,

    paramAdHash: false,

    /*请求的节点参数名*/
    nodeParameter: 'node',

    /**
     * 当执行请求时调用的函数
     */
    directFn: undefined,

    /*
		
		preloadChildren : Boolean 如果设置为true，
			加载器在加载完第一个节点之后将递归地调用孩子节点

		baseAttrs : Object (可选)一个包含属性的对象，
			用于覆盖此后加载节点的属性
		 */

    init: function(config) {
      var me = this;
      me.baseParams = {};

      Q.extend(me, config);
      //绑定事件
      me.callParent(arguments);

      if (Q.isString(me.paramOrder)) {
        me.paramOrder = me.paramOrder.split(/[\s,|]/);
      }
    },

    /**
     * 加载某一节点数据
     */
    load: function(node, callback, scope) {
      var me = this;

      //加载前清除该节点下的子节点
      if (me.clearOnLoad) {
        while (node.firstChild) {
          node.removeChild(node.firstChild);
        }
      }

      //加载前如果节点数据已存在
      if (me.doPreload(node)) {
        me.runCallback(callback, scope || node, [node]);
      } else if (me.directFn || me.dataUrl || me.url) {
        me.requestData(node, callback, scope || node);
      }
    },

    /**
     * 加载前 如果节点数据已加载则绘制
     */
    doPreload: function(node) {
      var me = this,
        cs, i, len, cn;

      //加载前 如果节点存在静态节点 绘制之
      if (node.attributes.children) {
        if (node.childNodes.length < 1) {
          cs = node.attributes.children; //静态节点
          node.beginUpdate();

          for (i = 0, len = cs.length; i < len; i++) {
            cn = node.appendChild(me.createNode(cs[i]));
            if (me.preloadChildren) {
              me.doPreload(cn);
            }
          }

          node.endUpdate();
        }
        return true;
      }
      return false;
    },

    /**
     * 获取节点请求参数
     */
    getParams: function(node) {
      var me = this,
        baseParams = Q.extend({}, me.baseParams),
        nodeParamName = me.nodeParameter, //节点请求参数名
        paramOrder = me.paramOrder; //请求的排序参数


      nodeParamName && (baseParams[nodeParamName] = node.id);

      if (me.directFn) {
        var buf = [node.id];

        if (paramOrder) {

          if (nodeParamName && Q.inArray(nodeParamName, paramOrder) > -1) {
            buf = [];
          }

          for (var i = 0, len = po.length; i < len; i++) {
            buf.push(bp[po[i]]);
          }
        } else if (me.paramsAsHash) {
          buf = [bp];
        }
        return buf;
      } else {
        return baseParams;
      }
    },

    requestData: function(node, callback, scope) {
      var me = this;
      if (me.fire('beforeload', me, node, callback) !== false) {
        if (me.directFn) {
          /**
           * 此处代码不符合结构要求
           */
          throw '此处代码不符合结构要求';
        } else { //发出请求
          me.transId = Ajax.request({
            method: me.requestMethod,
            url: me.dataUrl || me.url,
            success: me.handleResponse,
            failure: me.handleFailure,
            scope: me,
            argument: {
              callback: callback,
              node: node,
              scope: scope
            },
            params: me.getParams(node)
          });
        }
      }
    },

    processDirectResponse: function(result, response, args) {
      if (response.status) {
        this.handleResponse({
          responseData: Q.isArray(result) ? result : null,
          responseText: result,
          argument: args
        });
      } else {
        this.handleFailure({
          argument: args
        });
      }
    },

    // private
    runCallback: function(cb, scope, args) {
      if (Q.isFunction(cb)) {
        cb.apply(scope, args);
      }
    },

    /**
     * 判断是否在加载中
     */
    isLoading: function() {
      return !!this.transId;
    },

    /**
     * 取消加载
     * @return {[type]} [description]
     */
    abort: function() {
      if (this.isLoading()) {
        Ajax.abort(this.transId);
      }
    },


    /**
     * 通过属性创建相应节点
     */
    createNode: function(attr) {
      var me = this;
      //默认属性
      if (me.baseAttrs) {
        Q.applyIf(attr, me.baseAttrs);
      }

      //给节点属性添加loader便于节点自我更新
      if (me.applyLoader !== false && !attr.loader) {
        attr.loader = me;
      }

      //如果是字符串
      if (Q.isString(attr.uiProvider)) {
        attr.uiProvider = me.uiProviders[attr.uiProvider]
      }

      //节点类型
      if (attr.nodeType == undefined) { //如果没有强制节点类型 则根据是否为leaf判定
        attr.nodeType = attr.leaf ? 'node' : 'async';
      }

      if (attr.nodeType) {
        return new NodeTypes[attr.nodeType](attr);
      }
    },

    processResponse: function(response, node, callback, scope) {
      var json = response.responseText;
      try {
        var o = response.responseData || Q.JSON.Parse(json);
        node.beginUpdate();
        for (var i = 0, len = o.length; i < len; i++) {
          var n = this.createNode(o[i]);
          if (n) {
            node.appendChild(n);
          }
        }
        node.endUpdate();
        this.runCallback(callback, scope || node, [node]);
      } catch (e) {
        this.handleFailure(response);
      }
    },

    /**
     * directFn处理
     */
    handleResponse: function(response) {
      var me = this,
        a;
      me.transId = false;
      a = response.argument;
      me.processResponse(response, a.node, a.callback, a.scope);
      me.fire("load", me, a.node, response);
    },

    /**
     * directFn处理
     */
    handleFailure: function(response) {
      var me = this,
        a;
      me.transId = false;
      a = response.argument;
      me.fire("loadexception", me, a.node, response);
      me.runCallback(a.callback, a.scope || a.node, [a.node]);
    },

    /*销毁*/
    destroy: function() {
      this.abort();
      this.unbind();
    }
  });

  return TreeLoader;
});