import { numSocket, GenericLoopSocket, controlSocket, GenericListSocket, GenericSocket } from "./sockets";
import { Loop, ValueGenerator } from "../controls/objects";
import { BaseComponent, CallableComponent, LoopComponent } from "./general-comp";

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

class LoopUntilValue extends LoopComponent {
    constructor(){
        super("Loop Until Value");
    }

    getAllData() {
        return {
            inputs: [
                this.inputData('List', new GenericListSocket(numSocket), true),
                this.inputData('Stop', numSocket, true, -999),
            ],
            outputs: [
                this.outputData('Value', numSocket),
            ]
        }
    }

    createLoop(inputs) {
        return new Loop(this.name, (context) => {
            const rInputs = this.reify(inputs, context);
            const list = rInputs.list;
            let i = 0;
            return () => {
                if (!list) return undefined;
                if (list[i] == rInputs.stop) return undefined;
                if (list && i < list.length) return list[i++];
                return undefined;
            }
        });
    }
}

class FilterPositiveComponent extends BaseComponent {
    constructor(){
        super("Exclude Negatives");
    }

    getAllData() {
        const inputSocket = new GenericSocket();
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
        const loop = new Loop(this.name, (context) => {
            const iterator = baseLoop.iterator(context);
            return () => {
                let value;
                while ((value = iterator.next()) !== undefined) {
                    if (value >= 0) return value;
                }
                return undefined;
            }
        });
        return loop.createValueGenerator(true);
    }
}

export default [
    new TestInputComponent(),
    new LoopUntilValue(),
    new IfZeroComponent(),
    new FilterPositiveComponent(),
];