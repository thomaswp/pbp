import { numSocket, boolSocket, stringSocket, GenericSocket, GenericListSocket, GenericLoopSocket, controlSocket, anyValueSocket } from "./sockets";
import { IterContext, Loop, Stream, ValueGenerator, ControlHandler } from "../controls/objects";
import { Category, BaseComponent, CallableComponent } from "./general-comp";

export const CATEGORY_LOOPS = new Category('Loops');


export class LoopComponent extends CallableComponent {

    getAllData() {
        const inputSocket = new GenericListSocket()
        return {
            inputs: [
                this.inputData('List', inputSocket),
            ],
            outputs: [
                // this.outputData('Loop', new GenericLoopSocket(inputSocket)),
                this.outputData('Value', new GenericSocket(inputSocket)),
                this.outputData('Index', numSocket),
            ]
        }
    }

    getControlOutputData() {
        return [
            this.outputData('Do', controlSocket, false, false),
            ...super.getControlOutputData(),
        ]
    }

    createLoop(inputs, parentLoop) {
        return Loop.toLoop(inputs.list, this.name, parentLoop);
    }

    work(inputs, node) {
        let parentLoop = null;
        if (inputs.when && inputs.when.parentLoop) {
            parentLoop = inputs.when.parentLoop;
        }
        const loop = this.createLoop(inputs, parentLoop);
        const execute = (context) => loop.ensureRun(context);
        this.addDefaultTrigger(inputs, node, execute);
        return {
            // loop,
            value: loop.createValueGenerator(false),
            index: loop.createIndexGenerator(true),
            do: loop.doHandler,
            then: loop.thenHandler,
        };
    }
}

class ForEachComponent extends LoopComponent {
    constructor(){
        super("For Each Loop", CATEGORY_LOOPS);
    }
}

class ReadComponent extends BaseComponent {
    constructor(){
        super("Read Items in List", CATEGORY_LOOPS);
    }

    getAllData() {
        const inputSocket = new GenericLoopSocket()
        return {
            inputs: [
                this.inputData('List', inputSocket),
            ],
            outputs: [
                // TODO: Should have a different socket that also accepts loops
                this.outputData('Loop', new GenericLoopSocket(inputSocket)),
                // this.outputData('Value', new GenericSocket(inputSocket)),
                // this.outputData('Index', numSocket),
            ]
        }
    }

    work(inputs) {
        return new ValueGenerator(context => {
            return Stream.fromInput(inputs.list, context);
        });
    }
}

class ForRangeComponent extends LoopComponent {
    constructor(name, inclusive){
        super(name, CATEGORY_LOOPS);
        this.inclusive = inclusive;
    }

    getAllData() {
        const inputSocket = new GenericLoopSocket()
        return {
            inputs: [
                this.inputData('From', numSocket, true),
                this.inputData('To', numSocket, true),
            ],
            outputs: [
                // this.outputData('Loop', new GenericLoopSocket(numSocket)),
                this.outputData('Value', numSocket),
            ],
        }
    }

    createLoop(inputs, parentLoop) {
        return new Loop(this.name, (context) => {
            const rInputs = this.reify(inputs, context);
            const from = rInputs.from;
            let to = rInputs.to;
            if (this.inclusive) to++;
            // console.log('Looping:', from, to);
            let i = from;
            return () => {
                if (i < to) return i++;
                return undefined;
            }
        }, parentLoop);
    }
}

class ForRangeInclusiveComponent extends ForRangeComponent {
    constructor() {
        super("For Range Loop (Inclusive)", true);
    }
}

class ForRangeExclusiveComponent extends ForRangeComponent {
    constructor() {
        super("For Range Loop (Exclusive)", false);
    }
}

[
    new ForEachComponent(),
    new ForRangeExclusiveComponent(),
    new ForRangeInclusiveComponent(),
]