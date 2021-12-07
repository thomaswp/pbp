<template>
<div class="list-element-wrapper">
<input
  type="text"
  size="1"
  class="list-element"
  ref="input"
  :readonly="readonly"
  :value="value"
  @input="change($event)"
/>
</div>
</template>

<script>
export default {
  props: ['readonly', 'initValue', 'index'],
  data() {
    return {
      value: this.initValue,
    }
  },
  methods: {
    change(e){
      this.value = +e.target.value;
      this.update();
    },
    update() {
      this.$emit('updated', this.index, this.value)
      this.resize();
    },
    resize() {
      this.$refs.input.style.width = (this.value.toString().length * 0.6) + "em";
    },
  },
  mounted() {
    this.resize();
  }
}
</script>
<style scoped>
    .list-element-wrapper {
        display: inline-block;
        padding: 0;
    }
    .list-element:read-only {
        background-color: #eee;
        cursor: default;
    }
    .list-element {
        padding: 1px;
        border: 1px solid black;
        margin: 0px;
        border-radius: 0;
        max-width: 4em;
        min-width: 1.5em;
    }
</style>
