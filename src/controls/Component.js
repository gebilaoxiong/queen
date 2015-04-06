define([
  'controls/ComponentMgr',
  'util/Observable',
  'util/Timer',
  'state/Manager'
], function(ComponentMgr, Observable, Timer, StateManager) {
  /*
		所有控件基类  
	*/

  var xMasked = "x-masked",

    xMaskedRelative = "x-masked-relative",

    xMaskMsg = "x-mask-msg",

    Component;

  Component = Q.Class.define(Observable, {

    type: 'Component',

    /*cls: 'x-cmp',*/

    autoEl: undefined, //控件标签

    autoCreate: undefined, //默认控件结构

    rendered: false, //渲染是否完成

    isDestroyed: false, //是否完成析构

    destroying: false, //是否正在执行析构

    disabled: false,

    fieldLabel: undefined,

    disabledCls: 'x-cmp-disabled',

    actionMode: 'el',

    hideMode: 'display',

    allowDomMove: true, //允许插入到其他容器中

    bubbleEvents: [],

    maskCls: undefined,

    /*初始化*/
    init: function() {

      var i, len;

      //添加实例属性
      this.configuration.apply(this, arguments);

      this.callParent(arguments);

      this.getId();

      //初始化子组件
      this.initComponent();

      /*初始化插件*/
      if (this.plugins) {
        if (Q.isArray(this.plugins)) {
          for (i = 0, len = this.plugins.length; i < len; i++) {
            this.plugins[i] = this.initPlugin(this.plugins[i]);
          }
        } else {
          this.plugins = this.initPlugin(this.plugins);
        }
      }

      //注册控件
      ComponentMgr.register(this);

      if (this.stateful !== false) {
        this.initState();
      }

      //如果settings包含applyTo||renderTo 就开始渲染
      if (this.applyTo) {
        this.applyToMarkup(this.applyTo);
      } else if (this.renderTo) {
        this.render(this.renderTo);
      }

    },

    initPlugin: function(plugin) {

      if (plugin.xtype && !Q.isFunction(plugin.init)) { //配置对象

        plugin = ComponentMgr.createPlugin(plugin);

      }

      plugin.init(this);

      return plugin;
    },

    /*配置对象属性*/
    configuration: function(settings) {
      this.initCfg = settings || {};
      Q.extend(this, this.applyDefault(settings));
    },

    applyDefault: function(settings) {
      if (this.defaultCfg) {
        return Q.extend({}, this.defaultCfg, settings);
      }

      return settings;
    },

    /*初始化子组件*/
    initComponent: Q.noop,

    /*将组件应用到DOM */
    applyToMarkup: function(target, position) {
      this.allowDomMove = false;
      this.el = Q.get(target);
      this.render(this.el.dom.parentNode, position);
    },

    /*
				渲染组件
				
			*/
    render: function(container, position) {
      var contentTarget, contentEl;

      //组件已经渲染过 或beforerender事件返回 false 取消渲染
      if (this.rendered || this.fire('beforerender', this) === false) {
        return this;
      }

      //当调用了applyTo时更改容器
      if (!container && this.el) {
        this.el = Q.get(this.el);
        container = this.el.dom.parentNode;
        this.allowDomMove = false;
      }

      this.container = Q.get(container);

      this.rendered = true;

      //设置控件DOM在container中的位置
      if (position != undefined) {
        if (Q.isNumber(position)) {
          position = this.container.dom.childNodes[position];
        } else {
          position = Q.dom.get(position);
        }
      }

      //绘制控件结构
      this.onRender(this.container, position);

      this.fire('render', this);

      /*从现有HTML结构中生成控件*/
      contentTarget = this.getContentTarget();

      if (this.html) {
        contentTarget.empty().dom.innerHTML = this.html;
        delete this.html;
      }

      if (this.contentEl) {
        contentEl = Q.dom.get(this.contentEl);
        contentTarget.append(contentEl);
      }

      this.afterRender(this.container);


      //是否隐藏控件
      if (this.hidden) {
        this.doHide();
      }

      //禁用
      if (this.disabled) {
        this.disable(true);
      }

      //是否启用持久化状态
      if (this.stateful !== false) {
        this.initStateEvents();
      }

      this.fire('afterrender', this);
    },

    /*绘制控件HTML结构 并添加到dom*/
    onRender: function(ct, position) {
      var div;

      if (!this.el && this.autoEl) {

        if (Q.isString(this.autoEl)) {
          this.el = document.createElement(this.autoEl);
        } else {
          div = document.createElement('div');
          this.el = Q.Element.overwrite(div, this.autoEl);
        }

        if (!this.el.id) {
          this.el.id = this.getId();
        }
      }

      if (this.el) {
        this.el = Q.get(this.el);
        if (this.allowDomMove !== false) {
          (ct.dom || ct).insertBefore(this.el.dom, position || null);
        }
      }

      if (this.cls) { //注册class
        this.el.addClass(this.cls);
      }

      if (this.style) { //修改样式
        this.el.css(this.style);
      }
    },

    /*注册 dom事件*/
    initEvents: Q.noop,

    afterRender: function() {
      //注册DOM事件
      this.initEvents();
    },

    /*析构函数*/
    destroy: function() {
      var me = this;

      //如果已完成析构 或 'beforedestroy'阻止析构
      if (me.isDestroyed || me.fire('beforedestroy', me) === false) {
        return;
      }

      me.destroying = true;
      me.beforeDestroy();

      if (me.maskEL) {
        me.maskEL.remove();
      }

      //从容器组件中注销
      if (me.ownerCt && me.ownerCt.remove) {
        me.ownerCt.remove(me, false);
      }

      if (me.rendered) {
        me.el.remove();
        delete me.el;

        if (this.actionMode == 'container' || this.removeMode == 'container') {
          this.container.remove();
        }
      }

      if (me.focusTimer && me.focusTimer.destroy) {
        me.focusTimer.destroy();
      }

      me.onDestroy();
      me.unbind();

      //反注册控件
      ComponentMgr.unregister(me);

      me.destroying = false;
      me.isDestroyed = true;

    },

    beforeDestroy: Q.noop,

    onDestroy: Q.noop,

    /*获取控件ID*/
    getId: function() {
      return this.id || (this.id = Q.id(this.el));
    },

    // private
    getActionEl: function() {
      return this[this.actionMode];
    },

    setDisabled: function(disabled) {
      return this[disabled ? 'disable' : 'enable']();
    },

    /*
				@param (bool) silent 是否触发事件
			*/
    disable: function(silent) {

      if (this.rendered) {
        this.onDisable();
      }

      this.disabled = true;

      if (silent !== true) {
        this.fire('disable', this)
      }

      return this;
    },

    onDisable: function() {
      this.getActionEl().addClass(this.disabledCls);
      this.el.dom.disabled = true;
    },

    enable: function() {

      if (this.rendered) {
        this.onEnable();
      }

      this.disabled = false;

      this.fire('enable', this)

      return this;
    },

    isVisible: function() {
      return this.rendered && !this.getVisibilityEl().isHidden();
    },

    onEnable: function() {
      this.getActionEl().removeClass(this.disabledCls);
      this.el.dom.disabled = false;
    },

    // private 获取控制显示的元素
    getVisibilityEl: function() {
      return this.hideParent ? this.container : this.getActionEl();
    },

    getContentTarget: function() {
      return this.el;
    },

    focus: function(selectText, delay) {
      if (delay) {
        this.focusTimer = new Timer(this.focus, this, [selectText, false]);
        this.focusTimer.delay(Q.isNumber(delay) ? delay : 10);
        return this;
      }
      if (this.rendered && !this.isDestroyed) {
        this.el.dom.focus();
        if (selectText === true) {
          this.el.dom.select();
        }
      }
      return this;
    },

    blur: function() {
      if (this.rendered) {
        this.el.blur();
      }
      return this;
    },

    hide: function() {
      if (this.fire('beforehide', this) !== false) {
        this.doHide();
        this.fire('hide', this);
      }
      return this;
    },

    doHide: function() {
      this.hidden = true;
      if (this.rendered) {
        this.onHide();
      }
    },

    onHide: function() {
      var el;

      if (el = this.getVisibilityEl()) {
        el.hide();
      }
    },

    show: function() {

      if (this.fire('beforeshow', this) !== false) {
        this.hidden = false;
        if (this.autoRender) {
          this.render(Q.isBool(this.autoRender) ? this.getBody() : this.autoRender);
        }
        if (this.rendered) {
          this.onShow();
        }
        this.fire('show', this);
      }
      return this;
    },

    // private
    onShow: function() {
      var el;

      if (el = this.getVisibilityEl()) {
        el.show();
      }
    },

    // private  获取创建EL的配置
    getAutoCreate: function() {
      var cfg = Q.extend({}, this.autoCreate);

      if (this.id && !cfg.id) {
        cfg.id = this.id;
      }

      return cfg;
    },

    /*被添加进容器时调用*/
    onAdded: function(container, index) {
      this.ownerCt = container;
      this.fire('added', this, container, index);
    },

    /*被容器删除时调用*/
    onRemoved: function() {
      this.fire('removed', this, this.ownerCt);
      delete this.ownerCt;
    },

    /*获取布局元素*/
    getPositionEl: function() {
      return this.positionEl || this.el;
    },

    /*冒泡结构上的控件 让他们执行fn*/
    bubble: function(fn, scope, args) {
      var cur = this;
      do {
        if (fn.apply(scope || cur, args || [cur]) === false) {
          break;
        }
      }
      while (cur = cur.ownerCt)

      return this;
    },
    findParentBy: function(fn) {
      for (var p = this.ownerCt; p != undefined && !fn(p, this); p = p.ownerCt);
      return p || null;
    },
    findParentByType: function(xtype, shallow) {
      return this.findParentBy(function(cmp) {
        return cmp.isXType(xtype, shallow);
      });
    },
    isCmp: function(obj) {
      return obj instanceof Component;
    },
    addClass: function(cls) {
      if (this.el) {
        this.el.addClass(cls);
      } else {
        this.cls = this.cls ? this.cls + ' ' + cls : cls;
      }
    },

    getEl: function() {
      return this.el;
    },

    getBody: function(returnEl) {
      var doc = (this.el && this.el.dom.ownerDocument) || document,
        b = doc.body || doc.documentElement;

      return returnEl ? Q.get(b) : b;
    },

    getDoc: function(returnEl) {
      var node = this.el.dom.ownerDocument || document;
      return returnEl ? Q.get(node) : node;
    },

    getItemId: function() {
      return this.itemId || this.getId();
    },

    mask: function(msg, cls) {
      var me = this,
        maskCls,
        actionEl = me.getActionEl() || me.el,
        maskEL;

      if (!/^body/i.test(actionEl.dom.tagName) && actionEl.css('position') == 'static') {
        actionEl.addClass(xMaskedRelative);
      }

      if (!(maskEL = me.maskEL)) {
        maskCls = ["x-mask"];

        //添加控件自定义遮罩className
        if (me.maskCls) {
          maskCls.push(me.maskCls);
        }

        //如果存在临时遮罩
        if (cls) {
          maskCls.push(cls);
        }

        maskEL = me.maskEL = actionEl.createChild({
          'class': maskCls.join(' ')
        });
      }

      actionEl.addClass(xMasked);
      return maskEL;
    },

    unmask: function() {
      var actionEl = this.getActionEl() || this.el,
        maskEL = this.maskEL;

      if (maskEL) {
        maskEL.remove();
        actionEl.removeClass(xMasked + ' ' + xMaskedRelative);
      }

      delete this.maskEL;
    },

    /*------------------------------状态管理------------------------------------*/
    /*初始化 从状态中恢复*/
    initState: function() {
      var id, state;
      if (StateManager) {
        id = this.getStateId();
        if (id) {
          state = StateManager.get(id);
          if (state) {
            if (this.fire('beforestaterestore', this, state) !== false) {
              this.applyState(Q.extend({}, state));
              this.fire('staterestore', this, state);
            }
          }
        }
      }
    },

    getStateId: function() {
      return this.stateId || this.id;
    },

    initStateEvents: function() {
      if (this.stateEvents) {
        var i = 0,
          stateEvent;

        while (stateEvent = this.stateEvents[i++]) {
          this.bind(stateEvent, this.saveState, this, {
            delay: 100
          });
        }
      }
    },

    applyState: function(state) {
      if (state) {
        Q.extend(this, state);
      }
    },

    // private
    getState: function() {
      return null;
    },

    saveState: function() {
      var me = this,
        id, state;

      if (StateManager && me.stateful !== false) {
        id = me.getStateId();
        if (id) {
          state = me.getState();
          if (me.fire('beforestatesave', this, state) !== false) {
            StateManager.set(id, state);
            me.fire('statesave', this, state);
          }
        }
      }
    }

  });

  return Component;
})