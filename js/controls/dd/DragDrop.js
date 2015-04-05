define(['dd/DragDropMgr'], function(DragDropMgr) {

  var DragDrop = Q.Class.define(Q.Abstract, {

    id: null,

    config: null,

    dragElId: null,

    handleElId: null,

    /*
			一个对象，它的属性名标记了那些不能作为拖拽句柄的HTML标签。 
			一个非空属性值标志着此标签是无效的。 
			默认为以下值，它将阻止从元素发起拖拽操作：
			{
				A:'A'
			} 
		*/
    invalidHandleTypes: null,

    /*
			一个对象，它的属性名标志了被认为是非法的拖动手柄元素的ID。 
			一个非空属性值标志着这些ID是有效的。 
			例如，为了阻止从ID为"foo"的元素上发起拖动操作，使用 :
			{
				foo:true
			} 
		*/
    invalidHandleIds: null,


    invalidHandleClasses: null,

    /*
			元素开始拖拽时页面的坐标
    	*/
    startPageX: 0,

    startPageY: 0,

    /*
			组定义了一个相关的DragDrop对象的逻辑集合。 
			只有在与同一组中的其它DragDrop对象发生交互时，实例才会收到事件。
			这允许我们在需要时，使用DragDrop的单个实例来定义多个组。 
    	*/
    groups: null,

    /*是否被锁定*/
    locked: false,

    lock: function() {
      this.locked = true;
    },

    unlock: function() {
      this.locked = false;
    },
    /*
			设置为true时，
			当这个DD对象在同组的其他DD对象上方时，
			将不会接收到notification事件。默认为false。 
		*/
    moveOnly: false,

    /*
			默认情况下，任何实例都可以是拖放的目标。 
			可以设置isTarget为false以禁用。 
		*/
    isTarget: true,

    /*
			当前拖拽对象的padding配置项， 
			用来计算与当前对象相交叉的区域。 
    	*/
    padding: null,

    /*缓存引用元素有关*/
    _domRef: null,

    __ygDragDrop: true,

    /*
			设置为true时,限制水平移动
    	*/
    constrainX: false,

    constrainY: false,

    minX: 0,

    maxX: 0,

    minY: 0,

    maxY: 0,

    /*
      		当我们重置约束时保持偏移量。 
      		你想要的元素的位置相对于它的父页面变化时保持不变 ,
      		设置为true
      	*/
    maintainOffset: false,

    /*
			此配置可以用来实现在水平方向上拖动时的一种磁性吸附效果，
			这个数组就是 自动吸附的像素刻度或者间距 
		*/
    xTicks: null,

    yTicks: null,

    /*
			默认情况下，
			drag/drop实例只会响应鼠标第一个键的点击操作 (右手习惯下的左键)。 
			设置为true，将响应浏览器传来的任何一个键的点击 
    	*/
    primaryButtonOnly: true,

    /*
			当相关联的dom元素可以访问之前availabe属性值都是false。 
    	*/
    available: false,

    /*
			默认情况下，
			只有在相关联元素的区域中发生mousedown事件时，
			才发起拖拽操作。 
			在某些浏览器中，如果上一次mouseup事件在window外部发生的时候， 
			浏览器将不能报告此次的mousedown事件， 
			此时将会产生一个bug。 
			如果定义了外部的句柄，此属性值将被设置为true。 
    	*/
    hasOuterHandles: false,

    /*x, y*/
    /*代码执行前立即startDrag事件*/
    b4StartDrag: Q.noop,

    /*x, y*/
    /*代码执行前立即startDrag事件*/
    startDrag: Q.noop,

    /*e*/
    /*代码执行前立即onDrag事件*/
    b4Drag: Q.noop,

    /*e*/
    /*抽象方法被调用时为onMouseMove事件期间,拖拽一个物体。*/
    onDrag: Q.noop,

    /*e,id*/
    /*抽象方法 被调用时为元素第一次悬停在其他DragDrop对象上*/
    onDragEnter: Q.noop,

    /*e*/
    b4DragOver: Q.noop,

    /*e,id*/
    /*抽象方法调用时这个元素是悬停在另一个DragDrop obj*/
    onDragOver: Q.noop,

    /*e*/
    b4DragOut: Q.noop,

    /*e,id*/
    /*抽象方法调用时 我们不在悬停在一个元素上*/
    onDragOut: Q.noop,

    /*e*/
    b4DragDrop: Q.noop,

    /*e,id*/
    /*抽象方法调用时当前对象拖放到另一个DragDrop对象*/
    onDragDrop: Q.noop,

    /*e*/
    /*抽象方法调用时 落在没有下降的目标区*/
    onInvalidDrop: Q.noop,

    /*e*/
    b4EndDrag: Q.noop,

    /*e*/
    /*触发时我们已经结束了拖拽*/
    endDrag: Q.noop,

    /*e*/
    b4MouseDown: Q.noop,

    /*e*/
    /*事件处理函数，当发生了drag/drop事被调用*/
    onMouseDown: Q.noop,

    /*e*/
    onMouseUp: Q.noop,

    onAvailable: Q.noop,

    /*提供默认约束填充“constrainTo”元素*/
    defaultPadding: {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0
    },

    init: function(id, sGroup, config) {
      if (id) {
        this.configuration.apply(this, arguments);
      }
    },

    /*
			让元素的运动范围受限于另一个元素，

			var dd = new Ext.dd.DDProxy("dragDiv1", "proxytest", { dragElId: "existingProxyDiv" });
		 	
		 	dd.startDrag = function(){
		    	this.constrainTo("parent-id");
 			};
		*/
    constrainTo: function(constrainTo, pad, inContent) {

      if (Q.isNumber(pad)) {
        pad = {
          top: pad,
          bottom: pad,
          left: pad,
          right: pad
        }
      }

      pad = pad || this.defaultPadding;

      var b = Q.get(this.getEl()).getRegion(),
        ce = Q.get(constrainTo),
        s = ce.getScroll(),
        c,
        cd = ce.dom;

      if (cd == document.body) {
        c = {
          x: s.left,
          y: s.top,
          width: Q.Element.getViewWidth(),
          height: Q.Element.getViewHeight()
        };
      } else {
        var xy = ce.offset();
        c = {
          x: xy.left,
          y: xy.top,
          width: cd.clientWidth,
          height: cd.clientHeight
        };
      }

      var topSpace = b.y - c.y,
        leftSpace = b.x - c.x;

      this.resetConstraints();

      this.setXConstraint(leftSpace - (pad.left || 0), // left
        c.width - leftSpace - b.width - (pad.right || 0), //right
        this.xTickSize
      );

      this.setYConstraint(topSpace - (pad.top || 0), //top
        c.height - topSpace - b.height - (pad.bottom || 0), //bottom
        this.yTickSize
      );
    },

    getEl: function() {
      if (!this._domRef) {
        this._domRef = Q.dom.get(this.id);
      }

      return this._domRef;
    },

    getDragEl: function() {
      return Q.dom.get(this.dragElId);
    },

    /*
     * @param id 联接元素的ID
     * @param {String} sGroup 组相关的项
     * @param {object} config
     */
    configuration: function(id, sGroup, config) {
      this.initTarget(id, sGroup, config);
      Q.get(this.id).on('mousedown', this.handleMouseDown, this);
    },

    initTarget: function(id, sGroup, config) {

      this.config = config || {};

      //为拖拽 创建一个 drop manager本地引用
      this.DDM = DragDropMgr;

      //初始化组数组
      this.groups = {};

      if (typeof id !== 'string') {
        id = Q.id(id);
      }

      if (Q.isString(id) && id.substr(0, 1) != '#' && !/\s+/g.test(id)) {
        id = '#' + id;
      }

      this.id = id;

      this.addToGroup(sGroup ? sGroup : 'default');

      this.handleElId = id;

      this.setDragElId(id);

      this.invalidHandleTypes = {
        A: 'A'
      };
      this.invalidHandleIds = {};
      this.invalidHandleClasses = [];

      this.applyConfig();

      this.handleOnAvailable();
    },

    /*
			将这个实例添加到一组相关的drag/drop 对象。
			所有实例至少属于一个组,也可以属于许多组。
		*/
    addToGroup: function(sGroup) {
      this.groups[sGroup] = true;
      this.DDM.regDragDrop(this, sGroup);
    },

    removeFromGroup: function(sGroup) {
      if (this.groups[sGroup]) {
        delete this.groups[sGroup];
      }
      this.DDM.removeDDFromGroup(this, sGroup);
    },

    setDragElId: function(id) {
      if (Q.isString(id) && id.substr(0, 1) != '#' && !/\s+/g.test(id)) {
        id = '#' + id;
      }
      this.dragElId = id;
    },

    applyConfig: function() {
      var config = this.config;

      this.padding = config.padding || [0, 0, 0, 0];
      this.isTarget = config.isTarget !== false;
      this.maintainOffset = config.maintainOffset;
      this.primaryButtonOnly = config.primaryButtonOnly !== false;

    },

    handleOnAvailable: function() {
      this.available = true;
      //重置约束
      this.resetConstraints();
      this.onAvailable();
    },

    /*
			当你手动重新设置一个dd元素的位置时，
			必须调用resetConstraints方法。 
		*/
    resetConstraints: function() {
      var dx, dy;

      if (this.initPageX || this.initPageX === 0) {
        //maintainOffset是否维持
        dx = this.maintainOffset ? this.lastPageX - this.initPageX : 0;
        dy = this.maintainOffset ? this.lastPageY - this.initPageY : 0;

        this.setInitPosition(dx, dy);
      } else {
        this.setInitPosition();
      }

      //x轴约束
      if (this.constrainX) {
        this.setXConstraint(this.leftConstraint,
          this.rightConstraint,
          this.xTickSize);
      }

      //y轴约束
      if (this.constrainY) {
        this.setYConstraint(this.topConstraint,
          this.bottomConstraint,
          this.yTickSize);
      }
    },

    /*
			存储相关元素初始化的位置。 
		*/
    setInitPosition: function(diffX, diffY) {
      var el = this.getEl(),
        dx, dy, offset;

      if (!this.DDM.verifyEl(el)) {
        return;
      }

      dx = diffX || 0;
      dy = diffY || 0;

      offset = Q.Element.offset(el);


      this.initPageX = offset.left - dx;
      this.initPageY = offset.top - dy;

      this.lastPageX = offset.left;
      this.lastPageY = offset.top;

      this.setStartPosition(offset);

    },

    /*
			设置元素的初始位置。
			这是集obj初始化时,拖动时重置开始。
		*/
    setStartPosition: function(pos) {
      var offset = pos || Q.Element.offset(this.getEl());

      this.deltaSetXY = null;

      this.startPageX = offset.left;
      this.startPageY = offset.top;
    },

    /*
			默认情况下，
			元素可以被拖拽并放置到屏幕上的任意位置。 
			使用此方法来限制元素在水平方向上的运动。 
			如果你想锁定在y轴上的拖动，传递参数0,0 
		*/
    setXConstraint: function(iLeft, iRight, iTickSize) {
      this.leftConstraint = iLeft;
      this.rightConstraint = iRight;

      this.minX = this.initPageX - iLeft;
      this.maxX = this.initPageX + iRight;

      if (iTickSize) {
        this.setXTicks(this.initPageX, iTickSize);
      }

      this.constrainX = true;
    },

    /*
			创建一个数组中指定的水平刻度线间隔是否 setXConstraint()。
		*/
    setXTicks: function(iStartX, iTickSize) {
      this.xTicks = [];
      this.xTickSize = iTickSize;

      var tickMap = {};

      for (var i = this.initPageX; i >= this.minX; i -= iTickSize) {
        if (!tickMap[i]) {
          this.xTicks.push(i);
          tickMap[i] = true;
        }
      }

      for (i = this.initPageX; i < this.maxX; i = i + iTickSize) {
        if (!tickMap[i]) {
          this.xTicks.push(i);
          tickMap[i] = true;
        }
      }

      this.xTicks.sort(this.DDM.numericSort);
    },

    setYConstraint: function(iUp, iDown, iTickSize) {
      this.topConstraint = iUp;
      this.bottomConstraint = iDown;

      this.minY = this.initPageY - iUp;
      this.maxY = this.initPageY + iDown;

      if (iTickSize) {
        this.setYTicks(this.initPageY, iTickSize);
      }

      this.constrainY = true;
    },

    setYTicks: function(iStartY, iTickSize) {
      this.yTicks = [];
      this.yTickSize = iTickSize;

      var tickMap = {};

      for (var i = this.initPageY; i >= this.minY; i = i - iTickSize) {
        if (!tickMap[i]) {
          this.yTicks[this.yTicks.length] = i;
          tickMap[i] = true;
        }
      }

      for (i = this.initPageY; i <= this.maxY; i = i + iTickSize) {
        if (!tickMap[i]) {
          this.yTicks[this.yTicks.length] = i;
          tickMap[i] = true;
        }
      }

      this.yTicks.sort(this.DDM.numericSort);
    },

    setPadding: function(iTop, iRight, iBot, iLeft) {
      // this.padding = [iLeft, iRight, iTop, iBot];
      if (!iRight && 0 !== iRight) {
        this.padding = [iTop, iTop, iTop, iTop];
      } else if (!iBot && 0 !== iBot) {
        this.padding = [iTop, iRight, iTop, iRight];
      } else {
        this.padding = [iTop, iRight, iBot, iLeft];
      }
    },

    setOuterHandleElId: function(id) {
      if (typeof id !== "string") {
        id = Q.id(id);
      }


      if (!/\s+/g.test(id) && id.substr(0, 1) != '#') {
        id = '#' + id;
      }

      Q.get(id).on("mousedown", this.handleMouseDown, this);

      this.setHandleElId(id);

      this.hasOuterHandles = true;
    },

    setHandleElId: function(id) {
      if (typeof id !== "string") {
        id = Q.id(id);
      }

      if (!/\s+/g.test(id) && id.substr(0, 1) != '#') {
        id = '#' + id;
      }
      this.handleElId = id;
      this.DDM.regHandle(this.id, id);
    },

    /*
			删除当前元素上所有拖拽和落下钩子
		*/
    unreg: function() {
      var el;
      if (el = Q.get(this.id)) {
        el.off("mousedown", this.handleMouseDown, this);
      }
      this._domRef = null;
      this.DDM._remove(this);
    },

    isLocked: function() {
      return (this.DDM.isLocked() || this.locked);
    },

    //验证
    handleMouseDown: function(e, oDD) {
      if (this.primaryButtonOnly && e.which != 1) {
        return;
      }

      if (this.isLocked()) {
        return;
      }

      this.DDM.refreshCache(this.groups);

      var pt = {};

      pt.x = pt.right = pt.left = pt[0] = e.pageX;
      pt.y = pt.top = pt.bottom = pt[1] = e.pageY;

      if (!this.hasOuterHandles && !this.DDM.isOverTarget(pt, this)) {} else { // set the initial element position


        if (this.clickValidator(e)) {
          this.setStartPosition();

          this.b4MouseDown(e);
          this.onMouseDown(e);

          this.DDM.handleMouseDown(e, this);

          if (this.preventDefault || this.stopPropagation) {
            if (this.preventDefault) {
              e.preventDefault();
            }
            if (this.stopPropagation) {
              e.stopPropagation();
            }
          } else {
            this.DDM.stopEvent(e);
          }
        }
      }

    },

    clickValidator: function(e) {
      var target = e.target;

      return (this.isValidHandleChild(target) &&
        (this.id == this.handleElId ||
          this.DDM.handleWasClicked(target, this.id)));
    },

    addInvalidHandleType: function(tagName) {
      var type = tagName.toUpperCase();
      this.invalidHandleTypes[type] = type;
    },

    addInvalidHandleId: function(id) {
      if (typeof id !== "string") {
        id = Q.id(id);
      }
      this.invalidHandleIds[id] = id;
    },

    addInvalidHandleClass: function(cssClass) {
      this.invalidHandleClasses.push(cssClass);
    },

    removeInvalidHandleType: function(tagName) {
      var type = tagName.toUpperCase();
      // this.invalidHandleTypes[type] = null;
      delete this.invalidHandleTypes[type];
    },

    removeInvalidHandleId: function(id) {
      if (typeof id !== "string") {
        id = Q.id(id);
      }
      delete this.invalidHandleIds[id];
    },

    removeInvalidHandleClass: function(cssClass) {
      for (var i = 0, len = this.invalidHandleClasses.length; i < len; ++i) {
        if (this.invalidHandleClasses[i] == cssClass) {
          delete this.invalidHandleClasses[i];
        }
      }
    },

    isValidHandleChild: function(node) {

      var valid = true;
      // var n = (node.nodeName == "#text") ? node.parentNode : node;
      var nodeName;
      try {
        nodeName = node.nodeName.toUpperCase();
      } catch (e) {
        nodeName = node.nodeName;
      }
      valid = valid && !this.invalidHandleTypes[nodeName];
      valid = valid && !this.invalidHandleIds[node.id];

      for (var i = 0, len = this.invalidHandleClasses.length; valid && i < len; ++i) {
        valid = !Q.Element.hasClass(node, this.invalidHandleClasses[i]);
      }


      return valid;

    },

    clearConstraints: function() {
      this.constrainX = false;
      this.constrainY = false;
      this.clearTicks();
    },

    clearTicks: function() {
      this.xTicks = null;
      this.yTicks = null;
      this.xTickSize = 0;
      this.yTickSize = 0;
    },

    getTick: function(val, tickArray) {
      if (!tickArray) {
        // If tick interval is not defined, it is effectively 1 pixel,
        // so we return the value passed to us.
        return val;
      } else if (tickArray[0] >= val) {
        // The value is lower than the first tick, so we return the first
        // tick.
        return tickArray[0];
      } else {
        for (var i = 0, len = tickArray.length; i < len; ++i) {
          var next = i + 1;
          if (tickArray[next] && tickArray[next] >= val) {
            var diff1 = val - tickArray[i];
            var diff2 = tickArray[next] - val;
            return (diff2 > diff1) ? tickArray[i] : tickArray[next];
          }
        }

        // The value is larger than the last tick, so we return the last
        // tick.
        return tickArray[tickArray.length - 1];
      }
    },

    toString: function() {
      return ("DragDrop " + this.id);
    }
  });


  DragDrop.prototype.destroy = DragDrop.prototype.unreg;

  return DragDrop;
});