import { numSocket, listSocket, loopSocket, predicateSocket, boolSocket } from "./sockets";
import { NumControl, ListControl, CodeControl, ExecutionTraceControl } from "../controls/controls";
import { Loop, ValueGenerator } from "../controls/objects";
import {BaseComponent} from "./general-comp"


export class CustomComponent extends BaseComponent {
    constructor(name, inputs, outputs) {
        super(name, inputs, outputs);
    }

    setup(inputs, outputs) {
        this.inputs = inputs;
        this.outputs = outputs;
    }

    
    getInputData() {
        const inputs = this.inputs;
        console.log(inputs)
        var inpts = []
        for (let i = 0; i < inputs.length; i++) {
            var input = inputs[i]
            console.log(input[0])
            if (input[1] == "Number") {
                inpts.push(this.inputData(input[0], numSocket, true, false, 0))
            } else {
                inpts.push(this.inputData(input[0], boolSocket, true, false, 0))
            }
        }
        return inpts;
    }

    getOutputData() {
        const outputs = this.outputs;
        console.log(outputs)
        var outpts = []
        for (let i = 0; i < outputs.length; i++) {
            var output= outputs[i]
            if (output[1] == "Number") {
                outpts.push(this.outputData(output[0], numSocket, true, false, 0))
            } else {
                outpts.push(this.outputData(output[0], boolSocket, true, false, 0))
            }
        }
        return outpts;
    }
}