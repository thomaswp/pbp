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

<style> /* not scoped: global */
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  /* margin-top: 60px; */
}

/* Chrome defaults to 8px margin.
Bootstrap sets this to 0, but w/o Bootstrap, we gotta do it ourselves */
body {
  margin: 0px
}
</style>