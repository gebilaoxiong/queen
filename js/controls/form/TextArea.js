/**
 *
 * @authors 熊洋 (xywindows@gmail.com)
 * @date    2014-03-31 14:40:40
 * @description
 */

define(['form/TextField'], function(TextField) {

	var TextArea = Q.Class.define(TextField, {

		/*
			grow : Boolean true 如果此表单项需要自动增长、收缩到它的内容长度(默认为false) 
		*/

		/*当grow=true 时允许的最小高度(默认为60) */
		growMin: 60,
		growMax: 1000,

		growAppend: '&#160;\n&#160;',

		enterIsSpecial: false,

		/*
			true将会阻止出现滚动条，
			无论表单项中有多少文本。

			只有当grow为 true时此配置项才会被使用。 
			与设置overflow: hidden等效，默认为 false。 
		*/
		preventScrollbars: false,

		onRender: function(continer, position) {
			if (!this.el) {
				this.autoCreate = {
					target: 'textarea',
					style: "width:165px;height:80px;",
					autocomplete: 'off'
				};
			}

			this.callParent(arguments);

			if (this.grow) { //自动伸缩
				this.textSizeEl = this.getBody(true).createChild({
					target: "pre",
					'class': "x-form-grow-sizer"
				});

				if (this.preventScrollbars) {
					this.el.css("overflow", "hidden");
				}

				this.el.innerHeight(this.growMin);
			}
		},

		onDestroy: function() {
			if (this.textSizeEl) {
				this.textSizeEl.remove();
			}
			this.callParent(arguments);
		},

		fireKey: function(e) {
			if (e.isSpecialKey() && (this.enterIsSpecial || (e.which != 13 /*ENTER*/ || e.ctrlKey || e.altKey) || e.shiftKey)) {
				this.fire("specialkey", this, e);
			}
		},

		// inherit docs
		filterValidation: function(e) {
			if (!e.isNavKey() || (!this.enterIsSpecial && e.which == 13 /*ENTER*/ )) {
				this.timer.delay(this.validationDelay);
			}
		},

		autoSize: function() {
			if (!this.grow || !this.textSizeEl) {
				return;
			}

			var el = this.el,
				value = Q.String.escapeHtml(el.dom.value),
				textSizeEl = this.textSizeEl,
				height;

			textSizeEl.outerWidth(false, this.el.outerWidth(false));
			if (value.length < 1) {
				value = "&#160;&#160;";
			} else {
				value += this.growAppend;
				if (Q.Browser.ie) {
					value = value.replace(/\n/g, '&#160;<br />');
				}
			}

			textSizeEl.dom.innerHTML = value;
			height = Math.min(this.growMax, Math.max(textSizeEl.dom.offsetHeight, this.growMin));

			if (height != this.lastHeight) {
				this.lastHeight = height;
				this.el.setHeight(height);
				this.fire("autosize", this, height);
			}
		}
	});

	return TextArea;
});