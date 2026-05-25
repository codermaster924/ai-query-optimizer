from sqlglot import exp


def validate_columns(parsed, schema: dict) -> list:

    issues = []

    # Build a map of all columns that actually exist across queried tables
    # { "snum": ["student", "enrolled"], "sname": ["student"], ... }
    existing_columns = {}
    for table_name, meta in schema.items():
        for col in meta["columns"]:
            col_name = col["COLUMN_NAME"].lower()
            if col_name not in existing_columns:
                existing_columns[col_name] = []
            existing_columns[col_name].append(table_name)

    # Extract every column mentioned anywhere in the query
    seen = set()
    for column in parsed.find_all(exp.Column):
        col_name = column.name.lower()

        if col_name in seen:
            continue
        seen.add(col_name)

        # Check if it exists in any queried table
        if col_name not in existing_columns:

            # Find similar names — same first 3 characters
            similar = [
                c for c in existing_columns.keys()
                if c[:3] == col_name[:3] and c != col_name
            ]

            # Get primary keys as fallback
            pks = []
            for table_name, meta in schema.items():
                for col in meta["columns"]:
                    if col["COLUMN_KEY"] == "PRI":
                        pks.append(f"{table_name}.{col['COLUMN_NAME']}")

            if similar:
                issues.append({
                    "issue": f"Column '{col_name}' does not exist in any queried table",
                    "suggestion": f"Did you mean: {similar}? If not, check your table list"
                })
            else:
                issues.append({
                    "issue": f"Column '{col_name}' does not exist in any queried table",
                    "suggestion": f"Column not found. Primary keys in queried tables: {pks}"
                })

    return issues