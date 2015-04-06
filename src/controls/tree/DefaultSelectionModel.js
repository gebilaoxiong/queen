/**
 *
 * @authors 熊洋 (xywindows@gmail.com)
 * @date    2014-05-02 02:42:10
 * @description 选择模式(单选)
 */
define(['util/Observable'], function(Observable) {

  var DefaultSelectionModel;

  DefaultSelectionModel = Q.Class.define(Observable, {

    type: 'DefaultSelectionModel',

    init: function(config) {
      var me = this;
      me.selNode = null; //选中节点

      Q.extend(me, config);
      me.callParent(arguments);
    },

    /**
     * 初始化
     */
    initialize: function(tree) {
      var me = this;
      me.tree = tree;
      //绑定树的键盘事件
      tree.getTreeEl().on('keydown', me.onKeyDown, me);
      tree.bind('click', me.onNodeClick, me);
    },

    /**
     * 节点点击事件处理函数
     */
    onNodeClick: function(e, node) {
      this.select(node);
    },

    /**
     * 选中节点
     */
    select: function(node, selectNextNode /*private*/ ) {
      var me = this;
      //如果节点已经隐藏了 则选中下一个节点
      if (Q.Element.isHidden(node.ui.wrap) && selectNextNode) {
        return selectNextNode.call(me, node);
      }
      var last = me.selNode; //上次选中的节点

      if (node == last) { //节点未变

        node.ui.onSelectedChange(true);

      } else if (me.fire('beforeselect', me, node, last) !== false) {

        //取消last的选中状态
        if (last && last.ui) {
          last.ui.onSelectedChange(false);
        }

        me.selNode = node;
        node.ui.onSelectedChange(true);
        me.fire('selectionchange', me, node, last);
      }

      return node;
    },
    /**
     * 取消选中
     */
    unselect: function(node, silent) {
      if (this.selNode == node) {
        //清空选中状态
        this.clearSelection(silent);
      }
    },

    /**
     * 清空选中状态
     */
    clearSelection: function(silent) {
      var node = this.selNode;

      if (node) {
        node.ui.onSelectedChange(false);
        this.selNode = null;

        //未静音 触发事件
        if (silent !== true) {
          this.fire('selectionchange', this, null);
        }
      }
    },

    /**
     * 获取选中节点
     */
    getSelectedNode: function() {
      return this.selNode;
    },

    /**
     * 判断节点是否被选中
     */
    isSelected: function(node) {
      return node == this.selNode;
    },

    /**
     * 选中前一个节点
     */
    selectPrevious: function(selNode /*private*/ ) {
      var me = this,
        previousNode, lastChild;

      if (!(selNode = (selNode || me.selNode || me.lastSelNode))) {
        return null;
      }

      //如果前一节点存在
      if (previousNode = selNode.previousSibling) {
        //如果此节点未展开或没有子节点
        if (!previousNode.isExpanded() || previousNode.childNodes.length < 1) {

          return me.select(previousNode, me.selectPrevious);

        } else { //如果previousSibling有子节点则获取他最后一个子节点 
          lastChild = previousNode.lastChild;

          //循环 找到最后一个节点的最后一个节点！！嗯 有点绕口
          while (
            lastChild &&
            lastChild.isExpanded() && !Q.Element.isHidden(lastChild.ui.wrap) &&
            lastChild.childNodes.length > 0) {
            lastChild = lastChild.lastChild;
          }

          return me.select(lastChild, me.selectPrevious);
        }
      } else if (selNode.parentNode && (me.tree.rootVisible || !selNode.parentNode.isRoot)) {
        //如果存在父节点  且 （如果根节点可见 或 父节点不为根节点）这逻辑 霸气。。
        return me.select(selNode.parentNode, me.selectPrevious);
      }

      return null;
    },

    /**
     * 选中后一个节点  在当前元素的子节点方向移动
     */
    selectNext: function(selNode /*private*/ ) {
      var me = this,
        previousNode, lastChild;

      if (!(selNode = (selNode || me.selNode || me.lastSelNode))) {
        return null;
      }

      //（原注释）在这里,我们通过在当前函数选择标明我们的方向移动
      if (selNode.firstChild && selNode.isExpanded() && !Q.Element.isHidden(s.ui.wrap)) {
        return me.select(selNode.firstChild, me.selectNext);
      } else if (selNode.nextSibling) { //如果首子节点不符合要求 那么我们获取下一个兄弟级节点
        return me.select(selNode.nextSibling, me.selectNext);
      } else if (selNode.parentNode) { //实在没招了  往上走
        var newS = null;
        selNode.parentNode.bubble(function() {
          if (me.nextSibling) {
            newS = me.getOwnerTree().selModel.select(me.nextSibling, me.selectNext);
            return false;
          }
        });
        return newS;
      }

      return null;
    },

    /**
     * 键盘事件处理函数
     */
    onKeyDown: function(e) {
      var me = this,
        selNode = me.selNode || me.lastSelNode,
        sm = me;

      if (!selNode) {
        return;
      }

      //处理方向键
      switch (e.which) {
        case 40: //down
          e.preventDefault();
          e.stopPropagation();
          me.selectNext();
          break;
        case 38: //up
          e.preventDefault();
          e.stopPropagation();
          me.selectPrevious();
          break;
        case 39: //right
          e.preventDefault();
          //如果拥有子节点
          if (selNode.hasChildNodes()) {
            if (!selNode.isExpanded()) {
              //如果未展开则展开该节点
              selNode.expand();
            } else if (selNode.firstChild) {
              //选中第一个子节点
              me.select(selNode.firstChild);
            }
          }
          break;
        case 37: //left
          e.preventDefault();
          if (selNode.hasChildNodes() && selNode.isExpanded()) {
            //如果节点未展开 则立马展开！！！
            selNode.collapse();
          } else if (selNode.parentNode && (me.tree.rootVisible || selNode.parentNode != me.tree.getRootNode())) {
            me.select(selNode.parentNode);
          }
          break;

      };
    }

  });

  return DefaultSelectionModel;
});