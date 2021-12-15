import { Output, Input, Component } from "rete";
import { numSocket, listSocket, loopSocket, predicateSocket } from "./sockets";
import { NumControl, ListControl, LoopControl, CodeControl } from "../controls/controls";
import { Loop } from "../controls/objects";
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
        inputs = this.reify(inputs);
        return inputs.number == 0 ? inputs.then : inputs.else;
    }
}

class TestInputComponent extends BaseComponent {
    constructor(){
        super("Test Input");
    }

    getOutputData() {
        return [
            this.outputData('Test', listSocket, true, false, 
                [5, -3, 7, -200, 9, -999, 10]),
        ];
    }
}

export default [
    new TestInputComponent(),
    new IfZeroComponent(),
];