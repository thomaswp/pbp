import { numSocket, boolSocket, stringSocket, GenericSocket, GenericListSocket, GenericLoopSocket, controlSocket, anyValueSocket } from "./sockets";
import { IterContext, Loop, Stream, ValueGenerator, ControlHandler } from "../controls/objects";
import { Category, BaseComponent } from "./general-comp";

export const CATEGORY_ACCUMULATOR = new Category('Accumulators');

export class Accumulator {
    constructor(generator, startValue, accumulate, errorValue) {
        this.accumulate = accumulate;
        this.generator = generator;
        // TODO: Backwards compatibility - remove and warn
        if (generator instanceof Loop) {
            this.loop = generator;
        } else {
            this.loop =  generator ? generator.loop : null;
        }
        this.startValue = startValue;
        this.errorValue = errorValue || Number.NaN;
        this.previewCurrentValue = true;
    }

    generators() {
        const loop = Loop.toLoop(this.loop);
        let currentValue = this.startValue;
        if (loop && this.generator) {
            loop.addStartHandler(() => currentValue = this.startValue);

            const acc = context => {
                const next = this.generator.get(context);
                currentValue = this.accumulate(currentValue, next, context);
            }

            // This hacky solution allows us to treat embedded parent loops
            // differently, since they should execute after the nested loop
            // has run.
            if (this.generator.isParentLoop) {
                loop.doHandler.addHandler(context => acc(context));
            } else {
                loop.addLoopHandler((_, __, context) => {
                    acc(context);
                });
            }
        }
        // If our generator has no loop, we simply iterate once on the
        // generator's value
        const getSingleValue = (context) => {
            if (!this.generator) return this.errorValue;
            const next = this.generator.get(context);
            return this.accumulate(this.startValue, next, context);
        };
        const currentGen = new ValueGenerator((context) => {
            if (!this.loop) return getSingleValue(context);
            return currentValue;
        }, !this.previewCurrentValue, loop);
        currentGen.loop = this.loop;

        const outerLoop = loop ? loop.parent : null;
        // console.log(outerLoop);
        const finalGen = new ValueGenerator((context) => {
            // console.log(currentValue, loop.isFinished(context));
            if (!this.loop) return getSingleValue(context);
            if (loop.isFinished(context)) return currentValue;
            // console.log('not finished', currentValue);
            return this.errorValue;
        }, false, outerLoop, true);

        return {
            current_value: currentGen,
            final_value: finalGen,
        };
    }
}

class SumComponent extends BaseComponent {
    constructor(){
        super("Sum", CATEGORY_ACCUMULATOR);
    }

    getInputData() {
        return [
            // this.inputData('Loop', new GenericLoopSocket(numSocket)),
            this.inputData('Value', numSocket),
        ];
    }

    getOutputData() {
        return [
            this.outputData('Current Sum', numSocket),
            this.outputData('Final Sum', numSocket),
        ]
    }

    work(inputs) {
        const gen = inputs.value;
        const generators = new Accumulator(gen, 0,
            (currentValue, _, context) => {
                const add = gen.get(context);
                // console.log('Sum', context, currentValue, add, currentValue + add);
                return +currentValue + +add;
            }
        ).generators();
        return {
            current_sum: generators.current_value,
            final_sum: generators.final_value,
        };
    }
}

class CountComponent extends BaseComponent {
    constructor(){
        super("Count", CATEGORY_ACCUMULATOR);
    }

    getInputData() {
        return [
            // this.inputData('Loop', new GenericLoopSocket()),
            this.inputData('Value', anyValueSocket),
        ];
    }

    getOutputData() {
        return [
            this.outputData('Current Count', numSocket),
            this.outputData('Final Count', numSocket),
        ]
    }

    work(inputs) {
        const generators = new Accumulator(inputs.value, 0, (currentValue) => {
            return currentValue + 1;
        }).generators();
        return {
            current_count: generators.current_value,
            final_count: generators.final_value,
        };
    }
}

class JoinComponent extends BaseComponent {
    constructor(){
        super("Join Strings", CATEGORY_ACCUMULATOR);
    }

    getInputData() {
        return [
            this.inputData('String', stringSocket),
        ];
    }

    getOutputData() {
        return [
            this.outputData('Current Value', numSocket),
            this.outputData('Final Value', numSocket),
        ]
    }

    work(inputs) {
        const gen = inputs.string;
        const generators = new Accumulator(gen, '',
            (currentValue, newValue, context) => {
                const add = gen ? gen.get(context) : newValue;
                // console.log('Sum', context, currentValue, add, currentValue + add);
                return currentValue + add;
            }
        ).generators();
        return generators;
    }
}

[
    new SumComponent(),
    new CountComponent(),
    new JoinComponent(),
]