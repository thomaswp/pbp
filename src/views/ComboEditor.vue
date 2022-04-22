<template>
  <!-- Menu bar across the top to allow user to return to homepage -->
  <body>
    <!-- Setup navbar across the top -->
  <nav class="navbar navbar-expand-md navbar-dark bg-cshelp"
      id="navbar" ref="navbar">
    <div class="container-fluid">

      <!-- Hamburger menu icon - shows when the screen is too narrow -->
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
      <!-- Collapsible navbar -->
      <div class="collapse navbar-collapse" id="navbarSupportedContent">

        <!-- Setup contents:
              navbar-nav:   mark this as "navbar contents"
              me-auto:      anything after this floats right
              mb-2 mb-lg-0: no bottom margin
        -->
        <div class="navbar-nav me-auto">

          <!-- format like a navbar element, which are usually links -->
          <span class="navbar-brand"><b>{{this.project.name}}</b></span>

        </div>

        <!-- Right-aligned button (bc fo me-auto above) -->
        <div style="padding-right:15px">
          <button 
              class="btn btn-dark"
              @click="exportProject()">
            <div>Export</div>
          </button>
        </div>
        <div class="d-flex" style="padding-right:5px">
          <button 
              class="btn btn-dark"
              @click="redirectToHomepage()">
            <font-awesome-icon icon="home" />
          </button>
        </div>
          
      </div>
    </div>
  </nav>
  <div>
    <div class="behind">
    <Editor v-if="project.id" :id="project.id" />
    <!-- Because the code editor is a modal, it has to be top-level -->
    <div id="new-block" style="padding:10px;">
      <button class="btn btn-dark" data-bs-toggle="modal" data-bs-target="#customBlockModal">
        Custom Block
      </button>
    </div>
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
import Editor from "../components/Editor.vue";
import CodeEditor from "../components/CodeEditor.vue";
import eventBus from "../eventBus";
import axios from "axios";
/**
 * Top-level Vue component which contains the Rete.js editor and modals that go
 * on top of it.
 */
export default {
  name: "App",
  components: {
    Editor,
    CodeEditor,
  },
  data() {
    return {
      showModal: false,
      editorData: {},
      block_inputs: [["", "Other", false]],
      block_outputs: [["", "Other", false]],
      project: {},
      options: ["Other", "Number", "String", "Boolean"]
    };
  },
  methods: {
    exportProject() {
      const filename = this.project.name.split(' ').join('') + ".json";

      axios
        .get("/api/v1/projects/"+this.project.id)
        .then((response) => {
          this.project = response.data;

          const jsonStr = JSON.stringify(this.project);

          let element = document.createElement('a');
          element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(jsonStr));
          element.setAttribute('download', filename);

          element.style.display = 'none';
          document.body.appendChild(element);

          element.click();

          document.body.removeChild(element);
        })
        .catch((error) => {
          console.error(error);
          this.$router.push({ path: "/login" });
        });
    },
    redirectToHomepage() {
      this.$router.push({ path: "/homepage" });
    },
    getProject() {
      axios
        .get("/api/v1/projects/" + this.$route.params.id)
        .then((response) => {
          this.project = response.data;
        })
        .catch((error) => {
          console.log(error);
        });
    },
  },
  mounted() {
    this.getProject();
    
    // Register an event handler for showing the code editor
    eventBus.$on("showCodeEditor", (data) => {
      // console.log(data);
      this.editorData = data;
      this.showModal = true;
    });
  },
};
</script>

<style scoped>

/* General-purpose background & text color class */
.bg-cshelp {
  background: #8ea2f9;
  color: white;
}

/* Format buttons like we want */
.btn-cshelp {
  border: solid 1px #4f5ab9;
  background: #8ea2f9;
  color: white;
}
.btn-cshelp:hover {
  background: #748bf1;
}

/* Big border in the "cs-help dark" color */
#navbar {
  border-bottom: solid 3px #4f5ab9;
}

/* Otherwise we get a little white bar at the bottom of the tabs */
.nav-tabs {
  border-bottom: none;
}

/* Style all nav tabs */
.nav-tabs .nav-link {
  /* Left corners are curved */
  border-top-left-radius: 1rem;
  border-bottom-left-radius: 1rem;
  /* Right corners are flat */
  border-top-right-radius: 0rem;
  border-bottom-right-radius: 0rem;
  /* Border color is dark */
  border-width: 0px;
}

/* Inactive nav tabs */
.nav-tabs .nav-link:not(.active) {
  /* Text is white */
  color: lightgray;
}
.nav-tabs .nav-link:not(.active):hover {
  /* Change text color of buttons on hover */
  color: white;
  background-color: var(--bs-gray-800);
}

#new-block {
  position: absolute;
  bottom: 130px;
  left: 10px;

  /*
  *  Styling only, the below can be changed or removed
  *  depending on your use case
  */
  height: 20px;
  padding: 10px 10px;
}

#block-creator {
  position: absolute;
  top: 10%;
  left: 22%;
  background-color: rgb(142, 162, 249, 0.95);
  color: white;

  width: 56%;
  height: 70%;
}

</style>
