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
                  v-for="input in inputNames"
                  :key="input"
                >
                  {{input}}
                </th>
                <th>Output</th>
              </tr>
              <tr
                v-for="example, index in examples"
                :key="example"
              >
                <td>{{index+1}}.</td>
                <td
                  v-for="input in inputFields"
                  :key="index + '_' + input"
                >
                  <input
                    type="number"
                    v-model="example.inputs[input]"
                    @input="updated"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    v-model="example.output"
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
import { computed } from 'vue';

export default {
  props: ["data"],
  components: {
  },
  data() {
    const map = this.data.getMap ? this.data.getMap() : new Map();
    const examples = [];
    for (let [key, value] of map) {
      examples.push({
        inputs: JSON.parse(key),
        // TODO: multiple outputs
        output: value,
      });
    }
    return {
      // TODO: multiple outputs
      examples,
    }
  },
  computed: {
    inputNames() {
      return this.data.inputNames || []
    },
    inputFields() {
      return this.data.inputFields || []
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
      this.onUpdated(this.getMap());
    },
    getMap() {
      const map = new Map();
      this.examples.forEach(example => {
        map.set(JSON.stringify(example.inputs), example.output);
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