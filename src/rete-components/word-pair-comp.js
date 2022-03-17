import { BaseSocket, stringSocket, boolSocket, GenericListSocket, GenericLoopSocket } from "./sockets";
import { Loop, ValueGenerator } from "../controls/objects";
import { BaseComponent, Accumulator } from './general-comp';

// TODO: Create object socket
const wordPairSocket = new BaseSocket('Word Pair');
const stringListSocket = new GenericListSocket(stringSocket);
const stringLoopSocket = new GenericLoopSocket(stringSocket);

class WordPairTestInput extends BaseComponent {
    constructor(){
        super("Word Pair Test Input");
    }

    getOutputData() {
        return [
            this.outputData('Test', stringListSocket,
                true, false, ['the', 'red', 'fox', 'the', 'red']),
        ];
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
        }, false, inputs.word_pair);
    }
}

class CreateAllWordPairsComponent extends BaseComponent {
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
            this.outputData('Word Pair', new GenericListSocket(wordPairSocket)),
        ];
    }

    work(inputs) {
        const outerLoop = inputs.first_word && inputs.first_word.loop;
        const innerLoop = inputs.second_word && inputs.second_word.loop;
        if (!outerLoop || !innerLoop) return null;

        let list = null;
        let firstWord = undefined;
        outerLoop.addStartHandler(() => {
            list = [];
        });
        outerLoop.addLoopHandler((firstWordValue, index, outerContext) => {
            firstWord = firstWordValue;
            // console.log('first', firstWord);
        });
        innerLoop.addLoopHandler((secondWord, index, innerContext) => {
            const pair = [firstWord, secondWord];
            // console.log(pair);
            list.push(pair);
        });
        const gen = new ValueGenerator(context => {
            return list;
        });
        outerLoop.addStopHandler(context => gen.get(context));
        return gen;
    }
}


export default [
    new WordPairTestInput(),
    // new CreateWordPairComponent(),
    new FirstAndLastWordMatchComponent(),
    new CreateAllWordPairsComponent(),
];