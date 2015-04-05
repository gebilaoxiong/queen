/**
 *
 * @authors 熊洋 (xywindows@gmail.com)
 * @date    2014-05-01 16:59:25
 * @description
 */
define(['tree/Node'], function(TreeNode) {

	var AsyncTreeNode;

	AsyncTreeNode = Q.Class.define(TreeNode, {

		type: 'AsyncTreeNode',

		init: function(config) {
			var me = this;
			me.loaded = config && config.loaded === true;
			me.loading = false; //加载状态

			me.callParent(arguments);
		},

		/**
		 * 重写展开 用于加载子节点
		 */
		expand: function(deep, anim, callback, scope) {
			var me = this;
			if (me.loading) { //如果是在加载中 等待其加载完毕
				var timer,
					fn = Q.proxy(function() {
						if (!me.loading) { //如果加载状态结束
							clearInterval(timer);
							me.expand(deep, anim, callback, scope);
						}
					}, me);
				timer = setInterval(fn, 200);
				return;
			}

			//如果未加载完毕
			if (!me.loaded) {
				if (me.fire('beforeload', me) === false) {
					return;
				}
				me.loading = true;
				//调整UI为加载状态
				me.ui.beforeLoad(me);

				//调用loader加载
				var loader = me.loader || me.attributes.loader || me.getOwnerTree().getLoader();

				if (loader) {
					loader.load(me, Q.proxy(me.loadComplete, me, deep, anim, callback, scope), me);
					return;
				}
			}

			me.callParent(arguments);
		},

		/**
		 * 判断是否在加载中
		 */
		isLoading: function() {
			return this.loading;
		},

		/**
		 * 加载完毕
		 */
		loadComplete: function(deep, anim, callback, scope) {
			var me = this;
			me.loading = false;
			me.loaded = true;
			//ui取消加载状态
			me.ui.afterLoad(me);
			me.fire('load', me);
			//加载完毕后在此调用展开子节点
			me.expand(deep, anim, callback, scope);
		},

		/**
		 * 判断是否完成加载
		 */
		isLoaded: function() {
			return this.loaded;
		},

		/**
		 * 重写是否拥有子节点 如果不为叶 且未加载 则返回true
		 */
		hasChildNodes: function() {
			var me = this;

			if (!me.isLeaf() && !me.loaded) {
				return true;
			} else {
				return me.callParent(arguments);
			}
		},

		reload: function(callback, scope) {
			var me = this;
			me.collapse(false, false);
			//清空子节点
			while (me.firstChild) {
				me.removeChild(me.firstChild).destroy();
			}
			me.childrenRendered = false;
			me.loaded = false;

			if (me.isHiddenRoot()) {
				me.expanded = false;
			}

			me.expand(false, false, callback, scope);
		}
	});

	return AsyncTreeNode;
});