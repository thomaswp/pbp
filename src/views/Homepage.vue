<template>

<div>

  <!-- Setup navbar across the top -->
  <nav class="navbar navbar-expand-md navbar-dark bg-cshelp"
      id="navbar" ref="navbar">
    <div class="container-fluid">

      <!-- "brand" label of the site -->
      <span class="navbar-brand"><b>CS Help</b></span>

      <!-- Hamburger menu icon - shows when the screen is too narrow -->
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
      <!-- Collapsible navbar -->
      <div class="collapse navbar-collapse" id="navbarSupportedContent">

        <!-- Setup contents:
              navbar-nav:   mark this as "navbar contents"
              me-auto:      anything after this floats right
              mb-2 mb-lg-0: no bottom margin
        -->
        <div class="navbar-nav me-auto">

          <!-- format like a navbar element, which are usually links -->
          <div class="nav-item nav-link"> <!-- could have class "active" for white fg color -->
            Welcome, {{ user.name }}!
          </div>

        </div>

        <!-- Right-aligned button (bc fo me-auto above) -->
        <div class="d-flex">
          <button 
              class="btn btn-dark"
              @click="logOut()">
            Log Out
          </button>
        </div>
          
      </div>
    </div>
  </nav>

  <!-- Tabs for different views -->
  <div class="d-flex align-items-start">
    
    <!-- Tab list on the left -->
    <!-- todo: min width or no wrap, maybe?
    (on a narrow screen, the "active projects" text wraps) -->
    <div class="bg-dark"
        id="tablist-bg" ref="tablist-bg"
        :style="{
            'height': `${tablistHeight}px`,
            'min-height': 'max-content'
        }">
      <div class="nav nav-tabs flex-column" role="tablist"
          id="tablist-tabs" ref="tablist-tabs">
        <!-- Blank Project button, triggers modal -->
        <button type="button"
            class="btn btn-cshelp m-3"
            data-bs-toggle="modal" data-bs-target="#newProjectModal"
            @click="onOpenNewProjectModal()">
          Blank Project
        </button>
        <!-- Import File button, triggers modal -->
        <button type="button"
            class="btn btn-cshelp m-3"
            data-bs-toggle="modal" data-bs-target="#uploadFileModal">
          Import Project
        </button>

        <!-- Tab label for Assignments -->
        <button id="assign-tab"
            class="nav-link active p-3 ms-2 mb-1" 
            data-bs-toggle="tab" data-bs-target="#assignments_tab"
            type="button" role="tab">
          Assignments
        </button>

        <!-- Tab label on the left for Active Projects -->
        <button id="home-tab"
            class="nav-link p-3 ms-2 mb-1" 
            data-bs-toggle="tab" data-bs-target="#active_projects"
            type="button" role="tab">
          Active Projects
        </button>

        <!-- Tab label for Archived Projects -->
        <button id="profile-tab"
            class="nav-link p-3 ms-2 mb-1" 
            data-bs-toggle="tab" data-bs-target="#archived_projects"
            type="button" role="tab">
          Archived Projects
        </button>
      </div>
    </div>
    <!-- Tab contents -->
    <div class="tab-content m-3 flex-grow-1" id="myTabContent">

      <!-- Tab 1: Assignments -->
      <div class="tab-pane fade show active" id="assignments_tab" role="tabpanel">
        <AssignmentList
              :projects="assignments"
              ref="assignmentList"
              @open-project="handleOpenAssignment" />
      </div>

      <!-- Tab 2: Active Projects -->
      <div class="tab-pane fade show" id="active_projects" role="tabpanel">
        <ProjectList
              :projects="filterArchived(false)"
              ref="activeList"
              @edit-project-name="(id, name) => handleEditProjName(id, name, 'activeList')"
              @archive-project="handleArchiveProject"
              @open-project="handleOpenProject"
              @reset-project="onResetProjectModal" />
      </div>
      
      <!-- Tab 3: Archived Projets -->
      <div class="tab-pane fade" id="archived_projects" role="tabpanel">
          <ProjectList
              :projects="filterArchived(true)"
              ref="archiveList"
              @edit-project-name="(id, name) => handleEditProjName(id, name, 'archiveList')"
              @archive-project="handleArchiveProject"
              @open-project="handleOpenProject" />
      </div>

    </div>
  </div>

  <!-- New Project Modal -->
  <div class="modal fade" id="newProjectModal" tabindex="-1">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="exampleModalLabel">Create Blank Project</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
            <input id="newProjectNameInput"
                type="text" class="form-control"
                placeholder="Project Name" />

        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary"
              data-bs-dismiss="modal" @click="onCancelNewProjectModal()">
            Cancel
          </button>
          <button type="button" class="btn btn-primary"
              @click="createNewProject()">
            Create Project
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Reset Confirmation Modal -->
  <div class="modal fade" id="resetProjectModal" tabindex="-1">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="exampleModalLabel">Are you sure you want to reset?</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary"
              data-bs-dismiss="modal" @click="onCancelResetProjectModal()">
            No
          </button>
          <button type="button" class="btn btn-primary"
              @click="handleResetProject()">
            Yes
          </button>
        </div>
      </div>
    </div>
  </div>


  <!-- Upload File Modal -->
  <div class="modal fade" id="uploadFileModal" tabindex="-1">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="exampleModalLabel">Upload Project File</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
            <input id="newFileInput"
                type="file" class="form-control"/>

        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary"
              data-bs-dismiss="modal">
            Cancel
          </button>
          <button type="button" class="btn btn-primary"
              @click="importProject()">
            Import Project
          </button>
        </div>
      </div>
    </div>
  </div>

  </div>

