import VueNumControl from '../components/NumControl.vue';
import VueListControl from '../components/ListControl.vue';
import VueExecutionTraceControl from '../components/ExecutionTraceControl.vue';
import CodeEditorButtonVue from '../components/CodeEditorButton.vue';
import { Control } from 'rete';
import { ValueGenerator, Loop } from '../controls/objects'

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

    constructor(emitter, key, readonly, defaultValue) {
        super(key);
        this.component = VueNumControl;
        this.props = { emitter, ikey: key, readonly, defaultValue };
    }

    setValue(val) {
        this.vueContext.value = val;
    }
}

export class ExecutionTraceControl extends Control {

    constructor(key, name) {
        super(key);
        this.component = VueExecutionTraceControl;
        this.props = {name};
    }

    setValue(val) {
        this.value = val;
    }

    postProcess() {
        this.updateContext();
    }

    updateContext() {
        let value = this.value;
        if (value.executionTrace) {
            value = value.executionTrace;
        } else {
            // TODO: Handle literal values...
            console.warn('literal...');
            return;
        }

        this.vueContext.trace = value;
    }
}

/**
 * Control for displaying editable values, such as stringer, numbers, booleans,
 * and lists of these values.
 */
export class ListControl extends Control {

    constructor(emitter, key, readonly, defaultValue) {
        super(key);
        this.component = VueListControl;
        this.value = defaultValue;
        this.props = { emitter, ikey: key, readonly };
    }

    // TODO(IO/twprice): This control was originally designed to preview
    // execution traces, which will now be handled by the ExecutionTraceControl
    // so this code is likely no longer necessary.
    reify(val) {
        if (val instanceof ValueGenerator) {
            val = val.history;
            // console.log('Reifying: ', val);
        } else if (val instanceof Loop) {
            val = val.history;
            if (val.length == 1 && val[0] instanceof Array) val = val[0];
            else if (val.length > 1) {
                // Rough hack to avoid duplicate runs
                let v = JSON.stringify(val[0]);
                let same = true;
                for (let i = 1; i < val.length; i++) {
                    if (JSON.stringify(val[i]) != v) {
                        same = false;
                        break;
                    }
                }
                if (same) {
                    val = val[0];
                }
            }
        }
        if (val instanceof Array) {
            val = val.slice();
            for (let i = 0; i < val.length; i++) {
                val[i] = this.reify(val[i]);
            }
        }
        return val;
    }

    postProcess() {
        this.updateContext();
    }

    updateContext() {
        let val = this.value;
        // if (val == null) {
        //     console.log(this.vueContext.value);
        //     if (this.vueContext.value) return;
        //     val = this.defaultValue;
        // }
        val = this.reify(val);
        if (val != null && (val instanceof String || !val.length)) {
            val = [val];
        }
        // console.log('Setting', this.value, '=>', val);
        this.vueContext.value = val;
    }

    setValue(val) {
        this.value = val;
        this.updateContext();
    }
}