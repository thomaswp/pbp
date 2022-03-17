import { Output, Input, Component } from "rete";
import { numSocket, boolSocket, stringSocket, GenericSocket, GenericListSocket, GenericLoopSocket, controlSocket, anyValueSocket } from "./sockets";
import { NumControl, ListControl, CodeControl, ExecutionTraceControl } from "../controls/controls";
import { IterContext, Loop, Stream, ValueGenerator, ControlHandler } from "../controls/objects";

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
        }, false, [inputs.add1, inputs.add2]);
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

export class LoopComponent extends CallableComponent {

    getAllData() {
        const inputSocket = new GenericLoopSocket()
        return {
            inputs: [
                this.inputData('List', inputSocket),
            ],
            outputs: [
                // this.outputData('Loop', new GenericLoopSocket(inputSocket)),
                this.outputData('Value', new GenericSocket(inputSocket)),
                this.outputData('Index', numSocket),
            ]
        }
    }

    getControlOutputData() {
        return [
            this.outputData('Do', controlSocket, false, false),
            ...super.getControlOutputData(),
        ]
    }

    createLoop(inputs) {
        return Loop.toLoop(inputs.list, this.name);
    }

    work(inputs, node) {
        const loop = this.createLoop(inputs);
        const execute = (context) => loop.ensureRun(context);
        this.addDefaultTrigger(inputs, node, execute);
        return {
            // loop,
            value: loop.createValueGenerator(true),
            index: loop.createIndexGenerator(true),
            do: loop.doHandler,
            then: loop.thenHandler,
        };
    }
}

class ForEachComponent extends LoopComponent {
    constructor(){
        super("For Each Loop");
    }
}

class ReadComponent extends BaseComponent {
    constructor(){
        super("Read Items in List");
    }

    getAllData() {
        const inputSocket = new GenericLoopSocket()
        return {
            inputs: [
                this.inputData('List', inputSocket),
            ],
            outputs: [
                // TODO: Should have a different socket that also accepts loops
                this.outputData('Loop', new GenericLoopSocket(inputSocket)),
                // this.outputData('Value', new GenericSocket(inputSocket)),
                // this.outputData('Index', numSocket),
            ]
        }
    }

