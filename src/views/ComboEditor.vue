<template>
    <!-- Menu bar across the top to allow user to return to homepage -->
    <div class="topnav">
        <router-link to="/homepage">To Homepage</router-link>
        <!-- <span style="width:100%;" class="header-footer-item">
        </span> -->
    </div>
    <div class="behind"> 
        <Editor />
        <!-- Because the code editor is a modal, it has to be top-level -->
        <CodeEditor
            v-if="showModal"
            :data="editorData"
            @close="showModal = false"
        />
    </div>
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
  z-index: 5;
  position: relative;
  height: 40px;
}

/* Style the links inside the navigation bar */
.topnav a {
    /* fill the navbar top to bottom */
    height: 100%;
    /* rest on the right side of the navbar */
    float: right;
    /* align vertical within this element */
    display: inline-flex;
    align-items: center;
    /* no vertical padding, but some left and right */
    padding: 0px 16px;
    /* text: near-white, nothing fancy */
    color: #f2f2f2;
    text-decoration: none;
    font-size: 17px;
}

/* Change the color of links on hover */
.topnav a:hover {
  background-color: #ddd;
  color: black;
}

/* Let the editor show behind the menu bar */
.behind {
    position: relative;
    margin-top: -40px; /* opposite of topnav's height */
    display: block;
    z-index: 3;
}
</style>