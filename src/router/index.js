import { createRouter, createWebHistory } from 'vue-router'
import RequestsView from '../views/RequestsView.vue'
import RequestView from '../views/RequestView.vue'
import NotFoundView from '../views/NotFoundView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'requests',
      component: RequestsView
    },
    {
      path: '/slots',
      name: 'slots',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/SlotsView.vue')
    },
    {
      path: '/request/:requestId',
      name: 'request',
      component: RequestView,
      props: true // pass :requestId to props in RequestView
    },
    {
      path: '/404',
      name: 'NotFound',
      component: NotFoundView
    }
  ]
})

export default router
