<template>
  <v-card>
    <v-card-title primary-title>
      <span class="headline">基本信息</span>
    </v-card-title>
    <v-card-text>
      <x-message channel='properties'></x-message>
      <v-form ref="form" v-model="valid">
        <v-flex xs12 v-if="hasId">
          <v-text-field
            name="id" label="ID*"
            v-model="shadow.id"
            :rules="rule('id')"
            :disabled="disabled"
            required
          ></v-text-field>
        </v-flex>
        <v-flex xs12 v-if="hasAlias">
          <v-text-field
            name="alias" label="别名"
            v-model="shadow.alias"
            :rules="rule('alias')"
            :disabled="disabled"
          ></v-text-field>
        </v-flex>
        <v-flex xs12>
          <v-text-field
            name="name" label="名称"
            v-model="shadow.name"
            :disabled="disabled"
            :append-outer-icon="templateIcon('name')"
            @click:append-outer="reset('name')"
          ></v-text-field>
        </v-flex>
        <v-flex xs12>
          <v-text-field
            name="description" label="描述"
            v-model="shadow.description"
            :disabled="disabled"
            :append-outer-icon="templateIcon('description')"
            @click:append-outer="reset('description')"
          ></v-text-field>
        </v-flex>
      </v-form>
    </v-card-text>
  </v-card>
</template>

<script>
import XMessage from './Message'
import { mapMutations } from 'vuex'

export default {

  name: 'properties',

  components: {
    XMessage
  },

  props: {
    value: {
      type: Object,
      required: true
    },
    hasId: {
      type: Boolean
    },
    hasAlias: {
      type: Boolean
    },
    disabled: {
      type: Boolean
    },
    rules: {
      type: Object
    }
  },

  data () {
    return {
      fieldRules: {
        id: [
          v => !!v || '请输入ID',
          v => !v || /^(?!_)[\w\-]+$/.test(v) || 'ID格式不正确, 要求格式为 "^(?!_)[\\w\\-]+$"'
        ],
        alias: [
          v => !v || /^(?!_)[\w\-]+$/.test(v) || '别名格式不正确, 要求格式为 "^(?!_)[\\w\\-]+$'
        ]
      },

      valid: false,
      shadow: {}
    }
  },

  computed: {
    template () {
      return Object.findProperty(this.value, 'template', {})
    }
  },

  watch: {
    value: {
      handler (val) {
        const value = Object.findProperty(val, 'data', {})
        this.shadow = {
          ...this.template,
          ...value,
          id: value.id === '_' ? undefined : value.id
        }
      },
      immediate: true
    }
  },

  methods: {

    ...mapMutations ([
      'showError'
    ]),

    templateIcon (attr) {
      if (this.template[attr]) {
        return 'mdi-alpha-i-box-outline'
      }
    },

    reset (attr) {
      this.shadow[attr] = this.template[attr]
    },

    rule (type) {
      const additionals = Object.findProperty(this.rules, type, [])
      return [...this.fieldRules[type] || [], ...additionals]
    },

    validate () {
      // If form not initialized, means nothing changed.
      const form = this.$refs.form
      let valid = !form || form.validate()
      // if (valid && this.rules) {
      //   for (const rule of this.rules) {
      //     const r = rule.call(this, this.data())
      //     if (typeof(r) !== 'boolean') {
      //       this.showError({target: 'properties', content: r})
      //       return false
      //     }
      //   }
      // }
      return valid
    },

    focusInvalid () {
      const valid = this.validate()
      if (!valid) {
        let invalidInput = this.$refs.form.inputs.find(input => !input.valid)
        invalidInput && invalidInput.focus()
      }
      return !valid
    },

    data () {
      return Object.stripTemplate(this.shadow, this.template)
    }
  }

}
</script>

