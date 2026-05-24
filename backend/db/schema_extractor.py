import mysql.connector
from db.schema_cache import schema_cache


def get_table_metadata(connection, table_name: str) -> dict:

    # Step 1: Check cache first
    if table_name in schema_cache:
        return schema_cache[table_name]

    # Step 2: Cache miss — fetch from DB
    cursor = connection.cursor(dictionary=True)

    # Fetch columns
    cursor.execute(f"""
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = %s
    """, (table_name,))
    columns = cursor.fetchall()

    # Fetch indexes
    cursor.execute(f"SHOW INDEX FROM `{table_name}`")
    indexes = cursor.fetchall()
# Fetch foreign keys
    cursor.execute("""
        SELECT
            COLUMN_NAME,
            REFERENCED_TABLE_NAME,
            REFERENCED_COLUMN_NAME
        FROM
            INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE
            TABLE_NAME = %s
            AND REFERENCED_TABLE_NAME IS NOT NULL
    """, (table_name,))
    foreign_keys = cursor.fetchall()

    metadata = {
        "columns": columns,
        "indexes": indexes,
        "indexed_columns": [
            row["Column_name"] for row in indexes
        ],
        "foreign_keys": foreign_keys
    }

    # Step 4: Store in cache
    schema_cache[table_name] = metadata

    cursor.close()
    return metadata     