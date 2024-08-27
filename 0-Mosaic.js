/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var studyArea = 
    /* color: #d63000 */
    /* shown: false */
    ee.Geometry.Polygon(
        [[[-71.00835260826572, -11.117331185202277],
          [-57.97583348835412, -30.905191432920848],
          [-52.85303719493945, -33.5841528462806],
          [-44.45089307475926, -23.44228035927431],
          [-34.09554520066254, -18.745144367590875],
          [-34.31133118082042, -1.2745199802692286],
          [-50.943448198150875, 4.630467749575895],
          [-64.56209050339555, 4.191545695503911],
          [-69.6201393213597, 2.3523609434138266],
          [-74.17617841784467, -7.208878365159751]]]),
    imageVisParam = {"opacity":1,"bands":["swir1","nir","red"],"min":8.03986793383956,"max":100.43508589267731,"gamma":1};
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var grid = ee.FeatureCollection('users/cesargdiniz/Grid_Mining')
function getImageCollection(studyArea,startDate,endDate){
  var ls;var l4TOAs;var l5TOAs;var l7TOAs;var l8TOAs;var out;
  
  var sensorBandDictLandsatTOA = ee.Dictionary({
    L9 : ee.List([1,2,3,4,5,6,'QA_PIXEL']),
    L8 : ee.List([1,2,3,4,5,6,'QA_PIXEL']),
    L7 : ee.List([0,1,2,3,4,"B7",'QA_PIXEL']),
    L5 : ee.List([0,1,2,3,4,6,'QA_PIXEL'])
  });
  var bandNamesLandsatTOA = ee.List(['blue','green','red','nir','swir1','temp','swir2','BQA']);
    
  l5TOAs = ee.ImageCollection('LANDSAT/LT05/C02/T1_TOA')
      .filterDate(startDate,endDate)
      .filterBounds(studyArea)
      .select(sensorBandDictLandsatTOA.get('L5'),bandNamesLandsatTOA);
  l7TOAs = ee.ImageCollection('LANDSAT/LE07/C02/T1_TOA')
      .filterDate(startDate,endDate)
      .filterBounds(studyArea)
      .select(sensorBandDictLandsatTOA.get('L7'),bandNamesLandsatTOA);
  l8TOAs = ee.ImageCollection('LANDSAT/LC08/C02/T1_TOA')
      .filterDate(startDate,endDate)
      .filterBounds(studyArea)
      .select(sensorBandDictLandsatTOA.get('L8'),bandNamesLandsatTOA);
  l9TOAs = ee.ImageCollection('LANDSAT/LC09/C02/T1_TOA')
      .filterDate(startDate,endDate)
      .filterBounds(studyArea)
      .select(sensorBandDictLandsatTOA.get('L9'),bandNamesLandsatTOA);
  
  if(year < 2014){
    ls = ee.ImageCollection(l5TOAs.merge(l7TOAs).merge(l8TOAs));
  }else{
    ls = ee.ImageCollection(l8TOAs).merge(l9TOAs);
  }
  return ls
}

var bqaFunction = function(image){
    var val = ee.Algorithms.If(ee.String(image.get('SPACECRAFT_ID')).compareTo(ee.String('LANDSAT_8')),672,2720)
    //image  = image.mask(image.select('BQA').eq(ee.Number(val)))
    var dilatedCloud = 1 << 1
    var cloud = 1 << 3
    var shadown = 1 << 4 
    var qa = image.select('BQA')
    var mask = qa.bitwiseAnd(dilatedCloud).or(qa.bitwiseAnd(cloud)).or(qa.bitwiseAnd(shadown))
    return image.updateMask(mask.not());
  }

  var createIndexs = function(image) {
    var totalNitrate = null;
    var totalPhosphorus = null;
    var MNDWI = null;
    var NDVI = null;
    var NDWI = null;
    var MMRI = null;
    var NDSI = null;
      NDVI = image.expression(
        '(((banda4 - banda3)/(banda4 + banda3)))', {
          'banda4': image.select('nir'),
          'banda3': image.select('red')
      });
      NDSI = image.expression(
        '(((banda5 - banda4)/(banda4 + banda5)))', {
          'banda5': image.select('swir1'),
          'banda4': image.select('nir')
      });
      NDWI = image.expression(
        '((banda2 - banda4)/ (banda4 + banda2))', {
          'banda2' : image.select('green'),
          'banda4' : image.select('nir')
        
      });
      MNDWI = image.expression(
        '((( banda2 - banda5) / (banda2 + banda5)))', {
          'banda2': image.select('green'),
          'banda5': image.select('swir1'),
      });
      MMRI = image.expression(
        '(abs(MNDWI)-abs(NDVI))/(abs(MNDWI) + abs(NDVI))', {
          'MNDWI': MNDWI,
          'NDVI': NDVI,
    });
       //Gerando totalPhosphorus
      totalPhosphorus = image.expression(
        '2.71828**(-0.4081 -8.659*(1/(B3/B2)))', {
          'B2': image.select('green'),
          'B3': image.select('red')
      });
         //Gerando totalPhosphorus
      totalNitrate = image.expression(
        '2.71828**(8.228-2.713*(1/(B3+B2)))', {
          'B2': image.select('green'),
          'B3': image.select('red')
      });
      //Gerando MNDWI
      MNDWI = image.expression(
        '((( banda2 - banda5) / (banda2 + banda5)))', {
          'banda2': image.select('green'),
          'banda5': image.select('swir1'),
      });
      
    
   
    var maskedImage = image
      .addBands(NDVI.rename('NDVI'))
      .addBands(MNDWI.rename('MNDWI'))
      .addBands(NDSI.rename('NDSI'))
      .addBands(NDWI.rename('NDWI'))
      .addBands(MMRI.rename('MMRI'))
      .addBands(totalNitrate.rename('IM1'))
      .addBands(totalPhosphorus.rename('IM2'))
     return  maskedImage;
  };
/// Main CODE
var year = 1985;
var startDate = year+'-01-01';
var endDate = (year+1)+'01-01';
var mosaicMerge = getImageCollection(studyArea,startDate,endDate).map(createIndexs).map(bqaFunction);
var mosaic = mosaicMerge.median()//('NDVI');
var mosaicNew = mosaic.select(['swir2','swir1','nir','red','green','BQA']).multiply(255);
mosaicNew = mosaicNew.addBands(mosaic.select(['NDVI','MNDWI','MMRI','NDSI','NDWI']).add(1).multiply(127))
mosaicNew = mosaicNew.addBands(mosaic.visualize(['IM1'], null, null, 5.04893968546401e-7, 0.004990332819056622).rename('IM1'))
mosaicNew = mosaicNew.addBands(mosaic.visualize(['IM2'], null, null, 8.53118346494392e-9, 27.249109247040032).rename('IM2'))

var region = ee.Image(0).toByte().paint(grid,1)
mosaicNew = mosaicNew.mask(region)
Map.addLayer(mosaicNew,imageVisParam,'Mosaic')
Map.addLayer(grid,{},'Mineracao')
print(mosaicNew.toByte())
Export.image.toAsset({
  image:mosaicNew.toByte().set({'class':'Mining','Year':year,'mosaic':1}),
  description: 'Mining_Mosaic_indonesia_'+year,
  assetId:'projects/mapbiomas-workspace/TRANSVERSAIS/MINERACAO5/mosaic_'+year,
  region:studyArea,
  scale:30,
  maxPixels:1e13
})