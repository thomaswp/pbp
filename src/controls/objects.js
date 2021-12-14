

export class Loop {
    constructor(makeIterator) {
        this.makeIterator = makeIterator;
        this.history = [];
    }

    iterator() {
        const next = this.makeIterator();
        const iterHistory = [];
        this.history.push(iterHistory);
        const iter = {
            next: () => {
                const n = next();
                if (n !== undefined) iterHistory.push(n);
                return n;  
            },
        }
        return iter;
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
    constructor(generator) {
        this.generator = generator;
        this.history = [];
    }

    get() {
        const val = this.generator();
        this.history.push(val);
        return val;
    }
}