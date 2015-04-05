define([
	'dd/DDProxy',
	'dd/StatusProxy',
	'dd/DragDropMgr'
], function(DDProxy, StatusProxy, DragDropMgr) {

	var DragSource = Q.Class.define(DDProxy, {

		init: function(el, config) {
			this.el = Q.get(el);

			if (!this.dragData) {
				this.dragData = {};
			}

			Q.extend(this, config);

			if (!this.proxy) {
				this.proxy = new StatusProxy();
			}

			this.callParent('init', [this.el.dom, this.ddGroup || this.group, {
				dragElId: this.proxy.id,
				resizeFrame: false,
				isTarget: false,
				scroll: this.scroll === true
			}]);

			this.dragging = false;
		},


		dropAllowed: "x-dd-drop-ok",

		dropNotAllowed: "x-dd-drop-nodrop",

		getDragData: function(e) {
			return this.dragData;
		},

		onDragEnter: function(e, id) {
			var target = DragDropMgr.getDDById(id);

			this.cachedTarget = target;

			if (this.beforeDragEnter(target, e, id) !== false) {
				if (target.isNotifyTarget) {
					var status = target.notifyEnter(this, e, this.dragData);
					this.proxy.setStatus(status);
				} else {
					this.proxy.setStatus(this.dropAllowed);
				}

				if (this.afterDragEnter) {
					this.afterDragEnter(target, e, id);
				}
			}
		},

		beforeDragEnter: function(target, e, id) {
			return true;
		},

		// private
		alignElWithMouse: function() {
			this.callParent(arguments);
			this.proxy.sync();
		},

		onDragOver: function(e, id) {
			var target = this.cachedTarget || DragDropMgr.getDDById(id);

			if (this.beforeDragOver(target, e, id) !== false) {
				if (target.isNotifyTarget) {
					var status = target.notifyOver(this, e, this.dragData);
					this.proxy.setStatus(status);
				}

				if (this.afterDragOver) {
					this.afterDragOver(target, e, id);
				}
			}
		},

		beforeDragOver: function(target, e, id) {
			return true;
		},

		onDragOut: function(e, id) {
			var target = this.cachedTarget || DragDropMgr.getDDById(id);
			if (this.beforeDragOut(target, e, id) !== false) {

				if (target.isNotifyTarget) {
					target.notifyOut(this, e, this.dragData);
				}

				this.proxy.reset();
				if (this.afterDragOut) {
					this.afterDragOut(target, e, id);
				}
			}
			this.cachedTarget = null;
		},

		beforeDragOut: function(target, e, id) {
			return true;
		},

		onDragDrop: function(e, id) {
			var target = this.cachedTarget || DragDropMgr.getDDById(id);
			if (this.beforeDragDrop(target, e, id) !== false) {
				if (target.isNotifyTarget) {
					if (target.notifyDrop(this, e, this.dragData)) { // valid drop?
						this.onValidDrop(target, e, id);
					} else {
						this.onInvalidDrop(target, e, id);
					}
				} else {
					this.onValidDrop(target, e, id);
				}

				if (this.afterDragDrop) {
					this.afterDragDrop(target, e, id);
				}
			}
			delete this.cachedTarget;
		},

		beforeDragDrop: function(target, e, id) {
			return true;
		},

		// private
		onValidDrop: function(target, e, id) {
			this.hideProxy();
			if (this.afterValidDrop) {
				this.afterValidDrop(target, e, id);
			}
		},

		getRepairXY: function(e, data) {
			return this.el.offset();
		},

		// private
		onInvalidDrop: function(target, e, id) {
			this.beforeInvalidDrop(target, e, id);
			if (this.cachedTarget) {
				if (this.cachedTarget.isNotifyTarget) {
					this.cachedTarget.notifyOut(this, e, this.dragData);
				}
				this.cacheTarget = null;
			}

			this.proxy.repair(this.getRepairXY(e, this.dragData), this.afterRepair, this);

			if (this.afterInvalidDrop) {
				this.afterInvalidDrop(e, id);
			}
		},

		afterRepair: function() {
			this.dragging = false;
		},

		beforeInvalidDrop: function(target, e, id) {
			return true;
		},

		handleMouseDown: function(e) {
			if (this.dragging) {
				return;
			}
			var data = this.getDragData(e);
			if (data && this.onBeforeDrag(data, e) !== false) {
				this.dragData = data;
				this.proxy.stop();
				this.callParent(arguments);
			}
		},

		onBeforeDrag: function(data, e) {
			return true;
		},

		onStartDrag: Q.noop,

		// private override
		startDrag: function(x, y) {
			this.proxy.reset();
			this.dragging = true;
			this.proxy.update("");
			this.onInitDrag(x, y);
			this.proxy.show();
		},

		onInitDrag: function(x, y) {
			var clone = this.el.dom.cloneNode(true);
			clone.id = Q.id(); // prevent duplicate ids
			this.proxy.update(clone);
			this.onStartDrag(x, y);
			return true;
		},

		getProxy: function() {
			return this.proxy;
		},

		hideProxy: function() {
			this.proxy.hide();
			this.proxy.reset(true);
			this.dragging = false;
		},

		triggerCacheRefresh: function() {
			DragDropMgr.refreshCache(this.groups);
		},

		// private - override to prevent hiding
		b4EndDrag: function(e) {},

		// private - override to prevent moving
		endDrag: function(e) {
			this.onEndDrag(this.dragData, e);
		},

		onEndDrag: Q.noop,

		// private - pin to cursor
		autoOffset: function(x, y) {
			this.setDelta(-12, -20);
		},

		destroy: function() {
			this.callParent(arguments)
			Q.Abstract.destroy(this.proxy);
		}

	});

	return DragSource;
});