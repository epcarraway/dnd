# Import modules
try:
    from osgeo import gdal
except:
    import gdal
import gdal2tiles
import PIL
import os
from azure.storage.blob import BlobServiceClient
import json

with open('tile_settings.csv', 'r') as f:
    text = f.readlines()

text = [i.split(',') for i in text if ',' in i]
text = [i for i in text if i[-1].strip() == '1']
print(text)

for t in text:
    im = PIL.Image.open(t[0])
    img = im.crop((int(t[1]), int(t[2]), int(t[3]), int(t[4])))
    img = img.rotate(float(t[12]))
    img.show()
    # Set input/output for rescaling and tiling
    input_map = t[0]
    rescale_factor = float(t[5])
    ll_lat = float(t[6])
    ll_lon = float(t[7])
    tar_height = float(t[8])
    digits = int(t[9])
    zoom = '{}-{}'.format(t[10], t[11])
    outdir = 'temp_{}'.format(t[13])

    # Get image dimensions
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
    else:
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
    gdal2tiles.generate_tiles('temp_map.tif', outdir, srs='EPSG:4326', **options)
    print('tiles created...')
    os.remove('temp_map.tif')
    if rescale_factor != 1:
        os.remove('temp_map.png')
    print('temporary files removed...')


def upload_folder_to_blob(folder_path, config):
    """Uploads a local file to Azure Blob Storage"""
    # Create the BlobServiceClient object which will be used to create a container client
    blob_service_client = BlobServiceClient.from_connection_string(
        config['AZURE_STORAGE_CONNECTION_STRING'])
    # Create the container
    try:
        container_client = blob_service_client.create_container(config['AZURE_STORAGE_CONTAINER'], public_access='blob')
    except Exception:
        container_client = blob_service_client.get_container_client(config['AZURE_STORAGE_CONTAINER'])
    for r,d,f in os.walk(folder_path):
        if f:
            for file in f:
                file_path_on_azure = os.path.join(r,file).replace(folder_path,"")
                file_path_on_local = os.path.join(r,file)
                print(config['AZURE_STORAGE_CONTAINER'],file_path_on_azure,file_path_on_local)
                # Create a blob client using the local file name as the name for the blob
                blob_client = blob_service_client.get_blob_client(
                    container=config['AZURE_STORAGE_CONTAINER'], blob=file_path_on_azure)
                print("\nUploading to Azure Storage as blob:\n\t" + file_path_on_azure)
                # Upload the created file
                with open(file_path_on_local, "rb") as data:
                    blob_client.upload_blob(data, overwrite=True)
    print('Upload complete...')

folders = list(set([t[13] for t in text]))
for folder in folders:
    print(folder)
    outdir = 'temp_{}'.format(folder)
    # Load config for blob store
    with open('config.json') as t2:
        config = json.load(t2)
        config['AZURE_STORAGE_CONTAINER'] = folder

    folder_path = os.path.join(os.getcwd(), outdir, '')

    # Upload files
    upload_folder_to_blob(folder_path, config)
