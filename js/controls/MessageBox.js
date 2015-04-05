/**
 *
 * @authors 熊洋 (xywindows@gmail.com)
 * @date    2014-04-13 21:25:22
 * @description
 */
define([
  'controls/BoxComponent',
  'util/Template'
], function(BoxComponent, Template) {

  var MessageBox, innerElTplContent, messageTypes, propMapping, line, defaultBtns;

  /*控件内部结构模板*/
  innerElTplContent = [
    '<div class="x-alert-inner">',
    '<a href="javascript:;" class="x-tool x-tool-close">&nbsp;</a>',
    '<%if($root.title){%>',
    '<h2 class="x-alert-title"><%=$root.title%></h2>',
    '<%}%>',

    '<%if(Q.isString(message)){%>', //message字符串

    '<p class="x-alert-content"><%=message%></p>',

    '<%}else if(Q.isArray(message)){%>', //数组
    '<ul class="x-alert-list">',

    '<%for(var n=0,msgLen=message.length;n<msgLen;n++){%>',
    '<li class="x-alert-list-item"><%=message[n]%></li>',
    '<%}%>',

    '</ul>',
    '<%}%>',

    '<p class="x-alert-btns">',
    '<%var btn,i=0;while(btn=buttons[i++]){%>',
    '<a class="x-link-btn<%if(i===buttons.length){%> x-link-btn-last<%}%>" ',
    'data-command="<%=btn.name%>" href="javascript:;"><%=btn.text%></a>',
    '<%}%>',
    '</p>',
    '</div>'
  ].join('');

  /*所有消息类型*/
  messageTypes = ['info', 'danger', 'success', 'warning'];

  /*show配置对象的属性对应的控件属性名称*/
  propMapping = {
    type: 'messageType',
    closeable: 'closeable',
    modal: 'isModal',
    fn: 'handler',
    msg: 'message',
    mini: 'isMini'
  };

  line = '-',

  //默认的按钮
  defaultBtns = {
    alert: ['ok'],
    confirm: ['ok', 'cancel']
  };

  MessageBox = Q.Class.define(BoxComponent, {

    prefix: 'x-alert',

    titleSelector: '.x-alert-title',

    contentSelector: '.x-alert-content',

    defaultAlign: 'tl-tl',
    /*

    autoHide: true,

    duration: 60000,
    */
    /*迷你模式 */
    isMini: false,

    /*迷你模式下的相对位置*/
    miniTop: 15,

    /*是否可关闭 */
    closeable: false,

    /*关闭动作hide | destroy */
    closeMode: 'hide',

    /*是否是模态消息*/
    isModal: false,

    /*是否显示等待状态*/
    wait: false,

    /*消息类型 */
    messageType: 'info',

    message: '',

    title: '',

    okText: '确定',

    cancelText: '取消',

    yesText: '是',

    noText: '否',

    hidden: true,

    handler: undefined,

    closeTimerId: undefined,

    /**
     * 绘制控件内部结构
     */
    repaintInnerEl: function() {
      var me = this;

      if (!me.rendered) {
        return;
      }

      //初始化模板
      if (!me.innerElTpl) {
        MessageBox.prototype.innerElTpl = new Template(innerElTplContent)
      }

      me.el.dom.innerHTML = me.innerElTpl.compile(me.getInnerElTplArgs());
    },

    /*获取外观cls*/
    getFacadeCls: function() {
      var me = this,
        ret = [me.prefix, me.prefix + line + me.messageType];

      //是否可关闭
      if (me.closeable !== false) {
        ret.push(me.prefix + line + 'closeable');
      }

      //是否为模态
      if (me.isModal) {
        ret.push(me.prefix + line + 'modal');
      }

      //等待状态
      if (me.wait) {
        ret.push(me.prefix + line + 'wait');
      }

      //迷你模式
      if (me.isMini) {
        ret.push(me.prefix + line + 'mini');
      }

      return ret.join(' ');
    },

    /*获取innerEl模板参数*/
    getInnerElTplArgs: function() {
      var me = this,
        i, btn,
        ret = {},
        btnArray = ret.buttons = [];

      if (me.title) {
        ret.title = me.title;
      }

      ret.message = me.message || '';

      if (me.buttons) {
        /*
        数组
        buttons:['ok','cancel']
         */
        if (Q.isArray(me.buttons)) {
          i = 0;

          while (btn = me.buttons[i++]) {
            btnArray.push({
              name: btn,
              text: me[btn + 'Text']
            });
          }

        } else {
          /*
          对象
          buttons:{
            ok:'我是OK键的文本',
            cancel:true
          }
           */
          for (i in me.buttons) {
            btn = {
              name: i
            };

            btn.text = typeof me.buttons[i] == 'string' ?
              me.buttons[i] : (me[i + 'Text'] || '');

            btnArray.push(btn);
          }
        }
      }

      return ret;

    },

    /**
     * 显示对话框
     * @param  {Object}   options   配置对象
     *      titile            标题
     *      message           提示内容
     *      type              提示类型（info\success\danger\warning）
     *      buttons           需要显示的按钮
     *      closeable         是否可关闭
     *      wait              是否显示等待状态
     *      fn                回调函数
     *      scope             回调函数上下文
     */
    show: function(options, alianEl, align) {
      var me = this,
        originalProp = {},
        key,
        prop;

      //停止关闭操作
      me.clearCloseTimerId();

      options = options || {};

      //重置
      me.reset();

      //将配置对象复制到自身
      for (key in options) {
        //属性转换
        prop = key in propMapping ? propMapping[key] : key;
        //缓存久的属性
        originalProp[prop] = me[prop];
        //将新的属性添加到自身中
        me[prop] = options[key];
      }

      me.repaintInnerEl();
      me.el.dom.className = me.getFacadeCls();

      me.callParent('show');

      /*如果不是迷你模式*/
      if (me.isMini) {
        me.el.css({
          top: me.miniTop
        });
      } else if (alianEl) {
        me.el.alignTo(alianEl, align || me.defaultAlign);
      }

      me.lastOptions = options;
      me.originalProp = originalProp;
      return this;
    },

    /*恢复到初始状态*/
    reset: function() {
      var me = this;
      //如果存在旧的属性 将旧的属性 复制到自身
      if (me.originalProp) {
        Q.extend(me, me.originalProp);
        me.originalProp = null;
      }
    },

    /*显示带有一个确定按钮的对话框*/
    alert: function(options) {
      if (!('buttons' in options)) {
        options.buttons = defaultBtns.alert;
      }
      this.show.apply(this, arguments);
    },

    /*显示带有一个确定和取消按钮的对话框*/
    confirm: function(options) {
      if (!('buttons' in options)) {
        options.buttons = defaultBtns.confirm;
      }
      this.show.apply(this, arguments);
    },

    /*不允许更改尺寸*/
    setSize: Q.noop,

    /*事件初始化*/
    initEvents: function() {
      var me = this;
      me.el.on('click', me.onClickHandler, me);
    },

    /*容器点击处理函数（派发事件）*/
    onClickHandler: function(e) {
      var me = this,
        target = e.target;

      if (Q.Element.parentUntil(target, '.x-link-btn', true)) { //链接按钮
        me.onLinkBtnClickHandler(e);
      } else if (Q.Element.parentUntil(target, '.x-tool-close', true)) { //关闭按钮
        me.close();
      }
    },

    /*链接按钮被点击*/
    onLinkBtnClickHandler: function(e) {
      var me = this,
        target = Q.Element.parentUntil(e.target, '.x-link-btn', true),
        command;

      me.closeTimerId = setTimeout(Q.proxy(me.close, me), 50);

      if (target && (command = Q.Element.attr(target, 'data-command')) && me.handler) {
        me.handler.call(me.scope || me, command, me, me.lastOptions);
      }
    },

    close: function() {
      var me = this;

      me.clearCloseTimerId();
      me.reset();
      me[me.closeMode]();
    },

    clearCloseTimerId: function() {
      var me = this;
      if (me.closeTimerId != undefined) {
        clearTimeout(me.closeTimerId);
        delete me.closeTimerId;
      }
    },

    beforeDestroy: function() {
      var me = this;

      me.clearCloseTimerId();
      me.scope = me.handler = me.originalProp = me.lastOptions = null;
      me.callParent(arguments);
    }

  });

  return MessageBox;
});