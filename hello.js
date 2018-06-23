// A test of an OHIFPlugin

class HelloPlugin extends OHIFPlugin {

  constructor(options={}) {
    super();
    this.name = "HelloPlugin";
    //this.url = "https://raw.githubusercontent.com/pieper/hello-plugin/master/hello.js";
    this.url = "http://localhost:8081/hello.js";
    this.url = options.url || this.url;
    this.description = "Hello OHIF Plugin";

    this.register();
  }

  setup() {
    alert('Hello OHIF');
  }

}

OHIFPlugin.finishReload("HelloPlugin", HelloPlugin);
