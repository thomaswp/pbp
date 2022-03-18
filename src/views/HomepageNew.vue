<template>

  <!-- Setup navbar across the top -->
  <nav class="navbar navbar-expand-md navbar-dark bg-cshelp" id="navbar">
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
        <div class="navbar-nav me-auto mb-2 mb-lg-0">

          <!-- format like a navbar element, which are usually links -->
          <div class="nav-item nav-link"> <!-- could have class "active" for white fg color -->
            Welcome, {{ user_id }}!
          </div>
          

        </div>

        <!-- Right-aligned button (bc fo me-auto above) -->
        <div class="d-flex">
          <button
              class="btn btn-primary me-3"
              @click="$router.push({ path: '/homepage'})"
              >
            To Old Homepage
          </button>
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
  <!-- Tab list -->
  <div class="d-flex align-items-start h-100">
    <div class="nav nav-tabs flex-column me-3 bg-dark h-100" id="myTab" role="tablist">
      <button type="button"
          class="btn btn-cshelp border-cshelp-1 m-3">
        Blank Project
      </button>

      <button
          class="nav-link active ms-2 p-3 pe-0 mb-1" id="home-tab"
          data-bs-toggle="tab" data-bs-target="#active_projects"
          type="button" role="tab">
        Active Projects
      </button>
      <button
          class="nav-link ms-2 p-3 pe-0 mb-1" id="profile-tab"
          data-bs-toggle="tab" data-bs-target="#archived_projects"
          type="button" role="tab">
        Archived Projects
      </button>
    </div>
    <!-- Tab contents -->
    <div class="tab-content" id="myTabContent">


      <div class="tab-pane fade show active" id="active_projects" role="tabpanel">
        Tab 1 content
      </div>
      
      <div class="tab-pane fade" id="archived_projects" role="tabpanel">
        Tab 2 content
      </div>

    </div>
  </div>



</template>


<script>
export default {
    
}
</script>


<style scoped>

html, body, #app {
  height: 100vh;
  background-color: red;
}

.bg-cshelp {
  background: #8ea2f9;
  color: white;
}

.border-cshelp-1 {
  border: solid 1px #4f5ab9;
}

.btn-cshelp {
  border: solid 1px #4f5ab9;
  background: #8ea2f9;
  color: white;
}
.btn-cshelp:hover {
  background: #748bf1;
}

#navbar {
  border-bottom: solid 3px #4f5ab9;
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