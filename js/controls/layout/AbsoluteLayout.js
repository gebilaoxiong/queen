define(['layout/AnchorLayout'], function(anchorLayout) {

  var AbsoluteLayout = Q.Class.define(anchorLayout, {

    type: 'Absolute',

    itemCls: 'x-abs-layout-item',

    onLayout: function(host, target) {
      this.paddingLeft = parseInt(target.css('paddingLeft'), 10);
      this.paddingTop = parseInt(target.css('paddingTop'), 10);

      this.callParent(arguments);
    },

    adjustWidthAnchor: function(value, cmp) {
      return value ? value - cmp.getPosition()[0] + this.paddingLeft : value;
    },

    adjustHeightAnchor: function(value, cmp) {
      return value ? value - cmp.getPosition()[1] + this.paddingLeft : value;
    }
  });

  return AbsoluteLayout;
});