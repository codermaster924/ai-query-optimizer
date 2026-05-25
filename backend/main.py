from fastapi import FastAPI
from pydantic import BaseModel
from db.db_connection import connect_to_database, get_connection
from analyzer.query_analyzer import analyze_sql

app = FastAPI()
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class DatabaseConfig(BaseModel):
    host: str
    user: str
    password: str
    database: str


class QueryInput(BaseModel):
    sql_query: str
    intent: str = ""

@app.get("/")
def home():
    return {"message": "AI Query Optimizer Backend Running"}


@app.post("/connect-db")
def connect_db(config: DatabaseConfig):
    return connect_to_database(
        config.host,
        config.user,
        config.password,
        config.database
    )


@app.post("/analyze")
def analyze_query(query: QueryInput):

    try:
        connection = get_connection()
    except Exception as e:
        return {"error": str(e)}

    return analyze_sql(query.sql_query, connection,query.intent)