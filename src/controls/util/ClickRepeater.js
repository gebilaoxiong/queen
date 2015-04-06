define(['util/Observable'], function(Observable) {

  var ClickRepeater = Q.Class.define(Observable, {

    /*触发"click"事件的时间间隔*/
    interval: 20,

    /*在重复事件触发之前延迟的时间。 类似于一个自动重复的按键延时*/
    delay: 250,

    /*True将会阻止默认的点击事件 */
    preventDefault: true,

    /*True将会停止默认的点击事件和事件冒泡 */
    stopDefault: false,

    /*
		accelerate {bool}  自动重复是否需要缓慢启动然后加速。
		*/

    timer: 0,

    init: function(el, config) {
      this.el = Q.get(el);
      this.el.addClass('unselect');

      Q.extend(this, config);

      if (!this.disabled) {
        this.disabled = true;
        this.enable();
      }

      if (this.handler) {
        this.bind('click', this.handler, this.scope || this);
      }

      if (this.listeners) {
        this.bind(this.listeners);
        delete this.listeners;
      }
    },

    enable: function() {
      if (this.disabled) {
        this.el.on('mousedown', this.handleMouseDown, this);
        if (Q.Browser.ie) { //IE绑定双击事件
          this.el.on('dblclick', this.handleDblClick, this);
        }

        //阻止默认点击事件
        if (this.preventDefault || this.stopDefault) {
          this.el.on('click', this.eventOptions, this);
        }
      }
    },

    disable: function(force) {
      if (force || !this.disabled) {
        clearTimeout(this.timer);
        if (this.pressCls) { //删除压下的 cls
          this.el.removeCls(this.pressCls);
        }

        Q.get(document).off('mouseup', this.handleMouseUp);
        this.el.off();
      }
      this.disabled = true;
    },

    setDisabled: function(disabled) {
      this[disabled ? 'disable' : 'enable']();
    },

    eventOptions: function(e) {
      if (this.preventDefault) {
        e.preventDefault();
      }

      if (this.stopDefault) {
        e.stopPropagation();
        e.preventDefault();
      }
    },

    handleMouseDown: function(e) {
      clearTimeout(this.timer);
      this.el.dom.blur();
      if (this.pressCls) {
        this.el.addClass(this.pressCls);
      }

      this.mousedownTime = new Date();

      Q.get(document).on("mouseup", this.handleMouseUp, this);
      this.el.on('mouseout', this.handleMouseOut, this);

      this.fire('mousedown', this, e);

      //先触发一次click在mouseup前由timer执行
      this.fire('click', this, e);

      // Do not honor delay or interval if acceleration wanted.
      if (this.accelerate) {
        this.delay = 400;
      }

      this.timer = Q.delay(this.click, this, this.delay || this.interval, e);
    },

    click: function(e) {
      this.fire('click', this, e);
      this.timer = Q.delay(this.click, this, this.accelerate ?
        this.easeOutExpo(Q.Date.getElapsed(this.mousedownTime),
          400, -390, 12000) :
        this.interval,
        e);
    },

    easeOutExpo: function(t, b, c, d) {
      return (t == d) ? b + c : c * (-Math.pow(2, -10 * t / d) + 1) + b;
    },

    handleMouseOut: function() {
      clearTimeout(this.timer);
      if (this.pressCls) {
        this.el.removeClass(this.pressCls);
      }
      this.el.on("mouseover", this.handleMouseReturn, this);
    },

    handleMouseReturn: function() {
      this.el.un("mouseover", this.handleMouseReturn, this);
      if (this.pressCls) {
        this.el.addClass(this.pressCls);
      }
      this.click();
    },

    handleDblClick: function(e) {
      clearTimeout(this.timer);
      this.el.dom.blur();

      this.fire("mousedown", this, e);
      this.fire("click", this, e);
    },
    // private
    destroy: function() {
      this.disable(true);
      this.el.remove();
      this.unbind();
    },

    handleMouseUp: function(e) {
      clearTimeout(this.timer);
      this.el.off("mouseover", this.handleMouseReturn);
      this.el.off("mouseout", this.handleMouseOut);
      Q.get(document).off("mouseup", this.handleMouseUp);
      this.el.removeClass(this.pressCls);
      this.fire("mouseup", this, e);
    }
  });

  return ClickRepeater;
})