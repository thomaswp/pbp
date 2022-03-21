<template>
  <body style="font:Abel;background-color:#66748F">
    <!--Header for the homepage -->
    <div class="rectangle topbar">
      <div
        style="float:left;font-size:30px;padding:10px;font:Abel;color:white;font-weight:bold"
      >
        CS Help: Welcome, {{ user_id }}!
      </div>
      <div style="padding:5px">
        <button
          @click="logOut()"
          class="button curve_edge"
          style="float:right;padding:15px;background-color:#1F1F1F;color:white;font-size:15px"
        >
          Log Out
        </button>
      </div>
    </div>

    <!--Main body of the page-->
    <div class="flex row" style="width:100%">

      <!--Side bar of page-->
      <div class="rectangle column" style="width:20%;height:100%;float:left">
        <div style="padding:8px"></div>

        <!-- Blank Project button -->
        <button
          class="button curve_edge"
          @click="createNewProject()"
          style="padding:5%;width:80%;top:95px;margin_top:10px;font-size:20px"
        >
          Blank Project
        </button>
        <div style="padding:10px"></div>

        <!-- Tab list -->
        <div class="tab" style="padding-left:5%">
          <button
            id="MyProjects"
            class="rectangle tab tablinks active"
            @click="openTab(event, 'MyProjects')"
            style="padding:30px;padding-top:40px;padding-bottom:40px;width:100%;top:95px;margin_top:10px;font-size:20px;text-align:left;"
          >
            All Projects
          </button>
          <div style="padding:8px"></div>
          <button
            id="MyArchivedProjects"
            class="rectangle tab tablinks inactive"
            @click="openTab(event, 'MyArchivedProjects')"
            style="padding:30px;padding-top:40px;padding-bottom:40px;width:100%;top:95px;margin_top:10px;font-size:20px;text-align:left;"
          >
            Archived Projects
          </button>
        </div>
      </div>

      <!--Page tabs-->
      <div
        class="column flexwidth flex curve_edge"
        style="float:left;padding:10px;top:0px;width:75%;"
      >
        <!--Project Tab-->
        <div
          id="MyProjects"
          class="tabcontent flex"
          style="display:flex;width;overflow:scroll;top:0;background-color:#ffffff;height:max-content;max-height:95%"
        >
          <ProjectList
              :projects="filterArchived(false)"
              ref="activeList"
              @edit-project-name="(id, name) => handleEditProjName(id, name, 'activeList')"
              @archive-project="handleArchiveProject"
              @open-project="handleOpenProject" />
        </div>
        
        <!--Archive Tab-->
        <div
          id="MyArchivedProjects"
          class="tabcontent flex"
          style="display:none;width;overflow:scroll;top:0;background-color:#ffffff;height:max-content;max-height:95%"
        >
          <ProjectList
              :projects="filterArchived(true)"
              ref="archiveList"
              @edit-proj-name="(id, name) => handleEditProjName(id, name, 'archiveList')"
              @archive-project="handleArchiveProject"
              @open-project="handleOpenProject" />
        </div>
      </div>

      <!--Project Creator Popup-->
      <div
        id="project-creator"
        class="curve_edge"
        style="display:none;border:5px solid #4f5ab9"
      >
        <div style="font-size:30px;font-weight:bold;padding-top:15px">
          Enter Project Name
        </div>
        <div
          style="width:100%;padding-bottom:20px;padding-top:20px;font-size:20px"
        >
          <input
            type="text"
            style="height:40px;width:80%;text-align:center"
            id="projname"
            @keyup.enter="submitNewProject()"
          />
        </div>
        <div style="float:left;width:49%">
          <button
            class="button curve_edge"
            @click="submitNewProject()"
            style="padding:10px;padding-top:10px;padding-bottom:10px;top:95px;margin_top:10px;font-size:20px;text-align:center;background-color:#1F1F1F;float:right"
          >
            Create
          </button>
        </div>
        <div style="float:right;width:49%">
          <button
            class="button curve_edge"
            @click="cancelNewProject()"
            style="padding:10px;padding-top:10px;padding-bottom:10px;top:95px;margin_top:10px;font-size:20px;text-align:center;background-color:#1F1F1F;float:left"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </body>
