<template>
<input-list-control
  :readonly="readonly"
  :value="value"
  :index="0"
  :horizontal="false"
  @updated="update"
/>
</template>

<script>
import InputListControl from './InputListControl.vue';

/**
 * Top-level wrapper for an IterableControl.
 */
export default {
  props: ['readonly', 'emitter', 'ikey', 'getData', 'putData', 'defaultValue'],
  components: {
    InputListControl,
  },
  data() {
    return {
      value: this.defaultValue,
    }
  },
  methods: {
    update(index, value) {
      // console.log('update', value);
      this.value = value;
      if (this.ikey) {
        this.putData(this.ikey, value);
        this.emitter.trigger('process');
      }
    },
  },
  mounted() {
    this.value = this.getData(this.ikey) || this.defaultValue;
    this.putData(this.ikey, this.value);
  },
}
</script>
<style scoped>
</style>
