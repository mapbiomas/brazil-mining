var datasetYear    = 2022;

var supervisedImg = ee.Image('projects/mapbiomas-workspace/COLECAO9/mineracao/'+str(mosaic_year)+'-5').gte(1).unmask(0).toByte();

var select_biome = 'amazonia'
var biomes_dict  = {'amazonia':{'flag':'amz'},
                    'cerrado':{'flag':'cerr'},
                    'caatinga':{'flag':'caatinga'},
                    'mata_atlantica':{'flag':'mata'},
                    'pampa':{'flag':'pampa'},
                    'pantanal':{'flag':'pantanal'}};

var trainingPolys = ee.FeatureCollection.loadBigQueryTable('solved-mb10.mb10_database.amostras_'+biomes_dict[select_biome].flag+'_treino','geo');
var evalPolys     = ee.FeatureCollection.loadBigQueryTable('solved-mb10.mb10_database.amostras_'+biomes_dict[select_biome].flag+'_teste','geo');

var polyImage = ee.Image(0).byte().paint(trainingPolys, 1).paint(evalPolys, 2);
polyImage     = polyImage.updateMask(polyImage);

var datasetMosaic = ee.Image('projects/ee-project/assets/USER_PATH/mosaic_'+ datasetYear);

Map.addLayer(datasetMosaic,{bands:['swir1','nir','red'],min:0,max:140},'Initial Mosaic '+datasetYear);
Map.addLayer(supervisedImg.selfMask(),{'palette':'purple'},'supervised layer '+datasetYear);
Map.addLayer(polyImage,{'min': 1, 'max': 4, 'palette': ['red', 'blue','#ffcccb',' #87C1FF']},'Shapes', false);