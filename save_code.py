import os


def generate_context(project_path, output_file):
    ignore_dirs = {'.git', '__pycache__', '.venv', '.env', 'node_modules'}

    with open(output_file, 'w', encoding='utf-8') as outfile:
        for root, dirs, files in os.walk(project_path):
            dirs[:] = [d for d in dirs if d not in ignore_dirs]
            for file in files:
                if file.endswith(('.py', '.yaml', '.md', '.ini')):
                    file_path = os.path.join(root, file)
                    try:
                        with open(file_path, 'r', encoding='utf-8') as infile:
                            outfile.write(f"\n\n--- {file_path} ---\n")
                            outfile.write(infile.read())
                    except Exception as e:
                        print(f"Error reading {file_path}: {e}")


generate_context('.', 'fastapi_project_context.txt')
