import { numSocket, boolSocket, stringSocket, GenericSocket, GenericListSocket, GenericLoopSocket, controlSocket, anyValueSocket } from "./sockets";
import { IterContext, Loop, Stream, ValueGenerator, ControlHandler } from "../controls/objects";
import { Category, BaseComponent } from "./general-comp";

export const CATEGORY_LISTS = new Category('Lists');

class FillList extends BaseComponent {
    constructor() {
        super('Fill a List', CATEGORY_LISTS);
    }

    getAllData() {
        const valueSocket = new GenericSocket();
        return {
            inputs: [
                this.inputData('Size', numSocket, true),
                this.inputData('Value', valueSocket),
            ],
            outputs: [
                this.outputData('List', new GenericListSocket(valueSocket)),
            ]
        }
    }

    work(inputs) {
        return new ValueGenerator((context) => {
            const size = this.reifyValue(inputs.size, context);
            const list = [];
            for (var i = 0; i < size; i++) {
                const context = new IterContext(context, null, i, i);
                list[i] = this.reifyValue(inputs.value, context);
            }
            return list;
        });
    }
}

class ListLengthComponent extends BaseComponent {
    constructor() {
        super('List Length', CATEGORY_LISTS);
    }

    getAllData() {
        return {
            inputs: [
                this.inputData('List', new GenericListSocket()),
            ],
            outputs: [
                this.outputData('Length', numSocket),
            ]
        }
    }

    work(inputs) {
        return new ValueGenerator((context) => {
            const list = this.reifyValue(inputs.list, context);
            return list == null ? 0 : list.length;
        });
    }
}

class ListItemComponent extends BaseComponent {
    constructor() {
        super('List Item', CATEGORY_LISTS);
    }

    getAllData() {
        const listSocket = new GenericListSocket();
        return {
            inputs: [
                this.inputData('List', listSocket),
                this.inputData('Index', numSocket, true),
            ],
            outputs: [
                this.outputData('Value', new GenericSocket(listSocket)),
            ]
        }
    }

    work(inputs) {
        return new ValueGenerator((context) => {
            const rInputs = this.reify(inputs, context);
            const list = rInputs.list, index = rInputs.index;
            if (list == null || index == null) return null;
            return list[index];
        });
    }
}

class SublistComponent extends BaseComponent {
    constructor() {
        super('Sublist', CATEGORY_LISTS);
    }

    getAllData() {
        const listSocket = new GenericListSocket();
        return {
            inputs: [
                this.inputData('List', listSocket),
                this.inputData('Start Index', numSocket, true),
                this.inputData('End Index', numSocket, true),
            ],
            outputs: [
                this.outputData('Sublist', new GenericListSocket(listSocket)),
                // this.inputData('Sublist Value', new GenericSocket(listSocket)),
                // this.inputData('Sublist Index', numSocket),
            ]
        }
    }

    work(inputs) {
        return new ValueGenerator((context) => {
            const rInputs = this.reify(inputs, context);
            const list = rInputs.list,
                startIndex = Math.max(0, rInputs.start_index),
                endIndex = rInputs.end_index;
            return list == null ? null : list.slice(startIndex, endIndex);
        }, false, [inputs.start_index, inputs.end_index]);
        // return {
            // sublist: gen,
            // sublist_value: loop.createValueGenerator(true),
            // sublist_index: loop.createIndexGenerator(true),
        // }
    }
}
