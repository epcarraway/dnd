# Import modules
from azure.storage.blob import BlobServiceClient
import os
import json


def upload_folder_to_blob(folder_path, config):
    """Uploads a local file to Azure Blob Storage"""
    # Create the BlobServiceClient object which will be used to create a container client
    blob_service_client = BlobServiceClient.from_connection_string(
        config['AZURE_STORAGE_CONNECTION_STRING'])
    # Create the container
    try:
        container_client = blob_service_client.create_container(config['AZURE_STORAGE_CONTAINER'])
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


# Load config for blob store
with open('config.json') as t:
    config = json.load(t)

folder_path = os.path.join(os.getcwd(),'temp_map','')

# Upload files
upload_folder_to_blob(folder_path, config)
