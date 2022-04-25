import { numSocket, listSocket, loopSocket, predicateSocket, boolSocket, stringSocket } from "./sockets";
import { NumControl, ListControl, CodeControl, ExecutionTraceControl } from "../controls/controls";
import { Loop, ValueGenerator } from "../controls/objects";
import {BaseComponent} from "./general-comp"

export class CustomComponentDescription {

    constructor(...args) {
        if (args.length == 3) {    
            this.name = args[0];
            this.inputs = args[1];
            this.outputs = args[2];
        } else if (args.length == 1) {
            Object.assign(this, args[0]);
        }
    }

    createComponent() {
        return new CustomComponent(this.name, this.inputs, this.outputs);
    }
}


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
        var inpts = []
        for (let i = 0; i < inputs.length; i++) {
            // get next input
            var input = inputs[i]
            // check if it's a list
            if (input[2]) {
                inpts.push(this.inputData(input[0], loopSocket))
            } else {
                // switch on type
                switch (input[1]) {
                    // TODO: handle list and loop
                    case "Number":
                        inpts.push(this.inputData(input[0], numSocket, true, 0))
                        break;
                    case "Boolean":
                        inpts.push(this.inputData(input[0], boolSocket))
                        break;
                    case "String":
                        inpts.push(this.inputData(input[0], stringSocket))
                        break;
                    case "Other":
                    default:
                        inpts.push(this.inputData(input[0], predicateSocket))
                        break;
                }
            }
        }
        return inpts;
    }

    getOutputData() {
        const outputs = this.outputs;
        var outpts = []
        for (let i = 0; i < outputs.length; i++) {
            var output= outputs[i]
            
            // check if it's a list
            if (output[2]) {
                outpts.push(this.outputData(output[0], loopSocket))
            } else {
                // switch on type
                switch(output[1]) {
                    // TODO: handle list and loop
                    case "Number":
                        outpts.push(this.outputData(output[0], numSocket, false, true, 0))
                        break;
                    case "Boolean":
                        outpts.push(this.outputData(output[0], boolSocket))
                        break;
                    case "String":
                        outpts.push(this.outputData(output[0], stringSocket))
                        break;
                    case "Other":
                    default:
                        outpts.push(this.outputData(output[0], predicateSocket))
                }
            }
        }
        return outpts;
    }
}