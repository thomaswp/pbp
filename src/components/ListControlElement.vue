<template>
<input
  :type="inputType"
  size="1"
  class="list-element"
  ref="input"
  :readonly="readonly"
  :value="value"
  @input="change"
/>
</template>

<script>

/**
 * Represents a single element in a ListControl (child or descendant).
 * Editable if not read-only.
 * TODO(IO): Editing is currently buggy and the user's new value is immediately
 * overwritten.
 */
export default {
  props: ['readonly', 'value', 'index', 'horizontal'],
  data() {
    // console.log('Init', this.value);
    return {
      // value: this.initValue,
    }
  },
  computed: {
    inputType: function() {
      const value = this.value;
      if (typeof value === 'number') return 'number';
      if (typeof value === 'string') return 'text';
      if (typeof value === 'boolean') return 'checkbox';
      if (value == null) return 'text';
      console.warn('Unknown type: ', value);
      return 'text';
    },
    // valueString: function() {
    //   // TODO(IO) make this consistent with ExecutionTraceControl
    //   const value = this.value;
    //   if (value === null) return '\u2205'
    //   if (value === true) return '\u2611';
    //   if (value === false) return '\u2610';
    //   return value;
    // },
  },
  methods: {
    change(e){
      const value = this.cast(e.target.value);
      // console.log('Change: ', this.index, value, e);
      this.update(value);
    },

    cast(value) {
      switch(this.inputType) {
        case 'number': return +value;
        // TODO: probably wrong
        case 'checkbox': return value == 'true';
        default: return value;
      }
    },

    /**
     * When updated, let my parent know, to propagate up to the editor,
     * so it knows to refresh.
     */
    update(value) {
      this.$emit('updated', this.index, value);
      this.resize(value);
    },

    /**
     * Resizes the control to the size of its contents (approximately).
     * TODO(IO): This is a quick fix - should have a more robust solution.
     */
    resize(value) {
      // console.log(value);
      if (value == null || this.inputType == 'checkbox') return;
      let width = value.toString().length * 0.6 + 0.3;
      if (this.inputType == 'number') width += 0.8;
      this.$refs.input.style.width = width + "em";
      // console.log(this.$refs.input.style.width);
    },
  },

  mounted() {
    this.resize(this.value);
    setTimeout(() => {
      this.resize(this.value);
    }, 1);
  }
}
</script>
<style scoped>
    .list-element:read-only {
      background-color: #ddd;
      cursor: default;
    }
    .list-element {
      padding: 1px;
      border: 1px solid black;
      margin: 0px;
      border-radius: 0;
      width: auto;
      max-width: 90%;
      min-width: 0.5em;
    }
</style>