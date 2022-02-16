<template>
  <body style="font:Abel">
    
    <div class="rectangle" style="width:100%;height:80px">
        <div style="float:left;font-size:30px;padding:20px;font:Abel">Welcome, {{user_id}}!</div>
        <div style="padding:20px">
            <button @click="redirectToLogin()" class="button curve_edge" style="float:right;padding:15px">Log Out</button>
        </div>
    </div>

    <div class = "flex row" style="width:100%">

        <div class="rectangle column" style="width: 250px;height:100%;float:left">
            <div style="padding:8px"></div>
            <button class="button curve_edge" @click="redirectToEditor()" style="padding:10px;width:90%;top:95px;margin_top:10px;font-size:20px">New Project</button>
            <div style="padding:10px"></div>
            <div class="tab">
                <button id = "MyProjects" class="rectangle tab tablinks active" @click="openTab(event, 'MyProjects')" style="padding:10px;width:100%;top:95px;margin_top:10px;font-size:20px;text-align:left">All Projects</button>
                <div style="padding:8px"></div>
                <button id="MyAssignments" class="rectangle tab tablinks inactive" @click="openTab(event, 'MyAssignments')" style="padding:10px;width:100%;top:95px;margin_top:10px;font-size:20px;text-align:left">My Assignments</button>
            </div>
        </div>

        <div class="column flexwidth flex" style = "float:left;padding:10px;top:0px">
            <div id="MyProjects" class="tabcontent flex" style="display:flex;width:1400px;overflow:scroll;top:0">
                <table>
                    <tr>
                        <td><button class="project">Project 1</button></td>
                    </tr>
                    <tr>
                        <td><button class="project">Assignment 1</button></td>
                    </tr>
                    <tr>
                        <td><button class="project">Project 2</button></td>
                    </tr>
                    <tr>
                        <td><button class="project">Project 3</button></td>
                    </tr>
                    <tr>
                        <td><button class="project">Project 4</button></td>
                    </tr>
                    <tr>
                        <td><button class="project">Assignment 2</button></td>
                    </tr>
                    <tr>
                        <td><button class="project">Project 5</button></td>
                    </tr>
                    <tr>
                        <td><button class="project">Project 6</button></td>
                    </tr>
                    <tr>
                        <td><button class="project">Project 7</button></td>
                    </tr>
                    <tr>
                        <td><button class="project">Project 8</button></td>
                    </tr>
                    <tr>
                        <td><button class="project">Project 9</button></td>
                    </tr>
                </table>
            </div>
            <div id="MyAssignments" class="tabcontent flex" style="display:none;width:1400px;overflow:scroll;top:0">
                <table>
                    <tr height="50px">
                        <td valign="top"><button class="project">Assignment 1</button></td>
                    </tr>
                    <tr height="50px">
                        <td valign="top"><button class="project">Assignment 2</button></td>
                    </tr>
                    <tr height="50px">
                        <td valign="top"><button class="project">Assignment 3</button></td>
                    </tr>
                    <tr height="50px">
                        <td valign="top"><button class="project">Assignment 4</button></td>
                    </tr>
                    <tr height="50px">
                        <td valign="top"><button class="project">Assignment 5</button></td>
                    </tr>
                    <tr height="50px">
                        <td valign="top"><button class="project">Assignment 6</button></td>
                    </tr>
                    <tr height="50px">
                        <td valign="top"><button class="project">Assignment 7</button></td>
                    </tr>
                    <tr height="50px">
                        <td valign="top"><button class="project">Assignment 8</button></td>
                    </tr>
                    <tr height="50px">
                        <td valign="top"><button class="project">Assignment 9</button></td>
                    </tr>
                    <tr height="50px">
                        <td valign="top"><button class="project">Assignment 10</button></td>
                    </tr>
                    <tr height="50px">
                        <td valign="top"><button class="project">Assignment 11</button></td>
                    </tr>
                </table>
            </div>
        </div>

    </div>
    

  </body>
</template>

<script>
import axios from "axios"
import { onBeforeMount } from '@vue/runtime-core';
export default {
  name: "#app",
  data () {
    return {
        user_id: "whatever"
     }
  },
  methods: {
    redirectToEditor() {
      this.$router.push({ path: '/editor' });
    },
    redirectToLogin() {
        this.$router.push({ path: '/login'});
    },
    openTab(evt, name) {
        var i, tabcontent, tablinks;

        tabcontent = document.getElementsByClassName("tabcontent");
        console.log(tabcontent)
        for (i = 0; i < tabcontent.length; i++) {
            tabcontent[i].style.display = "none";
        }

        tablinks = document.getElementsByClassName("tablinks");

        if (name == 'MyProjects'){
            tablinks[0].className = tablinks[0].className.replace('inactive', 'active');
            tablinks[1].className = tablinks[1].className.replace('active', 'inactive');
            console.log(tabcontent[0].style.display)
            tabcontent[0].style.display = "flex";
            console.log(tabcontent[0].style.display)
        }
        else if (name == 'MyAssignments') {
            tablinks[0].className = tablinks[0].className.replace('active', 'inactive');
            tablinks[1].className = tablinks[1].className.replace('inactive', 'active');
            console.log(tabcontent[1].style.display)
            tabcontent[1].style.display = "flex";
            console.log(tabcontent[1].style.display)
        }
    },
    getUser(id) {
        // Simple GET request using axios
        axios.get("http://localhost:3060/api/v1/users/" + id)
            .then(response => this.user_id = response.data.name)
            .catch(error => console.log(error));
    }, 
  },  
  mounted() {
    console.log("running");
    this.getUser("somethingelse");
  }
};

</script>

<style scoped>
.rectangle {
        background: #D6EFFF;
        border: solid 2px #D6EFFF
    }
.curve_edge {
    border-radius: 10px;
}
.button {
    background:#6BDBAD;
    border: #6BDBAD;
}

.button:hover {
    background:#56c295;
    border: #6BDBAD;
}

.project {
    border: solid 2px #D6EFFF;
    background:#FFFFFF;
    width:1100px;
    font-size:25px;
    padding:15px;
    text-align:left
}

.project:hover {
    border: solid 2px #c6e8fd;
    color:darkgrey;
}

.flex {
    position: absolute;
    top: 85px;
    bottom: 2px;
}

.flexwidth {
    position: absolute;
    left: 250px;
    right: 2px;
}

.row:after {
    content: "";
    display: table;
    clear: both;
    }

.column {
    float: left;
    width: 50%;
    }


.tab button {
  background-color: #D6EFFF;
  float: left;
  border: none;
  outline: none;
  cursor: pointer;
  padding: 14px 16px;
  transition: 0.3s;
}

/* Change background color of buttons on hover */
.tab button:hover {
  background-color: #9ec7e0;
}

/* Create an active/current tablink class */
.tab button.active {
  background-color: #74A0BE;
}

.tab button.inactive {
  background-color: #D6EFFF;
}

/* Style the tab content */
.tabcontent {
  display: none;
  padding: 10px;
}
</style>