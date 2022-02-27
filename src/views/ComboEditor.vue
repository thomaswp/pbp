<template>
    <!-- Menu bar across the top to allow user to return to homepage -->
    <body>
    <div class="topnav">
        <div style="height:65px;float:left;font-size:28px;padding:15px;font:Abel;color:white;font-weight:bold;display:table-cell">Untitled 1</div>
        <div style="padding:10px;display:table-cell">
            <button @click="redirectToHomepage()" class="button curve_edge" style="float:left;padding:12px;color:white;font-size:15px">Save</button>
        </div>
        <div style="padding:10px;display:table-cell">
            <button @click="redirectToHomepage()" class="button curve_edge" style="float:left;padding:12px;color:white;font-size:15px">Archive</button>
        </div>
        <div style="width:80%;display:table-cell"></div>
        <div style="padding:10px;display:table-cell">
            <button @click="redirectToHomepage()" class="button curve_edge" style="float:right;padding:12px;color:white;font-size:15px">Home</button>
        </div>
        <!-- <span style="width:100%;" class="header-footer-item">
        </span> -->
    </div>
    <div>
      <div class="behind"> 
         <Editor />
          <!-- Because the code editor is a modal, it has to be top-level -->
          <CodeEditor
              v-if="showModal"
             :data="editorData"
             @close="showModal = false"
         />
      </div>
    </div>
    </body>
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
  methods: {
    redirectToHomepage() {
        this.$router.push({ path: '/homepage'});
    },
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
  background-color: #1F1F1F;
  overflow: hidden;
  z-index: 5;
  position: relative;
  height: 65px;
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
  font-weight:bold;
}

/* Let the editor show behind the menu bar */
.behind {
    position: relative;
    margin-top: -40px; /* opposite of topnav's height */
    display: block;
    z-index: 3;
}

.curve_edge {
    border-radius: 10px;
}
.button {
    background:#6E7DAB;
    color:white;
}

.button:hover {
  font-weight:bold;
}
</style>