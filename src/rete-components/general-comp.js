import { Output, Input, Component } from "rete";
import { numSocket, controlSocket, anyValueSocket } from "./sockets";
import { NumControl, ListControl, ExecutionTraceControl, DefineBehaviorControl } from "../controls/controls";
import { ValueGenerator, ControlHandler } from "../controls/objects";

export class Category {
    static map = new Map();
    static list = [];

    constructor(name, isAssignment, description) {
        this.name = name;
        this.isAssignment = isAssignment || false;
        this.description = description || '';
        this.components = [];
        if (Category.map.has(name)) {
            throw 'Category already exists: ' + name;
        }
        Category.map.set(name, this);
        Category.list.push(this);
    }

    static getAllComponents() {
        const comps = []
        const added = new Set();
        for (let cat of this.list) {
            cat.components.forEach(comp => {
                if (added.has(comp)) return;
                comps.push(comp);
                added.add(comp);
            });
        }
        comps.sort((a, b) => a.categories.length - b.categories.length);
        return comps;
    }

    static getCategoryComponents(categories /* list of str names */) {
        // if just one category, allow that
        if (!Array.isArray(categories)) categories = [categories];

        const comps = []
        const added = new Set();
        // loop thru category names
        for( const category_name of categories ) {
            // loop thru components in each category
            for( const comp of Category.map.get(category_name) ) {
                // if already added from different category, skip
                if (added.has(comp)) continue;
                // add to our array
                comps.push(comp);
                added.add(comp);
            }
        }

        comps.sort((a, b) => a.categories.length - b.categories.length);
        return comps;
    }
}

export const CATEGORY_OTHER = new Category('Other');

export class BaseComponent extends Component {

    static getKey(name, list) {
        let key = name.toLowerCase().replaceAll(" ", "_");
        while (list.filter(k => k == key).length > 0) key += "_";
        return key;
    }

    static addKeys(data) {
        let keys = data.map(d => d.key).filter(k => !!k);
        data.forEach(d => {
            d.key = BaseComponent.getKey(d.name, keys);
        });
    }


    constructor(name, categories) {
        super(name);
        if (categories && !Array.isArray(categories)) categories = [categories];
        this.categories = categories || [CATEGORY_OTHER];
        this.categories.forEach(cat => cat.components.push(this));
    }

    shouldShow(whitelist) {
        // At least one category must be present...
        return this.categories.some(cat => whitelist.includes(cat)) &&
            // and all assignment categories must be present
            this.categories
            .filter(cat => cat.isAssignment)
            .every(cat => whitelist.includes(cat));
    }

    // Begin virtual methods

    // perform some setup before calling getInputData() and getOutputData()
    // receives any extra args from constructor
    setup() {
        return;
    }

    getInputData() {
        return [];
    }

    getOutputData() {
        return [];
    }

    getControlInputData() {
        return [];
    }

    getControlOutputData() {
        return [];
    }

    getAllData() {
        return {
            inputs: this.getInputData(),
            outputs: this.getOutputData(),
        }
    }

    work(inputs) { }

