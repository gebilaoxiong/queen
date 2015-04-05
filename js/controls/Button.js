define([
	'controls/BoxComponent',
	'util/Template',
	'util/ClickRepeater',
	'menu/MenuMgr',
	'menu/Menu'
], function(BoxComponent, Template, ClickRepeater, MenuMgr, Menu) {

	/*

    <!--
    <div class="x-btn x-btn-normal x-btn-default x-icon-left x-btn-arrow-left x-btn-split-right ">
        <div class="x-btn-inner">
            <a class="x-btn-button" href="javascript:;">
                <span class="x-icon x-icon-reload"></span>
                <span class="x-btn-text">测试连接</span>
            </a>
        </div>
    </div>
    -->

	*/

	var Button, ButtonToggleMgr;

	Button = Q.Class.define(BoxComponent, {

		/*销毁的时候是否销毁菜单*/
		destroyMenu: true,

		hidden: false,

		disabled: false,

		disabledCls: 'x-btn-disabled',

		pressed: false,

		enableToggle: false,

		menuAlign: 'tl-bl?',

		type: 'Button',

		clickEvent: 'click',

		tooltipType: 'qtip',

		scale: 'normal',

		btnType: 'default',

		iconAlign: 'left',

		arrowAlign: 'right',

		arrowPosition: 'right',

		handleMouseEvents: true,

		initComponent: function() {
			if (this.menu) {
				if (Q.isArray(this.menu)) {
					this.menu = {
						xtype: Menu,
						items: this.menu
					};
				}

				if (Q.isObject(this.menu)) {
					this.menu.ownerCt = this;
				}

				this.menu = MenuMgr.get(this.menu);
				this.menu.ownerCt = undefined;
			}

			this.callParent(arguments);

			if (Q.isString(this.toggleGroup)) {
				this.enableToggle = true;
			}
		},


		getTemplateArgs: function() {
			return {
				id: this.id,
				cls: this.getBtnClass()
			};
		},

		getBtnClass: function() {
			var ret = [
				'x-btn',
				'x-btn-' + this.scale //尺寸
			];

			//类型
			if (this.btnType) {
				ret.push('x-btn-' + this.btnType);
			}

			//图标位置
			ret.push('x-icon-' + this.iconAlign);

			//箭头位置
			if (this.menu) {
				ret.push('x-btn-arrow-' + this.arrowPosition);
			}

			ret.push(this.getMenuClass());

			//class
			if (this.cls) {
				ret.push(this.cls);
			}

			ret.push('unselect')

			return ret.join(' ');
		},

		getMenuClass: function() {
			return this.menu ? (this.arrowAlign != 'bottom' ? 'x-btn-arrow' : 'x-btn-arrow-bottom') : '';
		},

		//决定压下状态 是否有文字 图标
		setButtonClass: function() {
			if (this.useSetClass) {
				if (this.oldCls != undefined) {
					this.el.removeClass(this.oldCls + ' x-btn-pressed');
				}

				this.oldCls = this.iconCls ? (this.text ? 'x-btn-text-icon' : 'x-btn-icon') : 'x-btn-noicon';
				this.el.addClass(this.oldCls + (this.pressed ? ' x-btn-pressed' : ''));
			}
		},

		onRender: function(container, position) {
			var div, btn;

			if (!this.renderTmpl) {
				Button.prototype.renderTmpl = new Template([
					'<div id="<%=id%>" class="<%=cls%>">',
					'<div class="x-btn-inner">',
					'<a class="x-btn-button" href="javascript:;">',
					'<span class="x-icon">&nbsp;</span>',
					'<span class="x-btn-text"></span>',
					'</a>',
					'</div>',
					'</div>',
				]);
			}

			div = document.createElement('div');
			div.innerHTML = this.renderTmpl.compile(this.getTemplateArgs());
			btn = Q.get(div.firstChild);

			if (position) {
				btn.insertBefore(position);
			} else {
				btn.appendTo(container);
			}

			div = null;

			this.btnEl = Q.get('a.x-btn-button', btn.dom);

			this.btnEl.on('focus', this.onFocus, this);
			this.btnEl.on('blur', this.onBlur, this);

			this.initButtonEl(btn, this.btnEl);

			ButtonToggleMgr.register(this);
		},

		initButtonEl: function(btn, btnEl) {
			var me = this;

			me.el = btn;
			me.setIconClass(me.iconCls);
			me.setText(me.text);

			if (me.tabIndex != undefined) {
				btnEl.dom.tabIndex = me.tabIndex;
			}

			//提示
			if (me.tooltip) {
				me.setTooltip(me.tooltip, true);
			}

			if (me.handleMouseEvents) {
				btn.on('mouseover', me.onMouseOver, me);
				btn.on('mousedown', me.onMouseDown, me);
			}

			if (me.menu) {
				me.menu.bind({
					scope: me,
					show: me.onMenuShow,
					hide: me.onMenuHide
				});
			}

			if (me.repeat) {
				var repeater = new ClickRepeater(btn, Q.isObject(me.repeat) ? me.repeat : {});
				repeat.bind('click', me.onRepeatClick, me);
			} else {
				btn.on(me.clickEvent, me.onClick, me);
			}
		},

		afterRender: function() {
			var me = this;

			me.callParent(arguments);
			me.useSetClass = true;
			me.setButtonClass();
			me.doc = me.getDoc(true);
			me.doAutoWidth();
		},

		setIconClass: function(cls) {
			this.iconCls = cls;
			if (this.el) {
				Q.get('span.x-icon', this.btnEl.dom).addClass(cls);
				this.setButtonClass();
			}
			return this;
		},

		setTooltip: function(tooltip, /* private */ initial) {
			if (this.rendered) {
				if (!initial) {
					this.clearTip();
				}
				/*if (Q.isObject(tooltip)) {

					QuickTips.register(Q.extend({
						target: this.el.id
					}, tooltip));

					this.tooltip = tooltip;
				} else {

					
				}*/
				this.el.attr('data-' + this.tooltipType, tooltip);
			} else {
				this.tooltip = tooltip;
			}
			return this;
		},

		clearTip: function() {
			/*if (Q.isObject(this.tooltip)) {
				Q.QuickTips.unregister(this.el);
			}*/
		},

		beforeDestroy: function() {
			if (this.rendered) {
				this.clearTip();
			}

			if (this.menu && this.destroyMenu !== false) {
				this.menu.destroy();
			}

			if (this.repeater) {
				this.repeater.destroy();
			}
		},

		onDestroy: function() {
			if (this.rendered) {
				this.doc.off('mouseover', this.monitorMouseOver, this);
				this.doc.off('mouseup', this.onMouseUp, this);
				delete this.doc.dom;
				this.btnEl.remove();
				ButtonToggleMgr.unregister(this);
			}
			this.callParent(arguments);
		},

		doAutoWidth: function() {
			if (this.autoWidth !== false && this.el && this.text && this.width === undefined) {
				this.el.css('width', 'auto');
				if (this.minWidth) {
					if (this.el.outerWidth(false) < this.minWidth) {
						this.el.outerWidth(false, this.minWidth);
					}
				}
			}
		},

		setHandler: function(handler, scope) {
			this.handler = handler;
			this.scope = scope;
			return this;
		},

		setText: function(text) {
			this.text = text;
			if (this.el) {
				Q.get('span.x-btn-text', this.btnEl.dom).text(text || ' ');
				this.setButtonClass();
			}
			this.doAutoWidth();
			return this;
		},

		getText: function() {
			return this.text;
		},

		toggle: function(state, suppressEvent) {
			state = state === undefined ? !this.pressed : !! state;

			if (state != this.pressed) {

				if (this.rendered) {
					this.el[state ? 'addClass' : 'removeClass']('x-btn-' + this.btnType + '-pressed');
				}

				this.pressed = state;

				if (!suppressEvent) {

					this.fire('toggle', this, state);

					if (this.toggleHandler) {
						this.toggleHandler.call(this.scope || this, this, state);
					}
				}
			}
			return this;
		},

		onDisable: function() {
			this.onDisableChange(true);
		},

		// private
		onEnable: function() {
			this.onDisableChange(false);
		},

		onDisableChange: function(disabled) {
			if (this.el) {
				this.el[disabled ? 'addClass' : 'removeClass'](this.disabledCls);
				this.el.dom.disabled = disabled;
			}
			this.disabled = disabled;
		},

		showMenu: function() {
			var me = this;
			if (me.rendered && me.menu) {
				/*if (this.tooltip) {
					QuickTips.getQuickTip().cancelShow(this.el);
				}*/

				if (me.menu.isVisible()) {
					me.menu.hide();
				}

				me.menu.ownerCt = me;

				me.menu.show(me.el, me.menuAlign);
			}
			return me;
		},

		hideMenu: function() {
			if (this.hasVisibleMenu()) {
				this.menu.hide();
			}
			return this;
		},

		hasVisibleMenu: function() {
			return this.menu && this.menu.ownerCt == this && this.menu.isVisible();
		},

		onRepeatClick: function(repeat, e) {
			this.onClick(e);
		},

		onClick: function(e) {

			if (e) {
				e.preventDefault();
			}

			if (e.button !== 0) {
				return;
			}
			if (!this.disabled) {

				this.doToggle();

				if (this.menu && !this.hasVisibleMenu() && !this.ignoreNextClick) {
					this.showMenu();
				}

				this.fire('click', this, e);

				if (this.handler) {
					//this.el.removeClass('x-btn-over');
					this.handler.call(this.scope || this, this, e);
				}
			}
		},

		doToggle: function() {
			if (this.enableToggle && (this.allowDepress !== false || !this.pressed)) {
				this.toggle();
			}
		},

		isMenuTriggerOver: function(e, internal) {
			return this.menu && !internal;
		},

		// private
		isMenuTriggerOut: function(e, internal) {
			return this.menu && !internal;
		},

		onMouseOver: function(e) {
			if (!this.disabled) {
				var internal = this.el.contains(e.relatedTarget);

				if (!internal) {
					this.el.addClass('x-btn-' + this.btnType + '-over');
					if (!this.monitoringMouseOver) {
						this.doc.on('mouseover', this.monitorMouseOver, this);
						this.monitoringMouseOver = true;
					}
					this.fire('mouseover', this, e);
				}

				if (this.isMenuTriggerOver(e, internal)) {
					this.fire('menutriggerover', this, this.menu, e);
				}
			}
		},

		monitorMouseOver: function(e) {
			if (e.target != this.el.dom && !this.el.contains(e.target)) {
				if (this.monitoringMouseOver) {
					this.doc.off('mouseover', this.monitorMouseOver, this);
					this.monitoringMouseOver = false;
				}
				this.onMouseOut(e);
			}
		},

		onMouseOut: function(e) {
			var internal = this.el.contains(e.target) && e.target != this.el.dom;
			this.el.removeClass('x-btn-' + this.btnType + '-over');

			this.fire('mouseout', this, e);

			if (this.isMenuTriggerOut(e, internal)) {
				this.fire('menutriggerout', this, this.menu, e);
			}
		},

		focus: function() {
			this.btnEl.focus();
		},

		blur: function() {
			this.btnEl.blur();
		},

		// private
		onFocus: function(e) {
			if (!this.disabled) {
				this.el.addClass('x-btn-focus');
			}
		},
		// private
		onBlur: function(e) {
			this.el.removeClass('x-btn-focus');
		},

		getClickEl: function(e, isUp) {
			return this.el;
		},

		// private
		onMouseDown: function(e) {
			if (!this.disabled && e.which === 1) {
				this.getClickEl(e).addClass('x-btn-' + this.btnType + '-click');
				this.doc.on('mouseup', this.onMouseUp, this);
			}
		},
		// private
		onMouseUp: function(e) {
			if (e.which === 1) {
				this.getClickEl(e, true).removeClass('x-btn-' + this.btnType + '-click');
				this.doc.off('mouseup', this.onMouseUp, this);
			}
		},

		onMenuShow: function(e) {
			if (this.menu.ownerCt == this) {
				this.menu.ownerCt = this;
				this.ignoreNextClick = 0;
				this.el.addClass('x-btn-menu-active');
				this.fire('menushow', this, this.menu);
			}
		},
		// private
		onMenuHide: function(e) {
			if (this.menu.ownerCt == this) {
				this.el.removeClass('x-btn-menu-active');
				this.ignoreNextClick = Q.delay(this.restoreClick, this, 250);
				this.fire('menuhide', this, this.menu);
				delete this.menu.ownerCt;
			}
		},

		restoreClick: function() {
			this.ignoreNextClick = 0;
		}

	});


	var groups = {};

	function toggleGroup(btn, state) {
		if (state) {
			var g = groups[btn.toggleGroup];
			for (var i = 0, l = g.length; i < l; i++) {
				if (g[i] != btn) {
					g[i].toggle(false);
				}
			}
		}
	}

	ButtonToggleMgr = Button.ButtonToggleMgr = {
		register: function(btn) {
			if (!btn.toggleGroup) {
				return;
			}
			var g = groups[btn.toggleGroup];
			if (!g) {
				g = groups[btn.toggleGroup] = [];
			}
			g.push(btn);
			btn.bind('toggle', toggleGroup);
		},

		unregister: function(btn) {
			if (!btn.toggleGroup) {
				return;
			}
			var g = groups[btn.toggleGroup];
			if (g) {
				g.remove(btn);
				btn.unbind('toggle', toggleGroup);
			}
		},

		/**
		 * Gets the pressed button in the passed group or null
		 * @param {String} group
		 * @return Button
		 */
		getPressed: function(group) {
			var g = groups[group];
			if (g) {
				for (var i = 0, len = g.length; i < len; i++) {
					if (g[i].pressed === true) {
						return g[i];
					}
				}
			}
			return null;
		}
	};

	return Button;
})