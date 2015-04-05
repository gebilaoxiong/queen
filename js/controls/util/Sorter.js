define(function() {

	var Sorter = Q.Class.define(Q.Abstract, {
		
		property:undefined,

		direction: 'ASC',

		init: function(config) {
			var me = this;

			Q.extend(me, config);

			if (me.property === undefined && me.sorterFn === undefined) {
				throw "A Sorter requires either a property or a sorter function";
			}

			me.updateSortFunction();
		},

		/*修改当前排序函数*/
		updateSortFunction: function(fn) {
			var me = this;
			fn = fn || me.sorterFn || me.defaultSorterFn;
			me.sort = me.createSortFunction(fn);
		},

		defaultSorterFn: function(left, right) {
			var me = this,
				transform = me.transform;

			left = me.getRoot(left)[me.property];
			right = me.getRoot(right)[me.property];

			if (transform) {
				left = transform(left, me.format);
				right = transform(right, me.format);
			}

			return left > right ? 1 : (left < right ? -1 : 0);
		},

		getRoot: function(item) {
			return this.root === undefined ? item : item[this.root];
		},

		setDirection: function(direction) {
			var me = this;
			me.direction = direction ? direction.toUpperCase() : direction;
			me.updateSortFunction();
		},

		toggle: function() {
			var me = this;
			me.direction = me.direction == "ASC" ? "DESC" : "ASC";
			me.updateSortFunction();
		},

		createSortFunction: function(sorterFn) {
			var me = this,
				direction = me.direction || 'ASC',
				modifier = direction.toUpperCase() == "DESC" ? -1 : 1;

			return function(left, right) {
				return modifier * sorterFn.call(me, left, right);
			};
		},

		toJson: function() {
			return {
				root: this.root,
				property: this.property,
				direction: this.direction
			};
		}
	});

	return Sorter;
})