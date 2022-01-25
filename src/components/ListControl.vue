<template>
<iterable-control
  :readonly="readonly"
  :initValue="value"
  :index="0"
  :horizontal="false"
  @updated="update"
/>
</template>

<script>
import IterableControl from './IterableControl.vue';

/**
 * Top-level wrapper for an IterableControl.
 */
export default {
  props: ['readonly', 'emitter', 'ikey', 'getData', 'putData'],
  components: {
    IterableControl,
  },
  data() {
    return {
      value: [],
    }
  },
  methods: {
    /**
     * This is called when a child component is updated.
     * We propagate that call up to Rete.js using the "putData" callback.
     * This tells Rete.js to run the program with the updated inputs.
     */
    update(index, value) {
      // console.log('update', index, value);
      this.value = value;
      if (this.ikey) {
        this.putData(this.ikey, this.value);
      }
      this.emitter.trigger('process');
    },
  },
  mounted() {
    // console.log(this.value);
  },
}
</script>
<style scoped>
</style>
