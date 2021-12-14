<template>
<iterable-control
  :readonly="readonly"
  :initValue="value"
  :index="0"
  @updated="update"
/>
</template>

<script>
import IterableControl from './IterableControl.vue';
import { ValueGenerator, Loop } from '../controls/objects'

export default {
  props: ['readonly', 'defaultValue', 'emitter', 'ikey', 'getData', 'putData'],
  components: {
    IterableControl,
  },
  data() {
    return {
      value: [],
    }
  },
  methods: {
    update(index, value) {
      this.value = value;
      if (this.ikey) {
        this.putData(this.ikey, this.value);
      }
      this.emitter.trigger('process');
    },
    refresh() {
      // console.warn('no refresh')
    }
  },
  mounted() {
    let val = this.getData(this.ikey);
    val = val ? val : this.defaultValue;
    
    // TODO: This needs to go in IterableControl, but that
    // seems to crash things
    // Also, I'm afraid things like .toList won't work because
    // they're logic, and I need to cache the values like in gen's preview
    if (val instanceof ValueGenerator) {
      const gen = val;
      this.val = ['Out:'];
      gen.preview = (v) => {
        val.push(v);
        this.value = val.slice();
      };
    } else if (val instanceof Loop) {
      // TODO: this maybe should have preview function too?
      this.value = val.toList();
    } else if (val != null && (val instanceof String || !val.length)) {
      this.value = [val];
    }
  },
}
</script>
<style scoped>
</style>
