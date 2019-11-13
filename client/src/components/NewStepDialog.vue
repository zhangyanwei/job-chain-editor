<template>
  <!-- Dialogs -->
  <v-dialog v-model="visible" persistent max-width="600px">
    <v-form ref="form" v-model="valid">
      <v-card>
        <v-card-title>
          <span class="headline">插入步骤</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <x-message channel='dialog'></x-message>
            <v-layout wrap>
              <v-flex xs12>
                <v-combobox
                  name="id"
                  label="请选择要插入的步骤"
                  hint="如果在列表中没有找到，请直接输入步骤的ID。"
                  persistent-hint
                  required
                  v-model="value.id"
                  :rules="rules.id"
                  :items="stepIndices"
                  item-value="id"
                  item-text="name"
                ></v-combobox>
              </v-flex>
              <v-flex>
                <v-text-field
                  name="alias"
                  label="别名"
                  v-model="value.alias"
                  :rules="rules.alias"
                ></v-text-field>
              </v-flex>
              <v-flex xs12>
                <v-text-field
                  name="name" label="名称"
                  v-model="value.name"
                ></v-text-field>
              </v-flex>
              <v-flex xs12>
                <v-text-field
                  name="description" label="描述"
                  v-model="value.description"
                ></v-text-field>
              </v-flex>
            </v-layout>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="cancel()">取消</v-btn>
          <v-btn color="primary" :disabled="!valid" @click="submit()">确定</v-btn>
        </v-card-actions>
      </v-card>
    </v-form>
  </v-dialog>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'
import XMessage from './Message'

export default {

  name: 'new-step-dialog',

  components: {
    XMessage
  },

  data () {
    return {
      visible: false,
      valid: false,
      value: {},
      rules: {
        id: [
          v => !!v || '请选择或填写步骤ID',
          v => typeof(v) === 'object' || /^[0-9a-zA-Z][\w]*$/.test(v) || 'ID格式不正确, 要求格式为 "^[\\w\\-]+$"'
        ],
        alias: [
          v => !v || /^[0-9a-zA-Z][\w\.\-]*$/.test(v) || '别名格式不正确, 要求格式为 "^[\\w\\.\\-]+$"'
        ]
      },

      existenceCheck: null,
      callback: null
    }
  },

  computed: {
    ...mapGetters([
      'stepIndices'
    ])
  },

  methods: {

    ...mapMutations ([
      'showError'
    ]),

    open (existenceCheck, callback) {
      this.$refs.form.reset()
      this.visible = true
      this.existenceCheck = existenceCheck
      this.callback = callback
    },

    cancel () {
      this.visible = false
    },

    submit () {
      setTimeout(() => {
        if (this.$refs.form.validate()) {
          const stepId = typeof (this.value.id) === 'string' ? this.value.id : this.value.id.id
          const id = this.value.alias ? stepId + '.' + this.value.alias : stepId
          if (!this.exists(id)) {
            this.visible = false
            // this.$emit('submit', {id, name: this.value.name, description: this.value.description})
            this.callback && this.callback({
              id,
              stepId: stepId,
              alias: this.value.alias,
              name: this.value.name,
              description: this.value.description
            })
          }
        }
      })
    },

    exists (id) {
      const invalid = this.existenceCheck && this.existenceCheck(id)
      if (invalid) {
        this.showError({target: 'dialog', content: '该步骤已经存在！'})
      }
      return invalid
    }

  }
}
</script>
