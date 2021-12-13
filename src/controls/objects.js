

export class Loop {
    constructor(makeIterator) {
        this.makeIterator = makeIterator;
    }

    iterator() {
        const next = this.makeIterator();
        return {
            next: () => next(),
        }
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
        this.preview = null;
    }

    get() {
        const val = this.generator();
        if (this.preview) {
            this.preview(val);
        }
        return val;
    }
}