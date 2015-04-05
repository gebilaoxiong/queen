/**
 *
 * @authors 熊洋 (xywindows@gmail.com)
 * @date    2014-05-02 14:33:24
 * @description
 */
define(function() {

	var TreeEventModel;

	TreeEventModel = Q.Class.define({

		init: function(tree) {
			var me = this;
			me.tree = tree;
			//tree容器绘制完毕后初始化事件
			me.tree.bind('render', me.initEvents, me);
		},

		/**
		 * 初始化事件
		 * @return {[type]} [description]
		 */
		initEvents: function() {
			var me = this,
				tree = me.tree,
				treeEl;

			//鼠标hover
			if (tree.trackMouseOver !== false) {
				tree.innerCt.on('mouseover', me.delegateOver, me);
				tree.innerCt.on('mouseout', me.delegateOut, me);
			}

			//单击 双击 上下文菜单
			treeEl = tree.getTreeEl();

			treeEl.on('click', me.delegateClick, me);
			treeEl.on('dblclick', me.delegateDblClick, me);
			treeEl.on('contextmenu', me.delegateContextMenu, me);
		},

		/**
		 * 根据事件对象 获取节点
		 */
		getNode: function(e) {
			var target, id;

			if ((target = Q.Element.parentUntil(e.target, '.x-tree-node-el', true)) &&
				(id = Q.Element.attr(target, 'tree-node-id'))) {

				return this.tree.getNodeById(id);
			}
			return null;
		},

		/**
		 * 根据事件对象 获取节点DOM
		 */
		getNodeTarget: function(e) {
			var target = Q.Element.parentUntil(e.target, '.x-tree-node-icon', true);

			if (!target) {
				target = Q.Element.parentUntil(e.target, '.x-tree-node-el', true);
			}
			return target;
		},

		/**
		 * 节点mouseout委托
		 */
		delegateOut: function(e) {
			var me = this,
				node, target;

			if (!me.beforeEvent(e)) {
				return;
			}

			//如果是节点展开开关
			if (Q.Element.parentUntil(e.target, '.x-tree-ec-icon', true)) {
				node = me.getNode(e);
				//变换图标
				me.onIconOut(e, node);
				if (node == me.lastEcOver) {
					delete me.lastEcOver;
				}
			}

			//相关元素不是当前节点（移出）
			if ((target = me.getNodeTarget(e)) && !Q.Element.contains(target, e.relatedTarget)) {
				me.onNodeOut(e, me.getNode(e));
			}
		},

		/**
		 * 节点mouseover委托
		 */
		delegateOver: function(e) {
			var me = this,
				target;

			if (!me.beforeEvent(e)) {
				return;
			}

			/*
			if(Ext.isGecko && !this.trackingDoc){ 
	            Ext.getBody().on('mouseover', this.trackExit, this);
	            this.trackingDoc = true;
	        }
			 */

			if (me.lastEcOver) {
				//恢复上个节点的ec图标
				me.onIconOut(e, me.lastEcOver);
				delete me.lastEcOver;
			}

			if (Q.Element.parentUntil(e.target, '.x-tree-ec-icon', true)) {
				me.lastEcOver = me.getNode(e);
				//如果元素是ec
				me.onIconOver(e, me.lastEcOver);
			}

			if (target = me.getNodeTarget(e)) {
				me.onNodeOver(e, me.getNode(e));
			}
		},

		/**
		 * 点击事件委托
		 */
		delegateClick: function(e) {
			var me = this,
				node;

			if (me.beforeEvent(e)) {
				node = me.getNode(e);

				if (Q.Element.parentUntil(e.target, 'input[type=checkbox]', true)) {
					//选项框选中切换
					me.onCheckboxClick(e, node);
				} else if (Q.Element.parentUntil(e.target, '.x-tree-ec-icon', true)) {
					//展开切换
					me.onIconClick(e, node);
				} else if (me.getNodeTarget(e)) {
					//节点选中切换
					me.onNodeClick(e, node);
				}
			} else {
				//容器
				me.checkContainerEvent(e, 'click');
			}
		},

		/**
		 * 双击事件委托
		 */
		delegateDblClick: function(e) {
			var me = this;
			if (me.beforeEvent(e)) {
				if (me.getNodeTarget(e)) {
					me.onNodeDblClick(e, me.getNode(e));
				}
			} else {
				me.checkContainerEvent(e, 'dblclick');
			}
		},

		/**
		 * 上下文菜单事件委托
		 */
		delegateContextMenu: function(e) {
			var me = this;
			if (me.beforeEvent(e)) {
				if (me.getNodeTarget(e)) {
					me.onNodeContextMenu(e, me.getNode(e));
				}
			} else {
				me.checkContainerEvent(e, 'contextmenu');
			}
		},

		/**
		 * 确认当前未禁用 才能出发容器事件
		 */
		checkContainerEvent: function(e, type) {
			//如果
			if (this.disabled) {
				e.preventDefault();
				e.stopPropagation();
				return false;
			}
			this.onContainerEvent(e, type);
		},

		/**
		 * 触发容器事件
		 */
		onContainerEvent: function(e, type) {
			this.tree.fire('container' + type, this.tree, e);
		},

		/**
		 * 节点点击
		 */
		onNodeClick: function(e, node) {
			node.ui.onClick(e);
		},

		onNodeOver: function(e, node) {
			this.lastOverNode = node;
			node.ui.onOver(e);
		},
		onNodeOut: function(e, node) {
			node.ui.onOut(e);
		},

		onIconOver: function(e, node) {
			node.ui.addClass('x-tree-ec-over');
		},

		onIconOut: function(e, node) {
			node.ui.removeClass('x-tree-ec-over');
		},

		onIconClick: function(e, node) {
			node.ui.ecClick(e);
		},

		onCheckboxClick: function(e, node) {
			node.ui.onCheckChange(e);
		},

		onNodeDblClick: function(e, node) {
			node.ui.onDblClick(e);
		},

		onNodeContextMenu: function(e, node) {
			node.ui.onContextMenu(e);
		},

		beforeEvent: function(e) {
			var node = this.getNode(e);
			if (this.disabled || !node || !node.ui) {
				e.preventDefault();
				e.stopPropagation();
				return false;
			}
			return true;
		},

		disable: function() {
			this.disabled = true;
		},

		enable: function() {
			this.disabled = false;
		}

	});

	return TreeEventModel;
});