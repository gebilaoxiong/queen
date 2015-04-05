define([
  'grid/selectModel/RowSelectionModel'
], function(RowSelectionModel) {

  var CheckboxSelectionModel,

    rowCheckModel = '<div class="x-grid-row-checker">&#160;</div>';

  CheckboxSelectionModel = Q.Class.define(RowSelectionModel, {

    header: '<div class="x-grid-hd-checker">&#160;</div>',

    width: 20,

    sortable: false,

    // private
    menuDisabled: true,
    fixed: true,
    hideable: false,
    dataIndex: '',
    id: 'checker',
    isColumn: true,

    init: function() {
      this.callParent(arguments);

      if (this.checkOnly) {
        this.handleMouseDown = Q.noop;
      }
    },

    initEvents: function() {
      this.callParent(arguments);
      this.grid.bind('render', function() {
        Q.fly(this.grid.getView().innerHd).on('mousedown', this.onHdMouseDown, this);
      }, this);
    },

    processEvent: function(name, e, grid, rowIndex, colIndex) {
      if (name == 'mousedown') {
        this.onMouseDown(e);
        return false;
      } else {
        return this.fire(name, this, grid, rowIndex, e);
      }
    },

    onMouseDown: function(e) {
      var target = e.target,
        row,
        index;

      if (e.which === 1 && target.className == 'x-grid-row-checker') {
        e.stopPropagation();
        e.preventDefault();

        row = Q.Element.parentUntil(target, '.x-grid-row');

        if (row) {
          index = row.rowIndex;

          if (this.isSelected(index)) {
            this.deselectRow(index);
          } else {
            this.selectRow(index, true);
            this.grid.getView().focusRow(index);
          }
        }
      }
    },

    onHdMouseDown: function(e) {
      var target = e.target,
        hd, isChecked;

      if (target.className == 'x-grid-hd-checker') {
        e.stopPropagation();
        e.preventDefault();
        hd = Q.fly(target.parentNode);
        isChecked = hd.hasClass('x-grid-hd-checker-on');

        if (isChecked) {

          hd.removeClass('x-grid-hd-checker-on');
          this.clearSelections();

        } else {

          hd.addClass('x-grid-hd-checker-on');
          this.selectAll();

        }
      }
    },

    // private
    renderer: function(v, p, record) {
      return rowCheckModel;
    },

    onEditorSelect: function(row, lastRow) {
      if (lastRow != row && !this.checkOnly) {
        this.selectRow(row);
      }
    }

  });

  return CheckboxSelectionModel;
});