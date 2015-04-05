define([
	'layout/ContainerLayout',
	'menu/Menu',
	'controls/Button'
], function(ContainerLayout, Menu, Button) {


	var ToolbarLayout = Q.Class.define(ContainerLayout, {

		type: 'Toolbar',

		boxItemMinWidth: 20,

		triggerWidth: 38,

		monitorResize: true,

		lastBtnCls: 'x-btn-last',

		noItemsMenuText: '没有更多内容了',

		onLayout: function(host, target) {
			var buttonAlign = host.buttonAlign == 'center' ? 'center' : 'left',
				position;

			host.innerBox[buttonAlign == 'left' ? 'addClass' : 'removeClass']('pull-left');

			if (!this.hiddenItems) {
				this.hiddenItems = []; //放置隐藏的控件
			}

			if (!this.boxItem) { //位置调节
				this.boxItem = target.createChild({
					target: 'div',
					'class': 'x-toolbar-item'
				});
			}

			this.boxItem.outerWidth(false, 0);

			position = this.boxItem.dom;

			host.items.each(function(index, cmp) {
				if (cmp.isFill) { //右

					position = null;

				} else if (!cmp.rendered) { //未呈现

					cmp.render(target, position);

				} else if (!cmp.xtbHidden && !this.validParent(cmp, target)) { //已呈现

					target.insertBefore(cmp.getPositionEl().dom, position);
					cmp.container = target;

				}

				if (cmp instanceof Button) {

					var nextCmp = host.items.data[index + 1];

					if (!nextCmp || !(nextCmp instanceof Button) || nextCmp.hidden) {
						cmp.el.addClass(this.lastBtnCls);
					} else {
						cmp.el.removeClass(this.lastBtnCls);
					}

				}

			}, this);

			this.fitToSize(host, target);


			if (buttonAlign != 'center') {

				var innerBoxWidth = target.outerWidth(false),
					targetWidth = host.getPositionEl().width();

				if (this.moreBtn && this.moreBtn.isVisible()) {
					targetWidth -= this.moreBtn.el.outerWidth(true);
				}

				this.boxItem.width(false,
					targetWidth > innerBoxWidth ?
					targetWidth - innerBoxWidth :
					this.boxItemMinWidth);

			}

		},

		fitToSize: function(host, target) {
			if (this.host.enableOverflow === false || this.host.items.data.length == 0) {
				return;
			}

			var innerBoxWidth = host.innerBox.width(),
				targetWidth = host.getPositionEl().width(),
				clipWidth = targetWidth - this.triggerWidth,

				hiddenItems = this.hiddenItems,
				hasHiddens = hiddenItems.length != 0,

				loopWidth; //当前累计宽度


			if (innerBoxWidth > targetWidth || hasHiddens) { //超出长度

				loopWidth = 0;

				this.host.items.each(function(_, cmp) {
					if (!cmp.isFill) { //非‘->’控件
						loopWidth += cmp.getPositionEl().outerWidth(true);

						if (loopWidth > clipWidth) {

							if (!(cmp.hidden || cmp.xtbHidden)) {
								this.hideItem(cmp)
							}

						} else if (cmp.xtbHidden) {
							this.unhideItem(cmp);
						}
					}
				}, this);

			}

			hasHiddens = hiddenItems.length != 0;

			if (hasHiddens) {
				this.initMore();

				if (!this.lastOverflow) {
					this.host.fire('overflowchange', this.host, true);
					this.lastOverflow = true;
				}
			} else if (this.moreBtn) {
				this.clearMenu();
				this.moreBtn.destroy();

				delete this.moreBtn;

				if (this.lastOverflow) {
					this.host.fire('overflowchange', this.host, false);
					this.lastOverflow = false;
				}
			}

		},

		/*隐藏项*/
		hideItem: function(item) {
			this.hiddenItems.push(item);

			item.xtbHidden = true;
			item.hide();
		},

		/*取消隐藏*/
		unhideItem: function(item) {
			var index;

			item.show();
			item.xtbHidden = false;

			if ((index = Q.inArray(item, this.hiddenItems)) != -1) {
				this.hiddenItems.splice(index, 1);
			}
		},

		/*更多按钮*/
		initMore: function() {
			if (!this.moreBtn) {

				this.moreMenu = new Menu({
					ownerCt: this.host,
					listeners: {
						beforeshow: this.beforeMoreShow,
						scope: this
					}
				});

				this.moreBtn = new Button({
					iconCls: 'x-icon-more',
					cls: 'x-toolbar-more',
					menu: this.moreMenu,
					menuAlign: 'tr-br?',
					ownerCt: this.host
				});

				this.moreBtn.render(this.host.el);
			}
		},

		beforeMoreShow: function(e, menu) {
			var items = this.host.items.data,
				len = items.length,
				item,
				prev;

			this.clearMenu();
			menu.removeAll();


			for (var i = 0; i < len; i++) {
				item = items[i];

				if (item.xtbHidden) { //确认隐藏

					this.addComponentToMenu(menu, item);
					prev = item;

				}
			}

			// put something so the menu isn't empty if no compatible items found
			if (menu.items.length < 1) {
				menu.add(this.noItemsMenuText);
			}
		},

		clearMenu: function() {
			var menu = this.moreMenu;
			if (menu && menu.items) {
				menu.items.each(function(_, item) {
					delete item.menu;
				});
			}
		},

		addComponentToMenu: function(menu, component) {
			if (component.isSeparator) {
				menu.add('-');

			} else if (component.isXType('Splitbutton')) {

				menu.add(this.createMenuConfig(component, true));

			} else if (component.isXType('Button')) {

				menu.add(this.createMenuConfig(component, !component.menu));

			}
		},

		createMenuConfig: function(component, hideOnClick) {
			var config = Q.extend({}, component.initialConfig),
				group = component.toggleGroup;

			Q.each(['iconCls', 'icon', 'itemId', 'disabled', 'handler', 'scope', 'menu'], function(_, item) {
				if (component.hasOwnProperty(item)) {
					config[item] = component[item];
				}
			})

			Q.extend(config, {
				text: component.overflowText || component.text || component.tooltip,
				hideOnClick: hideOnClick
			});

			if (group || component.enableToggle) {
				Q.extend(config, {
					group: group,
					checked: component.pressed,
					listeners: {
						checkchange: function(item, checked) {
							component.toggle(checked);
						}
					}
				});
			}

			delete config.ownerCt;
			delete config.xtype;
			delete config.id;

			return config;
		},


		destroy: function() {
			if (this.more) {
				this.more.destroy();
			}

			if (this.moreMenu) {
				this.moreMenu.destroy();
			}

			if (this.boxItem) {
				this.boxItem.remove();
			}

			this.callParent(arguments);
		}


	});

	return ToolbarLayout;
})