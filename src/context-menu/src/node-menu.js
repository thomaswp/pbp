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
