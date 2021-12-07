<template>
<input
  type="text"
  :readonly="readonly"
  :value="value"
  @input="change($event)"
  @dblclick.stop=""
  @pointerdown.stop=""
  @pointermove.stop=""
/>
</template>

<script>
export default {
  props: ['readonly', 'emitter', 'ikey', 'getData', 'putData'],
  data() {
    return {
      value: [],
    }
  },
  methods: {
    change(e){
      this.value = e.target.value;
      this.update();
    },
    update() {
      if (this.ikey) {
        this.putData(this.ikey, this.value)
      }
      this.emitter.trigger('process');
    }
  },
  mounted() {
    let list = this.getData(this.ikey);
    this.value = list ? list.toString() : 'null';
  }
}
</script>