</template>


<script>
import axios from "axios";
import ProjectList from "../components/ProjectList.vue";
import AssignmentList from "../components/AssignmentList.vue";
import { Modal } from "bootstrap";
export default {
  
  components: {
    ProjectList,
    AssignmentList,
  },

  data() {
    return {
      // Workaround for left tab list height
      isMounted: false,
      // Track the window height for responsive tab height updates
      windowHeight: window.innerHeight,
      // Store the logged in user object
      user: {
        name: "whatever",
        email: "wh@ev.er",
        projects: {
          'id-asdf-1234': {
            'name': 'dummy project 1',
            'isArchived': false,
          },
        },
      },
      // save the project that may be reset while the "reset project" modal is up
      toReset: "id",
      assignments: {},
      project: {},
    }
  },

  computed: {
    // Compute the height of the tablist
    tablistHeight() {
      // If navbar not yet mounted, return placeholder value
      if (!this.isMounted) return 300;
      // Get access to the top navbar and the list of tabs
      const navbar = this.$refs['navbar'];
      const tablist_tabs = this.$refs['tablist-tabs'];
      // Subtract navbar height from window height
      const remainingHeight = this.windowHeight - navbar.offsetHeight;
      // Height should be at least enough for the tabs, and then stretch down to screen height
      return Math.max(tablist_tabs.offsetHeight, remainingHeight);
    },
    // Show only archived or unarchived projects
    filterArchived() {  // computed properties can't have arguments
      // workaround for computed property with argument
      return (showArchived) => {
        // start with empty map
        let output_projects = {};
        // for each project
        for (const id in this.user.projects) {
          const proj = this.user.projects[id];
          // copy id into object
          proj.id = id;
          // if archived/unarchived, copy into output
          if(proj.isArchived == showArchived) {
            output_projects[id] = proj;
          }
        }
        console.log("all projects");
        console.log(output_projects);
        return output_projects;
      }
    },
    listAssignments() {
      return {};
    }
  },

  methods: {
     // Handlers for ProjectList
    // Rename a project to a new name
    // (given the ProjectList ref name, tell that list when the rename successful)
    handleEditProjName(id, name, ref) {
      console.log({
        name: 'handleEditProjectName',
        id: id,
        projname: name,
        ref: ref,
      })
      // Store assignment name if it is an assignment copy
      let currentAssignmentName;
      if (this.user.projects[id].isAssignmentCopy) {
        currentAssignmentName = this.user.projects[id].assignmentName;
      }
      // Call edit name api
      axios.put("/api/v1/projects/" + id + "/name", {name: name})
          .then((response) => {
            this.user.projects[id] = response.data;
            if (currentAssignmentName) {
              this.user.projects[id].assignmentName = currentAssignmentName;
            }
            // Call a method on the ProjectList to indicate that editing is done
            const projectList = this.$refs[ref];
            projectList.finishEditName(id);
          })
          .catch((error) => {
            console.log(error);
            window.alert("Received error. Maybe project name cannot be blank?");
          });
    },
    importProject() {
      console.log(document.getElementById('newFileInput').files[0].name)
      var file = document.getElementById('newFileInput').files[0]
      //console.log("CHECK");

      if(!file.name.includes(".json")) {
        window.alert("Imported file is not a json file");
        return;
      }

      // json file is malformatted
      // no name, no data
      const fr = new FileReader();

      fr.onload = e => {
        const result = JSON.parse(e.target.result);
        this.project.data = result.data;
        console.log(result.data);
        if(!("name" in result) || !("data" in result)) {
          console.log("no name or data");
          window.alert("JSON file does not have a name or data field");
          return;
        } else {
          console.log("has name and data");
        }
        

        axios
        .post("/api/v1/projects", { name: result.name+" - imported" })
        .then((response) => {

          this.project.id = response.data.id

          axios
          .put("/api/v1/projects/" + this.project.id + "/data", this.project)
          .then((response) => {
            console.log("Saved project");
            console.log(response)

            // hide the modal
            // find the element
            const newProjHTML = document.getElementById('uploadFileModal');
            // remove the "hide" class so that it just snaps away
            newProjHTML.classList.remove('fade');
            // get the Bootstrap instance of it, and hide it
            const newProjModal = Modal.getInstance(newProjHTML);    
            newProjModal.hide();

            // redirect to editor
            this.$router.push({ path: "/editor/" +this.project.id });
          })
          .catch((error) => {
            console.log(error);
          });
        })
        .catch((error) => { console.log(error); window.alert(error); });
        
      }
      fr.readAsText(file);
    },
    // Click on a project name to go to its editor
    // TODO: could this just be inside the component?
    handleOpenProject(id) {
      this.$router.push({ path: "/editor/" + id });
    },
    handleOpenAssignment(id) {
      let assignment = {
        assignmentID: id
      };
      console.log(assignment);
      axios.post("/api/v1/open/assignment/", assignment)
          .then((response) => {
            console.log("assignment opening");
            let project_id = response.data.projectID;
            console.log(project_id);
            this.handleOpenProject(project_id);
          })
          .catch((error) => {
            console.log(error);
          });
    },
    // Set a project to be archived or unarchived
    handleArchiveProject(id, archive = true) {
      const path = archive
          ? "archive"
          : "unarchive"
       // Store assignment name if it is an assignment copy
      let currentAssignmentName;
      if (this.user.projects[id].isAssignmentCopy) {
        currentAssignmentName = this.user.projects[id].assignmentName;
      }
      axios.put("/api/v1/projects/" + id + '/' + path)
          .then((response) => {
            console.log("(un?)archived project");
            this.user.projects[id] = response.data;
            if (currentAssignmentName) {
              this.user.projects[id].assignmentName = currentAssignmentName;
            }
          })
          .catch((error) => {
            console.log(error);
          });
    },

    async handleResetProject() {
      console.log("resetting");
      // use this.toReset to get the project id that we're resetting
      try {
        let response = await axios.post("/api/v1/project/reset", {projectID: this.toReset});
      } catch (err) {
        console.log(err);
      }
      // find the element
      const resetProjectHTML = document.getElementById('resetProjectModal');
      // get the Bootstrap instance of it, and hide it
      const resetProjModal = Modal.getOrCreateInstance(resetProjectHTML);    
      // hide the modal now that it's done
      resetProjModal.hide();
      location.reload();
    },

    // Method to get assignment name
    async getAssignmentName() {
      try {
        let listAssignmentsPromise = []
        for (const [proj_id, value] of Object.entries(this.user.projects)) {
            if(this.user.projects[proj_id].isAssignmentCopy)
              listAssignmentsPromise.push(axios.get("/api/v1/assignment/" + proj_id));
        }
        let listOfAssignments = await Promise.all(listAssignmentsPromise)
        let i = 0;
        for (const [proj_id, value] of Object.entries(this.user.projects)) {
            if(this.user.projects[proj_id].isAssignmentCopy) {
              this.user.projects[proj_id].assignmentName = listOfAssignments[i].data.name;
              i++;
            }
            console.log(`${proj_id}: ${value}`);
        }
      } catch (err) {
        // Handle Error Here
        console.error(err);
      }
    },

    //Method to fetch the currently logged in user
    async getLoggedUser() {
      try {
        let response = await axios.get("/api/v1/user");
        this.user = response.data;
        console.log("User data");
        console.log(this.user.projects);
        if (!this.user?.name) {
          this.$router.push({ path: "/login" });
        }
      } catch(err) {
        console.error(err);
        this.$router.push({ path: "/login" });
      }
    },

    //
    async getAssignments() {
      axios
        .get("/api/v1/assignment")
        .then((response) => {
          // if we just try to say this.assignments[..] = ..,
          // JS/vue isn't smart enough to detect those changes (properties inside of an object)
          // so we need to swap this.assignments out into a different object
          // otherwise, it just won't trigger updates to the ProjectList component
          const newAssignments = {}
          response.data.forEach((assignment) => {
            newAssignments[assignment.id] = {
              ...assignment,
              isArchived: false,
              // if you want to remove a field here, this is how you can do it
              // data: undefined,
              // copies: undefined,
              // createdAt: undefined,
              // updatedAt: undefined,
            };
          });
          // reassign this.assignments to trigger an update
          this.assignments = newAssignments;
        })
        .catch((error) => {
          console.error(error);
        });
    },

    // Methods for new project modal
    // On open, focus on name input
    onOpenNewProjectModal() {
      document.getElementById('newProjectNameInput').focus();
    },
    onResetProjectModal(id) {
      // find the element
      const resetProjectHTML = document.getElementById('resetProjectModal');
      // get the Bootstrap instance of it, and hide it
      const resetProjModal = Modal.getOrCreateInstance(resetProjectHTML);    
      resetProjModal.show();
      // save the project id for later - if the user clicks "yes", we'll need it
      this.toReset = id;
    },
    // On cancel, clear the project name input field (otherwise it persists)
    onCancelNewProjectModal() {
      // this.$refs['newProjectNameInput'].value = '';
    },
    onCancelResetProjectModal() {

    },
    //Method to handle when the user submits the name for their new, blank project
    //Does some error handling to ensure name isn't null
    createNewProject() {
      // get project name from input in modal
      let projname = document.getElementById('newProjectNameInput').value;

      // ensure it's not empty or invalid
      if (!projname) {
        window.alert("Project name cannot be blank.");
        return;
      }

      // Post the new project to the API, and then redirect to that project's editor
      axios
        .post("/api/v1/projects", { name: projname })
        .then((response) => {
          // hide the modal
          // find the element
          const newProjHTML = document.getElementById('newProjectModal');
          // remove the "hide" class so that it just snaps away
          newProjHTML.classList.remove('fade');
          // get the Bootstrap instance of it, and hide it
          const newProjModal = Modal.getInstance(newProjHTML);    
          newProjModal.hide();

          // redirect to editor
          this.$router.push({ path: "/editor/" + response.data.id });
        })
        .catch((error) => { console.log(error); window.alert(error); });

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

  async created() {
    // Get logged in user; redirect to login if not logged in
    await this.getLoggedUser();
    // Get assignment name and put it in project
    await this.getAssignmentName();
    // Get assignment list and save it
    await this.getAssignments();
  },

  mounted() {
    // Add resize listener to make homepage reactive to resize
    window.addEventListener('resize', () => {
      this.windowHeight = window.innerHeight
      console.log(this.windowHeight);
    });
    
    // Workaround for tablist height
    this.isMounted = true;

    // add listener to the "New Project Name" input:
    // when you close its containing modal, clear its contents
    // happens *after* modal is out of sight
    const newProjHTML = document.getElementById('newProjectModal');
    newProjHTML.addEventListener('hidden.bs.modal', function () {
      // get the name input element
      const nameInput = document.getElementById('newProjectNameInput');
      // if it exists, clear its value
      if (nameInput) {
        nameInput.value = '';
      }
    })
  }
}
</script>


<style scoped>

/* General-purpose background & text color class */
.bg-cshelp {
  background: #8ea2f9;
  color: white;
}

/* Format buttons like we want */
.btn-cshelp {
  border: solid 1px #4f5ab9;
  background: #8ea2f9;
  color: white;
}
.btn-cshelp:hover {
  background: #748bf1;
}

/* Big border in the "cs-help dark" color */
#navbar {
  border-bottom: solid 3px #4f5ab9;
}

/* Otherwise we get a little white bar at the bottom of the tabs */
.nav-tabs {
  border-bottom: none;
}

/* Style all nav tabs */
.nav-tabs .nav-link {
  /* Left corners are curved */
  border-top-left-radius: 1rem;
  border-bottom-left-radius: 1rem;
  /* Right corners are flat */
  border-top-right-radius: 0rem;
  border-bottom-right-radius: 0rem;
  /* Border color is dark */
  border-width: 0px;
}

/* Inactive nav tabs */
.nav-tabs .nav-link:not(.active) {
  /* Text is white */
  color: lightgray;
}
.nav-tabs .nav-link:not(.active):hover {
  /* Change text color of buttons on hover */
  color: white;
  background-color: var(--bs-gray-800);
}

</style>