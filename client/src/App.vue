<!-- TODO split the treeview as an independent component. -->
<template>
  <v-app v-if="initialized" class="x-app">
    <!-- Navigator -->
    <v-navigation-drawer fixed app :clipped="$vuetify.breakpoint.mdAndUp" width="400px">
      <v-container>
        <v-layout>
          <v-flex>
            <v-treeview
              v-model="selected"
              :load-children="onItemLoad"
              :items="items"
              :active="actived"
              :open="opened"
              activatable
              hoverable
              transition
              item-key="$id"
              loading-icon="mdi-loading"
              expand-icon="mdi-chevron-down"
              ref="treeview"
              @update:active="onItemActive(...$event)"
              @update:open="onItemOpen($event)"
            >
              <template v-slot:prepend="{ item }">
                <v-icon v-text="itemTypeIcons[item.$type]" :class="classItemDirty(item)"></v-icon>
              </template>
              <template v-slot:label="{ item }">
                <span :class="[itemTypeClasses[item.$type], classItemDirty(item)]" :data-id="item.$id">{{itemName(item)}}</span>
              </template>
              <template v-slot:append="{ item, active }">
                <v-menu v-if="itemContextMenus[item.$type]" bottom left>
                  <template v-slot:activator="{ on }">
                    <v-btn icon v-on="on" @click.stop="" class="x-context-button">
                      <v-icon>mdi-dots-vertical</v-icon>
                    </v-btn>
                  </template>
                  <v-list>
                    <v-list-tile v-for="(menu, i) in itemContextMenus[item.$type]" :key="i"
                      @click="onItemContextMenu(item, menu.action)"
                    >
                      <v-list-tile-title>{{ menu.name }}</v-list-tile-title>
                    </v-list-tile>
                  </v-list>
                </v-menu>
              </template>
            </v-treeview>
          </v-flex>
        </v-layout>
      </v-container>
    </v-navigation-drawer>

    <!-- Toolbar -->
    <v-toolbar color="primary"
      app fixed dark
      :clipped-left="$vuetify.breakpoint.mdAndUp"
    >
      <v-toolbar-title>
        <v-toolbar-side-icon></v-toolbar-side-icon>
        <span class="hidden-sm-and-down">Devops Job Editor</span>
      </v-toolbar-title>
    </v-toolbar>

    <!-- Global Alerts -->
    <v-alert class="x-dirty-alert" type="warning" :value="dirty">
      存在新的更新，可以选择放弃或者提交。
      <v-btn color="warning" @click="onRefresh">放弃</v-btn>
      <v-btn @click="onSubmit" :disabled="invalid" :loading="saving">提交</v-btn>
    </v-alert>
    <x-message channel='app' class="x-dirty-alert"></x-message>

    <!-- Content -->
    <v-content>
      <!-- <v-breadcrumbs :items="breadcrumbs" divider=">"></v-breadcrumbs> -->
      <router-view></router-view>
    </v-content>

    <!-- Global Buttons -->
    <v-btn color="pink" fab bottom right dark fixed @click="onCreateConfiguration">
      <v-icon>mdi-plus</v-icon>
    </v-btn>

    <!-- Dialogs -->
    <x-new-configuration-dialog ref="configurationDialog"></x-new-configuration-dialog>
    <x-new-step-dialog ref="stepDialog"></x-new-step-dialog>
  </v-app>
  <div v-else>
    加载中...
  </div>
</template>

<script>
import $ from 'jquery'
import yaml from 'js-yaml'
import Sortable from 'sortablejs'
import { validators } from './common/Validators'
import services from './vuex/api'
import { mapActions, mapGetters, mapMutations } from 'vuex'
import XMessage from './components/Message'
import XNewStepDialog from './components/NewStepDialog'
import XNewConfigurationDialog from './components/NewConfigurationDialog'

