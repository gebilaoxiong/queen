define([
  'controls/BoxComponent',
  'util/ClickRepeater',
  'controls/Button',
  'util/Template'
], function(BoxComponent, ClickRepeater, Button, Template) {

  var DatePicker = Q.Class.define(BoxComponent, {

    type: 'DatePicker',

    todayText: '今天',

    okText: '确定',

    cancelText: '取消',

    todayTip: '{0}',

    minText: '日期必须大于最小允许日期',

    maxText: '日期必须小于最大允许日期',

    format: 'YYYY/dd/mm',

    disabledDaysText: '',

    disabledDatesText: '',

    /*一周中起始天的索引值,从0开始 (默认值为0,表示星期天) */
    startDay: 0,

    /*是否显示‘今天’按钮*/
    showToday: true,

    focusOnSelect: true,

    initHour: 12,

    monthNames: [
      "一月",
      "二月",
      "三月",
      "四月",
      "五月",
      "六月",
      "七月",
      "八月",
      "九月",
      "十月",
      "十一月",
      "十二月"
    ],

    dayNames: [
      "日",
      "一",
      "二",
      "三",
      "四",
      "五",
      "六"
    ],

    nextText: '下个月',

    prevText: '上个月',

    monthYearText: '选择月份',

    initComponent: function() {
      this.callParent(arguments);

      this.value = this.value ?
        Q.Date.clearTime(this.value, true) : Q.Date.clearTime(new Date(), true);

      this.initDisabledDays();
    },

    initEvents: function() {
      this.callParent(arguments);

      if (this.handler) {
        this.bind('select', this.handler, this.scope || this);
      }
    },

    /*初始化禁用的日期*/
    initDisabledDays: function() {
      if (!this.disabledDatesRE && this.disabledDates) {
        var disabledDates = this.disabledDates,
          len = disabledDates.length - 1,
          re = '(?:';

        Q.each(disabledDates, function(index, item) {
          re += Q.isDate(item) ? '^' + Q.String.escapeRegExp(Q.Date.format(item, this.format)) + '$' : disabledDates[i];
          if (index != len) {
            re += '|';
          }
        }, this);

        this.disabledDatesRE = new RegExp(re + ')');
      }
    },

    /*设置禁用日期*/
    setDisabledDates: function(disabledDates) {
      if (Q.isArray) { //数组 待重新初始化
        this.disabledDates = disabledDates;
        this.disabledDatesRE = null;
      } else {
        this.disabledDatesRE = disabledDates;
      }
      this.initDisabledDays();
      this.update(this.value, true);
    },
    /*禁用一周中的某些天*/
    setDisabledDays: function(disabledDays) {
      this.disabledDays = disabledDays;
      this.update(this.value, true);
    },

    setMinDate: function(dt) {
      this.minDate = dt;
      this.update(this.value, true);
    },

    setMaxDate: function(dt) {
      this.maxDate = dt;
      this.update(this.value, true);
    },

    setMaxDate: function(dt) {
      this.maxDate = dt;
      this.update(this.value, true);
    },

    setValue: function(value) {
      this.value = Q.Date.clearTime(value);
      this.update(this.value);
    },

    getValue: function() {
      return this.value;
    },

    focus: function() {
      this.update(this.activeDate);
    },

    onEnable: function(initial) {
      this.callParent(arguments);
      this.doDisabled(false);
      this.update(initial ? this.value : this.activeDate);
    },

    onDisable: function() {
      this.callParent(arguments);
      this.doDisabled(true);
    },

    doDisabled: function(disabled) {
      this.prevRepeater.setDisabled(disabled);
      this.nextRepeater.setDisabled(disabled);
      if (this.showToday) {
        this.todayBtn.setDisabled(disabled);
      }
    },

    onRender: function(container, position) {
      var me = this,
        el, today;

      if (!me.renderTempl) {
        /*
				prevText
				nextText
				startDay
				dayNames
				showToday
				*/
        DatePicker.prototype.renderTmpl = new Template([
          '<table cellspacing="0">',
          '<tr><td class="x-date-left"><a href="#" title="<%=prevText%>">&#160;</a></td><td class="x-date-middle" align="center"></td><td class="x-date-right"><a href="#" title="<%=nextText%>">&#160;</a></td></tr>',
          '<tr><td colspan="3"><table class="x-date-inner" cellspacing="0"><thead><tr>',
          '<%for (var i = 0; i < 7; i++) { %>', //绘制一周7天
          '<%var day = startDay + i;%>',
          '<%if (day > 6) { day = day - 7; }%>',
          '<th><span><%=dayNames[day]%></span></th>',
          '<%}%>',
          '</tr></thead><tbody><tr>',
          '<%for (i = 0; i < 42; i++) {%>', //绘制42天 7*6
          '<%if (i % 7 === 0 && i !== 0) {%>',
          '</tr><tr>',
          '<%}%>',
          '<td><a href="#" hidefocus="on" class="x-date-date" tabIndex="1"><em><span></span></em></a></td>',
          '<%}%>',
          '</tr></tbody></table></td></tr>',
          '<% if(showToday){%>',
          '<tr><td colspan="3" class="x-date-bottom" align="center"></td></tr>',
          '<%}%>',
          '</table><div class="x-date-mp"></div>'
        ])
      }


      el = document.createElement('div');
      el.className = 'x-date-picker';
      el.innerHTML = me.renderTmpl.compile({
        prevText: me.prevText,
        nextText: me.nextText,
        startDay: me.startDay,
        dayNames: me.dayNames,
        showToday: me.showToday
      });

      container.dom.insertBefore(el, position || null);


      me.el = new Q.Element(el);
      me.eventEl = new Q.Element(el.firstChild);

      //clickRepeater
      me.prevRepeater = new ClickRepeater(Q.dom.get('td.x-date-left a', el), {
        handler: me.showPrevMonth,
        scope: me,
        preventDefault: true,
        stopDefault: true
      });

      me.nextRepeater = new ClickRepeater(Q.dom.get('td.x-date-right a', el), {
        handler: me.showNextMonth,
        scope: me,
        preventDefault: true,
        stopDefault: true
      });

      //月份选择开关
      me.monthPicker = Q.get('div.x-date-mp', el, el.childNodes);

      me.el.addClass('unselect');

      me.cells = Q.dom.find('table.x-date-inner tbody td', me.el.dom);
      me.textNodes = Q.dom.find('table.x-date-inner tbody span', me.el.dom);


      me.mbtn = new Button({
        text: ' ',
        cls: 'x-btn-arrow-right',
        tooltip: me.monthYearText,
        showArrow: true,
        renderTo: Q.get('td.x-date-middle', el)
      });

      //今天
      if (me.showToday) {
        today = Q.Date.format(new Date(), me.format);

        me.todayBtn = new Button({
          scale: 'small',
          renderTo: Q.dom.get('td.x-date-bottom', el),
          text: Q.String.format(me.todayText)(today),
          tooltip: Q.String.format(me.todayTip)(today),
          handler: me.selectToday,
          scope: me
        });

      }

      me.onEnable(true);
    },

    initEvents: function() {
      this.eventEl.on('click', Q.proxy(this.handleDateClick, this), 'a.x-date-date');
      this.mbtn.bind('click', this.showMonthPicker, this);
    },

    createMonthPicker: function() {
      if (!this.monthPicker.dom.firstChild) {
        if (!this.monthPickerTmpl) {
          /*
					monthNames
					okText
					cancelText
					*/
          DatePicker.prototype.monthPickerTmpl = new Template([
            '<table border="0" cellspacing="0">',
            '<%for (var i = 0; i < 6; i++) {%>',
            '<tr><td class="x-date-mp-month"><a href="#"><%=monthNames[i]%></a></td>',
            '<td class="x-date-mp-month x-date-mp-sep"><a href="#"><%=monthNames[i + 6]%></a></td>',
            '<%if (i === 0){%>',
            '<td class="x-date-mp-ybtn" align="center"><a class="x-date-mp-prev"></a></td><td class="x-date-mp-ybtn" align="center"><a class="x-date-mp-next"></a></td></tr>',
            '<%}else{%>',
            '<td class="x-date-mp-year"><a href="#"></a></td><td class="x-date-mp-year"><a href="#"></a></td></tr>',
            '<%}%>',
            '<%}%>',
            '<tr class="x-date-mp-btns"><td colspan="4"><button type="button" class="x-btn x-btn-small x-btn-default x-date-mp-ok">',
            '<%=okText%>',
            '</button><button type="button" class="x-btn x-btn-small x-btn-default x-date-mp-cancel">',
            '<%=cancelText%>',
            '</button></td></tr>',
            '</table>'
          ]);
        }

        this.monthPicker.empty()
        this.monthPicker.dom.innerHTML = this.monthPickerTmpl.compile({
          monthNames: this.monthNames,
          okText: this.okText,
          cancelText: this.cancelText
        });

        this.monthPicker.on('click', this.onMonthClick, this);
        this.monthPicker.on('dblclick', this.onMonthDblClick, this);

        this.mpMonths = Q.find('td.x-date-mp-month', this.monthPicker.dom);
        this.mpYears = Q.find('td.x-date-mp-year', this.monthPicker.dom);


        this.mpMonths.each(function(i, m) {
          i += 1;
          if ((i % 2) === 0) {
            m.xmonth = 5 + Math.round(i * 0.5);
          } else {
            m.xmonth = Math.round((i - 1) * 0.5);
          }
        });
      }
    },

    showMonthPicker: function() {
      var size, t;
      if (!this.disabled) {
        this.createMonthPicker();
        size = {
          width: this.el.outerWidth(false),
          height: this.el.outerHeight(false)
        };
        this.monthPicker.outerWidth(false, size.width);
        this.monthPicker.outerHeight(false, size.height);

        t = Q.get('table', this.monthPicker.dom);
        t.outerWidth(false, size.width);
        t.outerHeight(false, size.height);

        this.mpSelMonth = (this.activeDate || this.value).getMonth();
        this.updateMPMonth(this.mpSelMonth);
        this.mpSelYear = (this.activeDate || this.value).getFullYear();
        this.updateMPYear(this.mpSelYear);

        this.monthPicker.show();
      }
    },

    updateMPYear: function(y) {
      this.mpyear = y;
      var ys = this.mpYears.data;
      for (var i = 1; i <= 10; i++) {
        var td = ys[i - 1],
          y2;
        if ((i % 2) === 0) {
          y2 = y + Math.round(i * 0.5);
          td.firstChild.innerHTML = y2;
          td.xyear = y2;
        } else {
          y2 = y - (5 - Math.round(i * 0.5));
          td.firstChild.innerHTML = y2;
          td.xyear = y2;
        }
        Q.Element[y2 == this.mpSelYear ? 'addClass' : 'removeClass'](this.mpYears.get(i - 1), 'x-date-mp-sel');
      }
    },

    // private
    updateMPMonth: function(sm) {
      this.mpMonths.each(function(i, m) {
        Q.Element[m.xmonth == sm ? 'addClass' : 'removeClass'](m, 'x-date-mp-sel');
      });
    },

    onMonthClick: function(e) {
      e.stopPropagation();
      e.preventDefault();

      var el = new Q.Element(e.target),
        pn;
      if (el.is('button.x-date-mp-cancel')) {
        this.hideMonthPicker();
      } else if (el.is('button.x-date-mp-ok')) {
        var d = new Date(this.mpSelYear, this.mpSelMonth, (this.activeDate || this.value).getDate());
        if (d.getMonth() != this.mpSelMonth) {
          // 'fix' the JS rolling date conversion if needed
          alert('没有写')
        }
        this.update(d);
        this.hideMonthPicker();
      } else if ((pn = el.parentUntil('.x-date-mp-month'))) { //选择的月份
        this.mpMonths.each(function() {
          Q.Element.removeClass(this, 'x-date-mp-sel');
        });

        Q.Element.addClass(pn, 'x-date-mp-sel');
        this.mpSelMonth = pn.xmonth;
      } else if ((pn = el.parentUntil('.x-date-mp-year'))) { //选择的年份

        this.mpYears.each(function() {
          Q.Element.removeClass(this, 'x-date-mp-sel');
        });

        Q.Element.addClass(pn, 'x-date-mp-sel');
        this.mpSelYear = pn.xyear;

      } else if (el.is('a.x-date-mp-prev')) {
        this.updateMPYear(this.mpyear - 10);
      } else if (el.is('a.x-date-mp-next')) {
        this.updateMPYear(this.mpyear + 10);
      }
    },

    onMonthDblClick: function(e) {
      e.stopPropagation();
      e.preventDefault();

      var el = new Q.Element(e.target),
        pn;

      if ((pn = el.parentUntil('.x-date-mp-month'))) {
        this.update(new Date(this.mpSelYear, pn.xmonth, (this.activeDate || this.value).getDate()));
        this.hideMonthPicker();
      } else if ((pn = el.parentUntil('.x-date-mp-year'))) {
        this.update(new Date(pn.xyear, this.mpSelMonth, (this.activeDate || this.value).getDate()));
        this.hideMonthPicker();
      }
    },

    hideMonthPicker: function() {
      if (this.monthPicker) {
        this.monthPicker.hide();
      }
    },

    showPrevMonth: function(e) {
      this.update(Q.Date.add(this.activeDate, 'mo', -1));
    },

    showNextMonth: function(e) {
      this.update(Q.Date.add(this.activeDate, 'mo', 1));
    },

    showPrevYear: function() {
      this.update(Q.Date.add(this.activeDate, 'y', -1));
    },

    // private
    showNextYear: function() {
      this.update(Q.Date.add(this.activeDate, 'y', 1));
    },

    handleDateClick: function(e) {

      e.stopPropagation();
      e.preventDefault();

      var target = e.currentTarget;

      if (!this.disabled && target.dateValue && !Q.Element.hasClass(target.parentNode, 'x-date-disabled')) {
        this.cancelFocus = this.focusOnSelect === false;
        this.setValue(new Date(target.dateValue));
        delete this.cancelFocus;
        this.fire('select', this, this.value);
      }
    },

    // private
    selectToday: function() {
      if (this.todayBtn && !this.todayBtn.disabled) {
        this.setValue(Q.Date.clearTime(new Date()));
        this.fire('select', this, this.value);
      }
    },

    update: function(date, forceRefresh) {

      if (this.rendered) {
        var vd = this.activeDate,
          vis = this.isVisible();

        this.activeDate = date;

        if (!forceRefresh && vd && this.el) {
          var t = date.getTime();
          if (vd.getMonth() == date.getMonth() && vd.getFullYear() == date.getFullYear()) {

            this.cells.each(function(_, c) {
              Q.Element.removeClass(c, 'x-date-selected');
              if (c.firstChild.dateValue == t) {
                Q.Element.addClass(c, 'x-date-selected');
              }
            }, this);
            return;
          }
        }
        var days = Q.Date.getDaysInMonth(date),
          firstOfMonth = Q.Date.getFirstDateOfMonth(date),
          startingPos = firstOfMonth.getDay() - this.startDay;

        if (startingPos < 0) {
          startingPos += 7;
        }
        days += startingPos;

        var pm = Q.Date.add(date, 'mo', -1),
          prevStart = Q.Date.getDaysInMonth(pm) - startingPos,
          cells = this.cells.data,
          textEls = this.textNodes,
          // convert everything to numbers so it's fast
          d = (new Date(pm.getFullYear(), pm.getMonth(), prevStart, this.initHour)),
          today = Q.Date.clearTime(new Date()).getTime(),
          sel = Q.Date.clearTime(date, true).getTime(),
          min = this.minDate ? Q.Date.clearTime(this.minDate, true) : Number.NEGATIVE_INFINITY,
          max = this.maxDate ? Q.Date.clearTime(this.maxDate, true) : Number.POSITIVE_INFINITY,
          ddMatch = this.disabledDatesRE,
          ddText = this.disabledDatesText,
          ddays = this.disabledDays ? this.disabledDays.join('') : false,
          ddaysText = this.disabledDaysText,
          format = this.format;

        if (this.showToday) {
          var td = Q.Date.clearTime(new Date()),
            disable = (td < min || td > max ||
              (ddMatch && format && ddMatch.test(td.dateFormat(format))) ||
              (ddays && ddays.indexOf(td.getDay()) != -1));

          if (!this.disabled) {
            this.todayBtn.setDisabled(disable);
          }
        }

        function setCellClass(cal, cell) {
          cell.title = '';
          var t = Q.Date.clearTime(d, true).getTime();
          cell.firstChild.dateValue = t;
          if (t == today) {
            cell.className += ' x-date-today';
            cell.title = cal.todayText;
          }
          if (t == sel) {
            cell.className += ' x-date-selected';
          }
          // disabling
          if (t < min) {
            cell.className = ' x-date-disabled';
            cell.title = cal.minText;
            return;
          }
          if (t > max) {
            cell.className = ' x-date-disabled';
            cell.title = cal.maxText;
            return;
          }
          if (ddays) {
            if (Q.inArray(ddays, d.getDay()) != -1) {
              cell.title = ddaysText;
              cell.className = ' x-date-disabled';
            }
          }
          if (ddMatch && format) {
            var fvalue = Q.Date.format(d, format);
            if (ddMatch.test(fvalue)) {
              cell.title = ddText.replace('%0', fvalue);
              cell.className = ' x-date-disabled';
            }
          }
        };

        var i = 0;
        for (; i < startingPos; i++) {
          textEls.data[i].innerHTML = ++prevStart;
          d.setDate(d.getDate() + 1);
          cells[i].className = 'x-date-prevday';
          setCellClass(this, cells[i]);
        }
        for (; i < days; i++) {
          var intDay = i - startingPos + 1;
          textEls.data[i].innerHTML = intDay;
          d.setDate(d.getDate() + 1);
          cells[i].className = 'x-date-active';
          setCellClass(this, cells[i]);
        }
        var extraDays = 0;
        for (; i < 42; i++) {
          textEls.data[i].innerHTML = ++extraDays;
          d.setDate(d.getDate() + 1);
          cells[i].className = 'x-date-nextday';
          setCellClass(this, cells[i]);
        }

        this.mbtn.setText(this.monthNames[date.getMonth()] + ' ' + date.getFullYear());

        /*
				if (!this.internalRender) {
					var main = Q.get(this.el.dom.firstChild),
						w = main.outerWidth(false);

					this.el.outerWidth(false, w);
					main.outerWidth(false, this.el.innerWidth());
					this.internalRender = true;
				}
				*/
      }
    },

    beforeDestroy: function() {
      if (this.rendered) {
        this.monthPicker.remove();
        this.mbtn.destroy();
        this.nextRepeater.destroy();
        this.prevRepeater.destroy();
        this.cells.each(function() {
          this.remove();
        });
        this.cells.clear();
        this.textNodes.each(function() {
          this.remove();
        })
        this.textNodes.clear();
        this.todayBtn.destroy();

        delete this.textNodes;
        delete this.cells.elements;
      }
    }


  });

  return DatePicker;
});