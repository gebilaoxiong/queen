define([
  'controls/Container',
  'controls/Button',
  'controls/BoxComponent',
  'layout/ToolbarLayout'
], function(Container, Button, BoxComponent, ToolbarLayout) {

  var Toolbar = Q.Class.define(Container, {

    type: 'Toolbar',

    /*是否允许按钮溢出*/
    enableOverflow: true,

    trackMenus: true,

    toolbarCls: 'x-toolbar',

    configuration: function(config) {
      if (Q.isArray(config)) { //按钮数组
        config = {
          items: config,
          layout: ToolbarLayout
        };
      } else {
        config = Q.extend({
          layout: ToolbarLayout
        }, config);

        if (config.buttons) {
          config.items = config.buttons;
        }
      }

      this.defaultType = Button;

      this.callParent(arguments);
    },

    onRender: function(container, position) {
      if (!this.el) {
        if (!this.autoCreate) {
          this.autoCreate = {
            'class': this.toolbarCls
          };
        }

        this.el = container.createChild(Q.extend({
          id: this.id
        }, this.autoCreate), position);

        this.callParent(arguments);

        this.el.addClass('clearfix');

        //容器
        if (!(this.innerBox = Q.get('.x-toolbar-inner', this.el.dom))) {

          this.innerBox = this.el.createChild({
            'class': 'x-toolbar-inner'
          });

        }
      }
    },

    afterRender: function() {
      this.callParent(arguments);

      if (this.buttonAlign == 'center') {
        this.el.addClass('x-toolbar-align-center')
      }
    },

    getLayoutTarget: function() {
      return this.innerBox;
    },

    lookupCmp: function(cmp) {
      if (Q.isString(cmp)) {

        if (cmp == '-') {
          cmp = new Toolbar.Separator();
        } else if (cmp == ' ') {
          cmp = new Toolbar.Spacer();
        } else if (cmp == '->') {
          cmp = new Toolbar.Fill();
        } else {
          cmp = new Toolbar.TextItem(cmp);
        }

        this.applyDefaults(cmp);
      } else {
        if (cmp.isFormField || cmp.render) { //表单控件
          cmp = this.createCmp(cmp);
        } else if (cmp.target) { // DomHelper spec
          cmp = new Toolbar.Item({
            autoEl: cmp
          });
        }
        /*else if (cmp.dom || cmp.nodeType) { // element
					cmp = new Toolbar.Item({
						el: cmp
					});
				} */
        else if (Q.isObject(cmp)) { // must be button config?
          cmp = cmp.xtype ? this.createCmp(cmp) : this.constructButton(cmp);
          if (cmp.isXType('Button')) {
            cmp = this.applyButton(cmp);
          }
        }
      }
      return cmp;
    },

    applyButton: function(cmp) {
      if (this.buttonSettings) {
        Q.extend(cmp, this.buttonSettings)
      }

      return cmp
    },

    applyDefaults: function(cmp) {
      if (!Q.isString(cmp)) {
        cmp = this.callParent(arguments);

        var d = this.internalDefaults;

        if (cmp && cmp.isXType && cmp.isXType('Component')) {
          Q.applyIf(cmp.initCfg, d);
          Q.extend(cmp, d);
        } else {
          Q.applyIf(cmp, d);
        }
      }
      return cmp;
    },

    addSeparator: function() {
      return this.add(new Toolbar.Separator());
    },

    addFill: function() {
      this.add(new Toolbar.Fill());
    },

    addElement: function(el) {
      return this.addItem(new Toolbar.Item({
        el: el
      }));
    },

    addItem: function(item) {
      return this.add.apply(this, arguments);
    },

    addButton: function(config) {
      if (Q.isArray(config)) {
        var buttons = [];
        for (var i = 0, len = config.length; i < len; i++) {
          buttons.push(this.addButton(config[i]));
        }
        return buttons;
      }
      return this.add(this.constructButton(config));
    },

    addText: function(text) {
      return this.addItem(new Toolbar.TextItem(text));
    },

    addField: function(field) {
      return this.add(field);
    },

    insertButton: function(index, item) {
      if (Q.isArray(item)) {
        var buttons = [];
        for (var i = 0, len = item.length; i < len; i++) {
          buttons.push(this.insertButton(index + i, item[i]));
        }
        return buttons;
      }
      return this.callParent('insert', [index, item]);
    },

    trackMenu: function(item, remove) {
      if (this.trackMenus && item.menu) {
        var method = remove ? 'unbind' : 'bind';
        item[method]('menutriggerover', this.onButtonTriggerOver, this);
        item[method]('menushow', this.onButtonMenuShow, this);
        item[method]('menuhide', this.onButtonMenuHide, this);
      }
    },

    constructButton: function(item) {
      return item.isXType && item.isXType('Button') ?
        item :
        this.createCmp(item, item.split ? SplitButton : this.defaultType);
    },

    onAdd: function(cmp) {
      this.callParent(arguments);

      this.trackMenu(cmp);

      if (this.disabled) {
        cmp.disable();
      }
    },

    // private
    onRemove: function(cmp) {
      this.callParent(arguments);
      if (cmp == this.activeMenuBtn) {
        delete this.activeMenuBtn;
      }
      this.trackMenu(cmp, true);
    },

    onDisable: function() {
      this.items.each(function(_, item) {
        if (item.disable) {
          item.disable();
        }
      });
    },

    // private
    onEnable: function() {
      this.items.each(function(_, item) {
        if (item.enable) {
          item.enable();
        }
      });
    },

    onButtonTriggerOver: function(e, btn) {
      if (this.activeMenuBtn && this.activeMenuBtn != btn) {
        this.activeMenuBtn.hideMenu();
        btn.showMenu();
        this.activeMenuBtn = btn;
      }
    },

    // private
    onButtonMenuShow: function(e, btn) {
      this.activeMenuBtn = btn;
    },

    // private
    onButtonMenuHide: function(e, btn) {
      delete this.activeMenuBtn;
    }
  });

  Toolbar.Button = Button;

  Toolbar.Item = Q.Class.define(BoxComponent, {
    enable: Q.noop,
    disable: Q.noop,
    focus: Q.noop,
    setSize: Q.noop
  });

  /*分隔符*/
  Toolbar.Separator = Q.Class.define(Toolbar.Item, {

    type: 'Separator',

    onRender: function(container, position) {
      this.el = container.createChild({
        target: 'span',
        'class': 'x-separator',
        content: '&nbsp;'
      });

      if (position) {
        this.el.insertBefore(position);
      }
    }
  });

  /*空白*/
  Toolbar.Spacer = Q.Class.define(Toolbar.Item, {

    type: 'Spacer',

    onRender: function(ct, position) {
      this.el = ct.createChild({
        'class': 'xtb-spacer'
      }, position);

      this.callParent(arguments);
    }
  });

  /*右边停靠容器*/
  Toolbar.Fill = Q.Class.define(Toolbar.Item, {
    type: 'Fill',

    isFill: true,

    onRender: Q.noop
  });

  Toolbar.TextItem = Q.Class.define(Toolbar.Item, {
    type: 'TextItem',

    configuration: function(config) {

      if (Q.isString(config)) {

        config = {
          text: config
        };

      }

      this.callParent(arguments);
    },

    // private
    onRender: function(ct, position) {
      this.autoEl = {
        'class': 'xtb-text',
        content: this.text || ''
      };
      this.callParent(arguments);
    },

    /**
     * Updates this item's text, setting the text to be used as innerHTML.
     * @param {String} t The text to display (html accepted).
     */
    setText: function(t) {
      if (this.rendered) {
        this.el.text(t);
      } else {
        this.text = t;
      }
    }
  });

  return Toolbar;
});