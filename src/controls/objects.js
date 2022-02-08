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
    }

    start() {
        this.loop.startHandlers.forEach(h => h(this.context));
    }

    next() {
        const value = this.getNextValue(iterContext);
        if (value === undefined) {
            this.isFinished = true;
            return undefined;
        }
        const iterContext = new IterContext(
            this.context, this.loop.description, this.i, value);
        this.loop.executionTrace.addValue(iterContext, value);
        this.loop.loopHandlers.forEach(h => h(value, this.i, iterContext));
        this.i++;
        return value;
    }
}

export class Loop {
    constructor(description, getValueGenerator) {
        this.description = description;
        this.getValueGenerator = getValueGenerator;
        this.startHandlers = [];
        this.loopHandlers = [];
        this.iterators = new Map();
        this.executionTrace = new ExecutionTrace.create();
    }

    iterator(context) {
        if (context == null) throw 'Context cannot be null';
        const iterator = new Iterator(this, context, this.getValueGenerator);
        this.iterators.set(context, iterator);
        iterator.start();
        return iterator;
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