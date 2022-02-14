import { Output, Input, Component } from "rete";
import { numSocket, boolSocket, GenericSocket, GenericListSocket, GenericLoopSocket, anyValueSocket } from "./sockets";
import { NumControl, ListControl, CodeControl, ExecutionTraceControl } from "../controls/controls";
import { IterContext, Loop, ValueGenerator } from "../controls/objects";

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

    constructor(name) {
        super(name);
    }

    // Begin virtual methods

    getInputData() {
        return [];
    }

    getOutputData() {
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
        const { inputs, outputs } = this.getAllData();
        BaseComponent.addKeys(inputs);
        BaseComponent.addKeys(outputs);

        node.addControl(new CodeControl(this.editor, 'code', this.name));
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
        let result = this.work(inputValues);
        if (this.cachedOutputData.length == 0) return;
        if (this.cachedOutputData.length == 1) {
            // Get a single output value
            outputs[this.cachedOutputData[0].key] = result;
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
    constructor() {
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
        return new ValueGenerator((context) => {
            const rInputs = this.reify(inputs, context);
            return rInputs.denominator == 0 ?
                Number.NaN :
                rInputs.numerator / rInputs.denominator;
        });
    }
}

class AddComponent extends BaseComponent {
    constructor() {
        super("Add");
    }

    getInputData() {
        return [
            this.inputData('Add1', numSocket, true),
            this.inputData('Add2', numSocket, true),
        ];
    }

    getOutputData() {
        return [
            this.outputData('Sum', numSocket),
        ];
    }

    work(inputs) {
        return new ValueGenerator((context) => {
            const rInputs = this.reify(inputs, context);
            return rInputs.add1 + rInputs.add2;
        });
    }
}

class StoreComponent extends BaseComponent {
    constructor() {
        super('Store Variable');
    }

    getAllData() {
        const inputSocket = new GenericSocket();
        return {
            inputs: [
                this.inputData('Input', inputSocket),
            ],
            outputs: [
                this.outputData('Output', new GenericSocket(inputSocket)),
            ]
        }
    }

    work(inputs) {
        // TODO(twprice): Not sure at all how to handle this...
        // What should the context be? Not always null surely
        const rInputs = this.reify(inputs);
        return new ValueGenerator((_) => {
            return rInputs.input;
        });
    }
}

class ForEachComponent extends BaseComponent {
    constructor(){
        super("For Each Loop");
    }

    getAllData() {
        const listSocket = new GenericListSocket()
        return {
            inputs: [
                this.inputData('List', listSocket),
            ],
            outputs: [
                this.outputData('Loop', new GenericLoopSocket(listSocket)),
                this.outputData('Value', new GenericSocket(listSocket)),
                this.outputData('Index', numSocket),
            ]
        }
    }

    work(inputs) {
        let index;
        let value;
        let loop = new Loop(this.name, (context) => {
            const rInputs = this.reify(inputs, context);
            const list = rInputs.list;
            index = -1;
            return () => {
                if (!list || index >= list.length) {
                    value = undefined;
                    return value;
                }
                index++;
                value = list[index];
                return value;
            }
        });
        return {
            loop,
            value: new ValueGenerator(() => value, true),
            index: new ValueGenerator(() => index, true),
        };
    }
}

class ForRangeComponent extends BaseComponent {
    constructor(name, inclusive){
        super(name);
        this.inclusive = inclusive;
    }

    getInputData() {
        return [
            this.inputData('From', numSocket, true),
            this.inputData('To', numSocket, true),
        ];
    }

    getOutputData() {
        return [
            this.outputData('Loop', new GenericLoopSocket(numSocket)),
            this.outputData('Value', numSocket, false, false),
        ];
    }

    work(inputs) {
        let index;
        let loop = new Loop(this.name, (context) => {
            const rInputs = this.reify(inputs, context);
            const from = rInputs.from;
            let to = rInputs.to;
            if (this.inclusive) to++;
            // console.log('Looping:', from, to);
            let i = from;
            return () => {
                index = i;
                if (i < to) return i++;
                index = undefined;
                return undefined;
            }
        });
        let value = new ValueGenerator(() => index, true);
        return {
            loop,
            value,
        };
    }
}

class ForRangeInclusiveComponent extends ForRangeComponent {
    constructor() {
        super("For Range Loop (Inclusive)", true);
    }
}

class ForRangeExclusiveComponent extends ForRangeComponent {
    constructor() {
        super("For Range Loop (Exclusive)", false);
    }
}

class FilterComponent extends BaseComponent {
    constructor(){
        super("Filter");
    }

    getAllData() {
        const loopSocket = new GenericLoopSocket()
        return {
            inputs: [
                this.inputData('Loop', loopSocket),
                this.inputData('Condition', boolSocket),
            ],
            outputs: [
                this.outputData('Loop', loopSocket),
            ]
        }
    }

    work(inputs) {
        if (!inputs.loop) return null;
        return new Loop(this.name, (context) => {
            const baseLoop = this.reifyValue(inputs.loop, context);
            const iterator = baseLoop.iterator(context);
            return (_) => {
                let value;
                while ((value = iterator.next()) !== undefined) {
                    const keep = this.reifyValue(
                            inputs.condition, iterator.lastIterContext);
                    if (keep) return value;
                }
                return undefined;
            }
        });
    }
}

export class Accumulator {
    constructor(loop, startValue, accumulate, errorValue) {
        this.accumulate = accumulate;
        this.loop = loop;
        this.startValue = startValue;
        this.errorValue = errorValue || Number.NaN;
        this.previewCurrentValue = true;
    }

    generators() {
        const loop = this.loop;
        let currentValue = this.startValue;
        const updateOnIter = [];
        if (loop) {
            loop.addStartHandler(() => currentValue = this.startValue);
            loop.addLoopHandler((v, i, context) => {
                currentValue = this.accumulate(currentValue, v, context);
                updateOnIter.forEach(gen => gen.get(context));
            });
        }
        const currentGen = new ValueGenerator(() => {
            if (!loop) return this.errorValue;
            return currentValue;
        }, true);
        if (this.previewCurrentValue) updateOnIter.push(currentGen);
        return {
            current_value: currentGen,
            final_value: new ValueGenerator((context) => {
                if (!loop) return this.errorValue;
                loop.ensureRun(context);
                if (loop.isFinished(context)) return currentValue;
                return this.errorValue;
            }),
        };
    }
}

class SumComponent extends BaseComponent {
    constructor(){
        super("Sum");
    }

    getInputData() {
        return [
            this.inputData('Loop', new GenericLoopSocket(numSocket)),
            this.inputData('Value', numSocket),
        ];
    }

    getOutputData() {
        return [
            this.outputData('Current Sum', numSocket),
            this.outputData('Final Sum', numSocket),
        ]
    }

    work(inputs) {
        const gen = inputs.value;
        const generators = new Accumulator(inputs.loop, 0, (currentValue, newValue, context) => {
            const add = gen ? gen.get(context) : newValue;
            // console.log('Sum', context, currentValue, add, currentValue + add);
            return +currentValue + add;
        }).generators();
        return {
            current_sum: generators.current_value,
            final_sum: generators.final_value,
        };
    }
}

class CountComponent extends BaseComponent {
    constructor(){
        super("Count");
    }

    getInputData() {
        return [
            this.inputData('Loop', new GenericLoopSocket()),
        ];
    }

    getOutputData() {
        return [
            this.outputData('Current Count', numSocket),
            this.outputData('Final Count', numSocket),
        ]
    }

    work(inputs) {
        const generators = new Accumulator(inputs.loop, 0, (currentValue) => {
            return currentValue + 1;
        }).generators();
        return {
            current_count: generators.current_value,
            final_count: generators.final_value,
        };
    }
}

class AndComponent extends BaseComponent {
    constructor() {
        super('A and B');
    }

    getInputData() {
        return [
            this.inputData('A', boolSocket),
            this.inputData('B', boolSocket),
        ];
    }

    getOutputData() {
        return [
            this.outputData('Satisfied', boolSocket),
        ]
    }

    work(inputs) {
        return new ValueGenerator((context) => {
            const rInputs = this.reify(inputs, context);
            const a = rInputs.a;
            const b = rInputs.b;
            // TODO(twprice): Should create undefined type to return
            if (a === undefined || b === undefined) return false;
            return a && b;
        });
    }
}

class FillList extends BaseComponent {
    constructor() {
        super('Fill a List');
    }

    getAllData() {
        const valueSocket = new GenericSocket();
        return {
            inputs: [
                this.inputData('Size', numSocket, true),
                this.inputData('Value', valueSocket),
            ],
            outputs: [
                this.outputData('List', new GenericListSocket(valueSocket)),
            ]
        }
    }

    work(inputs) {
        return new ValueGenerator((context) => {
            const size = this.reifyValue(inputs.size, context);
            const list = [];
            for (var i = 0; i < size; i++) {
                list[i] = this.reifyValue(inputs.value, new IterContext(context, 'List', i, i));
            }
            return list;
        });
    }
}

class ListLengthComponent extends BaseComponent {
    constructor() {
        super('List Length');
    }

    getAllData() {
        return {
            inputs: [
                this.inputData('List', new GenericListSocket()),
            ],
            outputs: [
                this.outputData('Length', numSocket),
            ]
        }
    }

    work(inputs) {
        return new ValueGenerator((context) => {
            const list = this.reifyValue(inputs.list, context);
            return list == null ? 0 : list.length;
        });
    }
}

class ListItemComponent extends BaseComponent {
    constructor() {
        super('List Item');
    }

    getAllData() {
        const listSocket = new GenericListSocket();
        return {
            inputs: [
                this.inputData('List', listSocket),
                this.inputData('Index', numSocket),
            ],
            outputs: [
                this.outputData('Value', new GenericSocket(listSocket)),
            ]
        }
    }

    work(inputs) {
        return new ValueGenerator((context) => {
            const rInputs = this.reify(inputs, context);
            const list = rInputs.list, index = rInputs.index;
            if (list == null || index == null) return null;
            return list[index];
        });
    }
}

class SublistComponent extends BaseComponent {
    constructor() {
        super('Sublist');
    }

    getAllData() {
        const listSocket = new GenericListSocket();
        return {
            inputs: [
                this.inputData('List', listSocket),
                this.outputData('Start Index', numSocket, true),
                this.outputData('End Index (Excl)', numSocket, true),
            ],
            outputs: [
                this.inputData('Sublist', new GenericListSocket(listSocket)),
            ]
        }
    }

    work(inputs) {
        return new ValueGenerator((context) => {
            const rInputs = this.reify(inputs, context);
            const list = rInputs.list,
                startIndex = rInputs.start_index,
                endIndex = rInputs.end_index;
            return list == null ? null : list.slice(startIndex, endIndex);
        });
    }
}

class LoopToListComponent extends BaseComponent {
    constructor() {
        super('Loop to List');
    }

    getAllData() {
        const valueSocket = new GenericSocket();
        return {
            inputs: [
                this.inputData('Loop', new GenericLoopSocket()),
                this.inputData('Value', valueSocket),
            ],
            outputs: [
                this.outputData('List', new GenericListSocket(valueSocket)),
            ]
        }
    }

    work(inputs) {
        // return new ValueGenerator((context) => {
        //     const loop = this.reifyValue(inputs.loop, context);
        //     var list = null;
        //     loop.addStartHandler(() => { list = []; });
        //     loop.addLoopHandler(iteContext => {
        //         list.push(this.reifyValue(inputs.value, iteContext));
        //     });
        //     loop.ensureRun(context);


        // });

        const generators = new Accumulator(inputs.loop, [],
            (currentValue, newValue, context) => {
                const value = this.reifyValue(inputs.value, context);
                const add = value === undefined ? newValue : value;
                currentValue.push(add);
                return currentValue;
            }
        ).generators();
        return generators.final_value;
    }
}

class TernaryComponent extends BaseComponent {
    constructor() {
        super('If/Then/Else');
    }

    getAllData() {
        const inputSocket = new GenericSocket();
        return {
            inputs: [
                this.inputData('Condition', boolSocket),
                this.inputData('Then Value', inputSocket),
                this.inputData('Else Value', inputSocket),
            ],
            outputs: [
                this.outputData('Value', new GenericSocket(inputSocket)),
            ]
        }
    }

    work(inputs) {
        return new ValueGenerator((context) => {
            const rInputs = this.reify(inputs, context);
            return rInputs.condition ? rInputs.then_value : rInputs.else_value;
        });
    }
}

class IsDivisibleByComponent extends BaseComponent {
    constructor() {
        super('X is Divisible by Y');
    }

    getInputData() {
        return [
            this.inputData('X', numSocket),
            this.inputData('Y', numSocket, true),
        ];
    }

    getOutputData() {
        return [
            this.outputData('Is Divisible', boolSocket),
        ]
    }

    work(inputs) {
        return new ValueGenerator((context) => {
            const rInputs = this.reify(inputs, context);
            return rInputs.x % rInputs.y == 0;
        });
    }

}

export const GeneralComponents = [
    new NumComponent(),
    new StoreComponent(),
    new DivideComponent(),
    new AddComponent(),
    new ForRangeInclusiveComponent(),
    new ForRangeExclusiveComponent(),
    new ForEachComponent(),
    new FilterComponent(),
    new ListLengthComponent(),
    new ListItemComponent(),
    new SublistComponent(),
    new SumComponent(),
    new CountComponent(),
    new FillList(),
    new LoopToListComponent(),
    new AndComponent(),
    new TernaryComponent(),
    new IsDivisibleByComponent(),
]