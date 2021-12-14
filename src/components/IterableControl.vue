<template>
<div class="iterable-control">
  <div
    v-for="(item, index) in initValue"
    :key="index + '_' + item"
  >
    <iterable-control
      v-if="Array.isArray(item)"
      :index="index"
      :readonly="readonly"
      :initValue="item"
      @updated="update"
    />
    <list-control-element
      v-else
      :index="index"
      :readonly="readonly"
      :initValue="item"
      @updated="update"
    />
  </div>
</div>
</template>

<script>
import ListControlElement from './ListControlElement.vue';

export default {
  props: ['readonly', 'horizontal', 'index', 'initValue'],
  components: {
    ListControlElement,
  },
  data() {
    return {
      value: this.initValue,
      setID: 0,
    }
  },
  methods: {
    update(index, value) {
      console.log(this.value);
      if (index >= 0 && index < this.value.length) {
        this.value[index] = value;
      }
      this.$emit('updated', this.index, this.value);
    },
    refresh() {
      // Refreshes the array (e.g. when it get set)
      // so it will re-render
      this.setID++;
    }
  },
  mounted() {
  },
}
</script>
<style scoped>
  .iterable-control {
    width: 170px;
    max-height: 100px;
    overflow-x: auto;
    overflow-y: auto;
    white-space: nowrap;
  }
</style>
