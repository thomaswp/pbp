import { Socket } from "rete";

export class BaseSocket extends Socket {

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
        // Flip this to have input check compatibility
        if (!noReverse) return socket.compatibleWith(this, true);

        if (socket instanceof GenericSocket) {
            return super.compatibleWith(socket.genericType);
        }
        return super.compatibleWith(socket);
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

    addConnection(socket, isInput) {
        this.connectedSockets.push(socket);
        this.onConnectionsUpdated();
        // Only add a listener if this is the input socket so we
        // don't get "feedback" (stack overflow).
        if (isInput) {
            // console.log('Adding listener', isInput, this);
            socket.addUpdatedListener(() => {
                if (!this.connectedSockets.includes(socket)) return true;
                // console.log('Chain update ', socket, ' => ', this);
                this.onConnectionsUpdated();
            });
        }
    }

    removeConnection(socket) {
        const index = this.connectedSockets.indexOf(socket);
        if (index >= 0) this.connectedSockets.splice(index, 1);
        this.onConnectionsUpdated();
    }

    onConnectionsUpdated() {
        // console.log('Updating connections for', this, this.isInput, this.name);
        for (var i = 0; i < this.onUpdated.length; i++) {
            if (this.onUpdated[i](this.genericType)) {
                this.onUpdated.splice(i, 1);
                i--;
            }
        }
    }
}

export const numSocket = new BaseSocket('Number');
// export const listSocket = new BaseSocket('List');
// export const loopSocket = new BaseSocket('Loop');
// export const predicateSocket = new BaseSocket('Predicate');
export const boolSocket = new BaseSocket('Boolean');
export const stringSocket = new BaseSocket('String');

class AnyValueSocket extends BaseSocket {
    compatibleWith(socket, noReverse) {
        if (noReverse) return true;
        return super.compatibleWith(socket, noReverse);
    }
}
export const anyValueSocket = new AnyValueSocket('Any value');

class GenericIOSocket extends DynamicSocket {
    constructor(baseSocket) {
        super('', baseSocket);
        this.isInput = baseSocket == null;
        if (!this.isInput) {
            this.setGenericType(baseSocket);
            baseSocket.addUpdatedListener(s => {
                this.setGenericType(s);
                this.onConnectionsUpdated();
            });
        } else {
            this.setGenericType(this.genericType);
        }
    }

    // Begin virtual methods

    setGenericType(genericType) {
        this.genericType = genericType;
    }

    calculateGenericType() { return anyValueSocket; }

    // End virtual methods

    onConnectionsUpdated() {
        if (this.isInput) {
            this.setGenericType(this.calculateGenericType());
        }
        super.onConnectionsUpdated();
    }
}

export class GenericIterableSocket extends GenericIOSocket {

    calculateGenericType() {
        if (this.connectedSockets.length == 0) {
            return anyValueSocket;
        } else if (
            this.connectedSockets.length == 1 &&
            this.isCompatibleSocket(this.connectedSockets[0])
        ) {
            return this.connectedSockets[0].genericType;
        }

        console.warn('Incompatible socket in generic iterable:',
            this.connectedSockets);
        return anyValueSocket;
    }

    isCompatibleSocket(socket) {
        return socket instanceof GenericIterableSocket;
    }

    compatibleWith(socket, noReverse) {
        // console.log('list', socket, noReverse);
        if (!noReverse) return super.compatibleWith(socket, noReverse);

        if (!this.isCompatibleSocket(socket)) return false;
        return this.genericType.compatibleWith(socket.genericType, noReverse);
    }
}

export class GenericListSocket extends GenericIterableSocket {
    setGenericType(genericType) {
        super.setGenericType(genericType);
        // console.log(genericType);
        this.name = `List of ${genericType.name}`;
        this.classes = genericType.classes.concat(['list-socket']);
    }

    isCompatibleSocket(socket) {
        return socket instanceof GenericListSocket;
    }
}

export class GenericLoopSocket extends GenericIterableSocket {
    setGenericType(genericType) {
        super.setGenericType(genericType);
        // console.log(genericType);
        this.name = `Loop of ${genericType.name}`;
        this.classes = genericType.classes.concat(['loop-socket']);
    }

    isCompatibleSocket(socket) {
        return socket instanceof GenericLoopSocket;
    }
}


export class GenericSocket extends GenericIOSocket {

    setGenericType(genericType) {
        super.setGenericType(genericType);
        this.name = genericType.name;
        this.classes = genericType.classes.slice();
    }

    calculateGenericType() {
        let type = anyValueSocket;
        this.connectedSockets.forEach(s => {
            if (type === anyValueSocket) type = s;
            else if (type === s) return;
            else type = null;
        });
        // console.log('Updating type: ', this.connectedSockets, this.type);
        if (type == null) type = anyValueSocket;
        return type;
    }

    compatibleWith(socket, noReverse) {
        if (!noReverse) return super.compatibleWith(socket, noReverse);
        return this.genericType.compatibleWith(socket, noReverse);
    }
}

// export class AnyInputSocket extends DynamicSocket {
//     constructor() {
//         super('Any value');
//     }

//     compatibleWith(socket, noReverse) {
//         // console.log('any', socket, noReverse);
//         if (noReverse) return true;
//         return super.compatibleWith(socket, noReverse);
//     }

//     onConnectionsUpdated()  {
//         let type = anyValueSocket;
//         this.connectedSockets.forEach(s => {
//             if (type === anyValueSocket) type = s;
//             else if (type === s) return;
//             else type = null;
//         });
//         // console.log('Updating type: ', this.connectedSockets, this.type);
//         if (type == null) type = anyValueSocket;
//         this.genericType = type;
//         this.setName(type.name);
//         this.classes = type.classes.slice();

//         super.onConnectionsUpdated();
//     }
// }

// // console.log(new AnyValueSocket());

// export class GenericOutputSocket extends BaseSocket {
//     constructor(baseSocket) {
//         super(baseSocket.name);
//         this.type = baseSocket;
//         baseSocket.addUpdatedListener(s => {
//             this.type = s;
//             this.setName(s.name);
//         });
//     }

//     compatibleWith(socket) {
//         return this.type.compatibleWith(socket);
//     }
// }