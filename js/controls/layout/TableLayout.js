/**
 *
 * @authors 熊洋 (xywindows@gmail.com)
 * @date    2014-03-27 15:00:00
 * @description
 */
define(['layout/ContainerLayout'], function(ContainerLayout) {

  var TableLayout = Q.Class.define(ContainerLayout, {

    monitorResize: false,

    type: 'Table',

    layoutCls: 'x-table-layout-ct',


    tableAttrs: null,

    setHost: function(host) {
      this.callParent(arguments);

      this.currentRow = 0;
      this.currentColumn = 0;
      this.cells = [];
    },

    onLayout: function(host, target) {
      if (!this.table) {
        target.addClass('x-table-layout-ct');

        this.table = target.createChild(Q.extend({
          target: 'table',
          'class': 'x-table-layout',
          cellspacing: 0,
          children: {
            target: 'tbody'
          }
        }, this.tableAttrs)).dom;
      }

      this.renderAll(host, target);
    },

    /*获取行 如果不存在 则添加 并返回*/
    getRow: function(index) {
      var row = this.table.tBodies[0].childNodes[index];

      if (!row) {
        row = document.createElement('tr');
        this.table.tBodies[0].appendChild(row);
      }

      return row;
    },

    getNextCell: function(cmp) {
      var cell = this.getNextNonSpan(this.currentColumn, this.currentRow),
        curCol = this.currentColumn = cell[0],
        curRow = this.currentRow = cell[1],
        rowIndex, colIndex, td, cls;

      for (rowIndex = curRow; rowIndex < curRow + (cmp.rowspan || 1); rowIndex++) {

        if (!this.cells[rowIndex]) {
          this.cells[rowIndex] = [];
        }

        for (colIndex = curCol; colIndex < curCol + (cmp.colspan || 1); colIndex++) {
          this.cells[rowIndex][colIndex] = true;
        }
      }

      td = document.createElement('td');
      if (cmp.cellId) {
        td.id = cmp.cellId;
      }

      cls = 'x-table-layout-cell';

      if (cmp.cellCls) {
        cls += ' ' + cmp.cellCls;
      }

      td.className = cls;

      if (cmp.colspan) {
        td.colSpan = cmp.colspan;
      }

      if (cmp.rowspan) {
        td.rowSpan = cmp.rowspan;
      }

      this.getRow(curRow).appendChild(td);

      return td;
    },

    getNextNonSpan: function(colIndex, rowIndex) {
      var cols = this.columns;

      while ((cols && colIndex >= cols) || // 如果列索引符合返回
        (this.cells[rowIndex] && this.cells[rowIndex][colIndex]) //且单元格存在
      ) {
        if (cols && colIndex >= cols) {
          rowIndex++;
          colIndex = 0;
        } else {
          colIndex++;
        }
      }

      return [colIndex, rowIndex];
    },

    renderItem: function(cmp, position, target) {
      var container;

      if (!this.table) {

        this.table = target.createChild(Q.extend({
          target: 'table',
          'class': 'x-table-layout',
          cellspacing: 0,
          children: {
            target: 'tbody'
          }
        }, this.tableAttrs)).dom;
      }

      if (cmp && !cmp.rendered) {
        cmp.render(this.getNextCell(cmp));
        this.configureItem(cmp);
      } else if (cmp && !this.validParent(cmp, target)) {
        container = this.getNextCell(cmp);
        container.insertBefore(cmp.getPositionEl().dom, null); //为什么是插在前面？
        cmp.container = Q.get(container);
        this.configureItem(cmp);
      }
    },

    validParent: function(cmp, target) {
      return Q.Element.contains(target.dom || target, cmp.getPositionEl().dom);
    },

    destroy: function() {
      delete this.table;
      this.callParent(arguments);
    }
  });

  return TableLayout;
});