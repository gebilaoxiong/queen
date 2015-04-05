define(function() {

  /*载入遮罩层 绑定store的事件*/

  var LoadMask,

    xMasked = "x-masked",

    xMaskMsg = "x-el-mask-msg",

    xMaskedRelative = "x-masked-relative";

  LoadMask = Q.Class.define({

    msg: '努力加载中,请稍等...',

    msgCls: 'x-mask-loading',

    disabled: false,

    init: function(el, config) {
      this.el = Q.get(el);

      Q.extend(this, config);

      //绑定store状态
      if (this.store) {
        this.store.bind({
          scope: this,
          beforeload: this.onBeforeLoad,
          load: this.onLoad,
          exception: this.onLoad
        });
        this.removeMask = this.removeMask == undefined ?
          false : this.removeMask;
      }
    },

    disable: function() {
      this.disable = true;
    },

    enable: function() {
      this.disable = false;
    },

    onLoad: function() {
      this.unmask(this.removeMask);
    },

    onBeforeLoad: function() {
      if (!this.disabled) {
        this.mask(this.msg, this.msgCls);
      }
    },

    show: function() {
      this.onBeforeLoad();
    },

    hide: function() {
      this.onLoad();
    },

    mask: function(msg, msgCls) {
      var me = this,
        actionEl = me.el,
        maskEL, msgMsgEL;

      if (!/^body/i.test(actionEl.dom.tagName) && actionEl.css('position') == 'static') {
        actionEl.addClass(xMaskedRelative);
      }

      if (!(maskEL = me.maskEL)) {
        maskEL = me.maskEL = actionEl.createChild({
          'class': "x-mask"
        });
      }

      actionEl.addClass(xMasked);

      if (typeof msg == 'string') {
        if (!(msgMsgEL = this.maskMsgEL)) {
          msgMsgEL = this.maskMsgEL = actionEl.createChild({
            'class': xMaskMsg,
            children: {
              target: 'div'
            }
          });
        }
        msgMsgEL.dom.className = msgCls ? xMaskMsg + " " + msgCls : xMaskMsg;
        msgMsgEL.dom.firstChild.innerHTML = msg;
        msgMsgEL.alignTo(actionEl.dom, 'c-c');
      }

      return maskEL;
    },

    unmask: function() {
      var actionEl = this.el,
        maskEL = this.maskEL,
        maskMsgEL = this.maskMsgEL;

      if (maskEL) {
        actionEl.removeClass(xMasked + ' ' + xMaskedRelative);
      }

      if (maskEL) {

        if (maskMsgEL) {
          maskMsgEL.remove();
        }

        maskEL.remove();

        delete this.maskEL;
        delete this.maskMsgEL;
      }
    },

    destroy: function() {
      if (this.store) {
        this.store.unbind('beforeload', this.onBeforeLoad, this);
        this.store.unbind('load', this.onLoad, this);
        this.store.unbind('exception', this.onLoad, this);
      }

      this.unmask(true);
      delete this.el;
    }
  });

  return LoadMask;
});