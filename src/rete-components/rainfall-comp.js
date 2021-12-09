import { Output, Input, Component } from "rete";
import { numSocket, listSocket, loopSocket, predicateSocket } from "./sockets";
import { NumControl, ListControl, LoopControl, CodeControl } from "../controls/controls";
import { Loop } from "../controls/objects";

class IfZero extends Component {
    constructor(){
        super("If Zero");
    }

    builder(node) {
        var number = new Input('number',"Number", numSocket);
        var then = new Input('then',"Then", numSocket);
        var el = new Input('else',"Else", numSocket);
        var out = new Output('out', "Out", numSocket);

        then.addControl(new NumControl(this.editor, 'then', false));
        el.addControl(new NumControl(this.editor, 'else', false));

        return node
            .addInput(number)
            .addInput(then)
            .addInput(el)
            .addControl(new NumControl(this.editor, 'preview', true))
            .addOutput(out);
    }

    worker(node, inputs, outputs) {
        const number = inputs['number'][0];
        const then = inputs['then'][0];
        const el = inputs['else'][0];

        const out = number == 0 ? then : el;

        this.editor.nodes.find(n => n.id == node.id).controls.get('preview').setValue(out);
        outputs['out'] = out;
    }
}

class TestInputComponent extends Component {
    constructor(){
        super("Test Input");
    }

    builder(node) {
        var inControl = new ListControl(this.editor, 'test', false, [5, -3, 7, -200, 9, -999, 10]);
        var out = new Output('test', 'Test', listSocket);


        return node
            .addControl(inControl)
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
    new TestInputComponent(),
    new IfZero(),
];