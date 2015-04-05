define(['controls/Container', 'layout/FitLayout'], function(Container, FitLayout) {

	var Viewport = Q.Class.define(Container, {

		type:'Viewport',

		initComponent: function() {
			var me=this;

			me.callParent(arguments);

			document.getElementsByTagName('html')[0].className = 'x-viewport';
			me.el = me.getBody(true);
			me.el.dom.scroll = 'no';

			me.allowDomMove = false;
			me.setSize = Q.noop;

			Q.Element.on(window, 'resize', me.onWindowResizeHanler, me);
			me.renderTo = me.el;
		},

		onWindowResizeHanler: function(e, w, h) {
			this.fireResize(w, h);
		},

		fireResize: function(w, h) {
			this.fire('resize', this, w, h, w, h);
		},

		beforeDestroy: function() {
			var me=this;
			
			document.getElementsByTagName('html')[0].className = '';
			Q.Element.off(window, 'resize', me.onWindowResizeHanler, me);
			me.callParent(arguments);
		}
	});

	Viewport.prototype.layout = FitLayout;

	return Viewport;
})