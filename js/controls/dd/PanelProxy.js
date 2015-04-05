define(['dd/DragSource'], function(DragSource) {

	var PanelProxy = {};

	PanelProxy.Proxy = Q.Class.define({
		init: function(panel, config) {
			this.panel = panel;
			this.id = this.panel.id + '-ddproxy';

			Q.extend(this, config);
		},

		insertProxy: true,

		setStatus: Q.noop,
		reset: Q.noop,
		update: Q.noop,
		stop: Q.noop,
		sync: Q.noop,

		getEl: function() {
			return this.ghost;
		},

		getGhost: function() {
			return this.ghost;
		},

		getProxy: function() {
			return this.proxy;
		},

		hide: function() {
			if (this.ghost) {
				if (this.proxy) {
					this.proxy.remove();
					delete this.proxy;
				}
				this.panel.el.dom.style.display = '';
				this.ghost.remove();
				delete this.ghost;
			}
		},

		show: function() {
			var size, html;

			if (!this.ghost) {

				this.ghost = this.panel.createGhost(
					this.panel.initCfg.cls,
					undefined,
					document.body);

				this.ghost.offset(this.panel.el.offset());

				if (this.insertProxy) {

					html = Q.Element.createHtml({
						'class': 'x-panel-dd-spacer'
					});
					
					this.proxy = new Q.Element(this.panel.el.insertAdjacentHTML(
						'beforebegin', html));

					size = this.panel.getSize();

					this.proxy.outerWidth(false, size.width);
					this.proxy.outerHeight(false, size.height);
				}
				this.panel.el.dom.style.display = 'none';
			}
		},

		repair: function(xy, callback, scope) {
			this.hide();
			if (typeof callback == "function") {
				callback.call(scope || this);
			}
		},

		moveProxy: function(parentNode, before) {
			if (this.proxy) {
				parentNode.insertBefore(this.proxy.dom, before);
			}
		}
	});


	PanelProxy.DD = Q.Class.define(DragSource, {

		init: function(panel, cfg) {
			this.panel = panel;

			this.dragData = {
				panel: panel
			};

			this.proxy = new PanelProxy.Proxy(panel, cfg);
			this.callParent('init', [this.panel.el, cfg]);

			var h = panel.header,
				el = panel.body;

			if (h) {
				this.setHandleElId(h.dom.id);
				el = panel.header;
			}
			el.css('cursor', 'move');
			this.scroll = false;
		},

		showFrame: Q.noop,
		startDrag: Q.noop,

		b4StartDrag: function(x, y) {
			this.proxy.show();
		},

		b4MouseDown: function(e) {
			var x = e.pageX,
				y = e.pageY;

			this.autoOffset(x, y);
		},

		onInitDrag: function(x, y) {
			this.onStartDrag(x, y);
			return true;
		},

		createFrame: Q.noop,

		getDragEl: function(e) {
			return this.proxy.ghost.dom;
		},

		endDrag: function(e) {
			this.proxy.hide();
			this.panel.saveState();
		},

		autoOffset: function(x, y) {
			x -= this.startPageX;
			y -= this.startPageY;
			this.setDelta(x, y);
		}

	});

	return PanelProxy;
})