from flask import Flask, send_from_directory, request, jsonify, Response
import requests
from anytree import NodeMixin
import os
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
        plemlDefinitions = get_plemldefinition_ids_workaround(server_url, project_id)

        # Basic validation
        if not all([server_url, project_id, commit_id, 
                    plemlDefinitions["feature_type_id"], plemlDefinitions["feature_configuration_type_id"], 
                    plemlDefinitions["requires_constraint_type_id"], plemlDefinitions["xor_constraint_type_id"]]):
            return jsonify({
                "error": "One or more required fields is missing: (server_url, project_id, commit_id, feature_type_id, featureconfiguration_type_id, requiresConstraint_type_id, xorConstraint_type_id)."
            }), 400

        # 1. Retrieve the IDs of the annotated elements from the metdata usages (feature config, features, constraints) 
        query_url = f"{server_url}/projects/{project_id}/query-results"
        plemlAnnotatedElementsIDs = get_metadatausage_annotatedElement_ids_workaround(query_url, plemlDefinitions)
              
        # 2. Fetch the actual elements from the commit
        commit_elements_url = f"{server_url}/projects/{project_id}/commits/{commit_id}/elements"
        # requireConstraints = get_elements(commit_elements_url, plemlAnnotatedElementsIDs.get("requires_constraint_type_id", []))
        # xorConstraints = get_elements(commit_elements_url, plemlAnnotatedElementsIDs.get("xor_constraint_type_id", []))
        features = get_elements(commit_elements_url, plemlAnnotatedElementsIDs.get("feature_type_id", []))
        featureConfigurationRoots = get_elements(commit_elements_url, plemlAnnotatedElementsIDs.get("feature_configuration_type_id", []))

        # 3. Get the feature tree roots
        featureRoots = []
        for element in features:
            if element.get("@type") == "Definition":
                print(f"Feature Tree Root: {element}")
                featureRoots.append(element)        
        for root in featureRoots:
            features.remove(root)

        # 4. Build the feature trees
        featureTrees = {}
        for root in featureRoots:
            featureTrees[root.get("@id")] = ElementNode(name=root.get("name"), element_id=root.get("@id"))
            linkParentWithChilds(featureTrees, root, features)
        featureTreeRoots = [
            node for node in featureTrees.values() 
            if node.is_root and node.element_id in plemlAnnotatedElementsIDs.get("feature_type_id", [])
        ]

        # 5. Build the feature configuration trees
        featureConfigurationTrees = {}
        for root in featureConfigurationRoots:
            featureConfigurationTrees[root.get("@id")] = ElementNode(name=root.get("name"), element_id=root.get("@id"))
            linkParentWithChilds(featureConfigurationTrees, root, features)
        featureConfigRoots = [
            node for node in featureConfigurationTrees.values()
            if node.is_root and node.element_id in plemlAnnotatedElementsIDs.get("feature_configuration_type_id", [])
        ]

        # 6. Convert trees to JSON
        feature_json = [tree_to_json(root) for root in featureTreeRoots]
        # print(json.dumps(feature_json, indent=4))
        feature_config_json = [tree_to_json(root) for root in featureConfigRoots]
        feature_config_json = replaceNodesWithLeaf(f"{server_url}/projects/{project_id}/commits/{commit_id}/elements", feature_config_json)
        # print(json.dumps(feature_config_json, indent=4))

        # 7. Generate the textual tree
        feature_configurations_textual_tree = generate_textual_tree(feature_config_json)
        featureTree_output = generate_textual_tree(feature_json)

        # 8. Save JSON to files
        filename = "feature_configurations"
        save_json_to_file(filename + ".json", feature_config_json)
        feature_configurations_csv = save_json_to_csv(feature_config_json, filename + ".csv")

        filename = "features"
        save_json_to_file(filename + ".json", feature_json)
        features_csv = save_json_to_csv(feature_json, filename + ".csv")

        # 9. Return the result depending on response_format and response_kind

        if response_format == "text":
            if response_kind == "features":
                return jsonify({"textual_tree": featureTree_output})
            elif response_kind == "feature_configurations":
                return jsonify({"textual_tree": feature_configurations_textual_tree})
            else:
                return jsonify({"error": "Invalid response kind provided"}), 400            
        elif response_format == "json":
            if response_kind == "features":
                return json.dumps(feature_json, indent=2), 200, {'Content-Type': 'application/json'}
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



def find_element_by_id(aggregated_results, target_id):
    for element in aggregated_results:
        if element.get("@id") == target_id:
            return element
    return None  # Return None if not found

