/**
 *
 * @authors 熊洋 (xywindows@gmail.com)
 * @date    2014-05-02 02:40:33
 * @description
 */
define([
  'controls/Panel',
  'tree/EventModel',
  'tree/Loader',
  'tree/RootNodeUI',
  'tree/DefaultSelectionModel'
], function(Panel, TreeEventModel, TreeLoader, RootTreeNodeUI, DefaultSelectionModel) {

  var TreePanel;

  TreePanel = Q.Class.define(Panel, {

    /**
     * 根节点是否可见
     */
    rootVisible: true,

    /**
     * 设置为true以启用展开/折叠时的动画效果
     */
    animate: false,

    /**
     * 是否显示连接线
     */
    lines: true,

    /**
     * 是否允许节点拖拽
     */
    enableDD: false,

    /**
     * 设置为false，在拖拽完放开的时候禁用高亮显示节点
     */
    hlDrop: false,

    /**
     * 路径分隔符
     */
    pathSeparator: '/',

    /**
     * 冒泡事件
     */
    bubbleEvents: [],

    /*
		singleExpand 设置为true一个树枝上只允许展开一个节点

		dataUrl 请求的路径

		requestMethod 请求的方法GET||POST

		useArrows: 启用箭头代替文件夹
		 */

    /**
     * 重写初始化部件
     */
    initComponent: function() {
      var me = this,
        loader, root;

      me.callParent(arguments);

      //事件处理对象
      if (!me.eventModel) {
        me.eventModel = new TreeEventModel(me);
      }

      //加载器
      if (!(loader = me.loader)) {
        loader = new TreeLoader({
          dataUrl: me.dataUrl,
          requestMethod: me.requestMethod
        })
      } else if (Q.isObject(loader) && !loader.load) { //loader配置对象
        loader = new TreeLoader(loader);
      }

      me.loader = loader;

      //节点键值缓存
      me.nodeHash = {};

      //设置根节点
      if (me.root) {
        root = me.root;
        me.root = null;
        me.setRootNode(root);
      }

      //单个节点展开
      if (me.singleExpand) {
        me.bind('beforeexpandnode', me.onRestrictExpand, me);
      }
    },

    proxyNodeEvent: function(ename) {
      if (ename == 'collapse' ||
        ename == 'expand' ||
        ename == 'beforecollapse' ||
        ename == 'beforeexpand' ||
        ename == 'move' ||
        ename == 'beforemove') {
        ename = ename + 'node';
      }

      return this.fire.apply(this, arguments);
    },

    /**
     * 获取根节点
     */
    getRootNode: function() {
      return this.root;
    },

    /**
     * 设置根节点
     */
    setRootNode: function(node) {
      var me = this,
        uiP;
      me.destroyRoot();

      //传入的是配置对象
      if (!node.render) {
        node = me.loader.createNode(node);
      }

      me.root = node;
      node.ownerTree = me;
      node.isRoot = true; //根节点标识
      me.registerNode(node);

      //如果不显示根节点
      if (!me.rootVisible) {
        uiP = node.attributes.uiProvider;
        node.ui = uiP ? new uiP(node) : new RootTreeNodeUI(node);
      }

      if (me.innerCt) {
        me.clearInnerCt();
        me.renderRoot();
      }
      return node;
    },

    /**
     * 清除子容器
     */
    clearInnerCt: function() {
      this.innerCt.dom.innerHTML = '';
    },

    /**
     * 绘制根
     */
    renderRoot: function() {
      var me = this;
      me.root.render();
      if (!me.rootVisible) {
        me.root.renderChildren();
      }
    },

    /**
     * 根据ID获取节点
     */
    getNodeById: function(id) {
      return this.nodeHash[id];
    },

    /**
     * 注册节点
     */
    registerNode: function(node) {
      this.nodeHash[node.id] = node;
    },

    /**
     * 反注册节点
     */
    unregisterNode: function(node) {
      delete this.nodeHash[node.id];
    },

    toString: function() {
      return '[Tree' + (this.id ? ' ' + this.id : '') + ']';
    },

    /**
     * 限制多节点展开
     */
    onRestrictExpand: function(e, node) {
      this.restrictExpand(node);
    },
    restrictExpand: function(node) {
      var parent = node.parentNode;
      if (parent) {
        //如果父节点下已存在一个打开的节点
        //关闭之
        if (parent.expandedChild && parent.expandedChild.parentNode == parent) {
          parent.expandedChild.collapse();
        }
        parent.expandedChild = node;
      }
    },

    /**
     * 获取选中节点 或者获取选中节点的某一属性
     */
    getChecked: function(attr, startNode) {
      var me = this,
        ret, cascade;

      startNode = startNode || me.root;
      ret = [];
      cascade = function() {
        if (me.attributes.checked) {
          ret.push(!attr ? me : (attr == 'id' ? me.id : me.attributes[a]));
        }
      };

      startNode.cascade(cascade);
      return ret;
    },

    getLoader: function() {
      return this.loader;
    },

    /**
     * 展开所有节点
     */
    expandAll: function() {
      this.root.expand(true);
    },

    /**
     * 折叠所有节点
     */
    collapseAll: function() {
      this.root.collapse(true);
    },

    /**
     * 获取SelectionModel
     */
    getSelectionModel: function() {
      var me = this;
      if (!me.selModel) {
        me.selModel = new DefaultSelectionModel();
      }
      return me.selModel;
    },

    /**
     * 按节点的属性路径展开
     *
     * callbak(success,node)
     */
    expandPath: function(path, attr, callback) {
      var keys, curNode, index, fn;

      //如果没有路径 执行callback后返回
      if (Q.isUndefined(path)) {
        if (callback) {
          callback(false, undefined);
        }
        return;
      }

      attr = attr || 'id';
      keys = path.split(this.pathSeparator); //切割成数组
      curNode = this.root;

      //如果根节点不符合要求 
      if (curNode.attributes[attr] != keys[1]) {
        if (callback) {
          callback(false, null);
        }
        return;
      }

      index = 1;
      fn = function() {
        //索引到达底部
        if (++index == keys.length) {
          if (callback) {
            callback(true, curNode);
          }
          return;
        }

        var c = curNode.findChild(attr, keys[index]);
        if (!c) { //子节点中没有符合要求的
          if (callback) {
            callback(true, curNode);
          }
          return;
        }
        curNode = c;
        c.expand(false, false, fn);
      };

      curNode.expand(false, false, fn);
    },

    /**
     * 按路径选中
     */
    selectPath: function(path, attr, callback) {
      var keys, value, fn;

      if (Q.isUndefined(Panel)) {
        if (callback) {
          callback(false, undefined);
        }
        return;
      }

      attr = attr || 'id';
      keys = path.split(this.pathSeparator);
      value = keys.pop();

      if (keys.length > 1) {
        fn = function(success, node) {
          if (success && node) {
            var n = node.findChild(attr, value);

            if (n) {
              n.select();
              if (callback) {
                callback(true, node);
              }
            } else if (callback) {
              callback(false, node);
            }

          }
        };
        this.expandPath(keys.join(this.pathSeparator), attr, fn);
      } else {
        this.root.select();
        if (callback) {
          callback(true, this.root);
        }
      }

    },

    getTreeEl: function() {
      return this.body;
    },

    /**
     * 重写结构绘制
     */
    onRender: function(container, position) {
      var me = this;
      me.callParent(arguments);
      me.el.addClass('x-tree');

      me.innerCt = me.body.createChild({
        target: 'ul',
        'class': 'x-tree-root-ct ' +
          //是显示图标 还是展开开关（三叉线）
          (me.useArrows ?
            'x-tree-arrows' : me.lines ?
            'x-tree-lines' : 'x-tree-no-lines')
      });
    },

    initEvents: function() {
      var me = this;
      me.callParent(arguments);
      me.getSelectionModel().initialize(this);
    },

    // private
    afterRender: function() {
      this.callParent(arguments);
      this.renderRoot();
    },

    beforeDestroy: function() {
      var me = this;
      /*
			if (this.rendered) {
				Ext.dd.ScrollManager.unregister(this.body);
				Ext.destroy(this.dropZone, this.dragZone);
			}
			*/
      me.destroyRoot();
      Q.destroy(me.loader);
      me.nodeHash = me.root = me.loader = null;
      me.callParent(arguments);
    },

    destroyRoot: function() {
      var me = this;
      if (me.root && me.root.destroy) {
        me.root.destroy(true);
      }
    }

  });

  return TreePanel;
});