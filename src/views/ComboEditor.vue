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
            <span class="navbar-brand" ><b>{{name}}</b></span>
            <span
              class="navbar-brand"
              v-if="!isOnline"
            >[Editing Offline]</span>

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
        <!-- Specific styling to set height to "everything except the navbar" -->
        <Editor
          v-if="projectID"
          ref="editor"
          :id="projectID"
          @projectLoaded="projectLoaded"
          style="height: calc(100vh - 60px)"
          />
        <!-- Because the code editor is a modal, it has to be top-level -->
        <div id="new-block" style="padding:10px;">
          <button class="btn btn-dark" data-bs-toggle="modal" data-bs-target="#customBlockModal">
            Custom Block
          </button>
        </div>
        <!-- Because the code editor is a modal, it has to be top-level -->
        <CodeEditor
          v-if="showModal"
          :data="editorData"
          @close="showModal = false"
        />
        <BehaviorControl
          v-if="showBehaviorModal"
          :data="behaviorData"
          @close="showBehaviorModal = false"
        />
      </div>
    </div>
  </body>
</template>

<script>
import Editor from "../components/Editor.vue";
import CodeEditor from "../components/CodeEditor.vue";
import BehaviorControl from "../components/BehaviorControl.vue";
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
    BehaviorControl,
  },
  data() {
    return {
      showModal: false,
      editorData: {},
      block_inputs: [["", "Other", false]],
      block_outputs: [["", "Other", false]],
      options: ["Other", "Number", "String", "Boolean"],
      showBehaviorModal: false,
      behaviorData: {},
      name: '',
      isOnline: true,
    };
  },
  computed: {
    projectID() {
      return this.$route?.params?.id;
    },
  },
  methods: {
    projectLoaded(project) {
      this.name = project.name;
      // TODO: Right now this is only updated on project load, but it should
      // be updated via callback every time the property is updated in Editor.
      // For a user-facing verison, it should also include a button to retry.
      this.isOnline = this.$refs.editor?.isOnline;
    },

    exportProject() {
      this.$refs.editor?.exportProject();
    },

    redirectToHomepage() {
      this.$router.push({ path: "/homepage" });
    },
  },
  mounted() {
    // Register an event handler for showing the code editor
    eventBus.$on("showCodeEditor", (data) => {
      // console.log(data);
      this.editorData = data;
      this.showModal = true;
    });

    eventBus.$on('showDefineBehavior', (data) => {
      // console.log(data)
      this.behaviorData = data;
      this.showBehaviorModal = true;
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
  height: 60px; /* hardcoded so that the editor can have the correct height. otherwise, would require JS */
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
  bottom: 150px;
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
