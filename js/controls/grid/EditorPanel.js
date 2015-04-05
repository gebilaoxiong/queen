define([
  'grid/Panel',
  'grid/selectModel/CellSelectionModel'
], function(GridPanel, CellSelectionModel) {

  var EditorGridPanel = Q.Class.define(GridPanel, {

    type: 'EditorGridPanel',

    /*点击2下进入编辑状态*/
    clicksToEdit: 2,

    /*值为true时，即使是未修改过的值也会去验证(默认值为false) */
    forceValidation: false,

    // private
    isEditor: true,
    // private
    detectEdit: false,

    /*设置为true将对输入的值自动进行HTML编码和解码(默认值为false) */
    autoEncode: false,

    trackMouseOver: false,

    configuration: function() {
      this.callParent(arguments);

      if (!this.selModel) {
        this.selModel = new CellSelectionModel();
      }

      this.activeEditor = null;
    },

    initEvents: function() {
      this.callParent(arguments);

      this.getGridEl().on('mousewheel', Q.proxy(this.stopEditing, this, true));
      this.bind('columnresize', Q.proxy(this.stopEditing, this, true));

      //点击次数 （进编辑编辑状态)
      if (this.clicksToEdit == 1) {
        this.bind("cellclick", this.onCellDblClick, this);
      } else {
        var view = this.getView();

        if (this.clicksToEdit == 'auto' && view.mainBody) {
          view.mainBody.on('mousedown', this.onAutoEditClick, this);
        }

        this.bind('celldblclick', this.onCellDblClick, this);
      }
    },

    onResize: function() {
      this.callParent(arguments);

      var activeEditor = this.activeEditor;
      if (this.editing && activeEditor) {
        activeEditor.realign(true);
      }
    },

    onCellDblClick: function(e, g, row, col) {
      this.startEditing(row, col);
    },

    onAutoEditClick: function(e, t) {
      if (e.which !== 1) {
        return;
      }

      var row = this.view.findRowIndex(t),
        col = this.view.findCellIndex(t);

      if (row !== false && col !== false) {

        this.stopEditing();

        if (this.selModel.getSelectedCell) { // cell sm
          var sc = this.selModel.getSelectedCell();
          if (sc && sc[0] === row && sc[1] === col) {
            this.startEditing(row, col);
          }
        } else {
          if (this.selModel.isSelected(row)) {
            this.startEditing(row, col);
          }
        }

      }
    },

    onEditComplete: function(e, ed, value, startValue) {
      var me = this,
        record, field, eventObject;

      me.editing = false;
      me.lastActiveEditor = me.activeEditor;
      me.activeEditor = null;

      record = ed.record;
      field = me.colModel.getDataIndex(ed.col);
      delete ed.ownerCt;


      value = me.postEditValue(value, startValue, record, field);


      if (me.forceValidation === true || String(value) !== String(startValue)) {
        eventObject = {
          grid: me,
          record: record,
          field: field,
          originalValue: startValue,
          value: value,
          row: ed.row,
          column: ed.col,
          cancel: false
        };
        if (me.fire("validateedit", eventObject) !== false && !eventObject.cancel && String(value) !== String(startValue)) {
          record.set(field, eventObject.value);
          delete eventObject.cancel;
          me.fire("afteredit", eventObject);
        }
      }

      me.view.focusCell(ed.row, ed.col);
    },

    startEditing: function(row, col) {
      this.stopEditing();

      if (this.colModel.isCellEditable(col, row)) {

        this.view.ensureVisible(row, col, true);

        var r = this.store.getAt(row),
          field = this.colModel.getDataIndex(col),
          e = {
            grid: this,
            record: r,
            field: field,
            value: r.data[field],
            row: row,
            column: col,
            cancel: false
          };

        if (this.fire("beforeedit", e) !== false && !e.cancel) {
          this.editing = true;

          var ed = this.colModel.getCellEditor(col, row);
          ed.ownerCt = this;

          if (!ed) {
            return;
          }

          if (!ed.rendered) {
            ed.parentEl = this.view.getEditorParent(ed);
            ed.bind({
              scope: this,
              render: {
                fn: function(e, c) {
                  c.field.focus(false, true);
                },
                single: true,
                scope: this
              },
              /*
							specialkey: function(e, field, domEvent) {
								this.getSelectionModel().onEditorKey(field, domEvent);
							},*/
              complete: this.onEditComplete,
              canceledit: Q.proxy(this.stopEditing, this, true)
            });

          }

          Q.extend(ed, {
            row: row,
            col: col,
            record: r
          });

          this.lastEdit = {
            row: row,
            col: col
          };

          this.activeEditor = ed;

          if (ed.field.isXType('checkbox')) {
            ed.allowBlur = false;
            this.setupCheckbox(ed.field);
          }
          // Set the selectSameEditor flag if we are reusing the same editor again and
          // need to prevent the editor from firing onBlur on itself.
          ed.selectSameEditor = (this.activeEditor == this.lastActiveEditor);
          var v = this.preEditValue(r, field);
          ed.startEdit(this.view.getCell(row, col).firstChild, v != undefined ? v : '');

          // Clear the selectSameEditor flag

          setTimeout(function() {
            delete ed.selectSameEditor;
          }, 50);
        }
      }
    },

    setupCheckbox: function(field) {
      var me = this,
        fn = function() {
          field.el.bind('click', me.onCheckClick, me, {
            single: true
          });
        };

      if (field.rendered) {
        fn();
      } else {
        field.bind('render', fn, null, {
          single: true
        });
      }
    },

    onCheckClick: function() {
      var ed = this.activeEditor;
      ed.allowBlur = true;
      ed.field.focus(false, 10);
    },

    // private
    preEditValue: function(r, field) {
      var value = r.data[field];
      return this.autoEncode && Q.isString(value) ? Q.String.unenscapeHtml(value) : value;
    },

    // private
    postEditValue: function(value, originalValue, r, field) {
      return this.autoEncode && Q.isString(value) ? Q.String.escapeHtml(value) : value;
    },

    stopEditing: function(cancel) {
      if (this.editing) {
        // Store the lastActiveEditor to check if it is changing
        var ae = this.lastActiveEditor = this.activeEditor;
        if (ae) {
          ae[cancel === true ? 'cancelEdit' : 'completeEdit']();
          this.view.focusCell(ae.row, ae.col);
        }
        this.activeEditor = null;
      }
      this.editing = false;
    }


  });

  return EditorGridPanel;
});