    // End virtual methods

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
        } else {
            return new ListControl(this.editor, key, readonly, defaultValue);
        }
    }

    previewControl(key, name) {
        return new ExecutionTraceControl(key, name);
    }

    reifyValue(value, context) {
        if (value instanceof ValueGenerator) {
            return value.get(context);
        } else {
            return value;
        }
    }

    reify(inputs, context) {
        const newInputs = {};
        for (const [key, value] of Object.entries(inputs)) {
            newInputs[key] = this.reifyValue(value, context);
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
        let { inputs, outputs } = this.getAllData();
        inputs.push(...this.getControlInputData());
        outputs.push(...this.getControlOutputData());
        BaseComponent.addKeys(inputs);
        BaseComponent.addKeys(outputs);

        // node.addControl(new CodeControl(this.editor, 'code', this.name));
        inputs.forEach(data => this._addInput(node, data));
        outputs.forEach(data => this._addOutput(node, data));

        // Note: caching should be ok for worker, since it doesn't use socket
        // information; however, this feels a bit weird, since one node's
        // input data might be used by another when working.
        this.cachedInputData = inputs;
        this.cachedOutputData = outputs;
    }

    worker(node, inputs, outputs) {
        let inputValues = {};
        this.cachedInputData.forEach(data => {
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
        let result = this.work(inputValues, node);
        if (this.cachedOutputData.length == 0) return;
        if (this.cachedOutputData.length == 1) {
            const key = this.cachedOutputData[0].key;
            if (result != null && typeof result === "object" && result[key]) {
                result = result[key];
            }
            // Get a single output value
            outputs[key] = result;
        } else if (typeof result === "object") {
            // Get a map of output values
            this.cachedOutputData.filter(d => result[d.key] !== undefined)
                .forEach(d => outputs[d.key] = result[d.key]);
        }
        this.cachedOutputData.forEach(data => {
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

export class CallableComponent extends BaseComponent {


    getControlInputData() {
        return [
            this.inputData('When', controlSocket, false, false),
        ];
    }

    getControlOutputData() {
        return [
            this.outputData('Then', controlSocket, false, false),
        ];
    }

    work(input, node) {
        return this.defaultWork(input, node);
    }

    /**
     * Binds the 'when' input to calling the supplied action, and then executing
     * a 'then' Handler, which is returned.
     */
    defaultWork(inputs, node, action) {
        const then = new ControlHandler();
        const execute = (context) => {
            if (action) action(context);
            then.execute(context);
        }
        this.addDefaultTrigger(inputs, node, execute);
        return {
            then,
            execute,
        }
    }

    /**
     * Binds the 'when' input to call the given execute action, and also tells
     * the Editor to run that action if there's no 'when' trigger.
     */
    addDefaultTrigger(inputs, node, execute) {
        const when = inputs.when;
        node.data.execute = execute;
        node.data.needsExecution = when == null;
        if (when) {
            when.addHandler(execute);
        }
        // console.log(inputs, when);
    }
}

class DebugComponent extends CallableComponent {
    constructor() {
        super("Debug");
    }

    getInputData() {
        return [
            this.inputData('Message', anyValueSocket),
        ];
    }

    work(inputs, node) {
        const output = this.defaultWork(inputs, node, context => {
            console.log(this.reifyValue(inputs.message, context), context);
            // console.trace();
        });
        // Never run debug from root
        node.data.needsExecution = false;
        return output;
    }
}

class ReturnComponent extends CallableComponent {
    constructor() {
        super("Return");
    }

    getInputData() {
        return [
            this.inputData('Value', anyValueSocket),
        ];
    }

    getControlOutputData() {
        return [];
    }

    // TODO: Need a way to visualize return values
    work(inputs, node) {
        const output = this.defaultWork(inputs, node, context => {
            // Reify for the execution trace
            this.reifyValue(inputs.value, context);
        });
        // Never run returns
        node.data.needsExecution = false;
        return output;
    }
}

class CustomComponent extends BaseComponent {

    constructor() {
        super("Custom Op");
        this.map = new Map();
    }

    getAllData() {
        return {
            inputs: [
                this.inputData('Input', numSocket),
            ],
            outputs: [
                this.outputData('Output', numSocket),
            ],
        };
    }

    builder(node) {
        node.addControl(new DefineBehaviorControl(this.editor, {
            // TODO need both human name and property name
            editor: this.editor,
            inputNames: ['Input'],
            inputFields: ['input'],
            getMap: () => this.map,
            onUpdated: map => {
                console.log('Updating...', map);
                this.map = map;
            },
        }));
        super.builder(node);
    }

    work(inputs) {
        return new ValueGenerator((context) => {
            const rInputs = this.reify(inputs, context);
            console.log(rInputs);
            const key = JSON.stringify(rInputs);
            if (!this.map.has(key)) {
                this.map.set(key, undefined);
            }
            const out = this.map.get(key);
            return out;
        }, false, inputs.input);
    }
}

// class StoreComponent extends BaseComponent {
//     constructor() {
//         super('Store Variable');
//     }

//     getAllData() {
//         const inputSocket = new GenericSocket();
//         return {
//             inputs: [
//                 this.inputData('Input', inputSocket),
//             ],
//             outputs: [
//                 this.outputData('Output', new GenericSocket(inputSocket)),
//             ]
//         }
//     }

//     work(inputs) {
//         // TODO(twprice): Not sure at all how to handle this...
//         // What should the context be? Not always null surely
//         const rInputs = this.reify(inputs);
//         return new ValueGenerator((_) => {
//             return rInputs.input;
//         });
//     }
// }


// class LoopToListComponent extends BaseComponent {
//     constructor() {
//         super('Loop to List');
//     }

//     getAllData() {
//         const valueSocket = new GenericSocket();
//         return {
//             inputs: [
//                 this.inputData('Loop', new GenericLoopSocket()),
//                 this.inputData('Value', valueSocket),
//             ],
//             outputs: [
//                 this.outputData('List', new GenericListSocket(valueSocket)),
//             ]
//         }
//     }

//     work(inputs) {
//         const generators = new Accumulator(inputs.loop, [],
//             (currentValue, newValue, context) => {
//                 const value = this.reifyValue(inputs.value, context);
//                 const add = value === undefined ? newValue : value;
//                 currentValue.push(add);
//                 return currentValue;
//             }
//         ).generators();
//         return generators.final_value;
//     }
// }

[
    new CustomComponent(),
    new DebugComponent(),
    new ReturnComponent(),
]