define(['layout/ContainerLayout'], function(containerLayout) {

  var AutoLayout = Q.Class.define(containerLayout, {

    type: 'Auto',

    onLayout: function(host, target) {
      this.callParent(arguments);

      Q.each(this.getRenderedItems(host), function() {
        if (this.doLayout) {
          //暂时不调用子控件的布局
          this.doLayout(true);
        }
      });
    }

  });

  return AutoLayout;
})