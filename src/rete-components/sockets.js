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
    }

    compatibleWith() {
        return true;
    }
}

// console.log(new AnyValueSocket());

export class GenericSocket extends Socket {
    constructor(baseSocket) {
        super(baseSocket.name);
        this.baseSocket = baseSocket;
    }

    compatibleWith(socket) {
        return this.baseSocket.compatibleWith(socket);
    }
}