import { BaseComponent } from "./general-comp";
import { numSocket, stringSocket, GenericListSocket, GenericLoopSocket } from "./sockets";
import { IterContext, Loop, ValueGenerator, Stream } from "../controls/objects";

class CompressTestComponent extends BaseComponent {
    constructor(){
        super("Compression Test Input");
    }

    getOutputData() {
        return [
            this.outputData('Test', new GenericListSocket(stringSocket),
                true, false, 'aabcccccaaa'.split('')),
        ];
    }
}

class ReadConsecutiveCharacters extends BaseComponent {
    constructor(){
        super("Start Counting");
    }

    getAllData() {
        return {
            'input': [
                this.inputData('Loop', new GenericLoopSocket(stringSocket))
            ],
            'output': [
                this.outputData('Char', stringSocket),
                this.outputData('Count', numSocket),
            ],
        }
    }

    work(inputs) {
        // TODO: What context do I use? Should be the same for both..
        // This is hard and complex and I don't know if it's good for students..
        new ValueGenerator(context => {
            let stream = Stream.fromInput(inputs.loop, context);
            let c = stream.next();
            let count = 1;
            while (stream.peek() == c) {
                count++;
            }
        });
    }
}

// class CompressTestComponent extends BaseComponent {
//     constructor(){
//         super("Compression Test Input");
//     }

//     getOutputData() {
//         return [
//             this.outputData('Test', new GenericListSocket(numSocket), true, false,
//                 'aabcccccaaa'.split()),
//         ];
//     }
// }

export default [
    new CompressTestComponent(),
];