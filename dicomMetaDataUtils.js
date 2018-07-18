

// Note on computing orientation, from David Clunie, recognized DICOM expert
/*David Clunie

8/9/00

Hi Dave
I agree that (0018,0088) Spacing Between Slices, used in the MR & NM
images (but not in CT images, unless one is extending the SOP
Class) is the distance between the centers of the slices (and
most definitely not between the edges of the slices, i.e. it is
not the gap as some buggy implementations have sent in the past).

However I do not agree that (0018,0050) Slice Thickness, which
occurs in the image plane module and is used in both CT and MR,
is necessarily related to collimation. It is defined only as
"nominal slice thickness".

In the case of helical CT for example, the reconstructed slice
thickness is not necessarily directly related to the collimation
of the X-ray beam. Same applies to multi-planar reconstructions.
It is clearly more appropriate to send the reconstructed thickness
of the slice in these cases than the collimator aperture. They may
be the same, but not always.

The same attribute used in MR also obviously needs to be the
reconstructed thickness, since there is no other thickness to
send.

Finally, depending on (0018,0088) Spacing Between Slices is not
a good idea, since it isn't sent for CT normally, and it isn't
always right in MR images, and it is always wrong when one is
changing spacing on the fly, e.g. going from 10 to 5mm spacing
and back again, what spacing to use for the boundary slices ?

It is always better to compute the distance between a pair of
slices along a normal to the plane of the image specified by
the Image Orientation (Patient) attribute, by projecting the
top left hand corner position specified by the Image Position
(Patient) attribute onto that normal. These attributes are
always sent and much more often "right" than is (0018,0088).

Also, never use Slice Location (0020,1041) for this purpose ...
it is purely descriptive and often empty, wrong or useless
for anything other than trying to reproduce a manufacturer's
native annotation on the display or film.

What you describe sounds like doing an MPR, in which case you
should recompute the two parameters based on whatever the
thickness and spacing of your reconstructions are, and not
just reuse the original parameters.

david

 */

function sum(array){
    let sum = 0;
    for(let i = 0; i < array.length; i++){
        sum += array[i];
    }
    return sum;
}
function mean(array){
    return sum(array) / array.length;
}

function diff(array){
    let resultArray = [];
    for(let i = 1; i < array.length; i++){
        resultArray.push(array[i] - array[i-1]);
    }
    return resultArray;
}


 class DicomMetaDataUtils {

    constructor(options = {}) {

        this.orientation = undefined;
        this.sliceArray= [];
    }

     determineOrientation(v){

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

    determineOrientationIndex() {
        var o = this.orientation;
        var index = undefined;
        switch(o) {
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

    computeSliceVectors(imageIDsAndMetaData) {

        let md0 = imageIDsAndMetaData.md;
        let cc = md0.imagePlane.columnCosines;
        let rc = md0.imagePlane.rowCosines;


        let cp = cc.crossVectors(cc, rc);
        determineOrientation(cp);

        let index = determineOrientationIndex();
        // use this array to determine spacing, and missing slices....
        let ippArray = [];

        for (i = 0; i < imageIDsAndMetaData.length; i++) {
            // compute the spacing along the orthogonal axis
            let metaForImage = imageIDsAndMetaData.md);
            let ipp = metaForImage.imagePlane.imagePositionPatient;
            if (index === 0) {
                ippArray.push(ipp.x);
            } else if (index === 1){
                ippArray.push(ipp.y);
            } else {
                ippArray.push(ipp.z);
            }
        }

        console.log(ippArray);
        ippArray.sort(function(a, b){return a - b;});
        let meanSpacing = mean(diff(ippArray));

        console.log(meanSpacing);


    }


    makeSlices(numSlices,ipp,spacingX,spacingY,spacingZ,orientation,iop){

        let newIPP = copyVector(ipp);
        for(let i = 0; i < numSlices; i++){
            let s = new MPRSlice();
            s.setImagePositionPatient(newIPP);
            switch(orientation){
                case 'L':
                case 'R':
                    newIPP.x = newIPP.x + spacingX;
                    break;
                case 'I':
                case 'S':
                    newIPP.z = newIPP.z + spacingZ;
                    break;
                case 'A':
                case 'P':
                    newIPP.y = newIPP.y + spacingY;
                    break;
            }

            s.setZSpacing(spacingZ);
            s.setYSpacing(spacingY);
            s.setXSpacing(spacingX);
            s.setOrientation(orientation);
            s.setImageOrientationPatient(iop);
            sliceArray.push(s);
        }

    }
}


module.exports = DicomMetaDataUtils;