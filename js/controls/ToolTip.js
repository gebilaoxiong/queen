define(['controls/Tip'], function(Tip) {

  /*当鼠标移过目标元素时，提供附加的信息。*/
  var ToolTip = Q.Class.define(Tip, {

    type: 'ToolTip',

    showDelay: 500,

    hideDelay: 200,

    /*tooltip显示的毫秒数*/
    dismissDelay: 5000,

    /*是否跟随鼠标移动*/
    trackMouse: false,

    /*
			anchor 这个配置只用于该组件被包含在一个已使用 AnchorLayout (或者其子类)配置的Container时。 
		*/

    /*
			如果为True则表示关联tooltip到目标元素上，
			false则表示关联tooltip到鼠标坐标处（默认为true）。 
		*/
    anchorToTarget: true,

    anchorOffset: 0,

    targetCounter: 0,

    constrainPosition: false,

    initComponent: function() {
      var me = this;
      me.callParent(arguments);

      me.lastActive = new Date();
      me.initTarget(this.target);
      me.origAnchor = me.anchor;
    },

    onRender: function(ct, position) {
      var me = this;

      me.callParent(arguments);

      me.anchorCls = 'x-tip-anchor-' + me.getAnchorPosition();
      me.anchorEl = me.el.createChild({
        'class': 'x-tip-anchor ' + me.anchorCls
      });
    },

    afterRender: function() {
      var me = this;
      me.callParent(arguments);
      me.anchorEl.css('z-index', parseInt(me.el.css('z-index')) || 0 + 1);
    },

    initTarget: function(target) {
      var t;
      if ((t = Q.get(target))) {
        if (this.target) {
          var tg = Q.get(this.target);
          tg.off('mouseover', this.onTargetOver, this);
          tg.off('mouseout', this.onTargetOut, this);
          tg.off('mousemove', this.onMouseMove, this);
        }


        t.on('mouseover', this.onTargetOver, this);
        t.on('mouseout', this.onTargetOut, this);
        t.on('mousemove', this.onMouseMove, this);

        this.target = t;
      }
      if (this.anchor) {
        this.anchorTarget = this.target;
      }
    },

    onMouseMove: function(e) {
      var t = this.delegate ?
        Q.Element.parentUntil(e.target, this.delegate) :
        this.triggerElement = true;

      if (t) {
        this.targetXY = {
          left: e.pageX,
          top: e.pageY
        };

        if (t === this.triggerElement) {
          if (!this.hidden && this.trackMouse) {
            this.setPagePosition(this.getTargetXY());
          }
        } else {
          this.hide();
          this.lastActive = new Date(0);
          this.onTargetOver(e)
        }
      } else if (!this.closable && !this.isHidden()) {
        this.hide();
      }
    },

    getTargetXY: function() {
      if (this.delegate) {
        this.anchorTarget = this.triggerElement;
      }

      if (this.anchor) {
        this.targetCounter++;

        var offsets = this.getOffsets(),
          xy = (this.anchorToTarget && !this.trackMouse) ?
          this.el.getAlignToXY(this.anchorTarget, this.getAnchorAlign()) :
          this.targetXY,
          dw = Q.Element.getViewWidth() - 5,
          dh = Q.Element.getViewHeight() - 5,
          de = document.documentElement,
          bd = document.body,
          scrollX = (de.scrollLeft || bd.scrollLeft || 0) + 5,
          scrollY = (de.scrollTop || bd.scrollTop || 0) + 5,
          axy = {
            left: xy.left + offsets.left,
            top: xy.top + offsets.top
          },
          sz = this.getSize();

        this.anchorEl.removeClass(this.anchorCls);


        if (this.targetCounter < 2) {
          if (axy.left < scrollX) {
            if (this.anchorToTarget) {
              this.defaultAlign = 'l-r';
              if (this.mouseOffset) {
                this.mouseOffset.left *= -1;
              }
            }
            this.anchor = 'left';
            return this.getTargetXY();
          }
          if (axy.left + sz.width > dw) {
            if (this.anchorToTarget) {
              this.defaultAlign = 'r-l';
              if (this.mouseOffset) {
                this.mouseOffset.left *= -1;
              }
            }
            this.anchor = 'right';
            return this.getTargetXY();
          }
          if (axy.top < scrollY) {
            if (this.anchorToTarget) {
              this.defaultAlign = 't-b';
              if (this.mouseOffset) {
                this.mouseOffset.top *= -1;
              }
            }
            this.anchor = 'top';
            return this.getTargetXY();
          }
          if (axy.top + sz.height > dh) {
            if (this.anchorToTarget) {
              this.defaultAlign = 'b-t';
              if (this.mouseOffset) {
                this.mouseOffset.top *= -1;
              }
            }
            this.anchor = 'bottom';
            return this.getTargetXY();
          }
        }

        this.anchorCls = 'x-tip-anchor-' + this.getAnchorPosition();
        this.anchorEl.addClass(this.anchorCls);
        this.targetCounter = 0;
        return axy;
      } else {
        var mouseOffset = this.getMouseOffset();
        return {
          left: this.targetXY.left + mouseOffset.left,
          top: this.targetXY.top + mouseOffset.top
        }
      }

    },

    getMouseOffset: function() {
      var offset = this.anchor ? {
        left: 0,
        top: 0
      } : {
        left: 15,
        top: 18
      };

      if (this.mouseOffset) {
        offset.left += this.mouseOffset.left;
        offset.top += this.mouseOffset.top;
      }
      return offset;
    },

    getAnchorPosition: function() {
      var m;

      if (this.anchor) {
        this.tipAnchor = this.anchor.charAt(0)
      } else {
        m = this.defaultAlign.match(/^([a-z]+)-([a-z]+)(\?)?$/);
        if (!m) {
          throw 'AnchorTip.defaultAlign is invalid';
        }
        this.tipAnchor = m[1].charAt(0);
      }

      switch (this.tipAnchor) {
        case 't':
          return 'top';
        case 'b':
          return 'bottom';
        case 'r':
          return 'right';
      }
      return 'left';
    },

    getAnchorAlign: function() {
      switch (this.anchor) {
        case 'top':
          return 'tl-bl';
        case 'left':
          return 'tl-tr';
        case 'right':
          return 'tr-tl';
        default:
          return 'bl-tl';
      }
    },

    getOffsets: function() {
      var offsets,
        ap = this.getAnchorPosition().charAt(0);
      /*关联到元素上*/
      if (this.anchorToTarget && !this.trackMouse) {
        switch (ap) {
          case 't':
            offsets = [0, 9];
            break;
          case 'b':
            offsets = [0, -13];
            break;
          case 'r':
            offsets = [-13, 0];
            break;
          default:
            offsets = [9, 0];
            break;
        }
      } else {
        switch (ap) {
          case 't':
            offsets = [-15 - this.anchorOffset, 30];
            break;
          case 'b':
            offsets = [-19 - this.anchorOffset, -13 - this.el.dom.offsetHeight];
            break;
          case 'r':
            offsets = [-15 - this.el.dom.offsetWidth, -13 - this.anchorOffset];
            break;
          default:
            offsets = [25, -13 - this.anchorOffset];
            break;
        }
      }
      var mouseOffset = this.getMouseOffset();
      offsets[0] += mouseOffset.left;
      offsets[1] += mouseOffset.top;

      return {
        left: offsets[0],
        top: offsets[1]
      };
    },

    onTargetOver: function(e) {
      var t;
      if (this.disabled || Q.Element.contains(this.target.dom, e.relatedTarget)) {
        return;
      }

      t = this.delegate ?
        Q.Element.parentUntil(e.target, this.delegate) :
        e.target;

      if (t) {
        this.triggerElement = t;
        this.clearTimer('hide');
        this.targetXY = {
          left: e.pageX,
          top: e.pageY
        };
        this.delayShow();
      }
    },

    delayShow: function() {
      if (this.hidden && !this.showTimer) {
        if (Q.Date.getElapsed(this.lastActive) < this.quickShowInterval) {
          this.show();
        } else {
          this.showTimer = Q.delay(this.show, this, this.showDelay);
        }
      } else if (!this.hidden && this.autoHide !== false) {
        this.show();
      }
    },

    onTargetOut: function(e) {
      if (this.disabled || Q.Element.contains(this.target.dom, e.target)) {
        return;
      }
      this.clearTimer('show');
      if (this.autoHide !== false) {
        this.delayHide();
      }
    },

    delayHide: function() {
      if (!this.hidden && !this.hideTimer) {
        this.hideTimer = Q.delay(this.hide, this, this.hideDelay);
      }
    },

    hide: function() {
      this.clearTimer('dismiss');
      this.lastActive = new Date();
      if (this.anchorEl) {
        this.anchorEl.hide();
      }
      this.callParent(arguments);
      delete this.triggerElement;
    },

    show: function() {
      if (this.anchor) {
        this.showAt({
          left: -1000,
          top: -1000
        });
        this.origConstrainPosition = this.constrainPosition;
        this.constrainPosition = false;
        this.anchor = this.origAnchor;
      }

      this.showAt(this.getTargetXY());

      if (this.anchor) {
        this.anchorEl.show();
        this.syncAnchor();
        this.constrainPosition = this.origConstrainPosition;
      } else {
        this.anchorEl.hide();
      }
    },

    showAt: function(xy) {
      this.lastActive = new Date();
      this.clearTimers();
      this.callParent(arguments);

      if (this.dismissDelay && this.autoHide !== false) {
        this.dismissTimer = Q.delay(this.hide, this, this.dismissDelay);
      }

      if (this.anchor && this.anchorEl.isHidden()) {
        this.syncAnchor();
        this.anchorEl.show();
      } else {
        this.anchorEl.hide();
      }
    },

    syncAnchor: function() {
      var anchorPos, targetPos, offset;
      switch (this.tipAnchor.charAt(0)) {
        case 't':
          anchorPos = 'b';
          targetPos = 'tl';
          offset = [20 + this.anchorOffset, 2];
          break;
        case 'r':
          anchorPos = 'l';
          targetPos = 'tr';
          offset = [-2, 11 + this.anchorOffset];
          break;
        case 'b':
          anchorPos = 't';
          targetPos = 'bl';
          offset = [20 + this.anchorOffset, -2];
          break;
        default:
          anchorPos = 'r';
          targetPos = 'tl';
          offset = [2, 11 + this.anchorOffset];
          break;
      }
      this.anchorEl.alignTo(this.el, anchorPos + '-' + targetPos, offset);
    },

    setPagePosition: function(xy) {
      this.callParent(arguments);
      if (this.anchor) {
        this.syncAnchor();
      }
    },

    clearTimer: function(name) {
      name = name + 'Timer';
      clearTimeout(this[name]);
      delete this[name];
    },

    // private
    clearTimers: function() {
      this.clearTimer('show');
      this.clearTimer('dismiss');
      this.clearTimer('hide');
    },

    onShow: function() {
      this.callParent(arguments)
      this.getDoc(true).on('mousedown', this.onDocMouseDown, this);
    },

    // private
    onHide: function() {
      this.callParent(arguments)
      this.getDoc(true).off('mousedown', this.onDocMouseDown, this);
    },

    // private
    onDocMouseDown: function(e) {
      if (this.autoHide !== true && !this.closable && !Q.Element.contains(this.el.dom, e.target)) {
        this.disable();

        Q.delay(this.doEnable, this, 100);
      }
    },

    doEnable: function() {
      if (!this.isDestroyed) {
        this.enable();
      }
    },

    // private
    onDisable: function() {
      this.clearTimers();
      this.hide();
    },

    adjustPosition: function(xy) {
      var x = xy.left,
        y = xy.top;

      if (this.constrainPosition) {
        var ay = this.targetXY.top,
          h = this.getSize().height;
        if (y <= ay && (y + h) >= ay) {
          y = ay - h - 5;
        }
      }
      return {
        left: x,
        top: y
      };
    },

    beforeDestroy: function() {
      this.clearTimers();
      this.anchorEl.remove();
      delete this.anchorEl;
      delete this.target;
      delete this.anchorTarget;
      delete this.triggerElement;
      this.callParent(arguments);
    },

    // private
    onDestroy: function() {
      this.getDoc(true).off('mousedown', this.onDocMouseDown, this);
      this.callParent(arguments);
    }

  });

  return ToolTip;
});