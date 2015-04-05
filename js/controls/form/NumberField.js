define(['form/TextField'], function(TextField) {

	var NumberField = Q.Class.define(TextField, {

		fieldClass: "x-form-field x-form-num-field",

		//是否允许小数
		allowDecimals: true,

		//小数点分隔符
		decimalSeparator: ".",

		//小数位数
		decimalPrecision: 2,

		//是否允许符号
		allowNegative: true,

		minValue: Number.NEGATIVE_INFINITY,

		maxValue: Number.MAX_VALUE,

		minText: "该输入项的最小值是 {0}",

		maxText: "该输入项的最大值是 {0}",

		nanText: "{0} 不是有效数值",

		//合法数字的基本字符集(默认为'0123456789'). 
		baseChars: "0123456789",


		autoStripChars: false,

		configuration: function() {
			var allowed = String(this.baseChars);

			//允许小数将小数分隔符添加到允许的字符集
			if (this.allowDecimals) {
				allowed += this.decimalSeparator;
			}

			//符号
			if (this.allowNegative) {
				allowed += '-';
			}

			allowed = Q.String.escapeRegExp(allowed);
			this.maskRe = new RegExp('[' + allowed + ']');

			if (this.autoStripChars) {
				this.stripCharsRe = new RegExp('[^' + allowed + ']', 'gi');
			}


			if (this.minText && Q.isString(this.minText)) {
				this.minText = Q.String.format(this.minText);
			}

			if (this.maxText && Q.isString(this.maxText)) {
				this.maxText = Q.String.format(this.maxText);
			}

			if (this.nanText && Q.isString(this.nanText)) {
				this.nanText = Q.String.format(this.nanText);
			}

			this.callParent(arguments);
		},

		getErrors: function(value) {
			var errors = this.callParent(arguments),

				value = value != undefined ?
					value : this.processValue(this.getRawValue()),

				num;

			//将小数分隔符替换为小数点
			value = String(value).replace(this.decimalSeparator, ".");

			if (isNaN(value)) {
				errors.push(this.nanText(value));
			}

			num = this.parseValue(value);

			// 范围判断
			if (num < this.minValue) {
				errors.push(this.minText(this.minValue));
			}

			if (num > this.maxValue) {
				errors.push(this.maxText(this.maxValue));
			}

			return errors;
		},

		getValue: function() {
			//获取字符串-》数字-》修复
			return this.fixPrecision(this.parseValue(this.callParent(arguments)));
		},

		setValue: function(v) {
			v = Q.isNumber(v) ? v : parseFloat(String(v).replace(this.decimalSeparator, "."));
			v = this.fixPrecision(v);
			v = isNaN(v) ? '' : String(v).replace(".", this.decimalSeparator);

			return this.callParent(arguments);
		},

		setMinValue: function(value) {
			this.minValue = Q.Number.tryParse(value, Number.NEGATIVE_INFINITY);
		},

		setMaxValue: function(value) {
			this.maxValue = Q.Number.tryParse(value, Number.MAX_VALUE);
		},

		// private
		parseValue: function(value) {
			value = parseFloat(String(value).replace(this.decimalSeparator, "."));
			return isNaN(value) ? '' : value;
		},

		fixPrecision: function(value) {
			var nan = isNaN(value);

			//不需要修复（不允许小数|小数位数小于0|非数字|0）
			if (!this.allowDecimals || this.decimalPrecision <= 0 || nan || !value) {
				return nan ? '' : value;
			}

			return parseFloat(parseFloat(value).toFixed(this.decimalPrecision));
		},

		beforeBlur: function() {
			var v = this.parseValue(this.getRawValue());

			if (Q.isDefined(v)) {
				this.setValue(v);
			}
		},

		beforeDestroy:function(){
			//解除闭包函数引用
			this.nanText=this.minText=this.maxText=null;
			
			this.callParent(arguments);
		}
	});

	return NumberField;
});