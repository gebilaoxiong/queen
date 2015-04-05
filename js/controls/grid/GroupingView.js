/**
 *
 * @authors 熊洋 (xywindows@gmail.com)
 * @date    2015-03-15 21:58:53
 * @description 分组表格视图
 */
define([
  'grid/GridView',
  'util/Template'
], function(GridView, Template) {

  var GroupingView;

  GroupingView = Q.Class.define(GridView, {

    type: 'GroupingView',

    //根据一列分组时显示在grid头部菜单中的文本(默认值为 'Group By This Field'). 
    groupByText: 'Group By This Field',

    //启用或禁用分组时显示在grid头部的文本(默认值为 'Show in Groups')。 
    showGroupsText: 'Show in Groups',

    //如果为true则隐藏当前已分组的列 (默认为 false) 
    hideGroupedColumn: false,

    //如果为 true 则在分组首行的字段值前显示前缀和':'，
    //该前缀由为每个分组在  groupName 组成 (如果没有提供，则用已配置的 header ) (默认为 true)。 
    showGroupName: true,

    //视图初始化完毕的时候是否默认折叠
    startCollapsed: false,

    //是否启用分组
    enableGrouping: true,

    //是否开启分组菜单
    enableGroupingMenu: true,

    //是否允许用户在菜单中关闭分组
    enableNoGroups: true,

    //当有一个空的分组值时显示的文本 (默认为'(None)')。
    emptyGroupText: '(None)',

    //当为true时，跳过添加新纪录时刷新视图的操作。(默认为 false) 
    ignoreAdd: false,

    //分组文本模板
    groupTextTpl: '{text}',

    //指示如何构建分组的标识符，
    //'value'使用raw value作为id，'display'使用rendered value 作为id，默认为'value'。
    groupMode: 'value',

    //切换的时候是否停止编辑
    cancelEditOnToggle: true,

    initTemplates: function() {
      var me = this,
        selectionModel,
        tmp;

      //初始化基类模板
      me.callParent(arguments);

      selectionModel = me.grid.getSelectionModel();
      //根据selectionModel绑定相应的选中事件
      selectionModel.bind(
        selectionModel.selectRow ? 'beforerowselect' : 'beforecellselect',
        me.onBeforeRowSelect,
        me);

      if (!me.startGroup) {
        me.startGroup = new Template(['<div id="{groupId}" class="x-grid-group {cls}">',
          '<div id="{groupId}-hd" class="x-grid-group-hd" style="{style}"><div class="x-grid-group-title">', this.groupTextTpl, '</div></div>',
          '<div id="{groupId}-bd" class="x-grid-group-body">'
        ].join(''));
      }

      if (!this.endGroup) {
        this.endGroup = '</div></div>';
      }
    },

    /**
     * 查找当前组的元素
     */
    findGroup: function(el) {
      return Q.fly(el).parentUntil('.x-grid-group', this.mainBody.dom, true);
    },

    /**
     * 获取所有组的元素
     */
    getGroups: function() {
      return this.hasRows() ? this.mainBody.dom.childNodes : [];
    },

    /**
     * 重写onAdd
     * 添加新数据的时候是否刷新分组
     */
    onAdd: function(store, records, index) {
      var me = this,
        scrollState;

      //是否刷新分组
      if (me.canGroup() && !me.ignoreAdd) {
        //记录滚动条位置
        scrollState = me.getScrollState();
        //触发事件beforeRowsInserted
        me.fire('beforerowsinserted', store, index, index + (records.length - 1));
        //刷新
        me.refresh();
        //恢复滚动条位置
        me.restoreScroll(scrollState);
        //触发事件rowsInserted
        me.fire('rowsinserted', store, index, index + (records.length - 1));
      }
      //没有启用分组
      else if (!me.canGroup()) {
        me.callParent(arguments);
      }

    },

    /**
     * 重写onRemove
     */
    onRemove: function(store, record, index, isUpdate) {
      var me = this,
        row;

      me.callParent(arguments);
      row = document.getElementById(record._groupId);

      if (row && row.childNodes[1].childNodes.length < 1) {
        Q.Element.remove(row);
      }

      me.applyEmptyText();
    },

    /**
     * 重写刷新行
     */
    refreshRow: function(record) {
      var me = this;

      if (me.ds.getCount() == 1) {
        me.refresh();
      } else {
        me.isUpdating = true;
        me.callParent(arguments);
        me.isUpdating = false;
      }
    },

    /**
     * 重写显示菜单前
     * @return {[type]} [description]
     */
    beforeMenuShow: function() {
      var me = this,
        item, items, disabled;

      items = me.hmenu.items;
      //行配置是否禁用分组
      disabled = me.cm.config[me.hdCtxIndex].groupable === false;

      if ((item = items.get('groupBy'))) {
        //开启或禁用分组菜单
        item.setDisabled(disabled);
        //是否选中
        item.setChecked(me.canGroup(), true);
      }
    },

    /**
     * 重写renderUI
     * 添加分组菜单
     */
    renderUI: function() {
      var me = this,
        ret;

      ret = me.callParent(arguments);

      //添加menu
      if (me.enableGroupingMenu && me.hmenu) {
        //分组菜单
        me.hmenu.add('-', {
          itemId: 'groupBy',
          text: me.groupByText,
          handler: me.onGroupByClick,
          scope: me
        });

        //是否允许禁用分组
        if (me.enableNoGroups) {
          me.hmenu.add({
            itemId: 'showGroups',
            text: me.showGroupsText,
            checked: true,
            checkHandler: me.onShowGroupsClick,
            scope: me
          });
        }
        //绑定menu的beforeShow事件  
        //针对column的配置
        me.hmenu.on('beforeshow', me.beforeMenuShow, me);
      }

    },

    /**
     * 重写panel传递过来的dom冒泡事件
     */
    processEvent: function(name, e) {
      var me = this,
        hd, field, prefix,
        groupValue, emptyRe;

      me.callParent(arguments);
      hd = Q.Element.parentUntil(e.target, '.x-grid-group-hd', true);

      if (hd) {
        //感觉这段代码有问题
        field = me.getGroupField();
        prefix = me.getPrefix(field);
        groupValue = hd.id.substring(prefix.length);
        groupValue = groupValue.substr(0, groupValue.length - 3);
        rempty = new RegExp('gp-' + Q.String.escapeRegExp(field) + '--hd');

        if (groupValue || rempty.test(hd.id)) {
          me.grid.fire('group' + name, me.grid, field, groupValue, e);
        }

        if (name == 'mousedown' && e.which) {
          me.toggleGroup(hd.paretNode);
        }
      }
    },

    /**
     * 菜单中的按此列分组点击事件处理函数
     */
    onGroupByClick: function() {
      var me = this,
        grid = me.grid;

      me.enableGrouping = true;
      grid.store.groupBy(me.cm.getDataIndex(me.hdCtxIndex));
      grid.fire('groupchange', grid, grid.store.getGroupState());
      me.beforeMenuShow();
      me.refresh();
    },

    toggleRowIndex: function(rowIndex, expanded) {
      var me = this,
        row;

      if (!me.canGroup()) {
        return;
      }

      row = me.getRow(rowIndex);

      if (row) {
        me.toggleGroup(me.findGroup(row), expanded);
      }
    },

    /**
     * 切换组
     */
    toggleGroup: function(group, expanded) {
      var groupElem = Q.get(group),
        id = Q.String.escapeHtml(groupElem.dom.id);

      expanded = expanded != null ? expanded : groupElem.is('.x-grid-group-collapsed');
      //备忘录模式
      if (me.state[id] !== expanded) {
        if (me.cancelEditOnToggle !== false) {
          me.grid.stopEditing(true);
        }
        me.state[id] = expanded;
        groupElem[expanded ? 'removeClass' : 'addClass']('x-grid-group-collapsed');
      }

    },

    /**
     * 切换所有组
     */
    toggleAllGroups: function(expanded) {
      var me = this,
        groups = me.getGroups(),
        i, len;

      for (i = 0, len = groups.length; i < len; i++) {
        me.toggleGroup(groups[i], expanded);
      }
    },

    /**
     * 展开所有组
     */
    expandAllGroups: function() {
      this.toggleAllGroups(true);
    },

    /**
     * 折叠所有组
     */
    collapseAllGroups: function() {
      this.toggleAllGroups(false);
    },

    /**
     * 获取组的标题
     */
    getGroup: function(value, record, groupRenderer, rowIndex, colIndex, store) {
      var me = this,
        column = me.cm.config[colIndex],
        html = groupRenderer ?
        groupRenderer.call(column.scope, value, {}, record, rowIndex, colIndex, store) :
        String(value);

      if (html === '' || html === '&#160;') {
        html = me.column.emptyGroupText || me.emptyGroupText;
      }
      return html;
    },

    /**
     * 获取分组字段
     * @return {[type]} [description]
     */
    getGroupField: function() {
      return this.grid.store.getGroupState();
    },

    /**
     * 重写renderUI
     */
    afterRenderUI: function() {
      var me = this;

      me.callParent(arguments);

      //添加menu
      if (me.enableGroupingMenu && me.hmenu) {
        //分组菜单
        me.hmenu.add('-', {
          itemId: 'groupBy',
          text: me.groupByText,
          handler: me.onGroupByClick,
          scope: me
        });

        //是否允许禁用分组
        if (me.enableNoGroups) {
          me.hmenu.add({
            itemId: 'showGroups',
            text: me.showGroupsText,
            checked: true,
            checkHandler: me.onShowGroupsClick,
            scope: me
          });
        }


        //绑定menu的beforeShow事件  
        //针对column的配置
        me.hmenu.on('beforeshow', me.beforeMenuShow, me);
      }
    },

    /**
     * 绘制row
     */
    renderRows: function() {
      var me = this,
        groupField = me.getGroupField(),
        eg = !!groupField,
        colIndex, hadLastGroupField,
        oldIndex;

      if (me.hideGroupedColumn) {
        //映射字段
        colIndex = me.cm.findColumnIndex(groupField);

        hasLastGroupField = Q.isDefined(me.lastGroupField);

        //未分组 但是有上一次的分组字段
        if (!eg && hasLastGroupField) {
          me.mainBody.dom.innerHTML = '';
          me.cm.setHidden(me.cm.findColumnIndex(me.lastGroupField), false);
          delete me.lastGroupField;
        }
        //已分组 不存在上次的分组字段
        else if (eg && !hasLastGroupField) {
          me.lastGroupField = groupField;
          me.cm.setHidden(colIndex, true);
        }
        //已分组 且分组字段不同
        else if (eg && hasLastGroupField && groupField !== me.lastGroupField) {
          me.mainBody.dom.innerHTML = '';
          oldIndex = me.findColumnIndex(me.lastGroupField);
        }
      }

      return me.callParent(arguments);
    },

    /**
     * 绘制的主逻辑
     */
    doRender: function(columnDatas, records, store, startRow, colCount, stripe) {
      var me = this;

      if (records.length < 1) {
        return '';
      }

      if (!me.canGroup() || me.isUpdating) {
        return me.callParent(arguments);
      }


      var groupField = me.getGroupField(),
        colIndex = me.cm.findColumnIndex(groupField),
        group,
        groupStyle = 'width:' + me.getTotalWidth() + ';',
        config = me.cm.config[colIndex],
        groupRenderer = config.groupRenderer || config.renderer,
        prefix = me.showGroupName ? (config.groupName || config.header) + ': ' : '',
        groups = [],
        curGroup, i, len, gid;

      for (i = 0, len = records; i < len; i++) {
        var rowIndex = startRow + i,
          record = records[i],
          //获取组的值
          groupValue = record.data[groupField];

        //获取group的标题  
        group = me.getGroup(groupValue, record, groupRenderer, rowIndex, colIndex, store);

        //如果分组不存在
        if (!curGroup || curGroup.group != group) {

          gid = me.constructId(groupValue, groupField, colIndex);

          //记录组的折叠状态
          me.state[gid] = !(Q.isDefined(me.state[gid]) ? !me.state[gid] : me.startCollapsed);
          curGroup = {
            group: group,
            groupValue: groupValue,
            text: prefix + group,
            groupId: gid,
            startRow: rowIndex,
            rs: [record],
            cls: me.state[gid] ? '' : 'x-grid-group-collapsed',
            style: groupStyle
          };

          groups.push(curGroup);
        }
        //分组存在 直接添加
        else {
          curGroup.rs.push(record);
        }

        record._groupId = gid;
      }

      //组装所有组
      var buf = [];

      for (i = 0, len = groups.length; i < len; i++) {
        group = groups[i];
        me.doGroupStart(buf, group, columnDatas, store, colCount);

        buf[buf.length] =
          me.callParent('doRender', [columnDatas, records, store, startRow, colCount, stripe]);

        me.doGroupEnd(buf, group, columnDatas, store, colCount);
      }

      return buf.join('');
    },

    /**
     * 获取组ID
     */
    getGroupId: function(value) {
      var me = this,
        field = me.getGroupField();

      return me.constructId(value, field, me.cm.findColumnIndex(field));
    },

    getGroupId: function(value) {
      var me = this,
        field = me.getGroupField();

      return me.constructId(value, field, me.cm.findColumnIndex(field));
    },

    /**
     * 构建ID
     */
    constructId: function(value, field, index) {
      var me = this,
        config = me.cm.config[index],
        groupRenderer = config.groupRenderer || config.renderer,
        val = me.groupMode == 'value' ? value : me.getGroup(value, {
          data: {}
        }, groupRenderer, 0, index, me.store);

      return me.getPrefix(field) + Q.String.escapeHtml(val);
    },

    /**
     * 判断是支持分组
     */
    canGroup: function() {
      return this.enableGrouping && !!this.getGroupField();
    },

    /**
     * 获取前缀
     */
    getPrefix: function(field) {
      return this.grid.getGridEl().id + '-gp-' + field + '-';
    },

    /**
     * 绘制组开始标签
     */
    doGroupStart: function(buf, group, columnDatas, store, colCount) {
      buf.push(this.startGroup.compile(group));
    },

    doGroupEnd: function(buf, group, columnDatas, store, colCount) {
      buf.push(this.endGroup);
    },

    /**
     * 获取所有组
     */
    getRows: function() {
      var me = this;

      if (!me.canGroup()) {
        return me.callParent(arguments);
      }

      var rows = [],
        groups = me.getGroups(),
        group,
        i = 0,
        len = groups.length,
        j,
        jlen;

      for (; i < len; i++) {
        //获取组body
        if (!(group = groups[i].childNodes[1])) {
          continue;
        }

        //迭代所有row
        group = group.childNodes;
        for (j = 0, jlen = group.length; j < jlen; j++) {
          rows.push(group[j]);
        }

      }

      return rows;
    },

    /**
     * 修正group head宽度  与group body同宽
     */
    updateGroupWidths: function() {
      var me = this,
        totalWidth, groups, i, len;

      if (!me.canGroup() || !me.hasRows()) {
        return;
      }

      totalWidth = Math.max(me.cm.getTotalWidth(), me.el.dom.offsetWidth - me.getScrollOffset()) + 'px';
      groups = me.getGroups();

      for (i = 0, len = groups.length; i < len; i++) {
        groups[i].firstChild.style.width = totalWidth;
      }
    },

    onColumnWidthUpdated: function(column, width, totalWidth) {
      var me = this;

      me.callParent(arguments);
      me.updateGroupWidths();
    },

    onAllColumnWidthsUpdated: function(ws, tw) {
      var me = this;

      me.callParent(arguments);
      me.updateGroupWidths();
    },

    onColumnHiddenUpdated: function(col, hidden, tw) {
      var me = this;

      me.callParent(arguments);
      me.updateGroupWidths();
    },

    onLayout: function() {
      var me = this;

      me.updateGroupWidths();
    },

    onBeforeRowSelect: function(selectionModel, rowIndex) {
      this.toggleRowIndex(rowIndex, true);
    }
  });

  return GroupingView;
})