// this import must be before the router import
// otherwise, our own css will be overridden with bootstrap css
import 'bootstrap/dist/css/bootstrap.css'

// Added to correct full crash "ReferenceError: regeneratorRuntime is not defined"
// https://stackoverflow.com/questions/53558916/babel-7-referenceerror-regeneratorruntime-is-not-defined
import 'core-js/stable'
import 'regenerator-runtime/runtime'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { library } from "@fortawesome/fontawesome-svg-core";
import { faPencil } from "@fortawesome/free-solid-svg-icons";
import { faArchive } from "@fortawesome/free-solid-svg-icons";
import { faHome } from "@fortawesome/free-solid-svg-icons";
import { faBoxOpen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
// import { Tooltip, Toast, Popover } from 'bootstrap';
//import 'bootstrap';

// TODO: fix whatever the "sockjs" errors are in web console


library.add(faPencil);
library.add(faArchive);
library.add(faHome);
library.add(faBoxOpen);

createApp(App)
  .use(router)
  .component("font-awesome-icon", FontAwesomeIcon)
  .mount("#app");