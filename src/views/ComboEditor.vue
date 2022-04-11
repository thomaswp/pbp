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
    <!-- Custom Block Modal -->
    <div class="modal fade" id="customBlockModal" tabindex="-1">
      <div class="modal-dialog modal-lg" style="mid-width:100px">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="exampleModalLabel">Custom Block Designer</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="container">
            <div class="row" style="height:60px; border-bottom: 1px solid #000; border-top: 1px solid #000;vertical-align:middle;padding-top:13px">
              <div class="col">
                Block Name
                <input type="text"/>
              </div>
            </div>
            <div class = "row">
              <div class = "col" style="width:50%;">
                <div class="container">
                  <div class="row" style="height:40px;vertical-align:middle;padding-top:10px">
                    <div class="col-5">
                      Input Name
                    </div>
                    <div class="col-5">
                      Input Type
                    </div>
                    <div class="col">
                      List?
                    </div>
                  </div>
                  <!--INPUTS TABLE-->
                  <div class="row" style="height:40px;vertical-align:middle"
                    v-for="(input, index) in this.block_inputs"
                    :key="index"
                    :id="'input_' + index">
                    <div class="col-5" style="text-align:center">
                      <input type="text" style="width:95%" :value="input[0]" @keyup="handleInputs(index)"/>
                    </div>
                    <div class = "col-5">
                      <select style="width:95%;height:30px" :value="input[1]" @change='updateType(index, "input")'>
                        <option v-for="option in options" :key="option" :value="option">{{option}}</option>
                      </select>
                    </div>
                    <div class="col" style="text-align:center">
                      <input type="checkbox" :checked="input[2]" @click="updateChecked(index, 'input')"/>
                    </div>
                  </div>
                </div>
              </div>
              <div class = "col" style="width:50%;">
                <div class="container">
                  <div class="row" style="height:40px;vertical-align:middle;padding-top:10px">
                    <div class="col-5">
                      Output Name
                    </div>
                    <div class="col-5">
                      Output Type
                    </div>
                    <div class="col">
                      List?
                    </div>
                  </div>
                  <!--OUTPUTS TABLE-->
                  <div class="row" style="height:40px;vertical-align:middle"
                    v-for="(output, index) in this.block_outputs"
                    :key="index"
                    :id="'output_' + index">
                    <div class="col-5">
                      <input type="text" style="width:95%" :value="output[0]" @keyup="handleOutputs(index)"/>
                    </div>
                    <div class="col-5">
                      <select style="width:95%;height:30px" :value="output[1]" @change='updateType(index, "output")'>
                        <option v-for="option in options" :key="option" :value="option">{{option}}</option>
                      </select>
                    </div>
                     <div class="col">
                      <input type="checkbox" :checked="output[2]" @click="updateChecked(index, 'output')"/>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary"
                data-bs-dismiss="modal" @click="clearBlockCreator()">
              Cancel
            </button>
            <button type="button" class="btn btn-primary" @click="submitBlock()" data-bs-dismiss="modal">
              Create Block
            </button>
          </div>
        </div>
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
      const jsonStr = JSON.stringify(this.project);

      let element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(jsonStr));
      element.setAttribute('download', filename);

      element.style.display = 'none';
      document.body.appendChild(element);

      element.click();

      document.body.removeChild(element);
    },
    redirectToHomepage() {
      this.$router.push({ path: "/homepage" });
    },
    updateType(index, type) {
      if(type == "output") {
        var id = "output_"+index
        var value = document.getElementById(id).children[1].firstElementChild.value
        this.block_outputs[index][1] = value
      }
      else {
        id = "input_"+index
        value = document.getElementById(id).children[1].firstElementChild.value
        console.log(value)
        this.block_inputs[index][1] = value
      }
    },
    clearBlockCreator() {
      this.block_inputs = [["", "Other", false]]
      this.block_outputs = [["", "Other", false]]
    },
    submitBlock() {
      console.log("Add submit block code here")
      this.clearBlockCreator()
    },
    updateChecked(index, type) {
      if(type == "output") {
        var id = "output_"+index
        var value = document.getElementById(id).children[2].firstElementChild.checked
        console.log(value)
        this.block_outputs[index][2] = value
      }
      else {
        id = "input_"+index
        value = document.getElementById(id).children[2].firstElementChild.checked
        console.log(value)
        this.block_inputs[index][2] = value
      }
    },
    handleOutputs(index) {
      var id = "output_"+index
      if (index == this.block_outputs.length - 1) {
        var input = document.getElementById(id).firstElementChild.firstElementChild.value
        if(input.length > 0) {
          this.block_outputs[index][0] = input
          this.block_outputs.push(["", "Other", false])
        }
      }
      else {
        input = document.getElementById(id).firstElementChild.firstElementChild.value
        if (input.length == 0) {
          this.block_outputs.splice(index, 1)
        }
        else {
          this.block_outputs[index][0] = input
        }
      }
    },
    handleInputs(index) {
      var id = "input_"+index
      if (index == this.block_inputs.length - 1) {
        var input = document.getElementById(id).firstElementChild.firstElementChild.value
        if(input.length > 0) {
          this.block_inputs[index][0] = input
          this.block_inputs.push(["", "Other", false])
        }
      }
      else {
        input = document.getElementById(id).firstElementChild.firstElementChild.value
        if (input.length == 0) {
          this.block_inputs.splice(index, 1)
        }
        else {
          this.block_inputs[index][0] = input
        }
      }
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
