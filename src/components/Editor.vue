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
  <div id="select_libs" align="left">
    <select multiple v-model="project.block_libs">

      <option v-for="cat_name in categoryNames"
          :key="cat_name"
          :value="cat_name">
        {{cat_name}}
      </option>

    </select>
    <br/>
    Block libraries: {{project.block_libs}}
  </div>
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

/*
TODO bug causing streams to not save their connections

rete.esm.js?f5d5:580 Error: Sockets not compatible
    at Output.connectTo (rete.esm.js?f5d5:1957:1)
    at NodeEditor.connect (rete.esm.js?f5d5:1743:1)
    at eval (rete.esm.js?f5d5:1901:1)
    at Array.forEach (<anonymous>)
    at eval (rete.esm.js?f5d5:1891:1)
    at Array.forEach (<anonymous>)
    at eval (rete.esm.js?f5d5:1889:1)
    at Array.forEach (<anonymous>)
    at NodeEditor._callee2$ (rete.esm.js?f5d5:1886:1)
    at tryCatch (runtime.js?96cf:63:1)
 */


/**
 * Represents the Rete.js editor, with all components as children.
 */
export default {
  props: ["id"],
  data() {
    return {
      editor: null,
      project: {
        name: String,
        data: Object,
        block_libs: Array,
      },
      all_categories: [],
    };
  },
  computed: {
    categoryNames() {
      return this.all_categories.map(cat => cat.name);
    }
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
    ];
    this.all_categories = whitelist;

    // Add all sets of components that can be used.
    // TODO(Project): Should probably be configured based on the problem the
    // user is working on.
    var components = Category.getAllComponents();

    // Rete.js initialization code:

    var editor = new NodeEditor("demo@0.1.0", container);
    // console.log(editor);
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
    // By default, loads the last saved program from localstorage
    // (useful for testing, so you don't have to rebuild each time).
    try {
      // Get project data from endpoint
      const response = await axios.get("/api/v1/projects/" + this.id);

      // Parse project data
      this.project = response.data;
      const parsed_data = JSON.parse(this.project.data)
      // console.log("PASSED DATA");
      // console.log(this.project)
      // console.log(parsed_data);
      console.log("loaded block libs:")
      console.log(this.project.block_libs)

      // First abort any current computation
      await engine.abort();
      // Update the editor to use the project data
      await editor.fromJSON(parsed_data);

    } catch (err) {
      console.log(err);
    }

    // Anytime the code blocks are edited, recompute the program and save the project.
    editor.on(
      "process nodecreated noderemoved nodetranslate connectioncreated connectionremoved",
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
  height: 100vh;
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
