

export class Loop {
    constructor(makeIterator) {
        this.makeIterator = makeIterator;
        this.history = [];
        this.startHandlers = [];
        this.loopHandlers = [];
        this.finished = [];
    }

    iterator() {
        const next = this.makeIterator();
        const iterHistory = [];
        const historyIndex = this.history.length;
        this.history.push(iterHistory);
        this.finished.push(false);
        let i = 0;
        this.startHandlers.forEach(h => h());
        const iter = {
            next: () => {
                const n = next();
                if (n === undefined) {
                    this.finished[historyIndex] = true;
                    return undefined;
                }
                iterHistory.push(n);
                this.loopHandlers.forEach(h => h(n, i));
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

    ensureRun(iter = 0) {
        if (this.history.length > iter) return;
        this.toList();
    }

    isFinished(iter = 0) {
        return this.finished[iter];
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

    get(iter) {
        const val = this.generator(iter);
        this.history.push(val);
        return val;
    }
}