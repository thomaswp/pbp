import { Output, Input, Component } from "rete";
import { numSocket, listSocket, loopSocket, predicateSocket, boolSocket } from "./sockets";
import { NumControl, ListControl, CodeControl, ExecutionTraceControl } from "../controls/controls";
import { Loop, ValueGenerator } from "../controls/objects";
import {BaseComponent} from "./general-comp"


//Beginning attempt at creating custom blocks. Not currently actually used anywhere.

export class CustomComponent extends Component {

    static getKey(name, list) {
        let key = name.toLowerCase().replace(" ", "_");
        while (list.filter(k => k == key).length > 0) key += "_";
        return key;
    }

    static addKeys(data) {
        let keys = data.map(d => d.key).filter(k => !!k);
        data.forEach(d => {
            d.key = CustomComponent.getKey(d.name, keys);
        });
    }

    constructor(name, inputs, outputs) {
        super(name);
        this.inputData = this.getInputData(inputs);
        this.outputData = this.getOutputData(outputs);
        CustomComponent.addKeys(this.inputData);
        CustomComponent.addKeys(this.outputData);
    }

    // Begin abstract methods

    getInputData(inputs) {
        console.log(inputs)
        var inpts = []
        for (let i = 0; i < inputs.length; i++) {
            var input = inputs[i]
            console.log(input[0])
            if (input[1] == "Number") {
                inpts.push(this.inputData(input[0], numSocket, true, false, 0))
            } else {
                inpts.push(this.inputData(input[0], boolSocket, true, false, 0))
            }
        }
        return inpts;
    }

    getOutputData(outputs) {
        console.log(outputs)
        var outpts = []
        for (let i = 0; i < outputs.length; i++) {
            var output= outputs[i]
            if (output[1] == "Number") {
                outpts.push(this.outputData(output[0], numSocket, true, false, 0))
            } else {
                outpts.push(this.outputData(output[0], boolSocket, true, false, 0))
            }
        }
        return outpts;
    }

    inputData(name, socket, hasControl = false, defaultValue) {
        return { name, socket, hasControl, defaultValue };
    }

    outputData(name, socket, hasControl = false, hasPreview = true, defaultValue) {
        return { name, socket, hasControl, hasPreview, defaultValue };
    }

    editableControlFromSocket(socket, key, readonly, defaultValue) {
        // TODO(IO): Eventually all data types should be supported by the
        // ListControl
        if (socket === numSocket && !readonly) {
            return new NumControl(this.editor, key, readonly, defaultValue);
        }
        if (
            socket === boolSocket || socket === listSocket ||
            socket === loopSocket || socket === numSocket
        ) {
            return new ListControl(this.editor, key, readonly, defaultValue);
        }
        throw new Error("No control for socket: " + typeof socket);
    }

    previewControl(key, name) {
        return new ExecutionTraceControl(key, name);
    }

    reify(inputs, context) {
        const newInputs = {};
        for (const [key, value] of Object.entries(inputs)) {
            if (value instanceof ValueGenerator) {
                newInputs[key] = value.get(context);
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
            input.addControl(this.editableControlFromSocket(
                socket, 'input_' + key, false, data.defaultValue));
        }
        node.addInput(input);
    }

    _addOutput(node, data) {
        const name = data.name, socket = data.socket, key = data.key;
        const output = new Output(key, name, socket);
        if (data.hasControl) {
            node.addControl(this.editableControlFromSocket(
                socket, 'output_' + key, false, data.defaultValue));
        }
        if (data.hasPreview) {
            node.addControl(this.previewControl('preview_' + key, data.name));
        }
        node.addOutput(output);
    }

    builder(node) {
        node.addControl(new CodeControl(this.editor, 'code', this.name));
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
                // console.log('Reading input:', v, data.key)
            }
            inputValues[data.key] = v;
        });
        let result = this.work(inputValues);
        if (this.outputData.length == 0) return;
        if (this.outputData.length == 1) {
            // Get a single output value
            outputs[this.outputData[0].key] = result;
        } else if (typeof result === "object") {
            // Get a map of output values
            this.outputData.filter(d => result[d.key] !== undefined)
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
                console.warn(`Node ${this.name} returned no output for ${data.key}:`, result, outputs);
            } else if (!(typeof value === "object" || typeof value === "function")) {
                outputs[data.key] = new ValueGenerator(() => value);
            }
        });
        node.data.workerResults = outputs;
    }
}
/**

export class CustomComponent extends BaseComponent {


    constructor(name, inputs, outputs) {
        super(name);
        this.inputData = this.getInputData(inputs);
        this.outputData = this.getOutputData(outputs);
        CustomComponent.addKeys(this.inputData);
        CustomComponent.addKeys(this.outputData);
    }

    // Begin abstract methods

    getInputData(inputs) {
        console.log(inputs)
        var inpts = []
        for (let i = 0; i < inputs.length; i++) {
            var input = inputs[i]
            console.log(input[0])
            if (input[1] == "Number") {
                inpts.push(this.inputData(input[0], numSocket, true, false, 0))
            } else {
                inpts.push(this.inputData(input[0], boolSocket, true, false, 0))
            }
        }
        return inpts;
    }

    getOutputData(outputs) {
        console.log(outputs)
        var outpts = []
        for (let i = 0; i < outputs.length; i++) {
            var output= outputs[i]
            if (output[1] == "Number") {
                outpts.push(this.outputData(output[0], numSocket, true, false, 0))
            } else {
                outpts.push(this.outputData(output[0], boolSocket, true, false, 0))
            }
        }
        return outpts;
    }

}
*/