

export class Loop {
    constructor(makeIterator) {
        this.makeIterator = makeIterator;
        this.history = [];
        this.handlers = [];
        this.finished = false;
    }

    iterator() {
        const next = this.makeIterator();
        const iterHistory = [];
        this.history.push(iterHistory);
        let i = 0;
        const iter = {
            next: () => {
                const n = next();
                if (n === undefined) {
                    this.finished = true;
                    return undefined;
                }
                iterHistory.push(n);
                this.handlers.forEach(h => h(n, i))
                i++;
                return n;  
            },
        }
        return iter;
    }

    addHandler(handler) {
        this.handlers.push(handler);
    }

    ensureRun() {
        if (this.history.length > 0) return;
        this.toList();
    }

    isFinished() {
        return this.finished;
    }

    toList() {
        const iterator = this.iterator();
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
        this.lazy = lazy | false;
    }

    get() {
        const val = this.generator();
        this.history.push(val);
        return val;
    }
}