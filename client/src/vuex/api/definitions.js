import axios from 'axios'
import proxy from '@/proxy/ProxyChain'
import CacheProxy from '@/proxy/CacheProxy'

const proxiedAxios = proxy(axios, {CacheProxy})

export default {
  getStepDefinition (id) {
    return proxiedAxios
      .__withAsyncCache(`steps/${id}`)
      .get(`${process.env.VUE_APP_API_BASE}/definitions/steps/${id}`)
  },

  getEventDefinition (id) {
    return proxiedAxios
      .__withAsyncCache(`event-handlers/${id}`)
      .get(`${process.env.VUE_APP_API_BASE}/definitions/event-handlers/${id}`)
  },

  getStepIndices () {
    return proxiedAxios
      .__withAsyncCache(`indices/steps`)
      .get(`${process.env.VUE_APP_API_BASE}/definitions/indices/steps`)
  },

  getEventHandlerIndices () {
    return proxiedAxios
      .__withAsyncCache(`indices/event-handlers`)
      .get(`${process.env.VUE_APP_API_BASE}/definitions/indices/event-handlers`)
  }
}
