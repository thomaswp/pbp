<!--
What was not copied/didnt know where to copy:
<meta name="google-signin-client_id" content="970759688569-n9pkl1rdaa3uicbu0p4p4r2e9jafbar1.apps.googleusercontent.com">

^Very important since this is what sets up the google auth button. Not sure where to put this since it was in the head


-->

<template>
  <body>
    <div
      class="login_topbar"
      style="text-align:center;padding-top: 0.5px; padding-bottom: 0.5px;color:white"
    >
      <h1>Welcome to CS Help</h1>
    </div>
    <div style="padding: 3%;"></div>
    <div class="loginbox" style="border-radius: 10px;">
      <h1 style="text-align: center;color:white">Login Options</h1>
      <hr />
      <div style="height:10px;"></div>
      <div class="container">
        <div class="center">
          <!-- a tag will change the img tag's src whenever it is moused over or pressed. -->
          <a
            href="http://localhost:3060/api/v1/login/federated/google"
            @mouseover="ggl_img_sel = 'focus'"
            @mouseleave="ggl_img_sel = 'normal'"
            @click="ggl_img_sel = 'pressed'"
          >
            <!-- :src means that src depends on the expression provided
                                here, it'll use a different image from the array
                                based on the value of ggl_img_sel. -->
            <img
              class="border curve_edge"
              alt="Google Sign In"
              :src="ggl_imgs[ggl_img_sel]"
            />
          </a>
        </div>
      </div>
      <hr />
      <div style="height:15px;"></div>
      <div style="height:35px;font-size:20px;color:white">Username Login</div>
      <!-- <button onclick="signOut()">Sign Out</button> -->
      <div class="container">
        <input
          v-model="username"
          type="text"
          class="center"
          style="border-radius: 10px;"
        />
        <div class="center">
          <button
            @click="signin()"
            class="login_button curve_edge"
            style="margin-left: auto;margin-right: auto;width: 100px;"
          >
            Sign In
          </button>
        </div>
      </div>
      <div id="content"></div>
    </div>
  </body>
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
      const url = `@/assets/btn_google_signin_dark_${style}_web.png`;
      console.log("converted to:             " + url);
      console.log(
        "(for 'normal') should be: " +
          "@/assets/btn_google_signin_dark_normal_web.png"
      );
      return url;
    }
    return {
      username: "",
      // Change this field to change which google image is selected
      ggl_img_sel: "normal",
      // Load all images on page load, and store them here
      ggl_imgs: {
        disabled: require("@/assets/btn_google_signin_dark_disabled_web.png"),
        focus: require("@/assets/btn_google_signin_dark_focus_web.png"),
        normal: require("@/assets/btn_google_signin_dark_normal_web.png"),
        // 'normal': require(full_img('normal')), // WHY doesn't this work?
        pressed: require("@/assets/btn_google_signin_dark_pressed_web.png"),
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
.center {
  margin-left: auto;
  margin-right: auto;
  width: 50%;
  padding: 10px;
  display: flex;
}
.center2 {
  margin-left: auto;
  margin-right: auto;
  justify-content: center;
  padding: 10px;
  display: flex;
}

.loginbox {
  margin: auto;
  width: 30%;
  height: 350px;
  background-color: #8ea2f9;
  padding: 10px;
  border: solid 3px #4f5ab9;
}

h1 {
  font-family: Abel;
}

#username {
  width: 40%;
}

.container {
  position: relative;
}

body,
html {
  margin: 0;
  padding: 0;
}

.curve_edge {
  border-radius: 10px;
}
.login_button {
  background: #1f1f1f;
  color: white;
  padding: 10px;
}

.login_button:hover {
  font-weight: bold;
}

.border {
  border: 3px solid #1f1f1f;
}

.login_topbar {
  border: solid 3px #4f5ab9;
  width: 100%;
  height: 85px;
  background-color: #8ea2f9;
}
</style>
