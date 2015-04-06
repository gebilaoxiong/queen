/**
 *
 * @authors 熊洋 (xywindows@gmail.com)
 * @date    2014-05-02 13:53:57
 * @description 根节点UI
 */
define(['tree/NodeUI'], function(TreeNodeUI) {

  var RootTreeNodeUI;

  RootTreeNodeUI = Q.Class.define(TreeNodeUI, {

    type: 'RootTreeNodeUI',

    render: function() {
      var me = this,
        targetNode;
      if (!me.rendered) {
        targetNode = me.node.ownerTree.innerCt.dom;

        //无法折叠 展开
        me.node.expanded = true;

        targetNode.innerHTML = '<div class="x-tree-root-node"></div>';
        me.wrap = me.ctNode = targetNode.firstChild;
      }
    },

    collapse: Q.noop,

    expand: Q.noop
  });

  return RootTreeNodeUI;
});