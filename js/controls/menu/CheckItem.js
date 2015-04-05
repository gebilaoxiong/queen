define([
  'menu/MenuItem',
  'menu/MenuMgr'
], function(MenuItem, MenuMgr) {

  var CheckItem = Q.Class.define(MenuItem, {

    type: 'CheckItem',

    itemCls: "x-menu-item x-menu-check-item",
    /**
     * @cfg {String} groupClass The default CSS class to use for radio group check items (defaults to "x-menu-group-item")
     */
    groupClass: "x-menu-group-item",

    /**
     * @cfg {Boolean} checked True to initialize this checkbox as checked (defaults to false).  Note that
     * if this checkbox is part of a radio group (group = true) only the first item in the group that is
     * initialized with checked = true will be rendered as checked.
     */
    checked: false,

    initComponent: function() {
      this.callParent(arguments);

      if (this.checkHandler) {
        this.on('checkchange', this.checkHandler, this.scope || this);
      }
      MenuMgr.registerCheckable(this);
    },

    onRender: function(container) {
      this.callParent(arguments);
      if (this.group) {
        this.el.addClass(this.groupClass);
      }
      if (this.checked) {
        this.checked = false;
        this.setChecked(true, true);
      }
    },

    destroy: function() {
      MenuMgr.unregisterCheckable(this);
      this.callParent(arguments);
    },

    setChecked: function(state, suppressEvent) {
      var suppress = suppressEvent === true;
      if (this.checked != state && (suppress || this.fire("beforecheckchange", this, state) !== false)) {
        MenuMgr.onCheckChange(this, state);
        if (this.container) {
          this.container[state ? "addClass" : "removeClass"]("x-menu-item-checked");
        }
        this.checked = state;
        if (!suppress) {
          this.fire("checkchange", this, state);
        }
      }
    },

    handleClick: function(e) {
      if (!this.disabled && !(this.checked && this.group)) { // disable unselect on radio item
        this.setChecked(!this.checked);
      }
      this.callParent(arguments);
    }
  });

  return CheckItem;
});