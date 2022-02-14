import { BaseSocket, stringSocket, boolSocket, GenericListSocket, GenericLoopSocket } from "./sockets";
import { Loop, ValueGenerator } from "../controls/objects";
import { BaseComponent, Accumulator } from './general-comp';
import seedrandom from 'seedrandom';

// TODO: Create object socket
const wordPairSocket = new BaseSocket('Word Pair');

class WordPairTestInput extends BaseComponent {
    constructor(){
        super("Word Pair Test Input");
    }

    getOutputData() {
        return [
            this.outputData('Test', new GenericListSocket(stringSocket),
                true, false, ['the', 'red', 'fox', 'the', 'red']),
        ];
    }
}

class CreateWordPairComponent extends BaseComponent {
    constructor(){
        super("Create Word Pair");
    }

    getInputData() {
        return [
            this.inputData('First Word', stringSocket),
            this.inputData('Second Word', stringSocket),
        ];
    }

    getOutputData() {
        return [
            this.outputData('Word Pair', wordPairSocket),
        ];
    }

    work(inputs) {
        return new ValueGenerator(context => {
            const rInputs = this.reify(inputs, context);
            return [rInputs.first_word, rInputs.second_word];
        });
    }
}

class FirstAndLastWordMatchComponent extends BaseComponent {
    constructor(){
        super("First and Last Word Match");
    }

    getInputData() {
        return [
            this.inputData('Word Pair', wordPairSocket),
        ];
    }

    getOutputData() {
        return [
            this.outputData('Matches', boolSocket),
        ];
    }

    work(inputs) {
        return new ValueGenerator(context => {
            const pair = this.reify(inputs, context).word_pair;
            if (!pair) return false;
            return pair[0] == pair[1];
        });
    }
}

class CreateAllWordPairsComponent extends BaseComponent {
    constructor(){
        super("Create All Word Pairs");
    }

    getInputData() {
        return [
            this.inputData('Outer Loop', new GenericLoopSocket()),
            this.inputData('Inner Loop', new GenericLoopSocket()),
            this.inputData('Word Pair', wordPairSocket),
        ];
    }

    getOutputData() {
        return [
            this.inputData('Word Pair', new GenericListSocket(wordPairSocket)),
        ];
    }

    work(inputs) {
        return new ValueGenerator(context => {
            const outerLoop = this.reifyValue(inputs.outer_loop, context);
            if (!outerLoop) return null;
            let list = null;
            outerLoop.addStartHandler(() => {
                list = [];
            });
            outerLoop.addLoopHandler((_, __, outerContext) => {
                const innerLoop = this.reifyValue(
                    inputs.inner_loop, outerContext);
                if (!innerLoop) return;
                innerLoop.addLoopHandler((_, __, innerContext) => {
                    const pair = this.reifyValue(
                        inputs.word_pair, innerContext);
                    list.push(pair);
                });
                innerLoop.ensureRun(outerContext);
            });
            outerLoop.ensureRun(context);
            return list;
        });
    }
}


export default [
    new WordPairTestInput(),
    new CreateWordPairComponent(),
    new FirstAndLastWordMatchComponent(),
    new CreateAllWordPairsComponent(),
];