define(['controls/BoxComponent'], function(boxCmp) {

  /*
		form控件基类  主要抽象验证
	*/
  var Field = Q.Class.define(boxCmp, {

      type: 'Field',

      isFormField: true,

      readOnly: false,

      disabled: false,

      hasFocus: false, //是否拥有焦点

      toSubmit: true, //提交form时是否提交本控件

      validateOnBlur:true,//是否在失去焦点的时候验证控件

      invalidCls: 'x-form-invalid',

      focusCls: 'x-form-focus',

      invalidText: '验证失败',

      validCls: 'x-form-valid',

      fieldCls: 'x-form-field',

      validDelay: 250, //验证延迟时间

      preventMark: false, //是否取消显示验证消息

      msgTarget: 'side', //显示消息的标签

      msgDisplay: '', //显示消息标签 显示时的状态 inline-block  block;

      validEvent: 'keyup',

      validOnBlur: true, //失去焦点时触发验证

      /*默认控件结构*/
      autoCreate: {
        target: 'input',
        type: 'text',
        size: 20,
        autocomplete: 'off'
      },

      onRender: function(container, position) {
        var autoCreate, type;

        if (!this.el) { //从autoCreate中定制控件结构
          autoCreate = this.getAutoCreate();

          if (!autoCreate.name) {
            autoCreate.name = this.name || this.getId();
          }

          if (this.inputType) {
            autoCreate.type = this.inputType;
          }

          this.autoEl = autoCreate;

        }


        this.callParent(arguments);

        this.addClass(this.fieldCls);

        if (this.toSubmit === false) {
          this.dom.removeAttr('name');
        }

        type = this.el.dom.type;

        if (type) {
          if (type == 'password') {
            type = 'text';
          }
          this.el.addClass('x-form-' + type);
        }

        if (this.readOnly) {
          this.setReadOnly(true);
        }

        if (this.tabIndex !== undefined) {
          this.el.dom.setAttribute('tabIndex', this.tabIndex);
        }


      },

      afterRender: function() {
        this.callParent(arguments);
        this.initValue();
      },

      /*只读状态切换*/
      setReadOnly: function(readOnly) {
        if (this.rendered) {
          this.el.dom.readOnly = readOnly;
        }
        this.readOnly = readOnly;
      },

      onFocus: function() {

        this.preFocus();

        if (this.focusCls) {
          this.el.addClass(this.focusCls);
        }

        if (this.hasFocus) {
          return;
        }

        this.hasFocus = true;

        this.startValue = this.getValue();

        this.fire('focus', this);
      },

      onBlur: function() {
        var value;

        this.beforeBlur();

        if(this.focusCls){
          this.el.removeClass(this.focusCls);
        }

        this.hasFocus=false;

        if(this.validEvent!==false&&(this.validateOnBlur||this.validEvent=='blur')){
          this.valid();
        }

        value=this.getValue();

        if(String(value)!==String(this.startValue)){
          this.fire('change',this,value,this.startValue)
        }
        this.fire('blur',this);
        this.postBlur();
      },

      preFocus: Q.noop,

      beforeBlur: Q.noop,

      postBlur: Q.noop,

      /*
			是否通过验证
			@param {bool} preventMark  为True 取消标记元素
		*/
      isValid: function(preventMark) {
        var orgPreventMark, ret;

        if (this.disabled) {
          return true;
        }
        orgPreventMark = this.preventMark
        this.preventMark = preventMark === true;

        ret = this.validValue(this.getRawValue());

        this.preventMark = orgPreventMark;

        return ret;
      },

      /*
			验证
		*/
      valid: function() {
        if (this.disabled || this.validValue(this.getRawValue())) {
          this.clearInvalid();
          return true;
        }
        return false;
      },

      /*验证值*/
      validValue: function(value) {
        var error = this.getErrors(value)[0];
        if (error === undefined) {
          return true;
        } else {
          this.markInvalid(error);
          return false;
        }

      },

      processValue: function(value) {
        return value;
      },

      /*获取验证错误信息*/
      getErrors: function(value) {
        return [];
      },

      /*标记验证错误信息*/
      markInvalid: function(msg) {
        var handler, msgNode;

        if (this.rendered && !this.preventMark) {
          msg = msg || this.invalidText;
          //获取显示消息的组件
          handler = this.getMessageHandler();

          if (handler) {
            handler.mark(this, msg);
          } else {
            this.el.addClass(this.invalidCls);
            msgNode = Q.dom.get(this.msgTarget);
            if (msgNode) {
              msgNode.innerHtml = msg;
              msgNode.style.display = this.msgDisplay;
            }
          }
        }
        this.fire('invalid', this, msg);
      },

      /*清除验证失败信息*/
      clearInvalid: function() {
        var handler, msgNode;

        if (this.rendered || !this.preventMark) {

          handler = this.getMessageHandler();

          if (handler) {

            handler.clear(this);

          } else {
            this.el.removeClass(this.invalidCls);
            msgNode = Q.dom.get(this.msgTarget);
            if (msgNode) {
              Q.Element.empty(msgNode);
              msgNode.style.display = 'none';
            }
          }
        }

        this.fire('valid', this);
      },

      /*获取显示消息的处理函数*/
      getMessageHandler: function() {
        return FieldMsgTargets[this.msgTarget];
      },

      /*重置*/
      reset: function() {
        this.setValue(this.originalValue);
        this.clearInvalid();
      },

      getRawValue: function() {
        var value = this.rendered ?
          this.el.val() :
          Q.isDefined(this.value) ? this.value : '';

        if (value === this.emptyText) {
          value = '';
        }

        return value;
      },

      getValue: function() {
        var value;

        if (!this.rendered) {
          return this.value;
        }

        value = this.el.val();

        if (value === undefined || value === this.emptyText) {
          value = '';
        }

        return value;
      },

      setRawValue: function(value) {
        return this.rendered ? (this.el.dom.value = (Q.isUndefined(value) ? '' : value)) : '';
      },

      setValue: function(value) {

        this.value = value;

        if (this.rendered) {
          this.el.val(value);
          this.valid();
        }
      },

      initEvents: function() {
        var me = this;

        me.el.on('focus', me.onFocus, me);
        me.el.on('blur', me.onBlur, me);
        me.el.on('keydown', me.fireKey, me);
      },

      fireKey: function(e) {
        if (e.isSpecialKey()) {
          this.fire('specialkey', this, e);
        }
      },

      initValue: function() {
        if (this.value !== undefined) {
          this.setValue(this.value);
        } else if (Q.isDefined(this.el.dom.value) && this.el.dom.value != this.emptyText) {
          this.setValue(this.el.dom.value);
        }

        this.originalValue = this.getValue();
      },

      getItemCt: function() {
        return this.itemCt;
      },

      isDirty: function() {
        if (this.disabled || !this.rendered) {
          return false;
        }
        return String(this.getValue()) !== String(this.originalValue);
      },

      getName: function() {
        var me = this

        return me.rendered && me.el.dom.name ?
          me.el.dom.name :
          me.name || this.id || '';
      },

      selectText: function(start, end) {
        var v = this.getRawValue(),
          doFocus = false,
          dom, range;

        if (v.length > 0) {
          start = start === undefined ? 0 : start;
          end = end === undefined ? v.length : end;
          dom = this.el.dom;

          if (dom.setSelectionRange) {
            dom.setSelectionRange(start, end);
          } else if (dom.createTextRange) {
            range = dom.createTextRange();
            range.moveStart('character', start);
            range.moveEnd('character', end - v.length);
            range.select();
          }

        } else {
          doFocus = true;
        }

        if (doFocus) {
          this.focus();
        }
      },

      getErrorCt: function() {
        return Q.get(this.el.parentUntil('.x-form-element') || // use form element wrap if available
          this.el.parentUntil('.x-form-field-wrap')); // else direct field wrap
      },

      alignErrorEl: function() {
        this.errorEl.outerWidth(true, this.getErrorCt().width() - 20);
      },

      alignErrorIcon: function() {
        this.errorIcon.alignTo(this.el, 'tl-tr', [2, 0]);
      }

    }),

    FieldMsgTargets = {
      qtip: {
        mark: function(field, msg) {
          var el = field.el;
          (field.wrap || el).addClass(field.invalidCls);
          el.attr('data-qclass', 'x-tip-error');
          el.dom.qtip = msg;
        },
        clear: function(field) {
          var el = field.el;
          (field.wrap ||el).removeClass(field.invalidCls);
          el.removeAttr('data-qclass');
          el.dom.qtip = undefined;
        }
      },
      side: {
        mark: function(field, msg) {
          var elp;

          (field.wrap || field.el).addClass(field.invalidCls);

          if (!field.errorIcon) {
            elp = field.getErrorCt();

            // field has no container el
            if (!elp) {
              field.el.dom.title = msg;
              return;
            }

            field.errorIcon = elp.createChild({
              'class': 'x-form-invalid-icon'
            });

            field.errorIcon.attr('data-qclass', 'x-tip-error');

            if (field.ownerCt) {
              field.ownerCt.bind('afterlayout', field.alignErrorIcon, field);
              field.ownerCt.bind('expand', field.alignErrorIcon, field);
            }

            field.bind('resize', field.alignErrorIcon, field);
            field.bind('destroy', function() {
              this.errorIcon.remove();
            }, field);
          }
          field.alignErrorIcon();
          field.errorIcon.dom.qtip = msg;
          field.errorIcon.addClass('x-form-invalid-tip');
          field.errorIcon.show();
        },
        clear: function(field) {
          (field.wrap || field.el).removeClass(field.invalidCls);

          if (field.errorIcon) {
            field.errorIcon.dom.qtip = '';
            field.errorIcon.hide();
          } else {
            field.el.dom.title = '';
          }
        }
      },
      title: {
        mark: function(field, msg) {
          field.el.addClass(field.invalidCls).prop('title', msg);
        },
        clear: function(field) {
          field.el.removeAttr('title').removeClass(field.invalidCls);
        }
      },
      under: {
        mark: function(field, msg) {
          field.el.addClass(field.invalidCls);

          if (!field.errorEl) {
            var elp = field.getErrorCt();

            if (!elp) { // field has no container el
              field.el.dom.title = msg;
              return;
            }

            field.errorEl = elp.createChild({
              'class': 'x-form-invalid-msg'
            });

            field.bind('resize', field.alignErrorEl, field);
            field.bind('destroy', function() {
              this.errorEl.remove();
            }, field);
          }

          field.alignErrorEl();
          field.errorEl.text(msg);
          field.errorEl.show();
        },
        clear: function(field) {
          field.el.removeClass(field.invalidCls);
          if (field.errorEl) {
            field.errorEl.hide();
          } else {
            field.el.dom.title = '';
          }
        }
      }
    };

  return Field;
});