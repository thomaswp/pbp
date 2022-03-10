import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { library } from "@fortawesome/fontawesome-svg-core";
import { faPencil } from "@fortawesome/free-solid-svg-icons";
import { faArchive } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";


library.add(faPencil);
library.add(faArchive);

createApp(App).use(router)
  .component("font-awesome-icon", FontAwesomeIcon)
  .mount("#app");