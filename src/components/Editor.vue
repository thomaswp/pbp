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
      ...delimComps,
      ...buncoComps,
      ...rainfallComps,
    ];
    // Rete.js initialization code:

    var editor = new NodeEditor("demo@0.1.0", container);
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

    components.map((c) => {
      editor.register(c);
      engine.register(c);
    });

    //Fetch the project associated with the passed ID
    await axios
      .get("/api/v1/projects/" + this.id)
      .then((response) => {
        this.project = response.data;
        console.log(this.project.data);
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

    // By default, loads the last saved program from localstorage
    // (useful for testing, so you don't have to rebuild each time).
    // TODO(Project): Should load a specified project instead
    //if (localStorage.editorSave) {
    //  await editor.fromJSON(JSON.parse(localStorage.editorSave));
    //}
    // if(this.project.data) {
    //   try {
    //     await editor.fromJSON(JSON.parse(this.project.data));
    //   } catch (error) {
    //     console.log(error)
    //   }

    // }

    // Anytime the code blocks are edited, recompute the program
    editor.on(
      "process nodecreated noderemoved connectioncreated connectionremoved",
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

<style>
body {
  margin: 0;
}

.node-editor {
  text-align: left;
  height: 100vh;
  width: 100vw;
  resize: vertical;
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

.socket.number-value {
  background: #3647df;
}

.socket.list-value {
  background: #c4021c;
}

.socket.loop-value {
  background: #c9c616;
}

.socket.predicate-value {
  background: #30810d;
}

.socket.string-value {
  background: #490d81;
}

.socket.boolean-value {
  background: #42b112;
}
</style>
