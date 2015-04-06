define(function() {
  /*
		提供文本精确的像素长度，
		这样你可以精确地获知一个给定的文本块有多高和多宽。
	*/

  var TextMetrics = Q.Class.define({
    statics: {
      shared: null,

      measure: function(el, text, fixedWidth) {
        var me = this,
          shared = me.shared;

        if (!shared) {
          shared = me.shared = new me(el, fixedWidth);
        }

        shared.bind(el);
        shared.setFixedWidth(fixedWidth || 'auto');
        return shared.getSize(text);
      },

      destroy: function() {
        var me = this;
        me.shared.destroy();
        me.shared = null;
      },

      getTextWidth: function(el, text, min, max) {
        el = Q.dom.get(el);
        return Q.Number.constrain(this.measure(el, text || el.innerHTML).width, min || 0, max || 1000000);
      }
    },

    init: function(bindTo, fixedWidth) {
      var me = this,
        measure = this.getBody().createChild({
          target: 'div'
        });

      me.measure = measure;

      if (bindTo) {
        me.bind(bindTo);
      }

      measure.css({
        position: 'absolute'
      });

      measure.hide();

      if (fixedWidth) {
        measure.width(fixedWidth);
      }
    },

    getBody: function() {
      return Q.get(document.body || document.documentElement);
    },

    getSize: function(text) {
      var measure = this.measure,
        size;

      measure.text(text);
      size = {
        width: measure.outerWidth(true),
        height: measure.outerHeight(true)
      };
      measure.text('');
      return size;
    },

    bind: function(el) {
      var me = this;

      me.el = Q.get(el);
      me.measure.css({
        'font-size': me.el.css('font-size'),
        'font-style': me.el.css('font-style'),
        'font-weight': me.el.css('font-weight'),
        'font-family': me.el.css('font-family'),
        'line-height': me.el.css('line-height'),
        'text-transform': me.el.css('font-transform'),
        'letter-spacing': me.el.css('font-spacing')
      });
    },
    setFixedWidth: function(width) {
      this.measure.width(width);
    },
    getWidth: function(text) {
      this.measure.dom.style.width = 'auto';
      return this.getSize(text).width;
    },
    getHeight: function(text) {
      return this.getSize(text).height;
    },

    /**
     * Destroy this instance
     */
    destroy: function() {
      var me = this;
      me.measure.remove();
      delete me.el;
      delete me.measure;
    }
  });

  return TextMetrics;
})