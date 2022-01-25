<template>
<div class="iterable-control">
  <div
    v-for="(item, index) in initValue"
    :key="index + '_' + item"
    :class="'list-element-wrapper ' + (horizontal ? 'h' : 'v')"
  >
    <!-- The child should represent an array -->
    <iterable-control
      v-if="Array.isArray(item)"
      :index="index"
      :readonly="readonly"
      :initValue="item"
      :horizontal="!horizontal"
      @updated="update"
    />

    <!-- Or a single element -->
    <list-control-element
      v-else
      :index="index"
      :readonly="readonly"
      :initValue="item"
      :horizontal="horizontal"
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
  props: ['readonly', 'horizontal', 'index', 'initValue'],
  components: {
    ListControlElement,
  },
  data() {
    return {
      setID: 0,
    }
  },
  methods: {

    /**
     * When a child is updated, this method will be called.
     * It should propagate the update to its parent.
     */
    update(index, value) {
      const list = this.initValue.slice();
      // console.log('Update iterable', this.value, index, value);
      if (index >= 0 && index < list.length) {
        list[index] = value;
      }
      this.$emit('updated', this.index, list);
    },

    /**
     * Refreshes the array (e.g. when it get set) so it will re-render.
     * This is necessary because Vue will not refresh when an array value
     * changes.
     * See here for more: https://stackoverflow.com/a/45336400/816458
     * TODO(IO): This is a fairly brittle system - could be improved.
     */
    refresh() {
      this.setID++;
    }
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
