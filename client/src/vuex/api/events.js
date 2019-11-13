import axios from 'axios'

export default {

  getGlobalEvents (confId) {
    return axios.get(`${process.env.VUE_APP_API_BASE}/events/${confId}`)
  },

  getRepositoryEvents (confId, repoId) {
    return axios.get(`${process.env.VUE_APP_API_BASE}/events/${confId}/${repoId}`)
  },

  getJobEvents (confId, repoId, jobId) {
    return axios.get(`${process.env.VUE_APP_API_BASE}/events/${confId}/${repoId}/${jobId}`)
  },

  getStepEvents (confId, repoId, jobId, stepId) {
    return axios.get(`${process.env.VUE_APP_API_BASE}/events/${confId}/${repoId}/${jobId}/${stepId}`)
  }

}
