// A test of an OHIFPlugin

try {
    VolumeRenderingPlugin
} catch (error) {
    let VolumeRenderingPlugin;
}


//TODO separate file? How to do.
/*************************************************************************************************************************/

function sum(array) {
    let sum = 0;
    for (let i = 0; i < array.length; i++) {
        sum += array[i];
    }
    return sum;
}

function mean(array) {
    return sum(array) / array.length;
}

function diff(array) {
    let resultArray = [];
    for (let i = 1; i < array.length; i++) {
        resultArray.push(array[i] - array[i - 1]);
    }
    return resultArray;
}


class DicomMetaDataUtils {

    constructor() {

    }

    static determineOrientation(v) {

        let axis = undefined;
        const oX = v.x < 0 ? 'R' : 'L';
        const oY = v.y < 0 ? 'A' : 'P';
        const oZ = v.z < 0 ? 'I' : 'S';

        const aX = Math.abs(v.x);
        const aY = Math.abs(v.y);
        const aZ = Math.abs(v.z);
        const obliqueThreshold = 0.8;
        if (aX > obliqueThreshold && aX > aY && aX > aZ) {
            axis = oX;
        }
        else if (aY > obliqueThreshold && aY > aX && aY > aZ) {
            axis = oY;
        }
        else if (aZ > obliqueThreshold && aZ > aX && aZ > aY) {
            axis = oZ;
        }
        this.orientation = axis;
        return axis;
    }

    static determineOrientationIndex(orientation) {
        var o = orientation;
        var index = undefined;
        switch (o) {
            case 'A':
            case 'P':
                index = 1;
                break;
            case 'L':
            case 'R':
                index = 0;
                break;
            case 'S':
            case 'I':
                index = 2;
                break;
            default:
                console.assert(false, " OBLIQUE NOT SUPPORTED");
                break;
        }
        return index;
    }

    static computeZAxisSpacing(orientation, metaData) {
        vst ippArray = [];
        let index = determineOrientationIndex(orientation);

        for (let i = 0; i < metaData.length; i++) {
            let ipp = metaData.imagePlane.imagePositionPatient;
            if (index === 0) {
                ippArray.push(ipp.x);
            } else if (index === 1) {
                ippArray.push(ipp.y);
            } else {
                ippArray.push(ipp.z);
            }
        }

        ippArray.sort(function (a, b) {
            return a - b;
        });
        let meanSpacing = mean(diff(ippArray));

        console.log(meanSpacing);
        return meanSpacing;
    }
}

/*************************************************************************************************************************/

function* getPromisesGenerator(a) {
    for (let i = 0; i < a.length; i++) {
        yield a[i];
    }
}


