define([
	'controls/Component',
	'controls/ComponentMgr',
	'controls/Layer',
	'form/TextField'
], function(Component, ComponentMgr, Layer, TextField) {

	var Editor = Q.Class.define(Component, {

		type:'Editor',

		/*设置值为true，当该字段失去焦点时，完成编辑过程。默认值为true。 */
		allowBlur: true,

		/*
		revertInvalid {bool}  设置为true，当用户完成编辑后但字段效验失败时，自动恢复到原始值并取消编(默认值为true) 
		
		ignoreNoChange {bool} 为true时，如果用户完成编辑且值没有发生变化则跳过编辑完成的过程(不保存，不触发事件)(默认值为false)。只对字符串值有效 - 对于其他数据类型的编辑将被忽略。
		*/

		value: '',

		offsets: {
			top: 0,
			left: 0
		},

		/*设置为true，将编辑器约束到视图 */
		constrain: false,

		/*对齐到的位置*/
		alignment: 'c-c?',

		/*处理keydown/keypress事件，使它们不会继续传播(默认值true) */
		swallowKeys: true,

		/*设置为true，完成时按下回车键结束编辑。默认值为true。 */
		completeOnEnter: true,

		cancelOnEsc: true,

		/*设置为true，当更新完成时同时更新绑定的元素的innerHTML(默认值为false) */
		updateEl: false,

		configuration: function(field, config) {

			if (field.field) { //只有一个配置参数
				this.field = ComponentMgr.create(field.field, TextField);
				config = Q.extend({}, field);
				delete config.field;
			} else {
				this.field = field;
			}

			this.callParent(arguments);
		},

		onRender: function(container, position) {
			this.el = new Layer({
				cls: 'x-editor',
				parentEl: container,
				shim: this.shim,
				id: this.id,
				constrain: this.constrain
			});
			//zindex
			if (this.zIndex) {
				this.el.css('z-index', this.zIndex);
			}

			this.el.css('overflow', Q.Browser.firfox ? 'auto' : 'hidden');

			if (this.field.msgTarget != 'title') {
				this.field.msgTarget = 'qtip';
			}

			//标记在editor中
			this.field.inEditor = true;

			this.field.render(this.el)
			this.field.show();
			this.field.getEl().dom.name = '';
		},

		initEvents: function() {
			this.field.bind({
				scope: this,
				blur: this.onBlur,
				specialkey: this.onSpecialKey
			});

			if (this.swallowKeys) {
				this.field.el.swallowEvent([
					'keypress', // *** Opera
					'keydown' // *** all other browsers
				]);
			}
		},

		/*特殊按键处理函数*/
		onSpecialKey: function(e,field, domEvent) {
			var key = domEvent.which,
				keycodes = domEvent.keyCodes,
				complete = this.completeOnEnter && key == 13/*ENTER*/,
				cancel = this.cancelOnEsc && key == 27/*ESC*/;

			if (complete || cancel) { //如果是提交或取消
				domEvent.stopPropagation();
				domEvent.preventDefault();

				if (complete) {
					this.completeEdit();
				} else {
					this.cancelEdit();
				}

				if (field.triggerBlur) {
					field.triggerBlur();
				}
			}
			this.fire('specialkey', field, domEvent);
		},

		startEdit: function(el, value) {
			var v;

			if (this.editing) { //编辑中
				this.completeEdit();
			}

			this.boundEl = Q.get(el);
			v = value !== undefined ? value : this.boundEl.text();

			if (!this.rendered) {
				this.render(this.parentEl || document.body);
			}

			if (this.fire('beforestaredit', this, this.boundEl, v) !== false) {
				this.startValue = v;
				this.field.reset(); //重置
				this.field.setValue(v); //设置 value
				this.show();
				this.realign(true); //重新关联
				this.editing = true;
			}
		},

		doAutoSize: function() {
			if (this.autoSize) {
				var fieldSize = this.field.getSize(),
					boundElSize = {
						width: this.boundEl.outerWidth(false),
						height: this.boundEl.outerHeight(false)
					};

				switch (this.autoSize) {
					case 'width':
						this.setSize(boundElSize.width, fieldSize.height);
						break;
					case 'height':
						this.setSize(fieldSize.width, boundElSize.height);
						break;
					case 'none':
						this.setSize(fieldSize.width, fieldSize.height);
						break;
					default:
						this.setSize(boundElSize.width, boundElSize.height);
				}
			}
		},

		setSize: function(width, height) {
			delete this.field.lastSize;
			this.field.setSize(width, height);
			this.el.sync();
		},

		realign: function(autoSize) {
			if (autoSize === true) {
				this.doAutoSize();
			}
			this.el.alignTo(this.boundEl, this.alignment);
		},

		/*
			完成编辑

			remainVisible {Boolean} 替代默认行为，并保持编辑器可编辑(默认为false)。 

		*/
		completeEdit: function(remainVisible) {
			var value;

			if (!this.editing) {
				return;
			}

			//comboBox
			if (this.field.assertValue) {
				this.field.assertValue();
			}

			value = this.getValue();

			if (!this.field.isValid()) { //验证失败
				if (this.revertInvalid !== false) {
					this.cancelEdit(remainVisible);
				}
				return;
			}

			if (String(value) === String(this.startValue) && this.ignoreNoChange) {
				this.hideEdit(remainVisible);
				return;
			}

			if (this.fire('beforecomplete', this, value, this.startValue) != false) {
				value = this.getValue();
				if (this.updateEl && this.boundEl) {
					this.boundEl.text(value);
				}
				this.hideEdit(remainVisible);
				this.fire("complete", this, value, this.startValue);
			}
		},
		onShow: function() {
			this.el.show();
			if (this.hideEl !== false) {
				this.boundEl.hide();
			}
			this.field.show();
			this.field.focus(false, true);
			this.fire("startedit", this.boundEl, this.startValue);
		},

		cancelEdit: function(remainVisible) {
			if (this.editing) {
				var v = this.getValue();
				this.setValue(this.startValue);
				this.hideEdit(remainVisible);
				this.fire("canceledit", this, v, this.startValue);
			}
		},

		hideEdit: function(remainVisible) {
			if (remainVisible !== true) {
				this.editing = false;
				this.hide();
			}
		},

		onBlur: function() {
			// selectSameEditor flag allows the same editor to be started without onBlur firing on itself
			if (this.allowBlur === true && this.editing && this.selectSameEditor !== true) {
				this.completeEdit();
			}
		},

		onHide: function() {
			if (this.editing) {
				this.completeEdit();
				return;
			}

			this.field.blur();

			if (this.field.collapse) {
				this.field.collapse();
			}

			this.el.hide();

			if (this.hideEl !== false) {
				this.boundEl.show();
			}
		},

		setValue: function(v) {
			this.field.setValue(v);
		},

		/**
		 * Gets the data value of the editor
		 * @return {Mixed} The data value
		 */
		getValue: function() {
			return this.field.getValue();
		},

		beforeDestroy: function() {

			this.field.destroy();

			delete this.parentEl;
			delete this.boundEl;
		}

	});

	return Editor;
});