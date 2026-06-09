import os


def generate_frontend_context(project_path, output_file):
    ignore_dirs = {
        ".git",
        "__pycache__",
        ".venv",
        "node_modules",
        "dist",
        ".vite",
    }

    allowed_extensions = {
        ".ts",
        ".tsx",
        ".js",
        ".jsx",
        ".css",
        ".scss",
        ".html",
        ".json",
        ".md",
        ".yml",
        ".yaml",
    }

    allowed_filenames = {
        "Dockerfile",
        "Makefile",
        ".env.example",
        ".gitignore",
        "vite.config.ts",
        "tsconfig.json",
        "tsconfig.app.json",
        "tsconfig.node.json",
        "package.json",
    }

    ignored_filenames = {
        ".env",
    }

    with open(output_file, "w", encoding="utf-8") as outfile:
        for root, dirs, files in os.walk(project_path):
            dirs[:] = [d for d in dirs if d not in ignore_dirs]

            for file in files:
                file_path = os.path.join(root, file)
                _, ext = os.path.splitext(file)

                if file in ignored_filenames:
                    continue

                if ext not in allowed_extensions and file not in allowed_filenames:
                    continue

                try:
                    with open(file_path, "r", encoding="utf-8") as infile:
                        outfile.write(f"\n\n--- {file_path} ---\n")
                        outfile.write(infile.read())
                except Exception as e:
                    print(f"Error reading {file_path}: {e}")


generate_frontend_context("./frontend", "frontend_project_context.txt")