</template>

<script>
import axios from "axios";
import ProjectList from '../components/ProjectList.vue';

export default {
  name: "#app",

  components: {
    ProjectList
  },

  data() {
    return {
      user_id: "whatever",
      user_email: "wh@ev.er",
      user_projects: Object,
    };
  },
  computed: {
    // Show only archived or unarchived projects
    filterArchived() {  // computed properties can't have arguments
      // workaround for computed property with argument
      return (showArchived) => {
        // start with empty map
        let output_projects = {};
        // for each project
        for (const id in this.user_projects) {
          const proj = this.user_projects[id];
          // copy id into object
          proj.id = id;
          // if archived/unarchived, copy into output
          if(proj.isArchived == showArchived) {
            output_projects[id] = proj;
          }
        }
        return output_projects;
      }
    },
  },
  methods: {
    //Method to redirect the current page to the editor.
    //TODO: Add ability to redirect to existing project or open an assignment template
    redirectToNewProject(projname) {
      let projdata = {
        name: projname,
      };
      axios
        .post("/api/v1/projects", projdata)
        .then((response) => {
          console.log(response);
          console.log("Pushed blank project button");
          this.$router.push({ path: "/editor/" + response.data.id });
        })
        .catch((error) => console.log(error));

      // do an axios api call to create a new project and connect to the user
    },


    // Handlers for ProjectList
    // Rename a project to a new name
    // (given the ProjectList ref name, tell that list when the rename successful)
    handleEditProjName(id, name, ref) {
      console.log({
        name: 'handleEditProjName',
        id: id,
        projname: name,
        ref: ref,
      })
      axios.put("/api/v1/projects/" + id + "/name", {name: name})
          .then((response) => {
            this.user_projects[id] = response.data;
            // Call a method on the ProjectList to indicate that editing is done
            const projectList = this.$refs[ref];
            projectList.finishEditName(id);
          })
          .catch((error) => {
            console.log(error);
            window.alert("Received error. Maybe project name cannot be blank?");
          });
    },
    // Click on a project name to go to its editor
    handleOpenProject(id) {
      this.$router.push({ path: "/editor/" + id });
    },
    // Set a project to be archived or unarchived
    handleArchiveProject(id, archive = true) {
      const path = archive
          ? "archive"
          : "unarchive"
       axios.put("/api/v1/projects/" + id + '/' + path)
          .then((response) => {
            console.log("(un?)archived project");
            this.user_projects[id] = response.data;
          })
          .catch((error) => {
            console.log(error);
          });
    },

    //Method to display popup when the user chooses to create a new, blank project
    createNewProject() {
      document.getElementById("project-creator").style.display = "block";
      document.getElementById("projname").focus();
    },



    //Method to handle when the user submits the name for their new, blank project
    //Does some error handling to ensure name isn't null
    submitNewProject() {
      let projname = document.getElementById("projname").value;
      if (projname) {
        document.getElementById("project-creator").style.display = "none";
        console.log(projname);
        this.redirectToNewProject(projname);
      } else {
        window.alert("Project name cannot be blank.");
      }
    },
    //Exit out of the new project creator
    cancelNewProject() {
      document.getElementById("project-creator").style.display = "none";
    },
    //Method to log the user out of the system
    redirectToLogin() {
      this.$router.push({ path: "/login" });
    },
    //Method to handle switching between the tabs on the page.
    openTab(evt, name) {
      var i, tabcontent, tablinks;

      tabcontent = document.getElementsByClassName("tabcontent");
      // console.log(tabcontent);
      for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
      }

      tablinks = document.getElementsByClassName("tablinks");

      if (name == "MyProjects") {
        tablinks[0].className = tablinks[0].className.replace(
          "inactive",
          "active"
        );
        tablinks[1].className = tablinks[1].className.replace(
          "active",
          "inactive"
        );
        // console.log(tabcontent[0].style.display);
        tabcontent[0].style.display = "flex";
        // console.log(tabcontent[0].style.display);
      } else if (name == "MyArchivedProjects") {
        tablinks[0].className = tablinks[0].className.replace(
          "active",
          "inactive"
        );
        tablinks[1].className = tablinks[1].className.replace(
          "inactive",
          "active"
        );
        // console.log(tabcontent[1].style.display);
        tabcontent[1].style.display = "flex";
        // console.log(tabcontent[1].style.display);
      }
    },
    //Method to fetch info about the current user given their id
    getUser(id) {
      axios
        .get("/api/v1/users/" + id)
        .then((response) => (this.user_id = response.data.name))
        .catch((error) => console.log(error));
    },
    //Method to fetch the currently logged in user
    getLoggedUser() {
      axios
        .get("/api/v1/user")
        .then((response) => {
          this.user_id = response.data?.name;
          this.user_email = response.data?.email;
          if (!this.user_id) {
            this.$router.push({ path: "/login" });
          }
          this.user_projects = response.data?.projects;
        })
        .catch((error) => {
          console.log(error);
          this.$router.push({ path: "/login" });
        });
    },
    //Method to log the user out of the system
    logOut() {
      axios
        .post("/api/v1/logout/google")
        .then((response) => {
          console.log(response);
          this.$router.push({ path: "/login" });
        })
        .catch((error) => console.log(error));
    },
  },
  mounted() {
    console.log("running");
    this.getLoggedUser();
  },
};
</script>

