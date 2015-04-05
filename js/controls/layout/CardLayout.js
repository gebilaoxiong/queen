define(['layout/FitLayout'], function(fitLayout) {

  var CardLayout = Q.Class.define(fitLayout, {

    type: 'Card',

    /*是否延迟绘制子控件*/
    deferredRender: false,

    /*acitiveItem发生变化的时候 是否对调用下一个activeItem的dolayout*/
    layoutOnCardChange: true,

    setActiveItem: function(item) {
      var me = this,
        activeItem = me.activeItem,
        host = me.host,
        layout;

      item = host.getCmp(item);

      //确保两个不为同一对象
      if (item && activeItem != item) {

        //隐藏上次激活项
        if (activeItem) {
          activeItem.hide();
          if (activeItem.hidden !== true) {
            return false;
          }
          activeItem.fire('deactivate', activeItem);
        }

        layout = item.doLayout && (me.layoutOnCardChange || !item.rendered);

        me.activeItem = item;

        //解除延迟布局
        delete item.deferLayout;

        item.show();

        me.layout();

        if (layout) {
          item.doLayout();
        }

        item.fire('activate', item);
      }
    },

    renderAll: function(host, target) {
      if (this.deferredRender) {
        this.renderItem(this.activeItem, undefined, target);
      } else {
        this.callParent(arguments);
      }
    }
  });

  return CardLayout;
})