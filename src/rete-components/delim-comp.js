import { Output, Input, Component } from "rete";
import { numSocket, listSocket, loopSocket, stringSocket, predicateSocket } from "./sockets";
import { NumControl, ListControl, LoopControl, CodeControl } from "../controls/controls";
import { Loop, ValueGenerator } from "../controls/objects";
import { BaseComponent } from "./general-comp";

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

class CountOpenDelimiters extends BaseComponent {
    constructor(){
        super("Count Open Delims");
    }

    getInputData() {
        return [
            this.inputData('Loop', loopSocket),
        ];
    }

    getOutputData() {
        return [
            this.outputData('Current Count', numSocket),
        ]
    }

    work(inputs) {
        // const loop = inputs.loop;
        // let sum = new Accumulator(loop, (sum, i) => {
        //     if (!gen) return sum + i;
        //     return sum + gen.get();
        // }, 0);
        // return new ValueGenerator(() => sum.calculate());
    }
}

export default [
    new DelimTestInput(),
    new CountOpenDelimiters(),
];