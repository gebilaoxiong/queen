define([
  'controls/Panel',
  'util/TextMetrics'
], function(Panel, TextMetrics) {

  var Tip = Q.Class.define(Panel, {

    type: 'Tip',

    minWidth: 40,

    maxWidth: 300,

    shadow: 'sides',

    defaultAlign: 'c-bl?',

    autoRender: true,

    quickShowInterval: 250,

    hidden: true,

    baseCls: 'x-tip',

    floating: {
      shim: true,
      useDisplay: true,
      constrain: false
    },

    autoHeight: true,

    closeAction: 'hide',

    configuration: function() {
      this.callParent(arguments);

      if (this.closeable && !this.title) {
        this.elements += ',header';
      }
    },

    afterRender: function() {
      this.callParent(arguments);

      if (this.closeable) {
        this.addTool({
          id: 'close',
          handler: this[this.closeAction],
          scope: this
        });
      }
    },
    showAt: function(xy) {
      var me = this;

      this.callParent('show');

      if (me.measureWidth !== false && (!me.initCfg || typeof me.initCfg.width != 'number')) {
        me.doAutoWidth();
      }

      if (me.constrainPosition) {
        xy = this.el.adjustForConstraints(xy);
      }

      this.setPagePosition(xy);
    },

    doAutoWidth: function(adjust) {
      var bw, bodyPadding, titleSpan;

      adjust = adjust || 0;
      bw = TextMetrics.getTextWidth(this.body);

      if (this.title) {
        titleSpan = Q.dom.get('span', this.header.dom);
        bw = Math.max(bw, TextMetrics.getTextWidth(titleSpan, this.title));
      }
      bodyPadding = (parseFloat(this.body.css('paddingLeft')) || 0) + (parseFloat(this.body.css('paddingLeft')) || 0);
      bw += this.getFrameWidth('left right') + (this.closeable ? 20 : 0) + bodyPadding + adjust;

      this.setWidth(Q.Number.constrain(bw, this.minWidth, this.maxWidth));
    },

    showBy: function(el, pos) {
      if (!this.rendered) {
        this.render(this.getBody());
      }

      el = Q.get(el);

      this.showAt(this.el.getAlignToXY(el, pos || this.defaultAlign));
    }
  });

  return Tip;
});