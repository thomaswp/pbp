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

                    <div class="g-signin2 center2" data-onsuccess="onSignIn"></div>

            </div>
            <button onclick="signOut()">Sign Out</button>
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
            return {
                username: ""
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
            }
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

    /*.center {

        justify-content: center;
        align-items: center;
    } */

    body,html {
        margin:0;
        padding:0;
    }

</style>