export default {

  name: 'App',

  components: {
    XMessage,
    XNewStepDialog,
    XNewConfigurationDialog
  },

  data () {
    return {

      itemTypeRegexes: [
        { regex: new RegExp('^/[^/]+$'), type: 'configuration' },
        { regex: new RegExp('^/[^/]+/variables$'), type: 'variable' },
        { regex: new RegExp('^/[^/]+/templates$'), type: 'template' },
        { regex: new RegExp('^/[^/]+/repositories$'), type: 'repositories' },
        { regex: new RegExp('^/[^/]+/repositories(?:/[^/]+){1}$'), type: 'repository' },
        { regex: new RegExp('^/[^/]+/repositories(?:/[^/]+){2}$'), type: 'job' },
        { regex: new RegExp('^/[^/]+/repositories(?:/[^/]+){3}$'), type: 'step' }
      ],

      itemTypeIcons: {
        configuration: 'mdi-alpha-f-box',
        variable: 'mdi-alpha-v-box',
        template: 'mdi-alpha-t-box',
        repositories: 'mdi-alpha-r-box',
        repository: 'mdi-alpha-r-box',
        job: 'mdi-alpha-j-box',
        step: 'mdi-alpha-s-box'
      },

      itemTypeClasses: {
        job: 'x-job',
        step: 'x-job-step'
      },

      itemContextMenus: {
        configuration: [
          { name: '下载', action: 'download' },
          { name: '删除', action: 'delete' }
        ],
        repositories: [
          { name: '创建任务库', action: 'create' }
        ],
        repository: [
          { name: '创建任务', action: 'create' },
          { name: '插入', action: 'insert' },
          { name: '追加', action: 'append' },
          { name: '删除', action: 'delete' }
        ],
        job: [
          { name: '添加步骤', action: 'create' },
          { name: '插入', action: 'insert' },
          { name: '追加', action: 'append' },
          { name: '删除', action: 'delete' }
        ],
        step: [
          { name: '插入', action: 'insert' },
          { name: '追加', action: 'append' },
          { name: '删除', action: 'delete' }
        ]
      },

      breadcrumbs: [],

      actived: [],

      opened: [],

      selected: [],

      items: [],

      // This is a template for the treeview items.
      itemTemplate: [
        {
          id: 'variables'
        },
        {
          id: 'templates'
        },
        {
          id: 'repositories',
          children: []
        }
      ],

      staticItemName: {
        variable: '变量',
        template: '模板',
        repositories: '仓库'
      },

      itemNextId: 0,

      itemIdMap: {},

      initialized: false,

      dirty: false,

      invalid: false,

      saving: false
    }
  },

  computed: {
    ...mapGetters([
      'configurations',
      'lastupdate',
      'getObject',
      'stepIndex'
    ])
  },

  watch: {

    // When the data has been updated, this getter will represent the last update information.
    lastupdate ({ownerPath, data, action}) {
      // If the data contains multiple items, the tree view not need to update itself.
      const entries = Object.entries(data)
      for (let entry of entries) {
        const [k, d] = entry
        if (!k || d.position) {
          // Add a new item if the key is an empty string or the position has been specified (which means a new item will be added).
          this.addItem(ownerPath, k, d.newKey, d.position, d.value)
        } else if (d.value) {
          this.updateItem(ownerPath, k, d.newKey, d.value, action)
        } else {
          this.deleteItem(ownerPath, k)
        }
      }
      this.dirty = true
      this.$nextTick(() => this.invalid = Object.values(this.itemIdMap).some(item => this.itemDirty(item)))
    }
  },

  methods: {

    ...mapActions([
      'getConfigurations',
      'getConfiguration',
      'saveConfigurations',
      'getStepIndices'
    ]),

    ...mapMutations ([
      'update',
      'showSuccess',
      'showError'
    ]),

    // Styles and presentation
    classItemDirty (item) {
      return {
        'red--text': this.itemDirty(item)
      }
    },

    itemName (item) {
      let name = this.staticItemName[item.$type]
      if (!name && item.$type === 'step') {
        const summary = this.stepIndex(item.id.split('.')[0])
        if (summary) {
          name = item.name || summary.name || item.id
        }
      }
      return name || item.name || item.id
    },

    itemDirty (item) {
      const data = this.getObject(item.$key)
      if (data) {
        switch (item.$type) {
          case 'configuration':
            return !validators.configuration(item.id, data)
          case 'repositories':
          case 'repository':
          case 'job':
            return !validators.common(item.id, data)
          case 'step':
            return !validators.step(item.id, data, item)
          default:
            return false
        }
      }

      // It's initializing or deleted if there is no data.
      return false
    },

    // Utils functions
    async findItem (array, idPath, autoLoad=true) {
      let item
      for (let id of idPath) {
        item = array ? array.find(item => item.id == id) : undefined
        if (item) {
          // Try to load the item
          if (autoLoad && item.children && !item.children.length) {
            await this.onItemLoad(item)
          }
          array = item.children
        } else {
          // Stop loop
          break
        }
      }
      return item
    },

    async addItem (ownerPath, id, newId, position, value) {
      // 1. Add the new item to the end of the owner's children array if key is an empty string.
      // 2. Add the new item to the special position if the position has been specified.
      const item = await this.findItem(this.items, [...ownerPath], false)
      if (item) {
        debugger
        // Trying to load the children first
        item.children && !item.children.length &&  await this.onItemLoad(item)
        // Assign the empty array to the children if the children is null/undefined (means it's a new item)
        item.children || this.$set(item, 'children', [])
      }

      // Update the data of the treeview
      if (item || !ownerPath.length) {
        const children = ownerPath.length ? item.children : this.items
        let index = children.findIndex(child => child.id === id)
        switch (position) {
          case 'before':
            index = Math.max(0, index)
            break
          case 'after':
            index++
            break
          default:
            index = children.length
        }

        const newItem = this.asTreeItem({
          $dirty: true,
          id: newId,
          name: value._name
        }, item)
        
        // Load it first since the value may contain data.
        await this.onItemLoad(newItem, false, false)
        children.splice(index, 0, newItem)

        // Redirect to the new created item.
        this.$router.push({ path: newItem.$key })
        this.activeItem(newItem.$key, true)
      }
    },

    async deleteItem (ownerPath, id) {
      const item = await this.findItem(this.items, [...ownerPath, id], false)
      if (item) {
        const siblings = item.$parent ? item.$parent.children : this.items
        const index = siblings.indexOf(item)
        if (index > -1) {
          siblings.splice(index, 1)
          if (!siblings.length && item.$parent) {
            // To make sure the collapse icon not displayed.
            this.$delete(item.$parent, 'children')
          }
        }
        delete this.itemIdMap[item.$id]
        // Redirect to the parent view if the item has been deleted.
        if (this.$route.path.startsWith(item.$key)) {
          const hash = item.$parent ? item.$parent.$key : '/'
          this.$router.push({ path: hash })
          this.activeItem(hash)
        }
      }
    },

    async updateItem (ownerPath, key, newKey, value, action) {
      const item = await this.findItem(this.items, [...ownerPath, key], false)
      if (item) {
        item.$dirty = false
        item.name = value._name
        if (newKey != null && item.id != newKey) {
          // update the $key, all of children contains the updated key information.
          const $key = item.$key
          let items = [item]
          let c
          item.id = newKey
          while (!!(c = items.shift())) {
            c.$key = c.$parent.$key + '/' + c.id
            c.children && items.push(...c.children)
          }

          // Redirect to new hash address.
          const path = this.$route.path
          if ($key.startsWith(path)) {
            const hash = path.replace($key, item.$key)
            this.$router.push({ path: hash })
            this.activeItem(hash)
          }
        }
        else if (action == 'sort') {
          const sorted = Object.keys(value).map(key => item.children.find(item => item.id == key))
          this.$set(item, 'children', sorted)
          this.activeItem(this.$route.path)
        }
      }
    },

    // Event helpers
    createItemData ({ownerPath, coordinate='', position, key, value}) {
      this.update({
        ownerPath: ownerPath,
        data: {
          [coordinate]: {
            newKey: key || '_',
            value: value || {},
            position: position
          }
        }
      })
    },

    createStepData (owner, coordinate='', position) {
      this.$refs.stepDialog.open(
        id => owner.children && owner.children.some(child => child.id === id),
        ({id, name, description}) => {
          this.createItemData({
            ownerPath: owner.$key.split('/').slice(1),
            key: id,
            value: {
              _name: name,
              _description: description
            },
            coordinate: coordinate,
            position: position
          })
        }
      )
    },

    deleteItemData (item) {
      this.update({
        ownerPath: item.$key.split('/').slice(1, -1),
        data: {
          [item.id]: {}
        }
      })
    },

    // Functions for the treeview rendering.
    // Convert the item into displayed item recursively.
    asTreeItem (item, parent) {
      item.$id = this.itemNextId++
      this.itemIdMap[item.$id] = item

      // Update the key, the format of key is '(?:/[^/]+)+'
      if (!!parent) {
        item.$parent = parent
        item.$key = parent.$key + '/' + item.id
      } else {
        item.$key = '/' + item.id
      }

      // Update the type according to the $key value.
      const typeRegex = this.itemTypeRegexes.find(typeRegex => item.$key.match(typeRegex.regex))
      if (typeRegex) {
        item.$type = typeRegex.type
      }

      // Convert the children by call this function recursively.
      if (item.children) {
        item.children.forEach(child => this.asTreeItem(child, item))
      }

      return item
    },

    // I've tried to use the key for dom refresh, but there exist some strange issues.
    // So trying to remove the item from the parent, then add it back.
    refreshTreeItem (...items) {

      // Group the items by the parent
      const groups = items.reduce((r, item) => {
        const $parent = item.$parent
        if ($parent) {
          (r[$parent.$key] || (r[$parent.$key] = {$parent, items: []})).items.push(item)
        }
        return r
      }, {})

      // Remove them from the parent, then add them back.
      Object.entries(groups).forEach(([_, {$parent, items}]) => {
        const siblings = $parent.children
        const copy = siblings.slice()
        for (const item of items) {
          siblings.splice(siblings.indexOf(item), 1)
        }
        this.$nextTick(() => {
          siblings.splice(0, siblings.length, ...copy)
        })
      })

      // Reset the opened and actived statuses.
      const opened = this.$refs.treeview.openCache
      const actived = this.$refs.treeview.activeCache
      this.$nextTick(() => {
        this.opened.splice(0, this.opened.length, ...opened)
        this.actived.splice(0, this.actived.length, ...actived)
      })
    },

    // Actions
    async initItems () {
      const { data: items } = await this.getConfigurations()
      this.items.splice(0, this.items.length, ...items.map(item => {
        return this.asTreeItem({
          ...item,
          children: []
        })
      }))

      // Load the children if it's under the current route.
      this.activeItem(this.$route.path, true)
      this.initialized = true
    },

    async activeItem (hash, open=false) {
      // Load the children if it's under the current route.
      const idPath = hash.split('/').slice(1)
      const selectedItem = await this.findItem(this.items, idPath)
      if (!!selectedItem) {
        if (open) {
          // Not always need to open its ancestors.
          let hierarchy = []
          let node = selectedItem
          while (node) {
            hierarchy.push(node.$id)
            node = node.$parent
          }
          this.opened.splice(0, this.opened.length, ...new Set([...hierarchy, ...this.$refs.treeview.openCache]))
        }
        this.actived = [selectedItem.$id]
      } else {
        // navigate to the 404 page if the item not found.
        this.$router.push({ path: idPath.length ? '/' : '/404' })
      }
    },

    onCreateConfiguration () {
      this.$refs.configurationDialog.open(
        name => this.configurations.find(conf => conf.id == name),
        name => {
          this.update({
            ownerPath: [],
            data: {
              '': {
                newKey: name,
                value: {
                  repositories: {},
                  template: {},
                  variable: {}
                }
              }
            }
          })
          this.showSuccess({target: 'app', content: `成功创建配置 ${name}`})
        }
      )
    },

    onRefresh () {
      window.location.reload()
    },

    onSubmit () {
      this.saving = true
      this.saveConfigurations()
        .then(() => {
          this.dirty = false
          this.showSuccess({target: 'app', content: '已成功提交！'})
          this.initItems()
        })
        .catch(resp => this.showError({target: 'app', content: '提交失败！'}))
        .finally(() => this.saving = false)
    },

    onItemActive (key) {
      if (key !== undefined) {
        const item = this.itemIdMap[key]
        // Route to the new hash.
        this.actived.splice(0, this.actived.length, ...this.$refs.treeview.activeCache)
        this.$router.push({ path: item.$key })
      } else {
        // Do not allow deactive an item.
        this.$refs.treeview && this.actived.splice(0, this.actived.length, ...this.actived)
      }
    },

    onItemOpen (keys) {
      const vm = this
      // Should manipulate the DOM in the next frame.
      this.$nextTick(() => {
        for (const key of keys) {
          $(`.x-job[data-id='${key}']`, this.$refs.treeview.$el)
            .closest('.v-treeview-node')
            .find('.v-treeview-node__children').each(function () {
              Sortable.create(this, {
                group: {
                  name: 'steps',
                  pull: 'clone'
                },
                draggable: '.v-treeview-node',
                animation: 150,
                onEnd: vm.onItemDragEnd
              })
            })
        }
      })
    },

    async onItemLoad (item, retrieve=true, alwaysCreateChildren=true) {
      // NOTE: the children should exists first,
      // otherwise should using the $set method to assign a new array to the children.
      if (item.$type == 'configuration') {
        retrieve && await this.getConfiguration([item.id])
        // This node initialized with a template.
        const children = JSON.parse(JSON.stringify(this.itemTemplate)).map(child => this.asTreeItem(child, item))
        !retrieve && delete children.find(child => child.id === 'repositories').children
        item.children = children
      } else {
        const data = this.getObject(item.$key)
        const dataProps = Object.entries(data).filter(([id, value]) => !id.startsWith('_'))
        if (alwaysCreateChildren || dataProps.length) {
          item.children = dataProps.map(([id, value]) => {
            // Return the default object
            return this.asTreeItem({
              id: id,
              name: value._name,
              // For the step nodes, there are no children.
              children: item.$type == 'job' ? undefined : []
            }, item)
          })
        }
      }
    },

    onItemContextMenu (item, action) {
      let methodName = `on${item.$type.capitalize()}${action.capitalize()}`
      !this[methodName] && (methodName = `on${action.capitalize()}`)
      this[methodName] && this[methodName].call(this, item)
    },

    onDownload (item) {
      const data = this.getObject(item.$key)
      Window.downloader.save(yaml.safeDump(data), `${item.id}.yaml`, 'text/yaml')
    },

    onDelete (item) {
      this.update({
        ownerPath: item.$key.split('/').slice(1, -1),
        data: {
          // It will be deleted if no value specified.
          [item.id]: {}
        }
      })
      this.showSuccess({target: 'app', content: `已删除 ${item.name}。`})
    },

    onCreate (item) {
      this.createItemData({ownerPath: item.$key.split('/').slice(1)})
    },

    onInsert (item) {
      this.createItemData({ownerPath: item.$key.split('/').slice(1, -1), coordinate: item.id, position: 'before'})
    },

    onAppend (item) {
      this.createItemData({ownerPath: item.$key.split('/').slice(1, -1), coordinate: item.id, position: 'after'})
    },

    onJobCreate (item) {
      this.createStepData(item)
    },

    onStepInsert (item) {
      this.createStepData(item.$parent, item.id, 'before')
    },

    onStepAppend (item) {
      this.createStepData(item.$parent, item.id, 'after')
    },

    onItemDragEnd ({item, from, to, oldIndex, newIndex, pullMode}) {
      const toParentTreeItem = this.itemIdMap[$('.x-job', to.parentNode).data('id')]
      if (pullMode === 'clone') {
        const treeItem = this.itemIdMap[$('.x-job-step', item).data('id')]
        const fromParentTreeItem = this.itemIdMap[$('.x-job', from.parentNode).data('id')]
        const siblings = toParentTreeItem.children
        // Refresh the dom to remove the dom elements created through the drag/drop actions.
        this.refreshTreeItem(fromParentTreeItem, toParentTreeItem)
        if (siblings.find(sibling => sibling.id == treeItem.id)) {
          this.showError({target: 'app', content: '存在同名的步骤，不能拖拽复制！'})
          return
        }
        // Put the action in the $nextTick method 
        // because of the refreshTreeItem will manipulate the data in the $nextTick method.
        this.$nextTick(() => {
          const data = this.getObject(treeItem.$key)
          const coordinate = siblings[newIndex] ? siblings[newIndex].id : ''
          this.createItemData({
            ownerPath: toParentTreeItem.$key.split('/').slice(1),
            key: treeItem.id,
            value: {
              ...data
            },
            coordinate: coordinate,
            position: coordinate ? 'before' : undefined
          })
        })
      }
      else {
        this.refreshTreeItem(toParentTreeItem)
        this.$nextTick(() => {
          const data = this.getObject(toParentTreeItem.$key)
          const keys = Object.keys(data)
          keys.splice(newIndex, 0, ...keys.splice(oldIndex, 1))
          this.update({
            ownerPath: toParentTreeItem.$key.split('/').slice(1, -1),
            data: {
              [toParentTreeItem.id]: {
                value: keys.reduce((r, key) => {
                  r[key] = data[key]
                  return r
                }, {})
              }
            },
            action: 'sort'
          })
        })
      }
    }
  },

  created () {
    this.initItems()
    this.getStepIndices()
  }
}
</script>

<!-- Global styles -->
<style>
.x-context-button {
  display: none;
}
.x-context-button-wrap:hover .x-context-button {
  display: flex;
}
.x-content-sticky {
  position: sticky;
  top: 84px;
}
.x-yaml .CodeMirror {
  height: auto;
}
</style>

<!-- Scoped styles -->
<style scoped>
.x-app {
  cursor: default;
}
.v-treeview-node__root:hover .x-context-button {
  display: flex;
}
.x-dirty-alert {
  position: fixed;
  z-index: 3;
  width: 600px;
  left: 50%;
  margin-left: -300px;
}
</style>

