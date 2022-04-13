<template>
  <div class="editor">
    <div class="container-custom">
      <div class="wrapper">
        <div class="node-editor" ref="nodeEditor"></div>
      </div>
      <canvas id="canvasOutput"></canvas>
    </div>
    <div class="dock" ref="dock" />
  </div>
</template>

<script>
import { NodeEditor, Engine } from "rete";
import ConnectionPlugin from "rete-connection-plugin";
import VueRenderPlugin from "../render/src/index";
import ContextMenuPlugin from '../context-menu/src/index'
import DockPlugin from "rete-dock-plugin";
import AreaPlugin from "rete-area-plugin";
import { GeneralComponents } from "../rete-components/general-comp";
import rainfallComps from "../rete-components/rainfall-comp";
import buncoComps from "../rete-components/bunco-comp";
import delimComps from "../rete-components/delim-comp";
import lightboardComps from "../rete-components/lightboard-comp";
import wordPairComps from "../rete-components/word-pair-comp";
import compressionComps from "../rete-components/compress-comp";
import { controlSocket, DynamicSocket } from '../rete-components/sockets'
import { Loop, RootContext, ValueGenerator } from "../controls/objects";
import axios from "axios";
import eventBus from "../eventBus";


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
      },
    };
  },
  async mounted() {
    var container = this.$refs.nodeEditor;
    var dock = this.$refs.dock;

    // Add all sets of components that can be used.
    // TODO(Project): Should probably be configured based on the problem the
    // user is working on.
    var components = [
      ...GeneralComponents,
      ...wordPairComps,
      ...lightboardComps,
      ...delimComps,
      ...buncoComps,
      ...rainfallComps,
      ...compressionComps,
    ];
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

    editor.use(ContextMenuPlugin, {
        // searchBar: false,
        delay: 100,
        // allocate(component) {
        //     return ['Submenu'];
        // },
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

    // Fetchthe project associated with the passed ID
    // By default, loads the last saved program from localstorage
    // (useful for testing, so you don't have to rebuild each time).
    await axios
      .get("/api/v1/projects/" + this.id)
      .then((response) => {
        this.project = response.data;
        try {
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

        await axios
          .put("/api/v1/projects/" + this.id + "/data", this.project)
          .then((response) => {
            console.log("Saved project");
          })
          .catch((error) => {
            console.log(error);
          });

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
/* todo: in future versions of Vue, use ::deep()
https://stackoverflow.com/questions/63986278/vue-3-v-deep-usage-as-a-combinator-has-been-deprecated-use-v-deepinner-se
*/

.editor ::v-deep(.socket.any-value-socket) {
  background: #bbb;
}

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

.editor ::v-deep(.socket.control-socket) {
  background: #aa4d00;
  border-radius: 2px;
}

.editor ::v-deep(.connection.socket-input-control .main-path) {
  stroke: #6e3200;
  stroke-dasharray: 10, 2;
}

</style>
