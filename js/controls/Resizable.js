define([
	'util/Observable',
	'util/Template',
	'util/Region',
	'dd/DD',
	'dd/DDProxy'
], function(Observable, Template, Region, DD, DDProxy) {

	var Resizable = Q.Class.define(Observable, {

		type: 'Resizable',

		adjustments: {
			width: 0,
			height: 0
		},
		/**
		 * @cfg {Boolean} animate True to animate the resize (not compatible with dynamic sizing, defaults to false)
		 */
		animate: false,
		/**
		 * @cfg {Mixed} constrainTo Constrain the resize to a particular element
		 */
		/**
		 * @cfg {Boolean} disableTrackOver True to disable mouse tracking. This is only applied at config time. (defaults to false)
		 */
		disableTrackOver: false,
		/**
		 * @cfg {Boolean} draggable Convenience to initialize drag drop (defaults to false)
		 */
		draggable: false,
		/**
		 * @cfg {Number} duration Animation duration if animate = true (defaults to 0.35)
		 */
		duration: 0.35,
		/**
		 * @cfg {Boolean} dynamic True to resize the element while dragging instead of using a proxy (defaults to false)
		 */
		dynamic: false,
		/**
		 * @cfg {String} easing Animation easing if animate = true (defaults to <tt>'easingOutStrong'</tt>)
		 */
		easing: 'easeOutStrong',
		/**
		 * @cfg {Boolean} enabled False to disable resizing (defaults to true)
		 */
		enabled: true,
		/**
		 * @property enabled Writable. False if resizing is disabled.
		 * @type Boolean
		 */
		/**
		 * @cfg {String} handles String consisting of the resize handles to display (defaults to undefined).
		 * Specify either <tt>'all'</tt> or any of <tt>'n s e w ne nw se sw'</tt>.
		 */
		handles: false,
		/**
		 * @cfg {Boolean} multiDirectional <b>Deprecated</b>.  Deprecated style of adding multi-direction resize handles.
		 */
		multiDirectional: false,
		/**
		 * @cfg {Number} height The height of the element in pixels (defaults to null)
		 */
		height: null,
		/**
		 * @cfg {Number} width The width of the element in pixels (defaults to null)
		 */
		width: null,
		/**
		 * @cfg {Number} heightIncrement The increment to snap the height resize in pixels
		 * (only applies if <code>{@link #dynamic}==true</code>). Defaults to <tt>0</tt>.
		 */
		heightIncrement: 0,
		/**
		 * @cfg {Number} widthIncrement The increment to snap the width resize in pixels
		 * (only applies if <code>{@link #dynamic}==true</code>). Defaults to <tt>0</tt>.
		 */
		widthIncrement: 0,
		/**
		 * @cfg {Number} minHeight The minimum height for the element (defaults to 5)
		 */
		minHeight: 5,
		/**
		 * @cfg {Number} minWidth The minimum width for the element (defaults to 5)
		 */
		minWidth: 5,
		/**
		 * @cfg {Number} maxHeight The maximum height for the element (defaults to 10000)
		 */
		maxHeight: 10000,
		/**
		 * @cfg {Number} maxWidth The maximum width for the element (defaults to 10000)
		 */
		maxWidth: 10000,
		/**
		 * @cfg {Number} minX The minimum x for the element (defaults to 0)
		 */
		minX: 0,
		/**
		 * @cfg {Number} minY The minimum x for the element (defaults to 0)
		 */
		minY: 0,
		/**
		 * @cfg {Boolean} preserveRatio True to preserve the original ratio between height
		 * and width during resize (defaults to false)
		 */
		preserveRatio: false,
		/**
		 * @cfg {Boolean/String/Element} resizeChild True to resize the first child, or id/element to resize (defaults to false)
		 */
		resizeChild: false,
		/**
		 * @cfg {Boolean} transparent True for transparent handles. This is only applied at config time. (defaults to false)
		 */
		transparent: false,
		/**
		 * @cfg {Ext.lib.Region} resizeRegion Constrain the resize to a particular region
		 */
		/**
		 * @cfg {Boolean} wrap True to wrap an element with a div if needed (required for textareas and images, defaults to false)
		 * in favor of the handles config option (defaults to false)
		 */
		/**
		 * @cfg {String} handleCls A css class to add to each handle. Defaults to <tt>''</tt>.
		 */

		/*	
			True 将会保证调整尺寸的手柄总是可见，
			false仅仅在用户鼠标滑过可以调整尺寸的 边缘时显示它们。
			此属性仅在配置时可用。(默认为false) 
		*/
		pinned: false,

		init: function(el, config) {
			var position;

			this.el = Q.get(el);

			if (config && config.wrap) {
				config.resizeChild = this.el;

				this.el = this.el.wrap(typeof config.wrap == 'object' ? config.wrap : {
					'class': 'xresizable-wrap'
				});

				this.el.id = this.el.dom.id = config.resizeChild.attr('id') + 'rzwrap';

				position = {
					'overflow': 'hidden',
					"position": config.resizeChild.css('position'),
					"left": config.resizeChild.css('left'),
					"right": config.resizeChild.css('right'),
					"top": config.resizeChild.css('top'),
					"bottom": config.resizeChild.css('bottom'),
					"z-index": config.resizeChild.css('z-index')
				};
				this.el.css(position);

				config.resizeChild.css({
					left: undefined,
					right: undefinede,
					top: undefined,
					bottom: undefined,
					"z-index": "",
					position: 'static'
				});

				if (!config.width || !config.height) {
					this.el.outerWidth(false, config.resizeChild.outerWidth(false));
					this.el.outerHeight(false, config.resizeChild.outerHeight(false));
				}

				if (config.pinned && !config.adjustments) {
					config.adjustments = 'auto';
				}
			}

			this.proxy = createProxy(this.el, {
				target: 'div',
				'class': 'x-resizable-proxy unselect',
				id: this.el.attr('id') + '-rzproxy'
			}, document.body);

			Q.extend(this, config);

			if (this.pinned) {
				this.disableTrackOver = true;
				this.el.addClass('x-resizable-pinned');
			}

			var position = this.el.css('position');
			if (position != 'absolute' && position != 'fixed') {
				this.el.css('position', 'relative');
			}

			if (!this.handles) {
				this.handles = 's,e,se'; //下右，右下
				if (this.multiDirectional) {
					this.handles += ',n,w';
				}
			}

			if (this.handles == 'all') {
				this.handles = 'n s e w ne nw se sw';
			}

			var hs = this.handles.split(/\s*?[,;]\s*?| /),
				ps = Resizable.positions,
				i = 0,
				pos;

			while (pos = hs[i++]) {
				if (ps[pos]) {
					pos = ps[pos];
					this[pos] = new Resizable.Handle(this, pos, this.disableTrackOver, this.transparent, this.handleCls);
				}
			}

			this.corner = this.southeast;

			if (this.handles.indexOf('n') != -1 || this.handles.indexOf('w') != -1) {
				this.updateBox = true;
			}

			this.activeHandle = null;

			if (this.resizeChild) {
				if (typeof this.resizeChild == 'boolean') {
					this.resizeChild = Q.get(this.el.dom.firstChild, true);
				} else {
					this.resizeChild = Q.get(this.resizeChild, true);
				}
			}

			if (this.adjustments == 'auto') {
				var rc = this.resizeChild,
					hw = this.west,
					he = this.east,
					hn = this.north,
					hs = this.south;

				if (rc && (hw || hn)) {
					rc.position('relative');
					rc.css('left', hw ? hw.el.outerWidth(false) : 0);
					rc.css('top', hn ? hn.el.outerHeight(false) : 0);
				}
				this.adjustments = {
					width: (he ? -he.el.outerWidth(false) : 0) + (hw ? -hw.el.outerWidth(false) : 0),
					height: (hn ? -hn.el.outerHeight(false) : 0) + (hs ? -hs.el.outerHeight(false) : 0) - 1
				};
			}

			if (this.draggable) {

				this.dd = this.dynamic ?
					initDD(this.el, null) : initDDProxy(this.el, null, {
						dragElId: this.proxy.attr('id')
					});

				this.dd.setHandleElId(this.resizeChild ? this.resizeChild.id : this.el.id);

				if (this.constrainTo) {
					this.dd.constrainTo(this.constrainTo);
				}
			}

			if (this.width !== null && this.height !== null) {
				this.resizeTo(this.width, this.height);
			} else {
				this.updateChildSize();
			}

			if (Q.Browser.ie) {
				this.el.dom.style.zoom = 1;
			}

			this.callParent(arguments);
		},

		resizeTo: function(width, height) {
			this.el.outerWidth(false, width);
			this.el.outerHeight(false, height);
			this.updateChildSize();
			this.fire('resize', this, width, height, null);
		},

		startSizing: function(e, handle) {
			this.fire('beforeresize', this, e);
			if (this.enabled) { // 2nd enabled check in case disabled before beforeresize handler

				if (!this.overlay) {
					this.overlay = createProxy(this.el, {
						target: 'div',
						'class': 'x-resizable-overlay unselect',
						content: '&#160;'
					}, document.body);

					this.overlay.on('mousemove', this.onMouseMove, this);
					this.overlay.on('mouseup', this.onMouseUp, this);
				}
				this.overlay.css('cursor', handle.el.css('cursor'));

				this.resizing = true;
				this.startBox = this.el.getRegion();
				this.startPoint = {
					left: e.pageX,
					top: e.pageY
				};
				this.offsets = {
					left: (this.startBox.x + this.startBox.width) - this.startPoint.left,
					top: (this.startBox.y + this.startBox.height) - this.startPoint.top
				};

				this.overlay.outerWidth(false, Q.Element.getViewWidth(true));
				this.overlay.outerHeight(false, Q.Element.getViewHeight(true));
				this.overlay.show();

				if (this.constrainTo) {
					var ct = Q.get(this.constrainTo);
					this.resizeRegion = Region.getRegion(ct).adjust(
						ct.getFrameWidth('top'),
						ct.getFrameWidth('left'), -ct.getFrameWidth('bottom'), -ct.getFrameWidth('right')
					);
				}

				this.proxy.css({
					'visibility': 'hidden'
				}); // workaround display none
				this.proxy.show();
				this.proxy.outerWidth(false, this.startBox.width);
				this.proxy.outerHeight(false, this.startBox.height);
				this.proxy.offset({
					top: this.startBox.top,
					left: this.startBox.left
				});
				if (!this.dynamic) {
					this.proxy.css('visibility', 'visible');
				}
			}
		},

		onMouseDown: function(handle, e) {
			if (this.enabled) {
				e.preventDefault();
				e.stopPropagation();
				this.activeHandle = handle;
				this.startSizing(e, handle);
			}
		},

		// private
		onMouseUp: function(e) {
			this.activeHandle = null;
			var size = this.resizeElement();
			this.resizing = false;
			this.handleOut();
			this.overlay.hide();
			this.proxy.hide();
			this.fire('resize', this, size.width, size.height, e);
		},

		updateChildSize: function() {
			if (this.resizeChild) {
				var el = this.el,
					child = this.resizeChild,
					adj = this.adjustments;

				if (el.dom.offsetWidth) {
					var b = el.getSize(true);
					child.setSize(b.width + adj[0], b.height + adj[1]);
				}
				// Second call here for IE
				// The first call enables instant resizing and
				// the second call corrects scroll bars if they
				// exist
				if (Q.Broser.ie) {
					setTimeout(function() {
						if (el.dom.offsetWidth) {
							var b = el.getSize(true);
							child.outerWidth(false, b.width + adj.width);
							child.outerHeight(false, b.height + adj.height);
						}
					}, 10);
				}
			}
		},

		snap: function(value, inc, min) {
			if (!inc || !value) {
				return value;
			}
			var newValue = value;
			var m = value % inc;
			if (m > 0) {
				if (m > (inc / 2)) {
					newValue = value + (inc - m);
				} else {
					newValue = value - m;
				}
			}
			return Math.max(min, newValue);
		},

		resizeElement: function() {
			var box = this.proxy.getRegion();

			this.el.outerWidth(false, box.width);
			this.el.outerHeight(false, box.height);

			if (this.updateBox) {
				this.el.offset(box);
			}

			this.updateChildSize();

			if (!this.dynamic) {
				this.proxy.hide();
			}
			if (this.draggable && this.constrainTo) {
				this.dd.resetConstraints();
				this.dd.constrainTo(this.constrainTo);
			}
			return box;
		},

		constrain: function(v, diff, m, mx) {
			if (v - diff < m) {
				diff = v - m;
			} else if (v - diff > mx) {
				diff = v - mx;
			}
			return diff;
		},

		onMouseMove: function(e) {
			var point;

			if (this.enabled && this.activeHandle) {
				try { // try catch so if something goes wrong the user doesn't get hung

					point = {};
					point.x = point.right = point.left = point[0] = e.pageX;
					point.y = point.top = point.bottom = point[1] = e.pageY;

					if (this.resizeRegion && !this.resizeRegion.contains(point)) {
						return;
					}

					//var curXY = this.startPoint;
					var curSize = this.curSize || this.startBox,
						x = this.startBox.left,
						y = this.startBox.top,
						ox = x,
						oy = y,
						w = curSize.width,
						h = curSize.height,
						ow = w,
						oh = h,
						mw = this.minWidth,
						mh = this.minHeight,
						mxw = this.maxWidth,
						mxh = this.maxHeight,
						wi = this.widthIncrement,
						hi = this.heightIncrement,
						diffX = -(this.startPoint.left - Math.max(this.minX, point.left)),
						diffY = -(this.startPoint.top - Math.max(this.minY, point.top)),
						pos = this.activeHandle.position,
						tw,
						th;


					switch (pos) {
						case 'east':
							w += diffX;
							w = Math.min(Math.max(mw, w), mxw);
							break;
						case 'south':
							h += diffY;
							h = Math.min(Math.max(mh, h), mxh);
							break;
						case 'southeast':
							w += diffX;
							h += diffY;
							w = Math.min(Math.max(mw, w), mxw);
							h = Math.min(Math.max(mh, h), mxh);
							break;
						case 'north':
							diffY = this.constrain(h, diffY, mh, mxh);
							y += diffY;
							h -= diffY;
							break;
						case 'west':
							diffX = this.constrain(w, diffX, mw, mxw);
							x += diffX;
							w -= diffX;
							break;
						case 'northeast':
							w += diffX;
							w = Math.min(Math.max(mw, w), mxw);
							diffY = this.constrain(h, diffY, mh, mxh);
							y += diffY;
							h -= diffY;
							break;
						case 'northwest':
							diffX = this.constrain(w, diffX, mw, mxw);
							diffY = this.constrain(h, diffY, mh, mxh);
							y += diffY;
							h -= diffY;
							x += diffX;
							w -= diffX;
							break;
						case 'southwest':
							diffX = this.constrain(w, diffX, mw, mxw);
							h += diffY;
							h = Math.min(Math.max(mh, h), mxh);
							x += diffX;
							w -= diffX;
							break;
					}

					var sw = this.snap(w, wi, mw);
					var sh = this.snap(h, hi, mh);
					if (sw != w || sh != h) {
						switch (pos) {
							case 'northeast':
								y -= sh - h;
								break;
							case 'north':
								y -= sh - h;
								break;
							case 'southwest':
								x -= sw - w;
								break;
							case 'west':
								x -= sw - w;
								break;
							case 'northwest':
								x -= sw - w;
								y -= sh - h;
								break;
						}
						w = sw;
						h = sh;
					}

					if (this.preserveRatio) {
						switch (pos) {
							case 'southeast':
							case 'east':
								h = oh * (w / ow);
								h = Math.min(Math.max(mh, h), mxh);
								w = ow * (h / oh);
								break;
							case 'south':
								w = ow * (h / oh);
								w = Math.min(Math.max(mw, w), mxw);
								h = oh * (w / ow);
								break;
							case 'northeast':
								w = ow * (h / oh);
								w = Math.min(Math.max(mw, w), mxw);
								h = oh * (w / ow);
								break;
							case 'north':
								tw = w;
								w = ow * (h / oh);
								w = Math.min(Math.max(mw, w), mxw);
								h = oh * (w / ow);
								x += (tw - w) / 2;
								break;
							case 'southwest':
								h = oh * (w / ow);
								h = Math.min(Math.max(mh, h), mxh);
								tw = w;
								w = ow * (h / oh);
								x += tw - w;
								break;
							case 'west':
								th = h;
								h = oh * (w / ow);
								h = Math.min(Math.max(mh, h), mxh);
								y += (th - h) / 2;
								tw = w;
								w = ow * (h / oh);
								x += tw - w;
								break;
							case 'northwest':
								tw = w;
								th = h;
								h = oh * (w / ow);
								h = Math.min(Math.max(mh, h), mxh);
								w = ow * (h / oh);
								y += th - h;
								x += tw - w;
								break;

						}
					}

					this.proxy.outerWidth(false, w);
					this.proxy.outerHeight(false, h);
					this.proxy.offset({
						top: y,
						left: x
					});

					if (this.dynamic) {
						//this.resizeElement();
					}
				} catch (ex) {}
			}
		},

		handleOver: function() {
			if (this.enabled) {
				this.el.addClass('x-resizable-over');
			}
		},

		// private
		handleOut: function() {
			if (!this.resizing) {
				this.el.removeClass('x-resizable-over');
			}
		},

		/**
		 * Returns the element this component is bound to.
		 * @return {Ext.Element}
		 */
		getEl: function() {
			return this.el;
		},

		getResizeChild: function() {
			return this.resizeChild;
		},

		/**
		 * Destroys this resizable. If the element was wrapped and
		 * removeEl is not true then the element remains.
		 * @param {Boolean} removeEl (optional) true to remove the element from the DOM
		 */
		destroy: function(removeEl) {
			Q.destroy(this.dd, this.overlay, this.proxy);
			this.overlay = null;
			this.proxy = null;

			var ps = Resizable.positions;
			for (var k in ps) {
				if (typeof ps[k] != 'function' && this[ps[k]]) {
					this[ps[k]].destroy();
				}
			}
			if (removeEl) {
				this.el.remove();
				this.el = null;
			}
			this.unbind();
		},

		syncHandleHeight: function() {
			var h = this.el.outerHeight(true);
			if (this.west) {
				this.west.el.outerHeight(false, h);
			}
			if (this.east) {
				this.east.el.outerHeight(false, h);
			}
		}


	});

	Resizable.positions = {
		n: 'north',
		s: 'south',
		e: 'east',
		w: 'west',
		se: 'southeast',
		sw: 'southwest',
		nw: 'northwest',
		ne: 'northeast'
	};

	Resizable.Handle = Q.Class.define({
		init: function(rz, pos, disableTrackOver, transparent, cls) {

			var tplHtml

			if (!this.tpl) {
				// only initialize the template if resizable is used
				tplHtml = Q.Element.createHtml({
					target: 'div',
					'class': 'x-resizable-handle x-resizable-handle-<%=$root%> unselect'
				});

				Resizable.Handle.prototype.tpl = new Template(tplHtml);
			}

			this.position = pos;
			this.rz = rz;
			this.el = Q.get(rz.el.insertAdjacentHTML('beforeend', this.tpl.compile(pos)));

			if (transparent) {
				this.el.css('opacity', 0);
			}

			if (cls != undefined) {
				this.el.addClass(cls);
			}

			this.el.on('mousedown', this.onMouseDown, this);

			if (!disableTrackOver) {
				this.el.on('mouseover', this.onMouseOver, this);
				this.el.on('mouseout', this.onMouseOut, this);
			}
		},

		// private
		afterResize: function(rz) {
			// do nothing
		},
		// private
		onMouseDown: function(e) {
			this.rz.onMouseDown(this, e);
		},
		// private
		onMouseOver: function(e) {
			this.rz.handleOver(this, e);
		},
		// private
		onMouseOut: function(e) {
			this.rz.handleOut(this, e);
		},
		// private
		destroy: function() {
			this.el.remove();
			this.el = null;
		}
	});

	function createProxy(el, config, renderTo) {
		config = (typeof config == 'object') ? config : {
			target: "div",
			'class': config
		};

		var el = Q.get(el),
			div = document.createElement('div'),
			proxy = Q.Element.overwrite(div, config, true);

		div = null;

		if (renderTo) {
			proxy.appendTo(renderTo);
		} else {
			proxy.insertBefore(el);
		}

		return proxy;
	}

	function initDD(el, group, config, overrides) {
		var dd = new DD(Q.id(Q.dom.get(el)), group, config);

		return Q.extend(dd, overrides);
	}

	function initDDProxy(el, group, config, overrides) {
		var dd = new DDProxy(Q.id(Q.dom.get(el)), group, config);
		return Q.extend(dd, overrides);
	}


	return Resizable;
});