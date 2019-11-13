<template>
  <v-container>
    <x-message channel='repositories' class="mt-0"></x-message>
    <v-layout justify-end>
      <v-btn color="primary" class="mr-0" @click="submit">更新</v-btn>
    </v-layout>
    <v-layout justify-space-between>
      <v-flex xs12>
        <v-tabs align-with-title class="elevation-1" color="secondary" dark>
          <v-tab key="events">
            事件
          </v-tab>
          <v-tab-item key="events">
            <x-events ref="events" :value="events"></x-events>
          </v-tab-item>
        </v-tabs>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import XMessage from './Message'
import XEvents from './Events'
import { mapGetters, mapMutations } from 'vuex'

export default {

  name: 'repositories',

  props : [
    'configurationName'
  ],

  components: {
    XMessage,
    XEvents
  },

  computed: {
    ...mapGetters([
      'getObject'
    ]),

    events () {
      const data = this.getObject([this.configurationName, 'repositories'], {})
      return Object.entries(data)
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

    submit () {
      if (this.$refs.events.focusInvalid()) {
        return
      }

      const events = this.$refs.events.data()
      this.update({
        ownerPath: [this.configurationName],
        data: {
          'repositories': {
            value: {
              ...events.reduce((r, item) => {
                r[`_on_${item.id}`] = {
                  name: item.name,
                  args: item.arguments
                }
                return r
              }, {}),
              ...Object.strip(this.getObject([this.configurationName, 'repositories'], {}), key => key.startsWith('_on_'))
            }
          }
        }
      })
      this.showSuccess({target: 'repositories', content: '仓库全局事件更新成功'})
    }
  }

}
</script>
