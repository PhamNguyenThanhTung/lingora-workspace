import json

with open(r'C:\Users\tungt\.gemini\antigravity\brain\724467af-efd2-4390-b3f0-1ee08f7199df\.system_generated\logs\transcript.jsonl', 'r', encoding='utf-8') as f:
    for line in f:
        obj = json.loads(line)
        if obj.get('step_index') == 694:
            tc = obj['tool_calls'][0]
            cmd = tc['args']['CommandLine']
            prefix = 'py -3.11 -c "'
            if cmd.startswith(prefix) and cmd.endswith('"'):
                inner = cmd[len(prefix):-1]
                code = inner.replace('\\"', '"').replace('\\\\', '\\')
                with open(r'D:\school\btl\scratch\generate_uml_use_case_clean.py', 'w', encoding='utf-8') as out:
                    out.write(code)
                print("Saved generate_uml_use_case_clean.py, length:", len(code))
