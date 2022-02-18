<!--
What was not copied/didnt know where to copy:
<meta name="google-signin-client_id" content="970759688569-n9pkl1rdaa3uicbu0p4p4r2e9jafbar1.apps.googleusercontent.com">

^Very important since this is what sets up the google auth button. Not sure where to put this since it was in the head


-->

<template>
    <body>
        <div style="text-align:center;background-color: rgb(214, 239, 255); padding-top: 0.5px; padding-bottom: 0.5px;">
            <h1>Welcome to CS Help</h1>
        </div>
        <div style="padding: 5%;"></div>
        <div class="loginbox" style="border-radius: 10px;">
            <h1 style="text-align: center;">Username</h1>
            <div class="container">
                <input v-model="username" type="text" class="center" style="border-radius: 10px;">
                <div class="center">
                    <button @click="signin()" style="margin-left: auto;margin-right: auto;width: 100px;">Sign In</button>
                </div>
            </div>
            <div id="content"></div>
            <hr>
            <div class="container">

                <div class="center">
                    <!-- a tag will change the img tag's src whenever it is moused over or pressed. -->
                    <a href="http://localhost:3060/api/v1/login/federated/google"
                        @mouseover="ggl_img_sel = 'focus'" @mouseleave="ggl_img_sel = 'normal'"
                        @click="ggl_img_sel = 'pressed'"
                    >
                        <!-- :src means that src depends on the expression provided
                                here, it'll use a different image from the array
                                based on the value of ggl_img_sel. -->
                        <img alt="Google Sign In" :src="ggl_imgs[ggl_img_sel]">
                    </a>
                </div>

            </div>
            <!-- <button onclick="signOut()">Sign Out</button> -->
        </div>

    </body>

</template>

<script>

    
    // function signin() {
    //     this.$router.push({ path: '/homepage' });
    //     console.log("logging in");
    // }
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
                console.log("(for 'normal') should be: " + '@/assets/btn_google_signin_dark_normal_web.png');
                return url;
            }
            return {
                username: "",
                // Change this field to change which google image is selected
                ggl_img_sel: 'normal',
                // Load all images on page load, and store them here
                ggl_imgs: {
                    'disabled': require('@/assets/btn_google_signin_dark_disabled_web.png'),
                    'focus': require('@/assets/btn_google_signin_dark_focus_web.png'),
                    'normal': require('@/assets/btn_google_signin_dark_normal_web.png'),
                    // 'normal': require(full_img('normal')), // WHY doesn't this work?
                    'pressed': require('@/assets/btn_google_signin_dark_pressed_web.png'),
                }
            }
        },
        methods: {
            signin() {
                this.$router.push({ path: '/homepage' });
                console.log(this.username);
                console.log("WHY");
                axios.post('http://localhost:3060/api/v1/username', {
                    username: this.username
                })
                .then(function (response) {
                    console.log(response);
                })
                .catch(function (error) {
                    console.log(error);
                });
            },
            gogolesignin() {
                // headers.append('Access-Control-Allow-Origin', 'http://localhost:3000');
                // headers.append('Access-Control-Allow-Credentials', 'true');
                let headers = new Headers();
                headers.append('Access-Control-Allow-Origin', 'http://localhost:3060');
                headers.append('Access-Control-Allow-Credentials', 'true');
                headers.append('Content-Type', 'application/json');
                headers.append('Accept', 'application/json');
                // headers.append('Authorization', 'Basic ' + base64.encode(username + ":" +  password));
                headers.append('Origin','http://localhost:3060');


                console.log("google sign in button clicked");
                axios.get("http://localhost:3060/api/v1/login/federated/google", {
                    mode: 'no-cors',
                    credentials: 'include',
                    method: 'GET',
                    headers: headers,
                    Origin: 'http://localhost:3060'

                })
                .then(function (response) {
                    console.log(response);
                })
                .catch(function (error) {
                    console.log(error);
                });
            }
        },
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
    };

    
       
    


    // src="https://unpkg.com/axios/dist/axios.min.js"
    // function onSignIn(googleUser) {
    //     console.log('User is ' + JSON.stringify(googleUser.getBasicProfile()));

    //     document.querySelector('#content').innerText = googleUser.getBasicProfile().getGivenName();
    //     var email = googleUser.getBasicProfile().getEmail();
    //     console.log(email);

         //var data = {mail: email};
         // var datajson = JSON.parse(JSON.stringify(data));

         // const xhttp = new XMLHttpRequest();
         // xhttp.open("POST", "http://localhost:8000/email", false);
         // console.log(data);
         // xhttp.setRequestHeader("Content-Type", "application/text");
         // xhttp.send("test");

         //const axios = require('axios').default;
         //import * as axios from 'axios';


    //     axios.post('http://localhost:8000/email', {
    //         mail: email
    //     })
    //     .then(function (response) {
    //         console.log(response);
    //     })
    //     .catch(function (error) {
    //         console.log(error);
    //     });

    // }

    // function signOut() {
    //     gapi.auth2.getAuthInstance().signOut().then(function() {
    //         document.querySelector('#content').innerText = "";
    //         console.log('user singed out');
    //     });
    // }
</script>

<style>
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

    .loginbox{
        margin: auto;
        width: 50%;
        background-color: rgb(214, 239, 255);
        padding: 10px;
    }

    h1 {
        font-family: Abel;
    }

    #username {
        width: 50%;
    }

    .container {
        position: relative;
    }

    .center {

        justify-content: center;
        align-items: center;
    }

    body,html {
        margin:0;
        padding:0;
    }

</style>
