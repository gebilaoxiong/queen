define([
  'form/TriggerField',
  'menu/DateMenu'
], function(TriggerField, DateMenu) {

  var DateField = Q.Class.define(TriggerField, {

    type: 'DateField',

    format: 'YYYY/MM/dd',

    altFormats: "YYYY/MM/dd|yy-MM-dd|YYYY-MM-dd|dd/MM|MM-dd|dd|YYYY-MM-dd|YYYY年MM月dd|YYYY年MM月dd日|MM月dd日|MM月dd|MM/dd",

    disabledDaysText: "禁用",

    disabledDatesText: "禁用",

    minText: "该输入项的日期必须在 {0} 之后",

    maxText: "该输入项的日期必须在 {0} 之前",

    invalidText: "{0} 是无效的日期 - 必须符合格式： {1}",

    triggerCls: 'x-form-date-trigger',

    showToday: true,

    startDay: 0,

    autoCreate: {
      target: "input",
      type: "text",
      size: "20",
      autocomplete: "off"
    },

    safeParse: function(value, format) {
      return Q.Date.parse(value, format);
    },

    configuration: function() {
      var me = this;

      me.callParent(arguments);

      if (Q.isString(this.minText)) {
        this.minText = Q.String.format(this.minText);
      }

      if (Q.isString(this.maxValue)) {
        this.minText = Q.String.format(this.minText);
      }

      if (Q.isString(this.invalidText)) {
        this.invalidText = Q.String.format(this.invalidText);
      }

      if (Q.isString(me.minValue)) {
        me.minValue = me.parseDate(me.minValue);
      }
      if (Q.isString(me.maxValue)) {
        me.maxValue = me.parseDate(me.maxValue);
      }
      me.disabledDatesRE = null;
      me.initDisabledDays();
    },

    initDisabledDays: function() {
      var me = this;
      if (me.disabledDates) {
        var dd = me.disabledDates,
          len = dd.length - 1,
          re = "(?:";

        Q.each(dd, function(i, d) {
          re += Q.isDate(d) ? '^' + Q.String.escapeRegExp(d.dateFormat(me.format)) + '$' : d;
          if (i != len) {
            re += '|';
          }
        }, me);

        me.disabledDatesRE = new RegExp(re + ')');
      }
    },

    setDisabledDates: function(dd) {
      this.disabledDates = dd;
      this.initDisabledDays();

      if (this.menu) {
        this.menu.picker.setDisabledDates(this.disabledDatesRE);
      }
    },

    setDisabledDays: function(dd) {
      this.disabledDays = dd;
      if (this.menu) {
        this.menu.picker.setDisabledDays(dd);
      }
    },

    setMinValue: function(dt) {
      this.minValue = Q.isString(dt) ? this.parseDate(dt) : dt;
      if (this.menu) {
        this.menu.picker.setMinDate(this.minValue);
      }
    },

    setMaxValue: function(dt) {
      this.maxValue = Q.isString(dt) ? this.parseDate(dt) : dt;
      if (this.menu) {
        this.menu.picker.setMaxDate(this.maxValue);
      }
    },

    getErrors: function(value) {
      var me = this,
        errors = me.callParent(arguments);

      value = me.formatDate(value || me.processValue(me.getRawValue()));

      if (value.length < 1) { // if it's blank and textfield didn't flag it then it's valid
        return errors;
      }

      var svalue = value;
      value = me.parseDate(value);
      if (!value) {
        errors.push(me.invalidText(svalue, me.format));
        return errors;
      }

      var time = value.valueOf();

      if (me.minValue && time < Q.Date.clearTime(me.minValue).valueOf()) {
        errors.push(me.minText(me.formatDate(me.minValue)));
      }

      if (me.maxValue && time > Q.Date.clearTime(me.maxValue).valueOf()) {
        errors.push(me.maxText(me.formatDate(me.maxValue)));
      }

      if (me.disabledDays) {
        var day = value.getDay();

        for (var i = 0; i < me.disabledDays.length; i++) {
          if (day === me.disabledDays[i]) {
            errors.push(me.disabledDaysText);
            break;
          }
        }
      }

      var fvalue = this.formatDate(value);
      if (this.disabledDatesRE && this.disabledDatesRE.test(fvalue)) {
        errors.push(String.format(this.disabledDatesText)(fvalue));
      }

      return errors;
    },

    validateBlur: function() {
      return !this.menu || !this.menu.isVisible();
    },

    getValue: function() {
      return this.parseDate(this.callParent(arguments)) || "";
    },

    setValue: function(date) {
      return this.callParent('setValue', [this.formatDate(this.parseDate(date))]);
    },

    parseDate: function(value) {
      if (!value || Q.isDate(value)) {
        return value;
      }

      var me = this,
        v = me.safeParse(value, me.format),
        altFormats = me.altFormats,
        altFormatsArray = me.altFormatsArray;

      if (!v && altFormats) {
        altFormatsArray = altFormatsArray || altFormats.split("|");

        for (var i = 0, len = altFormatsArray.length; i < len && !v; i++) {
          v = me.safeParse(value, altFormatsArray[i]);
        }
      }
      return v;
    },

    onDestroy: function() {
      this.invalidText = this.minValue = this.maxValue = null;

      if (this.menu) {
        this.menu.destroy();
      }
      this.callParent(arguments);
    },

    formatDate: function(date) {
      return Q.isDate(date) ? Q.Date.format(date, this.format) : date;
    },

    onTriggerClick: function() {
      if (this.disabled) {
        return;
      }
      if (this.menu == null) {
        this.menu = new DateMenu({
          hideOnClick: false,
          focusOnSelect: false
        });
      }

      this.onFocus();

      Q.extend(this.menu.picker, {
        minDate: this.minValue,
        maxDate: this.maxValue,
        disabledDatesRE: this.disabledDatesRE,
        disabledDatesText: this.disabledDatesText,
        disabledDays: this.disabledDays,
        disabledDaysText: this.disabledDaysText,
        format: this.format,
        showToday: this.showToday,
        startDay: this.startDay
      });

      this.menu.picker.setValue(this.getValue() || new Date());
      this.menu.show(this.wrap, "tl-bl?");
      this.menuEvents('bind');
    },

    menuEvents: function(method) {
      this.menu[method]('select', this.onSelect, this);
      this.menu[method]('hide', this.onMenuHide, this);
      this.menu[method]('show', this.onFocus, this);
    },

    onSelect: function(e, m, dateTime) {
      this.setValue(dateTime);
      this.fire('select', this, dateTime);
      this.menu.hide();
    },

    onMenuHide: function() {
      this.focus(false, 60);
      this.menuEvents('unbind');
    },

    // private
    beforeBlur: function() {
      var v = this.parseDate(this.getRawValue());
      if (v) {
        this.setValue(v);
      }
    }

  });

  return DateField;
});