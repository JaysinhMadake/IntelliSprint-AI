import mysql.connector
import os

def get_db_connection():
    # Update these with your MySQL credentials if needed
    config = {
        'host': 'localhost',
        'user': 'root',
        'password': 'Jay@0611', # Defaulting to empty, change if necessary
        'database': 'sprint_planner'
    }
    try:
        conn = mysql.connector.connect(**config)
        return conn
    except mysql.connector.Error as err:
        print(f"Error: {err}")
        raise err
