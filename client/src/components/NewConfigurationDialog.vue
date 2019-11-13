<template>
  <!-- Dialogs -->
  <v-dialog v-model="visible" persistent max-width="600px">
    <v-form ref="form" v-model="valid">
      <v-card>
        <v-card-title>
          <span class="headline">添加配置</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <x-message channel='dialog'></x-message>
            <v-layout wrap>
              <v-flex xs12>
                <v-text-field
                  name="name"
                  label="配置文件名"
                  hint="请输入配置文件名"
                  v-model="name"
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
import { mapMutations } from 'vuex'
import XMessage from './Message'

export default {

  name: 'new-configuration-dialog',

  components: {
    XMessage
  },

  data () {
    return {
      visible: false,
      valid: false,
      name: null,
      rules: {
        name: [
          v => !!v || '请输入文件名',
          v => /^[\w\-]*$/.test(v) || '配置文件名不正确, 要求格式为 "^[\\w\\-]+$"'
        ]
      },

      existenceCheck: null,
      callback: null
    }
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
          if (!this.exists(this.name)) {
            this.visible = false
            this.callback && this.callback(this.name)
          }
        }
      })
    },

    exists (name) {
      const invalid = this.existenceCheck && this.existenceCheck(name)
      if (invalid) {
        this.showError({target: 'dialog', content: '已存在同名配置文件！'})
      }
      return invalid
    }
  }
}
</script>
