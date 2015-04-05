define(['form/Field'], function(field) {

  var Checkbox = Q.Class.define(field, {

    type: 'Checkbox',

    focusCls: '',

    checked: false,

    /*checkbox的 value*/
    inputValue: undefined,

    boxLabel: '&#160;',

    actionMode: 'wrap',

    /*默认控件结构*/
    autoCreate: {
      target: 'input',
      type: 'checkbox',
      autocomplete: 'off'
    },

    initEvents: function() {
      this.callParent(arguments);
      this.el.on('click', this.onClick, this);
      this.el.on('change', this.onClick, this);
    },

    markInvalid: Q.noop,

    clearInvalid: Q.noop,

    onRender: function(container, position) {
      this.callParent(arguments);

      if (this.inputValue !== undefined) {
        this.el.dom.value = this.inputValue;
      }

      this.wrap = this.el.wrap({
        'class': 'x-form-check-wrap'
      });

      //lable
      if (this.boxLabel) {
        this.wrap.createChild({
          target: 'label',
          'for': this.getId(),
          'class': 'x-form-combox-label',
          content: this.boxLabel
        });
      }

      if (this.checked) {
        this.setValue(true);
      } else {
        this.checked = this.el.dom.checked;
      }


      this.resizeEl = this.positionEl = this.wrap;
    },

    onDestroy: function() {
      this.wrap.remove();
      this.callParent(arguments);
    },

    getValue: function() {
      if (this.rendered) {
        return this.el.dom.checked;
      }
      return this.checked;
    },

    onClick: function() {
      if (this.el.dom.checked != this.checked) {
        this.setValue(this.el.dom.checked);
      }
    },

    setValue: function(value) {
      var checked = this.checked,
        inputVal = this.inputValue;

      if (value === false) {
        this.checked = false;
      } else {

        this.checked = (
          value === true ||
          value === 'true' ||
          value == '1' ||
          (inputVal ? value == inputVal : String(value).toLowerCase() == 'on'));
      }

      if (this.rendered) {
        this.el.dom.checked = this.checked;
        this.el.dom.defaultChecked = this.checked;
      }

      if (checked != this.checked) {
        this.fire('check', this, this.checked);

        if (this.handler) {
          this.handler.call(this, this, this.checked);
        }
      }
    },

    initValue: function() {
      this.orgValue = this.getValue();
    }
  });

  return Checkbox;
});