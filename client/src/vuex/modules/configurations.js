import * as types from '../mutation-types'
import services from '../api'
import Vue from 'vue'

function asPaths(key) {
  return Array.isArray(key) ? key : key.split('/').slice(1)
}

function reassign(obj, k, v) {
  delete obj[k]
  obj[k] = v
}

function stripUndefined(value, defaultValue) {
  return value ? Object.stripUndefined(value) : defaultValue
}

const state = {
  $configurations: [],
  // [confId]: configuration,
  // $lastupdate: {},
  $updatedConfIds: new Set()
}

const mutations = {

  [types.GET_CONFIGURATIONS] (state, [data]) {
    state.$configurations = data
  },

  [types.GET_CONFIGURATION] (state, [confId, configuration]) {
    Vue.set(state, confId, configuration)
  },

  [types.UPDATE] (state, {ownerPath, /** {key: {newKey, value, position}, ...} */data, action}) {
    // To ensure that object references are not accidentally replaced, update the nested properties.
    const owner = Object.findProperty(state, ownerPath)

    // Incremental update the owner.
    Object.entries(owner)
      .forEach(([k, v]) => {
        const d = data[k]
        if (d) {
          switch (d.position) {
            case 'before':
              Vue.set(owner, d.newKey, stripUndefined(d.value, {}))
              reassign(owner, k, v)
              break
            case 'after':
              reassign(owner, k, v)
              Vue.set(owner, d.newKey, stripUndefined(d.value, {}))
              break
            default:
              // Delete it if no value specified, it means delete.
              (d.newKey || !d.value) && Vue.delete(owner, k)
              d.value && Vue.set(owner, d.newKey || k, stripUndefined(d.value))
          }
        } else {
          // Just for keeping the order of properties.
          reassign(owner, k, v)
        }
      })

    // Check the new properties which under the empty string key.
    Object.entries(data)
      .filter(([k, _]) => !k)
      .forEach(([_, d]) => Vue.set(owner, d.newKey, stripUndefined(d.value, {})))

    const confIds = ownerPath.length > 0 ? ownerPath.slice(0, 1) : Object.keys(data)
    confIds.forEach(confId => state.$updatedConfIds.add(confId))
    // This is an event object.
    // I've met an unexpected issue sometimes (ex: delete the configurations) 
    // that the updations after `$lastupdate` has been initialized will not trigger any event.
    // So delete it first as a workaround.
    Vue.delete(state, '$lastupdate')
    Vue.set(state, '$lastupdate', {ownerPath, data, action})
  }

}

const actions = {

  getConfigurations({ commit }) {
    return services.configurations.getConfigurations().then(resp => {
      commit(types.GET_CONFIGURATIONS, [resp.data])
      return resp
    })
  },

  getConfiguration({ commit }, [confId]) {
    return services.configurations.getConfiguration(confId).then(resp => {
      commit(types.GET_CONFIGURATION, [confId, resp.data])
      return resp
    })
  },

  saveConfigurations({ state }) {
    const data = Array.from(state.$updatedConfIds).reduce((r, confId) => {
      // In JSON, the undefined means not exists, but the null means null value.
      r[confId] = state[confId] || null
      return r
    }, {})
    return services.configurations.updateConfigurations(data)
  }
}

const getters = {

  configurations: state => state.$configurations,

  getObject: state => (key, defaultValue) => {
    const paths = asPaths(key)
    return Object.findProperty(state[paths[0]], paths.slice(1), defaultValue)
  },

  lastupdate: state => state.$lastupdate
}

export default {
  state,
  mutations,
  actions,
  getters
}
