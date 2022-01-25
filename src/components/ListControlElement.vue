<template>
<input
  type="text"
  size="1"
  class="list-element"
  ref="input"
  :readonly="readonly"
  :value="value"
  @input="change($event)"
/>
</template>

<script>

/**
 * Represents a single element in a ListControl (child or descendant).
 * Editable if not read-only.
 * TODO: Editing is currently buggy.
 */
export default {
  props: ['readonly', 'initValue', 'index', 'horizontal'],
  data() {
    // console.log(this.initValue);
    return {
      value: this.initValue,
    }
  },
  methods: {
    change(e){
      this.value = e.target.value;
      this.update();
    },

    /**
     * When updated, let my parent know, to propagate up to the editor,
     * so it knows to refresh.
     */
    update() {
      this.$emit('updated', this.index, this.value);
      this.resize();
    },

    /**
     * Resizes the control to the size of its contents (approximately).
     * TODO: This is a quick fix - should have a more robust solution.
     */
    resize() {
      if (this.value == null) return;
      this.$refs.input.style.width = (this.value.toString().length * 0.6) + "em";
    },
  },

  mounted() {
    this.resize();
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
      min-width: 1em;
    }
</style>
