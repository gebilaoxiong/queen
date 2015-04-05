define(['controls/QuickTip'], function(QuickTip) {

  var tip,
    disabled = false;

  return {
    init: function(autoRender) {
      var doc;

      if (!tip) {
        tip = new QuickTip({
          disabled: disabled,
          trackMouse: true
        });

        if (autoRender !== false) {
          tip.render(document.body || document.documentElement);
        }
      }
    },

    ddDisable: function() {
      // don't disable it if we don't need to
      if (tip && !disabled) {
        tip.disable();
      }
    },

    // Protected method called by the dd classes
    ddEnable: function() {
      // only enable it if it hasn't been disabled
      if (tip && !disabled) {
        tip.enable();
      }
    },

    enable: function() {
      if (tip) {
        tip.enable();
      }
      disabled = false;
    },

    /**
     * Disable quick tips globally.
     */
    disable: function() {
      if (tip) {
        tip.disable();
      }
      disabled = true;
    },

    /**
     * Returns true if quick tips are enabled, else false.
     * @return {Boolean}
     */
    isEnabled: function() {
      return tip !== undefined && !tip.disabled;
    },

    getQuickTip: function() {
      return tip;
    },

    /**
     * Configures a new quick tip instance and assigns it to a target element.  See
     * {@link Ext.QuickTip#register} for details.
     * @param {Object} config The config object
     */
    register: function() {
      tip.register.apply(tip, arguments);
    },

    /**
     * Removes any registered quick tip from the target element and destroys it.
     * @param {String/HTMLElement/Element} el The element from which the quick tip is to be removed.
     */
    unregister: function() {
      tip.unregister.apply(tip, arguments);
    },

    /**
     * Alias of {@link #register}.
     * @param {Object} config The config object
     */
    tips: function() {
      tip.register.apply(tip, arguments);
    }
  }
});