define([
  'controls/Panel',
  'layout/FormLayout',
  'form/BasicForm'
], function(Panel, FormLayout, BasicForm) {

  /*
    一个空壳 在add Remove的时候 
    负责将添加的字段控件（Field）或 
    包含有字段控件的容器 将其字段控件取出

    放入BasicForm中 供集中提交

    附 苏轼 六观堂老人草书诗

    物生有象象乃滋，梦幻无根成斯须。
    方其梦时了非无，泡影一失俯仰殊。
    清露未晞电已徂，此灭灭尽乃真吾。
    云如死灰实不枯，逢场作戏三昧俱。
    化身为医忘其躯，草书非学聊自娱。
    落笔已唤周越奴，苍鼠奋髯饮松腴。
    剡藤玉版开雪肤，游龙天飞万人呼，莫作羞涩羊氏姝。


  */
  var FormPanel = Q.Class.define(Panel, {

    type: 'FormPanel',


    minButtonWidth: 75,


    labelAlign: 'left',

    /*
      如果为 true, form监控自己的 客户端 校验状态，
      并通过传递该状态持续触发 客户端校验检测事件。 
    */
    monitorValid: false,

    /*
      检测校验状态的间隔毫秒数， 
      如果monitorValid项不为true，忽略此项(默认值为 200) 
    */
    monitorPoll: 200,

    initComponent: function() {
      var me = this;

      me.form = me.createForm();

      me.callParent(arguments);

      me.bodyCfg = {
        target: 'form',
        'class': me.baseCls + '-body',
        method: me.method || 'POST',
        id: me.formId || Q.id()
      };

      if (me.fileUpload) {
        me.bodyCfg.enctype = 'multipart/form-data';
      }

      me.initItems();

      //转播baseForm的事件
      me.relayEvents(me.form, ['beforeaction', 'actionfailed', 'actioncomplete'])
    },

    createForm: function() {
      var config = Q.extend({
        listeners: {}
      }, this.initCfg);

      return new BasicForm(null, config);
    },

    /*初始化字段 将字段控件添加到BasicForm中*/
    initFields: function() {
      var form = this.form,
        formPanel = this,
        fn = function(_, cmp) {
          if (formPanel.isField(cmp)) {

            form.add(cmp);

          } else if (cmp.findBy && cmp != formPanel) { //如果为容器
            formPanel.applySettings(cmp);

            //check/radio groups.
            if (cmp.items && cmp.items.each) {
              cmp.items.each(fn, this);
            }
          }
        };

      this.items.each(fn, this);
    },

    applySettings: function(cmp) {
      var ct = cmp.ownerCt;

      Q.extend(cmp, {
        labelAlign: ct.labelAlign,
        labelWidth: ct.labelWidth,
        itemCls: ct.itemCls
      });
    },

    getLayoutTarget: function() {
      return this.form.el;
    },

    /*获取BasicForm*/
    getForm: function() {
      return this.form;
    },

    onRender: function(container, position) {
      this.initFields();
      this.callParent(arguments);

      this.form.initEl(this.body);
    },

    beforeDestroy: function() {
      /*
      this.stopMonitoring();
      */
      this.form.destroy(true);
      this.callParent(arguments);
    },

    /*
      一个组件只要能赋值  获取值  标记错误 清除错误 就是field
    */
    isField: function(cmp) {
      return !!cmp.setValue && !!cmp.getValue && !!cmp.markInvalid && !!cmp.clearInvalid;
    },


    afterRender: function() {
      if (!this.layout) {
        this.layout = FormLayout;
      }

      this.callParent(arguments);
    },

    initEvents: function() {
      this.callParent(arguments);

      // 监听冒泡的添加/删除子控件事件
      this.bind({
        scope: this,
        add: this.onAddEvent,
        remove: this.onRemoveEvent
      });

      /*
      if (this.monitorValid) { // initialize after render
        this.startMonitoring();
      }
      */
    },

    /*将子控件添加的field装入 basicForm中*/
    onAddEvent: function(e, ct, c) {
      if (ct !== this) { //如果为子控件添加的
        this.processAdd(c);
      }
    },

    onAdd: function(cmp) {
      this.callParent(arguments);
      this.processAdd(cmp);
    },

    grepCmpField: function(_, item) {
      return this.isField(item);
    },

    processAdd: function(cmp) {
      var me = this,
        cmpFields;

      if (me.isField(cmp)) {

        me.form.add(cmp);

      } else if (cmp.findBy) { //容器

        me.applySettings(cmp);

        me.form.add.apply(me.form, cmp.findBy(me.grepCmpField, me)||[]);

      }
    },

    onRemove: function(cmp) {
      this.callParent(arguments);
      this.processRemove(cmp);
    },

    onRemoveEvent: function(e, ct, cmp) {
      if (ct !== this) {
        this.processRemove(cmp);
      }
    },

    processRemove: function(cmp) {
      if (!this.destroying) {

        if (this.isField(cmp)) {

          this.form.remove(cmp);

        } else if (cmp.findBy) {

          Q.each(cmp.findBy(this.grepCmpField, this), this.form.remove, this.form);

          //清理已经销毁的控件
          this.form.cleanDestroyed();
        }
      }
    },


    load: function() {
      this.form.load.apply(this.form, arguments);
    },

    onDisable: function() {
      this.callParent(arguments);

      if (this.form) {
        this.form.items.each(function(_, filed) {
          filed.disable();
        });
      }
    },

    onEnable: function() {
      this.callParent(arguments);

      if (this.form) {
        this.form.items.each(function(_, filed) {
          filed.enable();
        });
      }
    }


  });

  return FormPanel;
})