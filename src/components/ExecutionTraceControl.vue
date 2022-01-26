<template>
<span
  v-if="name"
>
  {{ name }}:
</span>
<span
  v-if="!isNull"
>
  Context: {{ description() }}
</span>
<span
  v-if="hasValue"
>
  Value: {{ value }}
</span>
<div
  v-if="hasChildren"
>
  Children: {{ children.length }}
</div>
</template>

<script>
import { ExecutionTrace } from '../controls/objects';


/**
 * Top-level wrapper for an IterableControl.
 * TODO(IO): This class currently represents both input and output. It's
 * possible to keep one class; however, I would suggest creating a new class
 * to represent outputs (i.e. the execution trace for a plan block), which can
 * be more complex and expressive than inputs, which will likely just be scalar,
 * 1d or 2d arrays.
 */
export default {
  props: ['name', 'getData', 'putData'],
  components: {

  },
  data() {
    return {
      value: null,
    }
  },
  computed: {
    /**
     * Since the execution trace includes the full hierarchy of control
     * structures, not all of which may have a value or children, we get the
     * top-level node with a value
     */
    startNode: function() {
      let node = this.value;
      while (node && node.value == null && node.children.length == 1) {
        node = node.children[0];
      }
      return node;
    },

    isNull: function() {
      let node = this.startNode;
      return !node || node.value == null;
    },

    hasChildren: function() {
      let children = this.children;
      return children && children.length > 0;
    },

    children: function() {
      if (this.isNull) return null;
      return this.startNode.children;
    },

    hasValue: function() {
      return this.getValue != null;
    },

    // TODO: rename
    getValue: function() {
      if (this.isNull) return null;
      return this.startNode.value;
    },

    description: function() {
      let node = this.startNode;
      let description = '';
      // The description includes all nodes between the start node and the root
      // node
      while (node) {
        description = node.context.getDescription() + '->' + description;
        node = node.parent;
        if (node == this.value) break;
      }
      return description;
    }

  },
  methods: {

  },
  mounted() {
    // console.log(this.value);
  },
}
</script>
<style scoped>
</style>
