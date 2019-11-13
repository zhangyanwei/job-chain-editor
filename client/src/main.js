import './script'
import Vue from 'vue'
import './plugins'
import store from './vuex/store'
import router from './router'
import App from './App.vue'

Vue.config.productionTip = false

new Vue({
  store,
  router,
  render: h => h(App),
}).$mount('#app')
