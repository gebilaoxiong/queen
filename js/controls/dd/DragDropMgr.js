define([
	/*'controls/QuickTips',*/
	'util/Region'
], function(/*QuickTips, */Region) {

	var DragDropMgr = {

		ids: {},

		handleIds: {},

		dragCurrent: null,

		dragOvers: {},

		deltaX: 0,

		deltaY: 0,

		preventDefault: true,

		stopPropagation: true,

		initialized: false,

		locked: false,

		init: function() {
			this.initialized = true;
		},

		POINT: 0,

		INTERSECT: 1,

		mode: 0,

		notifyOccluded: false,

		_execOnAll: function(sMethod, args) {
			for (var i in this.ids) {
				for (var j in this.ids[i]) {
					var oDD = this.ids[i][j];
					if (!this.isTypeOfDD(oDD)) {
						continue;
					}
					oDD[sMethod].apply(oDD, args);
				}
			}
		},

		_onLoad: function() {

			this.init();

			Q.Element.on(document, "mouseup", this.handleMouseUp, this);
			Q.Element.on(document, "mousemove", this.handleMouseMove, this);
			Q.Element.on(window, "unload", this._onUnload, this);
			Q.Element.on(window, "resize", this._onResize, this);

		},

		_onResize: function(e) {
			this._execOnAll("resetConstraints", []);
		},

		lock: function() {
			this.locked = true;
		},

		unlock: function() {
			this.locked = false;
		},

		isLocked: function() {
			return this.locked;
		},

		locationCache: {},

		useCache: true,

		clickPixelThresh: 3,

		clickTimeThresh: 350,

		dragThreshMet: false,

		clickTimeout: null,

		startX: 0,

		startY: 0,

		regDragDrop: function(oDD, sGroup) {
			if (!this.initialized) {
				this.init();
			}

			if (!this.ids[sGroup]) {
				this.ids[sGroup] = {};
			}
			this.ids[sGroup][oDD.id] = oDD;
		},

		removeDDFromGroup: function(oDD, sGroup) {
			if (!this.ids[sGroup]) {
				this.ids[sGroup] = {};
			}

			var obj = this.ids[sGroup];
			if (obj && obj[oDD.id]) {
				delete obj[oDD.id];
			}
		},

		_remove: function(oDD) {
			for (var g in oDD.groups) {
				if (g && this.ids[g] && this.ids[g][oDD.id]) {
					delete this.ids[g][oDD.id];
				}
			}
			delete this.handleIds[oDD.id];
		},

		regHandle: function(sDDId, sHandleId) {
			if (!this.handleIds[sDDId]) {
				this.handleIds[sDDId] = {};
			}
			this.handleIds[sDDId][sHandleId] = sHandleId;
		},

		isDragDrop: function(id) {
			return (this.getDDById(id)) ? true : false;
		},

		getRelated: function(p_oDD, bTargetsOnly) {
			var oDDs = [];
			for (var i in p_oDD.groups) {
				for (var j in this.ids[i]) {
					var dd = this.ids[i][j];
					if (!this.isTypeOfDD(dd)) {
						continue;
					}
					if (!bTargetsOnly || dd.isTarget) {
						oDDs[oDDs.length] = dd;
					}
				}
			}

			return oDDs;
		},
		isLegalTarget: function(oDD, oTargetDD) {
			var targets = this.getRelated(oDD, true);
			for (var i = 0, len = targets.length; i < len; ++i) {
				if (targets[i].id == oTargetDD.id) {
					return true;
				}
			}

			return false;
		},
		isTypeOfDD: function(oDD) {
			return (oDD && oDD.__ygDragDrop);
		},
		isHandle: function(sDDId, sHandleId) {
			return (this.handleIds[sDDId] &&
				this.handleIds[sDDId][sHandleId]);
		},
		getDDById: function(id) {
			for (var i in this.ids) {
				if (this.ids[i][id]) {
					return this.ids[i][id];
				}
			}
			return null;
		},
		handleMouseDown: function(e, oDD) {
			/*
			if (QuickTips) {
				QuickTips.ddDisable();
			}*/
			if (this.dragCurrent) {
				// the original browser mouseup wasn't handled (e.g. outside FF browser window)
				// so clean up first to avoid breaking the next drag
				this.handleMouseUp(e);
			}

			this.currentTarget = e.target;
			this.dragCurrent = oDD;

			var el = oDD.getEl();

			// track start position
			this.startX = e.pageX;
			this.startY = e.pageY;

			this.deltaX = this.startX - el.offsetLeft;
			this.deltaY = this.startY - el.offsetTop;

			this.dragThreshMet = false;

			this.clickTimeout = setTimeout(
				function() {
					var DDM = DragDropMgr;
					DDM.startDrag(DDM.startX, DDM.startY);
				},
				this.clickTimeThresh);
		},
		startDrag: function(x, y) {
			clearTimeout(this.clickTimeout);
			if (this.dragCurrent) {
				this.dragCurrent.b4StartDrag(x, y);
				this.dragCurrent.startDrag(x, y);
			}
			this.dragThreshMet = true;
		},

		handleMouseUp: function(e) {
			/*
			if (QuickTips) {
				QuickTips.ddEnable();
			}
			*/
			if (!this.dragCurrent) {
				return;
			}

			clearTimeout(this.clickTimeout);

			if (this.dragThreshMet) {
				this.fireEvents(e, true);
			} else {}

			this.stopDrag(e);

			this.stopEvent(e);
		},

		stopEvent: function(e) {
			if (this.stopPropagation) {
				e.stopPropagation();
			}

			if (this.preventDefault) {
				e.preventDefault();
			}
		},

		stopDrag: function(e) {
			// Fire the drag end event for the item that was dragged
			if (this.dragCurrent) {
				if (this.dragThreshMet) {
					this.dragCurrent.b4EndDrag(e);
					this.dragCurrent.endDrag(e);
				}

				this.dragCurrent.onMouseUp(e);
			}

			this.dragCurrent = null;
			this.dragOvers = {};
		},

		handleMouseMove: function(e) {
			if (!this.dragCurrent) {
				return true;
			}
			// var button = e.which || e.button;

			// check for IE mouseup outside of page boundary
			if (Q.Browser.ie && (e.button !== 0 && e.button !== 1 && e.button !== 2)) {
				this.stopEvent(e);
				return this.handleMouseUp(e);
			}

			if (!this.dragThreshMet) {
				var diffX = Math.abs(this.startX - e.pageX),
					diffY = Math.abs(this.startY - e.pageY);
				if (diffX > this.clickPixelThresh ||
					diffY > this.clickPixelThresh) {
					this.startDrag(this.startX, this.startY);
				}
			}

			if (this.dragThreshMet) {
				this.dragCurrent.b4Drag(e);
				this.dragCurrent.onDrag(e);
				if (!this.dragCurrent.moveOnly) {
					this.fireEvents(e, false);
				}
			}

			this.stopEvent(e);

			return true;
		},
		fireEvents: function(e, isDrop) {
			var me = this,
				dragCurrent = me.dragCurrent,
				mousePoint = {},
				overTarget,
				overTargetEl,
				allTargets = [],
				oldOvers = [], // cache the previous dragOver array
				outEvts = [],
				overEvts = [],
				dropEvts = [],
				enterEvts = [],
				needsSort,
				i,
				len,
				sGroup;


			mousePoint.x = mousePoint.right = mousePoint.left = mousePoint[0] = e.pageX;
			mousePoint.y = mousePoint.top = mousePoint.bottom = mousePoint[1] = e.pageY;

			// If the user did the mouse up outside of the window, we could
			// get here even though we have ended the drag.
			if (!dragCurrent || dragCurrent.isLocked()) {
				return;
			}

			// Check to see if the object(s) we were hovering over is no longer
			// being hovered over so we can fire the onDragOut event
			for (i in me.dragOvers) {
				overTarget = me.dragOvers[i];

				if (!me.isTypeOfDD(overTarget)) {
					continue;
				}

				if (!this.isOverTarget(mousePoint, overTarget, me.mode)) {
					outEvts.push(overTarget);
				}

				oldOvers[i] = true;
				delete me.dragOvers[i];
			}

			// Collect all targets which are members of the same ddGoups that the dragCurrent is a member of, and which may recieve mouseover and drop notifications.
			// This is preparatory to seeing which one(s) we are currently over
			// Begin by iterating through the ddGroups of which the dragCurrent is a member
			for (sGroup in dragCurrent.groups) {

				if ("string" != typeof sGroup) {
					continue;
				}

				// Loop over the registered members of each group, testing each as a potential target
				for (i in me.ids[sGroup]) {
					overTarget = me.ids[sGroup][i];

					// The target is valid if it is a DD type
					// And it's got a DOM element
					// And it's configured to be a drop target
					// And it's not locked
					// And it's either not the dragCurrent, or, if it is, tha dragCurrent is configured to not ignore itself.
					if (me.isTypeOfDD(overTarget) &&
						(overTargetEl = overTarget.getEl()) &&
						(overTarget.isTarget) &&
						(!overTarget.isLocked()) &&
						((overTarget != dragCurrent) || (dragCurrent.ignoreSelf === false))) {

						// Only sort by zIndex if there were some which had a floating zIndex value
						if ((overTarget.zIndex = me.getZIndex(overTargetEl)) !== -1) {
							needsSort = true;
						}
						allTargets.push(overTarget);
					}
				}
			}

			// If there were floating targets, sort the highest zIndex to the top
			if (needsSort) {
				allTargets.sort(me.byZIndex);
			}

			// Loop through possible targets, notifying the one(s) we are over.
			// Usually we only deliver events to the topmost.
			for (i = 0, len = allTargets.length; i < len; i++) {
				overTarget = allTargets[i];

				// If we are over the overTarget, queue it up to recieve an event of whatever type we are handling
				if (me.isOverTarget(mousePoint, overTarget, me.mode)) {
					// look for drop interactions
					if (isDrop) {
						dropEvts.push(overTarget);
						// look for drag enter and drag over interactions
					} else {
						// initial drag over: dragEnter fires
						if (!oldOvers[overTarget.id]) {
							enterEvts.push(overTarget);
							// subsequent drag overs: dragOver fires
						} else {
							overEvts.push(overTarget);
						}
						me.dragOvers[overTarget.id] = overTarget;
					}

					// Unless this DragDropManager has been explicitly configured to deliver events to multiple targets, then we are done.
					if (!me.notifyOccluded) {
						break;
					}
				}
			}

			if (me.mode) {
				if (outEvts.length) {
					dragCurrent.b4DragOut(e, outEvts);
					dragCurrent.onDragOut(e, outEvts);
				}

				if (enterEvts.length) {
					dragCurrent.onDragEnter(e, enterEvts);
				}

				if (overEvts.length) {
					dragCurrent.b4DragOver(e, overEvts);
					dragCurrent.onDragOver(e, overEvts);
				}

				if (dropEvts.length) {
					dragCurrent.b4DragDrop(e, dropEvts);
					dragCurrent.onDragDrop(e, dropEvts);
				}

			} else {

				// fire dragout events
				for (i = 0, len = outEvts.length; i < len; ++i) {
					dragCurrent.b4DragOut(e, outEvts[i].id);
					dragCurrent.onDragOut(e, outEvts[i].id);
				}

				// fire enter events
				for (i = 0, len = enterEvts.length; i < len; ++i) {
					// dc.b4DragEnter(e, oDD.id);
					dragCurrent.onDragEnter(e, enterEvts[i].id);
				}

				// fire over events
				for (i = 0, len = overEvts.length; i < len; ++i) {
					dragCurrent.b4DragOver(e, overEvts[i].id);
					dragCurrent.onDragOver(e, overEvts[i].id);
				}

				// fire drop events
				for (i = 0, len = dropEvts.length; i < len; ++i) {
					dragCurrent.b4DragDrop(e, dropEvts[i].id);
					dragCurrent.onDragDrop(e, dropEvts[i].id);
				}

			}

			// notify about a drop that did not find a target
			if (isDrop && !dropEvts.length) {
				dragCurrent.onInvalidDrop(e);
			}
		},
		getZIndex: function(element) {
			var body = document.body,
				z,
				zIndex = -1;

			element = Q.dom.get(element);
			while (element !== body) {
				if (!isNaN(z = Number(Q.Element.css(element, 'zIndex')))) {
					zIndex = z;
				}
				element = element.parentNode;
			}
			return zIndex;
		},
		byZIndex: function(d1, d2) {
			return d1.zIndex < d2.zIndex;
		},
		getBestMatch: function(dds) {
			var winner = null;
			// Return null if the input is not what we expect
			//if (!dds || !dds.length || dds.length == 0) {
			// winner = null;
			// If there is only one item, it wins
			//} else if (dds.length == 1) {

			var len = dds.length;

			if (len == 1) {
				winner = dds[0];
			} else {
				// Loop through the targeted items
				for (var i = 0; i < len; ++i) {
					var dd = dds[i];
					// If the cursor is over the object, it wins.  If the
					// cursor is over multiple matches, the first one we come
					// to wins.
					if (dd.cursorIsOver) {
						winner = dd;
						break;
						// Otherwise the object with the most overlap wins
					} else {
						if (!winner ||
							winner.overlap.getArea() < dd.overlap.getArea()) {
							winner = dd;
						}
					}
				}
			}

			return winner;
		},
		refreshCache: function(groups) {
			for (var sGroup in groups) {
				if ("string" != typeof sGroup) {
					continue;
				}
				for (var i in this.ids[sGroup]) {
					var oDD = this.ids[sGroup][i];

					if (this.isTypeOfDD(oDD)) {
						// if (this.isTypeOfDD(oDD) && oDD.isTarget) {
						var loc = this.getLocation(oDD);
						if (loc) {
							this.locationCache[oDD.id] = loc;
						} else {
							delete this.locationCache[oDD.id];
							// this will unregister the drag and drop object if
							// the element is not in a usable state
							// oDD.unreg();
						}
					}
				}
			}
		},

		verifyEl: function(el) {
			var parent;

			if (el) {

				if (Q.Browser.ie) {
					try {
						parent = el.offsetParent;
					} catch (e) {}
				} else {
					parent = el.offsetParent;
				}

				if (parent) {
					return true;
				}
			}

			return false;
		},

		getLocation: function(oDD) {
			if (!this.isTypeOfDD(oDD)) {
				return null;
			}

			var el = oDD.getEl(),
				pos, x1, x2, y1, y2, t, r, b, l, region;

			try {
				pos = Q.Element.offset(el);
			} catch (e) {}


			if (!pos) {
				return null;
			}

			x1 = pos.left;
			x2 = x1 + el.offsetWidth;
			y1 = pos.top;
			y2 = y1 + el.offsetHeight;

			t = y1 - oDD.padding[0];
			r = x2 + oDD.padding[1];
			b = y2 + oDD.padding[2];
			l = x1 - oDD.padding[3];

			return new Region(t, r, b, l);
		},

		isOverTarget: function(pt, oTarget, intersect) {
			// use cache if available
			var loc = this.locationCache[oTarget.id];
			if (!loc || !this.useCache) {
				loc = this.getLocation(oTarget);

				this.locationCache[oTarget.id] = loc;

			}

			if (!loc) {
				return false;
			}

			oTarget.cursorIsOver = loc.contains(pt);

			// DragDrop is using this as a sanity check for the initial mousedown
			// in this case we are done.  In POINT mode, if the drag obj has no
			// contraints, we are also done. Otherwise we need to evaluate the
			// location of the target as related to the actual location of the
			// dragged element.
			var dc = this.dragCurrent;
			if (!dc || !dc.getTargetCoord ||
				(!intersect && !dc.constrainX && !dc.constrainY)) {
				return oTarget.cursorIsOver;
			}

			oTarget.overlap = null;

			// Get the current location of the drag element, this is the
			// location of the mouse event less the delta that represents
			// where the original mousedown happened on the element.  We
			// need to consider constraints and ticks as well.
			var pos = dc.getTargetCoord(pt.x, pt.y);


			var el = dc.getDragEl();
			var curRegion = new Region(pos.y,
				pos.x + el.offsetWidth,
				pos.y + el.offsetHeight,
				pos.x);

			var overlap = curRegion.intersect(loc);

			if (overlap) {
				oTarget.overlap = overlap;
				return (intersect) ? true : oTarget.cursorIsOver;
			} else {
				return false;
			}
		},

		_onUnload: function(e, me) {
			Q.Element.off(document, "mouseup", this.handleMouseUp,this);
			Q.Element.off(document, "mousemove", this.handleMouseMove,this);
			Q.Element.off(window, "resize", this._onResize,this);
			DragDropMgr.unregAll();
		},
		unregAll: function() {

			if (this.dragCurrent) {
				this.stopDrag();
				this.dragCurrent = null;
			}

			this._execOnAll("unreg", []);

			for (var i in this.elementCache) {
				delete this.elementCache[i];
			}

			this.elementCache = {};
			this.ids = {};
		},

		elementCache: {},

		/**
		 * Get the wrapper for the DOM element specified
		 * @method getElWrapper
		 * @param {String} id the id of the element to get
		 * @return {Ext.dd.DDM.ElementWrapper} the wrapped element
		 * @private
		 * @deprecated This wrapper isn't that useful
		 */
		getElWrapper: function(id) {
			var oWrapper = this.elementCache[id];
			if (!oWrapper || !oWrapper.el) {
				oWrapper = this.elementCache[id] =
					new this.ElementWrapper(Q.dom.get(id));
			}
			return oWrapper;
		},

		/**
		 * Returns the actual DOM element
		 * @method getElement
		 * @param {String} id the id of the elment to get
		 * @return {Object} The element
		 * @deprecated use Ext.lib.Ext.getDom instead
		 */
		getElement: function(id) {
			return Q.dom.get(id);
		},

		getCss: function(id) {
			var el = Q.dom.get(id);
			return (el) ? el.style : null;
		},

		ElementWrapper: function(el) {
			/**
			 * The element
			 * @property el
			 */
			this.el = el || null;
			/**
			 * The element id
			 * @property id
			 */
			this.id = this.el && el.id;
			/**
			 * A reference to the style property
			 * @property css
			 */
			this.css = this.el && el.style;
		},


		getPosX: function(el) {
			return Q.Element.offset(el).left;
		},
		getPosY: function(el) {
			return Q.Element.offset(el).top;
		},

		swapNode: function(n1, n2) {
			if (n1.swapNode) {
				n1.swapNode(n2);
			} else {
				var p = n2.parentNode;
				var s = n2.nextSibling;

				if (s == n1) {
					p.insertBefore(n1, n2);
				} else if (n2 == n1.nextSibling) {
					p.insertBefore(n2, n1);
				} else {
					n1.parentNode.replaceChild(n2, n1);
					p.insertBefore(n1, s);
				}
			}
		},

		getScroll: function() {
			var t, l, dde = document.documentElement,
				db = document.body;
			if (dde && (dde.scrollTop || dde.scrollLeft)) {
				t = dde.scrollTop;
				l = dde.scrollLeft;
			} else if (db) {
				t = db.scrollTop;
				l = db.scrollLeft;
			} else {

			}
			return {
				top: t,
				left: l
			};
		},

		getStyle: function(el, styleProp) {
			return Q.Element.css(el, styleProp);
		},

		getScrollTop: function() {
			return this.getScroll().top;
		},

		getScrollLeft: function() {
			return this.getScroll().left;
		},

		moveToEl: function(moveEl, targetEl) {
			var aCoord = Q.Element.offset(targetEl);
			Q.Element.setOffset(moveEl, aCoord);
		},

		numericSort: function(a, b) {
			return (a - b);
		},

		_timeoutCount: 0,

		/**
		 * Trying to make the load order less important.  Without this we get
		 * an error if this file is loaded before the Event Utility.
		 * @method _addListeners
		 * @private
		 */
		_addListeners: function() {
			var DDM = DragDropMgr
			if (Q.events && document) {
				DDM._onLoad();
			} else {
				if (DDM._timeoutCount > 2000) {} else {
					setTimeout(DDM._addListeners, 10);
					if (document && document.body) {
						DDM._timeoutCount += 1;
					}
				}
			}
		},


		handleWasClicked: function(node, id) {
			if (this.isHandle(id, node.id ? '#' + node.id : '')) {
				return true;
			} else {
				// check to see if this is a text node child of the one we want
				var p = node.parentNode;

				while (p) {
					if (this.isHandle(id, p.id ? '#' + p.id : '')) {
						return true;
					} else {
						p = p.parentNode;
					}
				}
			}

			return false;
		}


	}

	DragDropMgr._addListeners();

	return DragDropMgr;
});