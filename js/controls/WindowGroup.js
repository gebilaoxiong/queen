define(function() {

	var WindowGroup = function() {
		var list = {},
			accessList = [],
			front = null;

		function sortWindows(left, right) {
			return (!left._lastAccess || left._lastAccess < right._lastAccess) ? -1 : 1;
		}

		function orderWindows() {
			var a = accessList,
				len = a.length,
				seed, i, win;

			if (len > 0) {
				a.sort(sortWindows);

				seed = a[0].manager.zseed;

				for (i = 0; i < len; i++) {
					win = a[i];
					if (win && !win.hidden) {
						win.setZIndex(seed + (i * 10));
					}
				}
			}

			activateLast();
		}


		function setActiveWin(win) {
			if (win != front) {
				if (front) {
					front.setActive(false);
				}

				front = win;

				if (win) {
					win.setActive(true);
				}
			}
		};

		// private
		function activateLast() {
			for (var i = accessList.length - 1; i >= 0; --i) {
				if (!accessList[i].hidden) {
					setActiveWin(accessList[i]);
					return;
				}
			}
			// none to activate
			setActiveWin(null);
		};

		return {
			/**
			 * zindex种子
			 */
			zseed: 9000,

			/**
			 * 注册windows
			 */
			register: function(win) {
				if (win.manager) {
					win.manager.unregister(win);
				}

				win.manager = this;

				list[win.id] = win;
				accessList.push(win);

				win.bind('hide', activateLast);
			},

			/**
			 * 取消注册
			 */
			unregister: function(win) {
				var index;
				delete win.manager;
				delete list[win.id];
				win.unbind('hide', activateLast);

				if ((index = Q.inArray(win, accessList)) > -1) {
					accessList.splice(index, 1);
				}
			},

			/**
			 * 获取这个组中的window
			 */
			get: function(id) {
				return typeof id == "object" ? id : list[id];
			},

			/**
			 * 将指定的window移动到当前WindowGroup中任何处于激活状态的window前面
			 */
			bringToFront: function(win) {
				win = this.get(win);
				if (win != front) {
					win._lastAccess = new Date().valueOf();
					orderWindows();
					return true;
				}
				return false;
			},

			/**
			 * 将指定的window移动到当前WindowGroup中所有处于活动状态的window之后。
			 */
			sendToBack: function(win) {
				win = this.get(win);
				win._lastAccess = -(new Date().valueOf());
				orderWindows();
				return win;
			},

			/**
			 * 隐藏这个组中的所有window
			 */
			hideAll: function() {
				for (var id in list) {
					if (list[id] && typeof list[id] != "function" && list[id].isVisible()) {
						list[id].hide();
					}
				}
			},

			/**
			 * 获得当前WindowGroup中当前活动的window
			 */
			getActive: function() {
				return front;
			},

			/**
			 */
			getBy: function(fn, scope) {
				var r = [];
				for (var i = accessList.length - 1; i >= 0; --i) {
					var win = accessList[i];
					if (fn.call(scope || win, win) !== false) {
						r.push(win);
					}
				}
				return r;
			},

			/**
			 *
			 */
			each: function(fn, scope) {
				for (var id in list) {
					if (list[id] && typeof list[id] != "function") {
						if (fn.call(scope || list[id], list[id]) === false) {
							return;
						}
					}
				}
			}
		};
	};

	return WindowGroup;
});