    work(inputs) {
        return new ValueGenerator(context => {
            return Stream.fromInput(inputs.list, context);
        });
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
        const baseLoop = Loop.toLoop(inputs.loop);
        if (!baseLoop) return null;
        return new Loop(this.name, (context) => {
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

export class IfComponent extends CallableComponent {
    constructor(name) {
        super(name || "If");
    }

    getInputData() {
        return [
            this.inputData('Condition', boolSocket),
        ];
    }

    getControlOutputData() {
        return [
            ...super.getControlOutputData(),
            this.outputData('Else', controlSocket, false, false),
        ]
    }

    testCondition(inputs, context) {
        return this.reifyValue(inputs.condition, context) == true;
    }

    work(inputs, node) {
        const then = new ControlHandler();
        const el = new ControlHandler();
        const execute = (context) => {
            if (this.testCondition(inputs, context)) {
                then.execute(context);
            } else {
                el.execute(context);
            }
        }
        this.addDefaultTrigger(inputs, node, execute);
        return {
            then,
            else: el,
        }
    }
}

export class Accumulator {
    constructor(generator, startValue, accumulate, errorValue) {
        this.accumulate = accumulate;
        this.generator = generator;
        // TODO: Backwards compatibility - remove and warn
        if (generator instanceof Loop) {
            this.loop = generator;
        } else {
            this.loop =  generator ? generator.loop : null;
        }
        this.startValue = startValue;
        this.errorValue = errorValue || Number.NaN;
        this.previewCurrentValue = true;
    }

    generators() {
        const loop = Loop.toLoop(this.loop);
        let currentValue = this.startValue;
        const updateOnIter = [];
        if (loop) {
            loop.addStartHandler(() => currentValue = this.startValue);
            loop.addLoopHandler((v, i, context) => {
                currentValue = this.accumulate(currentValue, v, context);
                updateOnIter.forEach(gen => gen.get(context));
            });
        }
        // If our generator has no loop, we simply iterate once on the
        // generator's value
        const getSingleValue = (context) => {
            if (!this.generator) return this.errorValue;
            const next = this.generator.get(context);
            return this.accumulate(this.startValue, next, context);
        };
        const currentGen = new ValueGenerator((context) => {
            if (!this.loop) return getSingleValue(context);
            return currentValue;
        }, true);
        currentGen.loop = this.loop;
        if (this.previewCurrentValue) updateOnIter.push(currentGen);
        const finalGen = new ValueGenerator((context) => {
            if (!this.loop) return getSingleValue(context);
            // loop.ensureRun(context);
            if (loop.isFinished(context)) return currentValue;
            return this.errorValue;
        });

        return {
            current_value: currentGen,
            final_value: finalGen,
        };
    }
}

class SumComponent extends BaseComponent {
    constructor(){
        super("Sum");
    }

    getInputData() {
        return [
            // this.inputData('Loop', new GenericLoopSocket(numSocket)),
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
        const generators = new Accumulator(gen, 0,
            (currentValue, _, context) => {
                const add = gen.get(context);
                // console.log('Sum', context, currentValue, add, currentValue + add);
                return +currentValue + +add;
            }
        ).generators();
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
            // this.inputData('Loop', new GenericLoopSocket()),
            this.inputData('Value', anyValueSocket),
        ];
    }

    getOutputData() {
        return [
            this.outputData('Current Count', numSocket),
            this.outputData('Final Count', numSocket),
        ]
    }

    work(inputs) {
        const generators = new Accumulator(inputs.value, 0, (currentValue) => {
            return currentValue + 1;
        }).generators();
        return {
            current_count: generators.current_value,
            final_count: generators.final_value,
        };
    }
}

class JoinComponent extends BaseComponent {
    constructor(){
        super("Join Strings");
    }

    getInputData() {
        return [
            this.inputData('Loop', new GenericLoopSocket(stringSocket)),
            this.inputData('String', stringSocket),
        ];
    }

    getOutputData() {
        return [
            this.outputData('Current Value', numSocket),
            this.outputData('Final Value', numSocket),
        ]
    }

    work(inputs) {
        const gen = inputs.string;
        const generators = new Accumulator(inputs.loop, '',
            (currentValue, newValue, context) => {
                const add = gen ? gen.get(context) : newValue;
                // console.log('Sum', context, currentValue, add, currentValue + add);
                return currentValue + add;
            }
        ).generators();
        return generators;
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
                this.outputData('End Index', numSocket, true),
            ],
            outputs: [
                this.inputData('Sublist', new GenericListSocket(listSocket)),
                // this.inputData('Sublist Value', new GenericSocket(listSocket)),
                // this.inputData('Sublist Index', numSocket),
            ]
        }
    }

    work(inputs) {
        return new ValueGenerator((context) => {
            const rInputs = this.reify(inputs, context);
            const list = rInputs.list,
                startIndex = Math.max(0, rInputs.start_index),
                endIndex = rInputs.end_index;
            return list == null ? null : list.slice(startIndex, endIndex);
        });
        // return {
            // sublist: gen,
            // sublist_value: loop.createValueGenerator(true),
            // sublist_index: loop.createIndexGenerator(true),
        // }
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
    new DebugComponent(),
    new NumComponent(),
    new StoreComponent(),
    new DivideComponent(),
    new AddComponent(),
    new ForRangeInclusiveComponent(),
    new ForRangeExclusiveComponent(),
    new ForEachComponent(),
    new FilterComponent(),
    new IfComponent(),
    new ListLengthComponent(),
    new ListItemComponent(),
    new SublistComponent(),
    new SumComponent(),
    new CountComponent(),
    new JoinComponent(),
    new FillList(),
    new LoopToListComponent(),
    new AndComponent(),
    new TernaryComponent(),
    new IsDivisibleByComponent(),
]