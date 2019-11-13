<template>
  <x-codemirror class="x-yaml" v-model="data" @blur="onblur" v-on="listeners" v-bind="attrs" :options="{ mode: 'yaml' }"></x-codemirror>
</template>

<script>
import XCodemirror from './Codemirror.js'
import yaml from 'js-yaml'

require('codemirror/mode/yaml/yaml')

export default {

  name: 'yaml',

  components: {
    XCodemirror
  },

  model: {
    event: 'commit'
  },

  props: {
    value: { required: false }
  },

  inheritAttrs: false,

  data () {
    return {
      data: '',

      // Statuses
      internalChange: false
    }
  },

  computed: {
    listeners() {
      const { blur, ...listeners } = this.$listeners;
      return listeners;
    },
    attrs() {
      const { value, ...attrs } = this.$attrs;
      return attrs;
    },
  },

  watch: {
    value: {
      handler (val) {
        if (!this.internalChange) {
          this.data = val && Object.keys(val).length ? yaml.safeDump(val) : undefined
        }
        this.internalChange = false
      },
      immediate: true
    }
  },

  methods: {
    onblur () {
      this.internalChange = true
      try {
        const value = yaml.safeLoad(this.data.trim())
        this.$emit('commit', value)
      } catch (e) {
        // DO NOTHING! because the error messages will be shown.
      }
      // Always emit the blur event, the outer manipulation may need to do something according to this event.
      this.$emit('blur', ...arguments)
    }
  }

}
</script>
