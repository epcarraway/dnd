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
import time
import shutil
from glob import glob

PIL.Image.MAX_IMAGE_PIXELS = None


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

all_paths = {}

with open('tile_settings.csv', 'r') as f:
    text = f.readlines()

text = [i.split(',') for i in text if ',' in i]
text = [i for i in text if i[-1].strip() == '1']
print(text)

for t in text:
    print(t[0])
    if t[0] =='break':
        break
    img = PIL.Image.open(t[0])
    if int(t[1]) != 0 or int(t[2]) != 0 or int(t[3]) != 0 or int(t[4]) != 0:
        img = img.crop((int(t[1]), int(t[2]), int(t[3]), int(t[4])))
    img = img.convert("RGBA")
    img = img.rotate(float(t[12]), fillcolor=(255, 255, 255, 0), expand=True)
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
    out_container = t[13]
    map_name = t[14]
    print(map_name)

    # Get image dimensions
    wid, hgt = img.size 
    ratio = round(wid/hgt,3)
    print(str(wid) + "x" + str(hgt) + ':' + str(ratio))
    if rescale_factor != 1:
        print('rescaling input image by a factor of {}...'.format(rescale_factor))
        img = img.resize((round(wid * rescale_factor), round(hgt * rescale_factor)), PIL.Image.LANCZOS)
        img.show()
        time.sleep(5)
        img.save('temp_map.png')
        img.save('temp_{}.png'.format(map_name.replace(' ', '_')))
        input_map = 'temp_map.png'
        wid, hgt = img.size 
        ratio = round(wid/hgt, digits)
        print(str(wid) + "x" + str(hgt) + ':' + str(ratio))
    else:
        img.show()
        time.sleep(5)
        img.save('temp_map.png')
        img.save('temp_{}.png'.format(map_name.replace(' ', '_')))
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

    # Remove blank images
    all_tiles = glob('{}/*/*/*.png'.format(outdir))
    print('{} files...'.format(len(all_tiles)))
    path_2 = os.path.join(os.getcwd(), 'temp_' + map_name.replace(' ','_'), '')
    print(path_2)
    print(outdir)
    check_dupes = False
    try:
        all_paths_2 = all_paths[out_container]
        check_dupes = True
    except:
        all_paths[out_container] = {}
        all_paths_2 = {}
    for tile_file in all_tiles:
        if os.path.getsize(tile_file) < 1000:
            print('removing {}...'.format(tile_file))
            os.remove(tile_file)
        else:
            file_key = tile_file.split(outdir)[-1]
            path_3 = os.path.join(path_2, file_key[1:])
            print(path_3)
            if check_dupes:
                if file_key in all_paths_2:
                    print('existing files for {} tile...'.format(file_key))
                    print(all_paths_2[file_key])
                    background = PIL.Image.open(all_paths_2[file_key])
                    print(tile_file)
                    foreground = PIL.Image.open(tile_file)
                    PIL.Image.alpha_composite(background, foreground).save(tile_file)
                    print('{} and {} combined...'.format(tile_file, all_paths_2[file_key]))
            all_paths_2[file_key] = path_3
    all_paths[out_container] = all_paths_2

    try:shutil.rmtree(path_2)
    except:pass
    shutil.copytree(os.path.join(os.getcwd(), outdir, ''), path_2)
    # Load config for blob store
    print('loading configuration...')
    with open('config.json') as t2:
        config = json.load(t2)
        config['AZURE_STORAGE_CONTAINER'] = out_container

    folder_path = os.path.join(os.getcwd(), outdir, '')

    # Upload files
    print('uploading {}'.format(folder_path))
    upload_folder_to_blob(folder_path, config)

    shutil.rmtree(folder_path)
    print('{} total files...'.format(len(all_paths)))