VolumeRenderingPlugin = class VolumeRenderingPlugin extends OHIFPlugin {

    constructor(options = {}) {
        super();
        this.name = "VolumeRenderingPlugin";
        this.description = "VolumeRendering OHIF Plugin";
        this.volumeViewer = vtk.Rendering.Misc.vtkGenericRenderWindow.newInstance({
            background: [0, 0, 0],
        });
        this.mapper = vtk.Rendering.Core.vtkVolumeMapper.newInstance();

        this.actor = vtk.Rendering.Core.vtkVolume.newInstance();
        this.actor.setMapper(this.mapper);

        // create color and opacity transfer functions
        this.ctfun = vtk.Rendering.Core.vtkColorTransferFunction.newInstance();
        this.ctfun.addRGBPoint(200.0, 0.4, 0.2, 0.0);
        this.ctfun.addRGBPoint(2000.0, 1.0, 1.0, 1.0);
        this.ofun = vtk.Common.DataModel.vtkPiecewiseFunction.newInstance();
        this.ofun.addPoint(200.0, 0.0);
        this.ofun.addPoint(1200.0, 0.5);
        this.ofun.addPoint(3000.0, 0.8);
        this.actor.getProperty().setRGBTransferFunction(0, this.ctfun);
        this.actor.getProperty().setScalarOpacity(0, this.ofun);
        this.actor.getProperty().setScalarOpacityUnitDistance(0, 4.5);
        this.actor.getProperty().setInterpolationTypeToLinear();
        this.actor.getProperty().setUseGradientOpacity(0, true);
        this.actor.getProperty().setGradientOpacityMinimumValue(0, 15);
        this.actor.getProperty().setGradientOpacityMinimumOpacity(0, 0.0);
        this.actor.getProperty().setGradientOpacityMaximumValue(0, 100);
        this.actor.getProperty().setGradientOpacityMaximumOpacity(0, 1.0);
        this.actor.getProperty().setShade(true);
        this.actor.getProperty().setAmbient(0.2);
        this.actor.getProperty().setDiffuse(0.7);
        this.actor.getProperty().setSpecular(0.3);
        this.actor.getProperty().setSpecularPower(8.0);
        this.imageData = vtk.Common.DataModel.vtkImageData.newInstance();
    }

    setup() {

        var installed = false;
        var self = this;
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

        const element = $('.imageViewerViewport').get(Session.get('activeViewport'));
        const imageIds = cornerstoneTools.getToolState(element, 'stack').data[0].imageIds;
        debugger;
        ///////////////////////////////////////////////////////
        // Compute the image size and spacing given the meta data we already have available.
        var metaDataArray = [];
        for (let i = 0; i < imageIds.length; i++) {
            var md = cornerstone.metaData.get('imagePlane', imageIds[i]);
            metaDataArray.push(md);
        }

        let metaData0 = metaDataArray[0];
        let cc = metaData0.columnCosines;
        let rc = metaData0.rowCosines;
        let cp = cc.crossVectors(cc, rc);
        let o = DicomMetaDataUtils.determineOrientation(cp);


        let xSpacing = metaData0.xSpacing;
        let ySpacing = metaData0.ySpacing;


        let zSpacing = DicomMetaDataUtils.computeZAxisSpacing(o, metaDataArray);
        let xVoxels = metaData0.Columns;
        let yVoxels = metaData0.Rows;
        let zVoxels = metaDataArray.length;

        this.imageData.setDimensions([xVoxels, yVoxels, zVoxels]);

        this.imageData.setSpacing([xSpacing, ySpacing, zSpacing]);
        // let pixelArray = new Uint16Array(dataset.PixelData);
        // let scalarArray = vtk.Common.Core.vtkDataArray.newInstance({
        //     name: "Pixels",
        //     numberOfComponents: metaData0.SamplesPerPixel,
        //     values: pixelArray,
        // });

        ///////////////////////////////////////////////////////

        parent.innerHTML = "";
        parent.appendChild(pluginDiv);

        // Q up the promises.
        let loadImagePromises = [];
        for (let imageId of imageIds) {
            cornerstone.imageCache.imageCache[imageId];
            loadImagePromises.push(cornerstone.loadAndCacheImage(imageId));
        }

        // This generator provides a "one at a time" paused iterator.
        const generator = getPromisesGenerator(loadImagePromises);
        let datasets = [];
        let partialDatasets = [];
        let remainderDatasets = [];
        var datasetsReceived = 0;
        const TotalNumberOfDatasets = loadImagePromises.length;
        const NumberInPartialSet = 15;
        let nxt = generator.next();
        while (nxt.done === false) {
            nxt.value.then(function (result) {
                // make a dataset
                let arrayBuffer = result.data.byteArray.buffer;
                let dicomData = dcmjs.data.DicomMessage.readFile(arrayBuffer);
                let dataset = dcmjs.data.DicomMetaDictionary.naturalizeDataset(dicomData.dict);
                dataset._meta = dcmjs.data.DicomMetaDictionary.namifyDataset(dicomData.meta);

                // see if we are close to the end, use the remainder array..
                if (TotalNumberOfDatasets - datasetsReceived < NumberInPartialSet) {
                    datasets = datasets.push(dataset);
                    console.log("remainderDatasets - push");
                    let multiframeDataset = dcmjs.normalizers.Normalizer.normalizeToDataset(datasets);
                    if (installed === false) {
                        installed = true;
                        self.installVTKVolumeRenderer(pluginDiv, multiframeDataset)
                    }
                    else {
                        self.updateVTKVolumeRenderer(multiframeDataset);
                    }
                }
                else {
                    partialDatasets.push(dataset);
                }
                datasetsReceived++;
                console.log("images received " + datasetsReceived);

                // see if we have number of partial sets of images in the partialDatasets...
                if (partialDatasets.length >= NumberInPartialSet) {
                    datasets = datasets.concat(partialDatasets);
                    partialDatasets = [];

                    let multiframeDataset = dcmjs.normalizers.Normalizer.normalizeToDataset(datasets);
                    if (installed === false) {
                        installed = true;
                        self.installVTKVolumeRenderer(pluginDiv, multiframeDataset)
                    }
                    else {

                        self.updateVTKVolumeRenderer(multiframeDataset);
                    }
                    console.log("Rendering images");
                }


            }).catch(function (err) {
                console.log(err);
            });
            nxt = generator.next();
        }
    }

    updateVTKVolumeRenderer(dataset) {
        let imageData = vtk.Common.DataModel.vtkImageData.newInstance();
        imageData.setDimensions([dataset.Columns, dataset.Rows, dataset.NumberOfFrames]);
        let measures = dataset.SharedFunctionalGroupsSequence.PixelMeasuresSequence;
        imageData.setSpacing([
            measures.PixelSpacing[1],
            measures.PixelSpacing[0],
            measures.SpacingBetweenSlices
        ]);

        let pixelArray = new Uint16Array(dataset.PixelData);
        let scalarArray = vtk.Common.Core.vtkDataArray.newInstance({
            name: "Pixels",
            numberOfComponents: dataset.SamplesPerPixel,
            values: pixelArray,
        });
        imageData.getPointData().setScalars(scalarArray);
        this.mapper.setInputData(imageData);
        const renderer = this.volumeViewer.getRenderer();
        const renderWindow = this.volumeViewer.getRenderWindow();
        renderWindow.render();
    }


    installVTKVolumeRenderer(container, dataset) {

        //
        // create a new vtkImageData from the dicom dataset
        //
        let imageData = vtk.Common.DataModel.vtkImageData.newInstance();
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

        this.volumeViewer.setContainer(container);


        this.mapper.setSampleDistance(1.0);
        this.mapper.setInputData(imageData);
        const renderer = this.volumeViewer.getRenderer();
        const renderWindow = this.volumeViewer.getRenderWindow();
        renderWindow.render();


        // TODO - expose transfer function editor
        //
        //  const controllerWidget = vtk.Interaction.UI.vtkVolumeController.newInstance({
        //   size: [400, 150],
        //   rescaleColorMap: true,
        //  });
        //   controllerWidget.setContainer(container);
        //  controllerWidget.setupContent(renderWindow, actor);
        //

        renderer.addVolume(this.actor);
        renderer.resetCamera();
        renderer.getActiveCamera().zoom(1.5);
        renderer.getActiveCamera().elevation(70);
        renderer.updateLightsGeometryToFollowCamera();
        renderWindow.render();
    }


};

OHIFPlugin.entryPoints["VolumeRenderingPlugin"] = function () {
    let volumeRendering = new VolumeRenderingPlugin();
    volumeRendering.setup();
};

