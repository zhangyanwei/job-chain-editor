// This file is for global mutation types.
// As the documentation described, should define the mutation types in one file to avoid the conflicts.
// 'By default, actions, mutations and getters inside modules are still registered under the global namespace 
// - this allows multiple modules to react to the same mutation/action type.'

export const GET_CONFIGURATIONS = 'getConfigurations'
export const GET_CONFIGURATION = 'getConfiguration'
export const GET_STEP_INDICES = 'getStepIndices'
export const GET_EVENT_HANDLER_INDICES = 'getEventHandlerIndices'
export const UPDATE = 'update'
export const UPDATE_OBJECT = 'updateObject'
export const CLEAR_MESSAGE = 'clearMessage'
export const SHOW_MESSAGE = 'showMessage'
export const SHOW_SUCCESS = 'showSuccess'
export const SHOW_INFO = 'showInfo'
export const SHOW_WARNING = 'showWarning'
export const SHOW_ERROR = 'showError'

export const GET_REPOSITORIES = 'getRepositories'
