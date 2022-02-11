<template>
  <Homepage/>
</template>

<script>
import Editor from './components/Editor.vue'
import CodeEditor from './components/CodeEditor.vue'
import eventBus from './eventBus'
import Homepage from './home_page/homepage.vue'

/**
 * Top-level Vue component which contains the Rete.js editor and modals that go
 * on top of it.
 */
export default {
  name: 'App',
  components: {
    Homepage,
  },
  data() {
    return {
      showModal: false,
      editorData: {},
    };
  },
  mounted() {
    // Register an event handler for showing the code editor
    eventBus.$on('showCodeEditor', (data) => {
      // console.log(data);
      this.editorData = data;
      this.showModal = true;
    });
  },
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  /* margin-top: 60px; */
}
</style>
