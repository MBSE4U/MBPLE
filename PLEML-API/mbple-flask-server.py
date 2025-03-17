from flask import Flask, send_from_directory, request, jsonify, Response
import requests
from anytree import NodeMixin, RenderTree
import os
import io
import json
import csv
from typing import Optional
from functools import wraps

app = Flask(__name__, static_folder='plemlWeb')
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = True  # Optional: Pretty print JSON
app.config['JSONIFY_MIMETYPE'] = 'application/json'

# Create a global session object
session = requests.Session()

@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

# Serve static files (including images)
@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory(app.static_folder, filename)

#
# Decorator to handle errors in routes
#
def handle_errors(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except requests.HTTPError as e:
            return jsonify({"error": f"HTTP error: {str(e)}"}), 500
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    return wrapper

# Utility function to fetch the list of projects from the server
def get_project_list(server_url: str) -> list:
    """
    Fetches the list of projects from the server and sorts them alphabetically by name.

    Args:
        server_url (str): Base URL of the server.

    Returns:
        list: Sorted list of projects.

    Raises:
        ValueError: If the server response is not successful.
    """
    projects_url = f"{server_url}/projects?page%5Bsize%5D=1024"
    response = session.get(projects_url)

    if response.status_code != 200:
        raise ValueError(f"Failed to retrieve projects. Status code: {response.status_code}, details: {response.text}")

    projects = response.json()
    return sorted(projects, key=lambda x: x.get('name', '').lower())

# Utility function to fetch commits for a given project
def get_commits(server_url: str, project_id: str) -> list:
    """
    Fetches the list of commits for a given project.

    Args:
        server_url (str): The base URL of the server.
        project_id (str): The ID of the project.

    Returns:
        list: A list of commits.

    Raises:
        ValueError: If the response is not successful or if input data is invalid.
    """
    if not server_url or not project_id:
        raise ValueError("Both server_url and project_id are required.")

    commits_url = f"{server_url}/projects/{project_id}/commits"
    response = session.get(commits_url)

    if response.status_code != 200:
        raise ValueError(f"Failed to retrieve commits. Status code: {response.status_code}, details: {response.text}")

    return response.json()

# Utility function to fetch the IDs of the annotated elements from the metadata usages
def get_plemldefinition_ids(server_url, project_id):   
    # Input for querying all MetadataUsage entries
    query_url = f"{server_url}/projects/{project_id}/query-results"
    query_input = {
        '@type': 'Query',
        'where': {
            '@type': 'PrimitiveConstraint',
            'inverse': False,
            'operator': '=',
            'property': '@type',
            'value': 'MetadataDefinition'
        }
    }
    # print(f"Query Input: {query_input}")
    
    # Send the query
    query_response = session.get(query_url, json=query_input)
    if query_response.status_code == 200:
        query_response_json = query_response.json()
        if query_response_json and isinstance(query_response_json, list):
            # Extract the four definitions (or fallback if missing)
            featureTree_type_id = next(
                (item['@id'] for item in query_response_json if item.get('name') == 'FeatureTreeMetadata'),
                query_response_json[0]['@id'] if len(query_response_json) > 0 and query_response_json[0].get('@id') else None
            )
            feature_type_id = next(
                (item['@id'] for item in query_response_json if item.get('name') == 'FeatureMetadata'),
                query_response_json[0]['@id'] if len(query_response_json) > 0 and query_response_json[0].get('@id') else None
            )
            featureconfiguration_type_id = next(
                (item['@id'] for item in query_response_json if item.get('name') == 'FeatureConfigurationMetadata'),
                query_response_json[1]['@id'] if len(query_response_json) > 1 and query_response_json[1].get('@id') else None
            )
            requiresConstraint_type_id = next(
                (item['@id'] for item in query_response_json if item.get('name') == 'RequiresConstraintMetadata'),
                query_response_json[1]['@id'] if len(query_response_json) > 1 and query_response_json[1].get('@id') else None
            )
            xorConstraint_type_id = next(
                (item['@id'] for item in query_response_json if item.get('name') == 'XORConstraintMetadata'),
                query_response_json[1]['@id'] if len(query_response_json) > 1 and query_response_json[1].get('@id') else None
            )

            # Return them in a dict
            return {
                "featureTree_type_id": featureTree_type_id,
                "feature_type_id": feature_type_id,
                "feature_configuration_type_id": featureconfiguration_type_id,
                "requires_constraint_type_id": requiresConstraint_type_id,
                "xor_constraint_type_id": xorConstraint_type_id
            }
        else:
            return {
                "error": "Unexpected response format", 
                "details": query_response_json
            }
    else:
        return {
            "error": f"Failed to query features. Status code: {query_response.status_code}",
            "details": query_response.text
        }

# Utility function to fetch the IDs of the annotated elements from the metadata usages
def get_metadatausage_annotatedElement_ids(query_url, metadefinition_dict):
    """
    Retrieve annotatedElement IDs for multiple metadataDefinition IDs in a single query.
    
    :param query_url: The URL for the query API.
    :param metadefinition_dict: A dictionary of metadataDefinition IDs with descriptive keys.
    :return: A dictionary where keys are the descriptive keys from metadefinition_dict and values are lists of annotatedElement IDs.
    """
    
    # Input for querying all MetadataUsage entries
    query_input = {
        '@type': 'Query',
        'where': {
            '@type': 'PrimitiveConstraint',
            'inverse': False,
            'operator': '=',
            'property': '@type',
            'value': 'MetadataUsage'
        }
    }
    # print(f"Query Input: {query_input}")
    
    # Send the query
    query_response = session.get(query_url, json=query_input)
    if query_response.status_code != 200:
        raise ValueError(f"Failed to query metadata usages. Status code: {query_response.status_code}, details: {query_response.text}")
    
    query_response_json = query_response.json()
    if not query_response_json or not isinstance(query_response_json, list):
        return {}

    # Prepare the result dictionary using keys from metadefinition_dict
    results = {key: [] for key in metadefinition_dict.keys()}

    # Process each item in the response
    for item in query_response_json:
        a = item.get("annotatedElement", [])
        m = item.get("metadataDefinition", {}).get("@id")
        metadata_definition_id = item.get("metadataDefinition", {}).get("@id")
        for key, metadefinition_id in metadefinition_dict.items():
            if metadata_definition_id == metadefinition_id:
                # Extract annotatedElement IDs
                annotated_elements = item.get("annotatedElement", [])
                if annotated_elements and isinstance(annotated_elements, list):
                    for annotated in annotated_elements:
                        annotated_id = annotated.get("@id")
                        if annotated_id:
                            results[key].append(annotated_id)
                else:
                    # Fallback to the main item's @id if annotatedElement is not present
                    results[key].append(item.get("@id"))

    return results

# Utility function to fetch the elements of a given kind from the API
def get_elements_byKind_fromAPI(query_url, kind):
    query_input = {
        '@type': 'Query',
        'where': {
            '@type': 'PrimitiveConstraint',
            'inverse': False,
            'operator': '=',
            'property': '@type',
            'value': f"{kind}"
        }
    }
    try:
        query_response = session.post(query_url, json=query_input)
        if query_response.status_code == 200:
            query_response_json = query_response.json()
            return query_response_json
        else:
            raise ValueError(f"Failed to query kinds. Status code: {query_response.status_code}, details: {query_response.text}")
    except Exception as e:
        print(f"Error: {e}")
        return []

# Utility function to fetch the elements for the given IDs
def get_elements_fromAPI(query_url, element_ids):
    """
    Retrieves the elements for the given IDs.

    Parameters:
        query_url (str): The URL to send the query request to.c
        element_ids (list): A list of element ids

    Returns:
        list: A list of elements.
    """
    elements = []
    for element_id in element_ids:
        try:
            element_json = get_element_fromAPI(query_url, element_id)
            if isinstance(element_json, list):
                elements.extend(element_json)
            else:
                elements.append(element_json)
        except Exception as e:
            print(f"Error processing element id {element_id}: {e}")
            continue  # Continue with the next ID
    return elements

# Utility function to fetch the element for the given ID
def get_element_fromAPI(query_url, element_id):
    """
    Retrieves the element for the given ID.

    Parameters:
        query_url (str): The URL to send the query request to.c
        element_id: Element ID

    Returns:
        list: Element
    """

    try:
        elements_url = f"{query_url}/{element_id}"
        elements_response = session.get(elements_url)
        if elements_response.status_code == 200:
            element = elements_response.json()
            # print(f"Got element: {element}\n\n")
            return element
        else:
            print(f"Warning: Failed to retrieve element {element_id}. Status: {elements_response.status_code}")
    except Exception as e:
        print(f"Error processing element id {element_id}: {e}")

# Define the FeatureNode class to include the ownedRedefinition attribute
class FeatureNode(NodeMixin):
    def __init__(self, name, element_id, parent=None):
        self.name = name
        self.element_id = element_id
        self.parent = parent

    def __repr__(self):
        return f"FeatureNode(name={self.name}, id={self.element_id})"

def print_feature_tree(root_node):
    """
    Prints the feature tree in a human-readable format.
    
    Args:
        root_node (FeatureNode): The root of the feature tree.
    """
    for pre, fill, node in RenderTree(root_node):
        print(f"{pre}{node.name} (ID: {node.element_id}, Parent: {node.parent})")

# Function to recursively convert a tree to a JSON structure
def featuretree_to_json(node):
    """Convert a FeatureNode tree to a JSON-compatible dictionary."""
    if not isinstance(node, FeatureNode):
        raise TypeError(f"Expected FeatureNode, got {type(node).__name__}")
    return {
        "id": node.element_id,
        "name": node.name,
        "parent": node.parent.element_id if node.parent else None,
        "children": [featuretree_to_json(child) for child in getattr(node, "children", [])]
    }


# Define the FeatureNode class to include the ownedRedefinition attribute
class FeatureConfigurationNode(NodeMixin):
    def __init__(self, name, element_id, isConfiguration=False, selection=None, selection_id=None, parent=None):
        self.selection = selection if selection is not None else []
        self.selection_id = selection_id if selection_id is not None else []
        self.name = name
        self.isConfiguration = isConfiguration
        self.element_id = element_id
        self.parent = parent

    def __repr__(self):
        return f"FeatureConfigurationNode(name={self.name}, id={self.element_id}, isConfiguration={self.isConfiguration}, parent={self.parent}, selection={self.selection}, selection_id={self.selection_id})"


# Custom JSON Encoder
def custom_json_encoder(obj):
    """Custom JSON encoder for FeatureConfigurationNode and FeatureNode objects."""
    if isinstance(obj, FeatureConfigurationNode):
        return {
            "type": "FeatureConfigurationNode",
            "name": obj.name,
            "id": obj.element_id,
            "isConfiguration": obj.isConfiguration,
            "selection": obj.selection,
            "selection_id": obj.selection_id,
            "parent": obj.parent.element_id if obj.parent else None  # ✅ Convert to ID
        }
    elif isinstance(obj, FeatureNode):
        return {
            "type": "FeatureNode",
            "name": obj.name,
            "id": obj.element_id,
            "parent": obj.parent.element_id if obj.parent else None  # ✅ Convert to ID
        }
    raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")

def find_element_by_id(aggregated_results, target_id):
    for element in aggregated_results:
        if element['@id'] == target_id:
            return element
    return None  # Return None if not found

def save_json_to_file(file_path: str, data: dict, indent: int = 4) -> bool:
    """
    Saves JSON data to a file.

    Args:
        file_path (str): The full path to the file where the JSON data will be saved.
        data (dict): The JSON-serializable data to save.
        indent (int): The indentation level for pretty-printing the JSON. Default is 4.

    Returns:
        bool: True if the file was saved successfully, False otherwise.
    """
    try:
        # Ensure the directory exists
        directory = os.path.dirname(file_path)
        if directory and not os.path.exists(directory):
            os.makedirs(directory, exist_ok=True)

        # Write the data to the file with custom encoding
        with open(file_path, "w") as file:
            json.dump(data, file, indent=indent, default=custom_json_encoder)

        print(f"✅ JSON file saved successfully at: {file_path}")
        return True
    except (IOError, TypeError) as error:
        print(f"❌ Failed to save JSON file at {file_path}. Error: {error}")
        return False

def print_feature_configuration(root_node):
    """
    Prints the feature configuration in a human-readable format.
    
    Args:
        root_node (FeatureNode): The root of the feature configuration.
    """
    for pre, fill, node in RenderTree(root_node):
        print(f"{pre}{node.name} (Selection: {node.selection} ({node.selection_id}))")

# Function to recursively convert a tree to a JSON structure
def featureconfiguration_to_json(node):
    """Convert an FeatureConfigurationNode tree to a JSON-compatible dictionary."""
    return {
        "id": node.element_id,
        "name": node.name,
        "isConfiguration": node.isConfiguration,
        "parent": node.parent,
        "selection": [str(sel) for sel in node.selection],  # Convert to strings if necessary
        "selection_id": [sel for sel in node.selection_id],  # Convert to strings if necessary
        "children": [featureconfiguration_to_json(child) for child in getattr(node, "children", [])]
    }


def call_openai(feature_tree_output, feature_config_output):
    """
    Sends the feature tree and feature configurations to OpenAI,
    asks the model to identify errors and propose optimizations.
    Returns the JSON response from OpenAI (as a Python dict).
    """
    # 1. API endpoint
    openai_endpoint = "https://api.openai.com/v1/chat/completions"
    
    # 2. Retrieve your API key from environment (or another secure location)
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        raise ValueError("OPENAI_API_KEY environment variable not set.")
    
    # 3. Build the prompt
    prompt = (
        "We have a textual feature tree:\n"
        f"{feature_tree_output}\n\n"
        "We also have these feature configurations:\n"
        f"{feature_config_output}\n\n"
        "Please:\n"
        "1) Identify potential errors or inconsistencies.\n"
        "2) Propose optimizations or extensions.\n"
        "3) Summarize your suggestions.\n"
    )

    # 4. Construct the request body
    request_data = {
        "model": "gpt-4",  # Or "gpt-3.5-turbo"
        "messages": [
            {"role": "user", "content": prompt}
        ]
    }

    # 5. Make the POST request
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {openai_api_key}"
    }

    response = requests.post(openai_endpoint, headers=headers, json=request_data)
    if response.status_code != 200:
        raise RuntimeError(
            f"OpenAI API returned an error: {response.status_code} - {response.text}"
        )
    
    # 6. Parse and return the JSON as a dict
    return response.json()


