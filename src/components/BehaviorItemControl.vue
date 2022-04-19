<template>
<div class="iterable-control">
  <div
    v-for="(item, index) in value"
    :key="index"
    :class="'list-element-wrapper ' + (horizontal ? 'h' : 'v')"
  >
    <!-- The child should represent an array -->
    <input-list-control
      v-if="Array.isArray(item)"
      :index="index"
      :readonly="readonly"
      :value="item"
      :horizontal="!horizontal"
      @updated="update"
    />

    <!-- Or a single element -->
    <list-control-element
      v-else
      :index="index"
      :readonly="readonly"
      :value="item"
      :horizontal="horizontal"
      :highlighted="false"
      @updated="update"
    />
  </div>
</div>
</template>

<script>
import ListControlElement from './ListControlElement.vue';

/**
 * Vue component to display an enumeration of values, which can be edited
 * (if not readonly).
 */
export default {
  props: ['readonly', 'horizontal', 'index', 'value'],
  components: {
    ListControlElement,
  },
  data() {
    return {
    }
  },
  methods: {

    /**
     * When a child is updated, this method will be called.
     * It should propagate the update to its parent.
     */
    update(index, value) {
      const list = this.value.slice();
      list[index] = value;
      this.$emit('updated', this.index, list);
    },
  },
  mounted() {
  },
}
</script>
<style scoped>
  .iterable-control {
    max-width: 170px;
    max-height: 100px;
    overflow-x: auto;
    overflow-y: auto;
    white-space: nowrap;
  }
  .list-element-wrapper {
    padding: 0;
  }
  .list-element-wrapper.h {
    display: inline-block;
  }
</style>
