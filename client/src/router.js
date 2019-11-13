import Vue from 'vue'
import Router from 'vue-router'
import Intro from './components/Intro'
import Variables from './components/Variables'
import Templates from './components/Templates'
import Repositories from './components/Repositories'
import Repository from './components/Repository'
import Job from './components/Job'
import Step from './components/Step'
import X404 from './components/404'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'intro',
      component: Intro
    },
    {
      path: '/404',
      component: X404
    },
    {
      path: '/:configurationName',
      name: 'configurations',
      component: Intro
    },
    {
      path: '/:configurationName/variables',
      name: 'variables',
      component: Variables,
      props: true
    },
    {
      path: '/:configurationName/templates',
      name: 'templates',
      component: Templates,
      props: true
    },
    {
      path: '/:configurationName/repositories',
      name: 'repositories',
      component: Repositories,
      props: true
    },
    {
      path: '/:configurationName/repositories/:repositoryName',
      name: 'repository',
      component: Repository,
      props: true
    },
    {
      path: '/:configurationName/repositories/:repositoryName/:jobName',
      name: 'job',
      component: Job,
      props: true
    },
    {
      path: '/:configurationName/repositories/:repositoryName/:jobName/:stepName',
      name: 'step_instance',
      component: Step,
      props: true
    },
    {
      path: '*',
      redirect: '/404'
    }
  ]
});