def get_pleml_metadata_definitions(server_url, project_id):
    """
    Queries the server for PLEML MetadataDefinition IDs and returns them.
    If an error occurs, returns a dict with 'error' and 'details'.
    """
    query_url = f"{server_url}/projects/{project_id}/query-results"
    query_input = {
        '@type': 'Query',
        'select': ['@id'],
        'where': {
            '@type': 'CompositeConstraint',
            'operator': 'and',
            'constraint': [
                {
                    '@type': 'CompositeConstraint',
                    'operator': 'or',
                    'constraint': [
                        {
                            '@type': 'PrimitiveConstraint',
                            'inverse': False,
                            'operator': '=',
                            'property': 'name',
                            'value': 'FeatureMetadata'
                        },
                        {
                            '@type': 'PrimitiveConstraint',
                            'inverse': False,
                            'operator': '=',
                            'property': 'name',
                            'value': 'FeatureConfigurationMetadata'
                        },
                        {
                            '@type': 'PrimitiveConstraint',
                            'inverse': False,
                            'operator': '=',
                            'property': 'name',
                            'value': 'RequiresConstraintMetadata'
                        },
                        {
                            '@type': 'PrimitiveConstraint',
                            'inverse': False,
                            'operator': '=',
                            'property': 'name',
                            'value': 'XORConstraintMetadata'
                        }
                    ]
                },
                {
                    '@type': 'PrimitiveConstraint',
                    'inverse': False,
                    'operator': '=',
                    'property': '@type',
                    'value': 'MetadataDefinition'
                }
            ]
        }
    }
    query_response = session.post(query_url, json=query_input)
    if query_response.status_code == 200:
        query_response_json = query_response.json()
        if query_response_json and isinstance(query_response_json, list):
            # Extract the four definitions (or fallback if missing)
            feature_type_id = next(
                (item['@id'] for item in query_response_json if item.get('name') == 'FeatureMetadata'),
                query_response_json[0]['@id'] if len(query_response_json) > 0 and query_response_json[0].get('@id') else None
            )
            featureconfiguration_type_id = next(
                (item['@id'] for item in query_response_json if item.get('name') == 'FeatureConfigurationMetadata'),
                query_response_json[1]['@id'] if len(query_response_json) > 1 and query_response_json[1].get('@id') else None
            )
            requiresConstraint_type_id = next(
                (item['@id'] for item in query_response_json if item.get('name') == 'RequiresConstraintMetadata'),
                query_response_json[1]['@id'] if len(query_response_json) > 1 and query_response_json[1].get('@id') else None
            )
            xorConstraint_type_id = next(
                (item['@id'] for item in query_response_json if item.get('name') == 'XORConstraintMetadata'),
                query_response_json[1]['@id'] if len(query_response_json) > 1 and query_response_json[1].get('@id') else None
            )

            # Return them in a dict
            return {
                "feature_type_id": feature_type_id,
                "feature_configuration_type_id": featureconfiguration_type_id,
                "requires_constraint_type_id": requiresConstraint_type_id,
                "xor_constraint_type_id": xorConstraint_type_id
            }
        else:
            return {
                "error": "Unexpected response format", 
                "details": query_response_json
            }
    else:
        return {
            "error": f"Failed to query features. Status code: {query_response.status_code}",
            "details": query_response.text
        }

