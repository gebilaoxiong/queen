define(['layout/ContainerLayout'], function(ContainerLayout) {

  var FitLayout = Q.Class.define(ContainerLayout, {

    type: 'Fit',

    itemCls: 'x-fit-item',

    monitorResize: true,

    getLayoutElSize: function() {
      var layoutEl = this.host.getLayoutTarget(),
        ret = {};

      if (layoutEl) {
        ret.width = layoutEl.width();
        ret.height = layoutEl.height();
      }

      return ret;
    },


    onLayout: function(host, target) {
      this.callParent(arguments);
      if (!host.collapsed) {
        this.setItemSize(this.activeItem || host.items.get(0), this.getLayoutElSize());
      }
    },

    setItemSize: function(cmp, size) {
      if (cmp && size.height > 0) {
        cmp.setSize(size);
      }
    }
  });

  return FitLayout;
});