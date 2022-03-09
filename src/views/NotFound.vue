<template>
  <div class="NotFound">
    <v-container>
      <v-layout row wrap>
        <v-flex xs12>
          <v-card height="400" color="transparent" flat>
            <div class="display-3 mt-5">404 Page not found.</div>
            <div class="grey--text lighten-5">
              The page you are trying to get to never existed in this reality,
              or has migrated to a parallel universe.
            </div>
            <a class="display-3 mt-5" href="/homepage">Back to Homepage</a>
          </v-card>
        </v-flex>
      </v-layout>
    </v-container>
  </div>
</template>

<style>
.paragraph-text {
  font-size: 18px;
}
.NotFound {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
}
</style>
