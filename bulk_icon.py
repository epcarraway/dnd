# Import modules
from PIL import ImageOps, Image
import os
from azure.storage.blob import BlobServiceClient
import json
from glob import glob


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

outdir = 'temp_icons'
folder_path = os.path.join(os.getcwd(), outdir, '')
print(folder_path)
glob_path = folder_path + "*.png"
print(glob_path)

images = glob(glob_path)
print(f"{len(images)} total files")
images = [i for i in images if not '-icon.png' in i]
print(f"{len(images)} icon files to convert")

for i in images:
    oname = i.replace('.png', '-icon.png')
    print(f'converting {i} to {oname}')
    ImageOps.expand(Image.open(i).resize((500, 500)),border=6,fill='black').save(oname)

# Load config for blob store
print('loading configuration...')
with open('config.json') as t2:
    config = json.load(t2)
    config['AZURE_STORAGE_CONTAINER'] = 'dnd'

folder_path = os.path.join(os.getcwd(), outdir, '')

# Upload files
print('uploading {}'.format(folder_path))

upload_folder_to_blob(folder_path, config)

