import axios from 'axios'

export default {

  getVariables (id) {
    return axios.get(`${process.env.VUE_APP_API_BASE}/variables/${id}`)
  }

}
