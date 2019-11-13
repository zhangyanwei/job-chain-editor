<template>
  <v-container>
    <x-message channel='job' class="mt-0"></x-message>
    <v-layout justify-end>
      <v-btn color="primary" class="mr-0" @click="submit">更新</v-btn>
    </v-layout>
    <v-layout justify-space-between>
      <v-flex xs12>
        <v-tabs align-with-title v-model="active" class="elevation-1" color="secondary" dark>
          <v-tab key="properties">
            属性
          </v-tab>
          <v-tab key="events">
            事件
          </v-tab>
          <v-tab-item key="properties">
            <x-properties ref="properties" has-id :value="properties" :rules="rules.properties"></x-properties>
          </v-tab-item>
          <v-tab-item key="events">
            <x-events ref="events" :value="events"></x-events>
          </v-tab-item>
        </v-tabs>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import XProperties from './Properties'
import XEvents from './Events'
import XMessage from './Message'
import services from '../vuex/api'
import { mapGetters, mapMutations } from 'vuex'

export default {

  name: 'job',

  props : [
    'configurationName',
    'repositoryName',
    'jobName'
  ],

  components: {
    XProperties,
    XEvents,
    XMessage
  },

  data () {
    return {
      rules: {
        properties: {
          id: [
            v => this.jobName == v || !this.getObject([this.configurationName, 'repositories', this.repositoryName, v]) || '存在同名任务集！'
          ]
        }
      },

      active: 0
    }
  },

  computed: {
    ...mapGetters([
      'getObject'
    ]),

    job () {
      return this.getObject([this.configurationName, 'repositories', this.repositoryName, this.jobName], {})
    },

    properties () {
      return {
        data: {
          id: this.jobName,
          name: this.job._name,
          description: this.job._description
        }
      }
    },

    events () {
      return Object.entries(this.job)
        .filter(([name]) => name.startsWith('_on_'))
        .map(([name, value]) => {
          return {
            id: name.substring('_on_'.length),
            name: value.name,
            arguments: value.args
          }
        })
    }
  },

  methods: {

    ...mapMutations ([
      'update',
      'showSuccess'
    ]),

    submit (data) {

      if (this.$refs.properties.focusInvalid()) {
        this.active = 0
        return
      }

      if (this.$refs.events.focusInvalid()) {
        this.active = 1
        return
      }

      const properties = this.$refs.properties.data()
      const events = this.$refs.events.data()
      this.update({
        ownerPath: [this.configurationName, 'repositories', this.repositoryName],
        data: {
          [this.jobName]: {
            newKey: properties.id,
            value: {
              _name: properties.name,
              _description: properties.description,
              ...events.reduce((r, event) => {
                r[`_on_${event.id}`] = {
                  name: event.name,
                  args: event.arguments
                }
                return r
              }, {}),
              ...Object.strip(this.job, key => key.startsWith('_'))
            }
          }
        }
      })
      this.showSuccess({target: 'job', content: '更新成功'})
    }
  }
}
</script>

