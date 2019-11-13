<template>
  <v-container>
    <x-message channel='templates' class="mt-0"></x-message>
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
              :active="selectedItem == props.item"
              :key="props.item.$id"
            >
              <!-- https://stackoverflow.com/questions/9789723/css-text-overflow-in-a-table-cell -->
              <td class="ellipsis" style="max-width: 0"
                :class="{'text--disabled': props.item.$removed}"
                :style="{'text-decoration': props.item.$removed ? 'line-through' : 'none'}"
              >{{ itemName(props.item) }}</td>
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
          <template slot="no-data">
            <v-btn @click="createItemData(0)">添加</v-btn>
          </template>
        </v-data-table>
      </v-flex>
      <v-flex xs9>
        <v-tabs
          align-with-title class="elevation-1" color="secondary" dark
          v-if="selectedItem"
          v-model="active"
        >
          <v-tab key="parameters">
            参数
          </v-tab>
          <v-tab key="properties">
            属性
          </v-tab>
          <v-tab-item key="parameters">
            <x-parameters
              ref="parameters"
              optional
              :value="parameters"
              :disabled="selectedItem.$removed"
            ></x-parameters>
          </v-tab-item>
          <v-tab-item key="properties">
            <x-properties
              ref="properties"
              has-alias
              :value="properties"
              :disabled="selectedItem.$removed"
              :rules="rules.properties"
            ></x-properties>
          </v-tab-item>
        </v-tabs>
        <v-alert v-else type="info" :value="true" class="mt-0">
          左侧模板可以通过拖拽改变显示顺序，选择其中一项可以编辑模板的定义。
        </v-alert>
      </v-flex>
    </v-layout>

    <!-- Dialogs -->
    <x-new-step-dialog ref="createDialog"></x-new-step-dialog>
  </v-container>
</template>

<script>
import XMessage from './Message'
import XProperties from './Properties'
import XParameters from './Parameters'
import XNewStepDialog from './NewStepDialog'
import services from '../vuex/api'
import { mapGetters, mapMutations } from 'vuex'

export default {

  name: 'templates',

  props : [
    'configurationName'
  ],

  components: {
    XMessage,
    XProperties,
    XParameters,
    XNewStepDialog
  },

  data () {
    return {
      // The properties come from the template arguments (starts with '_')
      propertymap: {'name': '_name', 'description': '_description'},

      rules: {
        properties: {
          alias: [
            v => {
              const $id = this.properties.$id
              const stepId = this.properties.data.stepId
              const id = v ? stepId + '.' + v : stepId
              return !this.items.some(item => item.$id != $id && item.id == id) || '存在同名模板！'
            }
          ]
        }
      },

      itemNextId: 0,
      active: 0,
      items: [],
      selectedItem: null,
      properties: {},
      parameters: {}
    }
  },

  computed: {

    ...mapGetters([
      'getObject',
      'stepIndex'
    ]),

    templates () {
      return this.getObject([this.configurationName, 'template'], {})
    }

  },

  watch: {

    templates: {
      handler () {
        this.initItems()
      },
      immediate: true
    },

    items (val) {
      if (this.selectedItem) {
        this.selectedItem = val.find(item => item.id == this.selectedItem.id)
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
      this.items = Object.entries(this.templates).map(([name, value]) => {
        const [stepId, alias] = name.split('.')
        return {
          $id: this.itemNextId++,
          $removed: false,
          $name: name,
          $value: value,
          id: name,
          stepId: stepId,
          alias: alias,
          name: value._name,
          description: value._description,
          // Temporary save it first, won't retrieve it if the id was updated.
          // Remove the properties which can be modified in a separate tab.
          template: Object.strip(value, (name, _) => name.startsWith('_'))
        }
      })
    },

    initProperties () {
      if (this.selectedItem) {
        if (this.properties.$id != this.selectedItem.$id) {
          this.properties = {
            $id: this.selectedItem.$id,
            data: {...this.selectedItem || {}}
          }
        }
      }
    },

    async initParameters () {
      if (this.selectedItem) {
        if (this.parameters.$id != this.selectedItem.$id) {
          const definitionResp = await services.definitions.getStepDefinition(this.selectedItem.stepId)
          this.parameters = {
            $id: this.selectedItem.$id,
            definition: definitionResp.data,
            data: this.selectedItem.template
          }
        }
      }
    },

    itemName (item) {
      return item.name || Object.findProperty(this.stepIndex(item.stepId), 'name') || item.id
    },

    createItemData (index) {
      if (!this.focusInvalid()) {
        this.$refs.createDialog.open(
          id => this.items.some(item => item.id === id),
          ({id, name, description, stepId, alias}) => {
            // Not allowed create a varaible if the current form is invalid.
            const newItem = {
              $id: this.itemNextId++,
              $new: true,
              id: id,
              stepId: stepId,
              alias: alias,
              name: name,
              description: description,
              template: {}
            }
            this.items.splice(index, 0, newItem)
            this.selectedItem = newItem
          }
        )
      }
    },

    onItemClick (item) {
      if (!this.selectedItem || this.save()) {
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

    focusInvalid () {
      if (this.$refs.parameters && this.$refs.parameters.focusInvalid()) {
        this.active = 0
        return true
      }
      if (this.$refs.properties && this.$refs.properties.focusInvalid()) {
        this.active = 1
        return true
      }
      return false
    },

    save () {
      if (this.focusInvalid()) {
        return false
      }

      const properties = this.$refs.properties.data()
      // Using the $id to check with data bind to the component.
      if (this.$refs.properties.value.$id == this.selectedItem.$id) {
        let key = this.selectedItem.stepId
        properties.alias && (key += '.' + properties.alias)
        this.selectedItem.id = key
        this.selectedItem.alias = properties.alias
        this.selectedItem.name = properties.name
        this.selectedItem.description = properties.description
      }
      const parameters = this.$refs.parameters.data()
      if (this.$refs.parameters.value.$id == this.selectedItem.$id) {
        this.selectedItem.template = {...parameters}
      }
      return true
    },

    submit () {

      if (!this.save()) {
        return
      }

      this.update({
        ownerPath: [this.configurationName, 'template'],
        data: this.items.reduce((r, item) => {
          r[item.$name] = {
            newKey: item.id,
            value: {
              _name: item.name,
              _description: item.description,
              ...item.template
            }
          }
          return r
        }, {})
      })
      this.showSuccess({target: 'templates', content: '模板更新成功'})
    }
  },

  created () {
    this.$watch(
      vm => ({ active: vm.active, item: vm.selectedItem }),
      ({active}) => {
        this.initParameters()
        this.initProperties()
      },
      {
        immediate: true
      }
    )
  }
}
</script>

