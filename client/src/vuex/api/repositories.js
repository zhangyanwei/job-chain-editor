import axios from 'axios'

export default {
  getRepositories (id) {
    return axios.get(`${process.env.VUE_APP_API_BASE}/repositories/${id}`)
  }
}
