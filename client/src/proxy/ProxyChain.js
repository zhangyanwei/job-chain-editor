class ProxyChainInvoker {
  constructor(plugins, context) {
    this.plugins = plugins;
    this.context = context;
    this.index = 0;
  }

  doNext(target, that, args) {
    if (this.index < this.plugins.length) {
      const [, plugin] = this.plugins[this.index++];
      const func = plugin.__apply;
      return func.call(plugin, this.context, () => {
        return this.doNext(target, that, args);
      });
    }
    return target.apply(that, args);
  }
}

class ProxyChain {
  constructor(target, plugins) {
    this.target = target;
    this.plugins = this.initPlugins(plugins);
  }

  initPlugins(plugins) {
    const initedPlugins = new Array();
    for (const [name, plugin] of Object.entries(plugins)) {
      initedPlugins.push([
        name,
        typeof plugin == "function" ? new plugin() : plugin
      ]);
    }
    return initedPlugins;
  }

  findConfiguers(prop) {
    return this.plugins.filter(([, plugin]) => {
      const configuer = plugin[prop];
      return !!configuer && typeof configuer == "function";
    });
  }

  newInvoker(context) {
    return new ProxyChainInvoker(this.plugins, context);
  }
  
  handlerTemplate(context = null) {
    const chain = this;
    return {
      get(target, prop, receiver) {
        if (prop == "__context") {
          return context;
        }
        const configuers = chain.findConfiguers(prop);
        const c = receiver.__context || {};
        if (configuers.length > 0) {
          return (...args) => {
            // call all configuer functions if exists
            for (const [, plugin] of configuers) {
              plugin[prop].call(plugin, c, ...args);
            }
            return new Proxy(target, chain.handlerTemplate(c));
          };
        }

        const attr = target[prop];
        if (typeof attr === "function") {
          return new Proxy(attr, {
            apply(target, that, args) {
              // invoke the target in a new chain.
              // return target.apply(that, args);
              return chain.newInvoker(c).doNext(target, that, args);
            }
          });
        }
        return Reflect.get(...arguments);
      }
    };
  }

  static proxy(target, plugins) {
    const chain = new ProxyChain(target, plugins);
    return new Proxy(target, chain.handlerTemplate());
  }
}

export default ProxyChain.proxy
