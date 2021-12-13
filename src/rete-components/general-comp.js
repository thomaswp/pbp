import { Output, Input, Component } from "rete";
import { numSocket, listSocket, loopSocket, predicateSocket } from "./sockets";
import { NumControl, ListControl, LoopControl, CodeControl } from "../controls/controls";
import { Loop, ValueGenerator } from "../controls/objects";

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

    inputData(name, socket, hasControl = false, defaultValue) {
        return { name, socket, hasControl, defaultValue };
    }

    outputData(name, socket, hasControl = false, hasPreview = true, defaultValue) {
        return { name, socket, hasControl, hasPreview, defaultValue };
    }

    controlFromSocket(socket, key, readonly, defaultValue) {
        if (socket === numSocket) return new NumControl(this.editor, key, readonly, defaultValue);
        if (socket === listSocket) return new ListControl(this.editor, key, readonly, defaultValue);
        if (socket === loopSocket) return new LoopControl(this.editor, key, readonly);
        throw new Error("No control for socket: " + socket);
    }

    reify(inputs) {
        const newInputs = {};
        for (const [key, value] of Object.entries(inputs)) {
            if (value instanceof ValueGenerator) {
                newInputs[key] = value.get();
            } else {
                newInputs[key] = value;
            }
        }
        return newInputs;
    }

    _addInput(node, data) {
        const name = data.name, socket = data.socket, key = data.key;
        const input = new Input(key, name, socket);
        if (data.hasControl) {
            input.addControl(this.controlFromSocket(socket, 'input_' + key, false, data.defaultValue));
        }
        node.addInput(input);
    }

    _addOutput(node, data) {
        const name = data.name, socket = data.socket, key = data.key;
        const output = new Output(key, name, socket);
        if (data.hasControl) {
            node.addControl(this.controlFromSocket(socket, 'output_' + key, false, data.defaultValue));
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
            if (inputs[data.key].length) {
                // Read data from input sockets
                v = inputs[data.key][0];
            } else if (data.hasControl) {
                // Read data from input controls
                v = node.data['input_' + data.key];
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
            let value = outputs[data.key];
            if (value === undefined) {
                // Warn about missing output values
                console.warn(`Node ${this.name} returned no output for ${data.key}:`, result);
            } else if (!(typeof value === "object" || typeof value === "function")) {
                outputs[data.key] = new ValueGenerator(() => value);
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
            this.outputData('Number', numSocket, true, false, 0),
        ];
    }
}

class DivideComponent extends BaseComponent {
    constructor(){
        super("Divide");
    }

    getInputData() {
        return [
            this.inputData('Numerator', numSocket, true),
            this.inputData('Denominator', numSocket, true),
        ];
    }

    getOutputData() {
        return [
            this.outputData('Value', numSocket),
        ];
    }

    work(inputs) {
        inputs = this.reify(inputs);
        return inputs.denominator == 0 ? 
            Number.NaN : 
            inputs.numerator / inputs.denominator;
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
        inputs = this.reify(inputs);
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

class SumComponent extends BaseComponent {
    constructor(){
        super("Sum");
    }

    getInputData() {
        return [
            this.inputData('Loop', loopSocket),
            this.inputData('Value', numSocket),
        ];
    }

    getOutputData() {
        return [
            this.outputData('Sum', numSocket),
        ]
    }

    work(inputs) {
        const loop = inputs.loop, gen = inputs.value;
        let sum = new Accumulator(loop, (sum, i) => {
            if (!gen) return sum + i;
            return sum + gen.get();
        }, 0);
        return sum.calculate();
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