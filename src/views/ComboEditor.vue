<template>
  <!-- Menu bar across the top to allow user to return to homepage -->
  <div class="topnav">
    <router-link to="/homepage">To Homepage</router-link>
  </div>
  <Editor />
  <!-- Because the code editor is a modal, it has to be top-level -->
  <CodeEditor
    v-if="showModal"
    :data="editorData"
    @close="showModal = false"
  />
</template>

<script>
import Editor from '../components/Editor.vue'
import CodeEditor from '../components/CodeEditor.vue'
import eventBus from '../eventBus'
/**
 * Top-level Vue component which contains the Rete.js editor and modals that go
 * on top of it.
 */
export default {
  name: 'App',
  components: {
    Editor,
    CodeEditor,
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
/* Add a black background color to the top navigation */
.topnav {
  background-color: #333;
  overflow: hidden;
}

/* Style the links inside the navigation bar */
.topnav a {
  float: right;
  color: #f2f2f2;
  text-align: center;
  padding: 14px 16px;
  text-decoration: none;
  font-size: 17px;
}

/* Change the color of links on hover */
.topnav a:hover {
  background-color: #ddd;
  color: black;
}
</style>