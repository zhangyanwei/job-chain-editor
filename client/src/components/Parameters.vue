<template>
  <v-card>
    <v-card-title primary-title>
      <span class="headline">参数</span>
    </v-card-title>
    <v-card-text>
      <v-form ref="form" v-model="valid">
        <v-layout wrap>
          <v-flex xs12 v-if="parameters.length == 0">
            <v-alert :value="true" type="warning" class="mb-4">
              无法加载组件信息, 请以 YAML 格式编辑。 此模式下, 来自于模板下的参数配置将显示在最下方(如果有的话)。
            </v-alert>
            <x-yaml
              label="配置信息"
              hint="使用 YAML 格式编辑配置信息"
              v-model="shadow"
              :rules="rules.yaml"
              :disabled="disabled"
            >
            </x-yaml>
            <x-yaml
              v-if="hasTemplate && Object.keys(template).length"
              label="来自于模板的配置信息"
              class="x-disabled-yaml"
              disabled
              :value="template"
            >
            </x-yaml>
          </v-flex>
          <v-flex xs12
            v-for="parameter in parameters"
            :key="parameter.id"
          >
            <component
              v-model="shadow[parameter.id]"
              :is="dynamicComponent(parameter.type)"
              :label="parameterLabel(parameter)"
              :hint="parameter.description"
              :rules="validateRules(parameter)"
              :disabled="disabled"
              :append-outer-icon="templateIcon(parameter.id)"
              @click:append-outer="resetParameter(parameter.id)"
            >
            </component>
          </v-flex>
        </v-layout>
      </v-form>
    </v-card-text>
  </v-card>
</template>

<script>
import { validators } from '@/common/Validators'
import { VTextField, VCheckbox } from 'vuetify/lib'
import XYaml from './Yaml'

export default {

  name: 'parameters',

  props : {
    value: {
      type: Object,
      required: true
    },
    hasTemplate: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean
    },
    optional: {
      type: Boolean,
      default: false
    }
  },

  components: {
    VTextField,
    VCheckbox,
    XYaml
  },

  data () {
    return {
      rules: {
        yaml: [
          v => !v || !v.trim() || validators.yaml(v) || 'YAML 格式不正确。'
        ]
      },

      valid: false,

      component: {
        'text': 'v-text-field',
        'bool': 'v-checkbox',
        'yaml': 'x-yaml'
      },

      // The shadow object should be a reactive object when binding it on the component.
      // Do not using computed property to instead of it.
      shadow: []
    }
  },

  computed: {

    definitionName () {
      return Object.findFirstProperty(this.value, ['definition.name', 'definition.id'])
    },

    definitionDescription () {
      return Object.findProperty(this.value, 'definition.description')
    },

    parameters () {
      return Object.findProperty(this.value, 'definition.parameters', [])
    },

    template () {
      return Object.findProperty(this.value, 'template', {})
    }

  },

  watch: {
    value: {
      handler (val) {
        const value = Object.findProperty(val, 'data', {})
        const parameters = Object.findProperty(this.value, 'definition.parameters', [])
        if (parameters.length) {
          this.shadow = { ...this.template, ...value }
        } else {
          // Can not load the editor, the parameters will be edited in YAML format,
          // do not mix the template since we can not know which parameter inherited from the template.
          this.shadow = { ...value }
        }
      },
      immediate: true
    }
  },

  methods: {

    dynamicComponent (type) {
      return this.component[type] || 'v-text-field'
    },

    parameterLabel (parameter) {
      return parameter.name + (parameter.required && !this.optional ? '*' : '')
    },

    templateIcon (id) {
      if (this.template[id]) {
        return 'mdi-alpha-i-box-outline'
      }
    },

    resetParameter (id) {
      this.shadow[id] = this.template[id]
    },

    validateRules (parameter) {
      const rules = [
        v => this.optional || !parameter.required || (!!v || '必填项')
      ]
      if (parameter.type == 'yaml') {
        rules.push(v => {
          return !v || !v.trim() || validators.yaml(v) || 'YAML 格式不正确。'
        })
      }
      return rules
    },

    validate () {
      // If form not initialized, means nothing changed.
      const form = this.$refs.form
      return !form || form.validate()
    },

    focusInvalid () {
      const valid = this.validate()
      if (!valid) {
        let invalidInput = this.$refs.form.inputs.find(input => !input.valid)
        invalidInput && invalidInput.focus()
      }
      return !valid
    },

    data(full = false) {
      return full ? this.shadow : Object.stripTemplate(this.shadow, this.template)
    }
  }
}
</script>
