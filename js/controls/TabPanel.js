define([
  'controls/Panel',
  'layout/CardLayout',
  'util/Template',
  'util/ClickRepeater'
], function(Panel, CardLayout, Template, ClickRepeater) {

  var TabPanel = Q.Class.define(Panel, {

    type: 'TabPanel',

    /*是否延迟渲染其他子组件（非activeItem）*/
    deferredRender: true,

    /*在选项卡标签 超出宽度时是否显示滚动标签*/
    enableTabScroll: false,

    stripInterval: 10,

    /*是否显示子控件header*/
    itemHeader: false,

    scrollIncrement: 30,

    scrollRepeatInterval: 200,

    baseCls: 'x-tab-panel',

    tabPosition: 'top',

    /*
					是否从HTML代码转换

					<div id="my-tabs">
					    <div class="x-tab" title="Tab 1">A simple tab/div>
					    <div class="x-tab" title="Tab 2">Another one/div>
					</div>
		        */
    autoTabs: false,

    idDelimiter: '__',

    autoTabSelector: 'div.x-tab',

    activeTab: undefined,

    itemCls: 'x-tab-strip',

    itemOverCls: 'x-tab-strip-over',

    elements: 'body',
    headerAsText: false,
    frame: false,
    hideBorders: true,

    initComponent: function() {
      var me = this;

      me.callParent(arguments);

      /*item默认类型*/
      me.defaultType = Panel;

      /*card布局*/
      me.setLayout(new CardLayout(Q.extend({
        layoutOnCardChange: me.layoutOnTabChange,
        deferredRender: me.deferredRender
      }, me.layoutConfig)));

      if (me.tabPosition == 'top') {
        me.elements += ',header';
        me.stripTarget = 'header';
      } else {
        me.elements += ',footer';
        me.stripTarget = 'footer';
      }

      //激活项栈
      if (!me.stack) {
        me.stack = TabPanel.AccessStack();
      }

      me.initItems();
    },

    onRender: function(container, position) {
      var me = this,
        stripTarget, pos;

      me.callParent(arguments);

      stripTarget = me[me.stripTarget]; //标签容器
      me.body.addClass('x-tab-panel-body-' + me.tabPosition);

      /*标签容器*/
      me.stripWrap = Q.get(stripTarget.createChild({
        'class': 'x-tab-strip-wrap',
        children: [{
          'class': 'x-tab-strips-box'
        }]
      }));

      me.strip = Q.get(me.stripWrap.dom.firstChild);

      //模板
      if (!me.itemTpl) {
        /*
					{
						id: this.id + this.idDelimiter + item.getItemId(),
						text: item.title,
						cls: cls,
						iconCls: item.iconCls || ''
					}
				*/
        TabPanel.prototype.itemTpl = new Template({
          tmpl: [
            '<span id="<%=id%>" class="x-tab-strip <%=cls%>" style="left: 157px;">',
            '<span class="x-tab-strip-text <%=iconCls%>">',
            '<%=text%>',
            '</span>',
            '<i class="x-tab-strip-tool x-tab-strip-close">&nbsp;</i>',
            '</span>'
          ].join(''),
          escape: false
        });
      }
      me.createScrollers();

      me.items.each(me.initTab, me); //标签

      me.edge = Q.get(me.strip.createChild({
        target: 'span',
        'class': 'x-strip-edge',
        content: '&nbsp;'
      }));
    },

    afterRender: function() {
      this.callParent(arguments);

      /*是否从现有结构中读入tab*/
      if (this.autoTabs) {
        this.readTabs(false);
      }

      /*设置激活项*/
      if (this.activeTab !== undefined) {
        var item = Q.isObject(this.activeTab) ?
          this.activeTab :
          this.items.get(this.activeTab);

        delete this.activeTab;

        this.setActiveTab(item);
      }
    },

    initEvents: function() {
      this.callParent(arguments);

      this.strip.on('mousedown', this.onStripMouseDown, this);
      this.strip.on('contextmenu', this.onStripContextMenu, this);
    },

    onItemMouseOver: function(e) {
      if (!Q.Element.contains(e.currentTarget, e.relatedTarget)) {
        Q.Element.addClass(e.currentTarget, this.itemOverCls);
      }
    },

    onItemMouseOut: function(e) {
      if (!Q.Element.contains(e.currentTarget, e.relatedTarget)) {
        Q.Element.removeClass(e.currentTarget, this.itemOverCls);
      }
    },

    findTarget: function(e) {
      var item,
        itemEl = Q.Element.parentUntil(e.target, '.x-tab-strip', true);

      if (itemEl) {
        item = this.getCmp(itemEl.id.split(this.idDelimiter)[1]);

        /*禁用*/
        if (item.disabled) {
          return {
            close: null,
            item: null,
            el: null
          }
        }
      }

      return {
        close: Q.Element.parentUntil(e.target, '.x-tab-strip-close', true),
        item: item,
        el: itemEl
      }
    },

    onStripMouseDown: function(e) {
      e.preventDefault();

      if (e.which !== 1) { //左键点击
        return;
      }

      var target = this.findTarget(e);

      //关闭
      if (target.close && target.item.fire('beforeclose', target.item) !== false) {
        target.item.fire('close', target.item);
        this.remove(target.item);
        return;
      }

      if (target.item && target.item != this.activeTab) {
        this.setActiveTab(target.item);
      }
    },

    onStripContextMenu: function(e) {
      e.preventDefault();
      var t = this.findTarget(e);
      if (t.item) {
        this.fire('contextmenu', this, t.item, e);
      }
    },


    readTabs: function(removeExisting) {
      var tabs, i, len, tab, title;

      if (removeExisting === true) {
        this.items.each(function(index, item) {
          this.remove(item);
        }, this);
      }

      tabs = this.el.children(this.autoTabSelector);

      for (i = 0, len = tabs.length; i < len; i++) {
        tab = tabs[i];
        title = tab.getAttribute(title);
        this.add({
          title: title,
          contentEl: tab
        });
      }
    },

    /*绘制选项卡标签*/
    initTab: function(index, item) {
      var me = this,
        before = me.strip.dom.childNodes[index],
        tempArgs = me.getTemplateArgs(item),
        html = me.itemTpl.compile(tempArgs),
        el = before ?
        Q.Element.insertAdjacentHTML(before, 'beforebegin', html) :
        Q.Element.insertAdjacentHTML(me.strip.dom, 'beforeend', html),
        tabEl = Q.get(el);

      item.tabEl = el;

      item.bind({
        scope: me,
        disable: me.onItemDisabled,
        enable: me.onItemEnabled,
        titlechange: me.onItemTitleChanged,
        iconchange: me.onItemIconChanged,
        beforeshow: me.onBeforeShowItem
      });

    },

    getTemplateArgs: function(item) {
      var cls = [];

      if (item.closable) {
        cls.push('x-tab-strip-closable')
      };

      if (item.disabled) {
        cls.push('x-item-disabled');
      }

      if (item.iconCls) {
        cls.push('x-tab-with-icon');
      }

      if (item.tabCls) {
        cls.push(item.tabCls);
      }

      return {
        id: this.id + this.idDelimiter + item.getItemId(),
        text: item.title,
        cls: cls.join(' '),
        iconCls: item.iconCls || ''
      };
    },


    onAdd: function(cmp) {
      this.callParent(arguments);

      if (this.rendered) {
        this.initTab(this.items.indexOf(cmp), cmp);
        this.delegateUpdates();
      }
    },

    onBeforeAdd: function(item) {
      var existing = !Q.isPlainObject(item) ?
        (this.items.indexOfKey(item.getItemId()) >= 0 ? item : null) :
        this.items.get(item),
        es;

      if (existing) { //如果存在
        this.setActiveTab(item);
        return false;
      }

      this.callParent(arguments);

      es = item.elements;

      if (!this.itemHeader) {
        item.elements = es ? es.replace(',header', '') : es;
      }
      item.border = (item.border === true);
    },

    onRemove: function(cmp) {
      var tabEl = Q.get(cmp.tabEl);

      if (tabEl) {
        tabEl.remove();
      }

      this.callParent(arguments);
      this.stack.remove(cmp);

      delete cmp.tabEl;

      if (cmp == this.activeTab) {
        var next = this.stack.next();

        if (next) {
          this.setActiveTab(next);
        } else if (this.items.data.length > 0) {
          this.setActiveTab(0);
        } else {
          this.setActiveTab(0);
        }
      }

      if (!this.destroying) {
        this.delegateUpdates();
      }
    },
    onBeforeShowItem: function(e, item) {
      if (item != this.activeTab) {
        this.setActiveTab(item);
        return false;
      }
    },

    onItemDisabled: function(e, item) {
      var el = this.getTabEl(item);

      if (el) {
        Q.Element.addClass(el, 'x-item-disabled');
      }

      this.stack.remove(item);
    },

    onItemEnabled: function(e, item) {
      var el = this.getTabEl(item);
      if (el) {
        Q.Element.addClass(el, 'x-item-disabled');
      }
    },

    onItemTitleChanged: function(e, item, title) {
      var el = this.getTabEl(item);
      if (el) {
        Q.get('.x-tab-strip-text', el).text(title);
        this.delegateUpdates();
      }
    },

    onItemIconChanged: function(e, item, iconCls, oldCls) {
      var el = this.getTabEl(item);
      if (el) {
        el = Q.get(el);
        el.child('span.x-tab-strip-text').removeClass(oldCls).addClass(iconCls);
        el[Q.isUndefined(iconCls) ? 'removeClass' : 'addClass']('x-tab-with-icon');
        this.delegateUpdates();
      }
    },


    getTabEl: function(item) {
      var cmp = this.getCmp(item);

      return cmp ? cmp.tabEl : null;
    },

    onResize: function() {
      this.callParent(arguments);
      this.delegateUpdates();
    },

    beginUpdate: function() {
      this.suspendUpdates = true;
    },

    endUpdate: function() {
      this.suspendUpdates = false;
      this.delegateUpdates();
    },

    hideTabStripItem: function(item) {
      item = this.getComponent(item);
      var el = this.getTabEl(item);
      if (el) {
        el.style.display = 'none';
        this.delegateUpdates();
      }
      this.stack.remove(item);
    },

    unhideTabStripItem: function(item) {
      item = this.getComponent(item);
      var el = this.getTabEl(item);
      if (el) {
        el.style.display = '';
        this.delegateUpdates();
      }
    },

    delegateUpdates: function() {
      var rendered = this.rendered;

      if (this.suspendUpdates) {
        return;
      }

      this.layoutStrip();

      if (this.enableTabScroll && rendered) {
        this.autoScrollTabs();
      }
    },

    adjustBodyWidth: function(w) {
      if (this.header) {
        this.header.outerWidth(false, w);
      }
      if (this.footer) {
        this.footer.outerWidth(false, w);
      }
      return w;
    },

    setActiveTab: function(item) {
      item = this.getCmp(item);
      if (this.fire('beforerabchange', this, item, this.activeTab) === false) {
        return;
      }

      if (!this.rendered) {
        this.activeTab = item;
        return;
      }

      if (this.activeTab != item) {
        if (this.activeTab) { //删除上一个激活项标签class
          var oldEl = this.getTabEl(this.activeTab);
          if (oldEl) {
            Q.Element.removeClass(oldEl, 'x-tab-strip-active');
          }
        }

        this.activeTab = item;

        if (item) {
          var el = this.getTabEl(item);
          Q.Element.addClass(el, 'x-tab-strip-active');

          this.stack.add(item);

          this.layout.setActiveItem(item);
          // Need to do this here, since setting the active tab slightly changes the size
          this.delegateUpdates();

          if (this.scrolling) {
            this.scrollToTab(item);
          }
        }

        this.fire('tabchange', this, item);
      }
    },

    getItem: function(item) {
      return this.getComponent(item);
    },

    getActiveTab: function() {
      return this.activeTab || null;
    },


    autoScrollTabs: function() {

      var count = this.items.data.length,
        edgePosLeft, //边缘X轴位置
        contentWidth = this.strip.width(false);

      if (!this.enableTabScroll || contentWidth < 50) {
        return;
      }

      edgePosLeft = parseFloat(this.edge.css('left')) || 0;

      /*不显示滑动控制*/
      if (count === 0 || edgePosLeft <= contentWidth) {
        if (this.scrolling) {
          this.stripWrap.removeClass('x-tab-scrolling');
          this.scrolling = false;
        }
      } else {
        if (!this.scrolling) {
          this.stripWrap.addClass('x-tab-scrolling');

          this.scrolling = true;
        }
      }
    },

    /*自动完成标签位置*/
    layoutStrip: function() {
      var posLeft = 0,
        strips = this.strip.children('.x-tab-strip');

      strips.each(function(_, item) {
        Q.Element.style(item, 'left', posLeft);
        posLeft += item.offsetWidth + this.stripInterval;
      }, this);

      this.edge.css('left', posLeft);
    },

    createScrollers: function() {
      var scrollBtnCfg = {
        content: '&nbsp;'
      };

      this.stripWrap.addClass('x-tab-scrolling-' + this.tabPosition);

      //生成控制按钮
      Q.each({
        Left: 'left',
        Right: 'right'
      }, function(position, name) {

        scrollBtnCfg['class'] = 'x-tab-scroller-' + name;

        this['scroll' + position] = this.stripWrap.createChild(scrollBtnCfg);

        this[name + 'Repeater'] = new ClickRepeater(this['scroll' + position], {
          interval: this.scrollRepeatInterval,
          handler: this['onScroll' + position],
          scope: this
        });

      }, this);



      //左右滑动
      Q.each(['Left', 'Right'], function(index, position) {
        this['scroll' + position].on('click', this['onScroll' + position], this);
      }, this);

      this.strip.on('mouseover', Q.proxy(this.onItemMouseOver, this), '.x-tab-strip');

      this.strip.on('mouseout', Q.proxy(this.onItemMouseOut, this), '.x-tab-strip');


    },

    getScrollWidth: function() {
      return (parseInt(this.edge.css('left'), 10) || 0) + this.getScrollPos();
    },

    // private
    getScrollPos: function() {
      return parseInt(this.strip.dom.scrollLeft, 10) || 0;
    },

    getScrollArea: function() {
      return this.strip.innerWidth();
    },

    /*滚动增量*/
    getScrollIncrement: function() {
      return this.scrollIncrement || 20;
    },


    scrollToTab: function(item) {
      if (!item) {
        return;
      }

      var el = this.getTabEl(item),
        pos = this.getScrollPos(),
        area = this.getScrollArea(),
        left = Q.Element.css(el, 'left', true),
        right = left + el.offsetWidth;

      if (left < pos) {
        this.scrollTo(left);
      } else if (right > (pos + area)) {
        this.scrollTo(right - area);
      }

    },

    scrollTo: function(pos) {
      this.strip.dom.scrollLeft = parseFloat(pos);
    },

    onScrollRight: function() {
      var scrollWidth = parseFloat(this.edge.css('left')),
        pos = this.strip.dom.scrollLeft,
        currentPos = Math.min(scrollWidth, pos + this.getScrollIncrement());

      if (currentPos != pos) {
        this.scrollTo(currentPos);
      }
    },


    onScrollLeft: function() {
      var pos = this.strip.dom.scrollLeft,
        currentPos = Math.max(0, pos - this.getScrollIncrement());

      if (currentPos != pos) {
        this.scrollTo(currentPos);
      }
    },

    beforeDestroy: function() {
      this.callParent(arguments);

      Q.each(['scrollLeft', 'scrollRight', 'edge', 'strip'], function(_, name) {
        this[name].remove();
      }, this);
    }
  });

  TabPanel.AccessStack = function() {
    var items = [];
    return {
      add: function(item) {
        items.push(item);
        if (items.length > 10) {
          items.shift();
        }
      },

      remove: function(item) {
        var s = [];
        for (var i = 0, len = items.length; i < len; i++) {
          if (items[i] != item) {
            s.push(items[i]);
          }
        }
        items = s;
      },

      next: function() {
        return items.pop();
      }
    };
  };

  return TabPanel;
});