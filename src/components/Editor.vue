<template>
  <!-- to externally style a multi-root component (as is done in ComboEditor), a workaround is needed. see:
        https://stackoverflow.com/questions/71184146/child-component-with-muti-root-nodes-cannot-be-styled-from-parent-scoped-style
        -->
  <div class="editor" v-bind="$attrs">
    <div class="container-custom">
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
  <!-- <div id="select_libs" align="left">
    <select multiple v-model="project.block_libs">

      <option v-for="cat_name in categoryNames"
          :key="cat_name"
          :value="cat_name">
        {{cat_name}}
      </option>

    </select>
    <br/>
    Block libraries: {{project.block_libs}}
  </div> -->
</template>

<script>
import { NodeEditor, Engine } from "rete";
import ConnectionPlugin from "rete-connection-plugin";
import VueRenderPlugin from "../render/src/index";
import ContextMenuPlugin from '../context-menu/src/index'
import DockPlugin from "rete-dock-plugin";
import AreaPlugin from "rete-area-plugin";
import { BaseComponent, Category, CATEGORY_OTHER } from "../rete-components/general-comp";
import '../rete-components/loop-comp';
import '../rete-components/accumulator-comp';
import '../rete-components/cond-comp';
import '../rete-components/lists-comp';
import '../rete-components/operators-comp';
import "../rete-components/assignments/rainfall-comp";
import "../rete-components/assignments/bunco-comp";
import "../rete-components/assignments/delim-comp";
import "../rete-components/assignments/lightboard-comp";
import "../rete-components/assignments/word-pair-comp";
import "../rete-components/assignments/compress-comp";
import { Loop, RootContext, ValueGenerator } from '../controls/objects';
import { controlSocket, DynamicSocket } from '../rete-components/sockets'
import { CATEGORY_LOOPS } from '../rete-components/loop-comp';
import { CATEGORY_ACCUMULATOR } from '../rete-components/accumulator-comp';
import { CATEGORY_CONDITIONAL } from '../rete-components/cond-comp';
import { CATEGORY_LISTS } from '../rete-components/lists-comp';
import { CATEGORY_OPERATORS } from '../rete-components/operators-comp';
import { CATEGORY_RAINFALL } from '../rete-components/assignments/rainfall-comp';
// for backend integration
import axios from "axios";
import eventBus from "../eventBus";
import { CustomComponent, CustomComponentDescription, CATEGORY_CUSTOM } from "../rete-components/dynamic-comp";


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
        custom_blocks: [],
        block_libs: Array,
      },
      block_inputs: [["", "Other", false]],
      block_outputs: [["", "Other", false]],
      block_name: "",
      options: ["Other", "Number", "String", "Boolean"],
      all_categories: [],
    };
  },
  computed: {
    categoryNames() {
      return this.all_categories.map(cat => cat.name);
    }
  },
  methods: {


    // Handlers for the Custom Block modal

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
    /**
     * Reset the "Custom Block" modal popup
     */
    clearBlockCreator() {
      this.block_name = "";
      this.block_inputs = [["", "Other", false]];
      this.block_outputs = [["", "Other", false]];
    },

    /**
     * When submitting the Custom Block modal, create a new Custom Block
     */
    async submitBlock() {
      // create custom block description, and save to project
      const custom_block = new CustomComponentDescription(this.block_name, this.block_inputs.slice(0, -1), this.block_outputs.slice(0, -1))
      // if custom_blocks not in project, create it
      if (this.project.custom_blocks == undefined) {
        this.project.custom_blocks = [];
      }
      console.log(this.project)
      this.project.custom_blocks.push(custom_block)

      // create new CustomComponent
      const comp = custom_block.createComponent();
      this.editor.register(comp);
      this.engine.register(comp);

      // reset the block creator
      this.clearBlockCreator()

      // create new node to be placed in project
      const node = await comp.createNode();
      // center the new node
      node.position = this.getEditorCenter()
      // subtract a "rough guess" of node width/2 and height/2 to place center of node at center of screen
      node.position[0] -= 180/2; // x -= width/2
      node.position[1] -= 200/2; // y -= height/2
      // place node in project
      this.editor.addNode(node);
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

    /**
     * Retrieve the position describing the center of the editor view
     * credit to:
     * https://github.com/retejs/rete/issues/193#issuecomment-429999945
     */
    getEditorCenter() {
      
      const { container } = this.editor.view.area;
      const [hw, hh] =  [container.clientWidth/2, container.clientHeight/2];
      const { x, y, k } = this.editor.view.area.transform;
          
      const center = [ (hw - x) / k, (hh - y) / k ] // coordinates of the center relative to the viewport in the coordinate system of the scheme

      return center;
    },
  },
  async mounted() {
    var container = this.$refs.nodeEditor;
    var dock = this.$refs.dock;

    const whitelist = [
      CATEGORY_LOOPS,
      CATEGORY_ACCUMULATOR,
      CATEGORY_CONDITIONAL,
      CATEGORY_LISTS,
      CATEGORY_OPERATORS,
      CATEGORY_RAINFALL,
      CATEGORY_OTHER,
      CATEGORY_CUSTOM,
    ];
    this.all_categories = whitelist;

    // Add all sets of components that can be used.
    // TODO(Project): Should probably be configured based on the problem the
    // user is working on.
    var components = Category.getAllComponents();

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

    // const
    editor.use(ContextMenuPlugin, {
      // searchBar: false,
      delay: 100,
      allocate(component) {
        if (!(component instanceof BaseComponent)) return null;
        if (!component.shouldShow(whitelist)) return null;
        const cats = (component.categories || [])
          .filter(cat => whitelist.includes(cat));
        if (cats.length == 0) return null;
        return cats.map(cat => [cat.name]);
      },
      // items: {
      //     'Click me'(){ console.log('Works!') }
      // }
    });

    var engine = new Engine("demo@0.1.0");
    this.engine = engine

    components.map((c) => {
      editor.register(c);
      engine.register(c);
    });

    function propagateUpdate(node) {
      if (!node) return;
      // console.log('updating!', node);
      if (node.vueContext) {
        node.vueContext.$forceUpdate();
      }
      if (!node.outputs) return;
      node.outputs.forEach((output) => {
        output.connections.forEach(con => {
          if (con.input) {
            propagateUpdate(con.input.node);
          }
        });
      });
    }

    editor.on("connectioncreated", async (con) => {
      if (con.input.socket instanceof DynamicSocket) {
        con.input.socket.addConnection(con.output.socket, true);
        propagateUpdate(con.input.node);
      }
      // Shouldn't need to update outputs, since generics updates are
      // currently 1-direction. This may change.
      // if (con.output.socket instanceof DynamicSocket) {
      //   con.output.socket.addConnection(con.input.socket);
      // }
    });

    editor.on("connectionremoved", async (con) => {
      if (con.input.socket instanceof DynamicSocket) {
        con.input.socket.removeConnection(con.output.socket);
        propagateUpdate(con.input.node);
      }
      // if (con.output.socket instanceof DynamicSocket) {
      //   con.output.socket.removeConnection(con.input.socket);
      // }
    });

    editor.on("import", async (e) => {
      editor.nodes.forEach(node => {
        node.outputs.forEach(output => {
          output.connections.forEach(con => {
            if (con.input.socket instanceof DynamicSocket) {
              con.input.socket.addConnection(con.output.socket);
            }
          });
        });
      });
      editor.nodes.forEach(node => {
        if (node.vueContext) {
          node.vueContext.$forceUpdate();
        }
      });
    });

    // Fetch the project associated with the passed ID
    try {
      // Get project data from endpoint
      const response = await axios.get("/api/v1/projects/" + this.id);

      // Parse project data
      this.project = response.data;
      const parsed_data = JSON.parse(this.project.data);
      // console.log("PASSED DATA");
      // console.log(this.project)
      // console.log(parsed_data);
      console.log("loaded block libs:")
      console.log(this.project.block_libs)

      // First abort any current computation
      await engine.abort();

      // load any custom blocks into the editor
      for( var obj of this.project.custom_blocks ) {
        // if the user loads this custom block in a project, routes to homepage,
        // then routes into another project with this custom block (can be the same one),
        // this custom block will already be present in CATEGORY_CUSTOM, so we need to skip registering it
        if (editor.components.has(obj.name)) {
          continue;
        }

        // convert to class
        const custom_block = new CustomComponentDescription(obj);

        // create rete component; register with rete
        const component = custom_block.createComponent();
        editor.register(component);
        engine.register(component);
      }

      // Update the editor to use the project data
      await editor.fromJSON(JSON.parse(this.project.data));

    } catch(error) {
        console.log(error);
    }

    // Anytime the code blocks are edited, recompute the program and save the project.
    editor.on(
      "process nodecreated noderemoved connectioncreated connectionremoved",
      async () => {
        // First abort any current computation
        await engine.abort();

        // TODO: Currently we get the JSON twice (once to run, once to save)
        // to avoid serializing the node output, but this may be inefficient for
        // large programs. Consider optimizing.
        // Then process the workspace, meaning run the program
        await engine.process(editor.toJSON());

        // Since most nodes are lazy-evaluated, we want to
        // make sure each node has been run, even if it's value isn't used.
        editor.nodes.forEach(node => {
          if (node.data.needsExecution && node.data.execute) {
            // TODO: Actually this should probably be a new root context each
            // time, since values calculated on other executions shouldn't count
            node.data.execute(RootContext);
          }
        });
        editor.nodes.forEach(node => {
          const workerResults = node.data.workerResults;
          if (!workerResults) return;
          for (let [key, output] of node.outputs) {
            if (output.connections.length == 0) {
              const out = workerResults[key];
              if (!out) continue;
              // if (out instanceof Loop) {
              //   out.ensureRun();
              //   // console.log(`Running loop ${key} for ${node.name}`);
              // }
              if (out instanceof ValueGenerator && !out.lazy && !out.loop) {
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
        
        // First clear workerResults before serializing
        editor.nodes.forEach(node => node.data.workerResults = undefined);
        // Then get a JSON representation of the current Rete.js workspace
        const json = editor.toJSON();
        // Save it to the database
        this.project.data = JSON.stringify(json);

        // Make API call to save project
        try {
          const response = await axios.put("/api/v1/projects/" + this.id + "/data", this.project);
          console.log("Saved project");
        } catch (err) {
          console.log(err);
        }

        window.setTimeout(() => {
          editor.nodes.forEach((node) => {
            editor.trigger('nodetranslated', { node: node });
          });
        }, 1);
      }
    );

    editor.view.resize();
    AreaPlugin.zoomAt(editor);
    editor.trigger("process");
  },
};
</script>

<style scoped>

.container-custom {
  flex: 1;
  overflow: hidden;
}

.node-editor {
  text-align: left;
  height: 100vh;
  width: 100vw;
}

.editor {
  display: flex;
  flex-wrap: nowrap;
  flex-direction: column;
  height: 100%;
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
.dock ::v-deep(.dock-item) {
  display: inline-block;
  vertical-align: top;
  transform: scale(0.8);
  transform-origin: 50% 0;
}

/* style inputs inside of blocks */
.editor ::v-deep(.node .control > input),
.editor ::v-deep(.node .input-control > input) {
  border-radius: 30px;
  background-color: white;
  padding: 2px 6px;
  border: 1px solid #999;
  font-size: 110%;
  width: 170px;
}

/* color the sockets based on data type */
/* todo: in future versions of Vue, use ::deep()
https://stackoverflow.com/questions/63986278/vue-3-v-deep-usage-as-a-combinator-has-been-deprecated-use-v-deepinner-se
*/

.editor ::v-deep(.socket.number-socket) {
  background: #3647df;
}

.editor ::v-deep(.socket.list-socket) {
  outline: dotted #464646 3px;
  /* border: solid #1d1d1d 6px; */
}

.editor ::v-deep(.socket.loop-socket) {
  outline: solid #464646 3px;
  /* border: solid #660000 6px; */
}

.editor ::v-deep(.socket.string-socket) {
  background: #490d81;
}

.editor ::v-deep(.socket.boolean-socket) {
  background: #42b112;
}

.editor ::v-deep(.socket.any-value-socket) {
  background: #bbb;
}

.editor ::v-deep(.socket.control-socket) {
  background: #aa4d00;
  border-radius: 2px;
}

.editor ::v-deep(.connection.socket-input-control .main-path) {
  stroke: #6e3200;
  stroke-dasharray: 10, 2;
}

#select_libs {
  position: absolute;
  top: 100px;
  left: 40px;
}

</style>
