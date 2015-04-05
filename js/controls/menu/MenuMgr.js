define(['controls/ComponentMgr'], function(ComponentMgr) {
	var menus,
		active,
		groups = {},
		attached = false,
		lastShow = new Date();


	// private - called when first menu is created
	function init() {
		menus = {};
		active = new Q.MixCollection('id');
	}

	// private
	function hideAll() {
		if (active && active.data.length > 0) {
			var c = active.clone();
			c.each(function() {
				this.hide();
			});
			return true;
		}
		return false;
	}

	// private
	function onHide(e, m) {
		active.remove(m);
		if (active.data.length < 1) {
			Q.get(document).off("mousedown", onMouseDown);
			attached = false;
		}
	}

	// private
	function onShow(e, m) {
		var last = active.data[active.data.length];
		lastShow = new Date();
		active.add(m);

		if (!attached) {
			Q.get(document).on("mousedown", onMouseDown);
			attached = true;
		}

		if (m.parentMenu) {
			m.getEl().css('z-index', parseInt(m.parentMenu.getEl().css("z-index"), 10) + 3);
			m.parentMenu.activeChild = m;
		} else if (last && !last.isDestroyed && last.isVisible()) {
			m.getEl().css('z-index', parseInt(last.getEl().css("z-index"), 10) + 3);
		}
	}

	// private
	function onBeforeHide(e, m) {
		if (m.activeChild) {
			m.activeChild.hide();
		}
		if (m.autoHideTimer) {
			clearTimeout(m.autoHideTimer);
			delete m.autoHideTimer;
		}
	}

	// private
	function onBeforeShow(e, m) {
		var pm = m.parentMenu;
		if (!pm && !m.allowOtherMenus) {
			hideAll();
		} else if (pm && pm.activeChild) {
			pm.activeChild.hide();
		}
	}

	// private
	function onMouseDown(e) {
		if (Q.Date.getElapsed(lastShow) > 50 && active.data.length > 0 && !Q.Element.parentUntil(e.target, ".x-menu")) {
			hideAll();
		}
	}

	return {

		/**
		 * Hides all menus that are currently visible
		 * @return {Boolean} success True if any active menus were hidden.
		 */
		hideAll: hideAll,

		// private
		register: function(menu) {
			if (!menus) {
				init();
			}
			menus[menu.id] = menu;
			menu.bind({
				beforehide: onBeforeHide,
				hide: onHide,
				beforeshow: onBeforeShow,
				show: onShow
			});
		},

		/**
		 * Returns a {@link Ext.menu.Menu} object
		 * @param {String/Object} menu The string menu id, an existing menu object reference, or a Menu config that will
		 * be used to generate and return a new Menu instance.
		 * @return {Ext.menu.Menu} The specified menu, or null if none are found
		 */
		get: function(menu) {
			if (typeof menu == "string") { // menu id

				if (!menus) { // not initialized, no menus to return
					return null;
				}
				return menus[menu];

			} else if (Q.isObject(menu) && !Q.isPlainObject(menu)) { // menu instance

				return menu;

			} else { // otherwise, must be a config
				return ComponentMgr.create(menu);
			}
		},

		// private
		unregister: function(menu) {
			delete menus[menu.id];
			menu.unbind("beforehide", onBeforeHide);
			menu.unbind("hide", onHide);
			menu.unbind("beforeshow", onBeforeShow);
			menu.unbind("show", onShow);
		},

		// private
		registerCheckable: function(menuItem) {
			var g = menuItem.group;
			if (g) {
				if (!groups[g]) {
					groups[g] = [];
				}
				groups[g].push(menuItem);
			}
		},

		// private
		unregisterCheckable: function(menuItem) {
			var g = menuItem.group;
			if (g) {
				groups[g].remove(menuItem);
			}
		},

		// private
		onCheckChange: function(item, state) {
			if (item.group && state) {
				var group = groups[item.group],
					i = 0,
					len = group.length,
					current;

				for (; i < len; i++) {
					current = group[i];
					if (current != item) {
						current.setChecked(false);
					}
				}
			}
		},

		getCheckedItem: function(groupId) {
			var g = groups[groupId];
			if (g) {
				for (var i = 0, l = g.length; i < l; i++) {
					if (g[i].checked) {
						return g[i];
					}
				}
			}
			return null;
		},

		setCheckedItem: function(groupId, itemId) {
			var g = groups[groupId];
			if (g) {
				for (var i = 0, l = g.length; i < l; i++) {
					if (g[i].id == itemId) {
						g[i].setChecked(true);
					}
				}
			}
			return null;
		}
	};

});