<template>
  <div id="nav">
    <router-link to="/login"></router-link>
    <router-link to="/homepage"></router-link>
    <router-link to="/editor"></router-link>
  </div>
  <router-view/>
</template>

<script>

</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  /* margin-top: 60px; */
}
</style>