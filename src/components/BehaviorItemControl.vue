<template>
  <!-- One element -->
  <list-control-element
    v-if="!isList"
    :index="0"
    :readonly="false"
    :value="modelValue"
    :highlighted="false"
    :socket="socket"
    @updated="update"
  />
  <!-- Multiple elements -->
  <div
    class="iterable-control"
    v-else
  >
    <!-- May have some issues with "undefined" -->
    <div
      v-for="(item, index) in modelValue"
      :key="index"
      class="list-element-wrapper v"
    >
      <list-control-element
        :index="index"
        :readonly="false"
        :value="item"
        :highlighted="false"
        :socket="socket"
        @updated="update"
      />
  </div>
</div>
</template>

<script>
import { GenericListSocket } from '../rete-components/sockets';
import ListControlElement from './ListControlElement.vue';

export default {
  props: ['modelValue', 'socket'],
  components: {
    ListControlElement,
  },
  data() {
    return {
    }
  },
  computed: {
    isList() {
      return this.socket instanceof GenericListSocket;
    },
    itemSocket() {
      if (this.isList) return this.socket.genericType;
      return this.socket;
    },
  },
  methods: {
    update(index, value) {
      if (this.isList) {
        const list = this.modelValue.slice();
        list[index] = value;
        this.$emit('update:modelValue', list);
      } else {
        this.$emit('update:modelValue', value);
      }
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
