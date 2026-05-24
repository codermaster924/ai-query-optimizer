import mysql.connector

db_connection = None


def connect_to_database(host: str, user: str, password: str, database: str) -> dict:

    global db_connection

    try:
        db_connection = mysql.connector.connect(
            host=host,
            user=user,
            password=password,
            database=database
        )

        if db_connection.is_connected():
            return {
                "success": True,
                "message": "Database connection successful"
            }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def get_connection():

    if db_connection is None:
        raise Exception("No active database connection. Call /connect-db first.")

    return db_connection