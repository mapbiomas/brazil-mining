var getImageCollection = function(firstYear, lastYear, userEEProject, versionSF){
  var images = ee.List([]);
  for(var i = firstYear; i < lastYear; i++){
    images = images.add(ee.Image('projects/'+userEEProject+'assets/LANDSAT/MINERACAO/unet_fs/'+i+'-'+versionSF+'-fs'))
  }
  return ee.ImageCollection(images)
}
/**
 * @Author Luiz Cortinhas
 * @Version 1
 * @Note this function aims apply the desired frequency filter to binarized image collection,
 * @Return ee.ImageCollection
**/
var filterPixelFrequency = function(firstYear, lastYear, userEEProject, imc,cutPercentage,classID){
  var temporalSeries = (lastYear - firstYear) + 1;
  var imcFreq = imc.map(function(e){ return e.eq(classID)}).sum().divide(temporalSeries).multiply(100); //Frequency Image
  var filteredImages= ee.List([]);
  Map.addLayer(imcFreq,{min:0,max:100,palette:['fff9f9','ff0000','efff00','27ff00','ef00ff']},'Freq -'+classID)
  for(var i = firstYear; i < lastYear; i++){
    var image = ee.Image('projects/'+userEEProject+'assets/LANDSAT/MINERACAO/unet_fs/'+i+'-'+versionSF+'-fs');
    image = image.updateMask(image.eq(classID)).where(imcFreq.lte(cutPercentage),0); 
    filteredImages = filteredImages.add(image)
  }
  return filteredImages
}

// MAIN CODE
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

var userEEProject ='USER_PROJECT_ID';
var versionSF     = 2;
var firstYear = 1985;
var lastYear  = 2024;
var classID   = 30;
var versionFF = 3;
var frequency = 10;
var imc       = getImageCollection(firstYear, lastYear, userEEProject, versionSF);


var year      = 2019;
var mosaic    = ee.Image('projects/'+userEEProject+'/assets/USER_PATH/mosaic_'+year);

Map.addLayer(mosaic,imageVisParam,'Mosaic '+year);


var mining = filterPixelFrequency(firstYear, lastYear, userEEProject, imc, frequency, classID);
var mining = ee.ImageCollection(mining).filterMetadata('year','equals',year).mosaic().unmask(0);

Map.addLayer(mining,{max:30},'Class Mining - '+year);

Export.image.toAsset({
  image: mining.rename('classification').toByte().set({'theme':'MINERACAO','year':year,'version':versionFF}),
  description:year + '-' + versionFF+'-FF',
  assetId: 'projects/'+userEEProject+'/assets/LANDSAT/MINERACAO/unet_ff/' + year + '-' + versionFF,
  scale: 30,
  maxPixels:1e13,
  pyramidingPolicy: {'.default': 'mode'},
  region: ROI
});
