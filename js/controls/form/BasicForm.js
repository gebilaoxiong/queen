define([
  'util/Observable',
  'form/Action',
  'controls/ComponentMgr'
], function(Observable, Action, ComponentMgr) {

  var BasicForm, core_slice = Array.prototype.slice;

  BasicForm = Q.Class.define(Observable, {

    paramOrder: undefined,

    paramsAsHash: false,

    waitTitle: '请稍等，正在处理中...',

    // private
    activeAction: null,

    /*
		standardSubmit 如果此项设置为true，将使用标准的HTML表单提交代替XHR（Ajax）方式的提交。(默认值为 false)。  


		*/

    /*
			如果设置为true，form.reset()方法将表单重置到最后一次加载
			或者 调用setValues()方法时的数据，
			而不是重置到表单创建时的状态。默认为false。 
		*/
    trackResetOnLoad: true,

    timeout: 30,

    statics: {
      getItemId: function(o) {
        return o.getItemId();
      }
    },

    init: function(el, config) {

      Q.extend(this, config);

      if (Q.isString(this.paramOrder)) {
        this.paramOrder = this.paramOrder.split(/[\s,|]/);
      }

      //初始化items
      this.items = new Q.MixCollection(BasicForm.getItemId);

      if (el) {
        this.initEl(el);
      }

      this.callParent(arguments);
    },

    initEl: function(el) {
      this.el = Q.get(el);
      this.id = this.el.dom.id || Q.id();

      if (!this.standardSubmit) {
        //阻止表单的提交
        this.el.on('submit', this.onSubmit, this);
      }

      this.el.addClass('x-form');
    },


    getEl: function() {
      return this.el;
    },

    onSubmit: function(e) {
      e.preventDefault();
      e.stopPropagation();
    },

    destroy: function(bound) {
      if (bound !== true) {
        this.items.each(function(_, field) {
          Q.Abstract.destroy(field);
        });
      }

      this.items.clear();
      this.unbind();
    },

    /*是否通过验证*/
    isValid: function() {
      var valid = true;

      this.items.each(function(_, field) {
        if (!field.validate()) {
          valid = false;
        }
      });

      return valid;
    },

    /*是否经过修改*/
    isDirty: function() {
      var dirty = false;

      this.items.each(function(_, field) {
        if (field.isDirty()) {
          dirty = true;
          return false;
        }
      });

      return dirty;
    },

    /*
			执行一个预定义的操作
			action load\post
			options
				url : String  action的url地址 (默认为表单的url。) 
				method : String  表单提交的方式(默认为表单的方式, 如果未定义则为POST) 
				params : String/Object  传递的参数(默认为表单的baseParams,如果未定义则为none)  

				headers : Object  action设置的请求头部信息(默认为表单默认的头部信息) 
				success : Function  回调函数，当成功响应的时候被唤起。(产看顶部的submit和 load关于成功响应结构的描述)。函数需要传递如下的参数: 
					form : Ext.form.BasicForm  请求action的form 
					action : 执行操作的Action对象。

					该action对象包含了如下的属性: 
						response 
							result : 自定义post处理的结果 
						type 
				failure : Function 事物尝试失败后被调用。函数需要传递如下的参数: 
					form : 执行请求的Ext.form.BasicForm。 
					action : 执行操作的Action对象。 

					该action对象包含了如下的属性: 
						failureType 
						response 
						result : 自定义post处理的结果 
						type 

				scope : Object  调用回调函数的作用域(this和回调函数关联)。 
				clientValidation : Boolean  只有Submit操作可用. 在提交前调用isValid 判断表单的输入域是否有效。设置为false将阻止这样做。如果未定义，预定义的提交输入域验证将被执行。 

		*/
    doAction: function(action, options) {
      if (Q.isString(action)) {
        action = new Action[action](this, options);
      }

      if (this.fire('beforeaction', this, action) !== false) {
        this.beforeAction(action);
        Q.delay(action.run, action, 100);
      }
      return this;
    },

    /*提交*/
    submit: function(options) {
      var isValid, el, submitAction;

      options = options || {};
      //标准提交
      if (this.standardSubmit) {
        valid = options.clientValidation === false || this.isValid();
        if (valid) {
          el = this.el.dom;
          if (this.url && Q.isDefined(el.action)) {
            el.action = this.url;
          }
          el.submit();
        }
        return valid;
      }

      submitAction = this.api ? 'directsubmit' : 'submit';
      this.doAction(submitAction, options);
      return this;
    },

    /*加载*/
    load: function(options) {
      var loadAction = this.api ? 'directload' : 'load';
      this.doAction(loadAction, options);
      return this;
    },

    /*
			把处于beginEdit/endEdit块中的表单值持久化到传递进来的Record对象中。 
		*/
    updateRecord: function(record) {
      record.beginEdit();

      var fields = record.fields,
        field,
        value;

      fields.each(function(_, field) {
        field = this.findField(field.name);

        if (field) {
          value = field.getValue();
          if (value != undefined && value.getGroupValue) {
            value = value.getGroupValue();
          } else if (field.eachItem) { //checkGroup 集合值
            value = [];
            field.eachItem(function(item) {
              value.push(item.getValue());
            });
          }
          record.set(field.name, value);
        }
      }, this);

      record.endEdit();

      return this;
    },

    /*将record的值填充field*/
    loadRecord: function(record) {
      this.setValues(record.data);
      return this;
    },

    beforeAction: function(action) {
      var options, waitMsgCt;

      this.items.each(function(_, field) {
        if (field.isFormField && field.syncValue) { //HTMLEditor
          field.syncValue();
        }
      });


      options = action.options;

      /*遮罩*/
      if (options.waitMsg) {

        if (this.waitMsgCt === true) {
          waitMsgCt = this;
        } else if (this.waitMsgCt) {
          waitMsgCt = ComponentMgr.get(this.waitMsgCt);
        }

        //如果容器存在  且有mask方法
        if (waitMsgCt && waitMsgCt.mask) {
          waitMsgCt.mask(options.waitMsg, 'x-mask-loading');
        }
      }

    },

    afterAction: function(action, success) {
      var options = action.options;
      this.activeAction = null;

      /*关闭遮罩*/

      if (options.waitMsg) {

        if (this.waitMsgCt === true) {
          waitMsgCt = this;
        } else if (this.waitMsgCt) {
          waitMsgCt = ComponentMgr.get(this.waitMsgCt);
        }

        //如果容器存在  且有mask方法
        if (waitMsgCt && waitMsgCt.unmask) {
          waitMsgCt.unmask();
        }
      }

      if (success) { //成功
        if (options.reset) {
          this.reset();
        }

        if (options.success) {
          options.success.call(options.scope, this, action);
        }

        this.fire('actioncomplete', this, action);

      } else { //失败

        if (options.failure) {
          options.failure.call(options.scope, this, action);
        }

        this.fire('actionfailed', this, action);
      }
    },

    /*迭代子控件 根据ID查找field*/
    findField: function(id) {
      var field = this.items.get(id);

      if (!Q.isObject(field)) {

        var findMatchingField = function(_, f) {
          if (f.isFormField) {
            if (f.dataIndex == id || f.id == id || f.getName() == id) {
              field = f;
              return false;
            } else if (f.isComposite) { //CompositeField
              return f.items.each(findMatchingField);
            } else if (f.isXType && f.isXType('CheckGroup') && f.rendered) {
              return f.eachItem(findMatchingField);
            }
          }
        }

        this.items.each(findMatchingField);
      }
      return field || null;
    },

    /*给错误字段标记错误*/
    markInvalid: function(errors) {
      var fieldError, field, id, i;

      if (Q.isArray(errors)) { //错误为数组
        i = 0;
        while (fieldError = errors[i++]) {
          field = this.findField(fieldError.id);

          if (field) {
            field.markInvalid(fieldError.msg);
          }
        }
      } else { //对象

        for (i in errors) {
          if (!Q.isFunction(errors[i]) && (field = this.findField(i))) {
            field.markInvalid(errors[i])
          }
        }
      }

      return this;
    },

    setValues: function(values) {
      var fieldValue, i, field;

      if (Q.isArray(values)) { //数组
        i = 0;
        while (fieldValue = values[i++]) {
          field = this.findField(fieldValue.id);

          if (field) {
            field.setValue(fieldValue.value);

            //如果启用了在重新载入后重置为原始数据 则更改field的原始值
            if (this.trackResetOnLoad) {
              field.originalValue = field.getValue();
            }
          }
        }
      } else { //object
        for (i in values) {
          if (!Q.isFunction(values[i]) && (field = this.findField(i))) {
            field.setValue(values[i]);

            //如果启用了在重新载入后重置为原始数据 则更改field的原始值
            if (this.trackResetOnLoad) {
              field.originalValue = field.getValue();
            }
          }
        }
      }
    },

    getValues: function(asString) {
      var fieldValues = Q.Element.serialize(this.el.dom);

      if (asString === true) {
        return fieldValues;
      }

      return Q.Object.fromQueryString(fieldValues);
    },

    getFieldValues: function(dirtyOnly) {
      var values = {},
        name, key, val;

      this.items.each(function(_, field) {
        if (!field.disabled && (dirtyOnly !== true || field.isDirty())) {
          name = field.getName();
          key = values[name];
          val = field.getValue();

          if (key != null) {
            if (Q.isArray(key)) {
              values[name].push(val);
            } else {
              values[name] = [key, val];
            }
          } else {
            values[name] = val;
          }
        }
      });

      return values;
    },

    clearInvalid: function() {
      this.items.each(function(_, filed) {
        filed.clearInvalid();
      });
      return this;
    },

    reset: function() {
      this.items.each(function(_, filed) {
        filed.reset();
      });
      return this;
    },

    add: function() {
      this.items.add(core_slice.call(arguments, 0));
      return this;
    },

    remove: function(field) {
      this.items.remove(field);
      return this;
    },

    cleanDestroyed: function() {
      this.items.removeBy(function(_, o) {
        return !!o.isDestroyed;
      });
    },

    render: function() {
      this.items.each(function(_, field) {
        //如果是HTML声明的控件
        if (field.isFormField && !field.rendered && document.getElementById(field.id)) {
          field.applyToMarkup(field.id);
        }
      });
      return this;
    },

    applyToFields: function(options) {
      this.items.each(function(_, field) {
        Q.extend(field, options)
      });
      return this;
    },

    applyIfToFields: function(options) {
      this.items.each(function(_, field) {
        Q.applyIf(field, options)
      });
      return this;
    },

    callFieldMethod: function(fnName, args) {
      args = args || [];

      this.items.each(function(_, filed) {
        if (Q.isFunction(filed[fnName])) {
          filed[fnName].apply(filed, args);
        }
      });

      return this;
    }


  });

  return BasicForm;
});