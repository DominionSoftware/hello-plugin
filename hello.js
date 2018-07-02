// A test of an OHIFPlugin

class HelloPlugin extends OHIFPlugin {

  constructor(options={}) {
    super();
    this.name = "HelloPlugin";
    this.description = "Hello OHIF Plugin";

  }

  setup() {
    document.open();
    document.write('<div id=app>Hello OHIF</div>');
    schemaformDemo();
  }

}

OHIFPlugin.entryPoints["HelloPlugin"] = function() {
  let hello = new HelloPlugin();
  hello.setup();
}
