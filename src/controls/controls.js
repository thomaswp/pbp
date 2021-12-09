import VueNumControl from '../components/NumControl.vue';
import VueListControl from '../components/ListControl.vue';
import CodeEditorButtonVue from '../components/CodeEditorButton.vue';
import { Control } from 'rete';

export class CodeControl extends Control {

    constructor(emitter, key, type) {
        super(key);
        this.component = CodeEditorButtonVue;
        this.props = { emitter, ikey: key, type };
    }

    setValue(val) {
    }
}

export class NumControl extends Control {

    constructor(emitter, key, readonly) {
        super(key);
        this.component = VueNumControl;
        this.props = { emitter, ikey: key, readonly };
    }

    setValue(val) {
        this.vueContext.value = val;
    }
}

export class ListControl extends Control {

    constructor(emitter, key, readonly, defaultValue) {
        super(key);
        this.component = VueListControl;
        this.props = { emitter, ikey: key, readonly, defaultValue };
    }

    setValue(val) {
        this.vueContext.value = val;
    }
}


export class LoopControl extends Control {

    constructor(emitter, key, readonly) {
        super(key);
        this.component = VueListControl;
        this.props = { emitter, ikey: key, readonly };
    }

    setValue(val) {
        if (!val) {
            this.vueContext.value = null;
            return;
        }
        this.vueContext.value = val.toList();
        this.vueContext.refresh();
        // console.log('set loop', list, this.vueContext);
    }
}