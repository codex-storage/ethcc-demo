import { createRouter, createWebHistory } from 'vue-router'
import RequestsView from '../views/RequestsView.vue'
import RequestView from '../views/RequestView.vue'
import NotFoundView from '../views/NotFoundView.vue'
import ModerateView from '../views/ModerateView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'requests',
      component: RequestsView
    },
    {
      path: '/request/:requestId?',
      name: 'Request details',
      component: RequestView,
      props: true // pass :requestId to props in RequestView
    },
    {
      path: '/404',
      name: '404 not found',
      component: NotFoundView
    },
    {
      path: '/moderate',
      name: 'Moderate images',
      component: ModerateView
    }
  ]
})

export default router
