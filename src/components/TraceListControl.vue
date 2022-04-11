<template>
<div class="iterable-control">
  <div
    v-for="(item, index) in value"
    :key="index + '_' + item"
    :class="'list-element-wrapper ' + (horizontal ? 'h' : 'v')"
  >
    <!-- The child should represent an array -->
    <trace-list-control
      v-if="Array.isArray(item)"
      :index="index"
      :value="item"
      :horizontal="!horizontal"
    />

    <!-- Or a single element -->
    <list-control-element
      v-else
      :index="index"
      :readonly="true"
      :value="item"
      :horizontal="horizontal"
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
  props: ['horizontal', 'index', 'value'],
  components: {
    ListControlElement,
  },
  methods: {
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
