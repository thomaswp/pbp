import { v4 as uuid } from 'uuid';

export class ExecutionTrace {

    constructor(context, value, parent) {
        this.context = context;
        this.value = value;
        this.parent = parent;
        this.children = new Map();
    }

    static create() {
        const root = new ExecutionTrace(RootContext, null, null);
        return root;
    }

    getExecution(context, createIfMissing) {
        if (context == this.context) return this;

        const parent = context.parent;
        if (!parent) return null;

        const parentExecution = this.getExecution(parent, createIfMissing);
        if (!parentExecution) return null;

        let execution = parentExecution.children.get(context);
        if (!execution && createIfMissing) {
            execution = new ExecutionTrace(context, null, parentExecution);
            parentExecution.children.set(context, execution);
        }
        return execution;
    }

    getValue(context) {
        const exe = this.getExecution(context);
        if (!exe) return null;
        return exe.value;
    }

    addValue(context, value) {
        const execution = this.getExecution(context, true);
        if (!execution) {
            console.warn('No execution for', this, context, value);
            return;
        }
        execution.value = value;
    }
}

class Iterator {
    constructor(loop, context, getValueGenerator) {
        this.loop = loop;
        this.context = context;
        this.isFinished = false;
        this.getNextValue = getValueGenerator(context);
        this.i = 0;
        this.lastIterContext = null;
    }

    next() {
        const iterContext = new IterContext(
            this.context, this.loop, this.i);
        this.lastIterContext = iterContext;
        const value = this.getNextValue(iterContext);
        iterContext.value = value;
        if (value === undefined) {
            if (!this.isFinished) {
                this.isFinished = true;
                this.loop.handleStop(this.context);
            }
            return undefined;
        }
        this.loop.handleIteration(value, this.i, iterContext);
        this.i++;
        return value;
    }
}

export class Loop {
    constructor(description, getIterNextFn, parent) {
        this.parent = parent;
        this.wrappingLoop = null;
        this.description = description;
        this.getIterNextFn = getIterNextFn;
        this.startHandlers = [];
        this.loopHandlers = [];
        this.stopHandlers = [];
        this.doHandler = new ControlHandler(this);
        this.thenHandler = new ControlHandler();
        this.iterators = new Map();
        this.executionTrace = new ExecutionTrace.create();
        this.lastIndex = undefined;
        this.lastValue = undefined;
    }


    /**
     * Creates a loop that will iterate through a given list.
     *
     * @param {*} object A Loop, array, function context => list,
     *                   or ValueGenerator to convert or return.
     * @param {string} description Description for the loop if this is a list
     * @returns A loop that will iterate through the list
     */
    static toLoop(object, description, parent) {
        if (object instanceof Loop ) return object;
        if (Array.isArray(object) || object == null) {
            description |= "List";
            const list = object;
            object = new ValueGenerator(() => list);
        } else if (typeof object === 'function') {
            object = new ValueGenerator(object);
        } else if (!(object instanceof ValueGenerator)) {
            console.warn('Improper input: ', object);
            return null;
        }
        return new Loop(description, context => {
            let list = object.get(context);
            // console.log('list', description, list);
            if (list == null) {
                return () => undefined;
            }
            let index = 0;
            return iterContext => {
                // console.log('iter', index);
                return list[index++];
            };
        }, parent);
    }

    static wrap(baseLoop, makeUpdater) {
        let iterator = null;
        let value = null;
        let updater = () => {};
        const loop = new Loop(this.name, () => {
            return () => value;
        }, baseLoop.parent);
        // TODO: Currently does nothing; would be nice to somehow have wrapped
        // loops also highlight when their sub-loops are highlighted, but not
        // sure how that would be possible, since it's at the iteration level,
        // not the loop level...
        loop.wrappingLoop = baseLoop;
        baseLoop.addStartHandler(context => {
            iterator = loop.iterator(context);
            updater = makeUpdater(context);
        });
        const tryIter = (v, index, context) => {
            const testValue = updater(v, index, context);

            // Could extend to separate should update from what to update, but
            // I think this is ok for now
            if (testValue === undefined) return;
            value = testValue;
            iterator.next();
        };
        baseLoop.addLoopHandler((v, i, context) => {
            tryIter(v, i, context);
        });
        baseLoop.addStopHandler(context => {
            // Special try at the end for end of loop
            tryIter(undefined, undefined, context);
            // console.log("!!");
            iterator.isFinished = true;
            loop.handleStop(context);
        });
        return loop;
    }

    createIndexGenerator(lazy) {
        return new ValueGenerator(() => this.lastIndex, lazy, this);
    }

    createValueGenerator(lazy) {
        return new ValueGenerator(() => this.lastValue, lazy, this);
    }

    // createDoHandler() {
    //     const handler = new ControlHandler();
    //     this.addLoopHandler((_, __, context) => {
    //         // console.log('Doing', context);
    //         handler.execute(context);
    //     });
    //     return handler;
    // }

