import VueNumControl from '../components/NumControl.vue';
import VueListControl from '../components/ListControl.vue';
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