# Define the ElementNode class to include the ownedRedefinition attribute
class ElementNode(NodeMixin):
    def __init__(self, name, element_id, owned_redefinition=None, parent=None):
        self.owned_redefinition = owned_redefinition
        self.name = name
        self.element_id = element_id
        self.parent = parent

    def __repr__(self):
        return f"ElementNode(name={self.name}, id={self.element_id}, owned_redefinition={self.owned_redefinition})"


def get_metadatausage_ids(query_url, metadefinition_id):
    """
    Queries the server for metadata usages and returns their IDs.

    Parameters:
        query_url (str): The URL to send the query request to.
        metadefinition_id (str): The ID of the corresponding metadata definition

    Returns:
        list: A list of XOR constraint IDs.
    """

    print(f"Called get_metadatausage_ids with ID: {metadefinition_id}")
    query_input = {
        '@type': 'Query',
        'where': {
            '@type': 'CompositeConstraint',
            'operator': 'and',
            'constraint': [
                {
                    '@type': 'PrimitiveConstraint',
                    'inverse': False,
                    'operator': '=',
                    'property': '@type',
                    'value': 'MetadataUsage'
                },
                {
                    '@type': 'PrimitiveConstraint',
                    'inverse': False,
                    'operator': '=',
                    'property': 'metadataDefinition',
                    'value': {'@id': metadefinition_id}
                }
            ]
        }
    }
    print(f"Query Input: {query_input}\n")
    query_response = session.post(query_url, json=query_input)
    if query_response.status_code == 200:
        query_response_json = query_response.json()
        if query_response_json and isinstance(query_response_json, list):
            element_ids = []
            for elem in query_response_json:
                annotated_elements = elem.get('annotatedElement', [])
                element_ids.extend(annotated.get('@id') for annotated in annotated_elements if '@id' in annotated)
            return element_ids
    else:
        raise ValueError(f"Failed to query metadata usages. Status code: {query_response.status_code}, details: {query_response.text}")

def get_elements(query_url, element_ids):
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
            element_json = get_element(query_url, element_id)
            if isinstance(element_json, list):
                elements.extend(element_json)
            else:
                elements.append(element_json)
        except Exception as e:
            print(f"Error processing element id {element_id}: {e}")
            continue  # Continue with the next ID
    return elements

def get_element(query_url, element_id):
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

def get_metadatausage_annotatedElement_ids_workaround(query_url, metadefinition_dict):
    """
    Retrieve annotatedElement IDs for multiple metadataDefinition IDs in a single query.
    
    :param query_url: The URL for the query API.
    :param metadefinition_dict: A dictionary of metadataDefinition IDs with descriptive keys.
    :return: A dictionary where keys are the descriptive keys from metadefinition_dict and values are lists of annotatedElement IDs.
    """
    print("Called get_metadatausage_annotatedElement_ids_workaround")
    
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
    print(f"Query Input: {query_input}")
    
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
        print(f"Annotated element: {a}, MetadataDefinition ID: {m}")
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


def get_plemldefinition_ids_workaround(server_url, project_id):
    print("Called get_plemldefinition_ids_workaround")
    
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
    print(f"Query Input: {query_input}")
    
    # Send the query
    query_response = session.get(query_url, json=query_input)
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

# Function to recursively convert a tree to a JSON structure
def tree_to_json(node):
    """Convert an ElementNode tree to a JSON-compatible dictionary."""
    return {
        "id": node.element_id,
        "name": node.name,
        "is_root": node.is_root,  # Include root status
        "ownedRedefinition": node.owned_redefinition,
        "children": [tree_to_json(child) for child in node.children],
    }


import csv
import io

