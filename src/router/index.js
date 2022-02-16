import {createRouter, createWebHistory} from 'vue-router'
import Homepage from '../views/homepage.vue'
import Editor from '../components/Editor.vue'
import Login from '../views/login.vue'

const routes = [
    {path: '/login', name: 'Login', component: Login},
    {path: '/homepage', name: 'Home', component: Homepage},
    {path: '/editor', name: 'Editor', component: Editor}
]

const router = createRouter({history: createWebHistory(process.env.BASE_URL), routes})



export default router