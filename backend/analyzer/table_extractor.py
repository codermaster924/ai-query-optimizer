import sqlglot
from sqlglot import exp


def extract_tables(sql: str) -> list:

    tables = []

    try:
        parsed = sqlglot.parse_one(sql)

        for table in parsed.find_all(exp.Table):
            tables.append(table.name)

    except Exception as e:
        return []

    return tables