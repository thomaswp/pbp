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
            this.context, this.loop.description, this.i);
        this.lastIterContext = iterContext;
        const value = this.getNextValue(iterContext);
        iterContext.value = value;
        if (value === undefined) {
            this.isFinished = true;
            return undefined;
        }
        this.loop.handleIteration(value, this.i, iterContext);
        this.i++;
        return value;
    }
}

export class Loop {
    constructor(description, getIterNextFn) {
        this.description = description;
        this.getIterNextFn = getIterNextFn;
        this.startHandlers = [];
        this.loopHandlers = [];
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
    static toLoop(object, description) {
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
        });
    }

    createIndexGenerator(lazy) {
        return new ValueGenerator(() => this.lastIndex, lazy);
    }

    createValueGenerator(lazy) {
        return new ValueGenerator(() => this.lastValue, lazy);
    }

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
    }

    addLoopHandler(handler) {
        this.loopHandlers.push(handler);
    }

    addStartHandler(handler) {
        this.startHandlers.push(handler);
    }

    ensureRun(context) {
        context = context || RootContext;
        if (this.iterators.has(context)) return;
        this.#run(context);
    }

    isFinished(context) {
        const iterator = this.iterators.get(context);
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

export class ValueGenerator {
    constructor(generator, lazy) {
        this.generator = generator;
        this.lazy = lazy | false;
        this.executionTrace = ExecutionTrace.create();
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
}

export const RootContext = new Context(null, '');
RootContext.id = 'root';

export class IterContext extends Context {
    constructor(parent, description, iteration, value) {
        super(parent, description);
        this.iteration = iteration;
        this.value = value;
    }

    getDescription() {
        return `Iter #${this.iteration}: ${this.value}`;
        // return `${this.description} (Iter #${this.iteration}: ${this.value})`;
    }
}