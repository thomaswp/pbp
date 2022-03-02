<template>
    <!-- Menu bar across the top to allow user to return to homepage -->
    <body>
    <div class="topnav">
        <div style="height:65px;float:left;font-size:28px;padding:15px;font:Abel;color:white;font-weight:bold;display:table-cell">Untitled 1</div>
        <div style="padding:10px;display:table-cell">
            <button @click="redirectToHomepage()" class="button curve_edge" style="float:left;padding:12px;color:white;font-size:15px">Save</button>
        </div>
        <div style="padding:10px;display:table-cell">
            <button @click="redirectToHomepage()" class="button curve_edge" style="float:left;padding:12px;color:white;font-size:15px">Archive</button>
        </div>
        <div style="width:80%;display:table-cell"></div>
        <div style="padding:10px;display:table-cell">
            <button @click="redirectToHomepage()" class="button curve_edge" style="float:right;padding:12px;color:white;font-size:15px">Home</button>
        </div>
        <!-- <span style="width:100%;" class="header-footer-item">
        </span> -->
    </div>
    <div>
      <div class="behind"> 
         <Editor />
          <!-- Because the code editor is a modal, it has to be top-level -->
          <div id = "new-block" style="padding:10px;">
            <button @click="openBlockCreator()" class="button curve_edge" style="float:right;padding:12px;color:white;font-size:15px">Custom Block</button>
          </div>
          <div id="block-creator" class="curve_edge" style="display:none;border:5px solid #1F1F1F">

            <div style="padding:10px;font-size:25px;margin: 0 auto;height:20px;font-weight:bold">Block Creator</div>  

            <hr>

            <div style ="width:280px;margin: 0 auto;height:43px">
              <div style="float:left;font-size:20px;font-weight:bold;padding-top:8px">Block Name</div>
              <input type="text" class="center" style="border-radius: 10px;float:right">
            </div>

            <hr>

            <div style = "margin: 0 auto;width:98%;">
              <div style="padding:10px;float:left;font-size:20px;overflow:scroll">
                  <table id = "input-list">
                    <tr>
                      <th>Input Name</th>
                      <th>Input Type</th>
                    </tr>
                    <tr>
                      <td><input type="text"></td>
                      <td>
                        <select name="type" id="type">
                          <option value="number">Number</option>
                          <option value="string">String</option>
                          <option value="other">Other</option>
                        </select>
                      </td>
                    </tr>
                  </table>
              </div>
              <div class="vertical"></div>
              <div style="padding:10px;float:right;font-size:20px;margin: 0 auto;">
                  <table>
                    <tr>
                      <th>Output Name</th>
                      <th>Output Type</th>
                    </tr>
                    <tr>
                      <td><input type="text"></td>
                      <td>
                        <select name="type" id="type">
                          <option value="volvo">Number</option>
                          <option value="saab">String</option>
                          <option value="mercedes">List</option>
                        </select>
                      </td>
                    </tr>
                  </table>
              </div>
            </div>
            
            <div style = "width:200px;margin: 0 auto;padding:30px;position:absolute; bottom:0;right:33%">
              <div style="padding:10px;float:left">
                  <button @click="exitBlockCreator()" class="button curve_edge" style="float:right;padding:12px;color:white;font-size:15px;background-color:#1F1F1F">Save</button>
              </div>
              <div style="padding:10px;float:right">
                  <button @click="exitBlockCreator()" class="button curve_edge" style="float:right;padding:12px;color:white;font-size:15px;background-color:#1F1F1F">Cancel</button>
              </div>
            </div>
          </div>
          <div>
          <CodeEditor
              v-if="showModal"
             :data="editorData"
             @close="showModal = false"
         />
         </div>
      </div>
    </div>
    </body>
</template>

<script>
import Editor from '../components/Editor.vue'
import CodeEditor from '../components/CodeEditor.vue'
import eventBus from '../eventBus'
/**
 * Top-level Vue component which contains the Rete.js editor and modals that go
 * on top of it.
 */
export default {
  name: 'App',
  components: {
    Editor,
    CodeEditor,
  },
  data() {
    return {
      showModal: false,
      editorData: {},
    };
  },
  methods: {
    redirectToHomepage() {
        this.$router.push({ path: '/homepage'});
    },
    openBlockCreator() {
      document.getElementById("block-creator").style.display = "block"
    },
    exitBlockCreator() {
      document.getElementById("block-creator").style.display = "none"
      var row = document.getElementById("input-list")
    },
    addInput() {
      var row = document.getElementById("input-list").insertRow(-1);
      row.insertCell(0).innerHTML = '<input type="text" style ="width:120px">';
      row.insertCell(1).innerHTML = '<select name="type" id="type"><option value="volvo">Number</option><option value="saab">String</option><option value="mercedes">List</option></select>';
      row.insertCell(2).innerHTML = '<button @click="removeInput()" class="button curve_edge" style="float:right;padding:5px;color:white;font-size:10px;background-color:#1F1F1F">Delete</button>'
    },
    removeInput() {
      console.log(document.getElementById("input-list"))
      document.getElementById("input-list").deleteRow(-1)
    }
  },
  mounted() {
    // Register an event handler for showing the code editor
    eventBus.$on('showCodeEditor', (data) => {
      // console.log(data);
      this.editorData = data;
      this.showModal = true;
    });
  },
}
</script>

<style>
/* Add a black background color to the top navigation */
.topnav {
  background-color: rgb(142, 162, 249, 0.95);
  border: solid 2px #4f5ab9;
  overflow: hidden;
  z-index: 5;
  position: relative;
  height: 65px;
}

/* Style the links inside the navigation bar */
.topnav a {
    /* fill the navbar top to bottom */
    height: 100%;
    /* rest on the right side of the navbar */
    float: right;
    /* align vertical within this element */
    display: inline-flex;
    align-items: center;
    /* no vertical padding, but some left and right */
    padding: 0px 16px;
    /* text: near-white, nothing fancy */
    color: #f2f2f2;
    text-decoration: none;
    font-size: 17px;
}

/* Change the color of links on hover */
.topnav a:hover {
  font-weight:bold;
}

/* Let the editor show behind the menu bar */
.behind {
    position: relative;
    margin-top: -45px; /* opposite of topnav's height */
    height:100%;
    display: block;
    z-index: 3;
}

.curve_edge {
    border-radius: 10px;
}
.button {
    background:#1F1F1F;
    color:white;
}

.button:hover {
  font-weight:bold;
}

.wrapper {
  position:absolute;
}

#new-block {
  position: absolute;
  bottom: 130px;
  left: 10px;

  /*
  *  Styling only, the below can be changed or removed
  *  depending on your use case
  */
  height: 20px;
  padding: 10px 10px;
}

#block-creator {
  position: absolute;
  top: 10%;
  left: 22%;
  background-color:rgb(142, 162, 249, 0.95);
  color:white;

  width:56%;
  height:70%;
}

.vertical {
            border-left: 1px solid white;
            height: 60%;
            position:absolute;
            left: 50%;
        }

</style>