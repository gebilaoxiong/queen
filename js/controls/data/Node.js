/**
 *
 * @authors 熊洋 (xywindows@gmail.com)
 * @date    2014-04-30 14:52:47
 * @description 层级数据的抽象
 */
define(['util/Observable'], function(Observable) {

	var Node;

	Node = Q.Class.define(Observable, {

		init: function(attributes) {
			var me = this;

			me.attributes = attributes || {};
			//是否为叶
			me.leaf = me.attributes.leaf;

			//id
			me.id = me.attributes.id;
			if (!me.id) {
				me.id = Q.id(null, 'xnode-');
				me.attributes.id = me.id;
			}

			//父节点
			me.parentNode = null;

			//子节点
			me.childNodes = [];
			me.firstChild = null;
			me.lastChild = null;

			/*兄弟节点*/
			me.previousSibling = null;
			me.nextSibling = null;

			me.listeners = me.attributes.listeners;
			me.callParent(arguments);
		},

		/**
		 * 重写触发事件
		 */
		fire: function(eventName) {
			var ownerTree;

			if (this.callParent(arguments) === false) {
				return false;
			}

			ownerTree = this.getOwnerTree();

			//触发tree的事件
			if (ownerTree) {
				if (ownerTree.proxyNodeEvent.apply(ownerTree, arguments) === false) {
					return false;
				}
			}

			return true;
		},

		/**
		 * 是否是叶
		 */
		isLeaf: function() {
			return this.isLeaf === true;
		},

		/**
		 * 设置第一个子节点
		 */
		setFirstChild: function(node) {
			this.firstChild = node;
		},
		setLastChild: function(node) {
			this.lastChild = node;
		},

		/**
		 * 是否为最后一个节点
		 */
		isLast: function() {
			return this.parentNode ? this.parentNode.lastChild == this : true;
		},

		/**
		 * 是否拥有子节点
		 * （不为叶节点 且 有子节点）
		 */
		hasChildNodes: function() {
			return !this.isLeaf() && this.childNodes.length > 0;
		},

		/**
		 * 是否能展开
		 * （属性设置为true或者拥有子节点）
		 */
		isExpandable: function() {
			return this.attributes.expandable || this.hasChildNodes();
		},

		/**
		 * 添加子节点
		 */
		appendChild: function(node) {
			var me = this,
				multi = false,
				index, oldParent, previousSibling;

			if (Q.isArray(node)) {
				multi = node;
			} else if (arguments.length > 1) {
				multi = arguments;
			}

			if (multi) {
				for (var i = 0, len = multi.length; i < len; i++) {
					me.appendChild(multi[i]);
				}
				return;
			}

			//触发事件
			if (me.fire('beforeappend', me.ownerTree, me, node) === false) {
				return false;
			}

			index = me.childNodes.length;

			//如果新节点已在别处添加
			if (oldParent = node.parentNode) {
				if (node.fire("beforemove", node.getOwnerTree(), node, oldParent, me, index) === false) {
					return false;
				}
				oldParent.removeChild(node);
			}

			index = me.childNodes.length;

			//首子节点
			if (index === 0) {
				me.setFirstChild(node);
			}

			me.childNodes.push(node);
			//设置子节点的父节点
			node.parentNode = me;

			//形成链结构
			if (previousSibling = me.childNodes[index - 1]) {
				node.previousSibling = previousSibling;
				previousSibling.nextSibling = node;
			} else {
				node.previousSibling = null;
			}

			node.nextSibling = null;
			//设置尾节点
			me.setLastChild(node);

			node.setOwnerTree(me.getOwnerTree());
			me.fire('append', me.ownerTree, me, node, index);

			//如果纯在旧节点 触发move
			if (oldParent) {
				node.fire('move', me.ownerTree, node, oldParent, me, index);
			}

			return node;
		},

		removeChild: function(node, destroy) {
			var me = this,
				index = Q.inArray(node, me.childNodes);
			if (index == -1) {
				return false;
			}

			//触发删除事件
			if (me.fire('beforemove', me.ownerTree, me, node) === false) {
				return false;
			}

			//用子节点中删除
			me.childNodes.splice(index, 1);

			//调整链表关系
			if (node.previousSibling) {
				node.previousSibling.nextSibling = node.nextSibling;
			}
			if (node.nextSibling) {
				node.nextSibling.previousSibling = node.previousSibling;
			}

			//启始节点或尾节点变更
			if (me.firstChild == node) {
				me.setFirstChild(node.nextSibling);
			}
			if (me.lastChild == node) {
				me.setLastChild(node.previousSibling);
			}

			me.fire('remove', me.ownerTree, me, node);

			if (destroy) {
				node.destroy(true);
			} else {
				node.clear();
			}
			return node;
		},

		clear: function(destroy) {
			var me = this;
			me.setOwnerTree(null, destroy);
			me.parentNode = me.previousSibling = me.nextSibling = null;
			if (destroy) {
				me.firstChild = me.lastChild = null;
			}
		},

		destroy: function(silent) {
			var me = this;
			if (silent === true) {
				me.unbind();
				me.clear(true);
				Q.each(me.childNodes, function(_, node) {
					node.destroy(true);
				});
				me.childNodes = null;
			} else {
				me.remove(true);
			}
		},

		insertBefore: function(node, refNode) {
			var me = this,
				index, oldParent, refIndex, previousSibling;
			//如果没有参考元素 则调用append
			if (!refNode) {
				return me.appendChild(node);
			}

			if (node == refNode) {
				return false;
			}

			if (me.fire('beforeinsert', me.ownerTree, me, node, refNode) === false) {
				return false;
			}

			index = Q.inArray(refNode, me.childNodes);
			oldParent = node.parentNode;
			refIndex = index; //参考索引

			//如果node已在当前子节点中 且位置在refNode前面 
			//则参考索引需要向前一步  因为一会要将node从当前节点移除
			if (oldParent == me && Q.inArray(node, me.childNodes) < index) {
				refIndex--;
			}

			//从父节点中移除
			if (oldParent) {
				if (node.fire('beforemove', node.getOwnerTree(), node, oldParent, this, index, refNode) === false) {
					return false;
				}
				oldParent.removeChild(node);
			}

			//首节点
			if (refIndex === 0) {
				me.setFirstChild(node);
			}

			me.childNodes.splice(refIndex, 0, node);
			node.parentNode = me;


			//维护链表关系
			if (previousSibling = me.childNodes[refIndex - 1]) {
				node.previousSibling = previousSibling;
				previousSibling.nextSibling = node;
			} else {
				node.previousSibling = null;
			}

			//直接与refNode建立关联
			node.nextSibling = refNode;
			refNode.previousSibling = node;

			//设置ownerTree
			node.setOwnerTree(me.getOwnerTree());

			//触发insert事件
			me.fire('insert', me.ownerTree, me, node, refNode);

			if (oldParent) {
				node.fire('move', me.ownerTree, node, oldParent, me, refIndex, refNode);
			}

			return node;
		},

		/**
		 * 从父节点上移除该节点
		 */
		remove: function(destroy) {
			var me = this;
			if (me.parentNode) {
				me.parentNode.remove(me, destroy);
			}
			return me;
		},

		removeAll: function(destroy) {
			var cn = this.childNodes,
				n;

			while (n = cn[0]) {
				this.removeChild(n, destroy);
			}
		},

		item: function(index) {
			return this.childNodes[index];
		},

		/**
		 * 替换子节点
		 */
		replaceChild: function(newChild, oldChild) {
			var nextSibling = oldChild ? oldChild.nextSibling : null;
			this.removeChild(oldChild);
			this.insertBefore(newChild, nextSibling);
			return oldChild;
		},

		/**
		 * 获取子节点索引
		 */
		indexOf: function(child) {
			return Q.inArray(child, this.childNodes);
		},

		/**
		 * 获取tree
		 */
		getOwnerTree: function() {
			var parent;
			if (!this.ownerTree) {
				parent = this;

				while (parent) {
					if (parent.ownerTree) {
						this.ownerTree = parent.ownerTree;
						break;
					}
					parent = parent.parentNode;
				}
			}
			return this.ownerTree;
		},

		/**
		 * 获取节点深度
		 */
		getDepth: function() {
			var depth = 0,
				parent = this;

			while (parent) {
				++depth;
				parent = parent.parentNode;
			}
		},

		/**
		 * 设置树
		 */
		setOwnerTree: function(tree, destroy) {
			var me = this;
			if (tree != me.ownerTree) {

				if (me.ownerTree) {
					//在旧的树中反注册
					me.ownerTree.unregisterNode(me);
				}

				me.ownerTree = tree;

				//如果不是销毁我们需要递归设置子节点的tree
				if (destroy !== true) {
					Q.each(me.childNodes, function(_, node) {
						node.setOwnerTree(tree);
					});
				}

				if (tree) {
					tree.registerNode(me);
				}
			}
		},

		/**
		 * 设置ID
		 */
		setId: function(id) {
			var me = this,
				ownerTree;
			if (id !== me.id) {
				if (ownerTree = me.ownerTree) {
					//先注销节点
					ownerTree.unregisterNode(me);
				}

				me.id = me.attributes.id = id;

				if (ownerTree) {
					//重新注册
					ownerTree.registerNode(me);
				}

				me.onIdChange(id);
			}
		},

		onIdChange: Q.noop,

		/**
		 * 获取某一属性的路径 返回用tree的pathSeparator分割的字符串
		 */
		getPath: function(attr) {
			attr = attr || 'id';
			var parentNode = this.parentNode, //父节点
				b = [this.attributes[attr]],
				sep; //分隔符

			while (parentNode) {
				b.unshift(parentNode.attributes[attr]);
				parentNode = parentNode.parentNode;
			}

			sep = this.getOwnerTree().pathSeparator;
			return sep + b.join(sep);
		},

		/**
		 * 沿节点向上调用某一方法
		 */
		bubble: function(fn, scope, args) {
			var parentNode = this;

			while (parentNode) {
				if (fn.apply(scope || parentNode, args || [p]) === false) {
					break;
				}
				parentNode = parentNode.parentNode;
			}
		},
		/**
		 * 沿着节点向下调用某一方法
		 * fn 返回false 终止在此节点的子节点的递归
		 */
		cascade: function(fn, scope, args) {
			var cs;
			if (fn.apply(scope || this, args || [this]) !== false) {
				cs = this.childNodes;
				for (var i = 0, len = cs.length; i < len; i++) {
					cs[i].cascade(fn, scope, args);
				}
			}
		},

		/**
		 * 迭代子节点
		 */
		eachChild: function(fn, scope, args) {
			var cs = this.childNodes;
			for (var i = 0, len = cs.length; i < len; i++) {
				if (fn.apply(scope || cs[i], args || [cs[i]]) === false) {
					break;
				}
			}
		},

		/**
		 * 按某一属性查找子节点
		 */
		findChild: function(attribute, value, deep) {
			return this.findChildBy(function() {
				return this.attributes[attribute] == value;
			}, null, deep);
		},

		/**
		 * 向下查找某一节点 deep是否深度查找
		 */
		findChildBy: function(fn, scope, deep) {
			var cs = this.childNodes,
				len = cs.length,
				i = 0,
				node,
				res;

			for (; i < len; i++) {
				node = cs[i];

				//如果当前节点不符合条件 继续递归起子元素
				if (fn.call(scope || node, node) === true) {
					return node;
				} else if (deep) {
					if ((res = node.findChildBy(fn, scope, deep)) != null) {
						return res;
					}
				}
			}

			return null;
		},

		/**
		 * 子节点排序 完毕后重塑链表
		 */
		sort: function(fn, scope) {
			var cs = this.childNodes,
				len = cs.length,
				sortFn;

			if (len > 0) {
				sortFn = scope ? Q.proxy(fn, scope) : fn;
				cs.sort(sortFn);

				//重塑链表
				for (var i = 0; i < len; i++) {
					var node = cs[i];
					node.previousSibling = cs[i - 1];
					node.nextSibling = cs[i + 1];

					//设置第一个节点
					if (i == 0) {
						this.setFirstChild(node);
					}
					//设置最后一个节点
					if (i == len - 1) {
						this.setLastChild(node);
					}
				}
			}
		},

		/**
		 * 判断是否包含一个节点
		 */
		contains: function(node) {
			return node.isAncestor(this);
		},

		/**
		 * 判断节点是否为当前节点的祖先节点
		 */
		isAncestor: function(node) {
			var parentNode = this.parentNode;
			//向上遍历 如果节点在其结构上 返回true
			while (parentNode) {
				if (parentNode == node) {
					return true;
				}
				parentNode = parentNode.parentNode;
			}
			return false;
		},

		toString: function() {
			return "[Node" + (this.id ? " " + this.id : "") + "]";
		}

	});

	return Node;
});