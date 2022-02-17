import {createRouter, createWebHistory} from 'vue-router'
import Homepage from '../views/Homepage.vue'
import ComboEditor from '../views/ComboEditor.vue'
import Login from '../views/Login.vue'
import NotFound from '../views/NotFound.vue'


const routes = [
    // Pages
    {
        path: '/login',
        name: 'Login',
        component: Login
    },
    {
        path: '/homepage',
        name: 'Home',
        component: Homepage
    },
    {
        path: '/editor',
        name: 'Editor',
        component: ComboEditor
    },
    // Utility
    // Default route
    {
        // TODO: later on, we probably want to default to the editor instead
        path: '/',
        redirect: '/homepage'
    },
    // Not found
    {
        path: '/:catchAll(.*)',
        name: 'NotFound', component: NotFound
    }
]

const router = createRouter({history: createWebHistory(process.env.BASE_URL), routes})



export default router