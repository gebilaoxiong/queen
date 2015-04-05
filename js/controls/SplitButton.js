define(['controls/Button'], function(Button) {

	var SplitButton = Q.Class.define(Button, {

		setArrowHandler: function(handler, scope) {
			this.arrowHandler = handler;
			this.scope = scope;
		},

		getMenuClass: function() {
			return 'x-btn-split x-btn-split-' + this.arrowAlign;
		},

		/*是否点击箭头上*/
		isClickOnArrow: function(e) {
			return this.isOnArray({
				left: e.pageX,
				top: e.pageY
			});
		},

		isOnArray: function(pos) {
			var ret;

			switch (this.arrowAlign) {
				case 'right':
					ret = pos.left > this.btnEl.dom.offsetWidth + this.btnEl.offset().left;
					break;
				case 'left':
					ret = pos.left < this.btnEl.offset().left;
					break;
				case 'top':
					ret = pos.top < this.btnEl.offset().top;
					break;
				case 'bottom':
					ret = pos.top > this.btnEl.dom.offsetHeight + this.btnEl.offset().top
					break;
			}
			return ret;
		},

		onClick: function(e) {
			e.preventDefault();

			if (!this.disabled) {

				if (this.isClickOnArrow(e)) { //点击的箭头

					if (this.menu && !this.menu.isVisible() && !this.ignoreNextClick) {
						this.showMenu();
					}
					this.fire("arrowclick", this, e);

					if (this.arrowHandler) {
						this.arrowHandler.call(this.scope || this, this, e);
					}

				} else {
					this.doToggle();
					this.fire("click", this, e);

					if (this.handler) {
						this.handler.call(this.scope || this, this, e);
					}
				}
			}
		},

		/*有待修改*/
		isMenuTriggerOver: function(e) {
			return this.menu && this.isOnArray({
				left: e.pageX,
				top: e.pageY
			});
		},

		isMenuTriggerOut: function(e) {
			return this.menu && !this.isOnArray({
				left: e.pageX,
				top: e.pageY
			});
		}
	});

	return SplitButton;
});