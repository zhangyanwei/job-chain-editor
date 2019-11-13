<template>
  <!-- Dialogs -->
  <v-dialog v-model="visible" persistent max-width="600px">
    <v-form ref="form" v-model="valid">
      <v-card>
        <v-card-title>
          <span class="headline">插入事件</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <x-message channel='dialog'></x-message>
            <v-layout wrap>
              <v-flex xs12>
                <v-select
                  name="id"
                  label="请选择事件类型"
                  v-model="value.id"
                  required
                  :items="availableTypes"
                  item-value="id"
                  item-text="name"
                ></v-select>
              </v-flex>
              <v-flex>
                <v-combobox
                  name="name"
                  label="请选择事件处理函数"
                  hint="如果在列表中没有找到，请直接输入函数名。"
                  persistent-hint
                  required
                  v-model="value.name"
                  :rules="rules.name"
                  :items="eventIndices"
                  item-value="id"
                  item-text="name"
                ></v-combobox>
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
import { mapGetters, mapActions, mapMutations } from 'vuex'
import XMessage from './Message'

export default {

  name: 'new-event-dialog',

  components: {
    XMessage
  },

  data () {
    return {
      availableTypes: [
        {
          id: 'success',
          name: '成功'
        },
        {
          id: 'error',
          name: '失败'
        }
      ],

      visible: false,
      valid: false,
      value: {},
      rules: {
        name: [
          v => !!v || '请选择或填写事件处理函数名',
          v => typeof(v) === 'object' || /^[0-9a-zA-Z][\w]*$/.test(v) || '函数名不正确, 要求格式为 "^[\\w\\-]+$"'
        ]
      },

      existenceCheck: null,
      callback: null
    }
  },

  computed: {
    ...mapGetters([
      'eventIndices'
    ])
  },

  methods: {

    ...mapActions ([
      'getEventHandlerIndices'
    ]),

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
          const id = this.value.id
          if (!this.exists(id)) {
            this.visible = false
            // this.$emit('submit', {id, name: this.value.name, description: this.value.description})
            this.callback && this.callback({
              id,
              name: typeof (this.value.name) === 'string' ? this.value.name : this.value.name.id,
              description: this.value.description
            })
          }
        }
      })
    },

    exists (id) {
      const invalid = this.existenceCheck && this.existenceCheck(id)
      if (invalid) {
        this.showError({target: 'dialog', content: '该事件已经存在！'})
      }
      return invalid
    }
  },

  created () {
    this.getEventHandlerIndices()
  }
}
</script>
