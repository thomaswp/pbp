<template>
<div
  class="input-container"
  :class="highlighted ? 'highlighted' : ''"
  ref="container"
>
  <input
    :type="inputType"
    size="1"
    class="list-element"
    ref="input"
    :readonly="readonly"
    :checked="value"
    :value="valueString"
    @input="change"
    @click="checkClick"
  />
</div>
</template>

<script>


import EventBus from '../eventBus'

/**
 * Represents a single element in a ListControl (child or descendant).
 * Editable if not read-only.
 * TODO(IO): Editing is currently buggy and the user's new value is immediately
 * overwritten.
 */
export default {
  props: ['readonly', 'value', 'index', 'horizontal', 'highlighted'],
  computed: {
    inputType: function() {
      const value = this.value;
      if (value == null || Number.isNaN(value)) return 'text';
      if (typeof value === 'number') return 'number';
      if (typeof value === 'string') return 'text';
      if (typeof value === 'boolean') return 'checkbox';
      if (value == null) return 'text';
      console.warn('Unknown type: ', value);
      return 'text';
    },
    valueString: function() {
      return this.value == null ? '\u2205' : this.value;
    },
  },
  methods: {
    change(e){
      const value = this.cast(e.target);
      // console.log('Change: ', this.index, value, e);
      this.update(value);
    },

    cast(input) {
      switch(this.inputType) {
        case 'number': return +input.value;
        case 'checkbox': return input.checked;
        case 'text':
          if (input.value === 'NaN') return Number.NaN;
          break;
      }
      return input.value;
    },

    /**
     * When updated, let my parent know, to propagate up to the editor,
     * so it knows to refresh.
     */
    update(value) {
      this.$emit('updated', this.index, value);
      // this.resize(value);
    },

    /**
     * Resizes the control to the size of its contents (approximately).
     * TODO(IO): This is a quick fix - should have a more robust solution.
     */
    resize() {
      const value = this.valueString;
      let width = value.toString().length * 0.7 + 0.4;
      if (this.inputType == 'checkbox') width = 1;
      if (this.inputType == 'number') width += 0.8;
      if (this.$refs.container) {
        this.$refs.container.style.width = width + "em";
      } else {
        console.warn('no container for: ' + value);
      }
    },

    checkClick(e) {
      if (this.inputType === 'checkbox' && this.readonly) {
        e.preventDefault();
      }
    }
  },

  mounted() {
    this.resize();
    setTimeout(() => {
      this.resize();
    }, 1);
  }
}
</script>
<style scoped>
    .list-element:read-only {
      background-color: #ddd;
      cursor: default;
    }
    .input-container {
      cursor: default;
      margin: 1px;
      border: 1px solid black;
      min-width: 0.5em;
      max-width: 90%;
    }
    .list-element {
      border: 0;
      padding: 1px;
      margin: 0;
      border-radius: 0;
      width: 98%;
    }
    .highlighted {
      border: 2px solid rgb(177, 71, 0);
      margin: 0;
    }
    .highlighted .list-element:read-only {
      background-color: rgb(235, 235, 122);
    }
</style>