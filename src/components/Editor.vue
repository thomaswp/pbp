<template>
  <div class="editor">
    <div class="container">
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
import { Category } from "../rete-components/general-comp";
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


/**
 * Represents the Rete.js editor, with all components as children.
 */
export default {
  data() {
    return {
      editor: null,
    };
  },
  async mounted() {
    var container = this.$refs.nodeEditor;
    var dock = this.$refs.dock;


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

    // By default, loads the last saved program from localstorage
    // (useful for testing, so you don't have to rebuild each time).
    // TODO(Project): Should load a specified project instead
    if (localStorage.editorSave) {
      await editor.fromJSON(JSON.parse(localStorage.editorSave));
    }

    // Anytime the code blocks are edited, recompute the program
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
        // Save it to localstorage for easy reloading
        // TODO(Project): This should be actually be save to a database
        // console.log(json);
        localStorage.editorSave = JSON.stringify(json);

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

<style>
body {
  margin: 0;
}

.node-editor {
  text-align: left;
  height: 100vh;
  width: 100vw;
}

.node .control > input,
.node .input-control > input {
  width: 140px;
}

select,
input {
  width: 100%;
  border-radius: 30px;
  background-color: white;
  padding: 2px 6px;
  border: 1px solid #999;
  font-size: 110%;
  width: 170px;
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

.dock-item {
  display: inline-block;
  vertical-align: top;
  transform: scale(0.8);
  transform-origin: 50% 0;
}

.container {
  flex: 1;
  overflow: hidden;
}

.socket.number-socket {
  background: #3647df;
}

.socket.list-socket {
  outline: dotted #464646 3px;
  /* border: solid #1d1d1d 6px; */
}

.socket.loop-socket {
  outline: solid #464646 3px;
  /* border: solid #660000 6px; */
}

.socket.string-socket {
  background: #490d81;
}

.socket.boolean-socket {
  background: #42b112;
}

.socket.any-value-socket {
  background: #bbb;
}

.socket.control-socket {
  background: #aa4d00;
  border-radius: 2px;
}

.connection.socket-input-control .main-path {
  stroke: #6e3200;
  stroke-dasharray: 10, 2;
}

</style>
