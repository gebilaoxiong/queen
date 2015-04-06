/**
 *
 * @authors 熊洋 (xywindows@gmail.com)
 * @date    2015-03-19 22:37:41
 * @description
 */
define([
  'data/store/Store'
], function(Store) {

  var GroupingStore;

  GroupingStore = Q.Class.define(Store, {

    /*是否开启服务器分组*/
    remoteGroup: false,

    /*为true时 当分组操作时,将在分组的字段上对数据进行排序*/
    groupOnSort: false,

    /*分组排序方式 默认升序  降序DESC*/
    groupDir: 'ASC',

    /**
     * 重写settings
     */
    init: function(settings) {

      //调用基类方法
      me.callParent(arguments);

      me.applyGroupField();
    },

    /**
     * 重写初始化排序数组
     * 如果分组条件存在 加入
     */
    initSortable: function() {
      var me = this,
        sorters;

      if (me.groupField) {
        sorters = me.sorters || [];

        sorters.unshift({
          property: me.groupField,
          direction: me.groupDir
        });
      }

      me.callParent(arguments);
    },

    /**
     * 清空分组
     */
    clearGrouping: function() {
      var me = this,
        lastOptions;

      //清除分组字段
      me.groupField = false;

      //如果开启了远程分组
      if (me.remoteGroup) {

        if (me.baseParams) {
          delete me.baseParams.groupBy;
          delete me.baseParams.groupDir;
        }

        lastOptions = me.lastOptions;

        if (lastOptions && lastOptions.params) {
          delete lastOptions.params.groupBy;
          delete lastOptions.params.groupDir;
        }

      } else {
        me.sort();
        me.fire('datachanged', me);
      }
    },

    /**
     * 分组
     */
    groupBy: function(field, forceRegroup, direction) {
      var me = this;

      direction = direction ?
        (String(direction).toUpperCase() == 'DESC' ? 'DESC' : 'ASC') :
        me.groupDir;

      //排序信息没有变更 且不为强制分组
      if (me.groupField == field && me.groupDir == direction && !forceRegroup) {
        return;
      }


    }

  });

  return GroupingStore;
})