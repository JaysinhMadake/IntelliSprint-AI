from flask import Flask, request, jsonify, session
from flask_cors import CORS
from flask_session import Session
import mysql.connector
from werkzeug.security import generate_password_hash, check_password_hash
import os
from db_utils import get_db_connection
from ai_utils import predict_task_time, auto_assign_tasks

app = Flask(__name__)
app.config['SECRET_KEY'] = 'super-secret-key'
app.config['SESSION_TYPE'] = 'filesystem'
Session(app)
CORS(app, supports_credentials=True)

# Auth Routes
@app.route('/register', methods=['POST'])
def register():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    password = generate_password_hash(data.get('password'))

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("INSERT INTO users (name, email, password) VALUES (%s, %s, %s)", (name, email, password))
        conn.commit()
        return jsonify({"message": "User registered successfully"}), 201
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 400
    finally:
        cursor.close()
        conn.close()

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()

    if user and check_password_hash(user['password'], password):
        session['user_id'] = user['id']
        session['user_name'] = user['name']
        return jsonify({"message": "Login successful", "user": {"id": user['id'], "name": user['name']}}), 200
    return jsonify({"error": "Invalid credentials"}), 401

@app.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"message": "Logged out"}), 200

@app.route('/check', methods=['GET'])
def check_auth():
    if 'user_id' in session:
        return jsonify({"authenticated": True, "user": {"id": session['user_id'], "name": session['user_name']}}), 200
    return jsonify({"authenticated": False}), 401

# Project Routes
@app.route('/projects', methods=['GET', 'POST'])
def handle_projects():
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    if request.method == 'POST':
        data = request.json
        name = data.get('name')
        team_name = data.get('team_name')
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        cursor.execute("INSERT INTO projects (name, team_name, start_date, end_date, user_id) VALUES (%s, %s, %s, %s, %s)", 
                       (name, team_name, start_date, end_date, session['user_id']))
        conn.commit()
        project_id = cursor.lastrowid
        cursor.close()
        conn.close()
        return jsonify({"message": "Project created", "id": project_id}), 201
    
    else:
        cursor.execute("SELECT * FROM projects WHERE user_id = %s", (session['user_id'],))
        projects = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(projects), 200

# Task Routes
@app.route('/tasks/<int:project_id>', methods=['GET'])
def get_tasks(project_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT t.*, m.name as assigned_to 
        FROM tasks t 
        LEFT JOIN assignments a ON t.id = a.task_id 
        LEFT JOIN team_members m ON a.member_id = m.id 
        WHERE t.project_id = %s
    """, (project_id,))
    tasks = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(tasks), 200

@app.route('/add-task', methods=['POST'])
def add_task():
    data = request.json
    title = data.get('title')
    description = data.get('description')
    priority = data.get('priority')
    estimated_time = data.get('estimated_time')
    required_skill = data.get('required_skill')
    project_id = data.get('project_id')
    start_date = data.get('start_date')
    end_date = data.get('end_date')

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO tasks (title, description, priority, estimated_time, required_skill, project_id, start_date, end_date) 
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """, (title, description, priority, estimated_time, required_skill, project_id, start_date, end_date))
    conn.commit()
    task_id = cursor.lastrowid
    cursor.close()
    conn.close()
    return jsonify({"message": "Task added", "id": task_id}), 201

@app.route('/update-status', methods=['POST'])
def update_status():
    data = request.json
    task_id = data.get('task_id')
    status = data.get('status')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE tasks SET status = %s WHERE id = %s", (status, task_id))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Status updated"}), 200

@app.route('/task/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM tasks WHERE id = %s", (task_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Task deleted"}), 200

@app.route('/task/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    data = request.json
    title = data.get('title')
    description = data.get('description')
    priority = data.get('priority')
    estimated_time = data.get('estimated_time')
    required_skill = data.get('required_skill')
    actual_time = data.get('actual_time')
    start_date = data.get('start_date')
    end_date = data.get('end_date')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE tasks 
        SET title = %s, description = %s, priority = %s, estimated_time = %s, required_skill = %s, actual_time = %s, start_date = %s, end_date = %s 
        WHERE id = %s
    """, (title, description, priority, estimated_time, required_skill, actual_time, start_date, end_date, task_id))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Task updated"}), 200

# Member Routes
@app.route('/members/<int:project_id>', methods=['GET'])
def get_members(project_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM team_members WHERE project_id = %s", (project_id,))
    members = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(members), 200

@app.route('/add-member', methods=['POST'])
def add_member():
    data = request.json
    name = data.get('name')
    skills = data.get('skills')
    availability = data.get('availability')
    project_id = data.get('project_id')

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO team_members (name, skills, availability, project_id) VALUES (%s, %s, %s, %s)", 
                   (name, skills, availability, project_id))
    conn.commit()
    member_id = cursor.lastrowid
    cursor.close()
    conn.close()
    return jsonify({"message": "Member added", "id": member_id}), 201

@app.route('/member/<int:member_id>', methods=['DELETE'])
def delete_member(member_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM team_members WHERE id = %s", (member_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Member deleted"}), 200

# AI Routes
@app.route('/predict-time', methods=['POST'])
def predict_time():
    data = request.json
    priority = data.get('priority')
    # Logic will be in ai_utils
    prediction = predict_task_time(priority)
    return jsonify(prediction), 200

@app.route('/auto-assign', methods=['POST'])
def auto_assign():
    data = request.json
    project_id = data.get('project_id')
    result = auto_assign_tasks(project_id)
    return jsonify(result), 200

# Analytics Route
@app.route('/analytics/<int:project_id>', methods=['GET'])
def get_analytics(project_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Status Distribution
    cursor.execute("SELECT status, COUNT(*) as count FROM tasks WHERE project_id = %s GROUP BY status", (project_id,))
    status_dist = cursor.fetchall()
    
    # Priority Distribution
    cursor.execute("SELECT priority, COUNT(*) as count FROM tasks WHERE project_id = %s GROUP BY priority", (project_id,))
    priority_dist = cursor.fetchall()
    
    # Member Workload (Tasks assigned)
    cursor.execute("""
        SELECT m.name, COUNT(a.task_id) as task_count 
        FROM team_members m 
        LEFT JOIN assignments a ON m.id = a.member_id 
        WHERE m.project_id = %s 
        GROUP BY m.id
    """, (project_id,))
    workload = cursor.fetchall()
    
    cursor.close()
    conn.close()
    return jsonify({
        "status_distribution": status_dist,
        "priority_distribution": priority_dist,
        "workload": workload
    }), 200

@app.route('/analytics/global', methods=['GET'])
def get_global_analytics():
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401
        
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Total projects for this user
    cursor.execute("SELECT COUNT(*) as project_count FROM projects WHERE user_id = %s", (session['user_id'],))
    project_count = cursor.fetchone()['project_count']
    
    # Total tasks for this user across all projects
    cursor.execute("""
        SELECT COUNT(*) as task_count 
        FROM tasks t 
        JOIN projects p ON t.project_id = p.id 
        WHERE p.user_id = %s
    """, (session['user_id'],))
    task_count = cursor.fetchone()['task_count']
    
    # Task count per project
    cursor.execute("""
        SELECT p.name, COUNT(t.id) as task_count 
        FROM projects p 
        LEFT JOIN tasks t ON p.id = t.project_id 
        WHERE p.user_id = %s 
        GROUP BY p.id
    """, (session['user_id'],))
    projects_stats = cursor.fetchall()
    
    cursor.close()
    conn.close()
    return jsonify({
        "total_projects": project_count,
        "total_tasks": task_count,
        "projects_stats": projects_stats
    }), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)
