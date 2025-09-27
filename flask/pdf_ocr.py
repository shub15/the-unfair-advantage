import os
import re
from google.cloud import vision_v1 as vision
from google.cloud import storage
from google.protobuf import json_format

os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = r"D:\ocr\vision_key.json"
client = vision.ImageAnnotatorClient()

batch_size = 2
mime_type = 'application/pdf'
feature = vision.Feature(type=vision.Feature.Type.DOCUMENT_TEXT_DETECTION)

gcs_source_uri = 'gs://lms_ocr/pdf/essay.pdf'
gcs_source = vision.GcsSource(uri=gcs_source_uri)
input_config = vision.InputConfig(gcs_source=gcs_source, mime_type=mime_type)

gcs_destination_uri = 'gs://lms_ocr/pdf_res'
gcs_destination = vision.GcsDestination(uri=gcs_destination_uri)
output_config = vision.OutputConfig(gcs_destination=gcs_destination, batch_size=batch_size)

async_request = vision.AsyncAnnotateFileRequest(
    features=[feature], input_config=input_config, output_config=output_config
)

operation = client.async_batch_annotate_files(requests=[async_request])
operation.result(timeout=180)

storage_client = storage.Client()
match = re.match(r'gs://([^/]+)/(.+)', gcs_destination_uri)
bucket_name = match.group(1)
prefix = match.group(2)
bucket = storage_client.get_bucket(bucket_name)

blob_list = list(bucket.list_blobs(prefix=prefix))

if not blob_list:
    print("No output files found.")
    exit()

print('Output files:')
for blob in blob_list:
    print(blob.name)

output = blob_list[0]
json_string = output.download_as_string().decode("utf-8").strip()

if not json_string:
    print("Downloaded JSON content is empty.")
    exit()

response = vision.AnnotateFileResponse()
try:
    json_format.Parse(json_string, response)
    first_page_response = response.responses[0]
    annotation = first_page_response.full_text_annotation
    print('Full text:')
    print(annotation.text)
except json_format.ParseError as e:
    print(f"Failed to parse JSON: {e}")
