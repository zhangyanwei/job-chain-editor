// Extensions
import VInput from 'vuetify/lib/components/VInput'

// Components
import VCounter from 'vuetify/lib/components/VCounter'
import VLabel from 'vuetify/lib/components/VLabel'

// Mixins
import Loadable from 'vuetify/lib/mixins/loadable'

// Directives
import Ripple from 'vuetify/lib/directives/ripple'

// TODO remove them if unnecessary
// Utilities
import { deprecate } from 'vuetify/lib/util/console'

import { codemirror } from 'vue-codemirror-lite'

/* @vue/component */
export default VInput.extend({

  name: 'x-codemirror',

  directives: { Ripple },

  mixins: [Loadable],

  inheritAttrs: false,

  props: {
    appendOuterIcon: String,
    autofocus: Boolean,
    box: Boolean,
    clearable: Boolean,
    clearIcon: {
      type: String,
      default: '$vuetify.icons.clear'
    },
    clearIconCb: Function,
    color: {
      type: String,
      default: 'primary'
    },
    counter: [Boolean, Number, String],
    flat: Boolean,
    fullWidth: Boolean,
    label: String,
    outline: Boolean,
    placeholder: String,
    prefix: String,
    prependInnerIcon: String,
    reverse: Boolean,
    singleLine: Boolean,
    solo: Boolean,
    soloInverted: Boolean,
    suffix: String,
    type: {
      type: String,
      default: 'text'
    },
    options: {
      type: Object
    }
  },

  data: () => ({
    badInput: false,
    initialValue: null,
    internalChange: false,
    isClearing: false,

    editor: null
  }),

  computed: {
    classes () {
      return {
        'x-codemirror': true,
        'v-text-field': true,
        'v-text-field--full-width': this.fullWidth,
        'v-text-field--prefix': this.prefix,
        'v-text-field--single-line': this.isSingle,
        'v-text-field--solo': this.isSolo,
        'v-text-field--solo-inverted': this.soloInverted,
        'v-text-field--solo-flat': this.flat,
        'v-text-field--box': this.box,
        'v-text-field--enclosed': this.isEnclosed,
        'v-text-field--reverse': this.reverse,
        'v-text-field--outline': this.hasOutline,
        'v-text-field--placeholder': this.placeholder
      }
    },
    counterValue () {
      return (this.internalValue || '').toString().length
    },
    directivesInput () {
      return []
    },
    // TODO: Deprecate
    hasOutline () {
      return this.outline || this.textarea
    },
    internalValue: {
      get () {
        return this.lazyValue
      },
      set (val) {
        this.lazyValue = val
        this.$emit('input', this.lazyValue)
      }
    },
    isDirty () {
      return (this.lazyValue != null &&
        this.lazyValue.toString().length > 0) ||
        this.badInput
    },
    isEnclosed () {
      return (
        this.box ||
        this.isSolo ||
        this.hasOutline ||
        this.fullWidth
      )
    },
    isLabelActive () {
      return this.isDirty
    },
    isSingle () {
      return this.isSolo || this.singleLine
    },
    isSolo () {
      return this.solo || this.soloInverted
    },
    labelPosition () {
      const offset = (this.prefix && !this.labelValue) ? this.prefixWidth : 0

      return (!this.$vuetify.rtl !== !this.reverse) ? {
        left: 'auto',
        right: offset
      } : {
        left: offset,
        right: 'auto'
      }
    },
    showLabel () {
      return this.hasLabel && (!this.isSingle || (!this.isLabelActive && !this.placeholder && !this.prefixLabel))
    },
    labelValue () {
      return !this.isSingle &&
        Boolean(this.isFocused || this.isLabelActive || this.placeholder || this.prefixLabel)
    },
    prefixWidth () {
      if (!this.prefix && !this.$refs.prefix) return

      return this.$refs.prefix.offsetWidth
    },
    prefixLabel () {
      return (this.prefix && !this.value)
    }
  },

  watch: {
    isFocused (val) {
      // Sets validationState from validatable
      this.hasColor = val

      if (val) {
        this.initialValue = this.lazyValue
      } else if (this.initialValue !== this.lazyValue) {
        this.$emit('change', this.lazyValue)
      }
    },
    value (val) {
      this.lazyValue = val
      if (!this.internalChange) {
        // Emit when the externally set value was modified internally
        String(val) !== this.lazyValue && this.$nextTick(() => {
          this.editor.setValue(this.lazyValue)
          this.$emit('input', this.lazyValue)
        })
      }
    }
  },

  mounted () {
    this.editor = this.$refs.input.editor
    this.autofocus && this.onFocus()

    this.editor.on('focus', this.onFocus.bind(this))
    this.editor.on('blur', this.onBlur.bind(this))
    this.editor.on('changes', this.onInput.bind(this))

    // Manually manipulate the label, since we can not set the style and class on VLabel directly.
    const $label = this.$el.querySelector('.v-text-field__slot > .v-label')
    $label && ($label.style.zIndex = 1)
  },

  methods: {
    /** @public */
    focus () {
      this.onFocus()
    },
    /** @public */
    blur () {
      this.editor ? this.editor.blur() : this.onBlur()
    },
    clearableCallback () {
      this.internalValue = null
      this.$nextTick(() => this.editor.focus())
    },
    genAppendSlot () {
      const slot = []

      if (this.$slots['append-outer']) {
        slot.push(this.$slots['append-outer'])
      } else if (this.appendOuterIcon) {
        slot.push(this.genIcon('appendOuter'))
      }

      return this.genSlot('append', 'outer', slot)
    },
    genPrependInnerSlot () {
      const slot = []

      if (this.$slots['prepend-inner']) {
        slot.push(this.$slots['prepend-inner'])
      } else if (this.prependInnerIcon) {
        slot.push(this.genIcon('prependInner'))
      }

      return this.genSlot('prepend', 'inner', slot)
    },
    genIconSlot () {
      const slot = []

      if (this.$slots['append']) {
        slot.push(this.$slots['append'])
      } else if (this.appendIcon) {
        slot.push(this.genIcon('append'))
      }

      return this.genSlot('append', 'inner', slot)
    },
    genInputSlot () {
      const input = VInput.options.methods.genInputSlot.call(this)

      const prepend = this.genPrependInnerSlot()
      prepend && input.children.unshift(prepend)

      return input
    },
    genClearIcon () {
      if (!this.clearable) return null

      const icon = !this.isDirty
        ? false
        : 'clear'

      if (this.clearIconCb) deprecate(':clear-icon-cb', '@click:clear', this)

      return this.genSlot('append', 'inner', [
        this.genIcon(
          icon,
          (!this.$listeners['click:clear'] && this.clearIconCb) || this.clearableCallback,
          false
        )
      ])
    },
    genCounter () {
      if (this.counter === false || this.counter == null) return null

      const max = this.counter === true ? this.$attrs.maxlength : this.counter

      return this.$createElement(VCounter, {
        props: {
          dark: this.dark,
          light: this.light,
          max,
          value: this.counterValue
        }
      })
    },
    genDefaultSlot () {
      return [
        this.genTextFieldSlot(),
        this.genClearIcon(),
        this.genIconSlot(),
        this.genProgress()
      ]
    },
    genLabel () {
      if (!this.showLabel) return null

      const data = {
        props: {
          absolute: true,
          color: this.validationState,
          dark: this.dark,
          disabled: this.disabled,
          focused: !this.isSingle && (this.isFocused || !!this.validationState),
          left: this.labelPosition.left,
          light: this.light,
          right: this.labelPosition.right,
          value: this.labelValue
        },
        ref: 'label'
      }

      if (this.$attrs.id) data.props.for = this.$attrs.id

      return this.$createElement(VLabel, data, this.$slots.label || this.label)
    },
    genInput () {
      const listeners = Object.assign({}, this.$listeners)
      delete listeners['change'] // Change should not be bound externally

      const data = {
        class: {
          'mt-1': true
        },
        style: {
          width: '100%',
          zIndex: 0
        },
        props: {
          options: {
            ...this.options,
            readOnly: this.disabled
          },
          value: this.lazyValue
        },
        ref: 'input'
      }

      if (this.placeholder) data.attrs.placeholder = this.placeholder

      return this.$createElement(codemirror, data)
    },
    genMessages () {
      if (this.hideDetails) return null

      return this.$createElement('div', {
        staticClass: 'v-text-field__details'
      }, [
        VInput.options.methods.genMessages.call(this),
        this.genCounter()
      ])
    },
    genTextFieldSlot () {
      return this.$createElement('div', {
        staticClass: 'v-text-field__slot'
      }, [
        this.genLabel(),
        this.prefix ? this.genAffix('prefix') : null,
        this.genInput(),
        this.suffix ? this.genAffix('suffix') : null
      ])
    },
    genAffix (type) {
      return this.$createElement('div', {
        'class': `v-text-field__${type}`,
        ref: type
      }, this[type])
    },
    onBlur () {
      this.isFocused = false
      // Reset internalChange state
      // to allow external change
      // to persist
      this.internalChange = false

      this.$emit('blur', ...arguments)
    },
    onFocus () {
      if (!this.editor) return

      if (document.activeElement !== this.editor.getInputField()) {
        return this.editor.focus()
      }

      if (!this.isFocused) {
        this.isFocused = true
        this.$emit('focus', ...arguments)
      }
    },
    onInput () {
      this.internalChange = true
      this.internalValue = this.editor.getValue()
      // TODO What’s validity? => https://developer.mozilla.org/en-US/docs/Web/API/ValidityState
      // this.badInput = e.target.validity && e.target.validity.badInput
    }
  }
})