    // createThenHandler() {
    //     const handler = new ControlHandler();
    //     this.addStopHandler((context) => handler.execute(context));
    //     return handler;
    // }

    iterator(context) {
        if (context == null) throw 'Context cannot be null';
        const iterator = new Iterator(this, context, this.getIterNextFn);
        this.iterators.set(context, iterator);
        this.lastIndex = undefined;
        this.lastValue = undefined;
        this.startHandlers.forEach(h => h(context));
        return iterator;
    }

    handleIteration(value, index, iterContext) {
        this.lastIndex = index;
        this.lastValue = value;
        this.executionTrace.addValue(iterContext, value);
        this.loopHandlers.forEach(h => h(value, index, iterContext));
        this.doHandler.execute(iterContext);
    }

    handleStop(context) {
        this.stopHandlers.forEach(h => h(context));
        this.thenHandler.execute(context);
    }

    addLoopHandler(handler) {
        this.loopHandlers.push(handler);
    }

    addStartHandler(handler) {
        this.startHandlers.push(handler);
    }

    addStopHandler(handler) {
        this.stopHandlers.push(handler);
    }

    ensureRun(context) {
        context = context || RootContext;
        if (this.iterators.has(context)) return;
        return this.#run(context);
    }

    isFinished(context) {
        const iterator = this.iterators.get(context);
        // console.log(iterator);
        return iterator && iterator.isFinished;
    }

    #run(context) {
        const iterator = this.iterator(context);
        const list = [];
        let item;
        while ((item = iterator.next()) !== undefined) {
            list.push(item);
        }
        return list;
    }
}

export class Stream {
    constructor(list) {
        this.list = list;
        this.index = 0;
    }

    static fromInput(input, context) {
        if (input instanceof ValueGenerator) input = input.get(context);
        if (input instanceof Stream) return input;
        // TODO: This only works if the loop hasn't been run...
        if (input instanceof Loop) input = input.ensureRun(context);
        if (Array.isArray(input)) return new Stream(input);
        console.error('Cannot convert', input, 'to stream');
        return null;
    }

    peek() {
        return this.list[this.index];
    }

    hasNext() {
        return this.index < this.list.length;
    }

    next() {
        return this.list[this.index++];
    }
}

export class ValueGenerator {
    constructor(generator, lazy, loop, isParentLoop) {
        this.generator = generator;
        this.loop = ValueGenerator.getLoop(loop);
        this.lazy = lazy || false;
        this.executionTrace = ExecutionTrace.create();
        // This is a hacky fix for the fact that when accumulating over a parent
        // loop you actually want to do so later, so a nested loop could run...
        // TODO: It's not a flexible or robust solution
        this.isParentLoop = isParentLoop;
        if (!this.lazy && this.loop) {
            this.loop.doHandler.addHandler(context => {
                this.get(context);
                // console.log(this.get(context));
            });
        }
    }

    static getLoop(inputs) {
        if (inputs instanceof Loop) return inputs;
        if (inputs instanceof ValueGenerator) return inputs.loop;
        if (!Array.isArray(inputs)) return null;
        let loop = null;
        inputs.filter(i => i != null).forEach(i => loop = loop || i.loop);
        return loop;
    }

    get(context) {
        context = context || RootContext;
        const traceValue = this.executionTrace.getValue(context);
        if (traceValue !== null) {
            // console.log('Getting cached exe value: ', traceValue, context);
            return traceValue;
        }
        const val = this.generator(context);
        this.executionTrace.addValue(context, val);
        // console.log('Updating execution trace: ', val, this.executionTrace);
        return val;
    }
}

export class Context {
    constructor(parent, description) {
        this.parent = parent;
        this.description = description;
        this.id = uuid();
    }

    root() {
        if (this.parent == null) return this;
        return this.parent.root();
    }

    getDescription() {
        return this.description;
    }

    shouldHighlight(context) {
        return this == context;
    }
}

export const RootContext = new Context(null, '');
RootContext.id = 'root';

export class IterContext extends Context {
    constructor(parent, loop, iteration, value) {
        super(parent, loop ? loop.description : '');
        // this.loop = loop;
        this.iteration = iteration;
        this.value = value;
    }

    getDescription() {
        return `Iter #${this.iteration}: ${this.value}`;
        // return `${this.description} (Iter #${this.iteration}: ${this.value})`;
    }

    shouldHighlight(context) {
        if (super.shouldHighlight(context)) return;
        if (!(context instanceof IterContext)) return;
    }
}

export class ControlHandler {
    constructor(parentLoop) {
        this.parentLoop = parentLoop;
        this.handlers = [];
    }

    addHandler(handler) {
        this.handlers.push(handler);
    }

    execute(context) {
        this.handlers.forEach(h => h(context));
    }
}