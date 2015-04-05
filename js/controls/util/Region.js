define(function() {

	var Region = Q.Class.define({
		init: function(t, r, b, l) {
			var me = this;
			me.top = t;
			me[1] = t;
			me.right = r;
			me.bottom = b;
			me.left = l;
			me[0] = l;
		},
		contains: function(region) {
			var me = this;
			return (region.left >= me.left &&
				region.right <= me.right &&
				region.top >= me.top &&
				region.bottom <= me.bottom);

		},

		getArea: function() {
			var me = this;
			return ((me.bottom - me.top) * (me.right - me.left));
		},

		intersect: function(region) {
			var me = this,
				t = Math.max(me.top, region.top),
				r = Math.min(me.right, region.right),
				b = Math.min(me.bottom, region.bottom),
				l = Math.max(me.left, region.left);

			if (b >= t && r >= l) {
				return new Region(t, r, b, l);
			}
		},

		union: function(region) {
			var me = this,
				t = Math.min(me.top, region.top),
				r = Math.max(me.right, region.right),
				b = Math.max(me.bottom, region.bottom),
				l = Math.min(me.left, region.left);

			return new Region(t, r, b, l);
		},

		constrainTo: function(r) {
			var me = this;
			me.top = me.top.constrain(r.top, r.bottom);
			me.bottom = me.bottom.constrain(r.top, r.bottom);
			me.left = me.left.constrain(r.left, r.right);
			me.right = me.right.constrain(r.left, r.right);
			return me;
		},

		adjust: function(t, l, b, r) {
			var me = this;
			me.top += t;
			me.left += l;
			me.right += r;
			me.bottom += b;
			return me;
		}
	});

	Region.getRegion = function(el) {
		el = Q.dom.get(el);

		var p = Q.Element.offset(el),
			t = p.top,
			r = p.left + el.offsetWidth,
			b = p.top + el.offsetHeight,
			l = p.left;

		return new Region(t, r, b, l);
	}

	return Region;
})