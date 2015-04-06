/**
 *
 * @authors 熊洋 (xywindows@gmail.com)
 * @date    2014-04-29 17:01:59
 * @description 该类提供了TreeNode状态变更时的一些系列处理方法
 */

define(['controls/QuickTips'], function(QuickTips) {

  var TreeNodeUI;

  TreeNodeUI = Q.Class.define({

    type: 'TreeNodeUI',

    init: function(node) {
      Q.extend(this, {
        node: node,
        rendered: false,
        animating: false,
        wasLeaf: true,
        ecc: 'x-tree-ec-icon x-tree-elbow',
        emptyIcon: Q.BLANK_ICON
      })
    },

    /**
     * 移除一个子节点
     */
    removeChild: function(node) {
      if (this.rendered) {
        this.ctNode.removeChild(node.ui.getEl());
      }
    },

    /**
     * 加载前
     */
    beforeLoad: function() {
      this.addClass("x-tree-node-loading");
    },

    /**
     * 加载完毕后 移除加载cls
     */
    afterLoad: function() {
      this.removeClass("x-tree-node-loading");
    },

    /**
     * 文本边框事件处理函数
     */
    onTextChange: function(node, text, oldText) {
      if (this.rendered) {
        this.textNode.innerHTML = text;
      }
    },

    /**
     * 图标cls变更事件处理函数
     */
    onIconClsChange: function(node, cls, oldCls) {
      var me = this;
      if (me.rendered) {
        Q.Element.removeClass(me.iconNode, oldCls);
        Q.Element.addClass(me.iconNode, cls);
      }
    },
    /**
     * 图标变更事件
     */
    onIconChange: function(node, icon) {
      var me = this,
        empty;

      if (me.rendered) {
        //'<img src="', a.icon || this.emptyIcon, '" class="x-tree-node-icon',(a.icon ? " x-tree-node-inline-icon" : ""),(a.iconCls ? " "+a.iconCls : ""),'" unselectable="on" />',
        empty = Q.isUndefined(icon);

        me.iconNode.src = empty ? me.emptyIcon : icon;
        Q.Element[empty ? 'removeClass' : 'addClass'](me.iconNode, 'x-tree-node-inline-icon');
      }
    },

    /**
     * 提示信息变更
     */
    onTipChange: function(node, tip, title) {
      var me = this;
      if (me.rendered) {
        Q.fly(me.textNode).attr('data-qtip', tip);

        if (Q.isDefined(title)) {
          Q.fly(me.textNode).attr('data-qtitle', title);
        }
      }
    },

    /**
     * hrefchange事件处理函数
     */
    onHrefChange: function(node, href, target) {
      var me = this;
      if (me.rendered) {
        me.anchor.href = me.getHref(href);
        if (Q.isDefined(target)) {
          me.anchor.target = target;
        }
      }
    },

    /**
     * 节点cls变更处理函数
     */
    onClsChange: function(node, cls, oldCls) {
      var me = this;
      if (me.rendered) {
        Q.Element.removeClass(me.elNode, oldCls);
        Q.Element.addClass(me.elNode, cls);
      }
    },

    /**
     * 节点禁用
     */
    onDisableChange: function(node, state) {
      var me = this;

      me.disabled = state;
      if (me.checkbox) {
        me.checkbox.disabled = state;
      }
      me[state ? 'addClass' : 'removeClass']('x-tree-node-disabled');
    },

    /**
     * 选中变更
     */
    onSelectedChange: function(state) {
      var me = this;
      if (state) {
        me.focus();
        me.addClass("x-tree-selected");
      } else {
        //this.blur();
        me.removeClass("x-tree-selected");
      }
    },

    /**
     * 节点拖拽
     */
    onMove: function(tree, node, oldParent, newParent, index, refNode) {
      var me = this,
        childIndent = null,
        targetNode, insertBefore;

      if (me.rendered) {
        //如果不存在targetNode（新的容器）
        if (!(targetNode = newParent.ui.getContainer())) {
          me.holder = document.createElement('div');
          me.holder.appendChild(me.wrap);
          return;
        }

        insertBefore = refNode ? refNode.ui.getEl() : null;

        if (insertBefore) {
          targetNode.insertBefore(me.wrap, insertBefore);
        } else {
          targetNode.appendChild(me.wrap);
        }

        //绘制缩进
        me.node.renderIndent(true, oldParent != newParent);
      }
    },

    /**
     * 添加class
     */
    addClass: function(cls) {
      if (this.elNode) {
        Q.Element.addClass(this.elNode, cls);
      }
    },

    /**
     * 删除class
     */
    removeClass: function(cls) {
      if (this.elNode) {
        Q.Element.removeClass(this.elNode, cls);
      }
    },

    remove: function() {
      var me = this;
      if (me.rendered) {
        //将当前节点缓存起来
        me.holder = document.createElement('div');
        me.holder.appendChild(me.wrap);
      }
    },

    /**
     * 触发节点的事件
     */
    fire: function() {
      return this.node.fire.apply(this.node, arguments);
    },

    /**
     * 初始化事件
     */
    initEvents: function() {
      var me = this,
        ownerTree, dd;

      me.node.bind('move', me.onMove, me);

      //禁用
      if (me.node.disabled) {
        me.onDisableChange(me.node, true);
      }
      //隐藏
      if (me.node.hidden) {
        me.hide();
      }

      //获取拥有节点的树
      ownerTree = me.node.getOwnerTree();
      dd = ownerTree.enableDD || ownerTree.enableDrag || ownerTree.enableDrop;

      if (dd && (!me.node.isRoot || ownerTree.rootVisible)) {
        /*
				$.dd.Registry.register(this.elNode, {
	                node: this.node,
	                handles: this.getDDHandles(),
	                isHandle: false
	            });
				 */
      }
    },

    // private
    getDDHandles: function() {
      var me = this;
      return [me.iconNode, me.textNode, me.elNode];
    },

    /**
     * 隐藏节点
     */
    hide: function() {
      var me = this;
      me.node.hidden = true;
      if (me.wrap) {
        me.wrap.style.display = "none";
      }
    },

    /**
     * 显示节点
     */
    show: function() {
      var me = this;
      me.node.hidden = false;
      if (me.wrap) {
        me.wrap.style.display = "";
      }
    },

    /**
     * 上下文菜单事件处理
     */
    onContextMenu: function(e) {
      var me = this;
      if (me.node.hasListener('contextmenu') || me.node.getOwnerTree().hasListener('contextmenu')) {
        e.preventDefault();
        me.focus();
        me.fire('contextmenu');
      }
    },

    /**
     * 点击事件处理
     */
    onClick: function(e) {
      var me = this;
      //拖拽中不处理
      if (me.dropping) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (me.fire('beforeclick', me.node, e) !== false) {
        var a = Q.Element.parentUntil(e.target, 'a', true);
        //未禁用且节点有href属性
        if (!me.disabled && me.node.attributes.href && a) {
          me.fire('click', me.node, e);
        } else if (a && e.ctrlKey) { //多选
          e.preventDefault();
          e.stopPropagation();
        }

        e.preventDefault();

        if (me.disabled) {
          return;
        }

        //如果是单选且节点可以展开 则切换展开状态
        if (me.node.attributes.singleClickExpand && !me.animating && me.node.isExpandable()) {
          me.node.toggle();
        }

        me.fire('click', me.node, e);
      } else {
        e.preventDefault();
        e.stopPropagation();
      }
    },

    onDblClick: function(e) {
      var me = this;
      e.preventDefault();
      //禁用 不做任何处理
      if (me.disabled) {
        return
      }

      if (me.fire('beforedblclick', me.node, e) !== false) {
        //切换选中状态
        if (me.checkbox) {
          me.toggleCheck();
        }

        //切换折叠状态
        if (!me.animating && me.node.isExpandable()) {
          me.node.toggle();
        }

        //触发双击事件
        me.fire('dblclick', me.node, e);
      }
    },

    /**
     * 鼠标悬浮
     */
    onOver: function(e) {
      this.addClass('x-tree-over');
    },

    onOut: function(e) {
      this.removeClass('x-tree-over');
    },

    /**
     * checkbox状态变更
     */
    onCheckChange: function() {
      var me = this,
        checked = me.checkbox.checked;
      // fix for IE6
      me.checkbox.defaultChecked = checked;
      me.node.attributes.checked = checked;
      me.fire('checkchange', me.node, checked);
    },

    ecClick: function(e) {
      var me = this;
      if (!me.animating && me.node.isExpandable()) {
        me.node.toggle();
      }
    },

    /**
     * 开始拖拽
     */
    startDrop: function() {
      this.dropping = true;
    },

    /**
     * 拖拽完毕
     */
    endDrop: function() {
      setTimeout(Q.proxy(function() {
        this.dropping = false;
      }, this), 50);
    },

    /**
     * 展开
     */
    expand: function() {
      //图标变成展开
      this.updateExpandIcon();
      this.ctNode.style.display = '';
    },

    focus: function() {
      var me = this;
      if (!me.node.preventHScroll) {
        try {
          me.anchor.focus();
        } catch (e) {}
      } else {
        try {
          var noscroll = me.node.getOwnerTree().getTreeEl().dom;
          var scrollLeft = noscroll.scrollLeft;
          me.anchor.focus();
          noscroll.scrollLeft = scrollLeft;
        } catch (e) {}
      }
    },

    blur: function() {
      try {
        this.anchor.blur();
      } catch (e) {}
    },

    /**
     * 切换checkbox选中状态
     */
    toggleCheck: function(value) {
      var cb = this.checkbox;
      if (cb) {
        cb.checked = (value === undefined ? !cb.checked : value);
        this.onCheckChange();
      }
    },

    /**
     * 折叠
     */
    collapse: function() {
      this.updateExpandIcon();
      this.ctNode.style.display = "none";
    },

    /**
     * 获取容器
     */
    getContainer: function() {
      return this.ctNode;
    },

    getEl: function() {
      return this.wrap;
    },

    /**
     * 给影子节点添加当前元素的复制品
     */
    appendDDGhost: function(ghostNode) {
      ghostNode.appendChild(this.elNode.cloneNode(true));
    },

    // private
    getDDRepairXY: function() {
      return Q.Element.offset(this.iconNode);
    },

    // private
    onRender: function() {
      this.render();
    },

    render: function(bulkRender) {
      var me = this,
        node = me.node,
        attr = node.attributes,
        //如果为根节点就添加到tree里
        targetNode = node.parentNode ?
        node.parentNode.ui.getContainer() :
        node.ownerTree.innerCt.dom;

      //未呈现
      if (!me.rendered) {
        me.rendered = true;

        //绘制dom
        me.renderElements(node, attr, targetNode, bulkRender);

        //注册Quicktips
        if (attr.qtip) {
          this.onTipChange(node, attr.qtip, attr.qtipTitle);
        } else if (attr.qtipCfg) {
          attr.qtipCfg.target = Q.id(this.textNode);
          QuickTips.register(attr.qtipCfg);
        }

        //初始化事件
        me.initEvents();

        if (!me.node.expanded) {
          me.updateExpandIcon(true);
        }
      } else { //已呈现 直接塞到目标node里
        if (bulkRender === true) {
          targetNode.appendChild(me.wrap);
        }
      }

    },

    renderElements: function(node, attr, targetNode, bulkRender) {
      var me = this,
        checkbox, nel, href, buf;
      //缩进
      me.indentMarkup = node.parentNode ?
        node.parentNode.ui.getChildIndent() : '';

      checkbox = Q.isBool(attr.checked);
      nel;
      href = me.getHref(attr.href);
      buf = ['<li class="x-tree-node">',
        '<div tree-node-id="', node.id, '" class="x-tree-node-el x-tree-node-leaf x-unselectable ', attr.cls, '" unselectable="on">',
        '<span class="x-tree-node-indent">', me.indentMarkup, "</span>", //缩进占位元素 (连接线条)
        '<img alt="" src="', me.emptyIcon, '" class="x-tree-ec-icon x-tree-elbow" />', //折叠开关||三叉线
        '<img alt="" src="', attr.icon || me.emptyIcon, '" class="x-tree-node-icon', (attr.icon ? " x-tree-node-inline-icon" : ""), (attr.iconCls ? " " + attr.iconCls : ""), '" unselectable="on" />',
        checkbox ? '<input class="x-tree-node-cb" type="checkbox" ' + (attr.checked ? 'checked="checked" />' : '/>') : '',
        '<a hidefocus="on" class="x-tree-node-anchor" href="', href, '" tabIndex="1" ',
        attr.hrefTarget ? ' target="' + attr.hrefTarget + '"' : "", '>',
        '<span unselectable="on">', node.text, '</span>',
        '</a>',
        '</div>',
        '<ul class="x-tree-node-ct" style="display:none;"></ul>',
        "</li>"
      ].join('');

      if (bulkRender !== true && node.nextSibling && (nel = node.nextSibling.ui.getEl())) {
        me.wrap = Q.Element.insertAdjacentHTML(nel, 'beforeBegin', buf);
      } else {
        me.wrap = Q.Element.insertAdjacentHTML(targetNode, 'beforeEnd', buf);
      }

      me.elNode = me.wrap.childNodes[0]; //div该节点的元素
      me.ctNode = me.wrap.childNodes[1]; //ul子节点容器

      var childNodes = me.elNode.childNodes;
      me.indexNode = childNodes[0]; //span缩进
      me.ecNode = childNodes[1]; //展开、折叠控制
      me.iconNode = childNodes[2]; //图标

      var index = 3;

      //复选框
      if (checkbox) {
        me.checkbox = childNodes[3];
        me.checkbox.defaultChecked = me.checkbox.checked;
        index++;
      }

      me.anchor = childNodes[index];
      //文本节点
      me.textNode = me.anchor.firstChild;
    },

    getHref: function(href) {
      return Q.isUndefined(href) ? 'javascript:;' : href;
    },

    /**
     * 获取链接
     */
    getAnchor: function() {
      return this.anchor;
    },

    /**
     * 获取文本节点
     */
    getTextEl: function() {
      return this.textNode;
    },

    /**
     * 图标
     */
    getIconEl: function() {
      return this.iconNode;
    },

    isChecked: function() {
      return this.checkbox ? this.checkbox.checked : false;
    },

    /**
     * 更改展开图标
     */
    updateExpandIcon: function() {
      var me = this;

      if (me.rendered) {
        var node = me.node,
          c1, c2,
          cls = node.isLast() ? "x-tree-elbow-end" : "x-tree-elbow",
          hasChild = node.hasChildNodes();

        //有子节点 或者允许展开
        if (hasChild || node.attributes.expandable) {
          if (node.expanded) { //已经完成展开
            cls += "-minus";
            c1 = "x-tree-node-collapsed";
            c2 = "x-tree-node-expanded";
          } else { //未展开
            cls += "-plus";
            c1 = "x-tree-node-expanded";
            c2 = "x-tree-node-collapsed";
          }

          if (me.wasLeaf) {
            me.removeClass("x-tree-node-leaf");
            me.wasLeaf = false;
          }

          if (me.c1 != c1 || me.c2 != c2) {
            Q.Element.removeClass(me.elNode, c1);
            Q.Element.addClass(me.elNode, c2);
            me.c1 = c1;
            me.c2 = c2;
          }
        } else {
          if (!me.wasLeaf) {
            Q.Element.removeClass(me.elNode, 'x-tree-node-expanded');
            Q.Element.addClass(me.elNode, 'x-tree-node-collapsed');
            delete me.c1;
            delete me.c2;
            me.wasLeaf = true;
          }
        }

        var ecc = "x-tree-ec-icon " + cls;
        if (me.ecc != ecc) {
          me.ecNode.className = ecc;
          me.ecc = ecc;
        }
      }
    },

    /**
     * id变更
     */
    onIdChange: function(id) {
      if (this.rendered) {
        this.elNode.setAttribute('tree-node-id', id);
      }
    },

    /**
     * 获取子节点缩进占位符
     */
    getChildIndent: function() {
      var me = this,
        buf, parent;

      //如果没有缩进缓存
      if (!me.childIndent) {
        buf = [];
        parent = me.node;

        while (parent) {
          //非根节点||是根节点且可见
          if (!parent.isRoot || (parent.isRoot && parent.ownerTree.rootVisible)) {
            //如果不是最后一个节点 插入线条占位元素 否则
            if (!parent.isLast()) {
              buf.unshift('<img alt="" src="' + me.emptyIcon + '" class="x-tree-elbow-line" />');
            } else {
              buf.unshift('<img alt="" src="' + me.emptyIcon + '" class="x-tree-icon" />');
            }
          }
          parent = parent.parentNode;
        }

        //缓存
        me.childIndent = buf.join("");
      }

      return me.childIndent;
    },

    /**
     * 重新绘制缩进
     */
    renderIndent: function() {
      var me = this,
        indent, parentNode;

      if (me.rendered) {
        indent = '';
        parentNode = me.node.parentNode;

        //如果拥有父节点 获取他的子节点缩进
        if (parentNode) {
          indent = parentNode.ui.getChildIndent();
        }

        if (me.indentMarkup != indent) {
          me.indentNode.innerHTML = indent;
          //缓存
          me.indentMarkup = indent;
        }

        me.updateExpandIcon();
      }
    },

    destroy: function() {
      /*
			if (this.elNode) {
				Ext.dd.Registry.unregister(this.elNode.id);
			}
			*/
      var me = this;
      Q.each(['textnode', 'anchor', 'checkbox', 'indentNode', 'ecNode', 'iconNode', 'elNode', 'ctNode', 'wrap', 'holder'], function(_, el) {
        if (me[el]) {
          Q.fly(me[el]).remove();
          delete me[el];
        }
      }, me);

      delete me.node;
    }

  });

  return TreeNodeUI;
});