import json

try:
    with open('lighthouse-report.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    categories = data.get('categories', {})
    
    perf = categories.get('performance', {}).get('score', 0) * 100
    acc = categories.get('accessibility', {}).get('score', 0) * 100
    bp = categories.get('best-practices', {}).get('score', 0) * 100
    seo = categories.get('seo', {}).get('score', 0) * 100
    
    print(f"Performance: {perf}")
    print(f"Accessibility: {acc}")
    print(f"Best Practices: {bp}")
    print(f"SEO: {seo}")

except Exception as e:
    print(f"Error: {e}")
