/**
 *
 * @authors 熊洋 (xywindows@gmail.com)
 * @date    2014-05-01 15:58:20
 * @description
 */
define(['tree/Node', 'tree/AsyncNode'], function(TreeNode, AsyncTreeNode) {
  return {
    node: TreeNode,
    async: AsyncTreeNode
  };
})