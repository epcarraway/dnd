# Import modules
try:
    from osgeo import gdal
except:
    import gdal
import gdal2tiles
import PIL
import os

input_map = "input.png"
rescale_factor = 1.5
ll_lat = 6.95
ll_lon = 6.25
tar_height = .1
digits = 9
zoom = '6-12'

# Get image dimensions
img = PIL.Image.open(input_map)
wid, hgt = img.size 
ratio = round(wid/hgt,3)
print(str(wid) + "x" + str(hgt) + ':' + str(ratio))
if rescale_factor != 1:
    print('rescaling input image by a factor of {}...'.format(rescale_factor))
    img = img.resize((round(wid * rescale_factor), round(hgt * rescale_factor)), PIL.Image.ANTIALIAS)
    img.save('temp_map.png')
    input_map = 'temp_map.png'
    wid, hgt = img.size 
    ratio = round(wid/hgt, digits)
    print(str(wid) + "x" + str(hgt) + ':' + str(ratio))
wid = round(tar_height * ratio, digits)
hgt = tar_height
print(wid, hgt)

# Convert to geoTIFF
ds = gdal.Open(input_map)
ds = gdal.Translate('temp_map.tif', ds, outputBounds = [ll_lat, ll_lon + hgt, ll_lat + wid, ll_lon], outputSRS='EPSG:4326')
ds = None
print('geoTIFF created...')

# Create tiles
options = {'zoom': zoom, 'resume': True}
gdal2tiles.generate_tiles('temp_map.tif', 'temp_map', srs='EPSG:4326', **options)
print('tiles created...')
os.remove('temp_map.tif')
print('temporary files removed...')
