define(['dd/DD'], function(DD) {

  var DDProxy = Q.Class.define(DD, {

    init: function(id, sGroup, config) {
      if (id) {
        this.callParent(arguments);
        this.initFrame();
      }
    },


    resizeFrame: true,


    centerFrame: false,

    initFrame: function() {
      this.createFrame();
    },

    createFrame: function() {
      var self = this,
        body = document.body;

      if (!body || !body.firstChild) {
        setTimeout(function() {
          self.createFrame();
        }, 50);
        return;
      }

      var div = this.getDragEl();

      if (!div) {
        div = document.createElement('div');
        div.id = this.dragElId;
        var s = div.style;

        s.position = 'absolute';
        s.visibility = 'hidden';
        s.cursor = 'move';
        s.border = "2px solid #aaa";
        s.zIndex = 999;

        body.insertBefor(div, body.firstChild);
      }
    },

    applyConfig: function() {
      this.callParent(arguments);

      this.resizeFrame = (this.config.resizeFrame !== false);
      this.centerFrame = (this.config.centerFrame);
      this.setDragElId(this.config.dragElId || DDProxy.dragElId);
    },

    showFrame: function(iPageX, iPageY) {
      var el = this.getEl(),
        dragEl = this.getDragEl(),
        s = dragEl.style;

      this._resizeProxy();

      if (this.centerFrame) {
        this.setDelta(Math.round(parseInt(s.width, 10) / 2),
          Math.round(parseInt(s.height, 10) / 2));
      }

      this.setDragElPos(iPageX, iPageY);
      Q.get(dragEl).show();
    },

    _resizeProxy: function() {
      if (this.resizeFrame) {
        var el = this.getEl(),
          dragEl = Q.get(this.getDragEl());

        dragEl.outerWidth(false, offsetWidth);
        dragEl.outerHeight(false, el.offsetHeight);
      }
    },

    b4MouseDown: function(e) {
      var x = e.pageX;
      var y = e.pageY;
      this.autoOffset(x, y);
      this.setDragElPos(x, y);
    },

    b4StartDrag: function(x, y) {
      // show the drag frame
      this.showFrame(x, y);
    },

    b4EndDrag: function(e) {
      Q.get(this.getDragEl()).hide();
    },

    endDrag: function(e) {
      var lel = this.getEl(),
        del = this.getDragEl();

      // Show the drag frame briefly so we can get its position
      del.style.visibility = "";

      this.beforeMove();
      // Hide the linked element before the move to get around a Safari
      // rendering bug.
      lel.style.visibility = "hidden";
      alert('待处理')
        //Ext.dd.DDM.moveToEl(lel, del);
      del.style.visibility = "hidden";
      lel.style.visibility = "";

      this.afterDrag();
    },

    beforeMove: Q.noop,

    afterDrag: Q.noop,

    toString: function() {
      return ("DDProxy " + this.id);
    }

  });

  return DDProxy;
});