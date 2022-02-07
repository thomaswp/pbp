import { Socket } from "rete";

class BaseSocket extends Socket {

    constructor(name) {
        super(name);
        this.classes = [''];
        this.setName(name);
    }

    setName(name) {
        this.name = name;
        this.classes = [name.toLowerCase() + '-socket'];
    }

    compatibleWith(socket, noReverse) {
        if (noReverse) return super.compatibleWith(socket);
        // Flip this to have input check compatibility
        return socket.compatibleWith(this, true);
    }
}

export const numSocket = new BaseSocket('Number');
export const listSocket = new BaseSocket('List');
export const loopSocket = new BaseSocket('Loop');
export const predicateSocket = new BaseSocket('Predicate');
export const boolSocket = new BaseSocket('Boolean');
export const stringSocket = new BaseSocket('String');

export class GenericListSocket extends BaseSocket {
    constructor(innerSocket) {
        super('')
        this.setInnerType(innerSocket);
        if (innerSocket.onTypeUpdated) {
            innerSocket.onTypeUpdated.push(s => {
                this.setInnerType(innerSocket);
            });
        }
    }

    setInnerType(innerType) {
        this.innerType = innerType;
        this.name = `List of ${innerType.name}`;
        this.classes = ['list-socket'] + innerType.classes;
    }

    compatibleWith(socket, noReverse) {
        if (!noReverse) return super.combineWith(socket, noReverse);

        if (!(socket instanceof GenericListSocket)) return false;
        return this.innerType.compatibleWith(socket.innerType, noReverse);
    }
}

export class AnyValueSocket extends BaseSocket {
    constructor() {
        super('Any value');
        this.connectedSockets = [];
        this.typeSocket = this;
        this.onTypeUpdated = []
    }

    compatibleWith(socket, noReverse) {
        if (noReverse) return true;
        return super.combineWith(socket, noReverse);
    }

    addConnection(socket) {
        this.connectedSockets.push(socket);
        this.updateType();
    }

    removeConnection(socket) {
        const index = this.connectedSockets.indexOf(socket);
        if (index >= 0) this.connectedSockets.splice(index, 1);
        this.updateType();
    }

    updateType() {
        let type = this;
        this.connectedSockets.forEach(s => {
            if (type === this) type = s;
            else if (type === s) return;
            else type = null;
        });
        // console.log('Updating type: ', this.connectedSockets, this.type);
        if (type == null) type = this;
        this.typeSocket = type;
        const newName = type === this ? 'Any value' : type.name;
        this.setName(newName);
        this.onTypeUpdated.forEach(u => u(type));
    }
}

// console.log(new AnyValueSocket());

export class GenericSocket extends BaseSocket {
    constructor(baseSocket) {
        super(baseSocket.name);
        this.type = baseSocket;
        if (baseSocket.onTypeUpdated) {
            baseSocket.onTypeUpdated.push(s => {
                this.name = s.name;
                this.type = s;
                this.createClasses();
            });
        }
    }

    compatibleWith(socket) {
        return this.type.compatibleWith(socket);
    }
}