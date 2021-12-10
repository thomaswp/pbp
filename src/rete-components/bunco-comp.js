import { Output, Input, Component } from "rete";
import { numSocket, listSocket, loopSocket, predicateSocket } from "./sockets";
import { NumControl, ListControl, LoopControl, CodeControl } from "../controls/controls";
import { Loop } from "../controls/objects";

class UntilRoundEndsComponent extends Component {
    constructor(){
        super("Until Round Ends");
    }

    builder(node) {
        
        var out = new Output('loop', 'Loop', loopSocket);
        return node
            // .addControl(inControl)
            .addOutput(out);
    }

    worker(node, inputs, outputs) {
      const out = node.data.test; //[5, -3, 7, -200, 9, -999, 10];
      // console.log(node.data, out);
    //   this.editor.nodes.find(n => n.id == node.id).controls.get('preview').setValue(out);
      outputs['test'] = out;
    }
}

export default [
    // new UntilRoundEndsComponent(),
]