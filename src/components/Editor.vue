<template>
<div>
  <div class="editor">
    <div class="container">
      <div class="wrapper">
        <div class="node-editor" ref="nodeEditor"></div>
      </div>
      <canvas id="canvasOutput"></canvas>
    </div>
    <div class="dock" ref="dock" />
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
                <input type="text" v-model="block_name"/>
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
</div>
</template>

<script>
import { NodeEditor, Engine } from "rete";
import ConnectionPlugin from "rete-connection-plugin";
import VueRenderPlugin from "rete-vue-render-plugin";
// import ContextMenuPlugin from "rete-context-menu-plugin";
import DockPlugin from "rete-dock-plugin";
import AreaPlugin from "rete-area-plugin";
import { GeneralComponents } from "../rete-components/general-comp";
import rainfallComps from "../rete-components/rainfall-comp";
import buncoComps from "../rete-components/bunco-comp";
import delimComps from "../rete-components/delim-comp";
import { Loop, ValueGenerator } from "../controls/objects";
import axios from "axios";
import eventBus from "../eventBus";
import {CustomComponent} from "../rete-components/dynamic-comp";

/**
 * Represents the Rete.js editor, with all components as children.
 */
export default {
  props: ["id"],
  data() {
    return {
      editor: null,
      engine: null,
      project: {
        name: String,
        data: Object,
      },
      block_inputs: [["", "Other", false]],
      block_outputs: [["", "Other", false]],
      block_name: "",
      options: ["Other", "Number", "String", "Boolean"]
    };
  },
  methods: {
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
      var comp = new CustomComponent(this.block_name, this.block_inputs.slice(0, -1), this.block_outputs.slice(0, -1))
      this.editor.register(comp);
      this.engine.register(comp);
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
  },
  async mounted() {
    var container = this.$refs.nodeEditor;
    var dock = this.$refs.dock;

    // Add all sets of components that can be used.
    // TODO(Project): Should probably be configured based on the problem the
    // user is working on.
    var components = [
      ...GeneralComponents,
      ...delimComps,
      ...buncoComps,
      ...rainfallComps,
    ];
    // Rete.js initialization code:

    var editor = new NodeEditor("demo@0.1.0", container);
    this.editor = editor;
    editor.use(ConnectionPlugin);
    editor.use(VueRenderPlugin);
    // editor.use(ContextMenuPlugin);
    editor.use(DockPlugin, {
      container: dock, // html element to which pseudo nodes will be added
      plugins: [VueRenderPlugin], // list with plugins for rendering
      itemClass: "dock-item", // by default: dock-item
    });
    editor.use(AreaPlugin);

    var engine = new Engine("demo@0.1.0");
    this.engine = engine

    components.map((c) => {
      editor.register(c);
      engine.register(c);
    });

    // Fetch the project associated with the passed ID
    // By default, loads the last saved program from localstorage
    // (useful for testing, so you don't have to rebuild each time).
    await axios
      .get("/api/v1/projects/" + this.id)
      .then((response) => {
        this.project = response.data;
        try {
          console.log("PASSED DATA");
          console.log(this.project.data)
          console.log(JSON.parse(this.project.data));
          editor.fromJSON(JSON.parse(this.project.data));
        } catch (error) {
          console.log(error);
        }
      })
      .catch((error) => {
        console.log(error);
      });

    // Anytime the code blocks are edited, recompute the program and save the project.
    editor.on(
      "process nodecreated noderemoved nodetranslate connectioncreated connectionremoved",
      async () => {
        // First abort any current computation
        await engine.abort();

        // Then get a JSON representation of the current Rete.js workspace
        const json = editor.toJSON();
        // Save it to localstorage for easy reloading
        // TODO(Project): This should be actually be save to a database
        this.project.data = JSON.stringify(json);

        await axios
          .put("/api/v1/projects/" + this.id + "/data", this.project)
          .then((response) => {
            console.log("Saved project");
          })
          .catch((error) => {
            console.log(error);
          });

        // Then process the workspace, meaning run the program
        await engine.process(json);

        // Since most nodes are lazy-evaluated, we want to
        // make sure each node has been run, even if it's value isn't used.
        editor.nodes.forEach((node) => {
          const workerResults = node.data.workerResults;
          if (!workerResults) return;
          for (let [key, output] of node.outputs) {
            if (output.connections.length == 0) {
              const out = workerResults[key];
              if (!out) continue;
              if (out instanceof Loop) {
                out.ensureRun();
                // console.log(`Running loop ${key} for ${node.name}`);
              } else if (out instanceof ValueGenerator && !out.lazy) {
                // console.log(`Running gen ${key} for ${node.name}`);
                out.get();
              }
            }
          }
        });

        // Any node control (e.g. preview Component) that has a postProcess
        // method gets it called, so it can update based on computed values.
        editor.nodes.forEach((node) => {
          if (!node.controls) return;
          for (let [key, value] of node.controls) {
            if (value.postProcess) value.postProcess();
          }
        });
      }
    );

    editor.view.resize();
    AreaPlugin.zoomAt(editor);
    editor.trigger("process");
  },
};
</script>

<style scoped>

.container {
  flex: 1;
  overflow: hidden;
}

.node-editor {
  text-align: left;
  height: 100vh;
  width: 100vw;
  resize: vertical;
}

.editor {
  display: flex;
  flex-wrap: nowrap;
  flex-direction: column;
  height: 97vh;
}

.dock {
  height: 100px;
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
  border-top: 1px solid black;
  padding-top: 2px;
  /* background: linear-gradient(0deg,#ddd 90%,transparent); */
  /* opacity: 0.7; */
}


/* Selectors using v-deep to style inside of child components */

/* Blocks in the bottom dock */
.dock::v-deep .dock-item {
  display: inline-block;
  vertical-align: top;
  transform: scale(0.8);
  transform-origin: 50% 0;
}

/* style inputs inside of blocks */
.editor::v-deep .node .control > input,
.editor::v-deep .node .input-control > input {
  border-radius: 30px;
  background-color: white;
  padding: 2px 6px;
  border: 1px solid #999;
  font-size: 110%;
  width: 140px;
}

/* color the sockets based on data type */
.editor::v-deep .socket.number-value {
  background: #3647df;
}
.editor::v-deep .socket.list-value {
  background: #c4021c;
}
.editor::v-deep .socket.loop-value {
  background: #c9c616;
}
.editor::v-deep .socket.predicate-value {
  background: #30810d;
}
.editor::v-deep .socket.string-value {
  background: #490d81;
}
.editor::v-deep .socket.boolean-value {
  background: #42b112;
}
</style>
