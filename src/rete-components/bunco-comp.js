class UntilRoundEndsComponent extends Component {
    constructor(){
        super("Until Round Ends");
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