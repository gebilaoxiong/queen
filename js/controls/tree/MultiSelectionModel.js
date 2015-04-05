/**
 *
 * @authors 熊洋 (xywindows@gmail.com)
 * @date    2014-05-02 12:13:57
 * @description 多选
 */
define([
	'util/Observable',
	'tree/DefaultSelectionModel'
], function(Observable, DefaultSelectionModel) {
	var MultiSelectionModel;

	MultiSelectionModel = Q.Class.define(Observable, {

		type: 'MultiSelectionModel',

		init: function(config) {
			var me = this;

			//选中元素
			me.selNodes = [];
			//键值缓存
			me.selMap = {};
			me.extend(me, config);
			me.callParent(arguments);
		},

		initialize: function(tree) {
			var me = this;
			me.tree = tree;
			//绑定树的键盘事件
			tree.getTreeEl().on('keydown', me.onKeyDown, me);
			tree.bind('click', me.onNodeClick, me);
		},

		/**
		 * 节点点击处理
		 */
		onNodeClick: function(e, node, keyEvent) {
			var me = this;
			//取消已选中的节点
			if (keyEvent.ctrlKey && me.isSelected(node)) {
				me.unselect(node);
			} else {
				me.select(node, keyEvent, keyEvent.ctrlKey);
			}
		},

		/**
		 * 选中节点
		 */
		select: function(node, e, keepExiting) {
			var me = this;
			//如果没要求保持之前的选中数据 先清空
			if (keepExiting !== true) {
				me.clearSelections(true);
			}

			//如果节点已选中 只是变更最后选中节点
			if (me.isSelected(node)) {
				me.lastSelNode = node;
				return;
			}

			me.selNodes.push(node);
			me.selMap[node.id] = node;
			me.lastSelNode = node;
			//ui绘制
			node.ui.onSelectedChange(true);
			me.fire('selectionchange', me, me.selNodes);
			return node;
		},

		/**
		 * 取消选中节点
		 */
		unselect: function(node) {
			var me = this,
				index;
			if (me.selMap[node.id]) {
				//ui取消选中
				node.ui.onSelectedChange(false);

				if ((index = Q.inArray(node, me.selNodes)) != -1) {
					me.selNodes.splice(index, 1);
				}

				delete me.selMap[node.id];
				me.fire('selectionchange', me, me.selNodes);
			}
		},

		/**
		 * 清空选中项
		 */
		clearSelections: function(suppressEvent) {
			var me = this,
				sn = me.selNodes,
				i, len;

			if (sn.length > 0) {
				//全部选中项取消UI选中状态
				for (i = 0, len = sn.length; i < len; i++) {
					sn[i].ui.onSelectedChange(false);
				}

				me.selNodes.length = 0;
				me.selMap = {};
				//触发事件
				if (suppressEvent !== true) {
					me.fire('selectionchange', me, me.selNodes);
				}
			}
		},

		isSelected: function(node) {
			return !!this.selMap[node.id];
		},

		getSelectedNodes: function() {
			return this.selNodes.slice(0);
		},

		onKeyDown: DefaultSelectionModel.prototype.onKeyDown,

		selectNext: DefaultSelectionModel.prototype.selectNext,

		selectPrevious: DefaultSelectionModel.prototype.selectPrevious
	});

	return MultiSelectionModel;
});