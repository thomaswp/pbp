<template>
<button id="show-modal" @click="showDefineBehavior">Define Behavior</button>
</template>

<script>

import eventBus from '../eventBus'

/**
 * A button the user clicks to bring up the code editor for a given block.
 */
export default {
  props: ['data'],
  methods: {
    showDefineBehavior() {
      eventBus.$emit('showDefineBehavior', this.data);
    }
  },
  async mounted() {
  }
}
</script>
