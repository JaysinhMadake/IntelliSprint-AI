import mysql.connector
import os

def get_db_connection():
    # Environment variables for production, defaults for local development
    config = {
        'host': os.environ.get('DB_HOST', 'localhost'),
        'user': os.environ.get('DB_USER', 'root'),
        'password': os.environ.get('DB_PASSWORD', 'Jay@0611'),
        'database': os.environ.get('DB_NAME', 'sprint_planner'),
        'port': int(os.environ.get('DB_PORT', 3306)),
        'ssl_disabled': os.environ.get('DB_HOST', 'localhost') == 'localhost'
    }
    
    try:
        conn = mysql.connector.connect(**config)
        return conn
    except mysql.connector.Error as err:
        print(f"Error: {err}")
        raise err
