import { Output, Input, Component } from "rete";
import { numSocket, listSocket, loopSocket, predicateSocket, boolSocket } from "./sockets";
import { NumControl, ListControl, CodeControl } from "../controls/controls";
import { Loop, ValueGenerator } from "../controls/objects";
import { BaseComponent } from "./general-comp";

class IsLightOn extends BaseComponent {
    constructor(){
        super("Is Light On");
    }

    getInputData() {
        return [
            this.inputData('% Chance', numSocket, true),
        ];
    }

    getOutputData() {
        return [
            this.outputData('Light On', boolSocket),
        ];
    }

    work(inputs) {
        return new ValueGenerator(context => {
            const rInputs = this.reify(inputs, context);
            // TODO: is there some way to force a new context?
            return rInputs['%_chance'] > Math.random() * 100;
        });
    }
}

export default [
    new IsLightOn(),
];