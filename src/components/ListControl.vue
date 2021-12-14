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
    this.value = this.getData(this.ikey);
  },
}
</script>
<style scoped>
</style>
