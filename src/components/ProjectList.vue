<template>
  <table style="width:100%">
    <tr
      v-for="project in projects"
      :key="project.id"
      :id="project.id"
    >
      <td valign="top">
        <div class="project">
          
          <!-- Project name and "open" button -->
          <button
            v-if="!editing_projects[project.id]"
            :id="'lbl_' + project.id"
            :ref="'lbl_' + project.id"
            :class="project.isArchived
                ? 'project-button-off'
                : 'project-button'"
            @click="project.isArchived
                ? 'do nothing'
                : openExistingProject(project.id)"
          >
            {{ project.name }}
          </button>

          <!-- Edit project name functionality -->
          <div
              :id="'editName_' + project.id"
              :ref="'editName_' + project.id"
              v-if="!project.isArchived"
              style="display: inline">
            <input 
                type="text" 
                :id="'editNameInput_' + project.id" 
                :ref="'editNameInput_' + project.id" 
                v-if="editing_projects[project.id]"
                style="padding:20px"
                v-model="project.name"
                @keyup.enter="$emit('editProjName', project.id, project.name)"/>
            <button
                :id="'editNameButton_' + project.id" 
                :ref="'editNameButton_' + project.id" 
                v-if="!editing_projects[project.id]"
                class="editButton curve_edge"
                @click="editProjectName(project.id)">
              <font-awesome-icon icon="pencil" />
            </button>
          </div>

          <!-- Archive/unarchive button -->
          <button
            class="archiveButton curve_edge"
            style="float:right;height:90%;display:block"
            @click="$emit('archiveProject', project.id, !project.isArchived)"
          >
            <font-awesome-icon :icon="project.isArchived
                ? 'box-open'
                : 'archive'" />
          </button>

        </div>
      </td>
    </tr>
  </table>
</template>

<script>
export default {
  props: {
    projects: Array,
  },

  data() {
    return {
      editing_projects: {} /* {
        <id>: false/true
      }*/,
    }
  },

  created() {
    this.projects.forEach(project => {
      this.editing_projects[project.id] = false;
    });
  },

  methods: {
    
    // Start editing project name
    editProjectName(id) {
      this.editing_projects[id] = true;
      // use nextTick because v-if won't update until next render, so focusing wont work yet
      this.$nextTick(() => {
        // Get ref to the html elements for editing
        // note from Melody Griesen:
        // refs in a v-for are automatically sent into an array, so we have to index [0] for each unique id here
        // The alternative here (if it ever breaks again) is to replace:
        // this.$refs[<id>][0]
        // with:
        // document.getElementById(<id>)
        // I just wanted to figure out how refs work and why they were behaving strangely in v-for
        const editNameInput = this.$refs['editNameInput_' + id][0];
        editNameInput.focus(); // TODO: Fix
      })
    },
    // Definitely done editing
    finishEditName(id) {
      this.editing_projects[id] = false;
    }

  }
}
</script>



<style scoped>

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
</style>