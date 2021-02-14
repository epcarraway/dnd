# Import modules
import gdal2tiles
from osgeo import gdal
import PIL
import os

input_map = "input.png"

# Get image dimensions
img = PIL.Image.open(input_map)
wid, hgt = img.size 
ratio = round(wid/hgt,3)
print(str(wid) + "x" + str(hgt) + ':' + str(ratio))
wid = round(10 * ratio, 3)
hgt = 10
print(wid, hgt)

# Convert to geoTIFF
ds = gdal.Open(input_map)
ds = gdal.Translate('temp_map.tif', ds, outputBounds = [0, hgt, wid, 0], outputSRS='EPSG:4326')
ds = None
print('geoTIFF created...')

# Create tiles
options = {'zoom': (6, 16), 'resume': True, 'processes': 4}
gdal2tiles.generate_tiles('temp_map.tif', 'temp_map', srs='EPSG:4326')
print('tiles created...')
os.remove('temp_map.tif')
print('temporary files removed...')
