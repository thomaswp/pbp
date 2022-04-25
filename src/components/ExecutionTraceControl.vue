<template>
<div class="component">
<div
  v-if="name"
  class="field"
>
  {{ name }}:
</div>
<div class="container">
<div
  v-if="!isNull"
  class="context"
>
  {{ description }}
</div>
<!-- <span
  v-if="hasValue"
  class="value"
>
  {{ value }}
</span> -->
<list-control-element
  v-if="hasValue"
  :value="value"
  :readonly="true"
  :index="0"
/>
<div
  class="children"
  v-if="hasChildren"
>
  <!-- Children: {{ children.length }} -->
  <div
    v-if="simpleChildValues"
  >
    <trace-list-control
      :value="children"
      :index="0"
      :horizontal="true"
    />
  </div>
  <div v-else>
    <div
      class="child"
      v-for="(item, index) in children"
      :key="index + '_' + item.context.id"
    >
      <execution-trace-control
        :initialTrace="item"
      />
    </div>
  </div>
</div>
</div>
</div>
</template>

<script>

import { ExecutionTrace } from '../controls/objects';
import TraceListControl from './TraceListControl.vue';
import ListControlElement from './ListControlElement.vue'

/**
 * Component to display an ExecutionTrace.
 * TODO(IO): This is just a rough skeleton to show you how to navigate the
 * trace. It's up to you to determine a good UI for displaying the trace and
 * relevant contextual data
 */
export default {
  props: ['name', 'initialTrace', 'getData', 'putData'],
  components: {
    TraceListControl,
    ListControlElement,
  },
  data() {
    return {
      trace: this.initialTrace,
    }
  },
  computed: {
    /**
     * Since the execution trace includes the full hierarchy of control
     * structures, not all of which may have a value or children, we get the
     * top-level node with a value
     */
    startNode: function() {
      let node = this.trace;
      while (node && node.value == null && node.children.length == 1) {
        node = node.children[0];
      }
      return node;
    },

    /** Returns true if there is no trace to display. */
    isNull: function() {
      return !this.startNode;
    },

    /**
     * Get the children of the startNode as an array.
     */
    children: function() {
      if (this.isNull) return null;
      const childMap = this.startNode.children;
      if (!childMap) return null;
      return Array.from(childMap.values());
    },

    /** Returns true if the startNode has children. */
    hasChildren: function() {
      let children = this.children;
      return children && children.length > 0;
    },

    /** Gets the value (if any) of this startNode. */
    value: function() {
      if (this.isNull) return null;
      const value = this.startNode.value;
      // TODO(IO) come up with representations of other data types,
      // ideally better than strings
      // if (value === true) return '\u2611';
      // if (value === false) return '\u2610'
      return value;
    },

    /** Returns true if the startNode has a value. */
    hasValue: function() {
      return this.value !== null;
    },

    description: function() {
      if (this.isNull) return '';
      return this.startNode.context.getDescription();
    },

    /**
     * Returns a rough description of the context in which this node's value was
     * generated.
     */
    fullDescription: function() {
      let node = this.startNode;
      let description = '';
      // The description includes all nodes between the start node and the root
      // node
      while (node) {
        if (description.length > 0) description = '->' + description;
        description = node.context.getDescription() + description;
        node = node.parent;
        if (node == this.value) break;
      }
      return description;
    },

    /**
     * If the startNode has children with values (but no grandchildren), return
     * an array of the children's values.
     * TODO(IO): It's likely you'll want to create a custom display logic for
     * different types of contexts, such as running inside of a loop, nested
     * loop or conditional.
     */
    simpleChildValues: function() {
      const children = this.children;
      if (!children) return null;
      const values = [];
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.value === null || child.children.size > 0) return null;
        values.push(child.value);
      }
      return values;
    },

  },
  methods: {

  },
  mounted() {
    // console.log(this.value);
  },
}
</script>

<style scoped>
  .container {
    max-width: 170px;
    max-height: 100px;
    overflow-x: auto;
    overflow-y: auto;
    white-space: nowrap;
    /* border: 1px solid #333;
    border-radius: 5px; */
    padding: 4px;
  }
  .field {
    color: #fff;
  }
  .context {
    color: #fff;
  }
  .value {
    font-size: 12pt;
    border: 1px solid black;
    border-radius: 4px;
    background-color: #ddd;
    padding: 3px;
  }
</style>
