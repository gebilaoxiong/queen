define(['layout/ContainerLayout'], function(containerLayout) {

  var ColumnLayout = Q.Class.define(containerLayout, {
    monitorResize: true,

    type: 'Column',

    itemCls: 'x-column',

    scrollOffset: 0,

    layoutCls: 'x-column-layout-ct',

    validParent: function(cmp, target) {
      return this.innerCt && this.innerCt.contains(cmp.getPositionEl());
    },

    getLayoutTargetSize: function() {
      var target = this.host.getLayoutTarget(),
        ret;

      if (target) {
        ret = {
          width: target.width(),
          height: target.height()
        }
      }

      return ret;
    },

    renderAll: function(host, target) {
      if (!this.innerCt) {
        this.innerCt = target.createChild({
          'class': 'x-column-inner clearfix'
        });
      }

      target = this.innerCt;

      this.callParent(arguments);
    },

    onLayout: function(host, target) {
      var items = host.items,
        size = this.getLayoutTargetSize(),
        width, height, pWidth;

      this.renderAll(host, target);


      if (size.width < 1 && size.height < 1) { //dispaly:none
        return;
      }

      width = size.width - this.scrollOffset; //减去预留滚动条宽度
      height = size.height;
      pWidth = width; //现在的宽度（除去固定宽度的列）

      this.innerCt.outerWidth(true, width);

      items.each(function() {
        if (!this.columnWidth) {
          pWidth -= this.getLayoutTarget().outerWidth();
        }
      });

      pWidth = pWidth < 0 ? 0 : pWidth;


      items.each(function() {

        if (this.columnWidth) {
          this.setSize(Math.floor(this.columnWidth * pWidth));
        }

      });
    }
  });

  return ColumnLayout;
})