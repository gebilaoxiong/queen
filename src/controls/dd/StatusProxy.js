define([
  'controls/Layer'
], function(Layer) {

  var StatusProxy = Q.Class.define({
    init: function(config) {

      Q.extend(this, config);

      this.id = this.id || Q.id();

      this.el = new Layer({
        domConfig: {
          id: this.id,
          target: "div",
          'class': "x-dd-drag-proxy " + this.dropNotAllowed,
          children: [{
            target: "div",
            'class': "x-dd-drop-icon"
          }, {
            target: "div",
            'class': "x-dd-drag-ghost"
          }]
        }
      });

      this.ghost = Q.get(this.el.dom.childNodes[1]);
      this.dropStatus = this.dropNotAllowed;
    },


    dropAllowed: "x-dd-drop-ok",

    dropNotAllowed: "x-dd-drop-nodrop",

    setStatus: function(cssClass) {
      cssClass = cssClass || this.dropNotAllowed;
      if (this.dropStatus != cssClass) {
        this.el.removeClass(this.dropStatus);
        this.el.addClass(cssClass);
        this.dropStatus = cssClass;
      }
    },

    reset: function(clearGhost) {
      this.el.dom.className = "x-dd-drag-proxy " + this.dropNotAllowed;
      this.dropStatus = this.dropNotAllowed;
      if (clearGhost) {
        this.ghost.dom.innerHTML = "";
      }
    },

    update: function(html) {
      if (typeof html == "string") {
        this.ghost.dom.innerHTML = html;
      } else {
        this.ghost.dom.innerHTML = "";
        html.style.margin = "0";
        this.ghost.dom.appendChild(html);
      }

      var el = this.ghost.dom.firstChild;

      if (el) {
        Q.fly(el).css('float', 'none');
      }
    },

    getEl: function() {
      return this.el;
    },

    getGhost: function() {
      return this.ghost;
    },

    hide: function(clear) {
      this.el.hide();
      if (clear) {
        this.reset(true);
      }
    },

    stop: Q.noop,

    show: function() {
      this.el.show();
    },

    sync: function() {
      this.el.sync();
    },

    repair: function(xy, callback, scope) {
      this.callback = callback;
      this.scope = scope;

      this.afterRepair();
    },

    afterRepair: function() {
      this.hide(true);
      if (typeof this.callback == "function") {
        this.callback.call(this.scope || this);
      }
      this.callback = null;
      this.scope = null;
    },

    destroy: function() {
      Q.destroy(this.ghost, this.el);
    }
  });

  return StatusProxy;
})