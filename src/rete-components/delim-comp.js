import { numSocket, stringSocket, boolSocket, GenericListSocket, GenericLoopSocket } from "./sockets";
import { Loop, ValueGenerator } from "../controls/objects";
import { BaseComponent, Accumulator } from './general-comp';

class DelimTestInput extends BaseComponent {
    constructor(){
        super("Delimeters Test Input");
    }

    getOutputData() {
        const socket = new GenericListSocket(stringSocket);
        return [
            this.outputData('True Test', socket, true, false,
                ['<br>', '<br>', '</br>', '<br>', '</br>', '</br>']),
            this.outputData('False Test', socket, true, false,
                ['<br>', '</br>', '</br>', '<br>']),
        ];
    }
}

class CountDelimiters extends BaseComponent {

    constructor(name, test){
        super(name);
        this.test = test;
    }

    getInputData() {
        return [
            this.inputData('Delim', stringSocket),
        ];
    }

    getOutputData() {
        return [
            this.outputData('Current Count', numSocket),
            this.outputData('Final Count', numSocket),
        ]
    }

    work(inputs) {
        const generators = new Accumulator(inputs.delim, 0,
            (currentValue, newValue, context) => {
                return currentValue + (this.test(newValue) ? 1 : 0);
            }
        ).generators();
        return {
            current_count: generators.current_value,
            final_count: generators.final_value,
        };
    }
}

class CountOpenDelimiters extends CountDelimiters {
    constructor() {
        super("Count Open Delims", b => !b.includes('/'));
    }
}

class CountCloseDelimiters extends CountDelimiters {
    constructor() {
        super("Count Close Delims", b => b.includes('/'));
    }
}

class EnsureNeverGreater extends BaseComponent {

    constructor() {
        super('Ensure Always: Open \u2265 Close');
    }

    getInputData() {
        return [
            this.inputData('Open', numSocket),
            this.inputData('Close', numSocket),
        ];
    }

    getOutputData() {
        return [
            this.outputData('Currently Satisfied', boolSocket),
            this.outputData('Finally Satisfied', boolSocket),
        ]
    }

    work(inputs) {
        const open = inputs.open, close = inputs.close;
        let gen = open;
        if (close && close.loop && !(open && open.loop)) gen = close;
        const generators = new Accumulator(gen, true,
            (currentValue, newValue, context) => {
                if (!open || !close) return Number.NaN;
                // console.log(currentValue, close.get(context), open.get(context))
                return currentValue && close.get(context) <= open.get(context);
            }
        ).generators();
        return {
            currently_satisfied: generators.current_value,
            finally_satisfied: generators.final_value,
        };
    }
}

class EnsureEqual extends BaseComponent {

    constructor() {
        super('Ensure Open == Close');
    }

    getInputData() {
        return [
            this.inputData('Open', numSocket),
            this.inputData('Close', numSocket),
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
            const open = rInputs.open;
            const close = rInputs.close;
            // TODO(twprice): Should create undefined type to return
            if (open === undefined || close === undefined) return false;
            return open == close;
        });
    }
}

export default [
    new DelimTestInput(),
    new CountOpenDelimiters(),
    new CountCloseDelimiters(),
    new EnsureNeverGreater(),
    new EnsureEqual(),
];