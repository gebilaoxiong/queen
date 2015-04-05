define([
	'layout/ContainerLayout',
	'util/Template'
], function(ContainerLayout, Template) {

	var BorderLayout = Q.Class.define(ContainerLayout, {

		/*监控组件的resize事件*/
		monitorResize: true,

		// private
		rendered: false,

		type: 'Border',

		targetCls: 'x-border-layout-ct',

		getLayoutTargetSize: function() {
			var target = this.host.getLayoutTarget();

			return target ? {
				width: target.innerWidth(),
				height: target.innerHeight()
			} : {};
		},

		onLayout: function(host, target) {
			var collapsed, i, cmp, pos,
				me = this,
				items = host.items.data,
				len = items.length,
				size;

			//未绘制
			if (!me.rendered) {
				//折叠的元素
				collapsed = [];

				for (i = 0; i < len; i++) {
					cmp = items[i];

					pos = cmp.region;

					//如果控件初始化的时候已折叠 放入数组中
					if (cmp.collapsed) {
						collapsed.push(cmp);
					}

					//将所有控件设置为不折叠
					cmp.collapsed = false;

					//如果控件未呈现 呈现之 添加标记cls
					if (!cmp.rendered) {
						cmp.render(target, i);
						cmp.getPositionEl().addClass('x-border-panel');
					}

					me[pos] = new BorderLayout.Region(me, cmp.initCfg, pos);
					me[pos].render(target, cmp);
				}
				this.rendered = true;
			}

			size = me.getLayoutTargetSize();

			if (size.width < 20 || size.height < 20) {

				if (collapsed) { //缓存折叠的元素 并延迟布局
					me.restoreCollapsed = collapsed;
				}
				return;

			} else if (me.restoreCollapsed) { //从延迟布局中恢复

				collapsed = me.restoreCollapsed;
				delete me.restoreCollapsed;

			}


			var width = size.width,
				height = size.height,
				/*center*属性是用于计算center的位置、大小*/
				centerW = width, //中心宽度
				centerH = height, //中心高度
				centerY = 0, //中心Y点
				centerX = 0, //中心X点
				north = me.north,
				south = me.south,
				west = me.west,
				east = me.east,
				center = me.center,
				box, margins,
				totalWidth,
				totalHeight,
				centerBox,
				targetSize;

			if (!center) {
				throw '中部区域没有定义 ' + ct.id;
			}

			//上
			if (north && north.isVisible()) {
				box = north.getSize();
				margins = north.getMargins();
				box.width = width - (margins.left + margins.right);
				box.left = margins.left;
				box.top = margins.top;
				/*
					中心预留宽度:
					y点：上部高度+上部上下边距
					高度: 先用高度减去y点位置
				*/
				centerY = box.height + margins.top + margins.bottom;
				centerH -= centerY;

				north.applyLayout(box);
			}

			//下
			if (south && south.isVisible()) {
				box = south.getSize();
				margins = south.getMargins();
				box.width = width - (margins.left + margins.right);
				box.left = margins.left;
				totalHeight = (box.height + margins.top + margins.bottom);
				//计算y值 需要用合计高度-控件高度+控件上边距
				//因为totalHeight中包含了上边距 等于说多减去了 所以要加回来
				box.top = height - totalHeight + margins.top;
				/*继续计算中心预留宽度=-（下部高度+上部上下外边距）*/
				centerH -= totalHeight;

				south.applyLayout(box);
			}

			//左
			if (west && west.isVisible()) {
				box = west.getSize();
				margins = west.getMargins();
				box.height = centerH - (margins.top + margins.bottom);
				box.left = margins.left;
				box.top = centerY + margins.top;
				totalWidth = box.width + margins.left + margins.right;

				/*
				 	计算中心X点 及宽度
				 	x点为左的宽度+左右边距
				*/
				centerX += totalWidth;
				centerW -= totalWidth;

				west.applyLayout(box);
			}

			//右
			if (east && east.isVisible()) {
				box = west.getSize();
				margins = west.getMargins();
				box.height = centerH - (margins.top + margins.bottom);
				totalWidth = (b.width + margins.left + margins.right);
				box.left = width - totalWidth + margins.left;
				box.top = centerY + margins.top;

				/*继续计算中心宽度*/
				centerW -= totalWidth;
				east.applyLayout(box);
			}

			//哈哈 重头戏 中部布局
			if (center) {
				margins = center.getMargins();
				centerBox = {
					left: centerX + margins.left,
					top: centerY + margins.top,
					width: centerW - (margins.left + margins.right),
					height: centerH - (margins.top + margins.bottom)
				};
				center.applyLayout(centerBox);
			}

			//如果有折叠元素 遍历 折叠之
			if (collapsed) {
				for (i = 0, len = collapsed.length; i < len; i++) {
					collapsed[i].collapse(false);
				}
			}

			//如果容器允许内容溢出，且border布局完毕后的size超出了容器的 size那么重新整理布局
			if (i = target.css('overflow') && i != 'hidden' && !this.adjustmentPass) {
				targetSize = me.getLayoutTargetSize();

				if (targetSize.width != size.width || target.height != size.height) {
					this.adjustmentPass = true;
					this.onLayout(host, target);
				}
			}
			delete this.adjustmentPass;
		},

		destroy: function() {
			var regions = ['north', 'south', 'east', 'west'],
				i, region;

			for (i = 0; i < regions.length; i++) {
				if (region = this[regions[i]]) {
					if (region.destroy) {
						region.destroy();
					} else if (region.split) {
						region.split.destroy(true);
					}
				}
			}

			this.callParent(arguments);
		}

	});


	BorderLayout.Region = Q.Class.define({
		/*是否可折叠*/
		collapsible: false,

		/*是否已经折叠*/
		isCollapsed: false,

		/*true 将会创建一个 SplitRegion 并在当前区域和相邻区域之间动态地显示一个宽度为5px的边界*/
		split: false,

		/*true 是否折叠后 点击折叠区域显示浮动面板。 */
		floatable: true,

		minWidth: 50,

		minHeight: 50,


		// 默认外边距
		defaultMargins: {
			left: 0,
			top: 0,
			right: 0,
			bottom: 0
		},
		//上部默认边距
		defaultNSCMargins: {
			left: 5,
			top: 5,
			right: 5,
			bottom: 5
		},
		//下部
		defaultEWCMargins: {
			left: 5,
			top: 0,
			right: 5,
			bottom: 0
		},

		floatingZIndex: 100,

		init: function(layout, config, pos) {
			var me = this;

			Q.extend(me, config);

			me.layout = layout;
			me.position = pos;
			me.state = {};

			//解析外边距
			if (typeof me.margins == 'string') {
				me.margins = me.layout.parseFiller(me.margins)
			}

			me.margins = Q.applyIf(me.margins || {}, me.defaultMargins);

			if (me.collapsible) { //可折叠

				//折叠后的区域边界
				if (typeof me.cmargins == 'string') {
					me.cmargins = me.layout.parseFiller(me.cmargins);
				}

				//折叠模式为mini 且没有设置折叠后的边界
				if (me.collapseMode == 'mini' && !me.cmargins) {

					me.cmargins = {
						left: 0,
						top: 0,
						right: 0,
						bottom: 0
					};

				} else {
					me.cmargins = Q.applyIf(me.cmargins || {},
						pos == 'north' || pos == 'south' ?
						me.defaultNSCMargins : me.defaultEWCMargins);
				}
			}
		},

		render: function(container, panel) {
			var me = this,
				getState, position;

			me.panel = panel;
			me.targetEl = container;
			me.el = panel.el;

			if (panel.margins) {
				me.margins = Q.isString(panel.margins) ?
					me.layout.parseFiller(panel.margins) :
					panel.margins;

				me.margins = Q.applyIf(me.margins || {}, me.defaultMargins);
			}

			//覆盖Panel的getSate
			getState = panel.getState;
			position = me.position;

			//将自己的状态添加到panel的state中
			panel.getState = Q.proxy(function() {
				return Q.extend(getState.call(panel) || {}, me.state);
			}, me);

			//如果位置非中 那么需要绑定他的折叠、隐藏、显示事件
			if (position != 'center') {
				panel.allowQueuedExpand = false;

				panel.bind({
					beforecollapse: me.beforeCollapse,
					collapse: me.onCollapse,
					beforeexpand: me.beforeExpand,
					expand: me.onExpand,
					hide: me.onHide,
					show: me.onShow,
					scope: me
				});

				if (me.collapsible || me.floatable) {
					panel.collapseEl = 'el';
					panel.slideAnchor = me.getSlideAnchor();
				}

				if (panel.tools && panel.tools.toggle) {
					panel.tools.toggle.addClass('x-tool-collapse-' + position);
					//panel.tools.toggle.addClassOnOver('x-tool-collapse-' + ps + '-over');
				}
			}
		},

		/**
		 * 获取折叠后的占位面板
		 */
		getCollapsedEl: function() {
			var me = this,
				expandToolEl;

			//初次生成折叠元素
			if (!me.collapsedEl) {

				if (!me.toolTemplate) {
					BorderLayout.Region.prototype.toolTemplate = new Template('<div class="x-tool x-tool-<%=id%>">&#160;</div>');
				}

				//生成折叠按钮
				me.collapsedEl = me.targetEl.createChild({
					'class': 'x-layout-collapsed x-layout-collapsed-' + me.position,
					id: me.panel.id + '-xcollapsed'
				});

				//折叠模式mini
				if (me.collapseMode == 'mini') {
					me.collapsedEl.addClass('x-layout-cmini-' + me.position);

					//迷你折叠开关
					me.miniCollapsedEl = me.collapsedEl.createChild({
						'class': "x-layout-mini x-layout-mini-" + me.position,
						content: "&#160;"
					});

					me.collapsedEl.on('click', this.onExpandClickHandler, this);
				} else {
					//允许折叠 且不隐藏折叠工具
					if (me.collapsible !== false && !this.hideCollapseTool) {

						expandToolEl = me.expandToolEl = new Q.Element(me.collapsedEl.insertAdjacentHTML(
							'beforeend', me.toolTemplate.compile({
								id: 'expand-' + me.position
							})));

						expandToolEl.on('click', me.onExpandClickHandler, this);
					}


					if (me.floatable !== false || me.titleCollapse) {
						me.collapsedEl.on("click", me[this.floatable ? 'collapseClick' : 'onExpandClick'], me);
					}
				}
			}

			return this.collapsedEl;
		},

		onExpandClickHandler: function(e) {
			e.stopPropagation();
			e.preventDefault();

			this.onExpandClick();
		},

		/*折叠容器点击*/
		onExpandClick: function(e) {
			var me = this;

			this.panel.expand();
		},

		/*折叠按钮点击-直接折叠*/
		onCollapseClick: function(e) {
			this.panel.collapse();
		},

		/*panel事件处理函数-折叠前*/
		beforeCollapse: function(e, panel) {
			var me = this,
				el;

			//隐藏拖拽元素
			if (me.splitEl) {
				me.splitEl.hide();
			}

			me.getCollapsedEl().show();

			el = me.panel.getEl();
			//缓存面板原始的zindex
			me.orginalZIndex = el.css('zIndex');
			el.css('zIndex', 100);
			//状态变更
			me.isCollapsed = true;
			//调整布局
			me.layout.layout();
		},

		/*panel事件处理函数-折叠完毕后*/
		onCollapse: function() {
			var me = this;

			me.panel.el.css('zIndex', 1);
			//显示折叠占位元素
			me.getCollapsedEl().dom.style.visibility = 'visible';

			me.state.collapsed = true;
			me.panel.saveState();
		},

		/*panel事件处理函数-展开前*/
		beforeExpand: function() {
			var me = this,
				collapsedEl;

			if (me.isSlid) {
				me.afterSlideIn();
			}

			collapsedEl = me.getCollapsedEl();
			me.el.show();

			if (me.position == 'east' || me.position == 'west') { //上下不调整高度
				me.panel.setSize(undefined, collapsedEl.outerHeight(false));
			} else {
				me.panel.setSize(collapsedEl.outerWidth(false), undefined);
			}

			//展开之前 隐藏面板折叠占位容器
			collapsedEl.hide();
			collapsedEl.dom.style.visibility = 'hidden';
			me.panel.el.css('z-index', this.floatingZIndex);
		},

		/*panel事件处理函数-展开*/
		onExpand: function() {
			var me = this;

			me.isCollapsed = false;

			if (me.splitEl) {
				me.splitEl.show();
			}

			me.layout.layout();
			me.panel.el.css('zIndex', me.orginalZIndex);
			me.state.collapsed = false;
			me.panel.saveState();
		},

		collapseClick: function(e) {
			var me = this;

			e.stopPropagation();
			if (me.isSlid) {
				me.slideIn();
			} else {
				me.slideOut();
			}
		},

		/*panel事件处理函数-隐藏*/
		onHide: function() {
			var me = this;

			if (me.isCollapsed) {
				me.getCollapsedEl().hide();
			} else if (me.splitEl) {
				me.splitEl.hide();
			}
		},

		/*panel事件处理函数-显示*/
		onShow: function() {
			var me = this;

			if (me.isCollapsed) {
				me.getCollapsedEl().show();
			} else if (me.splitEl) {
				me.splitEl.show();
			}
		},

		isVisible: function() {
			return !this.panel.hidden;
		},

		getMargins: function() {
			var me = this;
			return me.isCollapsed && me.cmargins ? me.cmargins : me.margins;
		},

		getSize: function() {
			var me = this,
				el;

			el = me.isCollapsed ?
				me.getCollapsedEl() : me.panel.el;

			return {
				width: el.outerWidth(false),
				height: el.outerHeight(false)
			};
		},

		setPanel: function(panel) {
			this.panel = panel;
		},

		getMinWidth: function() {
			return this.minWidth;
		},

		getMinHeight: function() {
			return this.minHeight;
		},

		// private
		applyLayoutCollapsed: function(box) {
			var collapsedEl = this.getCollapsedEl();

			collapsedEl.css({
				left: box.left,
				top: box.top
			});

			collapsedEl.outerWidth(false, box.width);
			collapsedEl.outerHeight(false, box.height);
		},

		applyLayout: function(box) {
			var me = this;

			if (me.isCollapsed) {
				me.applyLayoutCollapsed(box);
			} else {
				me.panel.setPosition(box);
				me.panel.setSize(box.width, box.height);
			}
		},

		/**
		 * 弹出区域
		 * @return {[type]} [description]
		 */
		slideOut: function() {
			var me = this,
				tools, deferHeight, collapsed;

			//执行中 不理
			if (me.isSlid) {
				return;
			}

			me.isSlid = true;

			tools = me.panel.tools;
			//隐藏切换开关
			if (tools && tools.toggle) {
				tools.toggle.hide();
			}

			me.el.show();

			//缓存折叠状态
			collapsed = me.panel.collapsed;
			me.panel.collapsed = false;

			//左右只变更宽度
			if (me.position == 'east' || me.position == 'west') {
				//缓存deferHeight
				deferHeight = me.panel.deferHeight;
				me.panel.deferHeight = false;

				me.panel.setSize(undefined, me.collapsedEl.outerHeight(false));

				//还原defterHeight
				me.panel.deferHeight = deferHeight;
			} else { //上下变更高度
				me.panel.setSize(me.collapsedEl.outerWidth(false), undefined);
			}

			// 还原折叠状态
			me.panel.collapsed = collapsed;

			me.restoreLT = [me.el.dom.style.left, me.el.dom.style.top];

			me.el.alignTo(me.collapsedEl, me.getCollapseAnchor());
			me.el.css("z-index", me.floatingZIndex + 2);
			me.panel.el.removeClass('x-panel-collapsed');
			me.panel.el.addClass('x-panel-floating');
		},


		slideIn: function(callback) {
			var me = this;
			if (!this.isSlid) {
				callback && callback();
				return;
			}

			me.el.hide();
			me.afterSlideIn();
		},

		afterSlideIn: function() {
			var me = this,
				tools;

			me.isSlid = false;
			me.el.css("z-index", "");

			me.panel.el.removeClass('x-panel-floating');
			me.panel.el.addClass('x-panel-collapsed');

			me.el.dom.style.left = this.restoreLT[0];
			me.el.dom.style.top = this.restoreLT[1];

			tools = this.panel.tools;
			//显示折叠开关
			if (tools && tools.toggle) {
				tools.toggle.show();
			}
		},

		// private
		canchors: {
			"west": "tl-tr",
			"east": "tr-tl",
			"north": "tl-bl",
			"south": "bl-tl"
		},

		getCollapseAnchor: function() {
			return this.canchors[this.position];
		},


		// private
		sanchors: {
			"west": "l",
			"east": "r",
			"north": "t",
			"south": "b"
		},

		getSlideAnchor: function() {
			return this.sanchors[this.position];
		},

		destroy: function() {
			var member = ['miniCollapsedEl', 'collapsedEl', 'expandToolEl'],
				i;

			for (i = 0; i < member.length; i++) {
				if (this[member[i]]) {
					this[member[i]].remove();
					delete this[member[i]];
				}
			}
		}
	});

	return BorderLayout;
})