define([
  'menu/Menu',
  'controls/DatePicker'
], function(Menu, DatePicker) {

  var DateMenu = Q.Class.define(Menu, {

    type: 'DateMenu',

    enableScrolling: false,

    hideOnClick: true,

    pickerId: null,

    cls: 'x-date-menu',

    initComponent: function() {

      this.bind('beforeshow', this.onBeforeShow, this);

      Q.extend(this, {
        plain: true,
        showSeparator: false,
        items: [this.picker = new DatePicker(Q.applyIf({
          internalRender: this.strict || !Q.Browser.ie,
          ctCls: 'x-menu-date-item',
          id: this.pickerId
        }, this.initCfg))]
      });

      this.picker.unbind();

      this.callParent(arguments);

      this.relayEvents(this.picker, ['select']);

      this.bind('show', this.picker.focus, this.picker);

      this.bind('select', this.menuHide, this);

      if (this.handler) {
        this.bind('select', this.handler, this.scope || this);
      }
    },

    menuHide: function() {
      if (this.hideOnClick) {
        this.hide(true);
      }
    },

    onBeforeShow: function() {
      if (this.picker) {
        this.picker.hideMonthPicker(true);
      }
    },

    onShow: function() {
      var el = this.picker.getEl();
      el.outerWidth(false, el.outerWidth()); //nasty hack for IE7 strict mode
    }

  });

  return DateMenu;
});