import * as types from '../mutation-types'

function mutate(state, message = {target, type, content}) {
  state.message = message
}

const state = {
  message: {}
}

const mutations = {

  [types.CLEAR_MESSAGE] (state) {
    mutate(state, {})
  },

  [types.SHOW_SUCCESS] (state, {target, content}) {
    mutate(state, {target, type: 'success', content})
  },

  [types.SHOW_INFO] (state, {target, content}) {
    mutate(state, {target, type: 'info', content})
  },

  [types.SHOW_WARNING] (_, {target, content}) {
    mutate(state, {target, type: 'warning', content})
  },

  [types.SHOW_ERROR] (_, {target, content}) {
    mutate(state, {target, type: 'error', content})
  }
}

const actions = {
}

const getters = {
    message: state => state.message
}

export default {
  state,
  mutations,
  actions,
  getters
}
