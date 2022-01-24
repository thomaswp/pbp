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

// TODO:
class Iterator {
    constructor() {
        this.isFinished = false;


    }
}

export class Loop {
    constructor(makeIterator) {
        this.makeIterator = makeIterator;
        this.history = [];
        this.lastContext = null;
        this.startHandlers = [];
        this.loopHandlers = [];
        this.finished = new Map();
    }

    iterator(parentContext) {
        const next = this.makeIterator(parentContext);
        const iterHistory = [];
        this.history.push(iterHistory);
        this.finished.set(parentContext, false);
        this.lastContext = parentContext;
        let i = 0;
        this.startHandlers.forEach(h => h(parentContext));
        const iter = {
            next: () => {
                const iterContext = new IterContext(parentContext, i);
                const n = next(iterContext);
                if (n === undefined) {
                    this.finished.set(parentContext, true);
                    return undefined;
                }
                iterHistory.push(n);
                this.loopHandlers.forEach(h => h(n, i, iterContext));
                i++;
                return n;
            },
        }
        return iter;
    }

    addLoopHandler(handler) {
        this.loopHandlers.push(handler);
    }

    addStartHandler(handler) {
        this.startHandlers.push(handler);
    }

    ensureRun(context) {
        if (this.history.length > 0) {
            if (context == null || this.lastContext == context) {
                // console.log('Already run for: ', context);
                return;
            }
        }
        this.#run(context);
    }

    isFinished(context) {
        return this.finished.get(context) || false;
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
        this.executionTrace = null;
    }

    get(context) {
        if (!this.executionTrace) {
            this.executionTrace = ExecutionTrace.create();
        }
        const traceValue = this.executionTrace.getValue(context);
        if (traceValue !== null) {
           console.log('Getting cached exe value: ', traceValue, context);
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
        console.log('Updating execution trace: ', val, this.executionTrace);
        this.lastContext = context;
        // TODO: Should probably be storing context somewhere for preview
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

    // copy() {
    //     const parent = this.parent == null ? null : this.parent.copy();
    //     return new Context(parent, this.id);
    // }
}

export const RootContext = new Context(null);
RootContext.id = 'root';

export class IterContext extends Context {
    constructor(parent, iteration) {
        super(parent);
        this.iteration = iteration;
    }
}