define([
  'controls/Component',
  'util/Region'
], function(Component, Region) {

  /*
		所有菜单项的基类。
		BaseItem为所有菜单组件提供基本的渲染、活动状态管理和配置选项共享的功能。 
	*/
  var BaseItem = Q.Class.define(Component, {

    type: 'BaseItem',

    /*当值为true时该选项被视觉激活 (默认值为 false) */
    canActivate: false,

    activeCls: 'x-menu-item-active',

    /*
			当值为true时，单击该选项后隐藏所包含的内部菜单 (默认值为 true) 
		*/
    hideOnClick: true,

    /*
			点击之后的隐藏一个项目的延迟毫秒数(默认值为 1 ) 
		*/
    clickHideDelay: 1,

    actionMode: 'container',

    initEvents: function() {
      if (this.handler) {
        this.bind('click', this.handler, this.scope);
      }
    },

    onRender: function(container, position) {
      this.callParent(arguments);

      if (this.ownerCt && this.ownerCt.isXType('Menu')) {
        this.parentMenu = this.ownerCt;
      } else {
        this.container.addClass('x-menu-list-item');

        this.el.on('click', this.onClick, this);
        this.el.on('mouseenter', this.activate, this);
        this.el.on('mouseout', this.deactivate, this);
      }
    },

    setHandler: function(handler, scope) {
      if (this.handler) {
        this.unbind('click', this.handler, this.scope);
      }
      this.bind('click', this.handler = handler, this.scope = scope);
    },

    onClick: function(e) {
      if (!this.disabled && this.fire("click", this, e) !== false &&
        (this.parentMenu && this.parentMenu.fire("itemclick", this, e) !== false)) {
        this.handleClick(e);
      } else {
        e.stopPropagation();
        e.preventDefault();
      }
    },

    activate: function() {
      var li;

      if (this.disabled) {
        return false;
      }

      li = this.container;
      li.addClass(this.activeCls);
      this.region = Region.getRegion(li).adjust(2, 2, -2, -2);
      this.fire('activate', this);
      return true;
    },

    deactivate: function() {
      this.container.removeClass(this.activeCls);
      this.fire("deactivate", this);
    },

    shouldDeactivate: function(e) {
      var point = {};
      point.top = point.bottom = e.pageY;
      point.left = point.right = e.pageX;

      return !this.region || !this.region.contains(point);
    },

    handleClick: function(e) {
      var parentMenu = this.parentMenu;
      if (this.hideOnClick) {
        if (parentMenu.floating) {
          this.clickHideDelayTimer = Q.delay(parentMenu.hide, parentMenu, this.clickHideDelay, true);
        } else {
          parentMenu.deactivateActive();
        }
      }
    },

    beforDestroy: function() {
      clearTimeout(this.clickHideDelayTimer);
      this.callParent(arguments);
    },


    // private. Do nothing
    expandMenu: Q.noop,

    // private. Do nothing
    hideMenu: Q.noop
  });

  return BaseItem;
})