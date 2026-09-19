import urllib.request, json, time

base = 'http://127.0.0.1:8000'

# Health
res = urllib.request.urlopen(f'{base}/api/ai/health')
print('AI Health:', res.read().decode())

# Models
res = urllib.request.urlopen(f'{base}/api/ai/models')
print('AI Models:', res.read().decode())

prompts = [
    'What is React.js?',
    'Explain recursion.',
    'Write a Python function that reverses a string.',
    'Give me three interesting project ideas.',
    'What is the difference between TCP and UDP?',
    'Write a short poem about rain.'
]

for p in prompts:
    data = json.dumps({'prompt': p}).encode()
    req = urllib.request.Request(f'{base}/api/ai/test', data=data, headers={'Content-Type': 'application/json'})
    res = urllib.request.urlopen(req)
    body = json.loads(res.read().decode())
    print('==================================================')
    print('PROMPT:', p)
    print('MODEL:', body.get('model'), '| LATENCY:', body.get('latencyMs'), 'ms')
    print('RESPONSE:', body.get('response'))
