
import { numSocket, boolSocket, stringSocket, GenericSocket, GenericListSocket, GenericLoopSocket, controlSocket, anyValueSocket } from "./sockets";
import { IterContext, Loop, Stream, ValueGenerator, ControlHandler } from "../controls/objects";
import { Category, BaseComponent } from "./general-comp";

export const CATEGORY_OPERATORS = new Category('Operators');

class NumComponent extends BaseComponent {

    constructor(){
        super("Number", CATEGORY_OPERATORS);
    }

    getOutputData() {
        return [
            this.outputData('Number', numSocket, true, false, 0),
        ];
    }
}

class DivideComponent extends BaseComponent {
    constructor() {
        super("Divide", CATEGORY_OPERATORS);
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
        }, false, [inputs.numerator, inputs.denominator]);
    }
}

class AddComponent extends BaseComponent {
    constructor() {
        super("Add", CATEGORY_OPERATORS);
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

class AndComponent extends BaseComponent {
    constructor() {
        super('A and B', CATEGORY_OPERATORS);
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
        }, false, [inputs.a, inputs.b]);
    }
}

class IsDivisibleByComponent extends BaseComponent {
    constructor() {
        super('X is Divisible by Y', CATEGORY_OPERATORS);
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
        }, false, [inputs.x, inputs.y]);
    }

}

[
    new NumComponent(),
    new AddComponent(),
    new DivideComponent(),
    new IsDivisibleByComponent(),
    new AndComponent(),
]