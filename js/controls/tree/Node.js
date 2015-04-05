/**
 *
 * @authors 熊洋 (xywindows@gmail.com)
 * @date    2014-05-01 14:09:12
 * @description 树节点 基类
 */
define(['data/Node', 'tree/NodeUI'], function(Node, TreeNodeUI) {

  var TreeNode;

  TreeNode = Q.Class.define(Node, {

    type: 'TreeNode',

    preventHScroll: true,

    init: function(attributes) {
      var me = this,
        uiClass;

      attributes = attributes || {};

      //如果只传入了文本
      if (Q.isString(attributes)) {
        attributes = {
          text: attributes
        };
      }

      //未呈现子节点
      me.childrenRendered = false;
      me.rendered = false;
      me.callParent('init', [attributes]);

      me.expanded = attributes.expanded === true; //展开
      me.isTarget = attributes.isTarget !== false;
      me.draggable = attributes.draggable !== false && attributes.allowDrag !== false; //是否允许拖动
      me.allowChildren = attributes.allowChildren !== false && attributes.allowDrop !== false; //是否允许通过拖拽添加子节点

      me.text = attributes.text; //节点文本

      me.disabled = attributes.disabled === true;
      me.hidden = attributes.hidden === true;

      uiClass = me.attributes.uiProvider || me.defaultUI || TreeNodeUI;

      me.ui = new uiClass(me);
    },

    /**
     * 是否已经展开
     */
    isExpanded: function() {
      return this.expanded;
    },

    getUI: function() {
      return this.ui;
    },

    /**
     * 获取加载器
     */
    getLoader: function(node) {
      var owner;
      //考虑到循环引用
      //return this.loader || ((owner = this.getOwnerTree()) && owner.loader ? owner.loader : (this.loader = new Ext.tree.TreeLoader()));
      return this.loader || (owner = this.getOwnerTree()) && owner.loader;
    },

    /**
     * 重写设置首节点
     */
    setFirstChild: function(node) {
      var me = this,
        oldFirst = me.firstChild;
      me.callParent(arguments);

      //调整新旧节点的缩进
      if (me.childrenRendered && oldFirst && node != oldFirst) {
        //深度 刷新
        oldFirst.renderIndent(true, true);
      }

      //如果已呈现 重新绘制缩进
      if (me.rendered) {
        me.renderIndent(true, true);
      }
    },

    /**
     * 重写设置尾节点
     */
    setLastChild: function(node) {
      var me = this,
        oldLast = me.lastChild;
      me.callParent(arguments);

      //调整新旧节点的缩进
      if (me.childrenRendered && oldLast && node != oldLast) {
        //深度 刷新
        oldLast.renderIndent(true, true);
      }

      //如果已呈现 重新绘制缩进
      if (me.rendered) {
        me.renderIndent(true, true);
      }
    },

    /**
     * 重写追加节点
     */
    appendChild: function(n) {
      var me = this,
        node;
      if (!n.render && !Q.isArray(n)) {
        n = me.getLoader().createNode(n);
      }

      node = me.callParent(arguments);

      //如果该节点已完成子节点绘制 则立即绘制新添加的节点
      if (node && me.childrenRendered) {
        node.render();
      }

      //重写绘制展开节点图标
      me.ui.updateExpandIcon();
      return node;
    },

    /**
     * 重写移除节点
     */
    removeChild: function(node, destroy) {
      var me = this,
        rendered;
      //非选中
      me.ownerTree.getSelectionModel().unselect(node);
      me.callParent(arguments);

      //未销毁
      if (!destroy) {
        rendered = node.ui.rendered;

        if (rendered) {
          //从dom冲移除 在holdr中缓存起来
          node.ui.remove();
        }

        if (rendered && me.childNodes.length < 1) { //如果已呈现且子节点为空折叠
          //折叠
          me.collapse(false, false);
        } else {
          //重新计算当前折叠图标
          me.ui.updateExpandIcon();
        }

        if (!me.firstChild && !me.isHiddenRoot()) {
          me.childrenRendered = false;
        }
      }

      return node;
    },

    /**
     * 重写插入节点
     */
    insertBefore: function(node, refNode) {
      var me = this,
        newNode;
      if (!node.render) {
        node = me.getLoader().createNode(node);
      }

      newNode = me.callParent(arguments);

      if (newNode && refNode && me.childrenRendered) {
        node.render();
      }

      me.ui.updateExpandIcon();
      return newNode;
    },

    /**
     * 设置节点文本
     */
    setText: function(text) {
      var me = this,
        oldText = me.text;
      me.text = me.attributes.text = text;

      //调用ui更新
      if (me.rendered) {
        me.ui.onTextChange(me, text, oldText);
      }

      me.fire('textchange', me, text, oldText);
    },

    /**
     * 设置图标classname
     */
    setIconCls: function(cls) {
      var me = this,
        old = me.attributes.iconCls;
      me.attributes.iconCls = cls;
      if (me.rendered) {
        me.ui.onIconClsChange(me, cls, old);
      }
    },

    /**
     * 设置快捷提示
     */
    setTooltip: function(tip, title) {
      var me = this;

      me.attributes.qtip = tip;
      me.attributes.qtipTitle = title;
      if (me.rendered) {
        me.ui.onTipChange(me, tip, title);
      }
    },
    /**
     * 设置图标
     */
    setIcon: function(icon) {
      var me = this;
      me.attributes.icon = icon;
      if (me.rendered) {
        me.ui.onIconChange(me, icon);
      }
    },

    /**
     * 设置链接
     */
    setHref: function(href, target) {
      var me = this;
      me.attributes.href = href;
      me.attributes.hrefTarget = target;
      if (me.rendered) {
        me.ui.onHrefChange(me, href, target);
      }
    },

    setCls: function(cls) {
      var me = this,
        old = me.attributes.cls;
      me.attributes.cls = cls;

      if (me.rendered) {
        me.ui.onClsChange(me, cls, old);
      }
    },

    /**
     * 选中当前节点
     */
    select: function() {
      var me = this,
        tree = me.getOwnerTree();
      if (tree) {
        tree.getSelectionModel().select(me);
      }
    },
    /**
     * 取消选中
     */
    unselect: function(silent) {
      var tree = this.getOwnerTree();
      if (tree) {
        tree.getSelectionModel().unselect(this, silent);
      }
    },

    /**
     * 判断节点是否选中
     */
    isSelected: function() {
      var tree = this.getOwnerTree();
      return tree ? tree.getSelectionModel().isSelected(this) : false;
    },

    /**
     * 展开
     */
    expand: function(deep, anim, callback, scope) {
      var me = this;

      anim = false; //没办法 不支持动画
      if (!me.expanded) { //已展开
        if (me.fire('beforeexpand', me, deep, anim) === false) {
          return;
        }

        //如果子节点未呈现 绘制子节点
        if (!me.childrenRendered) {
          me.renderChildren();
        }

        me.expanded = true;

        if (!me.isHiddenRoot() && (me.getOwnerTree().animate && anim !== false) || anim) {
          //动画展开
          alert('动画展开');
          return;
        } else {
          //dom展开
          me.ui.expand();
          me.fire('expand', me);
          me.runCallback(callback, scope || me, [me]);
        }
      } else {
        me.runCallback(callback, scope || me, [me]);
      }

      //深度展开
      if (deep === true) {
        me.expandChildNodes(true);
      }
    },

    /**
     * 运行回调函数
     */
    runCallback: function(callback, scope, args) {
      if (Q.isFunction(callback)) {
        callback.apply(scope, args);
      }
    },

    /**
     * 根节点是否隐藏
     */
    isHiddenRoot: function() {
      return this.isRoot && !this.getOwnerTree().rootVisible;
    },

    /**
     * 折叠
     */
    collapse: function(deep, anim, callback, scope) {
      var me = this;
      //已展开 且根未隐藏
      if (me.expanded && !me.isHiddenRoot()) {
        if (me.fire('beforecollapse', me, deep, anim) === false) {
          return;
        }

        me.expanded = false;

        if ((me.getOwnerTree().animate && anim !== false) || anim) {
          //动画折叠
          alert('动画折叠');
          return;
        } else {
          me.ui.collapse();
          me.fire('collapse', me);
          me.runCallback(callback, scope || me, [me]);
        }
      } else if (!me.expanded) { //如果未展开 直接调用回调
        me.runCallback(callback, scope || me, [me]);
      }

      //深度折叠 全部子节点
      if (deep === true) {
        var cs = me.childNodes;

        for (var i = 0, len = cs.length; i < len; i++) {
          cs[i].collapse(true, false);
        }
      }
    },

    /**
     * 延迟展开
     */
    delayedExpand: function(delay) {
      var me = this;
      if (!me.expandProcId) {
        me.expandProcId = Q.delay(me.expand, me, delay);
      }
    },

    /**
     * 取消延迟展开
     */
    cancelExpand: function() {
      var me = this;

      if (me.expandProcId) {
        clearTimeout(me.expandProcId);
      }
      me.expandProcId = false;
    },

    /**
     * 折叠展开 切换
     */
    toggle: function() {
      var me = this;
      if (me.expanded) {
        me.collapse();
      } else {
        me.expand();
      }
    },

    /**
     * 确保所有的父节点都处于展开状态
     */
    ensureVisible: function(callback, scope) {
      var me = this,
        tree = me.getOwnerTree(),
        cb;

      cb = Q.proxy(me, function() {
        var node = tree.getNodeById(me.id); // Somehow if we don't do this, we lose changes that happened to node in the meantime
        tree.getTreeEl().scrollChildIntoView(node.ui.anchor);
        me.runCallback(callback, scope || me, [me]);
      });

      tree.expandPath(
        me.parentNode ? me.parentNode.getPath() : me.getPath(),
        false, cb);
    },

    /**
     * 展开所有子节点
     */
    expandChildNodes: function(deep, anim) {
      var cs = this.childNodes,
        i, len = cs.length;

      for (i = 0; i < len; i++) {
        cs[i].expand(deep, anim);
      }
    },

    /**
     * 折叠所有子节点
     */
    collapseChildNodes: function(deep) {
      var cs = this.childNodes;

      for (var i = 0, len = cs.length; i < len; i++) {
        cs[i].collapse(deep);
      }
    },

    /**
     * 禁用
     */
    disable: function() {
      var me = this;
      me.disabled = true;
      me.unselect();
      if (me.rendered && me.ui.onDisableChange) {
        me.ui.onDisableChange(me, true);
      }
      me.fire('disabledchange', me, true);
    },

    /**
     * 恢复
     */
    enable: function() {
      var me = this;
      me.disabled = false;
      if (me.rendered && me.ui.onDisableChange) {
        me.ui.onDisableChange(me, false);
      }
      me.fire('disabledchange', me, false);
    },

    /**
     * 呈现子节点
     */
    renderChildren: function(suppressEvent) {
      var me = this;
      if (suppressEvent !== false) {
        me.fire('beforechildrenrendered', me);
      }
      var cs = me.childNodes;

      for (var i = 0, len = cs.length; i < len; i++) {
        cs[i].render(true);
      }

      me.childrenRendered = true;
    },

    /**
     * 重写排序 在节点排序后重新整理dom结构
     */
    sort: function(fn, scope) {
      var me = this,
        cs, i, len;

      me.callParent(arguments);

      //如果已完成子节点绘制 重新整理dom结构
      if (me.childrenRendered) {

        cs = me.childNodes;

        for (i = 0, len = cs.length; i < len; i++) {
          cs[i].render(true);
        }
      }
    },

    /**
     * 如果bulkRender为true则按节点顺序生成
     */
    render: function(bulkRender) {
      var me = this;
      //绘制UI
      me.ui.render(bulkRender);
      if (!me.rendered) {
        me.getOwnerTree().registerNode(me);
        me.rendered = true;

        if (me.expanded) { //如果初始化的时候要求展开节点
          me.expanded = false;
          me.expand(false, false);
        }
      }
    },

    /**
     * 生成占位符
     */
    renderIndent: function(deep, refresh) {
      var me = this,
        cs, i, len;

      if (refresh) {
        //刷新 清空子缩进缓存
        me.ui.childIndent = null;
      }

      me.ui.renderIndent();

      //深度  子节点已完成绘制
      if (deep === true && me.childrenRendered) {
        cs = me.childNodes;

        for (i = 0, len = cs.length; i < len; i++) {
          cs[i].renderIndent(true, refresh);
        }
      }
    },

    /**
     * 这两个方法主要在loader中调用
     * 起始编辑 将子节点设置为未绘制
     */
    beginUpdate: function() {
      this.childrenRendered = false;
    },

    /**
     * 结束编辑 如果当前节点为展开 绘制子节点
     */
    endUpdate: function() {
      var me = this;
      if (me.expanded && me.rendered) {
        me.renderChildren();
      }
    },

    //inherit docs
    destroy: function(silent) {
      var me = this;
      if (silent === true) {
        me.unselect(true);
      }
      me.callParent(arguments);
      Q.destroy(me.ui, me.loader);
      me.ui = me.loader = null;
    },

    /**
     * ID变更
     */
    onIdChange: function(id) {
      this.ui.onIdChange(id);
    }
  });

  TreeNode.prototype.defaultUI = TreeNodeUI;

  return TreeNode;
});