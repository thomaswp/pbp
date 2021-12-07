<template>
<div class="list-control">
  <ListControlElement
    v-for="(item, index) in value"
    :key="index"
    :index="index"
    :readonly="readonly"
    :initValue="item"
    @updated="update"
  />
</div>
</template>

<script>
import ListControlElement from './ListControlElement.vue';

export default {
  props: ['readonly', 'defaultValue', 'emitter', 'ikey', 'getData', 'putData'],
  components: {
    ListControlElement,
  },
  data() {
    return {
      value: [],
    }
  },
  methods: {
    // change(e){
    //   this.value = e.target.value;
    //   this.update();
    // },
    update(index, value) {
      if (index >= 0 && index < this.value.length) {
        this.value[index] = value;
      }
      if (this.ikey) {
        this.putData(this.ikey, this.value)
        console.log('put', this.value);
      }
      this.emitter.trigger('process');
    }
  },
  mounted() {
    let list = this.getData(this.ikey);
    this.value = list ? list : this.defaultValue;
  }
}
</script>
<style scoped>
  .list-control {
    width: 170px;
    overflow-x: auto;
    white-space: nowrap;
  }
</style>
