import sqlglot
from sqlglot import exp
from analyzer.table_extractor import extract_tables
from db.schema_extractor import get_table_metadata
from ai.ai_optimizer import get_ai_recommendation
from analyzer.column_validator import validate_columns


def analyze_sql(sql: str, connection) -> dict:

    issues = []
    schema = {}

    try:
        parsed = sqlglot.parse_one(sql)

        # ─────────────────────────────────────────
        # RULE 1 — SELECT *
        # ─────────────────────────────────────────
        select_expressions = parsed.find(exp.Select)
        if select_expressions:
            for projection in select_expressions.expressions:
                if isinstance(projection, exp.Star):
                    issues.append({
                        "issue": "SELECT * detected",
                        "suggestion": "Specify only required columns to reduce network transfer and improve performance"
                    })

        # ─────────────────────────────────────────
        # RULE 2 — NATURAL JOIN
        # ─────────────────────────────────────────
        for join in parsed.find_all(exp.Join):
            if join.args.get("method") == "NATURAL":
                issues.append({
                    "issue": "NATURAL JOIN detected",
                    "suggestion": "Use explicit JOIN with ON condition. NATURAL JOIN silently breaks if column names change"
                })

        # ─────────────────────────────────────────
        # RULE 3 — JOIN without ON (cartesian product)
        # ─────────────────────────────────────────
        for join in parsed.find_all(exp.Join):
            has_on = join.args.get("on")
            has_using = join.args.get("using")
            is_natural = str(join.args.get("method", "")).upper() == "NATURAL"
            is_cross = str(join.args.get("kind", "")).upper() == "CROSS"

            if not has_on and not has_using and not is_natural and not is_cross:
                issues.append({
                    "issue": "JOIN without ON condition detected — this is a cartesian product",
                    "suggestion": "Add an ON condition to your JOIN. A cartesian product multiplies every row with every other row"
                })

        # ─────────────────────────────────────────
        # RULE 4 — DISTINCT
        # ─────────────────────────────────────────
        if parsed.find(exp.Distinct):
            issues.append({
                "issue": "DISTINCT detected",
                "suggestion": "DISTINCT sorts and deduplicates the entire result set. Verify it is actually needed — it may indicate a JOIN producing duplicate rows"
            })

        # ─────────────────────────────────────────
        # RULE 5 — LIKE with leading wildcard
        # ─────────────────────────────────────────
        for like in parsed.find_all(exp.Like):
            right = like.args.get("expression")
            if right:
                val = str(right).strip("'\"")
                if val.startswith("%"):
                    issues.append({
                        "issue": f"LIKE '{val}' uses a leading wildcard",
                        "suggestion": "A leading % prevents index usage and causes a full table scan. Consider full-text search instead"
                    })

        # ─────────────────────────────────────────
        # RULE 6 — Subquery in IN clause
        # ─────────────────────────────────────────
        for subquery in parsed.find_all(exp.Subquery):
            parent = subquery.parent
            if isinstance(parent, exp.In):
                issues.append({
                    "issue": "Subquery in IN clause detected",
                    "suggestion": "Subqueries in IN() are often slower than equivalent JOINs. Consider rewriting as JOIN or EXISTS"
                })

        # ─────────────────────────────────────────
        # Extract tables + fetch schema
        # ─────────────────────────────────────────
        tables = extract_tables(sql)

        for table_name in tables:
            metadata = get_table_metadata(connection, table_name)
            schema[table_name] = metadata

        # ─────────────────────────────────────────
        # RULE 10 — Column validation
        # ─────────────────────────────────────────
        column_issues = validate_columns(parsed, schema)
        issues.extend(column_issues)

        # Build combined indexed columns set across all tables
        all_indexed_columns = set()
        for meta in schema.values():
            for col in meta["indexed_columns"]:
                all_indexed_columns.add(col)

        # RULE 7 — Unindexed WHERE column
        where_clause = parsed.find(exp.Where)
        if where_clause:
            seen = set()
            for column in where_clause.find_all(exp.Column):
                col_name = column.name
                if col_name not in all_indexed_columns and col_name not in seen:
                    seen.add(col_name)
                    table_for_col = None
                    for table_name, meta in schema.items():
                        col_names = [c["COLUMN_NAME"] for c in meta["columns"]]
                        if col_name in col_names:
                            table_for_col = table_name
                            break
                    issues.append({
                        "issue": f"Column '{col_name}' in WHERE clause has no index",
                        "table": table_for_col or "unknown",
                        "suggestion": f"Consider: CREATE INDEX idx_{table_for_col}_{col_name} ON {table_for_col}({col_name})"
                    })

        # RULE 8 — Unindexed ORDER BY column
        order_clause = parsed.find(exp.Order)
        if order_clause:
            seen_order = set()
            for ordered in order_clause.find_all(exp.Column):
                col_name = ordered.name
                if col_name not in all_indexed_columns and col_name not in seen_order:
                    seen_order.add(col_name)
                    issues.append({
                        "issue": f"Column '{col_name}' in ORDER BY has no index",
                        "suggestion": "Sorting on unindexed columns requires a full sort operation"
                    })

        # RULE 9 — OR in WHERE clause
        if where_clause:
            for or_expr in where_clause.find_all(exp.Or):
                issues.append({
                    "issue": "OR condition in WHERE clause detected",
                    "suggestion": "OR conditions can prevent index usage. Consider rewriting as UNION or using IN() instead"
                })

        # ─────────────────────────────────────────
        # AI recommendation
        # ─────────────────────────────────────────
        ai_response = get_ai_recommendation(sql, issues, schema)

    except Exception as e:
        return {"error": str(e)}

    if not issues:
        return {
            "orginal_query": sql,
            "message": "No obvious issues found",
            "ai_recommendations": ai_response
        }

    return {
        "orginal_query": sql,
        "issues": issues,
        "ai_recommendations": ai_response
    }