import axios from 'axios'

export default {
  getConfigurations () {
    return axios.get(`${process.env.VUE_APP_API_BASE}/configurations`)
  },

  updateConfigurations (data) {
    return axios.put(`${process.env.VUE_APP_API_BASE}/configurations`, data)
  },

  getConfiguration (confId) {
    return axios.get(`${process.env.VUE_APP_API_BASE}/configurations/${confId}`)
  }
}
