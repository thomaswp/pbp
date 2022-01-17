import { Output, Input, Component } from "rete";
import { numSocket, listSocket, loopSocket, stringSocket, predicateSocket, boolSocket } from "./sockets";
import { NumControl, ListControl, LoopControl, CodeControl } from "../controls/controls";
import { Loop, ValueGenerator } from "../controls/objects";
import { BaseComponent } from './general-comp';

class DelimTestInput extends BaseComponent {
    constructor(){
        super("Delimeters Test Input");
    }

    getOutputData() {
        return [
            this.outputData('True Test', listSocket, true, false,
                ['<br>', '<br>', '</br>', '<br>', '</br>', '</br>']),
            this.outputData('False Test', listSocket, true, false,
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
            this.inputData('Loop', loopSocket),
        ];
    }

    getOutputData() {
        return [
            this.outputData('Current Count', numSocket),
            this.outputData('Final Count', numSocket),
        ]
    }

    work(inputs) {
        const loop = inputs.loop, gen = inputs.value;
        let count = 0;
        if (loop) {
            loop.addStartHandler(() => count = 0);
            loop.addLoopHandler((v, i) => {
                const value = gen ? gen.get(i) : v;
                if (this.test(value)) count++;
                // console.log(id, sum, add);
            });
        }
        return {
            // TODO: Need to ensure loop on current too
            'current_count': new ValueGenerator(() => count, true),
            'final_count': new ValueGenerator((iter) => {
                if (!loop) return 0;
                loop.ensureRun(iter);
                if (loop.isFinished(iter)) return count;
                return Number.NaN;
            }),
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
            this.inputData('Loop', loopSocket),
            // TODO: Use scalar or updating loop generics
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
        const loop = inputs.loop,
            open = inputs.open,
            close = inputs.close;
        let satisfied = true;
        if (loop) {
            loop.addStartHandler(() => satisfied = true);
            loop.addLoopHandler((v, i) => {
                if (!open || !close) return;
                console.log(close.get(), open.get(), close.get() > open.get());
                if (close.get() > open.get()) satisfied = false;
            });
        }
        return new ValueGenerator((iter) => {
            if (!loop) return true;
            loop.ensureRun(iter);
            return satisfied;
        });
    }
}

class EnsureEqual extends BaseComponent {

    constructor() {
        super('Ensure Open == Close');
    }

    getInputData() {
        return [
            // TODO: Use scalar or updating loop generics
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
        return new ValueGenerator((iter) => {
            const rInputs = this.reify(inputs, iter);
            const open = rInputs.open;
            const close = rInputs.close;
            // TODO: Should create undefined type to return
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