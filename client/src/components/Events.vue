<template>
  <v-layout>
    <v-flex xs3 mr-3>
      <v-data-table
        hide-actions
        hide-headers
        ref="table"
        :items="items"
        class="elevation-1"
      >
        <template slot="items" slot-scope="props">
          <tr
            class="x-context-button-wrap"
            @click="onItemClick(props.item)"
            :active="props.item == selectedItem"
            :key="props.item.id"
          >
            <!-- https://stackoverflow.com/questions/9789723/css-text-overflow-in-a-table-cell -->
            <td class="ellipsis" style="max-width: 0"
              :class="{'text--disabled': props.item.$removed}"
              :style="{'text-decoration': props.item.$removed ? 'line-through' : 'none'}"
            >{{ props.item.id }} - {{ props.item.name }}</td>
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
      <x-parameters v-if="event" ref="parameters" :value="event"></x-parameters>
      <v-alert v-else type="info" :value="true" class="mt-0">
        选择其中一项可以编辑事件的定义。
      </v-alert>
    </v-flex>

    <x-new-event-dialog ref="createDialog"></x-new-event-dialog>
  </v-layout>
</template>

<script>
import XParameters from './Parameters'
import XNewEventDialog from './NewEventDialog'
import services from '../vuex/api'

export default {

  name: 'events',
  
  props: {
    value: {}
  },

  components: {
    XParameters,
    XNewEventDialog
  },

  data () {
    return {
      selectedItem: null,
      event: null,

      items: []
    }
  },

  watch: {

    value: {
      handler () {
        // Shadow copy
        this.items = this.value ? this.value.map(item => {
          return {...item, $removed: false}
        }) : []
      },

      immediate: true
    },

    items (val) {
      if (this.selectedItem) {
        this.selectedItem = val.find(item => item.id == this.selectedItem.id)
      }
    },

    async selectedItem (val) {
      // There the finial data structure
      // { data: { alias, name, description, value }, definition: {} }
      if (!val) {
        this.event = null
      } else {
        const definitionResp = await services.definitions.getEventDefinition(val.name)
        this.event = {
          definition: definitionResp.data,
          data: {...val.arguments}
        }
      }
    }
  },

  methods: {

    itemContextMenu (item) {
      return [
          { name: '插入', action: 'insert' },
          { name: '追加', action: 'append' },
          item.$removed ? { name: '恢复', action: 'revert' } : { name: '删除', action: 'delete' },
        ]
    },

    createItemData (index) {
      if (!this.focusInvalid()) {
        this.$refs.createDialog.open(
          id => this.items.some(item => item.id === id),
          ({id, name, description}) => {
            // Not allowed create a varaible if the current form is invalid.
            const newItem = {
              $new: true,
              id: id,
              name: name,
              description: description
            }
            this.items.splice(index, 0, newItem)
            this.selectedItem = newItem
          }
        )
      }
    },

    onItemClick (item) {
      if (!this.selectedItem || !this.focusInvalid()) {
        this.save()
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
      return !this.$refs.parameters || this.$refs.parameters.validate()
    },

    focusInvalid () {
      const valid = this.validate()
      if (!valid) {
        this.$refs.parameters.focusInvalid()
      }
      return !valid
    },

    data () {
      // Make sure the data has been temporary saved before call this method to retrieve data.
      this.save()
      return this.items.filter(item => !item.$removed)
    },

    save () {
      if (this.$refs.parameters) {
        const parameters = this.$refs.parameters.data()
        this.selectedItem.arguments = parameters
      }
      return true
    }
  }
}
</script>
