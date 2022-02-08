import { numSocket, GenericLoopSocket, boolSocket, GenericListSocket } from "./sockets";
import { Loop, ValueGenerator } from "../controls/objects";
import { BaseComponent } from "./general-comp";

class IfZeroComponent extends BaseComponent {
    constructor(){
        super("If Zero");
    }

    getInputData() {
        return [
            this.inputData('Number', numSocket),
            this.inputData('Then', numSocket, true, 0),
            this.inputData('Else', numSocket, true, 0),
        ];
    }

    getOutputData() {
        return [
            this.outputData('Out', numSocket),
        ];
    }

    work(inputs) {
        return new ValueGenerator(context => {
            inputs = this.reify(inputs, context);
            return inputs.number == 0 ? inputs.then : inputs.else;
        })
    }
}

class TestInputComponent extends BaseComponent {
    constructor(){
        super("Test Input");
    }

    getOutputData() {
        return [
            this.outputData('Test', new GenericListSocket(numSocket), true, false,
                [5, -3, 7, -200, 9, -999, 10]),
        ];
    }
}

class LoopUntilValue extends BaseComponent {
    constructor(){
        super("Loop Until Value");
    }

    getInputData() {
        return [
            this.inputData('List', new GenericListSocket(numSocket), true),
            this.inputData('Stop', numSocket, true, -999),
        ];
    }

    getOutputData() {
        return [
            this.outputData('Loop', new GenericLoopSocket(numSocket)),
            this.outputData('Value', numSocket),
        ];
    }

    work(inputs) {
        let index;
        let loop = new Loop(this.name, (context) => {
            const rInputs = this.reify(inputs, context);
            const list = rInputs.list;
            let i = 0;
            return () => {
                if (!list) return undefined;
                index = i;
                if (list[i] == rInputs.stop) return undefined;
                if (list && i < list.length) return list[i++];
                return undefined;
            }
        });
        let value = new ValueGenerator(() => index);
        return {
            loop: loop,
            value: value,
        };
    }
}

class FilterPositiveComponent extends BaseComponent {
    constructor(){
        super("Include Only Positives");
    }

    getAllData() {
        const loopSocket = new GenericLoopSocket(numSocket)
        return {
            inputs: [
                this.inputData('Loop', loopSocket),
            ], 
            outputs: [
                this.outputData('Loop', loopSocket),
            ]
        }
    }

    work(inputs) {
        if (!inputs.loop) return null;
        return new Loop(this.name, (context) => {
            const baseLoop = this.reify(inputs, context).loop;
            const iterator = baseLoop.iterator(context);
            return () => {
                let value;
                while ((value = iterator.next()) !== undefined) {
                    if (value >= 0) return value;
                }
                return undefined;
            }
        });
    }
}

export default [
    new TestInputComponent(),
    new LoopUntilValue(),
    new IfZeroComponent(),
    new FilterPositiveComponent(),
];