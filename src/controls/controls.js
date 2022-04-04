import VueNumControl from '../components/NumControl.vue';
import VueListControl from '../components/InputControl.vue';
import VueExecutionTraceControl from '../components/ExecutionTraceControl.vue';
import CodeEditorButtonVue from '../components/CodeEditorButton.vue';
import { Control } from 'rete';
import { ValueGenerator, Loop, ExecutionTrace, RootContext } from '../controls/objects'

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

/**
 * Control for displaying editable values, such as stringer, numbers, booleans,
 * and lists of these values.
 */
export class ListControl extends Control {

    constructor(emitter, key, readonly, defaultValue) {
        super(key);
        this.component = VueListControl;
        this.props = { emitter, ikey: key, readonly, defaultValue };
    }

    setValue(val) {
        if (val != null && (val instanceof String || !val.length)) {
            val = [val];
        }
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
        if (value != null && value.executionTrace) {
            value = value.executionTrace;
        } else {
            value = new ExecutionTrace(RootContext, value, null);
        }

        // console.log(this.props.name, value);
        // console.log(value);
        this.vueContext.trace = value;
    }
}