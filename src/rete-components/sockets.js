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

    addUpdatedListener(listener) {
        // no-op
    }
}

export class DynamicSocket extends BaseSocket {

    constructor(name) {
        super(name);
        this.connectedSockets = [];
        this.onUpdated = []
        this.genericType = anyValueSocket;
    }

    addUpdatedListener(listener) {
        this.onUpdated.push(listener);
    }

    addConnection(socket) {
        this.connectedSockets.push(socket);
        this.onConnectionsUpdated();
    }

    removeConnection(socket) {
        const index = this.connectedSockets.indexOf(socket);
        if (index >= 0) this.connectedSockets.splice(index, 1);
        this.onConnectionsUpdated();
    }

    onConnectionsUpdated() {
        this.onUpdated.forEach(u => u(this.genericType));
    }
}

export const numSocket = new BaseSocket('Number');
export const listSocket = new BaseSocket('List');
export const loopSocket = new BaseSocket('Loop');
export const predicateSocket = new BaseSocket('Predicate');
export const boolSocket = new BaseSocket('Boolean');
export const stringSocket = new BaseSocket('String');

class AnyValueSocket extends BaseSocket {
    compatibleWith(socket, noReverse) {
        if (noReverse) return true;
        return super.compatibleWith(socket, noReverse);
    }
}
export const anyValueSocket = new AnyValueSocket('Any value');


export class GenericListSocket extends DynamicSocket {
    constructor(innerSocket) {
        super('');
        this.isInput = innerSocket == null;
        if (!this.isInput) {
            this.setGenericType(innerSocket);
            innerSocket.addUpdatedListener(s => {
                this.setGenericType(s);
                this.onConnectionsUpdated();
            });
        } else {
            this.setGenericType(this.genericType);
        }
    }

    setGenericType(genericType) {
        this.genericType = genericType;
        this.name = `List of ${genericType.name}`;
        this.classes = genericType.classes.concat(['list-socket']);
    }

    onConnectionsUpdated() {
        if (!this.isInput) {
            super.onConnectionsUpdated();
            return;
        }

        if (this.connectedSockets.length == 0) {
            this.setGenericType(anyValueSocket);
        } else if (
            this.connectedSockets.length == 1 &&
            this.connectedSockets[0] instanceof GenericListSocket
        ) {
            this.setGenericType(this.connectedSockets[0].genericType);
        } else {
            console.warn('Incompatible socket in generic list:',
                this.connectedSockets);
            return;
        }

        // TODO: Propagate the type to later nodes
        super.onConnectionsUpdated();
    }

    compatibleWith(socket, noReverse) {
        // console.log('list', socket, noReverse);
        if (!noReverse) return super.compatibleWith(socket, noReverse);

        if (!(socket instanceof GenericListSocket)) return false;
        return this.genericType.compatibleWith(socket.genericType, noReverse);
    }
}

export class AnyInputSocket extends DynamicSocket {
    constructor() {
        super('Any value');
    }

    compatibleWith(socket, noReverse) {
        // console.log('any', socket, noReverse);
        if (noReverse) return true;
        return super.compatibleWith(socket, noReverse);
    }

    onConnectionsUpdated()  {
        let type = anyValueSocket;
        this.connectedSockets.forEach(s => {
            if (type === anyValueSocket) type = s;
            else if (type === s) return;
            else type = null;
        });
        // console.log('Updating type: ', this.connectedSockets, this.type);
        if (type == null) type = anyValueSocket;
        this.genericType = type;
        this.setName(type.name);
        this.classes = type.classes.slice();

        super.onConnectionsUpdated();
    }
}

// console.log(new AnyValueSocket());

export class GenericOutputSocket extends BaseSocket {
    constructor(baseSocket) {
        super(baseSocket.name);
        this.type = baseSocket;
        baseSocket.addUpdatedListener(s => {
            this.type = s;
            this.setName(s.name);
        });
    }

    compatibleWith(socket) {
        return this.type.compatibleWith(socket);
    }
}