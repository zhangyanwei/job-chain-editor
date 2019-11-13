import axios from 'axios'

export default {

  getTemplates (id) {
    return axios.get(`${process.env.VUE_APP_API_BASE}/templates/${id}`)
  },

  getTemplate (confId, id) {
    return axios.get(`${process.env.VUE_APP_API_BASE}/templates/${confId}/${id}`)
  }

}
