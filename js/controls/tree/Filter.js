/**
 *
 * @authors 熊洋 (xywindows@gmail.com)
 * @date    2014-05-01 00:21:02
 * @description 节点过滤
 */
define(function() {
  var TreeFilter;

  TreeFilter = Q.Class.define({

    type: 'TreeFilter',

    /**
     * 过滤时如果没穿入值是否执行清空
     * @type {Boolean}
     */
    clearBlank: false,

    /**
     * 反转 隐藏的是过滤函数返回true的节点
     * @type {Boolean}
     */
    reverse: false,

    /**
     * 每一次过滤是否自动清除前一次的过滤信息
     * @type {Boolean}
     */
    autoClear: false,

    /**
     * 是否从dom中删除过滤的节点
     * @type {Boolean}
     */
    remove: false,

    init: function(tree, config) {
      var me = this;
      me.tree = tree;
      me.filtered = {};
      Q.extend(me, config);
    },

    /**
     * 使用指定的参数过滤数据。
     * @param  {string|RegExp} 		value     		值
     * @param  {string} 			attr      		属性名称
     * @param  {TreeNode} 			startNode 		起始节点
     */
    filter: function(value, attr, startNode) {
      var me = this,
        grepFn, vlen;
      attr = attr || 'text';

      if (typeof value == "string") {
        vlen = value.length;

        //过滤值为空
        if (vlen == 0 && me.clearBlank) {
          me.clear();
          return;
        }

        //小写
        value = value.toLowerCase();
        grepFn = function(node) {
          return node.attributes[attr].substr(0, vlen).toLowerCase() == value;
        };
      } else if (value.exec) { //正则表达式
        grepFn = function(node) {
          return value.test(node.attributes[attr]);
        };
      } else {
        throw 'Illegal filter type, must be string or regex';
      }
      me.filterBy(grepFn, null, startNode);
    },

    //过滤
    filterBy: function(fn, scope, startNode) {
      var me = this,
        af, rv, cascadeFn;
      //如果没有起始节点 则为根
      startNode = startNode || me.tree.root;

      if (me.autoClear) {
        me.clear();
      }

      af = me.filtered;
      rv = me.reverse;
      cascadeFn = function(node) {
        /**
         * 返回false 终止在此节点的子节点的递归
         */
        if (node == startNode) {
          return true;
        }

        if (af[node.id]) {
          return false;
        }

        var isMatch = fn.call(scope || node, node);

        if (!isMatch || rv) {
          af[node.id] = node;
          node.ui.hide();
          return false;
        }
        return true;
      };

      startNode.cascade(cascadeFn);

      //从dom中删除过滤的节点
      if (me.remove) {
        for (var id in af) {

          if (typeof id != 'function') {
            var node = af[id];
            if (node && node.parentNode) {
              node.parentNode.removeChild(node);
            }
          }

        }
      }

    },

    /**
     * 清空过滤 恢复到过滤之前的状态
     */
    clear: function() {
      var me = this,
        tree = me.tree,
        af = me.filtered,
        id, node;

      for (id in af) {
        if (typeof id != 'function') {
          node = af[id];
          if (node) {
            node.ui.show();
          }
        }
      }

      me.filtered = {};
    }
  });

  return TreeFilter;
})