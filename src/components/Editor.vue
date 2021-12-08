<template>
  <div class="editor"> 
    <div class="container">
      <div class="wrapper"><div class="node-editor" ref="nodeEditor"></div></div>
      <canvas id="canvasOutput"></canvas>
    </div>
    <div class="dock" ref="dock"/>
  </div>
</template>

<script>
import { Socket, NodeEditor, Control, Output, Input, Component, Engine } from "rete";
import ConnectionPlugin from "rete-connection-plugin";
import VueRenderPlugin from "rete-vue-render-plugin";
// import ContextMenuPlugin from "rete-context-menu-plugin";
import DockPlugin from "rete-dock-plugin";
import AreaPlugin from "rete-area-plugin";
import VueNumControl from './NumControl.vue';
import VueListControl from './ListControl.vue';
import CodeEditorButtonVue from './CodeEditorButton.vue';

export default {
  data() {
    return {
      editor: null
    };
  },
  async mounted() {
    var numSocket = new Socket('Number value');
    var listSocket = new Socket('List value');
    var loopSocket = new Socket('Loop value');
    var predicateSocket = new Socket('Predicate value');

    class CodeControl extends Control {

      constructor(emitter, key, type) {
        super(key);
        this.component = CodeEditorButtonVue;
        this.props = { emitter, ikey: key, type};
      }

      setValue(val) {
      }
    }

    class NumControl extends Control {

      constructor(emitter, key, readonly) {
        super(key);
        this.component = VueNumControl;
        this.props = { emitter, ikey: key, readonly };
      }

      setValue(val) {
        this.vueContext.value = val;
      }
    }

    class ListControl extends Control {

      constructor(emitter, key, readonly, defaultValue) {
        super(key);
        this.component = VueListControl;
        this.props = { emitter, ikey: key, readonly, defaultValue };
      }

      setValue(val) {
        this.vueContext.value = val;
      }
    }

    class LoopControl extends Control {

      constructor(emitter, key, readonly) {
        super(key);
        this.component = VueListControl;
        this.props = { emitter, ikey: key, readonly };
      }

      setValue(val) {
        if (!val) {
          this.vueContext.value = null;
          return;  
        }
        this.vueContext.value = val.toList();
        this.vueContext.refresh();
        // console.log('set loop', list, this.vueContext);
      }
    }

    class NumComponent extends Component {

        constructor(){
            super("Number");
        }

        builder(node) {
            var out1 = new Output('num', "Number", numSocket);

            return node.addControl(new NumControl(this.editor, 'num')).addOutput(out1);
        }

        worker(node, inputs, outputs) {
            outputs['num'] = node.data.num;
        }
    }

    class DivideComponent extends Component {
        constructor(){
            super("Divide");
        }

        builder(node) {
            var inp1 = new Input('num',"Numerator", numSocket);
            var inp2 = new Input('num2', "Denominator", numSocket);
            var out = new Output('num', "Number", numSocket);

            inp1.addControl(new NumControl(this.editor, 'num'))
            inp2.addControl(new NumControl(this.editor, 'num2'))

            return node
                .addInput(inp1)
                .addInput(inp2)
                .addControl(new NumControl(this.editor, 'preview', true))
                .addOutput(out);
        }

        worker(node, inputs, outputs) {
            var n1 = inputs['num'].length?inputs['num'][0]:node.data.num1;
            var n2 = inputs['num2'].length?inputs['num2'][0]:node.data.num2;
            var sum = n2 == 0 ? 'NaN' : n1 / n2;

            this.editor.nodes.find(n => n.id == node.id).controls.get('preview').setValue(sum);
            outputs['num'] = sum;
        }
    }

    class Loop {
        constructor(makeIterator) {
            this.makeIterator = makeIterator;
        }

        iterator() {
            const next = this.makeIterator();
            return {
                next: () => next(),
            }
        }

        toList() {
            const iterator = this.iterator();
            const list = [];
            let item;
            while ((item = iterator.next()) !== undefined) {
                list.push(item);
            }
            return list;
        }
    }

    class Accumulator {
        constructor(loop, accumulate, startValue) {
            this.accumulate = accumulate;
            this.loop = loop;
            this.startValue = startValue;
        }

        calculate() {
            if (!this.loop) return this.startValue;
            const iterator = this.loop.iterator();
            let out = this.startValue;
            let value;
            while ((value = iterator.next()) !== undefined) {
                out = this.accumulate(out, value);
            }
            return out;
        }
    }

    class ForEachComponent extends Component {
        constructor(){
            super("For Each Loop");
        }

        builder(node) {
            var inp1 = new Input('list',"List", listSocket);
            var out = new Output('loop', "Loop", loopSocket);

            inp1.addControl(new ListControl(this.editor, 'list', true))

            return node
                .addInput(inp1)
                .addControl(new LoopControl(this.editor, 'preview', true))
                .addOutput(out);
        }

        worker(node, inputs, outputs) {
            var list = inputs['list'][0];

            const out = list == null ? null : new Loop(() => {
                let i = 0;
                return () => list[i++];
            });
            // console.log('foreach', out);
            this.editor.nodes.find(n => n.id == node.id).controls.get('preview').setValue(out);
            outputs['loop'] = out;
        }
    }

    class FilterComponent extends Component {
        constructor(){
            super("Filter");
        }

        builder(node) {
            var inp1 = new Input('loop',"Loop", loopSocket);
            var inp2 = new Input('filter',"Filter", predicateSocket);
            var out = new Output('loop', "Loop", loopSocket);

            return node
                .addInput(inp1)
                .addInput(inp2)
                .addControl(new LoopControl(this.editor, 'preview', true))
                .addOutput(out);
        }

        worker(node, inputs, outputs) {
            const loop = inputs['loop'][0];

            const out = loop == null ? null : new Loop(() => {
                const iterator = loop.iterator();
                return () => {
                    let value;
                    while ((value = iterator.next()) !== undefined) {
                        if (value >= 0) return value;
                    }
                    return undefined;
                }
            });
            this.editor.nodes.find(n => n.id == node.id).controls.get('preview').setValue(out);
            outputs['loop'] = out;
        }
    }

    class SumComponent extends Component {
        constructor(){
            super("Sum");
        }

        builder(node) {
            var inp1 = new Input('loop',"Loop", loopSocket);
            var out = new Output('sum', "Sum", numSocket);

            return node
                .addControl(new CodeControl(this.editor, 'code', 'sum'))
                .addInput(inp1)
                .addControl(new NumControl(this.editor, 'preview', true))
                .addOutput(out)
                ;
        }

        worker(node, inputs, outputs) {
            const loop = inputs['loop'][0];

            let sum = new Accumulator(loop, (a, b) => a + b, 0);
            const out = sum.calculate();

            this.editor.nodes.find(n => n.id == node.id).controls.get('preview').setValue(out);
            outputs['sum'] = out;
        }
    }

    class CountComponent extends Component {
        constructor(){
            super("Count");
        }

        builder(node) {
            var inp1 = new Input('loop',"Loop", loopSocket);
            var out = new Output('count', "Count", numSocket);

            return node
                .addInput(inp1)
                .addControl(new NumControl(this.editor, 'preview', true))
                .addOutput(out);
        }

        worker(node, inputs, outputs) {
            const loop = inputs['loop'][0];

            let count = new Accumulator(loop, (a, _) => a + 1, 0);
            const out = count.calculate();

            this.editor.nodes.find(n => n.id == node.id).controls.get('preview').setValue(out);
            outputs['count'] = out;
        }
    }

    class IfZero extends Component {
        constructor(){
            super("If Zero");
        }

        builder(node) {
            var number = new Input('number',"Number", numSocket);
            var then = new Input('then',"Then", numSocket);
            var el = new Input('else',"Else", numSocket);
            var out = new Output('out', "Out", numSocket);

            then.addControl(new NumControl(this.editor, 'then', false));
            el.addControl(new NumControl(this.editor, 'else', false));

            return node
                .addInput(number)
                .addInput(then)
                .addInput(el)
                .addControl(new NumControl(this.editor, 'preview', true))
                .addOutput(out);
        }

        worker(node, inputs, outputs) {
            const number = inputs['number'][0];
            const then = inputs['then'][0];
            const el = inputs['else'][0];

            const out = number == 0 ? then : el;

            this.editor.nodes.find(n => n.id == node.id).controls.get('preview').setValue(out);
            outputs['out'] = out;
        }
    }

    class TestInputComponent extends Component {
        constructor(){
            super("Test Input");
        }

        builder(node) {
            var inControl = new ListControl(this.editor, 'test', false, [5, -3, 7, -200, 9, -999, 10]);
            var out = new Output('test', 'Test', listSocket);


            return node
                .addControl(inControl)
                .addOutput(out);
        }

        worker(node, inputs, outputs) {
          const out = node.data.test; //[5, -3, 7, -200, 9, -999, 10];
          // console.log(node.data, out);
        //   this.editor.nodes.find(n => n.id == node.id).controls.get('preview').setValue(out);
          outputs['test'] = out;
        }
    }

    var container = this.$refs.nodeEditor;
    var dock = this.$refs.dock;
    var components = [
      // new NumComponent(), 
      // new AddComponent(), 
      new TestInputComponent(),
      new ForEachComponent(),
      new FilterComponent(),
      new SumComponent(),
      new CountComponent(),
      new DivideComponent(),
      new IfZero(),
    ];

    var editor = new NodeEditor('demo@0.1.0', container);
    editor.use(ConnectionPlugin);
    editor.use(VueRenderPlugin);
    // editor.use(ContextMenuPlugin);
    editor.use(DockPlugin, {
      container: dock, // html element to which pseudo nodes will be added
      plugins: [VueRenderPlugin], // list with plugins for rendering
      itemClass: 'dock-item' // by default: dock-item 
    });
    editor.use(AreaPlugin);

    var engine = new Engine('demo@0.1.0');

    components.map(c => {
        editor.register(c);
        engine.register(c);
    });

    var n1 = await components[0].createNode();
    // var n2 = await components[0].createNode({num: 0});
    // var add = await components[1].createNode();

    n1.position = [80, 200];
    // n2.position = [80, 400];
    // add.position = [500, 240];


    editor.addNode(n1);
    // editor.addNode(n2);
    // editor.addNode(add);

    // editor.connect(n1.outputs.get('num'), add.inputs.get('num'));
    // editor.connect(n2.outputs.get('num'), add.inputs.get('num2'));

    if (localStorage.editorSave) {
      await editor.fromJSON(JSON.parse(localStorage.editorSave));
    }

    editor.on('process nodecreated noderemoved connectioncreated connectionremoved', async () => {
        await engine.abort();
        const json = editor.toJSON();
        localStorage.editorSave = JSON.stringify(json);
        await engine.process(json);
    });

    editor.view.resize();
    AreaPlugin.zoomAt(editor);
    editor.trigger('process');
  }
};
</script>

<style>
.node-editor {
  text-align: left;
  height: 100vh;
  width: 100vw;
}

.node .control > input, .node .input-control > input {
  width: 140px;
}

select, input {
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
  background: #3647df
}

.socket.list-value {
  background: #c4021c
}

.socket.loop-value {
  background: #c9c616
}

.socket.predicate-value {
  background: #30810d
}
</style>
