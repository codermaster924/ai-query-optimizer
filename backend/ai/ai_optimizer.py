from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:11434/v1",
    api_key="ollama"
)


def get_ai_recommendation(sql: str, issues: list, schema: dict, intent: str = "") -> str:

    issues_text = "\n".join([
        f"- {i['issue']}: {i.get('suggestion', '')}"
        for i in issues
    ])if issues else  "No issues detected by static analyzer"

    schema_text = "\n".join([
        f"Table '{table}': "
        f"columns={[c['COLUMN_NAME'] for c in meta['columns']]}, "
        f"indexed={meta['indexed_columns']}, "
        f"foreign_keys={[(fk['COLUMN_NAME'], '->', fk['REFERENCED_TABLE_NAME'] + '.' + fk['REFERENCED_COLUMN_NAME']) for fk in meta['foreign_keys']]}"
        for table, meta in schema.items()
    ])

    intent_text = f"\nOptimization goal: {intent}" if intent else ""

    prompt = f"""
You are an expert database query optimizer.

Original SQL query:
{sql}

Schema information:
{schema_text}

Issues detected:
{issues_text}
{intent_text}

Your job:
1. Write an optimized version of the query
2. Explain every change you made and why it helps performance
3. Be specific — mention indexes, column selection, join order

Respond EXACTLY in this format and no other:
OPTIMIZED QUERY:
<only the SQL here, no explanation>

EXPLANATION:
<only the explanation here, no SQL>
"""

    response = client.chat.completions.create(
        model="llama3.2:latest",
        messages=[
            {
                "role": "system",
                "content": "You are a database performance expert. Always respond with optimized SQL and clear explanations."
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
    )
    raw = response.choices[0].message.content
    optimized_query = ""
    explanation = ""

    if "OPTIMIZED QUERY:" in raw and "EXPLANATION:" in raw:
        parts = raw.split("EXPLANATION:")
        optimized_query = parts[0].replace("OPTIMIZED QUERY:", "").strip()
        explanation = parts[1].strip()
    else:
        explanation = raw

    return {
        "optimized_query": optimized_query,
        "explanation": explanation
    }