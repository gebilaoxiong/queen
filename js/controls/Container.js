define([
  'controls/BoxComponent',
  'controls/ComponentMgr',
  'layout/LayoutManager'
], function(BoxComponent, ComponentMgr, LayoutManager) {

  /*容器控件*/
  var Container = Q.Class.define(BoxComponent, {

    type: 'Container',


    /*true 将会在panel被disabled时进行遮罩, false 将不会遮罩它(默认为 true )。*/
    maskDisabled: true,

    //布局绑定的事件 
    resizeEvent: 'resize',

    //延迟resize的时间
    bufferResize: 50,

    //是否始终强制布局
    forceLayout: false,

    //布局  {string/object}
    layout: undefined,

    layoutConfig: undefined,

    activeItem: undefined,

    //子组件默认配置
    defaults: undefined,

    //子组件默认的类型
    defaultType: undefined,

    //是否自动析构子控件
    autoDestroy: true,

    bubbleEvents: ['add', 'remove'],

    configuration: function(settings) {

      settings = settings || {};

      if (settings.defaults && this.defaults) { //覆盖子控件 默认设置
        this.defaults = Q.extend({}, this.defaults, settings.defaults);
        delete settings.defaults;
      };

      this.callParent(arguments);
    },

    /*初始化组件*/
    initComponent: function() {
      var items;

      this.callParent(arguments);

      items = this.items;

      if (items) {
        this.items = null;
        this.add(items);
      }
    },

    afterRender: function() {
      var me = this,
        item;

      me.callParent(arguments);

      //默认ContainerLayout
      if (!me.layout) {
        me.layout = LayoutManager.get('container');
      }

      //layout为配置对象时
      if (Q.isObject(me.layout) && !me.layout.layout) {
        me.layoutConfig = me.layout;
        me.layout = me.layoutConfig.xtype;
      }


      if (Q.isString(me.layout)) {
        me.layout = LayoutManager.get(me.layout);
      }


      if (Q.isFunction(me.layout)) {
        me.layout = new me.layout(me.layoutConfig);
      }

      me.setLayout(me.layout);

      //设置激活项
      if (me.activeItem !== undefined && me.layout.setActiveItem) {
        item = me.activeItem;
        delete me.activeItem;
        me.layout.setActiveItem(item);
      }

      //底层控件等待容器调用doLayout
      if (!me.ownerCt) {
        me.doLayout(false, true);
      }

    },

    beforeDestroy: function() {
      var me = this,
        items,
        cmp, i = 0;

      //先删除子控件 再删除布局 因为子控件是在布局中 先后顺序很重要
      if (me.items) {
        items = me.items.data.slice(0);

        while (cmp = items[i++]) {
          this.doRemove(cmp, true);
        }

        me.items.data.length = 0;
        me.items = me.items.getKey = null;
      }

      Q.destroy(me.layout);

      me.callParent(arguments);
    },
    /*
      计算布局  在添加新的子控件到已完成render的容器时或则子组件改变了大小时
      @param shallow {bool} 浅度布局
      @param force {bool} 强制执行
    */
    doLayout: function(shallow, force) {
      var rendered = this.rendered,
        forceLayout = force || this.forceLayout,
        cmps, i, len;

      //如果处于折叠状态
      //或无法布局
      if (this.collapsed || !this.canLayout()) {
        this.deferLayout = this.deferLayout || !shallow;

        if (!forceLayout) {
          return;
        }

        shallow = shallow && !this.deferLayout;
      } else {
        delete this.deferLayout;
      }

      //如果已完成绘制
      if (rendered && this.layout) {
        this.layout.layout();
      }

      if (shallow !== true && this.items) {
        cmps = this.items.data;

        for (i = 0, len = cmps.length; i < len; i++) {
          var cmp = cmps[i];

          if (cmp.doLayout) {
            cmp.doLayout(false, forceLayout);
          }

        }
      }

      if (rendered) {
        this.onLayout(shallow, forceLayout);
      }

      this.hasLayout = true;
      delete this.forceLayout;
    },

    onLayout: Q.noop,

    setLayout: function(layout) {
      if (this.layout && this.layout != layout) {
        this.layout.setHost(null);
      }

      this.layout = layout;
      this.initItems();
      layout.setHost(this);

    },

    /*判断是否能实施布局*/
    canLayout: function() {
      var el = this.getVisibilityEl();
      //如果隐藏了offsetWidth为0
      return el && el.dom && el.dom.offsetWidth > 0;
    },

    add: function(cmp) {
      var isArray = Q.isArray(cmp), //是否为数组
        isArgs = arguments.length > 1,
        ret, index; //是否不止一个参数

      if (isArgs || isArray) {
        ret = [];

        Q.each(isArgs ? arguments : cmp, function(index, item) {
          ret.push(this.add(item));
        }, this);

        return ret;
      }

      this.initItems();

      cmp = this.lookupCmp(this.applyDefaults(cmp));
      index = this.items.count();

      if (cmp && this.fire('beforeadd', this, cmp, index) !== false && this.onBeforeAdd(cmp) !== false) {
        this.items.add(cmp);
        cmp.onAdded(this, index);
        this.onAdd(cmp);
        this.fire('add', this, cmp, index);
      }

      return cmp;
    },

    onAdd: Q.noop,

    insert: function(index, cmp) {
      var args = arguments,
        length = args.length,
        result = [],
        i, c;

      this.initItems();

      if (length > 2) {
        for (i = length - 1; i >= 1; --i) {
          result.push(this.insert(index, args[i]));
        }
        return result;
      }

      c = this.lookupCmp(this.applyDefaults(cmp));
      index = Math.min(index, this.items.count());

      if (this.fire('beforeadd', this, c, index) !== false && this.onBeforeAdd(c) !== false) {
        if (c.ownerCt == this) {
          this.items.remove(c);
        }
        this.items.insert(index, c);
        c.onAdded(this, index);
        this.onAdd(c);
        this.fire('add', this, c, index);
      }

      return c;
    },

    getCmp: function(cmp) {
      if (Q.isObject(cmp)) {
        cmp = cmp.getItemId();
      }
      return this.items.get(cmp);
    },

    /*
      沿着component/container的结构树向下回溯， 在每个组件上调用指定的方法，
    */
    cascade: function(fn, scope, args) {
      var cmps, i, item;

      if (fn.apply(scope || this, args || [this]) !== false) {
        if (this.items) {
          cmps = this.items.data;
          i = 0;
          while (item = cmps[i++]) {
            if (item.cascade) {
              item.cascade(fn, scope, args);
            } else {
              fn.apply(scope || item, args || [item]);
            }
          }
        }
      }
    },

    findBy: function(fn, context) {
      var ret = [],
        me = this;

      this.cascade(function(cmp) {
        if (cmp != me && fn.call(context || me, cmp, me) === true) {
          ret.push(cmp);
        }
      }, context);
    },

    findByType: function(xtype) {
      return this.findBy(function(_, cmp) {
        return cmp.isXType(xtype);
      });
    },

    findById: function(id) {
      var ret = null,
        me = this;

      me.cascade(function(cmp) {
        if (me != cmp && cmp.id === id) {
          ret = cmp;
          return false;
        }
      });
      return ret;
    },

    onBeforeAdd: function(item) {

      if (item.ownerCt) {
        item.ownerCt.remove(item, false);
      }

      if (this.hideBorders === true) {
        item.border = (item.border === true);
      }

    },

    initItems: function() {
      var me = this;
      if (!me.items) {
        me.items = new Q.MixCollection(me.getComponentId);
        me.getLayout();
      }
    },

    getComponentId: function(cmp) {
      return cmp.getItemId();
    },

    getLayout: function() {
      var layout;
      if (!this.layout) {
        layout = LayoutManager.get('container');
        layout = new layout(this.layoutConfig);

        this.setLayout(layout);
      }
      return this.layout;
    },

    removeAll: function(autoDestroy) {
      this.initItems();

      var item, rem = [],
        items = [];

      this.items.each(function(_, i) {
        rem.push(i);
      });

      for (var i = 0, len = rem.length; i < len; ++i) {
        item = rem[i];
        this.remove(item, autoDestroy);
        if (item.ownerCt !== this) {
          items.push(item);
        }
      }

      return items;
    },

    remove: function(cmp, autoDestroy) {
      this.initItems();
      cmp = this.getCmp(cmp);
      if (cmp && this.fire('beforeremove', this, cmp) !== false) {
        this.doRemove(cmp, autoDestroy);
        this.fire('remove', this, cmp);
      }
      return cmp;
    },

    doRemove: function(cmp, autoDestroy) {
      var layout = this.layout,
        hasLayout = layout && this.rendered; //是否完成布局渲染

      if (hasLayout) {
        layout.onRemove(cmp)
      }

      this.items.remove(cmp);
      cmp.onRemoved(); //删除ownerCt断开联系
      this.onRemove(cmp);

      if (autoDestroy === true || (autoDestroy !== false && this.autoDestroy)) {
        cmp.destroy();
      }

      if (hasLayout) {
        layout.afterRemove(cmp);
      }
    },

    onRemove: Q.noop,

    //应用组件默认配置
    applyDefaults: function(config) {
      var d = this.defaults;

      if (d) {
        if (Q.isFunction(d)) {
          d = d.call(this, config);
        }
        if (Q.isString(config)) {
          config = ComponentMgr.get(config);
          Q.extend(config, d);
        } else if (Q.isPlainObject(config)) {
          Q.applyIf(config.isAction ? config.initialConfig : config, d);
        } else {
          Q.extend(config, d);
        }
      }

      return config;
    },

    lookupCmp: function(cmp) {
      if (Q.isString(cmp)) {

        return ComponentMgr.get(cmp);

      } else if (!(cmp && cmp.isXType && cmp.isXType('Component'))) {

        return this.createCmp(cmp);
      }
      return cmp;
    },

    createCmp: function(config, defaultType) {
      if (config.render) {
        return config;
      }
      var cmp = ComponentMgr.create(Q.extend({
        ownerCt: this
      }, config), defaultType || this.defaultType);

      delete cmp.ownerCt;
      return cmp;
    },

    /*重新计算在hide的时候延迟布局*/
    onShow: function() {
      this.callParent(arguments);

      if (this.deferLayout) {
        delete this.deferLayout;
        this.doLayout(true);
      }
    },

    getLayoutTarget: function() {
      return this.el;
    },

    /*确定是否需要延迟布局*/
    shouldBufferLayout: function() {
      var hasLayout = this.hasLayout;
      //如果在结构上不是顶层容器需要判断结构上是否阻塞了布局
      if (hasLayout && this.ownerCt) {
        hasLayout = !this.hasLayoutPending();
      }
      return hasLayout;
    },

    /*判定结构上是否阻塞布局*/
    hasLayoutPending: function() {
      var pending = false;

      this.ownerCt.bubble(function(cmp) {
        if (cmp.layoutPending) {
          pending = true;
          return false;
        }
      });

      return pending;
    },

    onDisable: function() {
      if (this.rendered && this.maskDisabled) {
        this.mask();
      }
      this.callParent(arguments);
    },

    // private
    onEnable: function() {
      if (this.rendered && this.maskDisabled) {
        this.unmask();
      }
      this.callParent(arguments);
    }

  });

  return Container;
});