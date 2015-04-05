define([
  'form/TextField',
  'util/Timer'
], function(textField, timer) {

  var TriggerField = Q.Class.define(textField, {

    type: 'TriggerField',

    autoCreate: {
      target: 'input',
      type: 'text',
      size: 20,
      autocomplete: 'off'
    },

    /*是否隐藏按钮*/
    hideTrigger: false,

    /*文本框是否可编辑*/
    editable: true,

    /*只读*/
    readOnly: false,

    /*焦点类*/
    wrapFocusCls: 'x-trigger-wrap-focus',

    deferHeight: true,

    mimicing: false,

    actionMode: 'wrap',

    /*触发器宽度*/
    defaultTriggerWidth: 22,


    onResize: function(width, height) {
      var me = this,
        triggerWidth;

      me.callParent(arguments);

      triggerWidth = me.getTriggerWidth();

      if (Q.isNumber(width)) {
        me.wrap.outerWidth(true, width);
        me.el.outerWidth(true, me.wrap.width() - triggerWidth);
      }
    },

    getTriggerWidth: function() {
      var triggerWidth = 0;

      if (!this.hideTrigger) {
        triggerWidth = this.trigger.outerWidth(true)
      }

      return triggerWidth;
    },

    onRender: function(container, position) {
      var me = this;

      me.callParent(arguments);

      me.doc = Q.get(Q.Browser.ie ? me.getBody() : me.getDoc());

      me.wrap = me.el.wrap({
        'class': 'x-form-field-wrap x-form-field-trigger-wrap'
      });

      me.trigger = me.wrap.createChild(me.triggerConfig || {
        target: 'div',
        'class': 'x-form-trigger unselect ' + (me.triggerCls || '')
      });

      if (!me.width) {
        me.wrap.innerWidth(me.el.outerWidth(true) + me.trigger.outerWidth(true));
      }

      me.resizeEl = me.positionEl = me.wrap;
    },

    getWidth: function() {
      return this.el.outerWidth(true) + this.trigger.outerWidth(true);
    },

    afterRender: function() {
      this.callParent(arguments);
      this.updateEditState();
    },

    initEvents: function() {
      this.callParent(arguments);
      this.trigger.on('click', this.onTriggerClick, this);
    },

    updateEditState: function() {
      /*有待优化*/
      if (this.rendered) {
        if (this.readOnly) {
          this.el.dom.readOnly = true;
          this.wrap.addClass('x-trigger-noedit');
          this.el.off('click', this.onTriggerClick, this);
          this.trigger.hide();
        } else {
          if (!this.editable) {
            this.el.dom.readOnly = true;
            this.wrap.addClass('x-trigger-noedit');
            this.el.on('click', this.onTriggerClick, this);
          } else {
            this.el.dom.readOnly = false;
            this.wrap.removeClass('x-trigger-noedit');
            this.el.off('click', this.onTriggerClick, this);
          }
          this.trigger[this.hideTrigger ? 'hide' : 'show']();
        }
        this.onResize(this.width || this.wrap.outerWidth(true));
      }
    },

    onTriggerClick: function(e) {
      e.stopPropagation();
    },

    setHideTrigger: function(hideTrigger) {
      if (hideTrigger != this.hideTrigger) {
        this.hideTrigger = this.hideTrigger;
        this.updateEditState();
      }
    },

    setEditable: function(editable) {
      if (editable != this.editable) {
        this.editable = editable;
        this.updateEditState();
      }
    },

    setReadOnly: function(readOnly) {
      if (readOnly != this.readOnly) {
        this.readOnly = readOnly;
        this.updateEditState();
      }
    },

    onDestroy: function() {
      Q.destroy(this.trigger, this.wrap);

      if (this.mimicing) {
        this.doc.off('mousedown', this.mimicBlur, this);
      }
      if (this.doc) {
        delete this.doc.dom;
      }
      this.callParent(arguments);
    },

    onFocus: function() {
      this.callParent(arguments);

      if (!this.mimicing) {
        //添加焦点类
        this.wrap.addClass(this.wrapFocusCls);
        this.mimicing = true;

        if (!this.mousedownTimer) {
          this.mousedownTimer = new timer(this.mimicBlur, this);
        }
        this.doc.on('mousedown', this.onMimicBlur, this);
      }
    },

    onMimicBlur: function() {
      this.mousedownTimer.delay(10, undefined, undefined, arguments);
    },

    mimicBlur: function(e) {
      if (!this.isDestroyed && !this.wrap.contains(e.target) && this.validateBlur(e)) {
        this.triggerBlur();
      }
    },

    //验证失去焦点关闭下拉菜单
    validateBlur: function(e) {
      return true;
    },

    /*关闭下拉菜单*/
    triggerBlur: function() {
      var doc;

      this.mimicing = false;
      this.doc.off('mousedown', this.onMimicBlur, this);

      //callparent
      textField.prototype.onBlur.call(this);

      if (this.wrap) {
        this.wrap.removeClass(this.wrapFocusCls);
      }
    },

    alignErrorIcon: function() {
      if (this.wrap) {
        this.errorIcon.alignTo(this.wrap, 'tl-tr', [2, 0]);
      }
    },

    onBlur: Q.noop,

    beforeBlur: Q.noop

  });

  return TriggerField;
});