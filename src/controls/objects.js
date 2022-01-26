import { v4 as uuid } from 'uuid';

export class ExecutionTrace {

    constructor(context, value, parent) {
        this.context = context;
        this.value = value;
        this.parent = parent;
        this.children = new Map();
    }

    static create(context) {
        // TODO: stop using null context
        if (!context) context = RootContext;
        // Create a root execution at the context root
        const root = new ExecutionTrace(context.root(), null, null);
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
        if (!context) context = RootContext;
        const exe = this.getExecution(context);
        if (!exe) return null;
        return exe.value;
    }

    addValue(context, value) {
        if (!context) context = RootContext;
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
        // TODO remove
        this.history = []
    }

    start() {
        this.loop.startHandlers.forEach(h => h(this.context));
    }

    next() {
        const iterContext = new IterContext(this.context, this.i);
        const value = this.getNextValue(iterContext);
        if (value === undefined) {
            this.isFinished = true;
            return undefined;
        }
        this.history.push(value);
        this.loop.executionTrace.addValue(iterContext, value);
        this.loop.loopHandlers.forEach(h => h(value, this.i, iterContext));
        this.i++;
        return value;
    }
}

export class Loop {
    constructor(getValueGenerator) {
        this.getValueGenerator = getValueGenerator;
        this.startHandlers = [];
        this.loopHandlers = [];
        this.iterators = new Map();
        this.executionTrace = new ExecutionTrace.create();
        // TODO Remove
        this.history = [];
    }

    iterator(context) {
        const iterator = new Iterator(this, context, this.getValueGenerator);
        this.history.push(iterator.history);
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
        this.history = [];
        this.lastContext = null;
        this.lazy = lazy | false;
        this.executionTrace = ExecutionTrace.create();
    }

    get(context) {
        const traceValue = this.executionTrace.getValue(context);
        if (traceValue !== null) {
        //    console.log('Getting cached exe value: ', traceValue, context);
        }
        if (this.history.length > 0) {
            if (context == null || this.lastContext == context) {
                // console.log('Already gotten: ', context);
                // I don't think there's ever a reason to check more than
                // the last context
                return this.history[this.history.length - 1];
            }
        }
        const val = this.generator(context);
        this.executionTrace.addValue(context, val);
        // console.log('Updating execution trace: ', val, this.executionTrace);
        this.lastContext = context;
        this.history.push(val);
        return val;
    }
}

export class Context {
    constructor(parent) {
        if (parent === undefined) parent = RootContext;
        this.parent = parent;
        this.id = uuid();
    }

    root() {
        if (this.parent == null) return this;
        return this.parent.root();
    }
}

export const RootContext = new Context(null);
RootContext.id = 'root';

export class IterContext extends Context {
    constructor(parent, iteration) {
        super(parent);
        this.iteration = iteration;
    }
}