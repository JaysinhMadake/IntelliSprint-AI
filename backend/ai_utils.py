import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from db_utils import get_db_connection

def predict_task_time(priority):
    """
    Predict task completion time based on priority using a regression model.
    In a real scenario, this would train on historical 'actual_time' from the DB.
    """
    # 1. Fetch historical data from DB
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT priority, actual_time FROM tasks WHERE actual_time IS NOT NULL")
    data = cursor.fetchall()
    cursor.close()
    conn.close()

    # 2. Prepare Training Data
    # Priority mapping: Low=1, Medium=2, High=3
    priority_map = {'Low': 1, 'Medium': 2, 'High': 3}
    
    if len(data) < 5:
        # Not enough data, use heuristic or synthetic data for demonstration
        df = pd.DataFrame([
            {'p': 1, 't': 2}, {'p': 1, 't': 3},
            {'p': 2, 't': 5}, {'p': 2, 't': 8},
            {'p': 3, 't': 12}, {'p': 3, 't': 15}
        ])
    else:
        df = pd.DataFrame(data)
        df['p'] = df['priority'].map(priority_map)
        df['t'] = df['actual_time']

    # 3. Train Regression Model
    X = df[['p']].values
    y = df['t'].values
    model = LinearRegression()
    model.fit(X, y)

    # 4. Predict for all priority levels as requested
    predictions = {}
    for p_name, p_val in priority_map.items():
        pred = model.predict([[p_val]])[0]
        predictions[p_name] = round(float(pred), 2)

    return {
        "predictions": predictions,
        "current_priority_prediction": predictions.get(priority, predictions['Medium'])
    }

def auto_assign_tasks(project_id):
    """
    Greedy assignment logic:
    Match task required skill with member skills and balance workload.
    """
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Fetch unassigned tasks
    cursor.execute("""
        SELECT * FROM tasks 
        WHERE project_id = %s AND id NOT IN (SELECT task_id FROM assignments)
    """, (project_id,))
    tasks = cursor.fetchall()
    
    # Fetch members
    cursor.execute("SELECT * FROM team_members WHERE project_id = %s", (project_id,))
    members = cursor.fetchall()
    
    # Fetch current workloads
    cursor.execute("""
        SELECT member_id, COUNT(*) as count 
        FROM assignments a 
        JOIN tasks t ON a.task_id = t.id 
        WHERE t.project_id = %s 
        GROUP BY member_id
    """, (project_id,))
    workloads = {row['member_id']: row['count'] for row in cursor.fetchall()}
    
    assignments_made = []
    
    for task in tasks:
        best_member = None
        min_workload = float('inf')
        
        req_skill = str(task.get('required_skill') or '').strip().lower()
        
        for member in members:
            mem_skills = [s.strip().lower() for s in str(member.get('skills') or '').split(',')]
            current_work = workloads.get(member['id'], 0)
            
            # Match if skill is in list or no skill required
            if not req_skill or req_skill in mem_skills:
                if current_work < min_workload:
                    min_workload = current_work
                    best_member = member
        
        if best_member:
            cursor.execute("INSERT INTO assignments (task_id, member_id) VALUES (%s, %s)", 
                           (task['id'], best_member['id']))
            workloads[best_member['id']] = workloads.get(best_member['id'], 0) + 1
            assignments_made.append({
                "task_id": task['id'],
                "task_title": task['title'],
                "member_name": best_member['name']
            })
            
    conn.commit()
    cursor.close()
    conn.close()
    
    return {"message": f"Assigned {len(assignments_made)} tasks", "assignments": assignments_made}
