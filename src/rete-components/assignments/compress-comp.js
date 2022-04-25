import { BaseComponent, BaseFilterComponent } from "../general-comp";
import { numSocket, stringSocket, GenericListSocket, GenericLoopSocket } from "../sockets";
import { IterContext, Loop, ValueGenerator, Stream } from "../../controls/objects";
import { Category } from "../general-comp";
import { CATEGORY_OPERATORS } from "../operators-comp";

export const CATEGORY_COMPRESS = new Category('Compress String', true);

class CompressTestComponent extends BaseComponent {
    constructor(){
        super("Compression Test Input", CATEGORY_COMPRESS);
    }

    getOutputData() {
        return [
            this.outputData('Test', new GenericListSocket(stringSocket),
                true, false, 'aabcccccaaa'.split('')),
        ];
    }
}

class CountConsecutiveCharacters extends BaseComponent {
    constructor(){
        super("Read Consecutive Characters", CATEGORY_COMPRESS);
    }

    getAllData() {
        return {
            inputs: [
                this.inputData('Char', stringSocket)
            ],
            outputs: [
                this.outputData('Char', stringSocket),
                this.outputData('Count', numSocket),
            ],
        }
    }

    work(inputs) {
        // TODO: cannot just return null
        if (!inputs.char) return null;
        const baseLoop = inputs.char.loop;
        if (!baseLoop) return null;
        let lastCount;
        const loop = Loop.wrap(baseLoop, () => {
            let lastChar = null;
            let count = 0;
            return (v, __, context) => {
                // If end-of-loop, don't read. This ensures another iteration
                const value = v === undefined ? v :
                    this.reifyValue(inputs.char, context);
                if (lastChar == null) lastChar = value;
                if (lastChar != value) {
                    const c = lastChar;
                    lastCount = count;
                    count = 1;
                    lastChar = value;
                    return c;
                }
                count++;
                // console.log(lastChar, count);
                return undefined;
            };
        });
        return {
            char: loop.createValueGenerator(),
            // todo
            count: new ValueGenerator(() => lastCount, false, loop),
        }
    }
}

class Concat2Component extends BaseComponent {
    constructor() {
        super("Concat Two", [CATEGORY_COMPRESS, CATEGORY_OPERATORS]);
    }

    getInputData() {
        return [
            this.inputData('Add1', stringSocket),
            this.inputData('Add2', numSocket),
        ];
    }

    getOutputData() {
        return [
            this.outputData('Out', stringSocket),
        ];
    }

    work(inputs) {
        return new ValueGenerator((context) => {
            const rInputs = this.reify(inputs, context);
            if (rInputs.add1 === undefined || rInputs.add2 === undefined) {
                return '';
            }
            return '' + rInputs.add1 + rInputs.add2;
        }, false, [inputs.add1, inputs.add2]);
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

[
    new CompressTestComponent(),
    new CountConsecutiveCharacters(),
    new Concat2Component(),
];