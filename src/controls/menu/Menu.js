define([
  'controls/Container',
  'layout/MenuLayout',
  'controls/BoxComponent',
  'controls/Layer',
  'menu/BaseItem',
  'menu/MenuItem',
  'menu/Separator',
  'menu/TextItem',
  'menu/MenuMgr',
  'util/ClickRepeater',
  'controls/ComponentMgr'
], function(Container, MenuLayout, BoxComponent, Layer, BaseItem, MenuItem, Separator, TextItem, MenuMgr, ClickRepeater, ComponentMgr) {

  var Menu = Q.Class.define(Container, {

    type: 'Menu',

    hideMode: 'offsets',

    minWidth: 120,

    maxHeight: null,

    subMenuAlign: 'tl-tr?',

    defaultAlign: 'tl-bl?',

    defaultOffsets: [0, 0],

    /*为true时，将允许同一时刻显示多个菜单*/
    allowOtherMenus: false,

    /*
			设置为true时，
			将忽略在任何父菜单项(显示子菜单)上的点击操作， 
			这样在点击父菜单项时子菜单不会隐藏掉
		*/
    ignoreParentClicks: false,

    /*
			当为true时，菜单将会在菜单太长的时候显示滚动条
		*/
    enableScrolling: true,

    /*
			滚动增量
		*/
    scrollIncrement: 24,

    /*
			当为true时，显示分割栏的图标
		*/
    showSeparator: true,

    /*
			如果为true就删除下拉菜单的左边分割线。 默认为 false。 
		*/
    plain: false,

    floating: true,

    zIndex: 15000,

    hidden: true,

    scrollerHeight: 8,

    autoLayout: true, // Provided for backwards compat

    bufferResize: false,

    initComponent: function() {

      var me = this;

      /*默认子控件*/
      me.defaultType = MenuItem;
      me.layout = MenuLayout;

      MenuMgr.register(me);

      if (me.floating) {
        Q.get(window).on('resize', me.hide, me);
      } else {
        //hidden
        if (me.initCfg.hidden !== false) {
          me.hidden = false;
        }

        me.defaults = {
          hideOnClick: false
        };
      }

      me.callParent(arguments);


      if (me.autoLayout) {
        me.bind({
          scope: me,
          add: me.onMenuAddOrRemove,
          remove: me.onMenuAddOrRemove
        });
      }
    },

    onMenuAddOrRemove: function() {
      this.doLayout();
    },

    getLayoutTarget: function() {
      return this.ul;
    },

    onRender: function(container, position) {
      var me = this,
        domConfig;

      if (!container) {
        container = me.getBody();
      }


      domConfig = {
        id: me.getId(),

        'class': ['x-menu', (me.floating ? 'x-menu-floating x-layer' : ''), (me.cls || ''), (me.plain ? 'x-menu-plain' : ''), (me.showSeparator ? '' : 'x-menu-nosep')].join(' '),

        style: me.style,

        children: [{
          target: 'a',
          'class': 'x-menu-focus',
          href: '#',
          onclick: 'return false;',
          tabIndex: '-1'
        }, {
          target: 'ul',
          'class': 'x-menu-list'
        }]
      };

      if (me.floating) {
        me.el = new Layer({
          domConfig: domConfig,
          constrain: false,
          parentEl: container,
          zindex: me.zindex
        });
      } else {
        me.el = container.createChild(domConfig);
      }

      me.callParent(arguments);

      me.focusEl = Q.get('a.x-menu-focus', me.el.dom);
      me.ul = Q.get('ul.x-menu-list', me.el.dom);
    },

    initEvents: function() {
      var me = this;
      me.callParent(arguments);
      me.ul.on('click', me.onClick, me);
      me.ul.on('mouseover', me.onMouseOver, me);
      me.ul.on('mouseout', me.onMouseOut, me);

      //允许滚动
      if (me.enableScrolling) {
        me.el.on('click', Q.proxy(me.onScroll, me), '.x-menu-scroller');
        me.el.on('mouseover', Q.proxy(me.deactivateActive, me), '.x-menu-scroller');
      }
    },

    findTargetItem: function(e) {
      var target = Q.Element.parentUntil(e.target, '.x-menu-list-item');
      if (target && target.menuItemId) {
        return this.items.get(target.menuItemId);
      }
    },

    onClick: function(e) {
      var me = this,
        target = me.findTargetItem(e);

      if (target) {
        if (target.isFormField) { //表单控件

          me.setActiveItem(target);

        } else if (target instanceof BaseItem) { //菜单项

          if (target.menu && me.ignoreParentClicks) {

            target.expandMenu();
            e.preventDefalut();

          } else if (target.onClick) {
            target.onClick(e);
            me.fire('click', me, target, e);

          }
        }
      }
    },
    /*设置激活项*/
    setActiveItem: function(item, autoExpand) {
      if (item != this.activeItem) {
        this.deactivateActive(); //取消激活
        if ((this.activeItem = item).isFormField) { //如果是表单控件 获取焦点

          item.focus();
        } else {

          item.activate(autoExpand);
        }
      } else if (autoExpand) {
        item.expandMenu();
      }
    },
    /*取消激活*/
    deactivateActive: function() {
      var activeItem = this.activeItem;

      if (activeItem) {
        if (activeItem.isFormField) {
          if (a.collapse) { //comboBox
            a.collapse();
          }
        } else {
          activeItem.deactivate();
        }
        delete this.activeItem;
      }
    },

    tryActivate: function(start, step) {
      var items = this.items;
      for (var i = start, len = items.data.length; i >= 0 && i < len; i += step) {
        var item = items.get(i);
        if (item.isVisible() && !item.disabled && (item.canActivate || item.isFormField)) {
          this.setActiveItem(item, false);
          return item;
        }
      }
      return false;
    },

    onMouseOver: function(e) {
      var me = this,
        target = me.findTargetItem(e);
      if (target) {
        if (target.canActivate && !target.disabled) {
          me.setActiveItem(target, true);
        }
      }
      me.over = true;
      me.fire('mouseover', me, e, target);
    },

    onMouseOut: function(e) {
      var me = this,
        target = me.findTargetItem(e);
      if (target) {
        if (target == me.activeItem && target.shouldDeactivate && target.shouldDeactivate(e)) {
          me.activeItem.deactivate();
          delete me.activeItem;
        }
      }
      me.over = false;
      me.fire('mouseout', me, e, target);
    },

    onScroll: function(e, target) {
      if (e) {
        e.preventDefalut();
        e.stopPropagation();
      }

      var ul = this.ul.dom,
        top = Q.Element.is(e.currentTarget || target, '.x-menu-scroller-top');

      //滚动
      ul.scrollTop += this.scrollIncrement * (top ? -1 : 1);

      if (top ? ul.scrollTop <= 0 : ul.scrollTop + this.activeMax >= ul.scrollHeight) {
        this.onScrollerOut(null, t);
      }
    },

    // private
    onScrollerIn: function(e) {
      var ul = this.ul.dom,
        top = Q.Element.is(e.currentTarget, '.x-menu-scroller-top');

      if (top ? ul.scrollTop > 0 : ul.scrollTop + this.activeMax < ul.scrollHeight) {
        Q.Element.addClass(e.currentTarget, 'x-menu-item-active x-menu-scroller-active');
      }
    },

    onScrollerOut: function(e) {
      Q.Element.removeClass(e.currentTarget, 'x-menu-item-active x-menu-scroller-active');
    },

    /*
			如果 floating=true 使用 showAt 将当前菜单显示在紧靠其它元素的位置，
			element  对齐元素。 
			position {String}  （可选）使用的 alignTo 锚定位置，用来对齐元素(默认值为 this.defaultAlign)。 
			parentMenu {Menu} （可选） 菜单的父菜单，如果可用(默认值为 undefined)。 
		*/
    show: function(el, pos, parentMenu) {
      var me = this;

      if (me.floating) {
        el = Q.dom.get(el);
        me.parentMenu = parentMenu;

        if (!me.el) {
          me.render();
          me.doLayout(false, true);
        }

        me.showAt(me.el.getAlignToXY(el, pos || me.defaultAlign, me.defaultOffsets), parentMenu);
      } else {
        me.callParent('show');
      }

    },

    showAt: function(xy, parentMenu) {
      var me = this;

      if (me.fire('beforeshow', me) !== false) {
        me.parentMenu = parentMenu;

        if (!me.el) { //未呈现
          me.render();
        }

        me.el.show();

        if (me.enableScrolling) {
          me.el.offset(xy);
          xy.top = me.constrainScroll(xy.top);
          xy.left = me.el.adjustForConstraints(xy).left;
        } else {
          //constrain to the viewport.
          xy = me.el.adjustForConstraints(xy);
        }


        me.el.offset(xy);
        me.callParent('onShow');
        me.hidden = false;
        me.focus();
        me.fire('show', me);
      }
    },

    constrainScroll: function(y) {
      var me = this,
        full = me.ul.css('height', 'auto').outerHeight(false),
        returnY = y,
        max, normalY, parentEl, scrollTop, viewHeight;


      if (me.floating) {
        parentEl = Q.get(me.el.dom.parentNode);
        scrollTop = parentEl.getScroll().top;
        viewHeight = Q.Element.getViewHeight();
        normalY = y - scrollTop;
        max = me.maxHeight ? me.maxHeight : viewHeight - normalY;

        if (full > viewHeight) {
          max = viewHeight;
          returnY = y - normalY;
        } else if (max < full) {
          returnY = y - (full - max);
          max = full;
        }
      } else {
        max = me.getHeight();
      }

      if (me.maxHeight) {
        max = Math.min(me.maxHeight, max);
      }

      if (full > max && max > 0) {
        me.activeMax = max - me.scrollerHeight * 2 - me.el.getFrameWidth('top bottom');
        me.ul.outerHeight(false, me.activeMax);
        me.createScrollers();
        Q.find('.x-menu-scroller').invoke('show');
      } else {
        me.ul.outerHeight(full);
        Q.find('.x-menu-scroller').invoke('hide');
      }
      me.ul.dom.scrollTop = 0;
      return returnY;
    },

    createScrollers: function() {
      var me = this;

      if (!me.scroller) {
        me.scroller = {
          pos: 0,
          top: me.el.createChild({
            target: 'div',
            'class': 'x-menu-scroller x-menu-scroller-top',
            content: '&#160;'
          }),
          bottom: me.el.createChild({
            target: 'div',
            'class': 'x-menu-scroller x-menu-scroller-bottom',
            content: '&#160;'
          })
        };

        me.scroller.top.on('mouseover', me.onScrollerIn, me);
        me.scroller.top.on('mouseout', me.onScrollerOut, me);

        me.scroller.topRepeater = new ClickRepeater(me.scroller.top, {
          listeners: {
            click: Q.proxy(me.onScroll, me, null, me.scroller.top.dom)
          }
        });

        me.scroller.bottom.on('mouseover', me.onScrollerIn, me);
        me.scroller.bottom.on('mouseout', me.onScrollerOut, me);

        me.scroller.topRepeater = new ClickRepeater(me.scroller.bottom, {
          listeners: {
            click: Q.proxy(me.onScroll, me, null, this.scroller.bottom.dom)
          }
        });
      }
    },

    onLayout: function() {
      var me = this;

      if (me.isVisible()) {

        if (me.enableScrolling) {
          me.constrainScroll(me.el.offset().top);
        }

        if (me.floating) {
          me.el.sync();
        }
      }
    },

    hide: function(deep) {
      var me = this;

      if (!me.isDestroyed) {
        me.deepHide = deep;
        me.callParent(arguments);
        delete me.deepHide;
      }
    },

    // private
    onHide: function() {
      var me = this;
      me.callParent(arguments);
      me.deactivateActive();

      if (me.el && me.floating) {
        me.el.hide();
      }

      var pm = me.parentMenu;

      if (me.deepHide === true && pm) {
        if (pm.floating) {
          pm.hide(true);
        } else {
          pm.deactivateActive();
        }
      }
    },

    lookupCmp: function(cmp) {
      if (Q.isString(cmp)) {
        cmp = cmp == '-' ? new Separator() : new TextItem(cmp);
        this.applyCmpDefaults(cmp);
      } else {
        if (Q.isObject(cmp)) {
          cmp = this.getMenuItem(cmp);
        } else if (cmp.tagName || cmp.el) { // element. Wrap it.
          cmp = new BoxComponent({
            el: cmp
          });
        }
      }
      return cmp;
    },

    applyCmpDefaults: function(c) {
      if (!Q.isString(c)) {
        c = this.callParent(arguments);
        var d = this.defaults;
        if (d) {
          if (!Q.isPlainObject(c)) {
            Q.applyIf(c.initCfg, d);
            Q.extend(c, d);
          } else {
            Q.applyIf(c, d);
          }
        }
      }
      return c;
    },

    getMenuItem: function(config) {
      config.ownerCt = this;

      if (Q.isPlainObject(config)) {
        return ComponentMgr.create(config, this.defaultType);
      }

      return config;
    },

    addSeparator: function() {
      return this.add(new Separator());
    },

    addElement: function(el) {
      return this.add(new BaseItem({
        el: el
      }));
    },

    addItem: function(item) {
      return this.add(item);
    },

    addMenuItem: function(config) {
      return this.add(this.getMenuItem(config));
    },

    addText: function(text) {
      return this.add(new TextItem(text));
    },

    onDestroy: function() {
      var me = this;

      Q.get(window).off('resize', me.hide, me);

      var pm = me.parentMenu;

      if (pm && pm.activeChild == me) {
        delete pm.activeChild;
      }

      delete me.parentMenu;

      me.callParent(arguments)
      MenuMgr.unregister(me);

      var s = me.scroller;

      if (s) {
        s.topRepeater.destroy();
        s.bottomRepeater.destroy();
        s.top.remove();
        s.bottom.remove();
      }

      if (me.el) {
        me.ul.remove();
        me.focusEl.remove();
        me.el.remove();
      }

    }


  });

  return Menu;
});