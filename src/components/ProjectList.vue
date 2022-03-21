<template>
  <table style="width:100%">
    <tr
      v-for="(project, project_id) in internal_projects"
      :key="project_id"
      :id="project_id"
    >
      <td valign="top">
        <div class="project">
          
          <!-- Project name and "open" button -->
          <button
            v-if="!project.isNameEditorActive"
            :id="'lbl_' + project_id"
            :ref="'lbl_' + project_id"
            :class="project.isArchived
                ? 'project-button-off'
                : 'project-button'"
            @click="project.isArchived
                ? 'do nothing'
                : $emit('openProject', project_id)"
          >
            {{ project.name }}
          </button>

          <!-- Edit project name functionality -->
          <div
              :id="'editName_' + project_id"
              :ref="'editName_' + project_id"
              v-if="!project.isArchived"
              style="display: inline">
            <input 
                type="text" 
                :id="'editNameInput_' + project_id" 
                :ref="'editNameInput_' + project_id" 
                v-if="project.isNameEditorActive"
                style="padding:20px"
                v-model="project.name"
                @keyup.enter="$emit('editProjectName', project_id, project.name)"
                @keyup.esc="resetEditing(project_id)"/>
            <button
                :id="'editNameButton_' + project_id" 
                :ref="'editNameButton_' + project_id" 
                v-if="!project.isNameEditorActive"
                class="editButton curve_edge"
                @click="editProjectName(project_id)">
              <font-awesome-icon icon="pencil" />
            </button>
          </div>

          <!-- Archive/unarchive button -->
          <button
            class="archiveButton curve_edge"
            style="float:right;height:90%;display:block"
            @click="$emit('archiveProject', project_id, !project.isArchived)"
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
  emits: [
    'openProject',
    'editProjectName',
    'archiveProject',
  ],

  data() {
    return {
      // Map of project ids to objects. Copied from input_projects
      internal_projects: {/*
        <id>: {
          name: String,
          isArchived: Boolean,
          oldName: String, // before starting editing
          nameEditorActive: Boolean, // true if the user is editing the name rn
        }, 
        ... */
      },
    }
  },

  methods: {
    
    // Start editing project name
    editProjectName(id) {
      const proj = this.internal_projects[id]
      proj.isNameEditorActive = true;
      proj.oldName = proj.name;
      
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
        editNameInput.focus();
      })
    },
    // Definitely done editing
    finishEditName(id) {
      this.internal_projects[id].isNameEditorActive = false;
    },
    // Reset without saving changes
    resetEditing(id) {
      this.internal_projects[id].name = this.internal_projects[id].oldName;
      this.internal_projects[id].isNameEditorActive = false;
    },

  },

  watch: {
    // Whenever input projects updates (filter, search, etc.), copy the changes into our own data
    projects: {
      immediate: true, // immediately process the projects on creation
      handler(new_input_projects , old_input_projects) { // watch it
        // Get copy of old projects
        const old_projects = this.internal_projects;

        // Replace with new projects
        // Create new empty map
        this.internal_projects = {};
        // Loop over input projects
        for (const proj_id in new_input_projects) {
          const input_proj = new_input_projects[proj_id];
          // For each, create an entry
          this.internal_projects[proj_id] = {
            // Copy over project data
            ...input_proj, // spread operator for a semi-deep copy down to this level
            // and add our own data for this ProjectList component
            isNameEditorActive: false,
            oldName: input_proj.name,
          }
        }
        
        // If we were editing any old projects, copy over the editor settings there
        for (const old_proj_id in old_projects) {
          const old_proj = old_projects[old_proj_id];
          // if project still exists in new props and editor was active
          if (this.internal_projects[old_proj_id] && old_proj.isNameEditorActive) {
            // copy over active editor and temporary name
            this.internal_projects[old_proj_id].isNameEditorActive = true;
            this.internal_projects[old_proj_id].name = old_proj.name;
          }
        }
      },
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