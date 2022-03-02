<template>
  <body style="font:Abel;background-color:#66748F">
    
    <!--Header for the homepage -->
    <div class="rectangle topbar">
        <div style="float:left;font-size:30px;padding:10px;font:Abel;color:white;font-weight:bold">CS Help: Welcome, {{user_id}}! ({{user_email}})</div>
        <div style="padding:5px">
            <button @click="logOut()" class="button curve_edge" style="float:right;padding:15px;background-color:#1F1F1F;color:white;font-size:15px">Log Out</button>
        </div>
    </div>

    <div class = "flex row" style="width:100%">

        <div class="rectangle column" style="width:20%;height:100%;float:left">
            <div style="padding:8px"></div>
            <button class="button curve_edge" @click="redirectToEditor()" style="padding:5%;width:80%;top:95px;margin_top:10px;font-size:20px">Blank Project</button>
            <div style="padding:10px"></div>
            <div class="tab" style="padding-left:5%">
                <button id = "MyProjects" class="rectangle tab tablinks active" @click="openTab(event, 'MyProjects')" style="padding:30px;padding-top:40px;padding-bottom:40px;width:100%;top:95px;margin_top:10px;font-size:20px;text-align:left;">All Projects</button>
                <div style="padding:8px"></div>
                <button id="MyAssignments" class="rectangle tab tablinks inactive" @click="openTab(event, 'MyAssignments')" style="padding:30px;padding-top:40px;padding-bottom:40px;width:100%;top:95px;margin_top:10px;font-size:20px;text-align:left;">My Assignments</button>
            </div>
        </div>

        <div class="column flexwidth flex curve_edge" style = "float:left;padding:10px;top:0px;width:75%">
            <div id="MyProjects" class="tabcontent flex" style="display:flex;width:100%;overflow:scroll;top:0;background-color:#ffffff">
                <table style="width:100%">
                    <tr>
                        <td> <button class="project">Project 1</button></td>
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
            <div id="MyAssignments" class="tabcontent flex" style="display:none;width:100%;overflow:scroll;top:0;background-color:#ffffff">
                <table style="width:100%">
                    <tr>
                        <td valign="top"><button class="project">Assignment 1</button></td>
                    </tr>
                    <tr>
                        <td valign="top"><button class="project">Assignment 2</button></td>
                    </tr>
                    <tr>
                        <td valign="top"><button class="project">Assignment 3</button></td>
                    </tr>
                    <tr>
                        <td valign="top"><button class="project">Assignment 4</button></td>
                    </tr>
                    <tr>
                        <td valign="top"><button class="project">Assignment 5</button></td>
                    </tr>
                    <tr>
                        <td valign="top"><button class="project">Assignment 6</button></td>
                    </tr>
                    <tr>
                        <td valign="top"><button class="project">Assignment 7</button></td>
                    </tr>
                    <tr>
                        <td valign="top"><button class="project">Assignment 8</button></td>
                    </tr>
                    <tr>
                        <td valign="top"><button class="project">Assignment 9</button></td>
                    </tr>
                    <tr>
                        <td valign="top"><button class="project">Assignment 10</button></td>
                    </tr>
                    <tr>
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

export default {
  name: "#app",
  data () {
    return {
        user_id: "whatever",
        user_email: "wh@ev.er"
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
        axios.get("/api/v1/users/" + id)
            .then(response => this.user_id = response.data.name)
            .catch(error => console.log(error));
    }, 
    getLoggedUser() {
        axios.get("/api/v1/user")
            .then((response) => {
                this.user_id = response.data?.name;
                this.user_email = response.data?.email;
                if(!this.user_id) {
                    this.$router.push({ path: '/login'});
                }
            })
            .catch((error) => {
                console.log(error);
            });
    },
    logOut() {
        axios.post("/api/v1/logout/google")
            .then(response => {
                console.log(response);
                this.$router.push({ path: '/login'});
            })
            .catch(error => console.log(error));
    },
  },  
  mounted() {
    console.log("running");
    this.getLoggedUser();
  }
};

</script>

<style scoped>
.rectangle {
        background: #1F1F1F;
    }
.curve_edge {
    border-radius: 10px;
}
.button {
    background:#8ea2f9;
    color:white;
}

.button:hover {
    font-weight:bold;
}

.topbar {
    border: solid 3px #4f5ab9;
    width:100%;
    height:65px;
    background-color:#8ea2f9;
}

.project {
    border: solid 3px #4f5ab9;
    color: black;
    border-radius:10px;
    background: rgb(142, 162, 249, 0.1);
    font-size:25px;
    padding:15px;
    text-align:left;
    width: 100%;
    height:80px;
}

.project:hover {
    font-weight:bold;
}

.flex {
    position: absolute;
    top: 71px;
    bottom: 0px;
}

.flexwidth {
    position: absolute;
    left: 20%;
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
  background-color: #383B56;
  border-radius:15px 0px 0px 15px;
  float: left;
  border: none;
  outline: none;
  cursor: pointer;
  padding: 14px 16px;
  transition: 0.3s;
}

/* Change background color of buttons on hover */
.tab button:hover {
    font-weight:bold;
}

/* Create an active/current tablink class */
.tab button.active {
  background-color:#ffffff;
  color:black;
}

.tab button.inactive {
  background-color: #1F1F1F;
  color: white;
}

/* Style the tab content */
.tabcontent {
  display: none;
  padding: 15px;
  width:100%;
}

table {
  border-collapse: separate;
  border-spacing: 0px 5px;
}
tr {
  height: 86px;
}

</style>