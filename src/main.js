// these imports must be before the router import
// otherwise, our own css will be overridden with bootstrap css
import 'bootstrap/dist/css/bootstrap.css'
// import 'bootstrap-vue-3/dist/bootstrap-vue-3.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { library } from "@fortawesome/fontawesome-svg-core";
import { faPencil } from "@fortawesome/free-solid-svg-icons";
import { faArchive } from "@fortawesome/free-solid-svg-icons";
import { faHome } from "@fortawesome/free-solid-svg-icons";
import { faBoxOpen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
// import BootstrapVue3 from 'bootstrap-vue-3';// You can specify which plugins you need
// import { Tooltip, Toast, Popover } from 'bootstrap';
import 'bootstrap';




library.add(faPencil);
library.add(faArchive);
library.add(faHome);
library.add(faBoxOpen);

createApp(App)
  .use(router)
  // .use(BootstrapVue3)
  .component("font-awesome-icon", FontAwesomeIcon)
  .mount("#app");