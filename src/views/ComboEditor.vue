<template>
  <!-- Menu bar across the top to allow user to return to homepage -->
  <body>
    <div class="topnav">
      <div style="padding:10px;float:left">
        <div
          style="font-size:28px;font:Abel;color:white;font-weight:bold;float:left;padding-right:10px;padding-top:3px"
        >
          {{ this.project.name }}
        </div>
        <!--
        <button
          @click="saveProject()"
          class="button curve_edge"
          style="float:right;padding:12px;color:white;font-size:15px"
        >
          Save
        </button>
        -->
      </div>
      <div style="padding:10px;float:right">
        <button
          @click="redirectToHomepage()"
          class="homeButton curve_edge"
          style="float:right;padding:12px;color:white"
        >
          <font-awesome-icon icon="home" />
        </button>
      </div>
      <!-- <span style="width:100%;" class="header-footer-item">
        </span> -->
    </div>
    <div>
      <div class="behind">
        <Editor v-if="project.id" :id="project.id" />
        <!-- Because the code editor is a modal, it has to be top-level -->
        <div id="new-block" style="padding:10px;">
          <button
            @click="openBlockCreator()"
            class="button curve_edge"
            style="float:right;padding:12px;color:white;font-size:15px"
          >
            Custom Block
          </button>
        </div>
        <div
          id="block-creator"
          class="curve_edge"
          style="display:none;border:5px solid #4f5ab9"
        >
          <div
            style="padding:10px;font-size:25px;margin: 0 auto;height:20px;font-weight:bold"
          >
            Block Creator
          </div>

          <hr />

          <div style="width:280px;margin: 0 auto;height:43px">
            <div
              style="float:left;font-size:20px;font-weight:bold;padding-top:8px"
            >
              Block Name
            </div>
            <input
              type="text"
              class="center"
              style="border-radius: 10px;float:right"
            />
          </div>

          <hr />

          <div style="margin: 0 auto;width:98%;">
            <div
              style="padding:10px;float:left;font-size:20px;overflow:scroll;width:45%"
            >
              <table id="input-list" style="overflow:scroll">
                <tr style="width:100%">
                  <th>Input Name</th>
                  <th>Input Type</th>
                </tr>
                <tr v-for="input in block_inputs" :key="input">
                  <td>
                    <div>{{ input }}</div>
                  </td>
                  <td>
                    <select name="type" id="type">
                      <option value="other">Other</option>
                      <option value="number">Number</option>
                      <option value="string">String</option>
                    </select>
                  </td>
                </tr>
                <tr>
                  <td>
                    <input
                      type="text"
                      id="input"
                      @keyup.enter="newInput()"
                      @keyup.delete="removeInput()"
                    />
                  </td>
                  <td>
                    <select name="type" id="type">
                      <option value="other">Other</option>
                      <option value="number">Number</option>
                      <option value="string">String</option>
                    </select>
                  </td>
                </tr>
              </table>
            </div>
            <div class="vertical"></div>
            <div
              style="padding:10px;float:right;font-size:20px;margin: 0 auto;;width:45%"
            >
              <table id="input-list" style="width:95%">
                <tr>
                  <th>Output Name</th>
                  <th>Output Type</th>
                </tr>
                <tr v-for="output in block_outputs" :key="output">
                  <td>
                    <div>{{ output }}</div>
                  </td>
                  <td>
                    <select name="type" id="type">
                      <option value="other">Other</option>
                      <option value="number">Number</option>
                      <option value="string">String</option>
                    </select>
                  </td>
                </tr>
                <tr>
                  <td>
                    <input
                      type="text"
                      id="output"
                      @keyup.enter="newOutput()"
                      @keyup.delete="removeOutput()"
                    />
                  </td>
                  <td>
                    <select name="type" id="type">
                      <option value="other">Other</option>
                      <option value="number">Number</option>
                      <option value="string">String</option>
                    </select>
                  </td>
                </tr>
              </table>
            </div>
          </div>

          <div
            style="width:200px;margin: 0 auto;padding:30px;position:absolute; bottom:0;right:33%"
          >
            <div style="padding:10px;float:left">
              <button
                @click="exitBlockCreator()"
                class="button curve_edge"
                style="float:right;padding:12px;color:white;font-size:15px;background-color:#1F1F1F"
              >
                Save
              </button>
            </div>
            <div style="padding:10px;float:right">
              <button
                @click="exitBlockCreator()"
                class="button curve_edge"
                style="float:right;padding:12px;color:white;font-size:15px;background-color:#1F1F1F"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
        <div>
          <CodeEditor
            v-if="showModal"
            :data="editorData"
            @close="showModal = false"
          />
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
      block_inputs: [],
      block_outputs: [],
      project: {},
    };
  },
  methods: {
    saveProject() {
      console.log("Save project from combo editor");
      eventBus.$emit("saveProject", "save project");
    },
    redirectToHomepage() {
      this.$router.push({ path: "/homepage" });
    },
    openBlockCreator() {
      document.getElementById("block-creator").style.display = "block";
    },
    exitBlockCreator() {
      document.getElementById("block-creator").style.display = "none";
      var row = document.getElementById("input-list");
    },
    addInput() {
      var row = document.getElementById("input-list").insertRow(-1);
      row.insertCell(0).innerHTML = '<input type="text" style ="width:120px">';
      row.insertCell(1).innerHTML =
        '<select name="type" id="type"><option value="volvo">Number</option><option value="saab">String</option><option value="mercedes">List</option></select>';
      row.insertCell(2).innerHTML =
        '<button @click="removeInput()" class="button curve_edge" style="float:right;padding:5px;color:white;font-size:10px;background-color:#1F1F1F">Delete</button>';
    },
    removeInput() {
      if (document.getElementById("input").value == "") {
        var inputval = this.block_inputs.pop(this.block_inputs.length - 1);
        if (inputval == null) {
          document.getElementById("input").value = "";
        } else {
          document.getElementById("input").value = inputval;
        }
      }
    },
    newInput() {
      if (document.getElementById("input").value != "") {
        console.log(document.getElementById("input"));
        var inputval = document.getElementById("input").value;
        this.block_inputs.push(inputval);
        document.getElementById("input").value = "";
      }
    },
    removeOutput() {
      if (document.getElementById("output").value == "") {
        var outputval = this.block_outputs.pop(this.block_outputs.length - 1);
        if (outputval == null) {
          document.getElementById("output").value = "";
        } else {
          document.getElementById("output").value = outputval;
        }
      }
    },
    newOutput() {
      if (document.getElementById("output").value != "") {
        console.log(document.getElementById("output"));
        var outputval = document.getElementById("output").value;
        this.block_outputs.push(outputval);
        document.getElementById("output").value = "";
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
/* Add a black background color to the top navigation */
.topnav {
  background-color: rgb(142, 162, 249, 0.95);
  border: solid 2px #4f5ab9;
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
  font-weight: bold;
}

/* Let the editor show behind the menu bar */
.behind {
  position: relative;
  margin-top: -45px; /* opposite of topnav's height */
  height: 100%;
  display: block;
  z-index: 3;
}

.curve_edge {
  border-radius: 10px;
}
.button {
  background: #1f1f1f;
  color: white;
}

.button:hover {
  font-weight: bold;
}

.homeButton {
  background: #1f1f1f;
  color: white;
  font-size:15px;
}

.homeButton:hover {
  font-weight: bold;
  font-size:18px;
}

.wrapper {
  position: absolute;
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

.vertical {
  border-left: 1px solid white;
  height: 60%;
  position: absolute;
  left: 50%;
}
</style>
