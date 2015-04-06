define(['controls/ToolTip'], function(ToolTip) {

  var QuickTip = Q.Class.define(ToolTip, {

    type: 'QuickTip',

    /*True将会自动使用元素的DOM title值---如果可用(默认为false)。 */
    interceptTitles: false,

    tagConfig: {
      namespace: "data-",
      attribute: "qtip",
      width: "qwidth",
      target: "target",
      title: "qtitle",
      hide: "hide",
      cls: "qclass",
      align: "qalign",
      anchor: "anchor"
    },

    initComponent: function() {
      this.target = this.target || document;
      this.targets = this.targets || {};
      this.callParent(arguments);
    },

    register: function(config) {
      var configs = Q.isArray(config) ? config : arguments,
        i, j, cfg, target, len;

      i = j = 0;

      while (cfg = configs[i++]) {
        target = cfg.target;

        if (target) {
          if (Q.isArray(target)) {
            for (len = target.length; j < len; j++) {
              this.targets[Q.id(target[j])] = cfg;
            }
          } else {
            this.targets[Q.id(target)] = cfg;
          }
        }
      }
    },

    unregister: function(el) {
      delete this.targets[Q.id(el)];
    },

    /*隐藏一个可见的tip或者取消一个特殊元素即将进行的显示操作。 */
    cancelShow: function(el) {
      var at = this.activeTarget;
      el = Q.dom.get(el);
      if (this.isVisible()) {
        if (at && at.el == el) {
          this.hide();
        }
      } else if (at && at.el == el) {
        this.clearTimer('show');
      }
    },

    getTipCfg: function(e) {
      var t = e.target,
        ttp,
        cfg;

      if (this.interceptTitles && t.title && Q.isString(t.title)) {
        ttp = t.title;
        t.qtip = ttp;
        t.removeAttribute("title");
        e.preventDefault();
      } else {
        cfg = this.tagConfig;
        ttp = t.qtip || Q.Element.attr(t, cfg.namespace + cfg.attribute);
      }
      return ttp;
    },

    onTargetOver: function(e) {
      var target;

      if (this.disabled) {
        return;
      }

      this.targetXY = {
        left: e.pageX,
        top: e.pageY
      };


      target = e.target;

      if (!target || target.nodeType !== 1 || target == document || target == document.body) {
        return;
      }

      if (this.activeTarget && (target == this.activeTarget.el || Q.Element.contains(this.activeTarget.el, target))) {
        this.clearTimer('hide');
        this.show();
        return;
      }

      if (target && this.targets[target.id]) {
        this.activeTarget = this.targets[target.id];
        this.activeTarget.el = target;
        this.anchor = this.activeTarget.anchor;
        if (this.anchor) {
          this.anchorTarget = target;
        }
        this.delayShow();
        return;
      }

      var ttp, et = Q.get(target),
        cfg = this.tagConfig,
        ns = cfg.namespace;



      if (ttp = this.getTipCfg(e)) {
        var autoHide = et.attr(ns + cfg.hide);

        this.activeTarget = {
          el: target,
          text: ttp,
          width: et.attr(ns + cfg.width),
          autoHide: autoHide != "user" && autoHide !== 'false',
          title: et.attr(ns + cfg.title),
          cls: et.attr(ns + cfg.cls),
          align: et.attr(ns + cfg.align)
        };

        this.anchor = et.attr(ns + cfg.anchor);

        if (this.anchor) {
          this.anchorTarget = target;
        }
        this.delayShow();
      }

    },

    onTargetOut: function(e) {

      // If moving within the current target, and it does not have a new tip, ignore the mouseout
      if (this.activeTarget && Q.Element.contains(this.activeTarget.el, e.relatedTarget) && !this.getTipCfg(e)) {
        return;
      }

      this.clearTimer('show');
      if (this.autoHide !== false) {
        this.delayHide();
      }
    },
    showAt: function(xy) {
      var target = this.activeTarget;
      if (target) {

        if (!this.rendered) {
          this.render(this.getBody());
          this.activeTarget = target;
        }

        if (target.width) {
          this.setWidth(target.width);
          this.body.outerWidth(true, this.adjustBodyWidth(target.width - this.getFrameWidth()));
          this.measureWidth = false;
        } else {
          this.measureWidth = true;
        }

        this.setTitle(target.title || '');
        this.body.text(target.text);
        this.autoHide = target.autoHide;
        this.dismissDelay = target.dismissDelay || this.dismissDelay;

        if (this.lastCls) {
          this.el.removeClass(this.lastCls);
          delete this.lastCls;
        }

        if (target.cls) {
          this.el.addClass(target.cls);
          this.lastCls = target.cls;
        }

        if (this.anchor) {
          this.constrainPosition = false;
        } else if (target.align) { // TODO: this doesn't seem to work consistently
          xy = this.el.getAlignToXY(target.el, target.align);
          this.constrainPosition = false;
        } else {
          this.constrainPosition = true;
        }
        this.callParent(arguments);
      }
    },

    // inherit docs
    hide: function() {
      delete this.activeTarget;
      this.callParent(arguments);
    }
  });

  return QuickTip;
});