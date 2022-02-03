import { Socket } from "rete";

class BaseSocket extends Socket {
    
    compatibleWith(socket, noReverse) {
        if (noReverse) return super.compatibleWith(socket);
        // Flip this to have input check compatibility
        return socket.compatibleWith(this, true);
    }
}

export const numSocket = new BaseSocket('Number value');
export const listSocket = new BaseSocket('List value');
export const loopSocket = new BaseSocket('Loop value');
export const predicateSocket = new BaseSocket('Predicate value');
export const boolSocket = new BaseSocket('Boolean value');
export const stringSocket = new BaseSocket('String value');

export class AnyValueSocket extends Socket {
    constructor() {
        super('Any value');
        this.connectedSockets = new Set();
        this.typeSocket = this;
        this.onTypeUpdated = []
    }

    compatibleWith(socket, noReverse) {
        if (noReverse) return true;
        return super.combineWith(socket, noReverse);
    }

    addConnection(socket) {
        this.connectedSockets.add(socket);
        this.updateType();
    }

    removeConnection(socket) {
        this.connectedSockets.delete(socket);
        this.updateType();
    }

    updateType() {
        let type = this;
        this.connectedSockets.forEach(s => {
            if (type === this) type = s;
            else if (type === s) return;
            else type = null;
        });
        if (type == null) type = this;
        this.onTypeUpdated.forEach(u => u(type));
    }
}

// console.log(new AnyValueSocket());

export class GenericSocket extends Socket {
    constructor(baseSocket) {
        super(baseSocket.name);
        this.type = baseSocket;
        if (baseSocket.onTypeUpdated) {
            baseSocket.onTypeUpdated.push(s => {
                // TODO(twprice): find a way to update Vue component / css
                this.name = s.name;
                this.type = s;
            });
        }
    }

    compatibleWith(socket) {
        return this.type.compatibleWith(socket);
    }
}