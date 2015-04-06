define([
  'form/Field',
  'form/Checkbox',
  'controls/Container',
  'layout/ColumnLayout',
  'layout/FormLayout'
], function(field, checkbox, _container, ColumnLayout, FormLayout) {

  var CheckboxGroup = Q.Class.define(field, {

    type: 'CheckboxGroup',

    /*列数量*/
    columns: 'auto',

    vertical: false,

    allowBlank: true,

    blankText: '至少选择一项',

    groupCls: 'x-form-check-group',

    configuration: function() {
      this.defaultType = checkbox; //默认子控件

      this.callParent(arguments);
    },

    onRender: function(container, position) {
      var panelCfg, colCfg;

      if (!this.el) {

        panelCfg = {
          autoCreate: {
            id: this.id
          },
          cls: this.groupCls,
          layout: ColumnLayout,
          renderTo: container,
          resizeDelay: false
        };

        colCfg = {
          xtype: _container,
          defaultType: this.defaultType,
          layout: FormLayout,
          defaults: {
            hideLabel: true,
            anchor: '100%'
          }
        };

        if (this.items[0].items) {

          Q.extend(panelCfg, {
            layoutConfig: {
              columns: this.items.count()
            },
            defaults: this.defaults,
            items: this.items
          });

          this.items.each(function() {
            Q.extend(this, colCfg);
          });

        } else {
          var numCols, cols = [];

          if (typeof this.columns == 'string') {
            this.columns = this.items.length;
          }

          //columns:5
          if (!Q.isArray(this.columns)) {
            var columns = [];

            for (var i = 0; i < this.columns; i++) {
              columns.push(100 / this.columns * .01);
            }

            this.columns = columns;
          }

          numCols = this.columns.length;

          var columnCfg;


          Q.each(this.columns, function(_, col) {
            columnCfg = Q.extend({
              items: []
            }, colCfg);

            columnCfg[col <= 1 ? 'columnWidth' : 'width'] = col;

            if (this.defaults) {
              columnCfg.defaults = Q.extend(columnCfg.defaults || {}, this.defaults);
            }
            cols.push(columnCfg);
          }, this);

          //vertical
          if (this.vertical) {
            var rows = Math.ceil(this.items.length / numCols),
              ri = 0;

            Q.each(this.items, function(index, item) {

              if (index > 0 && index % rows == 0) {
                ri++;
              }

              if (item.fieldLabel) {
                item.hideLabel = false;
              }

              cols[ri].items.push(item);

            }, this);

          } else {

            Q.each(this.items, function(index, item) {
              var ci = index % numCols;

              if (item.fieldLabel) {
                item.hideLabel = false;
              }

              cols[ci].items.push(item);
            }, this);

          }

          Q.extend(panelCfg, {
            layoutConfig: {
              columns: numCols
            },
            items: cols
          });

        }

        this.panel = new _container(panelCfg);
        this.panel.ownerCt = this;
        this.el = this.panel.getEl();

        this.items = this.panel.items.grep(function() {
          return this.isFormField == true;
        });
      }

      this.callParent(arguments);
    },


    initValue: function() {
      if (this.value) {
        this.setValue(this.buffered ? this.value : [this.value]);
        delete this.buffered;
        delete this.value;
      }
    },

    initEvents: function() {
      this.callParent(arguments);

      this.items.each(function(index, item) {
        item.on('check', this.fireChecked, this);
        item.inGroup = true;
      }, this)
    },

    fireChecked: function() {
      var ret = [];

      this.items.each(function() {
        if (this.checked) {
          ret.push(this);
        }
      });

      this.fire('change', this, ret);
    },

    doLayout: function() {
      if (this.rendered) {
        this.panel.forceLayout = this.ownerCt.forceLayout;
        this.panel.doLayout();
      }
    },

    getErrors: function() {
      var errors = this.callParent(arguments);

      if (!this.allowBlank) {
        var blank = true;

        this.items.each(function() {
          if (this.checked) {
            blank = false;
            return false;
          }
        });
      }
    },

    isDirty: function() {
      if (this.disabled || !this.rendered) {
        return false;
      }

      var dirty = false;

      this.items.each(function() {
        if (this.isDirty()) {
          dirty = true;
          return false;
        }
      });

      return dirty;
    },

    setReadOnly: function(readOnly) {
      if (this.rendered) {
        this.items.each(function() {
          this.setReadOnly(readOnly);
        });
      }
      this.readOnly = readOnly;
    },

    onDisable: function() {
      this.items.each(function() {
        this.disable();
      });
    },

    onEnable: function() {
      this.items.each(function() {
        this.enable();
      });
    },

    reset: function() {
      var me = this;

      if (this.orgValue) {
        this.items.each(function() {
          if (this.setValue) {
            this.setValue(false);
            this.orgValue = this.getValue();
          }
        });

        this.resetOrg = true;
        this.setValue(this.orgValue);
        delete this.resetOrg;
      } else {
        this.items.each(function() {
          if (this.reset) {
            this.reset();
          }
        });
      }

      setTimeout(function() {
        me.clearInvalid();
      })
    },

    setValue: function() {
      if (this.rendered) {
        this.onSetValue.apply(this, arguments);
      } else {
        this.buffered = true;
        this.value = arguments;
      }
      return this;
    },

    onSetValue: function(id, value) {

      if (arguments.length == 1) {
        if (Q.isArray(id)) {

          Q.each(id, function(index, val) {
            if (Q.isObject(val) && val.setValue) { // array of checkbox components to be checked
              val.setValue(true);
              if (this.resetOrg === true) {
                val.orgValue = val.getValue();
              }
            } else {
              var item = this.items.get(index);
              if (item) {
                item.setValue(val);
              }
            }
          }, this);

        } else if (Q.isObject(id)) {

          for (var i in id) {
            var f = this.getBox(i);
            if (f) {
              f.setValue(id[i]);
            }
          }

        } else {
          this.setValueForItem(id);
        }
      } else {
        var f = this.getBox(i);
        if (f) {
          f.setValue(id[i]);
        }
      }
    },

    setValueForItem: function(val) {
      val = String(val).split(',');
      this.items.each(function() {
        if (Q.inArray(this.inputValue, val) > -1) {
          this.setValue(true);
        }
      });
    },

    getBox: function(id) {
      var box = null;

      this.items.each(function() {
        if (id == this || this.dataIndex == id || this.id == id || f.getName() == id) {
          box = this;
          return false
        }
      });

      return box;
    },

    getValue: function() {
      var ret = [];

      this.items.each(function() {
        if (this.checked) {
          out.push(item);
        }
      })

      return out;
    },

    beforeDestroy: function() {
      this.panel.destroy();

      if (!this.rendered) {
        this.items.each(function() {
          this.destroy();
        });
      }

      this.callParent(arguments);
    },

    eachItem: function(fn, scope) {
      if (this.items && this.items.each) {
        this.items.each(fn, scope || this);
      }
    },

    getRawValue: Q.noop,
    setRawValue: Q.noop
  });

  return CheckboxGroup;
})