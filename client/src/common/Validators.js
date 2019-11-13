import '../script'
import yaml from 'js-yaml'


class ItemValidator {

  static rules = {
    id: k => /^(?!_)[\w\-]+$/.test(k),
    aliasId: k => /^(?!_)[\w\-]+(?:\.[\w\-\.]+)?$/.test(k),
    hasEventhandlers: (_, v) => {
      return Object.entries(v)
        .filter(([name]) => name.startsWith('_on_'))
        .every(([_, value]) => !!value.name && !!value.args && typeof(value.name) === 'string' && typeof(value.args) === 'object')
    },
    hasProperties: (_, v) => {
      return Object.entries(v)
        .some(([key, value]) => /^(?!_)[\w\-\.]+$/.test(key) && typeof(value) === 'object')
    }
  }

  constructor(id, value) {
    this.id = id
    this.value = value
  }

  validate(...rules) {
    return !rules || rules.every(rule => rule(this.id, this.value))
  }

  static from(k, v) {
    return new ItemValidator(k, v)
  }
}


export const validators = {
  yaml(value) {
    try {
      yaml.safeLoad(value)
      return true
    } catch (_) {
      return false
    }
  },

  configuration(id, value) {
    return ItemValidator.from(id, value).validate(
      ItemValidator.rules.id,
      (k, v) => !v || !!v && !!v.repositories && typeof(v.repositories) === 'object'
    )
  },

  common(id, value) {
    return ItemValidator.from(id, value).validate(
      ItemValidator.rules.id,
      ItemValidator.rules.hasEventhandlers,
      ItemValidator.rules.hasProperties,
    )
  },

  step(id, value, treeItem) {
    return !treeItem.$dirty && ItemValidator.from(id, value).validate(
      ItemValidator.rules.hasEventhandlers
    )
  }
}
