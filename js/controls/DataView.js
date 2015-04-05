define([
  'controls/BoxComponent',
  'util/Template',
  'data/StoreManager'
], function(BoxComponent, Template, StoreManager) {
  /*
		一种使用定制的模板布局和格式展示数据的机制。 
		DataView使用一个Ext.XTemplate作为其内部的模板机制， 
		并被绑定到一个Ext.data.Store， 
		这样当store中的数据发生变化时视图将自动同步以反应变化。 
		视图也内建了对许多可能发生的通用事件的处理，
		包含项目被单击、双击、鼠标滑过、鼠标移出等等， 
		同时也有一个内建的选择模型（selection model）。 
		为了使用这些特性，必须为DataView提供一个itemSelector配置项， 
		用来决定与哪个节点配合使用。
	*/
  var DataView = Q.Class.define(BoxComponent, {

    type: 'DataView',

    /*选中项目的CSS类*/
    selectedClass: 'x-view-selected',

    /*没有数据时显示的文本*/
    emptyText: "",

    /*设置为true以延迟应用emptyText直到store第一次加载 */
    deferEmptyText: true,

    /*启用mouseenter和mouseleave事件 */
    trackOver: false,

    /*设置此项为true可以忽略所绑定store上的datachanged事件。*/
    blockRefresh: false,

    last: false,

    initComponent: function() {
      var me = this;

      me.callParent(arguments);
      //模板如果为字符串
      if (Q.isString(me.tpl) || Q.isArray(me.tpl)) {
        me.tpl = new Template(me.tpl);
      }

      me.store = StoreManager.lookup(this.store);
      me.all = new Q.List();
      me.selected = new Q.List();
    },

    afterRender: function() {
      var tplTarget, me = this;

      me.callParent(arguments);

      //模板容器
      tplTarget = me.getTemplateTarget();

      if (!tplTarget) {
        return;
      }

      tplTarget.on('click', me.onClick, me);
      tplTarget.on('dblclick', me.onDblClick, me);
      tplTarget.on('contextmenu', me.onContextMenu, me);

      //mouseover out
      if (me.overClass || me.trackOver) {
        tplTarget.on('mouseover', me.onMouseOver, me);
        tplTarget.on('mouseout', me.onMouseOut, me);
      }

      if (me.store) {
        me.bindStore(me.store, true);
      }
    },

    getTemplateTarget: function() {
      return this.el;
    },

    /*刷新*/
    refresh: function() {
      var el, records, me = this;

      me.clearSelections(false, true);
      el = me.getTemplateTarget();
      records = me.store.getRange();

      //清空
      el.empty();

      if (!records.length) {
        //如果没有设置延迟空文本显示
        if (!me.deferEmptyText || me.hasSkippedEmptyText) {
          el.dom.innerHTML = '<span class="x-list-empty">' + me.emptyText + '</span>';
        }
        me.all.clear();
      } else {
        el.dom.innerHTML = me.tpl.compile(me.collectData(records, 0));
        me.all.clear();
        me.all.add(Q.dom.find(me.itemSelector, el.dom).data);
        me.updateIndexes(0);
      }
      me.hasSkippedEmptyText = true;
    },
    collectData: function(records, start) {
      var ret = [],
        i = 0,
        length = records.length;


      for (; i < length; i++) {
        ret.push(this.prepareData(records[i].data, start + i, records[i]));
      }
      return ret;
    },
    prepareData: function(data) {
      return data;
    },
    updateIndexes: function(startIndex, endIndex) {
      var elements = this.all.data,
        i;

      startIndex = startIndex || 0;
      endIndex = endIndex || (endIndex === 0 ? 0 : elements.length - 1);

      for (i = startIndex; i <= endIndex; i++) {
        elements[i].viewIndex = i;
      }
    },
    bufferRender: function(records, index) {
      var div = document.createElement('div');

      div.innerHTML = this.tpl.eachCompile(this.collectData(records, index));
      return Q.dom.find(this.itemSelector, div);
    },
    /*更新*/
    onUpdate: function(ds, record) {
      var me = this,
        index = me.store.indexOf(record),
        selectEl,
        orig, node;

      if (index > -1) {
        selectEl = me.isSelected(index);
        orig = me.all.data[index];
        node = me.bufferRender([record], index)[0];

        //替换在all和dom 中的位置
        me.all.replace(index, node);
        orig.replaceWith(node);

        if (selectEl) {
          me.selected.replace(me.selected.indexOf(orig), node)
          me.all.get(index).addClass(me.selectedClass);
        }

        me.updateIndexes(index, index);
      }
    },

    onAdd: function(ds, records, index) {
      var nodes, pos, allElem, me = this,
        i, node;

      if (me.all.count() === 0) {
        me.refresh();
        return;
      }

      nodes = me.bufferRender(records, index);
      allElem = this.all.data;

      if (index < allElem.length) {
        pos = allElem[index];
        allElem.splice.apply(allElem, [index, 0].concat(nodes));
      } else {
        pos = allElem[allElem.length - 1];
        allElem.push.apply(allElem, nodes);
      }

      i = 0;

      while (node = nodes[i++]) {
        pos.prepend(node);
      }

      me.updateIndexes(index);
    },

    onRemove: function(ds, record, index) {
      this.deselect(index);
      this.all.removeAt(index);
      this.updateIndexes(index);
      if (this.store.getCount() === 0) {
        this.refresh();
      }
    },

    refreshNode: function(index) {
      this.onUpdate(this.store, this.store.getAt(index));
    },

    getStore: function() {
      return this.store;
    },

    onStoreUpdate: function(e, ds, record) {
      this.onUpdate(ds, record);
    },

    onStoreRemove: function(e, ds, record, index) {
      this.onRemove(ds, record, index);
    },

    onStoreAdd: function(e, ds, records, index) {
      this.onAdd(ds, records, index);
    },

    bindStore: function(store, initial) {
      var me = this;

      //如果是初始化
      if (!initial && me.store) {
        if (store !== me.store && me.store.autoDestroy) {
          me.store.destroy();
        } else {
          me.store.unbind("beforeload", me.onBeforeLoad, me);
          me.store.unbind("datachanged", me.onDataChanged, me);
          me.store.unbind("add", me.onStoreAdd, me);
          me.store.unbind("remove", me.onStoreRemove, me);
          me.store.unbind("update", me.onStoreUpdate, me);
          me.store.unbind("clear", me.refresh, me);
        }
        if (!store) {
          me.store = null;
        }
      }

      if (store) {
        store = StoreManager.lookup(store);

        store.bind({
          scope: me,
          beforeload: me.onBeforeLoad,
          datachanged: me.onDataChanged,
          add: me.onStoreAdd,
          remove: me.onStoreRemove,
          update: me.onStoreUpdate,
          clear: me.refresh
        });
      }

      me.store = store;

      if (store) {
        //刷新丫  距离春节还有三天 拼命赶工中。。。
        me.refresh();
      }
    },

    onDataChanged: function() {
      if (this.blockRefresh !== true) {
        this.refresh.apply(this, arguments);
      }
    },

    findItemFromChild: function(node) {
      return Q.Element.is(node, this.itemSelector) ?
        node :
        Q.Element.parentUntil(Q.dom.get(node), this.itemSelector);
    },

    onClick: function(e) {
      var me = this,
        item = me.findItemFromChild(e.target),
        index;


      if (item) {
        index = me.indexOf(item);
        if (me.onItemClick(item, index, e) !== false) {
          me.fire('click', me, index, item, e);
        }
      } else {
        if (me.fire('containerclick', me, e) !== false) {
          me.onContainerClick(e);
        }
      }
    },
    onItemClick: function(item, index, e) {
      if (this.fire("beforeclick", this, index, item, e) === false) {
        return false;
      }

      //多选
      if (this.multiSelect) {
        this.doMultiSelection(item, index, e);
        e.preventDefault();
      } else if (this.singleSelect) {
        this.doSingleSelection(item, index, e);
        e.preventDefault();
      }
      return true;
    },

    onContainerClick: function(e) {
      this.clearSelections();
    },

    onContextMenu: function(e) {
      var me = this,
        item = me.findItemFromChild(e.target);
      if (item) {
        me.fire('contextmenu', me, me.indexOf(item), item, e);
      } else {
        me.fire("containercontextmenu", me, e);
      }
    },
    onDblClick: function(e) {
      var me = this,
        item = me.findItemFromChild(e.target);
      if (item) {
        me.fire("dblclick", me, me.indexOf(item), item, e);
      }
    },
    onMouseOver: function(e) {
      var me = this,
        item = me.findItemFromChild(e.target);

      if (item && item !== me.lastItem) {
        me.lastItem = item;
        Q.Element.addClass(item, me.overClass);
        me.fire("mouseenter", me, me.indexOf(item), item, e);
      }
    },

    // private
    onMouseOut: function(e) {
      var me = this;
      if (me.lastItem) {
        //如果相关元素不属于lastItem
        if (!Q.Element.contains(me.lastItem, e.relatedTarget)) {
          Q.Element.removeClass(me.lastItem, me.overClass);
          me.fire("mouseleave", me, me.indexOf(me.lastItem), me.lastItem, e);
          delete me.lastItem;
        }
      }
    },


    /*单选*/
    doSingleSelection: function(item, index, e) {
      if (e.ctrlKey && this.isSelected(index)) {
        this.deselect(index);
      } else {
        this.select(index, false);
      }
    },

    //多选
    doMultiSelection: function(item, index, e) {
      var last, me = this;

      if (me.last !== false) {
        last = me.last;
        me.selectRange(last, index);
        me.last = last; // reset the last
      } else {
        if (me.isSelected(index)) {
          me.deselect(index);
        } else {
          me.select(index, true);
        }
      }
    },

    getSelectionCount: function() {
      return this.selected.count();
    },

    getSelectedNodes: function() {
      return this.selected.data;
    },

    getSelectedIndexes: function() {
      var indexes = [],
        selected = this.selected.data,
        i = 0,
        len = selected.length;

      for (; i < len; i++) {
        indexes.push(selected[i].viewIndex);
      }
      return indexes;
    },

    getSelectedRecords: function() {
      return this.getRecords(this.selected.data);
    },

    getRecords: function(nodes) {
      var records = [],
        i = 0,
        item;

      while (item = nodes[i++]) {
        records.push(this.store.getAt(item.viewIndex));
      }
      return records;
    },
    getRecord: function(node) {
      return this.store.getAt(node.viewIndex);
    },
    clearSelections: function(suppressEvent, skipUpdate) {
      if ((this.multiSelect || this.singleSelect) && this.selected.count() > 0) {

        if (!skipUpdate) {

          this.selected.each(function(_, item) {
            Q.Element.removeClass(item, this.selectedClass)
          }, this);

        }

        this.selected.clear();
        this.last = false;

        if (!suppressEvent) {
          this.fire("selectionchange", this, this.selected.data);
        }
      }
    },
    isSelected: function(node) {
      return this.selected.contains(this.getNode(node));
    },

    deselect: function(node) {
      if (this.isSelected(node)) {
        node = this.getNode(node);
        this.selected.remove(node);
        if (this.last == node.viewIndex) {
          this.last = false;
        }
        Q.Element.removeClass(node, this.selectedClass);
        this.fire("selectionchange", this, this.selected.data);
      }
    },
    select: function(nodeInfo, keepExisting, suppressEvent) {
      if (Q.isArray(nodeInfo)) {
        if (!keepExisting) {
          this.clearSelections(true);
        }
        for (var i = 0, len = nodeInfo.length; i < len; i++) {
          this.select(nodeInfo[i], true, true);
        }
        if (!suppressEvent) {
          this.fire("selectionchange", this, this.selected.data);
        }
      } else {
        var node = this.getNode(nodeInfo);

        if (!keepExisting) {
          this.clearSelections(true);
        }

        if (node && !this.isSelected(node)) {
          if (this.fire("beforeselect", this, node, this.selected.data) !== false) {
            Q.Element.addClass(node, this.selectedClass);
            this.selected.add(node);
            this.last = node.viewIndex;
            if (!suppressEvent) {
              this.fire("selectionchange", this, this.selected.data);
            }
          }
        }

      }
    },

    /**
     * Selects a range of nodes. All nodes between start and end are selected.
     * @param {Number} start The index of the first node in the range
     * @param {Number} end The index of the last node in the range
     * @param {Boolean} keepExisting (optional) True to retain existing selections
     */
    selectRange: function(start, end, keepExisting) {
      if (!keepExisting) {
        this.clearSelections(true);
      }
      this.select(this.getNodes(start, end), true);
    },

    getNode: function(nodeInfo) {
      if (Q.isString(nodeInfo)) {
        return document.getElementById(nodeInfo);
      } else if (Q.isNumber(nodeInfo)) {
        return this.all.data[nodeInfo];
      } else if (nodeInfo && nodeInfo.isXType && nodeInfo.isXType('Record')) {
        var idx = this.store.indexOf(nodeInfo);
        return this.all.data[idx];
      }
      return nodeInfo;
    },

    /**
     * Gets a range nodes.
     * @param {Number} start (optional) The index of the first node in the range
     * @param {Number} end (optional) The index of the last node in the range
     * @return {Array} An array of nodes
     */
    getNodes: function(start, end) {
      var ns = this.all.data,
        nodes = [],
        i;

      start = start || 0;
      end = !Q.isDefined(end) ? Math.max(ns.length - 1, 0) : end;
      if (start <= end) {
        for (i = start; i <= end && ns[i]; i++) {
          nodes.push(ns[i]);
        }
      } else {
        for (i = start; i >= end && ns[i]; i--) {
          nodes.push(ns[i]);
        }
      }
      return nodes;
    },

    indexOf: function(node) {

      node = this.getNode(node);

      if (Q.isNumber(node.viewIndex)) {
        return node.viewIndex;
      }
      return this.all.indexOf(node);
    },

    // private
    onBeforeLoad: function() {
      if (this.loadingText) {
        this.clearSelections(false, true);
        this.getTemplateTarget().dom.innerHTML = '<div class="loading-indicator">' + this.loadingText + '</div>';
        this.all.clear();
      }
    },

    onDestroy: function() {
      this.all.clear();
      this.selected.clear();
      this.callParent(arguments);
      this.bindStore(null);
    }
  });

  DataView.prototype.setStore = DataView.prototype.bindStore;

  return DataView;
})