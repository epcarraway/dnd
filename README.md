# DnD Map Visualization
Interactive visualization of points of interest on map

## Tools
This project uses Python 3 to convert a large map image to optimized tiles for use in a leaflet map using the GDAL library. The interactive map leverages the Google Charts API, along with HTML, CSS, JavaScript to retrieve points of interest from a Google Sheets file and add clickable points.

## Environment
GDAL Python dependencies can be difficult to navigate on Windows, but appears to work well on Windows Subsystem for Linux (WSL). In WSL, the install.sh file can be use to update and install dependencies for Python 3. The config.json is required for uploading image tiles to Azure Blob storage, but other methods would also work, such as AWS S3 storage.
