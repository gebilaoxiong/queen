define([
	'form/Field',
	'form/VTypes',
	'util/Timer'
], function(field, vTypes, Timer) {

	var rformatString = /\{(\d+)\}/g,

		core_shift = Array.prototype.shift,

		TextField;

	TextField = Q.Class.define(field, {

		type: 'TextField',

		allowBlank: true, //是否允许空值

		blankText: '该输入项为必输项',

		disabledCls: 'x-form-text-disabled',

		invalidCls:'x-form-text-invalid',

		maxLength: undefined,

		maxLengthText: '该输入项的最小长度是 {0} 个字符',

		minLength: undefined,

		minLengthText: '该输入项的最大长度是 {0} 个字符',

		emptyCls: 'x-form-field-empty',

		regex: undefined,

		regexText: '',

		emptyText: undefined,

		selectOnFocus: false,

		disableKeyFilter: false, //是否阻止键过滤

		maskRegExp: undefined, //过滤不符合此表达式的字符

		vtype: undefined,

		vtypeText: undefined,

		/*添加空文本框样式*/
		applyEmptyText: function() {
			if (this.rendered && this.emptyText && this.getRawValue().length < 1 && !this.hasFocus) {
				this.setRawValue(this.emptyText);
				this.el.addClass(this.emptyCls);
			}
		},

		/*失去焦点后校准文本信息*/
		postBlur: function() {
			this.applyEmptyText();
		},

		preFocus: function() {
			var el = this.el;

			if (this.emptyText) {
				if (el.dom.value == this.emptyText) {
					el.removeClass(this.emptyCls);
					this.setRawValue('');
				}
			}

			//获取焦点选中文本
			if (this.selectOnFocus) {
				el.dom.select(); //选中所有文本
			}

		},

		initValue: function() {
			this.callParent(arguments);
			this.applyEmptyText();
		},

		initEvents: function() {
			var me = this;

			me.callParent(arguments);

			/*延迟验证*/
			if (me.validEvent == 'keyup') {
				me.timer = new Timer(me.valid, me);
				me.el.on(me.validEvent, me.filterValidation, me);
			} else if (me.validEvent !== false && me.validEvent != 'blur') {
				me.timer = new Timer(me.valid, me);
				me.el.on(me.validEvent, me.onValid, me);
			}

			/*过滤字符*/
			if (me.maskRegExp || (me.vtype && this.disableKeyFilter !== true && (me.maskRegExp = vTypes[me.vtype + 'RegExp']))) {
				me.el.on('keypress', me.filterKeys, me);
			}

			/*textareat*/
			if (this.grow) {
				this.keyupTimer = new Timer(me.onKeyUpBuffered, me);
				this.el('keyup', Q.proxy(this.keyupTimer.delay, this.keyupTimer, 50));
				this.el('click', this.autoSize, this);
			}
		},

		onKeyUpBuffered: function(e) {
			if (this.doAutoSize(e)) {
				this.autoSize();
			}
		},

		doAutoSize: function(e) {
			return !e.isNavKeyPress();
		},

		onValid: function() {
			this.timer.delay(this.validDelay);
		},

		filterValidation: function(e) {
			if (!e.isSpecialKey()) {
				this.timer.delay(this.validDelay);
			}
		},

		//过滤按键
		filterKeys: function(e) {
			var key, cc;

			if (e.ctrlKey) {
				return;
			}

			key = e.which;

			if (Q.Browser.firfox && (e.isNavKey() || key == 8 /*BACKSPACE*/ || (key == 46 /*DELETE*/ && e.button == -1))) {
				return;
			}

			cc = String.fromCharCode(key);

			if (!Q.Browser.firfox && e.isSpecialKey() && !cc) {
				return;
			}

			if (!this.maskRegExp.test(cc)) {
				e.preventDefault();
			}
		},

		getErrors: function(value) {
			var errors = [],
				len = Q.String.trim(value).length,
				matches;

			//是否为空
			if (!this.allowBlank && len == 0) {
				errors.push(this.blankText);
			}

			//最大长度
			if (this.maxLength && len > this.maxLength) {
				errors.push(this.getFormatError(this.maxLengthText, this.maxLength));
			}

			//最短长度
			if (this.minLength && len < this.minLength) {
				errors.push(this.getFormatError(this.minLengthText, this.minLength));
			}

			if (this.vtype) {
				if (!vTypes[this.vtype](value)) {
					errors.push(this.vtypeText || vTypes[this.vtype + 'Text'])
				}
			}

			if (this.regex) {
				this.regex.lastIndex = 0;
				if (!this.regex.test(value)) {
					errors.push(this.regexText);
				}
			}

			return errors;
		},

		/*获取格式化的错误信息*/
		getFormatError: function() {
			var text = core_shift.apply(arguments),
				args = arguments;

			rformatString.lastIndex = 0;

			if (!rformatString.test(text)) {
				return text;
			}

			return text.replace(rformatString, function(matches, index) {
				return args[index];
			});
		},

		/*重置*/
		reset: function() {
			this.callParent(arguments);
			this.applyEmptyText();
		},

		beforeDestroy: function() {
			Q.destroy(this.timer, this.keyupTimer);
			this.maxLengthText = this.minLengthText = this.blankText = null;
			this.callParent(arguments);
		}
	});



	return TextField;
});