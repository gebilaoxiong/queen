define([
	'layout/ContainerLayout',
	'util/Template'
], function(ContainerLayout, Template) {

	var MenuLayout = Q.Class.define(ContainerLayout, {

		monitorResize: true,

		type: 'Menu',

		setHost: function(host) {
			this.monitorResize = !host.floating;

			host.bind('autosize', this.doAutoSize, this);

			this.callParent(arguments);
		},

		renderItem: function(cmp, position, target) {
			
			if (!this.itemTpl) {
				this.itemTpl = MenuLayout.prototype.itemTpl = new Template([
					'<li id="<%=itemId%>" class="<%=itemCls%>">',
					'<% if(needsIcon){%>',
					'<img alt="<%=altText%>" src="<%=icon%>" class="<%=iconCls%>"/>',
					'<%}%>',
					'</li>'
				]);
			}

			if (cmp && !cmp.rendered) {

				if (Q.isNumber(position)) {
					position = target.dom.childNodes[position];
				}

				var div = document.createElement('div'),
					tempArgs = this.getItemArgs(cmp);

				cmp.positionEl = Q.Element.overwrite(div, this.itemTpl.compile(tempArgs), true);
				div = null;

				if (position) {
					cmp.positionEl.insertBefore(position);
				} else {
					cmp.positionEl.appendTo(target);
				}

				cmp.render(cmp.positionEl);

				cmp.positionEl.dom.menuItemId = cmp.getItemId();

				if (!tempArgs.isMenuItem && tempArgs.needsIcon) {
					cmp.positionEl.addClass('x-menu-list-item-indent');
				}

				this.configureItem(cmp);

			} else if (cmp && !this.isValidParent(cmp, target)) {
				if (Q.isNumber(position)) {
					position = target.dom.childNodes[position];
				}

				target.dom.insertBefore(cmp.getActionEl().dom, position || null);
			}
		},

		getItemArgs: function(c) {
			var isMenuItem = c.isXType('MenuItem'),
				canHaveIcon = !(isMenuItem || c.isXType('Separator'));

			return {
				isMenuItem: isMenuItem,
				needsIcon: canHaveIcon && (c.icon || c.iconCls),
				icon: c.icon || Q.BLANK_IMAGE_URL,
				iconCls: 'x-menu-item-icon ' + (c.iconCls || ''),
				itemId: 'x-menu-el-' + c.id,
				itemCls: 'x-menu-list-item ',
				altText: c.altText || ''
			};
		},

		isValidParent: function(c, target) {
			return  c.el.parentUntil('li.x-menu-list-item').parentNode === (target.dom || target);
		},

		onLayout: function(ct, target) {
			this.callParent(arguments);
			this.doAutoSize();
		},

		doAutoSize: function() {
			var host = this.host,
				w = host.width;

			if (host.floating) {
				if (w) {
					host.outerWidth(false, w);
				}
			}
		}
	});

	return MenuLayout;
});