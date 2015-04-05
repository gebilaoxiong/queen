define([
  'util/Timer',
  'util/Template'
], function(Timer, Template) {
  /*
		抽象类  所有布局的基类
	*/
  var uuid = 0,

    rwihte_space = /\s+/,

    ContainerLayout = Q.Class.define(Q.Abstract, {

      type: 'Container',

      //是否监视容器的resize事件
      monitorResize: true,

      activeItem: undefined,

      layoutCls: undefined,

      //强制布局
      forceLayout: false,

      itemCls: undefined,

      //呈现后隐藏不是activeItem的项
      renderHidden: false,

      init: function(settings) {
        this.id = 'x-layout-' + uuid++;
        Q.extend(this, settings);
      },

      //布局所拥有的空间
      getLayoutTargetSize: Q.noop,

      layout: function() {
        var host = this.host,
          target = host.getLayoutTarget();

        if (!(this.hasLayout || this.layoutCls === undefined)) {
          target.addClass(this.layoutCls);
        }

        this.onLayout(host, target);

        host.fire('afterlayout', host, this);
      },

      //扩展方法
      onLayout: function(host, target) {
        this.renderAll(host, target);
      },

      /*将所有的子组件呈现到target中*/
      renderAll: function(host, target) {
        var items = host.items;

        items.each(function(index, item) {
          if (item && (!item.rendered || !this.validParent(item, target))) {
            this.renderItem(item, index, target);
          }
        }, this)
      },

      renderItem: function(cmp, position, target) {
        if (!cmp) {
          return;
        }

        if (!cmp.rendered) {

          cmp.render(target, position);
          this.configureItem(cmp);

        } else if (!this.validParent(cmp, target)) { //如果已呈现 且不是当前容器

          if (Q.isNumber(position)) {
            position = target.dom.childNodes[position];
          }
          target.dom.insertBefore(cmp.getPositionEl().dom, position);
          cmp.container = target;
          this.configureItem(cmp);

        }

      },

      //验证控件的容器是否为target
      validParent: function(cmp, target) {
        return target && target.contains(cmp.getPositionEl());
      },

      setHost: function(host) {
        var me = this,
          old;
        if (me.monitorResize && me.host != host) {
          old = me.host;
          if (old) {
            old.unbind(old.resizeEvent, me.onResize);
          }
          if (host) {
            host.bind(host.resizeEvent, me.onResize, me, {
              delay: host.resizeDelay
            });
          }
        }
        me.host = host;
      },

      onResize: function(e) {
        var host = this.host,
          delay;

        //宿主折叠时不改变
        if (host.collapsed) {
          return;
        }

        //判断是否需要延迟
        if (delay = host.bufferResize && host.shouldBufferLayout()) {

          if (!this.timer) {
            this.timer = new Timer(this.runLayout, this);
            this.resizeBuffer = Q.isNumber(delay) ? delay : 50;
          }
          //给宿主标记布局阻塞
          host.layoutPending = true;
          this.timer.delay(this.resizeBuffer);
        } else {
          this.runLayout();
        }
      },

      runLayout: function() {
        var host = this.host;

        this.layout();
        host.onLayout();
        delete host.layoutPending;
      },

      /*获取已完成渲染的控件*/
      getRenderedItems: function(host) {
        var layoutTarget = host.getLayoutTarget(),

          items = host.items.grep(function(index, item) {
            return item.rendered && this.validParent(item, layoutTarget);
          }, this).data;

        return items;
      },

      configureItem: function(cmp) {
        if (this.itemCls) {
          var t = cmp.getPositionEl ? cmp.getPositionEl() : cmp;
          t.addClass(this.itemCls);
        }

        if (cmp.doLayout && this.forceLayout) {
          cmp.doLayout();
        }

        //是否隐藏
        if (this.renderHidden && cmp != this.activeItem) {
          cmp.hide();
        }

      },

      onRemove: function(cmp) {
        var el;

        if (this.activeItem === cmp) {
          delete this.activeItem;
        }

        if (cmp.rendered && this.itemCls) {
          el = cmp.getPositionEl ? cmp.getPositionEl() : cmp;
          el.removeClass(this.itemCls);
        }
      },

      afterRemove: Q.noop,

      /*解析填充物 padding/margin*/
      parseFiller: function(value) {
        var fillerArray, len, ret;

        if (Q.isNumber(value)) {
          value = String(value);
        }

        fillerArray = value.split(rwihte_space);

        switch (fillerArray.length) {
          case 1:
            fillerArray[1] = fillerArray[2] = fillerArray[3] = fillerArray[0];
            break;
          case 2:
            fillerArray[2] = fillerArray[0];
            fillerArray[3] = fillerArray[1];
            break;
          case 3:
            fillerArray[3] = fillerArray[1];
            break;
        }

        ret = {};

        Q.each(['top', 'right', 'bottom', 'left'], function(index, align) {
          ret[align] = parseInt(fillerArray[index]) || 0;
        });

        return ret;
      },

      destroy: function() {
        var layoutEl;

        //停止计时器
        if (this.timer) {
          this.timer.destroy();
        }

        //解除绑定在数组resizeEvent上的onResize
        if (this.host) {
          this.host.unbind(this.host.resizeEvent, this.onResize);
        }

        //删除layoutEl的布局class
        if (this.layoutCls) {
          layoutEl = this.host.getLayoutTarget();

          if (layoutEl) {
            layoutEl.removeClass(this.layoutCls);
          }
        }
      }
    });

  /*表单控件模板*/
  ContainerLayout.prototype.fieldTpl = new Template([
    '<div class="x-form-item <%= itemCls %> clearfix" tabIndex="-1">',
    '<label for="<%= id %>" style="<%= labelStyle %>" class="x-form-item-label"><%= label %><%= labelSeparator %></label>',
    '<div class="x-form-element" id="x-form-el-<%= id %>" style="<%= elementStyle %>">',
    '</div>',
    '</div>'
  ]);

  return ContainerLayout;
})