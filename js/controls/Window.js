define([
	'controls/Panel',
	'controls/Resizable',
	'controls/WindowMgr',
	'dd/DD'
], function(Panel, Resizable, WindowMgr, DD) {

	var Window = Q.Class.define(Panel, {

		type: 'Window',

		baseCls: 'x-window',

		resizable: true,

		draggable: true,

		closable: true,

		closeAction: 'close',

		constrain: false,

		constrainOffset: 3,

		constrainHeader: false,

		plain: false,

		minimizable: false,

		maximizable: false,

		minHeight: 100,

		minWidth: 200,

		/*是否在show的时候展开窗口*/
		expandOnShow: true,

		collapsible: false,

		/*呈现完毕后 是否自动隐藏*/
		initHidden: undefined,

		hidden: true,

		elements: 'header,body',

		floating: true,

		initComponent: function() {
			//初始化工具栏
			this.initTools();

			this.callParent(arguments);

			if (this.initHidden != undefined) {
				this.hidden = this.initHidden;
			}

			if (this.hidden === false) {
				this.hidden = true;
				this.show();
			}
		},

		getState: function() {
			return Q.extend(this.callParent(arguments) || {}, this.getBox(true));
		},

		onRender: function(container, position) {
			this.callParent(arguments);

			if (this.plain) {
				this.el.addClass('x-window-plain');
			}

			//用于模态窗口的时候获取失去的焦点
			this.focusEl = this.el.createChild({
				target: 'a',
				href: 'javascript:;',
				'class': 'x-dlg-focus',
				tabIndex: '-1',
				content: '&#160;'
			});

			this.focusEl.swallowEvent('click', true);

			//proxy
			this.proxy = this.el.createChild({
				'class': 'x-window-proxy'
			});


			if (this.modal) {
				this.mask = this.container.createChild({
					'class': 'x-mask'
				}, this.el.dom);

				this.mask.hide();
				this.mask.on('click', this.focus, this);
			}

			//双击头部最大化切换
			if (this.maximizable) {
				this.header.on('dblclick', this.toggleMaximize, this)
			}
		},

		initEvents: function() {
			this.callParent(arguments);
			//resize
			if (this.resizable) {
				this.resizer = new Resizable(this.el, {
					minWidth: this.minWidth,
					minHeight: this.minHeight,
					handles: this.resizeHandles || 'all',
					pinned: true,
					resizeElement: this.resizerAction,
					handleCls: 'x-window-handle'
				});

				this.resizer.window = this;

				this.resizer.bind('beforeresize', this.beforeResize, this)
			}

			if (this.draggable) {
				this.header.addClass('x-window-draggable');
			}

			this.el.on('mousedown', this.toFront, this);

			this.manager = this.manager || WindowMgr;
			this.manager.register(this);

			//已最大化
			if (this.maximized) {
				this.maximized = false;
				this.maximize();
			}

		},

		initDraggable: function() {
			this.dd = new Window.DD(this);
		},

		beforeDestroy: function() {
			if (this.rendered) {
				this.hide();
				this.clearAnchor();
				Q.Abstract.destroy(
					this.focusEl,
					this.resizer,
					this.dd,
					this.proxy,
					this.mask
				);
			}
			this.callParent(arguments);
		},

		onDestroy: function() {
			if (this.manager) { //解除注册
				this.manager.unregister(this);
			}
			this.callParent(arguments);
		},

		initTools: function() {

			//最小化
			if (this.minimizable) {
				this.addTool({
					id: 'minimize',
					handler: Q.proxy(this.minimize, this),
				});
			}

			if (this.maximizable) {

				//最大化
				this.addTool({
					id: 'maximize',
					handler: Q.proxy(this.maximize, this)
				});

				//恢复
				this.addTool({
					id: 'restore',
					handler: Q.proxy(this.restore, this),
					hidden: true
				});
			}

			//关闭
			if (this.closable) {
				this.addTool({
					id: 'close',
					handler: Q.proxy(this[this.closeAction], this)
				});
			}
		},

		resizerAction: function() {
			var box = this.proxy.getRegion();
			this.proxy.hide();
			this.window.handleResize(box);
			return box;
		},

		beforeResize: function() {
			this.resizer.minHeight = Math.max(this.minHeight, this.getFrameHeight() + 40); // 40 is a magic minimum content size?
			this.resizer.minWidth = Math.max(this.minWidth, this.getFrameWidth() + 40);
			this.resizeBox = this.el.getRegion();
		},

		updateHandles: function() {
			if (Q.Browser.ie && this.resizer) {
				this.resizer.syncHandleHeight();
			}
		},

		// private
		handleResize: function(box) {
			var rz = this.resizeBox;

			if (rz.x != box.x || rz.y != box.y) {
				this.updateBox(box);
			} else {
				this.setSize(box);
			}
			this.focus();
			this.updateHandles();
			this.saveState();
		},

		focus: Q.noop,
		/*function() {
			var focusEl = this.focusEl,
				defaultButton = this.defaultButton,
				defaultButtonType = typeof defaultButton,
				el, container;


			if (defaultButton != undefined) {
				if (Q.isNumber(defaultButton) && this.fbar) { //数字 获取fbar中的按钮
					focusEl = this.fbar.items.get(defaultButton);
				} else if (Q.isString(defaultButton)) { //id
					focusEl = ComponentMgr.get(defaultButton);
				} else {
					focusEl = defaultButton;
				}

				el = focusEl.getEl();
				container = Q.dom.get(this.container);

				if (el && container) {
					if (container != document.body && )
				}
			}
		*/

		beforeShow: function() {
			var xy, pos;

			delete this.el.lastXY;
			delete this.el.lastLT;


			this.el.show();
			if (this.x === undefined || this.y === undefined) {
				xy = this.el.getAlignToXY(this.container, 'c-c');
				pos = this.el.translatePoints(xy.left, xy.top);
				this.x = this.x === undefined ? pos.left : this.x;
				this.y = this.y === undefined ? pos.top : this.y;
			}

			this.el.css({
				top: this.y,
				left: this.x
			});

			if (this.expandOnShow) {
				this.expand(false);
			}

			if (this.modal) {
				this.getBody(true).addClass('x-body-masked');
				this.mask.show();
				this.mask.outerWidth(false, Q.Element.getViewWidth(true));
				this.mask.outerHeight(false, Q.Element.getViewHeight(true));
			}
		},

		show: function(callback, scope) {
			if (!this.rendered) { //未呈现
				this.render(this.getBody());
			}

			if (this.hidden === false) {
				this.toFront();
				return this;
			}
			if (this.fire('beforeshow', this) === false) {
				return this;
			}

			if (callback) {
				this.bind('show', callback, scope, {
					single: true
				});
			}

			this.hidden = false;

			this.beforeShow();
			this.afterShow();
			return this;
		},

		afterShow: function() {
			if (this.isDestroyed) {
				return false;
			}

			this.proxy.hide();

			if (this.maximized) { //最大化
				this.fitContainer();
			}

			if (this.monitorResize || this.modal || this.constrain || this.constrainHeader) {
				Q.fly(window).on('resize', this.onWindowResize, this);
			}

			this.doConstrain();
			this.doLayout();

			this.toFront();
			this.updateHandles();

			this.onShow();
			this.fire('show', this);
		},

		hide: function(callback, scope) {
			if (this.hidden || this.fire('beforehide', this) === false) {
				return this;
			}

			if (callback) {
				this.bind('hide', callback, scope, {
					single: true
				});
			}

			this.hidden = true;

			if (this.modal) {
				this.mask.hide();
				this.getBody(true).removeClass('x-body-masked');
			}

			//this.el.hide();
			this.afterHide();
			return this;
		},

		afterHide: function() {
			this.proxy.hide();
			if (this.monitorResize || this.modal || this.constrain || this.constrainHeader) {
				Q.fly(window).off('resize', this.onWindowResize, this);
			}
			this.onHide();
			this.fire('hide', this);
		},


		onShow: Q.noop,

		onHide: Q.noop,

		onWindowResize: function() {
			if (this.maximized) {
				this.fitContainer();
			}

			if (this.modal) {
				this.mask.outerWidth(false, Q.Element.getViewWidth(true));
				this.mask.outerHeight(false, Q.Element.getViewHeight(true));
			}
			this.doConstrain();
		},

		/*限制范围*/
		doConstrain: function() {
			var offsets, size, xy, constrainOffset;

			if (this.constrain || this.constrainHeader) {

				if (this.constrain) {
					constrainOffset = this.constrainOffset;

					offsets = {
						right: constrainOffset,
						left: constrainOffset,
						bottom: constrainOffset,
						top: constrainOffset
					};

				} else { //constrainHeader
					size = this.getSize();

					offsets = {
						right: -(size.width - 100),
						bottom: -(size.height - 25)
					};
				}

				xy = this.el.getConstrainToXY(this.container, true, offsets);

				if (xy) {
					this.setPosition(xy);
				}
			}
		},

		ghost: function(cls) {
			var ghost = this.createGhost(cls),
				box = this.getBox(true);

			ghost.css({
				top: box.y,
				left: box.x
			});

			ghost.outerWidth(false, box.width);

			this.activeGhost = ghost;

			return ghost;
		},

		afterGhost: function() {
			this.el.hide();
		},

		unghost: function(show, matchPosition) {
			if (!this.activeGhost) {
				return;
			}

			if (matchPosition !== false) {
				this.setPosition({
					top: this.activeGhost.css('top'),
					left: this.activeGhost.css('left'),
				});
			}

			this.activeGhost.hide();
			this.activeGhost.remove();
			delete this.activeGhost;
		},
		afterUnghost: function(show) {
			if (show !== false) {
				this.el.show();
			}
		},

		minimize: function() {
			this.fire('minimize', this);
			return this;
		},

		close: function() {
			if (this.fire('beforeclose', this) !== false) {
				if (this.hidden) {
					this.doClose();
				} else {
					this.hide(this.doClose, this);
				}
			}
		},

		doClose: function() {
			this.fire('close', this);
			this.destroy();
		},

		maximize: function() {
			if (!this.maximized) {
				this.expand(false);
				this.restoreSize = this.getSize();
				this.restorePos = this.getPagePosition();

				if (this.maximizable) { //工具状态转换
					this.tools.maximize.hide();
					this.tools.restore.show();
				}

				this.maximized = true;

				if (this.dd) {
					this.dd.lock();
				}

				if (this.collapsible) {
					this.tools.toggle.hide();
				}

				this.el.addClass('x-window-maximized'); //标记class
				this.container.addClass('x-window-maximized-ct'); //给容器添加class

				this.setPosition({
					top: 0,
					left: 0
				});

				this.fitContainer();
				this.fire('maximize', this);
			}
			return this;
		},

		restore: function() {
			if (this.maximized) {
				var tools = this.tools;

				this.el.removeClass('x-window-maximized');

				if (tools.restore) {
					tools.restore.hide();
				}

				if (tools.maximize) {
					tools.maximize.show();
				}

				this.setPosition(this.restorePos);

				this.setSize(this.restoreSize.width, this.restoreSize.height);

				delete this.restorePos;
				delete this.restoreSize;

				this.maximized = false;

				if (this.dd) {
					this.dd.unlock();
				}
				if (this.collapsible && tools.toggle) {
					tools.toggle.show();
				}

				this.container.removeClass('x-window-maximized-ct');

				this.doConstrain();
				this.fire('restore', this);
			}
			return this;
		},

		toggleMaximize: function() {
			return this[this.maximized ? 'restore' : 'maximize']();
		},

		// private
		fitContainer: function() {
			var container = this.container;
			this.setSize(container.outerWidth(false), container.outerHeight(false));
		},

		setZIndex: function(index) {
			if (this.modal) {
				this.mask.css('zIndex', index);
			}

			this.el.css('zIndex', ++index);

			index += 5;

			if (this.resizer) {
				this.resizer.proxy.css('zIndex', ++index);
			}

			this.lastZIndex = index;
		},

		alignTo: function(element, position, offsets) {
			var xy = this.el.getAlignToXY(element, position, offsets);
			this.setPagePosition(xy);
			return this;
		},

		anchorTo: function(el, alignment, offsets, monitorScroll) {
			this.clearAnchor();

			this.anchorTarget = {
				el: el,
				alignment: alignment,
				offsets: offsets
			};

			Q.fly(window).on('resize', this.doAnchor, this);

			var tm = typeof monitorScroll;

			if (tm != 'undefined') {
				//需要添加定时器
				Q.fly(window).on('scroll', this.doAnchor, this);
			}

			return this.doAnchor();
		},

		doAnchor: function() {
			var o = this.anchorTarget;
			this.alignTo(o.el, o.alignment, o.offsets);
			return this;
		},

		clearAnchor: function() {
			if (this.anchorTarget) {
				Q.fly(window).off('resize', this.doAnchor, this);
				Q.fly(window).off('scroll', this.doAnchor, this);
				delete this.anchorTarget;
			}
			return this;
		},

		toFront: function(e) {
			if(this.manager.bringToFront(this)){
				if(!e||!e.target.focus){
					this.focus();
				}
			}
			return this;
		},

		setActive: function(active) {
			if (active) {
				this.fire('activate', this);
			} else {
				this.fire('deactivate', this);
			}
		},

		toBack: function() {
			this.manager.sendToBack(this);
			return this;
		},

		center: function() {
			var xy = this.el.getAlignToXY(this.container, 'c-c');
			this.setPagePosition(xy);
			return this;
		}
	});

	Window.DD = Q.Class.define(DD, {

		init: function(win) {
			this.win = win;
			this.callParent('init',[win.el.dom.id, 'WindowDD-' + win.id]);

			this.setHandleElId(win.header.dom.id);
			this.scroll = false;
		},

		moveOnly: true,

		headerOffsets: [100, 25],

		startDrag: function() {
			var win = this.win,
				constrainOffset;

			this.proxy = win.ghost(win.initCfg.cls);

			if (win.constrain !== false) { //限制在容器内
				constrainOffset = win.constrainOffset;
				this.constrainTo(win.container, {
					right: constrainOffset,
					left: constrainOffset,
					bottom: constrainOffset
				});

			} else if (win.constrainHeader !== false) { //限制header在容器内
				this.constrainTo(win.container, {
					right: -(this.proxy.outerWidth(false) - this.headerOffsets[0]),
					bottom: -(this.proxy.outerHeight(false) - this.headerOffsets[1])
				});
			}

			win.afterGhost();
		},
		b4Drag: Q.noop,

		onDrag: function(e) {
			this.alignElWithMouse(this.proxy, e.pageX, e.pageY);
		},

		endDrag: function(e) {
			this.win.unghost();
			this.win.saveState();
			this.win.afterUnghost();
		}
	});

	return Window;
});