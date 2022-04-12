import { createNode, traverse } from './utils';
import Menu from './menu/index';

export default class MainMenu extends Menu {
    constructor(editor, props, vueComponent, { items, allocate, rename }) {
        super(editor, props, vueComponent);

        const mouse = { x: 0, y: 0 };

        editor.on('mousemove', ({ x, y }) => {
            mouse.x = x;
            mouse.y = y;
        });

        for(const component of editor.components.values()) {
            let paths = allocate(component);

            // add to the menu if path is array
            if (Array.isArray(paths)) {
                // Encase a single array in an outer array
                if (paths.length == 0 || !Array.isArray(paths[0])) {
                    paths = [paths];
                }
                paths.forEach(path => {
                    this.addItem(rename(component), async () => {
                        editor.addNode(await createNode(component, mouse));
                    }, path);
                });
            }
        }

        traverse(items, (name, func, path) => this.addItem(name, func, path))
    }
}