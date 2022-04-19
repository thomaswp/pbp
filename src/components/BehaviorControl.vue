<template>
  <transition name="modal">
    <div class="modal-mask">
      <div class="modal-wrapper">
        <div class="modal-container">

          <div class="modal-header">
            <h3>Header</h3>
          </div>

          <div class="modal-body">
            <table class="inputs">
              <tr>
                <th>#</th>
                <th
                  v-for="input in inputs"
                  :key="input"
                >
                  {{input.name}}
                </th>
                <th
                  v-for="output in outputs"
                  :key="output"
                >
                  {{output.name}}
                </th>
              </tr>
              <tr
                v-for="example, index in examples"
                :key="example"
              >
                <td>{{index+1}}.</td>
                <td
                  v-for="input in inputs"
                  :key="input"
                >
                  <input
                    type="number"
                    v-model="example.inputs[input.key]"
                    @input="updated"
                  />
                </td>
                <td
                  v-for="output in outputs"
                  :key="output"
                >
                  <input
                    type="number"
                    v-model="example.outputs[output.key]"
                    @input="updated"
                  />
                </td>
              </tr>
            </table>
          </div>

          <div class="modal-footer">
            <slot name="footer">
              <button class="modal-default-button" @click="close">
                OK
              </button>
            </slot>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>

export default {
  props: ["data"],
  components: {
  },
  data() {
    const map = this.data.getMap ? this.data.getMap() : new Map();
    const examples = [];
    const createOutput = () => {
      const out = {};
      this.data.outputs.forEach(output => {
        out[output.key] = undefined;
      });
      return out;
    };
    for (let [key, value] of map) {
      try {
        examples.push({
          inputs: JSON.parse(key),
          outputs: value ? JSON.parse(value) : createOutput(),
        });
      } catch (e) {
        console.warn('Unexpected example', e, key, value);
      }
    }
    return {
      examples,
    }
  },
  computed: {
    inputs() {
      return this.data.inputs || [];
    },
    outputs() {
      return this.data.outputs || [];
    },
    onUpdated() {
      return this.data.onUpdated || (() => {});
    },
    editor() {
      return this.data.editor;
    }
  },
  methods: {
    updated() {
      // console.log(this.examples);
      this.onUpdated(this.getMap());
    },
    getMap() {
      const map = new Map();
      this.examples.forEach(example => {
        map.set(
          JSON.stringify(example.inputs),
          JSON.stringify(example.outputs)
        );
      })
      return map;
    },
    close() {
      this.updated();
      this.$emit('close');
      if (this.editor) {
        this.editor.trigger('process');
      }
    }
  },
  mounted() {

  }
}
</script>

<style scoped>

.modal-mask {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: table;
  transition: opacity 0.3s ease;
}

.modal-wrapper {
  display: table-cell;
  vertical-align: middle;
}

.modal-container {
  width: 60%;
  margin: 0px auto;
  padding: 20px 30px;
  background-color: #fff;
  border-radius: 2px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
  transition: all 0.3s ease;
  font-family: Helvetica, Arial, sans-serif;
}

table.inputs {
  margin-left: auto;
  margin-right: auto;
}

.modal-header h3 {
  margin-top: 0;
  color: #42b983;
}

.modal-body {
  margin: 20px 0;
}

.modal-default-button {
  float: right;
}
</style>