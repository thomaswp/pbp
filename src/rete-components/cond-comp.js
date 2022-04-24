import { numSocket, boolSocket, stringSocket, GenericSocket, GenericListSocket, GenericLoopSocket, controlSocket, anyValueSocket } from "./sockets";
import { IterContext, Loop, Stream, ValueGenerator, ControlHandler } from "../controls/objects";
import { Category, BaseComponent, CallableComponent } from "./general-comp";

export const CATEGORY_CONDITIONAL = new Category('If/Filter');

export class BaseFilterComponent extends BaseComponent {

    // Abstract method
    getSocket() {
        return new GenericSocket();
    }

    // Abstract method
    keepValue(value, inputs, context) {
        return true;
    }

    getAllData() {
        const inputSocket = this.getSocket();
        return {
            inputs: [
                this.inputData('Value', inputSocket),
            ],
            outputs: [
                this.outputData('Value', new GenericSocket(inputSocket)),
            ]
        }
    }

    work(inputs) {
        if (!inputs.value) return null;
        const baseLoop = inputs.value.loop;
        if (!baseLoop) return null;
        const loop = Loop.wrap(baseLoop, () => {
            return (v, __, context) => {
                if (v === undefined) return v; // Ignore end-of-loop
                const value = this.reifyValue(inputs.value, context);
                // console.log(value);
                return this.keepValue(value, inputs, context) ?
                    value : undefined;
            };
        });
        return loop.createValueGenerator();
    }
}

class FilterComponent extends BaseFilterComponent {
    constructor() {
        super("Filter", CATEGORY_CONDITIONAL);
    }

    getAllData() {
        const data = super.getAllData();
        data.inputs.push(this.inputData('Condition', boolSocket));
        return data;
    }

    keepValue(value, inputs, context) {
        return this.reifyValue(inputs.condition, context);
    }
}

export class IfComponent extends CallableComponent {
    constructor(name, categories) {
        super(name || "If", categories || CATEGORY_CONDITIONAL);
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

class TernaryComponent extends BaseComponent {
    constructor() {
        super('If/Then/Else', CATEGORY_CONDITIONAL);
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

[
    new FilterComponent(),
    new IfComponent(),
    new TernaryComponent(),
]