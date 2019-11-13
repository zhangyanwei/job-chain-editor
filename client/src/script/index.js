{

  function trap(obj, props, defaultValue) {
    let v = obj
    for (const p of props) {
      v = v[p]
      if (!v) {
        return defaultValue || v
      }
    }
    return v
  }

  Object.findProperty = (obj, path, defaultValue) => {
    if (obj) {
      return trap(obj, typeof (path) == 'string' ? path.split('.') : path, defaultValue)
    }

    return defaultValue
  }

  Object.findFirstProperty = (obj, pathes, defaultValue) => {
    for (const path of pathes) {
      const value = Object.findProperty(obj, path)
      if (!!value) {
        return value 
      }
    }
    return defaultValue
  }

  Object.strip = (data, callback) => {
    return Object.fromEntries(Object.entries(data).filter(([key, value]) => !callback.call(data, key, value)))
  }

  Object.stripTemplate = (data, template) => {
    // -> The left items should be:
    //    1). Exists in the template, but value doesn't equal;
    //    2). Not exists in the template and the value is null or empty.
    return Object.entries(data).filter(([key, value]) => {
      return (template[key] && template[key] != value) || (!template[key] && (value != undefined || value !== ''))
    }).reduce((ret, [key, value]) => {
      ret[key] = value
      return ret
    }, {})
  }

  Object.stripUndefined = (data) => {
    return Object.strip(data, (_, value) => !value)
  }

  Object.renameProperties = (obj, propertymap) => {
    return Object.entries(obj).reduce((r, [key, value]) => {
      const renamed = propertymap[key]
      if (renamed) {
        r[renamed] = value
      }
      return r
    }, {})
  }

  Array.prototype.replace = function (oldItem, newItem) {
    let copy = this.slice(0)
    const idx = copy.indexOf(oldItem)
    if (idx > -1) {
      copy.splice(idx, 1, newItem)
    }
    return copy
  }

  Array.prototype.remove = function (predicate) {
    for(let i = this.length - 1; i >= 0 ; i--){
      if(predicate(this[i], i, this)){
        this.splice(i, 1);
      }
    }
  }

  Array.prototype.count = function (predicate) {
    let count = 0
    for (let i = 0; i < this.length; i++) {
      predicate(this[i], i, this) && count++
    }
    return count
  }

  String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1)
  }

  /* function to save JSON to file from browser
   * adapted from http://bgrins.github.io/devtools-snippets/#console-save
   * @param {Object} data -- json object to save
   * @param {String} file -- file name to save to 
   */
  Window.downloader = new Function()
  Window.downloader.save = function (data, filename='data', type='text/json') {
    if (!data) {
      return;
    }

    if (typeof data === "object") {
      data = JSON.stringify(data, undefined, 4)
    }

    var blob = new Blob([data], { type: type }),
      e = new MouseEvent('click', {bubbles: true, cancelable: false}),
      a = document.createElement('a')

    a.download = filename
    a.href = window.URL.createObjectURL(blob)
    a.dataset.downloadurl = [type, a.download, a.href].join(':')
    a.dispatchEvent(e)
  }

}
