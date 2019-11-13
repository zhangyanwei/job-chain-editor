<template>
  <v-container>
    <x-message channel='variables' class="mt-0"></x-message>
    <v-layout justify-end>
      <v-btn color="primary" class="mr-0" @click="submit">更新</v-btn>
    </v-layout>
    <v-layout>
      <v-flex xs3 pr-3>
        <v-data-table
          hide-actions
          hide-headers
          ref="table"
          :items="items"
          class="x-content-sticky elevation-1"
        >
          <template slot="items" slot-scope="props">
            <tr
              class="x-context-button-wrap"
              @click="onItemClick(props.item)"
              :active="props.item == selectedItem"
              :key="props.item.$id"
            >
              <!-- https://stackoverflow.com/questions/9789723/css-text-overflow-in-a-table-cell -->
              <td class="ellipsis" style="max-width: 0"
                :class="{'text--disabled': props.item.$removed}"
                :style="{'text-decoration': props.item.$removed ? 'line-through' : 'none'}"
              >{{ props.item.name }}</td>
              <td class="text-xs-right pa-0" width="50px">
                <v-menu class="x-context-button" bottom left>
                  <template v-slot:activator="{ on }">
                    <v-btn icon v-on="on" @click.stop="" class="x-context-button">
                      <v-icon>mdi-dots-vertical</v-icon>
                    </v-btn>
                  </template>
                  <v-list>
                    <v-list-tile v-for="(menu, i) in itemContextMenu(props.item)" :key="i"
                      @click="onItemContextMenu(props.item, menu.action)"
                    >
                      <v-list-tile-title>{{ menu.name }}</v-list-tile-title>
                    </v-list-tile>
                  </v-list>
                </v-menu>
              </td>
            </tr>
          </template>
          <template v-slot:no-data>
            <v-btn @click="createItemData(0)">添加</v-btn>
          </template>
        </v-data-table>
      </v-flex>
      <v-flex xs9>
        <v-card v-if="selectedItem">
          <v-card-title primary-title>
            <span class="headline">基本信息</span>
          </v-card-title>
          <v-card-text>
            <v-form ref="form" v-model="valid">
              <v-flex xs12>
                <v-text-field
                  label="变量名"
                  v-model="selectedItem.name"
                  required
                  :rules="rules.variableName"
                  :disabled="selectedItem.$removed"
                ></v-text-field>
                <v-text-field label="描述" v-model="selectedItem.description" :disabled="selectedItem.$removed"></v-text-field>
                <v-text-field label="解析表达式" v-model="selectedItem.parser" :disabled="selectedItem.$removed"></v-text-field>
                <x-yaml
                  label="默认值"
                  hint="默认值可以使用 YAML 格式。"
                  v-model="selectedItem.value"
                  :rules="rules.defaultValue"
                  :disabled="selectedItem.$removed"
                >
                </x-yaml>
              </v-flex>
            </v-form>
          </v-card-text>
        </v-card>
        <v-alert v-else type="info" :value="true" class="mt-0">
          左侧变量可以通过拖拽改变显示顺序，选择其中一项可以编辑变量的定义。
        </v-alert>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import { validators } from '@/common/Validators'
import XMessage from './Message'
import XYaml from './Yaml'
import { mapGetters, mapMutations } from 'vuex'

export default {

  name: 'variables',

  components: {
    XMessage,
    XYaml
  },

  props : [
    'configurationName'
  ],

  data () {
    return {
      rules: {
        variableName: [
          v => !!v || '请输入变量名',
          v => /^[a-zA-Z][\w\-_]+$/.test(v) || '变量名格式不正确, 要求格式为 "^[a-zA-Z][\\w\\-_]+$"',
          v => this.items.count(item => item.name === v) < 2 || '变量名重复'
        ],
        defaultValue: [
          v => !v || !v.trim() || validators.yaml(v) || 'YAML 格式不正确。'
        ]
      },

      valid: false,
      itemNextId: 0,
      items: [],
      selectedItem: null
    }
  },

  computed: {
    ...mapGetters([
      'getObject'
    ]),

    variables () {
      return this.getObject([this.configurationName, 'variable'], {})
    }
  },

  watch: {

    variables: {
      handler () {
        this.initItems()
      },
      immediate: true
    },

    items (val) {
      if (this.selectedItem) {
        this.selectedItem = val.find(item => item.name == this.selectedItem.name)
      }
    }
  },

  methods: {

    ...mapMutations ([
      'update',
      'showSuccess'
    ]),

    itemContextMenu (item) {
      return [
          { name: '插入', action: 'insert' },
          { name: '追加', action: 'append' },
          item.$removed ? { name: '恢复', action: 'revert' } : { name: '删除', action: 'delete' },
        ]
    },

    initItems () {
      this.items = Object.entries(this.variables).map(([name, value]) => {
        return {
          $id: this.itemNextId++,
          $removed: false,
          $name: name,
          $value: value,
          name: name,
          description: value._description,
          parser: value.parser,
          value: value.value
        }
      })
    },

    createItemData (index) {
      if (!this.focusInvalid()) {
        // Not allowed create a varaible if the current form is invalid.
        const newItem = {
          $id: this.itemNextId++,
          $new: true
        }
        this.items.splice(index, 0, newItem)
        this.selectedItem = newItem
      }
    },

    onItemClick (item) {
      if (!this.selectedItem || !this.focusInvalid()) {
        this.selectedItem = item
      }
    },

    onItemContextMenu (item, action) {
      let methodName = `on${action.capitalize()}`
      this[methodName] && this[methodName].call(this, item)
    },

    onInsert (item) {
      this.createItemData(this.items.indexOf(item))
    },

    onAppend (item) {
      this.createItemData(this.items.indexOf(item) + 1)
    },

    onDelete (item) {
      if (item.$new) {
        // Remove the temporary item.
        const index = this.items.indexOf(item)
        this.items.splice(index, 1)
        if (this.selectedItem === item) {
          this.selectedItem = this.items[Math.min(index, this.items.length - 1)]
        }
      } else {
        item.$removed = true
      }
    },

    onRevert (item) {
      item.$removed = false
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

    submit () {
      if (this.focusInvalid()) {
        return
      }

      this.update({
        ownerPath: [this.configurationName],
        data: {
          'variable': {
            value: this.items.reduce((r, item) => {
              if (!item.$removed) {
                r[item.name] = {
                  _description: item.description,
                  parser: item.parser,
                  value: item.value
                }
              }
              return r
            }, {})
          }
        }
      })
      this.showSuccess({target: 'variables', content: '变量更新成功'})
    }
  }
}
</script>

