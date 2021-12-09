import { Output, Input, Component } from "rete";
import { numSocket, listSocket, loopSocket, predicateSocket } from "./sockets";
import { NumControl, ListControl, LoopControl, CodeControl } from "../controls/controls";
import { Loop } from "../controls/objects";

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

export default [
    new NumComponent(),
    new DivideComponent(),
    new ForEachComponent(),
    new FilterComponent(),
    new SumComponent(),
    new CountComponent(),
]