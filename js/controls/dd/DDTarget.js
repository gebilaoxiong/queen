define(['dd/DragDrop'], function(DragDrop) {

  var DDTarget = Q.Class.define(DragDrop, {

    configuration: function(id, sGroup, config) {
      if (id) {
        this.initTarget(id, sGroup, config)
      }
    },

    getDragEl: Q.noop,
    /**
     * @hide
     * Overridden and disabled. A DDTarget does not support being dragged.
     * @method
     */
    isValidHandleChild: Q.noop,
    /**
     * @hide
     * Overridden and disabled. A DDTarget does not support being dragged.
     * @method
     */
    startDrag: Q.noop,
    /**
     * @hide
     * Overridden and disabled. A DDTarget does not support being dragged.
     * @method
     */
    endDrag: Q.noop,
    /**
     * @hide
     * Overridden and disabled. A DDTarget does not support being dragged.
     * @method
     */
    onDrag: Q.noop,
    /**
     * @hide
     * Overridden and disabled. A DDTarget does not support being dragged.
     * @method
     */
    onDragDrop: Q.noop,
    /**
     * @hide
     * Overridden and disabled. A DDTarget does not support being dragged.
     * @method
     */
    onDragEnter: Q.noop,
    /**
     * @hide
     * Overridden and disabled. A DDTarget does not support being dragged.
     * @method
     */
    onDragOut: Q.noop,
    /**
     * @hide
     * Overridden and disabled. A DDTarget does not support being dragged.
     * @method
     */
    onDragOver: Q.noop,
    /**
     * @hide
     * Overridden and disabled. A DDTarget does not support being dragged.
     * @method
     */
    onInvalidDrop: Q.noop,
    /**
     * @hide
     * Overridden and disabled. A DDTarget does not support being dragged.
     * @method
     */
    onMouseDown: Q.noop,
    /**
     * @hide
     * Overridden and disabled. A DDTarget does not support being dragged.
     * @method
     */
    onMouseUp: Q.noop,
    /**
     * @hide
     * Overridden and disabled. A DDTarget does not support being dragged.
     * @method
     */
    setXConstraint: Q.noop,
    /**
     * @hide
     * Overridden and disabled. A DDTarget does not support being dragged.
     * @method
     */
    setYConstraint: Q.noop,
    /**
     * @hide
     * Overridden and disabled. A DDTarget does not support being dragged.
     * @method
     */
    resetConstraints: Q.noop,
    /**
     * @hide
     * Overridden and disabled. A DDTarget does not support being dragged.
     * @method
     */
    clearConstraints: Q.noop,
    /**
     * @hide
     * Overridden and disabled. A DDTarget does not support being dragged.
     * @method
     */
    clearTicks: Q.noop,
    /**
     * @hide
     * Overridden and disabled. A DDTarget does not support being dragged.
     * @method
     */
    setInitPosition: Q.noop,
    /**
     * @hide
     * Overridden and disabled. A DDTarget does not support being dragged.
     * @method
     */
    setDragElId: Q.noop,
    /**
     * @hide
     * Overridden and disabled. A DDTarget does not support being dragged.
     * @method
     */
    setHandleElId: Q.noop,
    /**
     * @hide
     * Overridden and disabled. A DDTarget does not support being dragged.
     * @method
     */
    setOuterHandleElId: Q.noop,
    /**
     * @hide
     * Overridden and disabled. A DDTarget does not support being dragged.
     * @method
     */
    addInvalidHandleClass: Q.noop,
    /**
     * @hide
     * Overridden and disabled. A DDTarget does not support being dragged.
     * @method
     */
    addInvalidHandleId: Q.noop,
    /**
     * @hide
     * Overridden and disabled. A DDTarget does not support being dragged.
     * @method
     */
    addInvalidHandleType: Q.noop,
    /**
     * @hide
     * Overridden and disabled. A DDTarget does not support being dragged.
     * @method
     */
    removeInvalidHandleClass: Q.noop,
    /**
     * @hide
     * Overridden and disabled. A DDTarget does not support being dragged.
     * @method
     */
    removeInvalidHandleId: Q.noop,
    /**
     * @hide
     * Overridden and disabled. A DDTarget does not support being dragged.
     * @method
     */
    removeInvalidHandleType: Q.noop,

    toString: function() {
      return ("DDTarget " + this.id);
    }
  });

  return DDTarget;
});