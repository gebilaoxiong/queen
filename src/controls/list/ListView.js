/**
 *
 * @authors 熊洋 (xywindows@gmail.com)
 * @date    2014-04-09 01:42:58
 * @description
 */
define([
  'controls/DataView',
  'util/Template',
  'list/Column',
  'list/DateColumn',
  'list/BooleanColumn',
  'list/NumberColumn'
], function(DataView, Template, Column, DateColumn, BooleanColumn, NumberColumn) {

  var ListView, columnsDir;

  ListView = Q.Class.define(DataView, {

    /*节点选择符*/
    itemSelector: 'dl',

    /*节点选中cls*/
    selectedClass: 'x-list-selected',

    /*悬停cls*/
    overClass: 'x-list-over',

    /*为scrollbar留出的空间数值，(默认为 undefined)，如果没有指定一个确切值，则将自动计算。*/
    scrollOffset: 20,

    /*
		
		reserveScrollOffset : Boolean 
			默认将延迟10毫秒解释配置的 scrollOffset 。
			指定 true以立即解释配置的 scrollOffset 。 
		*/

    columnResize: true,

    columnSort: true,

    maxColumnWidth: Q.Browser.ie ? 99 : 100,

    initComponent: function() {
      var me = this,
        cs, allocatedWidth, //已用宽度百分比
        colsWithWidth, columns, i, column,
        columnType, len, remaining, //剩余列数
        preCol;

      if (me.columnResize) { //列拖拽

      }
      if (me.columnSort) { //列排序

      }

      if (!me.internalTpl) {
        /*头部模板*/
        me.internalTpl = new Template([
          '<div class="x-list-header clearfix"><div class="x-list-header-inner">',
          '<%var i=0,column;while(column=columns[i++]){%>',
          '<div style="width:<%=column.width*100;%>%;text-align:<%=column.align%>;"><em class="x-unselectable" unselectable="on" id="', this.id, '-xlhd-<%=i%>">',
          '<%=column.header%>',
          '</em></div>',
          '<%}%>',
          '<div class="x-clear"></div>',
          '</div></div>',
          '<div class="x-list-body"><div class="x-list-body-inner">',
          '</div></div>'
        ]);
      }

      if (!me.tpl) {
        me.tpl = new Template([
          '<%var i=0,row;while(row=$root.rows[i++]){%>',
          '<dl class="x-list-view-item">',
          '<%var n=0,column;while(column=$root.columns[n++]){%>',
          '<dt style="width:<%=column.width*100;%>%;text-align:<%=column.align%>;">',
          '<em unselectable="on" <%if(column.cls){%> class="<%=column.cls%>"<%}%>>',
          '<%=column.tpl.compile(row)%>',
          '</em></dt>',
          '<%}%>',
          '<div class="x-clear"></div>',
          '</dl>',
          '<%}%>',
        ]);
      }

      cs = me.columns;
      allocatedWidth = 0; //分配的宽度
      colsWithWidth = 0;
      columns = [];
      i = 0;

      while (column = cs[i++]) {
        if (!column.isColumn) { //配置对象实例化

          if (Q.isString(column.xtype)) {
            column.xtype = columnsDir[column.xtype];
          }

          //默认
          if (column.xtype == undefined) {
            column.xtype = columnsDir.column;
          }

          if (Q.isFunction(column.xtype)) {
            columnType = column.xtype;
            delete column.xtype;

            column = new columnType(column);
          }
        }

        if (column.width) {
          allocatedWidth += column.width * 100;
          if (allocatedWidth > me.maxColumnWidth) {
            column.width -= (allocatedWidth - me.maxColumnWidth) / 100;
          }
          colsWithWidth++;
        }


        columns.push(column);
      }

      cs = me.columns = columns;
      len = cs.length;

      if (colsWithWidth < len) {
        //计算剩余列
        remaining = len - colsWithWidth;

        if (allocatedWidth < me.maxColumnWidth) {
          //宽度百分比计算公式：(100-有width的列占用的百分比)/剩余列数
          preCol = ((me.maxColumnWidth - allocatedWidth) / remaining) / 100;
          i = 0;

          while (column = cs[i++]) {
            if (!column.width) {
              column.width = preCol;
            }
          }
        }

      }

      this.callParent(arguments);

    },

    onRender: function() {
      var me = this;

      me.autoCreate = {
        'class': 'x-list-wrap'
      };

      me.callParent(arguments);

      me.el.dom.innerHTML = me.internalTpl.compile({
        columns: me.columns
      });

      me.innerBody = Q.get(me.el.dom.childNodes[1].firstChild);
      me.innerHd = Q.get(me.el.dom.firstChild.firstChild);

      if (me.hideHeaders) {
        me.el.dom.firstChild.style.display = 'none';
      }
    },

    getTemplateTarget: function() {
      return this.innerBody;
    },

    /**
     * tpl模板参数
     */
    collectData: function() {
      var rs = this.callParent(arguments);
      return {
        columns: this.columns,
        rows: rs
      };
    },

    verifyInternalSize: function() {
      var me = this;
      if (me.lastSize) {
        me.onResize(me.lastSize.width, me.lastSize.height);
      }
    },
    onResize: function(width, height) {
      var me = this,
        body = me.innerBody.dom,
        header = me.innerHd.dom,
        scrollWidth = width - me.scrollOffset + 'px',
        parentNode;

      if (!body) {
        return;
      }

      parentNode = body.parentNode;

      if (Q.isNumber(width)) {
        if (me.reserveScrollOffset || ((parentNode.offsetWidth - parentNode.clientWidth) > 10)) {
          body.style.width = scrollWidth;
          header.style.width = scrollWidth;
        } else {
          body.style.width = width + 'px';
          header.style.width = width + 'px';

          setTimeout(function() {
            if ((parentNode.offsetWidth - parentNode.clientWidth) > 10) {
              body.style.width = scrollWidth;
              header.style.width = scrollWidth;
            }
          }, 10);
        }
      }
      if (Q.isNumber(height)) {
        parentNode.style.height = Math.max(0, height - header.parentNode.offsetHeight) + 'px';
      }
    },
    updateIndexes: function() {
      this.callParent(arguments);
      this.verifyInternalSize();
    },

    findHeaderIndex: function(header) {
      header = header.dom || header;
      var parentNode = header.parentNode,
        children = parentNode.parentNode.childNodes,
        i = 0,
        c;
      for (; c = children[i]; i++) {
        if (c == parentNode) {
          return i;
        }
      }
      return -1;
    },

    setHdWidths: function() {
      var els = this.innerHd.dom.getElementsByTagName('div'),
        i = 0,
        columns = this.columns,
        len = columns.length;

      for (; i < len; i++) {
        els[i].style.width = (columns[i].width * 100) + '%';
      }
    }
  });

  columnsDir = {
    column: Column,
    date: DateColumn,
    number: NumberColumn,
    bool: BooleanColumn
  }

  return ListView;
});