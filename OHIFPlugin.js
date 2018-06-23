
class OHIFPlugin {
  // TODO: this class is here for development purposes.
  // Once it is fleshed out it would go in the OHIF
  // base deployment and be available for plugins
  // to inherit from.

  constructor () {
    this.name = "Unnamed OHIF Plugin";
    this.url = "";
    this.description = "A generic plugin";
  }

  set registry(registry) {
      window.localStorage.setItem("OHIFPluginRegistry", JSON.stringify(registry));
  }

  get registry() {
      return JSON.parse(window.localStorage.getItem("OHIFPluginRegistry")) || {};
  }

  register() {
    let ohifPlugins = this.registry;

    ohifPlugins[this.name] = {
      url: this.url,
      description: this.description,
      instantiatorClass: undefined,
      instance: undefined,
    }
    this.registry = ohifPlugins;
  }

  static finishReload(pluginName, instantiatorClass) {
    let ohifPlugins = this.registry || {};
    ohifPlugins[pluginName] = {};
    ohifPlugins[pluginName].instantiatorClass = instantiatorClass;
    ohifPlugins[pluginName].instance = new instantiatorClass();
    ohifPlugins[pluginName].instance.setup();
  }

  static reloadPlugin(plugin) {
    const script = document.createElement("script");
    script.src = plugin.url + "?" + performance.now();
    script.type = "text/javascript";
    const head = document.getElementsByTagName("head")[0];
    head.appendChild(script);

    console.log(`appended ${script}`);

    head.removeChild(script);
  }

  reloadPlugins() {
    let ohifPlugins = this.registry;
    Object.keys(ohifPlugins).forEach(plugin => {
      OHIFPlugin.reloadPlugin(plugin);
    });
  }

}

