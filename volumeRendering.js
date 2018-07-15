// A test of an OHIFPlugin

try {
  VolumeRenderingPlugin
} catch (error) {
  console.log(error);
}


function* getPromises(a) {
    for(let i = 0; i < a.length; i++)
    {
        yield a[i];
    }
}


VolumeRenderingPlugin = class VolumeRenderingPlugin extends OHIFPlugin {

  constructor(options={}) {
    super();
    this.name = "VolumeRenderingPlugin";
    this.description = "VolumeRendering OHIF Plugin";
  }

  setup() {

    // reset the div that will hold this plugin
    // - remove old ones
    // - add a new one with our id
    let pluginDiv;
    while (pluginDiv = document.getElementById('volumeRenderingPlugin')) {
      pluginDiv.parentNode.removeChild(pluginDiv);
    }
    pluginDiv = document.createElement("div");
    pluginDiv.id = "volumeRenderingPlugin";

    // TODO: need a better way for OHIF to tell us what container to take over
    const parent = document.querySelector(".viewportContainer");

    const element = $('.imageViewerViewport').get(Session.get('activeViewport'))
    const imageIds = cornerstoneTools.getToolState(element, 'stack').data[0].imageIds;

    parent.innerHTML = "";
    parent.appendChild(pluginDiv);

    let loadImagePromises = [];
    for(let imageId of imageIds){
       cornerstone.imageCache.imageCache[imageId];
       loadImagePromises.push(cornerstone.loadAndCacheImage(imageId));
    }
    const values = getPromises(loadImagePromises);

    for(let j = 0; j < loadImagePromises.length; j++) {
        values.next().value.then(function(result) {
            console.log(result);
        }).catch(function (err){
            console.log(err);
        });
    }

    /*
    Promise.all(loadImagePromises).then(images => {

      let datasets = [];
      images.forEach(image => {
        let arrayBuffer = image.data.byteArray.buffer;
        let dicomData = dcmjs.data.DicomMessage.readFile(arrayBuffer);
        let dataset = dcmjs.data.DicomMetaDictionary.naturalizeDataset(dicomData.dict);
        dataset._meta = dcmjs.data.DicomMetaDictionary.namifyDataset(dicomData.meta);
        datasets.push(dataset);
      });

      let multiframeDataset = dcmjs.normalizers.Normalizer.normalizeToDataset(datasets);

      this.installVTKVolumeRenderer(pluginDiv, multiframeDataset)
    });
  }

  installVTKVolumeRenderer (container, dataset) {

    //
    // create a new vtkImageData from the dicom dataset
    //
    let imageData = vtk.Common.DataModel.vtkImageData.newInstance()
    imageData.setDimensions([dataset.Columns, dataset.Rows, dataset.NumberOfFrames]);
    let measures = dataset.SharedFunctionalGroupsSequence.PixelMeasuresSequence;
    imageData.setSpacing([
      measures.PixelSpacing[1],
      measures.PixelSpacing[0],
      measures.SpacingBetweenSlices
    ]);
    // TODO: set origin from ImagePosition
    // TODO: set directions from ImageOrientation


    // set the scalar array from the pixel data
    // TODO: map the DataRepresentation and PixelsAllocated to vtk scalar types
    let pixelArray = new Uint16Array(dataset.PixelData);
    let scalarArray = vtk.Common.Core.vtkDataArray.newInstance({
      name: "Pixels",
      numberOfComponents: dataset.SamplesPerPixel,
      values: pixelArray,
    });
    imageData.getPointData().setScalars(scalarArray);

    //
    // Create a volume rendering context
    //
    const volumeViewer = vtk.Rendering.Misc.vtkGenericRenderWindow.newInstance({
      background: [0, 0, 0],
    });
    volumeViewer.setContainer(container);
    const renderer = volumeViewer.getRenderer();
    const renderWindow = volumeViewer.getRenderWindow();
    renderWindow.render();

    const mapper = vtk.Rendering.Core.vtkVolumeMapper.newInstance();
    mapper.setSampleDistance(1.0);
    mapper.setInputData(imageData);

    const actor = vtk.Rendering.Core.vtkVolume.newInstance();
    actor.setMapper(mapper);

    // create color and opacity transfer functions
    const ctfun = vtk.Rendering.Core.vtkColorTransferFunction.newInstance();
    ctfun.addRGBPoint(200.0, 0.4, 0.2, 0.0);
    ctfun.addRGBPoint(2000.0, 1.0, 1.0, 1.0);
    const ofun = vtk.Common.DataModel.vtkPiecewiseFunction.newInstance();
    ofun.addPoint(200.0, 0.0);
    ofun.addPoint(1200.0, 0.5);
    ofun.addPoint(3000.0, 0.8);
    actor.getProperty().setRGBTransferFunction(0, ctfun);
    actor.getProperty().setScalarOpacity(0, ofun);
    actor.getProperty().setScalarOpacityUnitDistance(0, 4.5);
    actor.getProperty().setInterpolationTypeToLinear();
    actor.getProperty().setUseGradientOpacity(0, true);
    actor.getProperty().setGradientOpacityMinimumValue(0, 15);
    actor.getProperty().setGradientOpacityMinimumOpacity(0, 0.0);
    actor.getProperty().setGradientOpacityMaximumValue(0, 100);
    actor.getProperty().setGradientOpacityMaximumOpacity(0, 1.0);
    actor.getProperty().setShade(true);
    actor.getProperty().setAmbient(0.2);
    actor.getProperty().setDiffuse(0.7);
    actor.getProperty().setSpecular(0.3);
    actor.getProperty().setSpecularPower(8.0);

    // TODO - expose transfer function editor
//
  //  const controllerWidget = vtk.Interaction.UI.vtkVolumeController.newInstance({
   //   size: [400, 150],
   //   rescaleColorMap: true,
  //  });
 //   controllerWidget.setContainer(container);
  //  controllerWidget.setupContent(renderWindow, actor);
  //

    renderer.addVolume(actor);
    renderer.resetCamera();
    renderer.getActiveCamera().zoom(1.5);
    renderer.getActiveCamera().elevation(70);
    renderer.updateLightsGeometryToFollowCamera();
    renderWindow.render();
  }
*/

};

OHIFPlugin.entryPoints["VolumeRenderingPlugin"] = function() {
  let volumeRendering = new VolumeRenderingPlugin();
  volumeRendering.setup();
};
