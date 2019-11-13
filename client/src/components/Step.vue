<template>
  <v-container>
    <x-message channel='step' class="mt-0"></x-message>
    <v-layout justify-end>
      <v-btn color="primary" class="mr-0" @click="submit">更新</v-btn>
    </v-layout>
    <v-layout>
      <v-flex xs12>
        <v-tabs align-with-title v-model="active" class="elevation-1" color="secondary" dark>
          <v-tab key="properties">
            属性
          </v-tab>
          <v-tab key="parameters">
            参数
          </v-tab>
          <v-tab key="events">
            事件
          </v-tab>
          <v-tab-item key="properties">
            <x-properties ref="properties" has-alias :value="properties" :rules="rules.properties"></x-properties>
          </v-tab-item>
          <v-tab-item key="parameters">
            <v-flex>
              <x-parameters ref="parameters" has-template :value="parameters"></x-parameters>
            </v-flex>
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
import XParameters from './Parameters'
import XEvents from './Events'
import XMessage from './Message'
import services from '../vuex/api'
import { mapGetters, mapMutations } from 'vuex'

export default {

  name: 'step',

  props : [
    'configurationName',
    'repositoryName',
    'jobName',
    'stepName'
  ],

  components: {
    XProperties,
    XParameters,
    XEvents,
    XMessage
  },

  data () {
    return {
      rules: {
        properties: {
          alias: [
            v => this.alias == v || !this.job[[this.stepId, v].filter(item => !!item).join('.')] || '存在同名任务！'
          ]
        }
      },

      // The yaml component in parameters view may not show the code if we set the active default to 0,
      // for this bug, maybe just refresh the editor of codemirror will resolve it.
      // but I do not want to do it, only if I met another reason to fix it.
      active: 1,
      parameters: {}
    }
  },

  computed: {
    ...mapGetters([
      'getObject'
    ]),

    stepId () {
      return this.stepName.split('.')[0]
    },

    alias () {
      return this.stepName.split('.')[1]
    },

    job () {
      return this.getObject([this.configurationName, 'repositories', this.repositoryName, this.jobName], {})
    },

    step () {
      return this.job[this.stepName] || {}
    },

    properties () {
      return {
        data: {
          alias: this.alias,
          name: this.step._name,
          description: this.step._description
        }
      }
    },

    events () {
      return Object.entries(this.step)
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

    async initParameters () {
      const template = this.getObject([this.configurationName, 'template', this.stepName], {})
      const definitionResp = await services.definitions.getStepDefinition(this.stepId)
      this.parameters = {
        definition: definitionResp.data,
        template: template,
        data: Object.strip(this.step, key => key.startsWith('_'))
      }
    },

    newStepId (alias) {
      if (alias) {
        return this.stepId + '.' + alias
      }
      return this.stepId
    },

    submit () {
      if (this.$refs.properties.focusInvalid()) {
        this.active = 0
        return
      }
      if (this.$refs.parameters.focusInvalid()) {
        this.active = 1
        return
      }
      if (this.$refs.events.focusInvalid()) {
        this.active = 2
        return
      }

      const properties = this.$refs.properties.data()

      // Check the template if the step id was modified.
      const newStepName = this.newStepId(properties.alias)
      const template = this.getObject([this.configurationName, 'template', newStepName])

      const parameters = this.$refs.parameters.data(!template)
      const events = this.$refs.events.data()
      this.update({
        ownerPath: [this.configurationName, 'repositories', this.repositoryName, this.jobName],
        data: {
          [this.stepName]: {
            newKey: newStepName,
            value: {
              ...this.step,
              ...parameters,
              _name: properties.name,
              _description: properties.description,
              ...events.reduce((r, event) => {
                r[`_on_${event.id}`] = {
                  name: event.name,
                  args: event.arguments
                }
                return r
              }, {})
            }
          }
        }
      })
      this.showSuccess({target: 'step', content: '步骤更新成功'})
    }
  },

  created () {
    this.$watch(
      vm => (vm.step),
      () => {
        this.initParameters()
      },
      {
        immediate: true
      }
    )
  }
}
</script>

