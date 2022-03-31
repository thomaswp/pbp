import Menu from './Menu.vue';
import { createVNode, render, createApp } from 'vue'

export default class {

    constructor(editor, props, vueComponent) {
        const el = document.createElement('div');

        editor.view.container.appendChild(el);

        const vNode = createApp(vueComponent || Menu, props);
        this.menu = vNode.mount(el);

        // this.menu = new Vue({
        //     render: h => h(vueComponent || Menu, { props })
        // }).$mount(el);
    }

    addItem(...args) {
        this.menu.additem(...args);
    }

    show(...args) {
        this.menu.show(...args);
    }

    hide() {
        this.menu.hide();
    }
}