<p align="right">
  <img src="./misc/Solved_ vetor 1.png" width="200">
</p>

# Industrial and Artisanal Mining Detection

#### Developed by: _[Solved - Soluções em Geoinformação](https://solved.eco.br)_

## About
This repository provides the steps to detect mining areas using Landsat Top of Atmosphere (TOA) mosaics.

The detection process focuses on identifying mining areas using Landsat TOA mosaics. The process involves generating annual cloud-free mosaics using Google Earth Engine (GEE) and applying a [U-Net](https://arxiv.org/abs/1505.04597) deep learning model for segmentation.

For more information about the methodology, please consult the [Mining Algorithm Theoretical Basis Document](https://doi.org/10.58053/MapBiomas/YWTZ3O)

# How to use
## 0. Prepare environment.
One must have a Google Earth Engine Account ([Get Started](https://earthengine.google.com)), be able to create a GEE repository in the code editor and upload the modules in it.

Some sort of GPU capability is also required for the training process.

## 1. Start processing the annual cloud free composities
Landsat TOA Mosaics:
        Use USGS Landsat Collection 2 Tier 1 TOA imagery.
        Generate annual cloud-free mosaics from January 1st to December 31st from 1985-2023.
        Apply a median filter to remove clouds and shadows.

* Script: [1-mosaic-generation.js](./1-mosaic-generation.js)

## 2. Sampling Script
Vizualise the training and validation regions, along with the supervised layer available publicly

* Script: [2-train-test-dataset.js](./2-train-test-dataset.js)

## 3. Execute the Neural Network.
### 3.1. Training
Training Samples:
        Select training samples based on mining (Mi) and non-mining (N-Mi) categories.
        No differentiation between artisanal and industrial mining is made during the segmentation.


### 3.2. Prediction
Every prediction is a binary set of pixel values. 0 - "non-mining", 1 - "mining"

Semantic Segmentation

Model:
Use a U-Net neural network to perform semantic segmentation on local servers.

| PARAMETERS   |   VALUES|
|:------------:|:-------:|
Neural network | U-Net |
Tile-Size      | 256 x 256 px |
Samples        | Train, Validation|
Attributes     | green, red, nir, swir1, NDVI, MNDWI|
Output         | 2 (Mining and Not-Mining)|

##### Table 2 - CNN attributes and segmentation parameters. In total, six (6) distinct attributes were used.

* Main Script: [3-Jupyter Notebook](./3-mb10_mining.ipynb)


# Filter Chain
## 4. Gap-fill & Temporal filter
Gap-fill: Replace no-data values using the nearest available valid class.
Temporal Filter: Apply a 3-year moving window to correct temporal inconsistencies.
* Script: [4-gap-fill-temporal-filter](./4-gap-fill-temporal-filter.js)

|RULE| INPUT (YEAR) | OUTPUT|
|:--:|:------------:|:-----:|
| - | T1 / T2 / T3 | T1 / T2 / T3 |
| GR| Mi / N-Mi / Mi | Mi / Mi / Mi |
| GR| N-Mi / Mi / N-Mi | N-Mi / N-Mi / N-Mi


## 5. Spatial filter
Spatial Filter: Use GEE's connectedPixelCount to remove isolated pixels, ensuring a minimum mapping unit of ~1 ha.
* Script: [5-spatial-filter](./5-spatial-filter.js)

## 6. Frequency filter
Frequency Filter: Remove classes with less than 10% temporal persistence.

* Script: [6-frequency-filter](./6-frequency-filter.js)

## References
#### REFERENCE DATA

Deter: http://terrabrasilis.dpi.inpe.br/ <br>

MapBiomas Alert: http://alerta.mapgiomas.org <br>

RAISG: http://www.amazoniasocioambiental.org <br>

ISA: https://www.socioambiental.org/ <br>

CPRM-GeoSGB: https://geosgb.cprm.gov.br/ <br>

Ahkbrasilien: https://www.ahkbrasilien.com.br/ <br>

AMW: https://amazonminingwatch.org/ <br>

---
#### REFERENCE LITERATURE
Bray, E.L.. Bauxite and alumina. U.S. Geol. Surv. Miner. Yearb. 2020.

Deng, Y., Wu, C., Li, M., & Chen, R. (2015). RNDSI: A ratio normalized difference soil index for remote sensing of urban/suburban environments. International Journal of Applied Earth Observation and Geoinformation, 39, 40–48. https://doi.org/https://doi.org/10.1016/j.jag.2015.02.010

Ronneberger, O., Fischer, P., & Brox, T. (2015). U-Net: Convolutional Networks for Biomedical Image Segmentation. CoRR, abs/1505.0. http://arxiv.org/abs/1505.04597

Tucker, C. J. (1979). Red and photographic infrared linear combinations for monitoring vegetation. Remote Sensing of Environment, 8(2), 127–150. https://doi.org/http://dx.doi.org/10.1016/0034-4257(79)90013-0

USGS. (2017). LANDSAT COLLECTION 1 LEVEL 1 PRODUCT DEFINITION. Earth Resources Observation and Science (EROS) Center. https://landsat.usgs.gov/sites/default/files/documents/LSDS-1656_Landsat_Level-1_Product_Collection_Definition.pdf
