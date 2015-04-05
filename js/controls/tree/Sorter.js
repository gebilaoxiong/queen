/**
 *
 * @authors 熊洋 (xywindows@gmail.com)
 * @date    2014-05-01 02:30:05
 * @description 节点排序
 */

define(['data/SortTypes'], function(SortTypes) {

	var TreeSorter;

	TreeSorter = Q.Class.define({

		type:'TreeSorter',
		/*
		caseSensitive(默认值为 false) :设置为true将进行大小写敏感排序

		folderSort(默认值为 false) : 设置为true 则要求同级的节点在叶之前

		sortType : Function 节点值转换函数 

		property:(默认值为 text):排序属性

		desc:(默认为ACS正序):ACS||DESC

		 */
		init: function(tree, config) {
			var me=this;

			me.extend(me, config);

			tree.bind({
				scope: me,
				beforechildrenrendered: me.onTreeBeforeChildRenrendered,
				append: me.onTreeAddNode,
				insert: me.onTreeAddNode,
				textchange: me.onTreeNodeTextChange
			});

			var desc = me.dir && me.dir.toLowerCase() == 'desc',
				prop = me.property || 'text',
				sortType = me.sortType,
				folderSort = me.folderSort,
				caseSensitive = me.caseSensitive === true, //大小写敏感
				leafAttr = me.leafAttr || 'leaf';

			if (Q.isString(sortType)) {
				sortType = SortTypes[sortType];
			}

			me.sortFn = function(left, right) {
				var leftAttr = left.attributes,
					rightAttr = right.attributes;

				//如果要求同级的节点在叶之前
				if (folderSort) {
					//如果left为叶 而right为节点 则将right放到前面
					if (leftAttr[leafAttr] && !rightAttr[leafAttr]) {
						return 1;
					}

					//如果left为节点 而right为叶 则将left放到前面
					if (!leftAttr[leafAttr] && rightAttr[leafAttr]) {
						return -1;
					}
				}

				var leftProp = leftAttr[prop], //属性1
					rightProp = rightAttr[prop], //属性2

					leftValue = sortType ?
						sortType(leftProp, left) :
						(caseSensitive ? leftProp : leftProp.toUpperCase()),

					rightValue = sortType ?
						sortType(rightProp, right) :
						(caseSensitive ? rightProp : rightProp.toUpperCase());


				if (leftValue < rightValue) {
					return desc ? 1 : -1;
				} else if (leftValue > rightValue) {
					return desc ? -1 : 1;
				}

				return 0;
			};
		},

		/**
		 * 立即对某一节点进行排序
		 */
		doSort: function(node) {
			node.sort(this.sortFn);
		},
		onTreeBeforeChildRenrendered: function(e, node) {
			this.doSort(node);
		},

		/**
		 * 更新某一节点排序
		 */
		updateSort: function(node) {
			if (node.childrenRendered) {
				Q.delay(this.doSort, this, 1, node);
			}
		},
		onTreeAddNode: function(e, node) {
			this.updateSort(node);
		},

		/**
		 * 对兄弟级节点进行排序
		 */
		updateSortParent: function(node) {
			var parentNode = node.parentNode;
			if (parentNode && parentNode.childrenRendered) {
				Q.delay(this.doSort, this, 1, parentNode);
			}
		},
		onTreeNodeTextChange: function(e, node) {
			this.updateSortParent(node);
		}
	});

	return TreeSorter;
})