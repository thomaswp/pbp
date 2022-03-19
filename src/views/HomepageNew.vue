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
        <div class="navbar-nav me-auto mb-2 mb-lg-0">

          <!-- format like a navbar element, which are usually links -->
          <div class="nav-item nav-link"> <!-- could have class "active" for white fg color -->
            Welcome, {{ user.name }}!
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
  <div class="d-flex align-items-start">
    
    <!-- Tab list on the left -->
    <div class="bg-dark"
        id="tablist-bg" ref="tablist-bg"
        :style="{
            'height': `${tablistHeight}px`,
            'min-height': 'max-content'
        }">
      <div class="nav nav-tabs flex-column" role="tablist"
          id="tablist-tabs" ref="tablist-tabs">
        <button type="button"
            class="btn btn-cshelp m-3">
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
    </div>
    <!-- Tab contents -->
    <div class="tab-content ms-3 mt-3 flex-grow-1" id="myTabContent">

      
      <div class="tab-pane fade show active" id="active_projects" role="tabpanel">
        {{ user.projects }}
      </div>
      
      <div class="tab-pane fade" id="archived_projects" role="tabpanel">
        Tab 2 content
      </div>

    </div>
  </div>

</template>


<script>
import axios from "axios";
export default {

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
    }
  },

  methods: {
    //Method to fetch the currently logged in user
    getLoggedUser() {
      axios
        .get("/api/v1/user")
        .then((response) => {
          this.user = response.data;
          if (!this.user?.name) {
            this.$router.push({ path: "/login" });
          }
        })
        .catch((error) => {
          console.error(error);
          this.$router.push({ path: "/login" });
        });
    },
  },

  mounted() {

    // Get logged in user; redirect to login if not logged in
    this.getLoggedUser();
    
    // Workaround for tablist height
    this.isMounted = true;

    // Add resize listener to make homepage reactive to resize
    window.addEventListener('resize', () => {
      this.windowHeight = window.innerHeight
      console.log(this.windowHeight);
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