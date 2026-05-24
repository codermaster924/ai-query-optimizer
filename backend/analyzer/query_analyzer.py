import sqlglot
from sqlglot import exp
from analyzer.table_extractor import extract_tables
from db.schema_extractor import get_table_metadata
from ai.ai_optimizer import get_ai_recommendation
def analyze_sql(sql: str, connection) -> dict:

    issues = []
    schema={}

    try:
        parsed = sqlglot.parse_one(sql)

        # Detect SELECT *
        select_expressions = parsed.find(exp.Select)

        if select_expressions:
            for projection in select_expressions.expressions:
                if isinstance(projection, exp.Star):
                    issues.append({
                        "issue": "SELECT * detected",
                        "suggestion": "Specify only required columns"
                    })
        # Step 2 — Extract table names from query
        tables = extract_tables(sql)

        # Step 3 — Fetch metadata for each table
        for table_name in tables:
            metadata = get_table_metadata(connection, table_name)
            schema[table_name] = metadata
            # Step 4 — Schema-aware analysis
            # Check WHERE clause columns against indexed columns
            where_clause = parsed.find(exp.Where)

            if where_clause:
                for column in where_clause.find_all(exp.Column):
                    col_name = column.name

                    if col_name not in metadata["indexed_columns"]:
                        issues.append({
                            "issue": f"Column '{col_name}' used in WHERE clause has no index",
                            "table": table_name,
                            "suggestion": f"Consider adding an index on '{col_name}'"
                        })
        # Step 5 — AI recommendation
        ai_response = get_ai_recommendation(sql, issues, schema)

    except Exception as e:
        return {"error": str(e)}

    if not issues :
        return {
            "orginal_query":sql,
            "message": "No obvious issues found",
            "Ai_recommendations":ai_response
            }

    return {
        "orginal_query":sql,
        "issues": issues,
        "ai_recommendations":ai_response
        }