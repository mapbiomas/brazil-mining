var PostClassification = function (image) {
    this.init = function (image) {
      this.image = image;
    };
    

    var majorityFilter = function (image, params) {
      params = ee.Dictionary(params); 
      var maxSize = ee.Number(params.get('maxSize'));
      var classValue = ee.Number(params.get('classValue'));
  

      var classMask = image.eq(classValue);
      var labeled = classMask.mask(classMask).connectedPixelCount(maxSize, true);
  
      var region = labeled.lt(maxSize);
  
      // Squared kernel with size shift 1
      // [[p(x-1,y+1), p(x,y+1), p(x+1,y+1)]
      // [ p(x-1,  y), p( x,y ), p(x+1,  y)]
      // [ p(x-1,y-1), p(x,y-1), p(x+1,y-1)]
      var kernel = ee.Kernel.square(1);
      var neighs = image.neighborhoodToBands(kernel).mask(region);
      var majority = neighs.reduce(ee.Reducer.mode());
      var filtered = image.where(region, majority);
      return filtered.byte();
  
    };
  
    /**
     * Reclassify small blobs of pixels  
     * @param  {list<dictionary>} filterParams [{classValue: 1, maxSize: 3},{classValue: 2, maxSize: 5}]
     * @return {ee.Image}  Filtered Classification Image
     */
    this.spatialFilter = function (filterParams) {
  
      var image = ee.List(filterParams)
      /**
       * Iterate an algorithm over a list. The algorithm is expected to take two objects, 
       * the current list item, and the result from the previous iteration or the value of first for the first iteration(in this case this.image)
       */
        .iterate(
          function (params, image) {
            return majorityFilter(ee.Image(image), params);
          },
          this.image
        );
  
      this.image = ee.Image(image);
  
      return this.image;
  
    };
    this.init(image);
  };
  
/// Main CODE
var userEEProject='USER_PROJECT_ID'

var ROI = ee.Geometry.Polygon(
  [
      [
          [-75.46319738935682, 6.627809464162168],
          [-75.46319738935682, -34.62753178950752],
          [-32.92413488935683, -34.62753178950752],
          [-32.92413488935683, 6.627809464162168]
      ]
  ], null, false
);


var versionFT = 1;
var versionSF = 2;
var year      = 2023 // example
var classificationId =  'projects/'+userEEProject+'/assets/LANDSAT/MINERACAO/unet_ft/ft_1_BR_v'+versionFT+'_'+year;

var classification = ee.Image(classificationId);
var palette = require('users/mapbiomas/modules:Palettes.js').get('classification5');
var visClassification = {
    'min': 0,
    'max': 45,
    'palette': palette,
    'format': 'png'
};

Map.centerObject(classification,10)
Map.addLayer(classification, visClassification, 'Prediction');
var miningClass = classification.eq(30)
Map.addLayer(miningClass.mask(miningClass).connectedPixelCount(10, true))

var filterParams = [
    {classValue: 10, maxSize: 10},
];

var pc = new PostClassification(classification);

var filtered = pc.spatialFilter(filterParams);

Map.addLayer(filtered.reproject('EPSG:4326', null, 30), visClassification, 'Filtered');


Export.image.toAsset({
    image: filtered, 
    description: 'spatial-filtered', 
    assetId: 'projects/'+userEEProject+'assets/LANDSAT/MINERACAO/unet_fs/'+year+'-'+versionSF+'-fs',
    pyramidingPolicy: {'.default': 'mode'},
    region: geometry, 
    scale: 30, 
    maxPixels: 1e13
});