def save_featuretree_json_to_csv(feature_config_json, csv_file_path):
    """
    Saves the feature tree JSON to a CSV file and returns the CSV content as a string.

    Args:
        feature_config_json (list): The JSON structure containing feature configurations.
        csv_file_path (str): The path to save the CSV file.

    Returns:
        str: The content of the CSV as a string.
    """
    # Helper function to recursively process nodes and collect data
    def process_node(node, parent=None, rows=None):
        if rows is None:
            rows = []
        # Append the current node data to rows
        rows.append({
            "id": node["id"],
            "name": node["name"],
            "parent": parent
        })
        # Recursively process children if they exist
        if "children" in node and isinstance(node["children"], list):
            for child in node["children"]:
                process_node(child, node["id"], rows)
        return rows

    # Collect rows from the feature configuration tree
    rows = []
    for root in feature_config_json:
        rows.extend(process_node(root))

    # Create an in-memory file for the CSV content
    csv_output = io.StringIO()
    
    # Write rows to the CSV file and the in-memory file
    with open(csv_file_path, mode="w", newline="") as csvfile:
        fieldnames = ["id", "name", "parent"]
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

        # Write to the in-memory CSV content
        writer = csv.DictWriter(csv_output, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    # Get the content of the in-memory file
    csv_content = csv_output.getvalue()
    csv_output.close()

    print(f"CSV file saved at: {csv_file_path}")
    return csv_content

def save_featureconfiguration_json_to_csv(json_data, csv_file_path):
    """
    Saves the JSON data into a CSV file with the format:
    id, name, isConfiguration, parent, selection1, selection_id1, selection2, selection_id2, ...

    Args:
        json_data (list): The JSON structure containing hierarchical feature data.
        csv_file_path (str): The path to save the CSV file.
    """
    rows = []

    def process_node(node, parent_id=""):
        """
        Processes a feature configuration node and its children recursively.
        """
        row = [node["id"], node["name"], node["isConfiguration"], parent_id]
        
        selections = node.get("selection", [])
        selection_ids = node.get("selection_id", [])

        # Interleave selection names and IDs
        interleaved_selections = []
        for name, sel_id in zip(selections, selection_ids):
            interleaved_selections.append(name)
            interleaved_selections.append(sel_id)

        row.extend(interleaved_selections)
        rows.append(row)

        # Process child nodes recursively
        for child in node.get("children", []):
            process_node(child, parent_id=node["id"])  # Pass current node ID as parent_id

    # Process all root nodes
    for root in json_data:
        process_node(root)  # Root nodes have no parents (parent_id="")

    # Determine the maximum number of selection columns
    max_selections = max((len(row) - 4) // 2 for row in rows) if rows else 0  # Adjusted to account for 'parent'

    # Create column headers dynamically
    headers = ["id", "name", "isConfiguration", "parent"]
    for i in range(max_selections):
        headers.append(f"selection{i+1}")
        headers.append(f"selection_id{i+1}")

 # Use StringIO to capture CSV content
    csv_output = io.StringIO()
    writer = csv.writer(csv_output)

    # Write headers
    writer.writerow(headers)

    # Write rows
    for row in rows:
        # Fill missing selection columns with empty strings
        missing_entries = max_selections * 2 - (len(row) - 4)
        row += [""] * missing_entries
        writer.writerow(row)

    # Get CSV content
    csv_content = csv_output.getvalue()
    csv_output.close()

    # Save to file if path is provided
    if csv_file_path:
        with open(csv_file_path, mode="w", newline="", encoding="utf-8") as csvfile:
            csvfile.write(csv_content)

    print(f"CSV file saved at: {csv_file_path}")
    return csv_content

def add_child_to_feature(json_data, feature_id, selected_feature):
    """
    Updates the JSON structure by adding a `selectedFeature` as a child element
    of the element with the specified `feature_id`.

    Args:
        json_data (list or dict): The JSON structure containing elements.
        feature_id (str): The ID of the element to which the `selectedFeature` should be added.
        selected_feature (dict): The complete JSON structure of the `selectedFeature` to be added.

    Returns:
        list or dict: Updated JSON structure.
    """
    # Ensure json_data is iterable (list of elements)
    if isinstance(json_data, dict):
        json_data = [json_data]

    for element in json_data:
        # Check if the current element matches the feature_id
        if element.get("id") == feature_id:
            # Ensure the element has a children list
            if "children" not in element:
                element["children"] = []
            
            # Transform selected_feature to match json_data's structure
            transformed_feature = {
                "id": selected_feature.get("@id"),
                "name": selected_feature.get("declaredName", "selectedFeature"),
                "children": []  # Start with an empty list for children
            }

            # Append the transformed feature as a child
            element["children"].append(transformed_feature)
            return json_data  # Return early once the feature is added

        # Recursively update the children
        if "children" in element and isinstance(element["children"], list):
            add_child_to_feature(element["children"], feature_id, selected_feature)
    
    return json_data

def print_element(name, json_data):
    if isinstance(json_data, dict):  # Ensure json_data is a dictionary
        jsonID = json_data.get("@id")
        jsonType = json_data.get("@type")
        jsonName = json_data.get("name")
        print(f"{name}: id: {jsonID} / type: {jsonType} / name: {jsonName}")
    elif isinstance(json_data, list):  # Handle the case where json_data is a list
        print(f"{name}: The data is a list. Iterating through elements:")
        for i, item in enumerate(json_data, start=1):
            print_element(f"{name}[{i}]", item)  # Recursively call the function for each element
    else:  # Handle unexpected types
        print(f"{name}: Invalid data type: {type(json_data)}")


def generate_textual_featuretree(data, indent=0):
    """
    Recursively generates a textual tree representation from a JSON structure.
    
    Args:
        data (list or dict): The JSON structure containing elements.
        indent (int): The current indentation level for tree hierarchy.
    
    Returns:
        str: The textual tree representation.
    """
    tree_representation = ""
    
    # Handle cases where the input is a list or a single dictionary
    if isinstance(data, list):
        for element in data:
            tree_representation += generate_textual_featuretree(element, indent)
    elif isinstance(data, dict):
        # Add the current element's name with indentation
        tree_representation += " " * indent + f"- {data['name']}\n"
        
        # Recursively add children
        if "children" in data and isinstance(data["children"], list):
            tree_representation += generate_textual_featuretree(data["children"], indent + 2)
    
    return tree_representation

import json

def generate_textual_feature_configuration_tree(data, indent=0, is_root=True):
    """
    Recursively generates a textual tree representation from a JSON structure.
    
    Args:
        data (dict or list): JSON structure representing the feature configuration.
        indent (int): The current indentation level for tree hierarchy.
        is_root (bool): Flag to determine if this is a root node to add spacing.
    
    Returns:
        str: The textual tree representation.
    """
    tree_representation = ""

    if isinstance(data, list):  # If it's a list, process each element
        for index, element in enumerate(data):
            if index > 0:  # Add an empty line before new root elements
                tree_representation += "\n\n"
            tree_representation += generate_textual_feature_configuration_tree(element, indent, is_root=True)

    elif isinstance(data, dict):  # If it's a dictionary, process the node
        # Check if selection is empty and remove the "=" sign if necessary
        selection_values = ", ".join(data.get("selection", []))
        selection_text = f"= {selection_values}" if selection_values else ""

        # Add the current node
        tree_representation += " " * indent + f"- {data.get('name', 'Unnamed')} {selection_text}"

        # Recursively process children
        if "children" in data and isinstance(data["children"], list):
            for child in data["children"]:
                child_representation = generate_textual_feature_configuration_tree(child, indent + 2, is_root=False)
                if child_representation.strip():  # Ensure an empty line between children
                    tree_representation += "\n" + child_representation

    return tree_representation


def traverse_tree(node: dict, action: callable, parent: Optional[dict] = None) -> None:
    """
    Recursively traverse a tree structure and apply an action to each node.

    Args:
        node (dict): Current node in the tree.
        action (callable): A function to execute for each node, accepting the node and its parent.
        parent (Optional[dict]): Parent node, if any.
    """
    action(node, parent)
    for child in node.get("children", []):
        traverse_tree(child, action, node)

# Function to recursively convert a tree to a JSON structure
def buildFeatureTree(featureTree, parent, features, featureSpecializations):   
    for feature in features:
        for subsettingID in feature['ownedSpecialization']:
            subsetting = find_element_by_id(featureSpecializations, subsettingID['@id'])
            if subsetting is None:
                continue  # Skip to the next iteration
            if parent['@id'] == subsetting['general']['@id']:
                child_node = FeatureNode(name=feature['name'], element_id=feature['@id'], parent = featureTree[parent['@id']])
                featureTree[feature['@id']] = child_node
                buildFeatureTree(featureTree, feature, features, featureSpecializations)


################################################################################################################
#
# Retrieve List of Projects
#
@app.route('/api/projects', methods=['POST'])
@handle_errors
def api_projects():
    try:
        input_data = request.json
        print(f"/api/projects called with data: {input_data}")
        server_url = input_data['server_url']

        # Call the utility function
        projects = get_project_list(server_url)
        return jsonify(projects)

    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


#
# Retrieve List of Commits
#
@app.route('/api/commits', methods=['POST'])
@handle_errors
def api_commits():
    try:
        input_data = request.json
        print(f"/api/commits called with data: {input_data}")

        # Extract input values
        server_url = input_data.get('server_url')
        project_id = input_data.get('project_id', "").split(' ')[0]  # Safely split and handle edge cases

        # Fetch commits using the utility function
        commits = get_commits(server_url, project_id)
        return jsonify(commits)

    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

#
# Retrieve all Features and Feature Configurations and Build the tree structure
#
@app.route('/api/query-features', methods=['POST'])
@handle_errors
def api_query_features():
    print("Called api_query_features()")
    try:
        input_data = request.json
        print(f"/api/query-features called with data: {input_data}")

        # Required inputs
        server_url = input_data.get('server_url')
        project_id = input_data.get('project_id')
        commit_id = input_data.get('commit_id')
        response_kind = input_data.get('response_kind')
        response_format = input_data.get('response_format')

        # Load PLEML and get the PLEML IDs
        plemlDefinitions = get_plemldefinition_ids(server_url, project_id)

        # Basic validation
        if not all([server_url, project_id, commit_id,
                    plemlDefinitions["featureTree_type_id"], plemlDefinitions["feature_type_id"], plemlDefinitions["feature_configuration_type_id"], 
                    plemlDefinitions["requires_constraint_type_id"], plemlDefinitions["xor_constraint_type_id"]]):
            return jsonify({
                "error": "One or more required fields is missing: (server_url, project_id, commit_id, feature_type_id, featureconfiguration_type_id, requiresConstraint_type_id, xorConstraint_type_id)."
            }), 400

        # 1. Retrieve the IDs of the annotated elements from the metdata usages (feature configurations, features, feature constraints) 
        print("Retrieving annotatedElement IDs...")
        query_url = f"{server_url}/projects/{project_id}/query-results"
        plemlAnnotatedElementsIDs = get_metadatausage_annotatedElement_ids(query_url, plemlDefinitions)
              
        # 2. Fetch the actual elements from the commit
        print("Fetching elements...")
        commit_elements_url = f"{server_url}/projects/{project_id}/commits/{commit_id}/elements"
        requireConstraints = get_elements_fromAPI(commit_elements_url, plemlAnnotatedElementsIDs.get("requires_constraint_type_id", []))
        xorConstraints = get_elements_fromAPI(commit_elements_url, plemlAnnotatedElementsIDs.get("xor_constraint_type_id", []))
        featureRoots = get_elements_fromAPI(commit_elements_url, plemlAnnotatedElementsIDs.get("featureTree_type_id", []))
        features = get_elements_fromAPI(commit_elements_url, plemlAnnotatedElementsIDs.get("feature_type_id", []))
        featureConfigurationRoots = get_elements_fromAPI(commit_elements_url, plemlAnnotatedElementsIDs.get("feature_configuration_type_id", []))
        featureSpecializations = get_elements_byKind_fromAPI(query_url, "Subsetting")
        featureRedefinitions = get_elements_byKind_fromAPI(query_url, "Redefinition")
        featureValues = get_elements_byKind_fromAPI(query_url, "FeatureValue")

        # 3. Build the feature trees
        print("Building the feature trees...")
        featureTrees = {}
        for root in featureRoots:
            featureTrees[root['@id']] = FeatureNode(name=root['name'], element_id=root['@id'])
            for compositeFeature in root['ownedFeature']:
                try:
                    topLevelFeature = find_element_by_id(features, compositeFeature['@id'])
                    if topLevelFeature is None:
                        continue
                    if not topLevelFeature['ownedSpecialization']:
                        child_node = FeatureNode(name=topLevelFeature['name'], element_id=topLevelFeature['@id'], parent = featureTrees[root['@id']])
                        featureTrees[topLevelFeature['@id']] = child_node
                        buildFeatureTree(featureTrees, topLevelFeature, features, featureSpecializations)
                except Exception as e:
                    print(f"Error processing feature tree: {e}")
                    continue 
            print_feature_tree(featureTrees[root['@id']])

        # 4. Build the feature configuration
        print("Building the feature configuration...")
        featureConfigurationTrees = {}
        for root in featureConfigurationRoots:
            featureConfigurationTrees[root['@id']] = FeatureConfigurationNode(name=root['name'], element_id=root['@id'], isConfiguration=True)
            for compositeFeature in root['ownedFeature']:
                try:
                    topLevelFeature = find_element_by_id(features, compositeFeature['@id'])
                    if topLevelFeature is None:
                        continue
                    ownedRedefinition = topLevelFeature['ownedRedefinition']
                    ownedRedefinitionID = ownedRedefinition[0]['@id']
                    redefiningFeatureID = None
                    selection = []
                    selection_id = []
                    if ownedRedefinitionID:
                        redefinition = find_element_by_id(featureRedefinitions, ownedRedefinitionID)
                        if redefinition:
                            for relationship in topLevelFeature['ownedRelationship']:
                                if any(item['@id'] == relationship['@id'] for item in featureValues):
                                    featureValue = get_element_fromAPI(commit_elements_url, relationship['@id'])
                                    value = get_element_fromAPI(commit_elements_url, featureValue['value']['@id'])
                                    if value['@type'] == "FeatureReferenceExpression":
                                        referent = get_element_fromAPI(commit_elements_url, value['referent']['@id'])
                                        selection.append(referent['name'])
                                        selection_id.append(referent['@id'])
                                    elif value['@type'] == "OperatorExpression":
                                        for operand in value['input']:
                                            featureOperand = get_element_fromAPI(commit_elements_url, operand['@id'])
                                            featureReference = get_element_fromAPI(commit_elements_url, featureOperand['ownedMember'][0]['@id'])
                                            referent = get_element_fromAPI(commit_elements_url, featureReference['referent']['@id'])
                                            selection.append(referent['name'])
                                            selection_id.append(referent['@id'])
                                
                    child_node = FeatureConfigurationNode(name=topLevelFeature['name'], element_id=topLevelFeature['@id'], isConfiguration=False, parent = featureConfigurationTrees[root['@id']], selection=selection, selection_id=selection_id)
                    featureConfigurationTrees[topLevelFeature['@id']] = child_node
                except Exception as e:
                    print(f"Error processing feature configuration: {e}")
                    continue 
            print_feature_configuration(featureConfigurationTrees[root['@id']])

        # 5. Convert trees to JSON
        try:
            print("Converting trees to JSON...")
            feature_json = [featuretree_to_json(featureTrees[root['@id']]) for root in featureRoots if root['@id'] in featureTrees]
            feature_config_json = [featureconfiguration_to_json(featureConfigurationTrees[root['@id']]) for root in featureConfigurationRoots]
        except Exception as e:
            print(f"Error converting trees to JSON: {e}")
            feature_json = []
            feature_config_json = []

        # 6. Generate the textual tree
        try:
            featureTree_output = generate_textual_featuretree(feature_json)
            feature_configurations_textual_tree = generate_textual_feature_configuration_tree(feature_config_json)            
        except Exception as e: 
            print(f"Error generating textual tree: {e}")
            feature_configurations_textual_tree = ""
            featureTree_output = ""

        # 7. Save JSON to files
        try:
            filename = "features"
            save_json_to_file(filename + ".json", feature_json)
            features_csv = save_featuretree_json_to_csv(feature_json, filename + ".csv")
            filename = "feature_configurations"
            save_json_to_file(filename + ".json", feature_config_json)
            feature_configurations_csv = save_featureconfiguration_json_to_csv(feature_config_json, filename + ".csv")
        except Exception as e:
            print(f"Error saving JSON to files: {e}")
            features_csv = ""
            feature_configurations_csv = ""            
                
        # 8. Return the result depending on response_format and response_kind
        print(f"Returning response in format: {response_format}, kind: {response_kind}")
        if response_format == "text":
            if response_kind == "features":
                return jsonify({"textual_tree": featureTree_output})
            elif response_kind == "feature_configurations":
                return jsonify({"textual_tree": feature_configurations_textual_tree})
            else:
                return jsonify({"error": "Invalid response kind provided"}), 400            
        elif response_format == "json":
            if response_kind == "features":
                try:
                    print("Returning feature_json:")
                    print("✅ JSON Output:\n", feature_json)
                    print("\n🔍 Type of feature_json:", type(feature_json))
                    print("✅ First item in JSON tree (if any):", feature_json if isinstance(feature_json, dict) else "Not a dict!")
                    print("🔍 Checking custom_json_encoder function:", custom_json_encoder)
                    feature_json_string = json.dumps(feature_json, indent=2, default=custom_json_encoder)  # ✅ Use custom encoder
                    # feature_json = json.dumps(feature_json, indent=2)
                    print("JSON dumps: ", json.dumps(feature_json, indent=2, default=custom_json_encoder))  # ✅ Use custom encoder
                    return feature_json_string, 200,  {'Content-Type': 'application/json'} 
                    # json.dumps(feature_json, indent=2), 200, {'Content-Type': 'application/json'}
                except Exception as e:
                    print("❌ JSON dumps failed with error:", str(e))
            elif response_kind == "feature_configurations":
                return json.dumps(feature_config_json, indent=2), 200, {'Content-Type': 'application/json'}
            else:
                return jsonify({"error": "Invalid response kind provided"}), 400
        elif response_format == "csv":
            if response_kind == "features":
                return Response(features_csv, mimetype="text/csv")
            elif response_kind == "feature_configurations":
                return Response(feature_configurations_csv, mimetype="text/csv")            
            else:
                return jsonify({"error": "Invalid response kind provided"}), 400            
        else:
                return jsonify({"error": "Invalid response style provided"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/openai-analyze', methods=['POST'])
@handle_errors
def openai_analyze():
    """
    Receives the feature tree text from the front-end,
    calls OpenAI, returns AI suggestions as JSON.
    """
    data = request.json
    feature_tree_text = data.get("featureTree", "")

    if not feature_tree_text:
        return jsonify({"error": "No feature tree text provided"}), 400

    try:
        # -- Example using the OpenAI Chat API (via requests) --
        openai_api_key = os.getenv("OPENAI_API_KEY", "YOUR_OPENAI_API_KEY")
        openai_endpoint = "https://api.openai.com/v1/chat/completions"

        prompt = (
            "We have this feature tree:\n\n"
            f"{feature_tree_text}\n\n"
            "Please identify potential errors and propose optimizations.\n"
        )

        payload = {
            "model": "gpt-3.5-turbo",
            "messages": [{"role": "user", "content": prompt}],
        }

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {openai_api_key}",
        }

        response = requests.post(openai_endpoint, headers=headers, json=payload)
        response.raise_for_status()
        ai_data = response.json()

        # Extract the AI's message from response
        if ("choices" in ai_data and 
            len(ai_data["choices"]) > 0 and 
            "message" in ai_data["choices"][0]):
            ai_analysis = ai_data["choices"][0]["message"]["content"]
        else:
            ai_analysis = "No content returned from OpenAI."

        return jsonify({"aiAnalysis": ai_analysis})

    except requests.HTTPError as http_err:
        return jsonify({"error": f"HTTP error: {str(http_err)}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
