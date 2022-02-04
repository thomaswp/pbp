import { Output, Input, Component } from "rete";
import { numSocket, listSocket, loopSocket, predicateSocket, boolSocket } from "./sockets";
import { NumControl, ListControl, CodeControl } from "../controls/controls";
import { Loop, ValueGenerator } from "../controls/objects";
import { BaseComponent } from "./general-comp";
import seedrandom from 'seedrandom';

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
        const rand = seedrandom(this.name);
        return new ValueGenerator(context => {
            const rInputs = this.reify(inputs, context);
            return rInputs['%_chance'] > rand() * 100;
        });
    }
}

class LightBoardTestInput extends BaseComponent {
    constructor() {
        super("Light Board Test Input");
    }

    getOutputData() {
        return [
            this.outputData('Row', numSocket, true, false),
            this.outputData('Column', numSocket, true, false),
        ];
    }
}

class CountLights extends BaseComponent {

    constructor(rowOrCol){
        super("Count Lights on in " + rowOrCol);
        this.rowOrCol = rowOrCol;
    }

    getInputData() {
        return [
            this.inputData('Light Board', listSocket),
            this.inputData(this.rowOrCol, numSocket, true),
        ];
    }

    getOutputData() {
        return [
            this.outputData('Count', numSocket),
        ];
    }

    work(inputs) {
        return new ValueGenerator(context => {
            const rInputs = this.reify(inputs, context);
            const board = rInputs.light_board, index = rInputs[this.rowOrCol.toLowerCase()];
            if (board == null) return null;
            const list = this.rowOrCol === 'Row' ? board[index] : board.map(row => row[index]);
            return list.reduce((a, b) => a + b, 0);
        });
    }
}

class CountLightsOnInRow extends CountLights {
    constructor() {
        super('Row');
    }
}

class CountLightsOnInCol extends CountLights {
    constructor() {
        super('Column');
    }
}

class IsLightBoardOn extends BaseComponent {
    constructor() {
        super('Is Light Board On');
    }

    getInputData() {
        return [
            this.inputData('Light Board', listSocket),
            this.inputData('Row', numSocket),
            this.inputData('Column', numSocket),
        ];
    }

    getOutputData() {
        return [
            this.outputData('Is On', boolSocket),
        ]
    }

    work(inputs) {
        return new ValueGenerator(context => {
            const rInputs = this.reify(inputs, context);
            const board = rInputs.light_board, row = rInputs.row, col = rInputs.column;
            if (board == null) return null;
            return board[row][col];
        });
    }
}

export default [
    new LightBoardTestInput(),
    new IsLightOn(),
    new CountLightsOnInRow(),
    new CountLightsOnInCol(),
    new IsLightBoardOn(),
];