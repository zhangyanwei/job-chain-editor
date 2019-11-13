class CacheProxy {

  constructor() {
    this.cache = new Map();
  }

  __withAsyncCache(context, key) {
    context.key = key;
  }

  __apply(context, next) {
    let key = context.key;
    let cache = this.cache;
    if (cache.has(key)) {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(cache.get(key));
        });
      });
    } else {
      return next()
        .then(resp => {
          cache.set(key, resp);
          return resp;
        });
    }
  }
}

export default CacheProxy
