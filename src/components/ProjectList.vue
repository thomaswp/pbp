<template>

  <!-- One card per project -->
  <div class="card card-cshelp mb-3"
      v-for="(project, project_id) in internal_projects"
      :key="project_id"
      :id="'card_' + project_id">
    <div class="d-flex align-items-center">
      <!-- TODO: make project name button & project name input the same element -->
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
            class="edit-name-input"
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
      <div v-if="project.isAssignmentCopy" style="padding:20px;color:gray;font-size:12px">Assignment Copy</div>
      <div v-if="project.isAssignment" style="padding:20px;color:gray;font-size:12px">Assignment Template</div>

      <!-- Archive/unarchive button -->
      <button
        class="archiveButton curve_edge ms-auto me-3"
        @click="$emit('archiveProject', project_id, !project.isArchived)"
      >
        <font-awesome-icon :icon="project.isArchived
            ? 'box-open'
            : 'archive'" />
      </button>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    projects: Object,
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
        console.log("in ProjectList, handle update to projects:")
        console.log(new_input_projects);

        

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


        console.log("final transformed internal_projects:");
        console.log(this.internal_projects);
      },
    }
  }
}
</script>



<style scoped>

/* TODO: style "project from assignment" different from "project from blank" */


.card-cshelp {
  border: solid 3px #4f5ab9;
  border-radius: 10px;
}

.edit-name-input {
  font-size: 35px;
  margin: 13px;
  margin-left: 17px
}

.project-button {
  font-size: 35px;
  border: transparent;
  background: inherit;
  margin: 15px;
  text-align: left;
}

.project-button-off {
  font-size: 35px;
  border: transparent;
  background: inherit;
  padding: 15px;
  text-align: left;
}

.project-button:hover {
  color: darkgray
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