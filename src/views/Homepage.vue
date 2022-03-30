<template>

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
              @open-project="handleOpenProject" />
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
            Save changes
          </button>
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
      assignments: {},
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
      axios.put("/api/v1/projects/" + id + "/name", {name: name})
          .then((response) => {
            this.user.projects[id] = response.data;
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
       axios.put("/api/v1/projects/" + id + '/' + path)
          .then((response) => {
            console.log("(un?)archived project");
            this.user.projects[id] = response.data;
          })
          .catch((error) => {
            console.log(error);
          });
    },

    //Method to fetch the currently logged in user
    getLoggedUser() {
      axios
        .get("/api/v1/user")
        .then((response) => {
          this.user = response.data;
          console.log("User data");
          console.log(this.user.projects);
          if (!this.user?.name) {
            this.$router.push({ path: "/login" });
          }
        })
        .catch((error) => {
          console.error(error);
          this.$router.push({ path: "/login" });
        });
    },

    //
    getAssignments() {
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
    // On cancel, clear the project name input field (otherwise it persists)
    onCancelNewProjectModal() {
      // this.$refs['newProjectNameInput'].value = '';
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

  created() {
    // Get logged in user; redirect to login if not logged in
    this.getLoggedUser();
    // Get assignment list and save it
    this.getAssignments();
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