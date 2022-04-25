<template>

  <!-- Topbar header saying "Welcome to CS Help" -->
  <div class="bg-cshelp border-cshelp-3 py-3" >
    <h1 class="mb-0">Welcome to CS Help</h1>
  </div>

  <!-- div with y-axis margin of "5 scale" - for vertical space -->
  <div class="my-5"></div>

  <!-- Bootstrap Card providing login options -->
  <!-- A card is an element with rounded edges and one or more pieces of internal content.
        id: apply custom styling to this element (specified below)
  -->
  <div id="card-login"
      class="card bg-cshelp border-cshelp-3">
    <!-- Place a header at the top of the card. Set margin-bottom to 0. -->
    <div class="card-header">
      <h3 class="mb-0">Login Options</h3>
    </div>

    <!-- One body tag to contain the federated logins via google. Style applied below. -->
    <div class="card-body">
      <!-- Google Sign In -->
      <!-- a tag will change the img tag's src whenever it is moused over or pressed. -->
      <a
        href="http://localhost:3060/api/v1/login/federated/google"
        @mouseover="ggl_img_sel = 'focus'"
        @mouseleave="ggl_img_sel = 'normal'"
        @click="ggl_img_sel = 'pressed'"
        style="display: block"
        class="mb-4"
      >
        <!-- :src means that src depends on the expression provided
                            here, it'll use a different image from the array
                            based on the value of ggl_img_sel. -->
        <img
          alt="Google Sign In"
          :src="ggl_imgs[ggl_img_sel]"
          width=215 height=50
        />
      </a>

      <!-- Microsoft Sign In -->
      <!-- a tag will change the img tag's src whenever it is moused over or pressed. -->
      <a
        href="http://localhost:3060/api/v1/login/federated/microsoft"
      >
        <!-- :src means that src depends on the expression provided
                            here, it'll use a different image from the array
                            based on the value of ggl_img_sel. -->
        <img
          alt="Microsoft Sign In"
          src="@/assets/ms-symbollockup_signin_light.png"
          width=215 height=41
        />
      </a>

    </div>

    <!-- Another body tag to contain the username login. Style applied below. -->
    <div class="card-body">
      <h5>Username Login</h5>
      <form action="/api/v1/login/local/nopass" method="post">
        <!-- Accept text, bind to v-model, show placeholder text, set id for styling. -->
        <input id="username-login-input"
          type="text"
          name="username"
          v-model="username"
          placeholder="Username"
          class="form-control text-dark" />
        <!-- Clickable button with minimal styling.
              set top, left, and right margin to "level 2", but bottom to 0. Can be any 0-5. -->
        <button
            type="submit"
            class="btn btn-dark m-2 mb-0">
          Sign In
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import axios from "axios"
export default {
  name: "#app",
  data() {
    // Apparently Vue hates me.
    // I'm trying to use a helper function here to take a string like
    // 'normal' and convert it into a call like:
    // require('@/assets/btn_google_signin_dark_normal_web.png')
    // this to save time so I don't have to type out that url 4 times.
    // However, Vue has decided to have none of it:
    //
    // Uncaught (in promise) Error: Cannot find module '@/assets/btn_google_signin_dark_normal_web.png'
    // at webpackEmptyContext (eval at ./src/views sync recursive (app.js:2016:1), <anonymous>:2:10)
    //
    // When I require that exact path manually it works fine.
    // But if I build that path with an arrow function, suddenly it's illegal.
    // I give up. Have your copy-pasted URLs if you so desire.
    function full_img(style) {
      const url = `@/assets/btn_google_signin_light_${style}_web.png`;
      console.log("converted to:             " + url);
      console.log(
        "(for 'normal') should be: " +
          "@/assets/btn_google_signin_dark_normal_web.png"
      );
      return url;
    }
    return {
      // Username for password-less login
      username: "",
      // Change this field to change which google image is selected
      ggl_img_sel: "normal",
      // Load all images on page load, and store them here
      ggl_imgs: {
        disabled: require("@/assets/btn_google_signin_light_disabled_web.png"),
        focus: require("@/assets/btn_google_signin_light_focus_web.png"),
        normal: require("@/assets/btn_google_signin_light_normal_web.png"),
        // 'normal': require(full_img('normal')), // WHY doesn't this work?
        pressed: require("@/assets/btn_google_signin_light_pressed_web.png"),
      },

    };
  },
  methods: {
    beforeCreate() {
      // On page load, check if the user is already logged in
      axios.get("/api/v1/user")
        .then((response) => {
          console.log("Current user:");
          console.log(response.data);
          // If user already logged in
          if(response.data?.name) {
            // Redirect to homepage
            this.$router.push({ path: '/homepage' });
          }
        })
        // If error trying to get currently logged user, complain
        .catch((error) => {
          console.log(error);
        });
    }
  },
};
</script>

<style scoped>

/* set all text on the page to be white, and font to be Abel */
* {
  color:white;
  font-family: Abel;
}

/* setup some general-purpose classes for our own element styling */
.bg-cshelp {
  background-color: #8ea2f9;
}
.border-cshelp-3 {
  border: solid 3px #4f5ab9;
}

/* apply our own styling to the pre-existing card */
#card-login {
  /* responsive sizing */
  min-width: 240px;
  max-width: 30%;
  /* centered */
  margin: auto;
  /* design choice - large corners */
  border-radius: 10px;
}

/* set the username login input field to take up the center half of the card */
#username-login-input {
  max-width: 50%;
  margin: auto;
}

/* if preceded by another card-body, display a top border */
.card-body + .card-body {
  border-top: 1px solid rgba(0, 0, 0, 0.125)
}

/*
  By default, the header will be 3% darker than the body
  which we (currently) don't want.
  By setting bg-color = inherit, we just use the parent's color.
 */
.card-header {
  background-color: inherit;
}

</style>
