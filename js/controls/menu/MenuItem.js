define([
	'menu/BaseItem',
	'menu/MenuMgr',
	'util/Template',
	'util/Region'
], function(BaseItem, MenuMgr, Template, Region) {
	
	var MenuItem = Q.Class.define(BaseItem, {

		type:'MenuItem',

		itemCls: 'x-menu-item',

		canActivate: true,

		showDelay: 200,

		altText: '',

		hideDelay: 200,

		initComponent: function() {
			var me=this;

			me.callParent(arguments);

			if (me.menu) {
				if (Q.isArray(me.menu)) {
					me.menu = {
						items: me.menu
					};
				}

				if (Q.isObject(me.menu)) {
					me.menu.ownerCt = me;
				}

				me.menu = MenuMgr.get(me.menu);
				me.menu.ownerCt = undefined;
			}
		},

		onRender: function(container, position) {
			var me=this;

			if (!me.itemTpl) {
				me.itemTpl = MenuItem.prototype.itemTpl = new Template([
					'<a id="<%=id%>" class="<%=cls%> unselect" hidefocus="true" unselectable="on" href="<%=href%>"',
					'<% if(hrefTarget){%>',
					' target="<%=hrefTarget%>"',
					'<%}%>',
					'>',
					'<img alt="<%=altText%>" src="<%=icon%>" class="x-menu-item-icon <%=iconCls%>"/>',
					'<span class="x-menu-item-text"><%=text%></span>',
					'</a>'
				]);
			}

			var tempArgs = me.getTemplateArgs(),
				div = document.createElement('div');

			div.innerHTML=me.itemTpl.compile(tempArgs);
			me.el = Q.get(div.firstChild);
			div = null;

			if (position) {
				me.el.insertBefore(position);
			} else {
				container.append(me.el);
			}

			me.iconEl = Q.get('img.x-menu-item-icon', me.el.dom);
			me.textEl = Q.get('.x-menu-item-text', me.el.dom);

			if (!me.href) { // 取消默认动作
				me.el.on('click', function(e) {
					e.preventDefault();
				});
			}

			me.callParent(arguments);
		},

		getTemplateArgs: function() {
			var me=this;

			return {
				id: me.id,
				cls: me.itemCls + (me.menu ? ' x-menu-item-arrow' : '') + (me.cls ? ' ' + me.cls : ''),
				href: me.href || '#',
				hrefTarget: me.hrefTarget,
				icon: me.icon || Q.BLANK_ICON,
				iconCls: me.iconCls || '',
				text: me.itemText || me.text || ' ',
				altText: me.altText || ''
			};
		},

		setText: function(text) {
			var me=this;

			me.text = text || ' ';
			if (me.rendered) {
				me.textEl.text(me.text);
				me.parentMenu.layout.doAutoSize();
			}
		},

		setIconClass: function(cls) {
			var me=this,
				oldCls = me.iconCls;
			me.iconCls = cls;
			if (me.rendered) {
				me.iconEl.removeClass(oldCls)
				me.iconEl.addClass(me.iconCls);
			}
		},

		beforeDestroy: function() {
			var me=this;

			clearTimeout(me.showTimer);
			clearTimeout(me.hideTimer);

			if (me.menu) {
				delete me.menu.ownerCt;
				me.menu.destroy();
			}
			me.callParent(arguments);
		},

		handleClick: function(e) {
			if (!this.href) { // if no link defined, stop the event automatically
				e.preventDefault();
				e.stopPropagation();
			}
			this.callParent(arguments);
		},

		activate: function(autoExpand) {
			var me=this;
			
			if (me.callParent(arguments)) {
				me.focus();
				if (autoExpand) {
					me.expandMenu();
				}
			}
			return true;
		},

		shouldDeactivate: function(e) {
			var me=this,point;
			if (me.callParent(arguments)) {
				if (me.menu && me.menu.isVisible()) {
					point = {};

					point.left = point.right = e.pageX;
					point.top = point.bottom = e.pageY;

					return !Region.getRegion(me.menu.getEl().dom).contains(point);
				}
				return true;
			}
			return false;
		},

		deactivate: function() {
			this.callParent(arguments);
			this.hideMenu();
		},

		expandMenu: function(autoActivate) {
			var me=this;

			if (!me.disabled && me.menu) {
				clearTimeout(me.hideTimer);
				delete me.hideTimer;
				if (!me.menu.isVisible() && !me.showTimer) {
					me.showTimer = Q.delay(me.deferExpand, me, me.showDelay, autoActivate);
				} else if (me.menu.isVisible() && autoActivate) {
					me.menu.tryActivate(0, 1);
				}
			}
		},

		deferExpand: function(autoActivate) {
			var me=this;

			delete me.showTimer;
			me.menu.show(me.container, me.parentMenu.subMenuAlign || 'tl-tr?', me.parentMenu);
			if (autoActivate) {
				me.menu.tryActivate(0, 1);
			}
		},

		hideMenu: function() {
			var me=this;

			clearTimeout(me.showTimer);
			delete me.showTimer;
			if (!me.hideTimer && me.menu && me.menu.isVisible()) {
				me.hideTimer = Q.delay(me.deferHide, me, me.hideDelay);
			}
		},

		deferHide: function() {
			var me=this;

			delete me.hideTimer;
			if (me.menu.over) {
				me.parentMenu.setActiveItem(me, false);
			} else {
				me.menu.hide();
			}
		}


	});

	return MenuItem;
});