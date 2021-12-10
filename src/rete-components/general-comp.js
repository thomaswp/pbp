import { Output, Input, Component } from "rete";
import { numSocket, listSocket, loopSocket, predicateSocket } from "./sockets";
import { NumControl, ListControl, LoopControl, CodeControl } from "../controls/controls";
import { Loop } from "../controls/objects";

class BaseComponent extends Component {

    static getKey(name, list) {
        let key = name.toLowerCase();
        while (list.filter(k => k == key).length > 0) key += "_";
        return key;
    }

    static addKeys(data) {
        let keys = data.map(d => d.key).filter(k => !!k);
        data.forEach(d => {
            d.key = BaseComponent.getKey(d.name, keys);
        });
    }

    constructor(name) {
        super(name);
        this.inputData = this.getInputData();
        this.outputData = this.getOutputData();
        BaseComponent.addKeys(this.inputData);
        BaseComponent.addKeys(this.outputData);
        console.log(this.inputData, this.outputData);
    }

    // Begin abstract methods

    getInputData() {
        return [];
    }

    getOutputData() {
        return [];
    }

    work(inputs) { }

    // End abstract methods

    inputData(name, socket, hasControl) {
        return { name, socket, hasControl };
    }

    outputData(name, socket, hasControl = false, hasPreview = true) {
        return { name, socket, hasControl, hasPreview };
    }

    controlFromSocket(socket, key, readonly) {
        if (socket === numSocket) return new NumControl(this.editor, key, readonly);
        if (socket === listSocket) return new ListControl(this.editor, key, readonly);
        if (socket === loopSocket) return new LoopControl(this.editor, key, readonly);
        throw new Error("No control for socket: " + socket);
    }

    _addInput(node, data) {
        const name = data.name, socket = data.socket, key = data.key;
        const input = new Input(key, name, socket);
        if (data.hasControl) {
            input.addControl(this.controlFromSocket(socket, 'input_' + key, false));
        }
        node.addInput(input);
    }

    _addOutput(node, data) {
        const name = data.name, socket = data.socket, key = data.key;
        const output = new Output(key, name, socket);
        if (data.hasControl) {
            node.addControl(this.controlFromSocket(socket, 'output_' + key, false));
        }
        if (data.hasPreview) {
            node.addControl(this.controlFromSocket(socket, 'preview_' + key, true));
        }
        node.addOutput(output);
    }

    builder(node) {
        this.inputData.forEach(data => this._addInput(node, data));
        this.outputData.forEach(data => this._addOutput(node, data));
    }

    worker(node, inputs, outputs) {
        let inputValues = {};
        this.inputData.forEach(data => {
            let v = undefined;
            if (data.hasControl) {
                // Read data from input controls
                v = node.data['input_' + data.key];
            }
            if (v === undefined) {
                // Read data from input sockets
                v = inputs[data.key][0];
            }
            inputValues[data.key] = v;
        });
        let result = this.work(inputValues);
        if (this.outputData.length == 0) return;
        if (this.outputData.length == 1) {
            // Get a single output value
            outputs[this.outputData[0].key] = result;
        } else if (result instanceof Object) {
            // Get a map of output values
            this.outputData.filter(d => result[d.key] === undefined)
                .forEach(d => outputs[d.key] = result[d.key]);
        }
        this.outputData.forEach(data => {
            if (data.hasControl && outputs[data.key] === undefined) {
                // Read output from a control
                // console.log('Setting', data.key, node.data['output_' + data.key]);
                outputs[data.key] = node.data['output_' + data.key];
            }
            if (data.hasPreview && outputs[data.key] !== undefined) {
                // Set preview control values
                this.editor.nodes.find(n => n.id == node.id)
                    .controls.get('preview_' + data.key).setValue(outputs[data.key]);
            }
            if (outputs[data.key] === undefined) {
                // Warn about missing output values
                console.warn(`Node ${this.name} returned no output for ${data.key}:`, result);
            }
        });
        // console.log('Output:', result, outputs);
    }
}

class NumComponent extends BaseComponent {

    constructor(){
        super("Number");
    }

    getOutputData() {
        return [
            this.outputData('Number', numSocket, true, false),
        ];
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

class ForRangeComponent extends BaseComponent {
    constructor(){
        super("For Range Loop");
    }

    getInputData() {
        return [
            this.inputData('From', numSocket, true),
            this.inputData('To', numSocket, true),
        ];
    }

    getOutputData() {
        return [
            this.outputData('Loop', loopSocket),
        ];
    }

    work(inputs) {
        const from = inputs.from, to = inputs.to;
        return new Loop(() => {
            let i = from;
            return () => {
                if (i < to) return i++;
                return undefined;
            }
        });
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
    new ForRangeComponent(),
    new ForEachComponent(),
    new FilterComponent(),
    new SumComponent(),
    new CountComponent(),
]