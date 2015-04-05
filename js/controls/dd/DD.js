define(['dd/DragDrop'], function(DragDrop) {

	var DD = Q.Class.define(DragDrop, {

		scroll: true,

		autoOffset: function(iPageX, iPageY) {
			var x = iPageX - this.startPageX;
			var y = iPageY - this.startPageY;
			this.setDelta(x, y);
		},

		setDelta: function(iDeltaX, iDeltaY) {
			this.deltaX = iDeltaX;
			this.deltaY = iDeltaY;
		},

		setDragElPos: function(iPageX, iPageY) {
			var el = this.getDragEl();

			this.alignElWithMouse(el, iPageX, iPageY);
		},

		alignElWithMouse: function(el, iPageX, iPageY) {
			var oCoord = this.getTargetCoord(iPageX, iPageY),
				fly = Q.get(el);


			fly.offset({
				left: oCoord.x,
				top: oCoord.y
			});
			/*
			if (!this.deltaSetXY) {
				var aCoord = {
					left: oCoord.x,
					top: oCoord.y
				};

				fly.offset(aCoord);

				var newLeft = parseFloat(fly.css('left'),10)||0,
					newTop = parseFloat(fly.css('top'),10)||0;

				this.deltaSetXY = [newLeft - oCoord.x, newTop - oCoord.y];
			} else {
				fly.css({
					left: oCoord.x - this.deltaSetXY[0],
					top: oCoord.y - this.deltaSetXY[1]
				});

			}*/

			this.cachePosition(oCoord.x, oCoord.y);
			this.autoScroll(oCoord.x, oCoord.y, el.offsetHeight, el.offsetWidth);
			return oCoord;
		},

		cachePosition: function(iPageX, iPageY) {
			if (iPageX) {
				this.lastPageX = iPageX;
				this.lastPageY = iPageY;
			} else {
				var aCoord = Q.Element.offset(this.getEl());
				this.lastPageX = aCoord.left;
				this.lastPageY = aCoord.top;
			}
		},

		autoScroll: function(x, y, h, w) {

			if (this.scroll) {
				// The client height
				var clientH = Q.Element.getViewHeight();

				// The client width
				var clientW = Q.Element.getViewWidth();

				// The amt scrolled down
				var st = this.DDM.getScrollTop();

				// The amt scrolled right
				var sl = this.DDM.getScrollLeft();

				// Location of the bottom of the element
				var bot = h + y;

				// Location of the right of the element
				var right = w + x;

				// The distance from the cursor to the bottom of the visible area,
				// adjusted so that we don't scroll if the cursor is beyond the
				// element drag constraints
				var toBot = (clientH + st - y - this.deltaY);

				// The distance from the cursor to the right of the visible area
				var toRight = (clientW + sl - x - this.deltaX);


				// How close to the edge the cursor must be before we scroll
				// var thresh = (document.all) ? 100 : 40;
				var thresh = 40;

				// How many pixels to scroll per autoscroll op.  This helps to reduce
				// clunky scrolling. IE is more sensitive about this ... it needs this
				// value to be higher.
				var scrAmt = (document.all) ? 80 : 30;

				// Scroll down if we are near the bottom of the visible page and the
				// obj extends below the crease
				if (bot > clientH && toBot < thresh) {
					window.scrollTo(sl, st + scrAmt);
				}

				// Scroll up if the window is scrolled down and the top of the object
				// goes above the top border
				if (y < st && st > 0 && y - st < thresh) {
					window.scrollTo(sl, st - scrAmt);
				}

				// Scroll right if the obj is beyond the right border and the cursor is
				// near the border.
				if (right > clientW && toRight < thresh) {
					window.scrollTo(sl + scrAmt, st);
				}

				// Scroll left if the window has been scrolled to the right and the obj
				// extends past the left border
				if (x < sl && sl > 0 && x - sl < thresh) {
					window.scrollTo(sl - scrAmt, st);
				}
			}
		},

		getTargetCoord: function(iPageX, iPageY) {
			var x = iPageX - this.deltaX;
			var y = iPageY - this.deltaY;

			if (this.constrainX) {
				if (x < this.minX) {
					x = this.minX;
				}
				if (x > this.maxX) {
					x = this.maxX;
				}
			}

			if (this.constrainY) {
				if (y < this.minY) {
					y = this.minY;
				}
				if (y > this.maxY) {
					y = this.maxY;
				}
			}

			x = this.getTick(x, this.xTicks);
			y = this.getTick(y, this.yTicks);


			return {
				x: x,
				y: y
			};
		},

		applyConfig: function() {
			this.callParent(arguments);

			this.scroll = (this.config.scroll !== false);
		},

		b4MouseDown: function(e) {
			this.autoOffset(e.pageX, e.pageY);
		},

		b4Drag: function(e) {
			this.setDragElPos(e.pageX, e.pageY);
		},

		toString: function() {
			return ("DD " + this.id);
		}

	});

	return DD;
});