import json

file_path = r'c:\Users\USER\Documents\portfolio-shared\src\data\projects.json'

with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

for project in data['projects']:
    if project['slug'] == 'kampanye-hadiah-digital-liburan':
        project['software'] = ['canva', 'photoshop']
    else:
        project['software'] = ['photoshop']

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("Successfully updated projects.json with software metadata.")