<style scoped>
.rectangle {
  background: #1f1f1f;
}
.curve_edge {
  border-radius: 10px;
}
.button {
  background: #8ea2f9;
  color: white;
}

.editButton {
  color: #8ea2f9;
  border: solid 0px #4f5ab9;
  background: rgb(142, 162, 249, 0);
  font-size:15px;
}
.editButton:hover {
  font-size:17px
}

.archiveButton {
  color: #8ea2f9;
  border: solid 0px #4f5ab9;
  background: rgb(142, 162, 249, 0);
  font-size:35px;
}
.archiveButton:hover {
  font-size:37px
}

.button:hover {
  font-weight: bold;
}

.topbar {
  border: solid 3px #4f5ab9;
  width: 100%;
  height: 65px;
  background-color: #8ea2f9;
}

.project {
  border: solid 3px #4f5ab9;
  color: black;
  border-radius: 10px;
  background: rgb(142, 162, 249, 0.1);
  font-size: 25px;
  padding: 15px;
  text-align: left;
  width: 97%;
  height: 80px;
}

.project-button {
  font-size: 35px;
  border: transparent;
  background: rgb(142, 162, 249, 0);
  padding: 15px;
  text-align: left;
  height: 80px;
}

.project-button-off {
  font-size: 35px;
  border: transparent;
  background: rgb(142, 162, 249, 0);
  padding: 15px;
  text-align: left;
  height: 80px;
}

.project-button:hover {
  font-weight: bold;
}

.project:hover {
  font-weight: bold;
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
  background-color: #383b56;
  border-radius: 15px 0px 0px 15px;
  float: left;
  border: none;
  outline: none;
  cursor: pointer;
  padding: 14px 16px;
  transition: 0.3s;
}

/* Change background color of buttons on hover */
.tab button:hover {
  font-weight: bold;
}

/* Create an active/current tablink class */
.tab button.active {
  background-color: #ffffff;
  color: black;
}

.tab button.inactive {
  background-color: #1f1f1f;
  color: white;
}

/* Style the tab content */
.tabcontent {
  display: none;
  padding: 15px;
  width: 100%;
}

table {
  border-collapse: separate;
  border-spacing: 0px 5px;
}
tr {
  height: 20px;
}

#project-creator {
  position: absolute;
  top: 20%;
  left: 40%;
  background-color: rgb(142, 162, 249, 0.95);
  color: white;

  width: 40%;
  height: 210px;
}
</style>
