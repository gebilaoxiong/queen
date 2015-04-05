define([
  'form/CheckboxGroup',
  'form/Radio',
  'util/Timer'
], function(checkboxGroup, radio, timer) {

  var radioGroup = Q.Class.define(checkboxGroup, {

    type: 'RadioGroup',

    allowBlank: true,

    blankText: '必须项',

    groupCls: 'x-form-radio-group',

    configuration: function() {
      this.callParent(arguments);
      this.defaultType = radio;
    },

    getValue: function() {
      var ret = null;

      this.items.each(function() {
        if (this.checked) {
          ret = this;
          return false;
        }
      });

      return ret;
    },

    onSetValue: function(id, value) {

      if (arguments.length > 1) {
        var f = this.getBox(id);

        if (f) {
          f.setValue(value);
          if (f.checked) {
            this.items.each(function() {
              if (this !== f) {
                this.setValue(false);
              }
            });
          }
        }
      } else {
        this.setValueForItem(id);
      }
    },

    setValueForItem: function(value) {
      value = String(value).split(',')[0];

      this.items.each(function() {
        this.setValue(value == this.inputValue);
      });
    },

    fireChecked: function() {
      if (!this.checkTimer) {
        this.checkTimer = new timer(this.bufferChecked, this);
      }
      this.checkTimer.delay(10);
    },

    bufferChecked: function() {
      var ret = null;
      this.items.each(function() {
        if (this.checked) {
          ret = this;
          return false;
        }
      });

      this.fire('change', this, ret);
    },

    onDestroy: function() {
      if (this.checkTimer) {
        this.checkTimer.destroy();
        this.checkTimer = null;
      }
      this.callParent(arguments);
    }
  });

  return radioGroup;
});