<template>
  <v-alert
    :value="visible"
    :type="message.type"
    transition="scale-transition"
  >
    {{message.content}}
  </v-alert>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'

export default {

  name: 'message',

  props: {
    channel: {
      required: true
    },
    timeout: {
      type: Number,
      default: 5,
      validator (value) {
        return value > 0
      }
    }
  },

  computed: {
    ...mapGetters([
      'message'
    ]),

    visible () {
      return this.message.target == this.channel
    }
  },

  watch: {
    visible (val) {
      val && setTimeout(() => {
        this.clearMessage()
      }, this.timeout * 1000)
    }
  },

  methods: {
    ...mapMutations([
      'clearMessage'
    ])
  }
}
</script>
