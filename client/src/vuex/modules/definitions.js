import * as types from '../mutation-types'
import services from '../api'

function toArray (definitions) {
  return Object.entries(definitions).map(([name, value]) => {
    return {
      id: name,
      name: value.name
    }
  })
}

const state = {
  indices: {
    step: [],
    eventHandler: []
  }
}

const mutations = {
  [types.GET_STEP_INDICES](state, indices) {
    state.indices.step = indices
  },

  [types.GET_EVENT_HANDLER_INDICES](state, indices) {
    state.indices.eventHandler = indices
  }
}

const actions = {
  getStepIndices({ commit }) {
    return services.definitions.getStepIndices().then(resp => {
      commit(types.GET_STEP_INDICES, resp.data)
      return resp
    })
  },

  getEventHandlerIndices({ commit }) {
    return services.definitions.getEventHandlerIndices().then(resp => {
      commit(types.GET_EVENT_HANDLER_INDICES, resp.data)
      return resp
    })
  }
}

const getters = {

  stepIndices: state => state.indices.step,

  eventIndices: state => state.indices.eventHandler,

  stepIndex: state => stepId => {
    return state.indices.step.find(item => item.id == stepId)
  }
}

export default {
  state,
  mutations,
  actions,
  getters
}
