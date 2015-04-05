define([
	'form/Checkbox',
	'controls/ComponentMgr'
], function(checkbox, componentMgr) {

	var Radio = Q.Class.define(checkbox, {

		type: 'Radio',

		inputType: 'radio',

		markInvalid: Q.noop,

		clearInvalid: Q.noop,

		getGroupValue: function() {
			var parent = this.el.dom.form || document.body,
				group = Q.find('input[name=' + this.el.dom.name + ']', parent.dom),
				checkedItem;

			checkedItem = group.find(function() {
				return this.dom.checked;
			});

			return checkedItem ? checkedItem.dom.value : null;
		},

		setValue: function(value) {
			var checkEl, els, radio;

			if (typeof value == 'boolean') {
				this.callParent(arguments);
			} else if (this.rendered) {
				checkEl = this.getCheckEl();
				radio = Q.dom.get('input[name=' + this.el.dom.name + '][value='+value+']', checkEl.dom);

				if (radio) {
					componentMgr.get(radio.id).setValue(true);
				}
			}

			if (this.rendered && this.checked) {

				checkEl = checkEl || this.getCheckEl();
				els = Q.find('input[name=' + this.el.dom.name + ']', checkEl.dom);
				
				els.each(function(index, el) {
					if (el.id != this.id) {
						componentMgr.get(el.id).setValue(false);
					}
				}, this);

			}

			return this;
		},

		getCheckEl: function() {
			if (this.inGroup) {
				//有待扩展
			}

			return Q.get(this.el.dom.form || document.body);
		}
	});

	return Radio;
});