def save_json_to_csv(feature_config_json, csv_file_path):
    """
    Saves the feature configuration JSON to a CSV file and returns the CSV content as a string.

    Args:
        feature_config_json (list): The JSON structure containing feature configurations.
        csv_file_path (str): The path to save the CSV file.

    Returns:
        str: The content of the CSV as a string.
    """
    # Helper function to recursively process nodes and collect data
    def process_node(node, parent_id=None, rows=None):
        if rows is None:
            rows = []
        # Append the current node data to rows
        rows.append({
            "id": node["id"],
            "name": node["name"],
            "is_root": node["is_root"],
            "parent_id": parent_id
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
        fieldnames = ["id", "name", "is_root", "parent_id"]
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

def replaceNodesWithLeaf(query_url, json_data):
    def traverse_tree(node, parent_redefinition=None):
        # Check if the node has an ownedRedefinition and print it
        redefinition = node.get("ownedRedefinition", parent_redefinition)
        if redefinition and redefinition != "None" and not node.get("children"):
            print(f"Element ID: {node['id']}, Name: {node['name']}, Redefinition: {redefinition}")
            collected_ids.append(node["id"])

        # Traverse children recursively
        for child in node.get("children", []):
            traverse_tree(child, redefinition)

    # Iterate through the top-level elements
    collected_ids = []
    for root in json_data:
        traverse_tree(root)

    # Initialize redefinedElements
    redefinedElements = []

    # Call get_elements with the collected IDs
    if collected_ids:
        redefinedElements = get_elements(query_url, collected_ids)
    else:
        print("No matching elements found.")        

    for redefinedElement in redefinedElements:
        redefinedElement_id = redefinedElement.get("@id")
        redefinedElement_name = redefinedElement.get("name")
        if not redefinedElement_id:
            continue
        print(f"\nGetting the value for Feature: {redefinedElement_name} (id: {redefinedElement_id})")

        # Extract ownedRelationship IDs
        relationships = [
            relationship.get("@id")
            for relationship in redefinedElement.get("ownedRelationship", [])
            if relationship.get("@id")
        ]
        print(f"Found {len(relationships)} ownedRelationships.")

        # Fetch details for each owned relationship and filter for type "FeatureValue"
        feature_value_relationships = []
        if relationships:
            relationship_details = get_elements(query_url, relationships)
            for detail in relationship_details:
                if detail.get("@type") == "FeatureValue":
                    feature_value_relationships.append(detail.get("@id"))
        print(f"{len(feature_value_relationships)} of them are FeatureValue relationships.")

        # Get the value
        feature_value_relationships_value_ids = []
        if feature_value_relationships:
            featureValues = get_elements(query_url, feature_value_relationships)
            for detail in featureValues:
                feature_value_relationships_value_ids.append(detail.get("value").get("@id"))
        print(f"Found {len(feature_value_relationships_value_ids)} values.")

        # The values are feature chain expressions if only one feature can be selected (otherwise OperatorExpression with ",")
        feature_chain_expression_targetFeature_ids = []
        if feature_value_relationships_value_ids:
            feature_value_relationships_value = get_elements(query_url, feature_value_relationships_value_ids)
            for detail in feature_value_relationships_value:
                print_element("feature_value_relationships_value", detail)

                if detail.get("@type") == "FeatureChainExpression":
                    feature_chain_expression_targetFeature_ids.append(detail.get("targetFeature").get("@id"))

        print(f"Found feature_chain_expression IDs: {feature_chain_expression_targetFeature_ids}")

        # Get the target feature of the feature chain expression
        if feature_chain_expression_targetFeature_ids:
            targetFeature = get_elements(query_url, feature_chain_expression_targetFeature_ids)
            for detail in targetFeature:
                print_element("targetFeature", detail)

                # Get the chaining features if it is a feature
                theSelectedFeature = None
                if detail and detail.get("@type") == "Feature":
                    if detail.get("chainingFeature", []) and isinstance(detail.get("chainingFeature", []), list):
                        theSelectedFeature_id = detail.get("chainingFeature", [])[-1].get("@id")  # Return the last item's "@id"
                        theSelectedFeature = get_element(query_url, theSelectedFeature_id)
                else:
                    theSelectedFeature = detail

                if theSelectedFeature != None:
                    json_data = add_child_to_feature(json_data, redefinedElement_id, theSelectedFeature)
                else:
                    print("SelectFeature is None")
    
    return json_data

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
                "is_root": False,
                "ownedRedefinition": selected_feature.get("ownedRedefinition", None),
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


def generate_textual_tree(data, indent=0):
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
            tree_representation += generate_textual_tree(element, indent)
    elif isinstance(data, dict):
        # Add the current element's name with indentation
        tree_representation += " " * indent + f"- {data['name']}\n"
        
        # Recursively add children
        if "children" in data and isinstance(data["children"], list):
            tree_representation += generate_textual_tree(data["children"], indent + 2)
    
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

        # Write the data to the file
        with open(file_path, "w") as file:
            json.dump(data, file, indent=indent)

        print(f"JSON file saved successfully at: {file_path}")
        return True
    except (IOError, TypeError) as error:
        print(f"Failed to save JSON file at {file_path}. Error: {error}")
        return False


def linkParentWithChilds(featureTree, parentJSON, features):
    parent_id = parentJSON.get("@id")
    owned_usages = parentJSON.get("ownedMember", [])
    
    for usage in owned_usages:
        child_element = find_element_by_id(features, usage.get("@id"))
        if child_element is None:
            continue
        child_node = ElementNode(name=child_element.get("name"), element_id=child_element.get("@id"), parent = featureTree[parent_id], owned_redefinition=child_element.get("ownedRedefinition"))
        featureTree[child_element.get("@id")] = child_node
        linkParentWithChilds(featureTree, child_element, features)


if __name__ == '__main__':
    app.run(debug=True)
