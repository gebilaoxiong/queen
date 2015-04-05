define([
	'controls/Container',
	'controls/Toolbar',
	'controls/Layer',
	'util/Template',
	'dd/PanelProxy'
], function(Container, Toolbar, Layer, Template, PanelProxy) {

	/*
        面板

    */
	var Panel = Q.Class.define(Container, {

		type: 'Panel',

		/*css命名空间*/
		baseCls: 'x-panel',

		/*折叠的css*/
		collapsedCls: 'x-panel-collapsed',

		/*
            是否显示header
            header: true,
        */

		headerAsText: true,

		background: true,


		/*fbar中的按钮浮动方向*/
		buttonAlign: 'right',

		/*是否折叠*/
		collapsed: false,

		/*折叠按钮是否第一个显示*/
		collapseFirst: true,

		/*按钮最小宽度*/
		minButtonWidth: 75,

		/*x-panel-body-wrap中的部件*/
		elements: 'body',

		preventBodyReset: false,

		/*内容区域的padding*/
		padding: undefined,

		/*重写需要监控重新布局的事件*/
		resizeEvent: 'bodyresize',

		/*工具需要呈现到的元素 header/footer/tbar/fbar*/
		toolTarget: 'header',

		collapseEl: 'bwrap',

		slideAnchor: 't',

		disabledCls: '',

		/*boxContainer*/
		deferHeight: true,

		initComponent: function() {

			this.callParent(arguments);

			//无样式
			if (this.unstyled) {
				this.baseCls = 'x-plain';
			}

			this.toolbars = [];

			// 控制呈现元素
			if (this.tbar) {
				this.elements += ',tbar';
				this.topToolbar = this.createToolbar(this.tbar);
				this.tbar = null;

			}

			if (this.bbar) {
				this.elements += ',bbar';
				this.bottomToolbar = this.createToolbar(this.bbar);
				this.bbar = null;
			}

			if (this.header === true) {
				this.elements += ',header';
				this.header = null;
			} else if (this.headerCfg || (this.title && this.header !== false)) {
				this.elements += ',header';
			}

			if (this.footerCfg || this.footer === true) {
				this.elements += ',footer';
				this.footer = null;
			}

			if (this.buttons) {
				this.fbar = this.buttons;
				this.buttons = null;
			}

			if (this.fbar) {
				this.createFbar(this.fbar);
			}

			if (this.autoLoad) {
				this.on('render', this.doAutoLoad, this, {
					delay: 10
				});
			}
		},

		/*实例化foot Toolbar*/
		createFbar: function(fbar) {
			var min = this.minButtonWidth;
			this.elements += ',footer';

			this.fbar = this.createToolbar(fbar, {
				buttonAlign: this.buttonAlign,
				toolbarCls: 'x-panel-fbar',
				enableOverflow: false
			});

			this.fbar.items.each(function(c) {
				c.minWidth = c.minWidth || this.minButtonWidth;
			}, this);

			this.buttons = this.fbar.items.data;
		},

		/*实例化工具栏*/
		createToolbar: function(tb, options) {
			var ret;

			if (Q.isArray(tb)) {
				tb = {
					items: tb
				};
			}

			if (tb.isXType && tb.isXType('Toolbar')) {
				ret = Q.extend(tb, options, this.toolbarSettings);
			} else {
				ret = this.createCmp(Q.extend({}, tb, options, this.toolbarSettings), Toolbar);
			}


			this.toolbars.push(ret);

			return ret;
		},

		/*创建容器元素*/
		createElement: function(name, pnode) {
			if (this[name]) {
				pnode.appendChild(this[name].dom);
				return;
			}

			if (name === 'bwrap' || this.elements.indexOf(name) != -1) {

				if (this[name + 'Cfg']) { //根据配置生成
					this[name] = Q.fly(pnode).createChild(this[name + 'Cfg']);
				} else {
					var el = document.createElement('div');
					el.className = this[name + 'Cls'];
					this[name] = Q.get(pnode.appendChild(el));
				}

				if (this[name + 'CssClass']) {
					this[name].addClass(this[name + 'CssClass']);
				}

				if (this[name + 'Style']) {
					this[name].dom.style.cssText = this[name + 'Style'];
				}
			}

			if (this[name] && !this[name].dom.id) {
				Q.id(this[name].dom);
			}
		},

		onRender: function(container, position) {
			this.callParent(arguments);

			this.createClasses();

			var el = this.el,
				dom = el.dom,
				bw,
				ts;

			//折叠
			if (this.collapsible && !this.hideCollapseTool) {
				this.tools = this.tools ? this.tools.slice(0) : [];

				this.tools[this.collapseFirst ? 'unshift' : 'push']({
					id: 'toggle',
					handler: this.toggleCollapse,
					scope: this
				});
			}

			//工具栏
			if (this.tools) {
				ts = this.tools;
				this.elements += (this.header !== false) ? ',header' : '';
			}

			this.tools = {};

			el.addClass(this.baseCls);

			if (dom.firstChild) { // HTML
				this.header = el.child('.' + this.headerCls);
				this.bwrap = el.child('.' + this.bwrapCls);
				var cp = this.bwrap ? this.bwrap : el;
				this.tbar = cp.child('.' + this.tbarCls);
				this.body = cp.child('.' + this.bodyCls);
				this.bbar = cp.child('.' + this.bbarCls);
				this.footer = cp.child('.' + this.footerCls);
				this.fromMarkup = true;
			}

			if (this.preventBodyReset === true) {
				el.addClass('x-panel-reset');
			}

			//自定义cls
			if (this.cls) {
				el.addClass(this.cls);
			}

			if (this.buttons) {
				this.elements += ',footer';
			}

			this.createElement('header', dom);
			this.createElement('bwrap', dom);

			//bwrap中的内容 工具栏+Body
			bw = this.bwrap.dom;
			this.createElement('tbar', bw);
			this.createElement('body', bw);
			this.createElement('bbar', bw);
			this.createElement('footer', bw);


			if (!this.header) {
				this.body.addClass(this.bodyCls + '-noheader');

				if (this.tbar) {
					this.tbar.addClass(this.tbarCls + '-noheader');
				}
			}

			if (Q.isDefined(this.padding)) {
				this.body.css('padding', this.padding);
			}

			//删除边框
			if (this.border === false) {
				this.el.addClass(this.baseCls + '-noborder');
				this.body.addClass(this.bodyCls + '-noborder');
				if (this.header) {
					this.header.addClass(this.headerCls + '-noborder');
				}
				if (this.footer) {
					this.footer.addClass(this.footerCls + '-noborder');
				}
				if (this.tbar) {
					this.tbar.addClass(this.tbarCls + '-noborder');
				}
				if (this.bbar) {
					this.bbar.addClass(this.bbarCls + '-noborder');
				}
			}

			if (this.bodyBorder === false) {
				this.body.addClass(this.bodyCls + '-noborder');
			}

			if (this.header) {
				this.header.addClass('unselect');

				//title标题
				if (this.headerAsText) {
					this.header.dom.innerHTML =
						'<span class="' + this.headerTextCls + '">' + this.header.dom.innerHTML + '</span>';

					if (this.iconCls) {
						this.setIconClass(this.iconCls);
					}
				}
			}

			//绝对、相对定位
			if (this.floating) {
				this.makeFloating(this.floating);
			}

			//点击头部折叠
			if (this.collapsible && this.titleCollapse && this.header) {
				this.header.on('click', this.toggleCollapse, this);
				this.header.css('cursor', 'pointer');
			}

			if (ts) {
				this.addTool.apply(this, ts);
			}

			//工具栏呈现
			if (this.fbar) {
				this.footer.addClass('x-panel-btns');
				this.fbar.ownerCt = this;
				this.fbar.render(this.footer);
				this.footer.createChild({
					'class': 'x-clear'
				});
			}
			if (this.tbar && this.topToolbar) {
				this.topToolbar.ownerCt = this;
				this.topToolbar.render(this.tbar);
			}
			if (this.bbar && this.bottomToolbar) {
				this.bottomToolbar.ownerCt = this;
				this.bottomToolbar.render(this.bbar);
			}

		},

		/*设置面板Icon*/
		setIconClass: function(cls) {
			var old = this.iconCls;
			this.iconCls = cls;

			if (this.rendered && this.header) {

				var hd = this.header,
					img = hd.child('img.x-panel-inline-icon'),
					iconHtml;

				if (img) {

					Q.fly(img).removeClass(old).addClass(this.iconCls);

				} else {

					var headerSpan = hd.child('span.' + this.headerTextCls);

					if (headerSpan) {

						iconHtml = Q.Element.createHtml({
							target: 'img',
							alt: '',
							src: Q.BLANK_ICON,
							'class': 'x-panel-inline-icon ' + this.iconCls
						})

						Q.Element.insertAdjacentHTML(headerSpan.dom, 'beforebegin', iconHtml);

					}
				}
			}

			this.fire('iconchange', this, cls, old);
		},

		/*将El设定为定位层*/
		makeFloating: function(cfg) {
			this.floating = true;
			this.el = new Layer(Q.extend({}, cfg, {
				constrain: false,
				shim: this.shim === false ? false : undefined
			}), this.el);
		},

		getTopToolbar: function() {
			return this.topToolbar;
		},

		getBottomToolbar: function() {
			return this.bottomToolbar;
		},

		getFooterToolbar: function() {
			return this.fbar;
		},

		addButton: function(config, handler, scope) {
			if (!this.fbar) {
				this.createFbar([]);
			}

			if (handler) {
				if (Q.isString(config)) {
					config = {
						text: config
					};
				}
				config = Q.extend({
					handler: handler,
					scope: scope || this
				}, config);
			}

			return this.fbar.add(config);
		},

		/*添加工具*/
		addTool: function() {
			if (!this.rendered) {

				if (!this.tools) {
					this.tools = [];
				}

				Q.each(arguments, function(_, arg) {
					this.tools.push(arg);
				}, this);

				return;
			}

			if (!this[this.toolTarget]) {
				return;
			}


			if (!this.toolTemplate) {
				//工具模板
				Panel.prototype.toolTemplate = new Template({
					tmpl: '<div class="x-tool x-tool-<%=$root%>"> </div>',
					escape: false
				});
			}

			for (var i = 0, a = arguments, len = a.length; i < len; i++) {
				var tc = a[i];

				if (!this.tools[tc.id]) {
					var overCls = 'x-tool-' + tc.id + '-over',
						toolHtml = this.toolTemplate.compile(tc.id),
						t = this[this.toolTarget].insertAdjacentHTML('afterbegin', toolHtml);

					t = new Q.Element(t);

					this.tools[tc.id] = t;

					t.on('click', this.createToolHandler(t, tc, overCls, this));

					if (tc.hidden) {
						t.hide();
					}

					if (tc.qtip) {
						t.dom.qtip = tc.qtip;
					}
				}
			}
		},

		onLayout: function(shallow, force) {
			this.callParent(arguments);

			if (this.hasLayout && this.toolbars.length > 0) {
				Q.each(this.toolbars, function(_, tb) {
					tb.doLayout(undefined, force);
				});
				this.syncHeight();
			}
		},

		syncHeight: function() {
			var h = this.toolbarHeight,
				body = this.body,
				lsh = this.lastSize.height,
				sz;

			if (this.autoHeight || !Q.isDefined(lsh) || lsh == 'auto') {
				return;
			}


			if (h != this.getToolbarHeight()) {
				h = Math.max(0, lsh - this.getFrameHeight());
				body.outerHeight(false, h);
				sz = {
					width: body.outerWidth(false),
					height: body.outerHeight(false)
				};

				this.toolbarHeight = this.getToolbarHeight();
				this.onBodyResize(sz.width, sz.height);
			}
		},

		onShow: function() {
			if (this.floating) {
				return this.el.show();
			}
			this.callParent(arguments);
		},

		// private
		onHide: function() {
			if (this.floating) {
				return this.el.hide();
			}
			this.callParent(arguments);
		},

		createToolHandler: function(t, tc, overCls, panel) {
			return function(e) {
				t.removeClass(overCls);

				if (tc.stopEvent !== false) {
					e.preventDefault();
					e.stopPropagation();
				}

				if (tc.handler) {
					tc.handler.call(tc.scope || t, e, t, panel, tc);
				}
			};
		},

		afterRender: function() {
			if (this.floating && !this.hidden) {
				this.el.show();
			}

			if (this.background === false) {
				this.el.addClass('x-panel-no-background');
			}

			if (this.title) {
				this.setTitle(this.title);
			}

			this.callParent(arguments);

			if (this.collapsed) {
				this.collapsed = false;
				this.collapse(false);
			}

			if (this.draggable) {
				this.initDraggable();
			}

			if (this.toolbars.length > 0) {

				Q.each(this.toolbars, function(_, tb) {
					tb.doLayout();
					tb.bind({
						scope: this,
						afterlayout: this.syncHeight,
						remove: this.syncHeight
					});
				}, this);

				this.syncHeight();
			}
		},

		initEvents: Q.noop,

		//拖拽
		initDraggable: function() {
			this.dd = new PanelProxy.DD(this, Q.isBool(this.draggable) ? null : this.draggable);
		},

		/*折叠*/
		collapse: function() {
			if (this.collapsed || this.fire('beforecollapse', this) === false) {
				return;
			}
			//var doAnim = animate === true || (animate !== false && this.animCollapse);
			//this.beforeEffect(doAnim);
			this.onCollapse();
			return this;
		},

		onCollapse: function() {
			this[this.collapseEl].hide();
			this.afterCollapse(false);
		},

		afterCollapse: function() {
			this.collapsed = true;
			this.el.addClass(this.collapsedCls);
			this[this.collapseEl].hide();

			this.fire('collapse', this);
		},

		expand: function() {
			if (!this.collapsed || this.fire('beforeexpand', this) === false) {
				return;
			}
			//var doAnim = animate === true || (animate !== false && this.animCollapse);
			this.el.removeClass(this.collapsedCls);
			//this.beforeEffect(doAnim);
			this.onExpand();
			return this;
		},

		// private
		onExpand: function() {
			this[this.collapseEl].show();
			this.afterExpand(false);
		},

		// private
		afterExpand: function() {
			this.collapsed = false;

			this[this.collapseEl].show();

			if (this.deferLayout) {
				delete this.deferLayout;
				this.doLayout(true);
			}

			this.fire('expand', this);
		},
		//折叠
		toggleCollapse: function() {
			this[this.collapsed ? 'expand' : 'collapse']();
			return this;
		},

		onResize: function(adjWidth, adjHeight, rawWidth, rawHeight) {
			var w = adjWidth,
				h = adjHeight;

			if (Q.isDefined(w) || Q.isDefined(h)) {
				if (!this.collapsed) { //未折叠

					if (Q.isNumber(w)) {
						this.body.width(w = this.adjustBodyWidth(w - this.getFrameWidth()));
					} else if (w == 'auto') {
						w = this.body.css('width', 'auto').dom.offsetWidth;
					} else {
						w = this.body.dom.offsetWidth;
					}

					if (this.tbar) {
						this.tbar.outerWidth(false, w);

						if (this.topToolbar) {
							this.topToolbar.setSize(w);
						}
					}

					if (this.bbar) {
						this.bbar.outerWidth(false, w);

						if (this.bottomToolbar) {
							this.bottomToolbar.setSize(w);
						}
					}

					if (this.footer) {
						this.footer.outerWidth(false, w);
						if (this.fbar) {
							if (Q.Browser.ie) {
								this.fbar.setWidth(w);
							} else {
								this.fbar.el.css('auto')
							}
						}
					}

					// At this point, the Toolbars must be layed out for getFrameHeight to find a result.
					if (Q.isNumber(h)) {
						h = Math.max(0, h - this.getFrameHeight());
						//h = Math.max(0, h - (this.getHeight() - this.body.getHeight()));
						this.body.outerHeight(false, h);
					} else if (h == 'auto') {
						this.body.css('height', h);
					}

					if (this.disabled && this.maskEL) {
						this.maskEL.outerWidth(false, this.el.dom.clientWidth);
						this.maskEL.outerWidth(false, this.el.outerWidth(false))
					}
				} else { //折叠状态

					if (!this.queuedExpand && this.allowQueuedExpand !== false) {
						this.queuedExpand = true;

						this.bind('expand', function(e) {
							delete this.queuedExpand;
							this.onResize(e.data.width, e.data.height);
						}, this, {
							single: true,
							data: {
								width: w,
								height: h
							}
						});
					}
				}
				this.onBodyResize(w, h);
			}
			this.callParent(arguments);
		},

		onBodyResize: function(w, h) {
			this.fire('bodyresize', this, w, h);
		},

		// private
		getToolbarHeight: function() {
			var h = 0;
			if (this.rendered) {
				Q.each(this.toolbars, function(_, tb) {
					h += tb.getHeight();
				}, this);
			}
			return h;
		},

		// deprecate
		adjustBodyHeight: function(h) {
			return h;
		},

		// private
		adjustBodyWidth: function(w) {
			return w;
		},

		getFrameWidth: function() {
			return this.el.getFrameWidth('left right') + this.bwrap.getFrameWidth('left right');
		},

		getFrameHeight: function() {
			var h = this.el.getFrameWidth('top bottom') + this.bwrap.getFrameWidth('top bottom');
			h += (this.tbar ? this.tbar.outerHeight(false) : 0) +
				(this.bbar ? this.bbar.outerHeight(false) : 0);

			h += (this.header ? this.header.outerHeight(false) : 0) +
				(this.footer ? this.footer.outerHeight(false) : 0);
			return h;
		},

		getInnerWidth: function() {
			return this.getSize().width - this.getFrameWidth();
		},

		getInnerHeight: function() {
			return this.body.innerHeight();
		},

		getLayoutTarget: function() {
			return this.body;
		},

		// private
		getContentTarget: function() {
			return this.body;
		},

		setTitle: function(title, iconCls) {
			this.title = title;

			if (this.header && this.headerAsText) {
				this.header.child('span').text(title);
			}

			if (iconCls) {
				this.setIconClass(iconCls);
			}

			this.fire('titlechange', this, title);
			return this;
		},


		beforeDestroy: function() {
			this.callParent(arguments);

			if (this.header) {
				this.header.off();
			}

			if (this.tools) {
				for (var k in this.tools) {
					Q.Abstract.destroy(this.tools[k]);
					delete k in this.tools;
				}
			}
			if (this.toolbars.length > 0) {
				Q.each(this.toolbars, function(_, tb) {
					tb.unbind('afterlayout', this.syncHeight, this);
					tb.unbind('remove', this.syncHeight, this);
				}, this);
			}
			if (Q.isArray(this.buttons)) {
				while (this.buttons.length) {
					Q.Abstract.destroy(this.buttons.shift());
				}
			}
			if (this.rendered) {

				Q.Abstract.destroy(
					this.ft,
					this.header,
					this.footer,
					this.tbar,
					this.bbar,
					this.body,
					this.mc,
					this.bwrap,
					this.dd
				);

				if (this.fbar) {
					Q.Abstract.destroy(
						this.fbar,
						this.fbar.el
					);
				}
			}

			Q.Abstract.destroy(this.toolbars);
		},

		createClasses: function() {
			this.headerCls = this.baseCls + '-header';
			this.headerTextCls = this.baseCls + '-header-text';
			this.bwrapCls = this.baseCls + '-bwrap';
			this.tbarCls = this.baseCls + '-tbar';
			this.bodyCls = this.baseCls + '-body';
			this.bbarCls = this.baseCls + '-bbar';
			this.footerCls = this.baseCls + '-footer';
		},

		getTool: function(id) {
			return this.tools[id];
		},

		createGhost: function(cls, useShim, appendTo) {
			var el = document.createElement('div');
			el.className = 'x-panel-ghost ' + (cls || '');

			if (this.header) {
				el.appendChild(this.el.dom.firstChild.cloneNode(true));
			}

			Q.fly(el.appendChild(document.createElement('ul')))
				.outerHeight(false, this.bwrap.dom.offsetHeight);

			el.style.width = this.el.dom.offsetWidth + 'px';;

			if (!appendTo) {
				this.container.dom.appendChild(el);
			} else {
				Q.dom.get(appendTo).appendChild(el);
			}

			if (useShim !== false && this.el.useShim !== false) {
				var layer = new Layer({
					useDisplay: true,
					constrain: false
				}, el);

				layer.show();

				return layer;
			} else {
				return new Q.Element(el);
			}
		}
	});

	Panel.prototype.defaultType = Panel;

	return Panel;
});