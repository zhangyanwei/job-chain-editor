import axios from 'axios'

export default {
  getStep (confId, repoId, jobId, stepId) {
    return axios.get(`${process.env.VUE_APP_API_BASE}/steps/${confId}/${repoId}/${jobId}/${stepId}`)
  }
}
