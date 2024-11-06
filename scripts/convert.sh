#!/bin/bash
set -e

# Check if both input and output directories are provided
if [[ -z "$1" || -z "$2" ]]; then
  echo "Usage: $0 <input_directory> <output_directory>"
  exit 1
fi

input_dir=$1
output_dir=$2

# Create output directory if it doesn't exist
mkdir -p "$output_dir"

# Process each .json file in the input directory
for input_file in "$input_dir"/*.json; do
  # Get the base name of the file (e.g., "file.json" -> "file")
  base_name=$(basename "$input_file" .json)
  output_file="$output_dir/${base_name}.json"

  echo "Converting $input_file to OpenAPI 3 format..."
  npx api-spec-converter --from=swagger_1 --to=openapi_3 --syntax=json "$input_file" > "$output_file"

  if [[ $? -eq 0 ]]; then
    echo "Saved converted file to $output_file"
  else
    echo "Failed to convert $input_file"
  fi
done
