<template>
<div class="trace-list-control">
  <div
    v-for="(item, index) in value"
    :key="item"
    :class="'list-element-wrapper ' + (horizontal ? 'h' : 'v')"
  >
    <list-control-element
      :index="index"
      :readonly="true"
      :value="item.value"
      :highlighted="item.context == highlightedContext"
      :horizontal="horizontal"
      @mouseover="setHover(item, true)"
      @mouseleave="setHover(item, false)"
    />
  </div>
</div>
</template>

<script>
import ListControlElement from './ListControlElement.vue';
import EventBus from '../eventBus'

/**
 * Vue component to display an enumeration of values, which can be edited
 * (if not readonly).
 */
export default {
  props: ['horizontal', 'index', 'value'],
  components: {
    ListControlElement,
  },
  data() {
    return {
      highlightedContext: null,
    }
  },
  methods: {

    setHover(item, hover) {
      EventBus.$emit('highlight-trace', hover ? item.context : null);
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
    EventBus.$on('highlight-trace', context => {
      // console.log(context);
      this.highlightedContext = context;
    });
  },
}
</script>
<style scoped>
  .trace-list-control {
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
