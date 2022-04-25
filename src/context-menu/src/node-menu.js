import Menu from './menu/index';
import { createNode, traverse } from './utils';

export default class NodeMenu extends Menu {
    constructor(editor, props, vueComponent, nodeItems) {
        super(editor, props, vueComponent);

        if (nodeItems['Delete'] !== false) {
            this.addItem('Delete', ({ node }) => {
                const realNode = editor.nodes.filter(n => n.id == node.id)[0];
                if (!realNode) return;

                if (editor.selected.list.indexOf(realNode) !== -1) {
                    editor.selected.remove(realNode);
                }

                /* TODO: this seems to be causing a small bug (error in console output, but correct behavior)
                if a node has some execution when it is deleted (i.e. is connected to another node):
                "The process is busy and has not been restarted.
                Use abort() to force it to complete"
                We don't have access to `engine` to call `engine.abort()`, so I'm not sure how else to address this...
                this bug does NOT occur for "Clone", as it's just adding a new isolated node. No problems there!
                */
                editor.removeNode(realNode);
            });
        }
        if (nodeItems['Clone'] !== false) {
            this.addItem('Copy', async (args) => {
                const { name, position: [x, y], ...params } = args.node;
                const component = editor.components.get(name);
                const node = await createNode(component, { ...params, x: x + 10, y: y + 10 });

                editor.addNode(node);
            });
        }

        traverse(nodeItems, (name, func, path) => this.addItem(name, func, path))
    }
}
