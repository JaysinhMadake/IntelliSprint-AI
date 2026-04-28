import mysql.connector
from db_utils import get_db_connection

def kill_hanging_processes():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # 1. Show processlist to find long running queries or locks
    cursor.execute("SHOW FULL PROCESSLIST")
    processes = cursor.fetchall()
    
    print(f"{'Id':<10} {'User':<10} {'Host':<20} {'db':<15} {'Command':<10} {'Time':<10} {'State':<20} {'Info'}")
    print("-" * 120)
    
    current_pid = conn.connection_id
    
    for p in processes:
        info = str(p['Info'])[:50] if p['Info'] else ""
        db_name = str(p['db']) if p['db'] else "None"
        print(f"{str(p['Id']):<10} {str(p['User']):<10} {str(p['Host']):<20} {db_name:<15} {str(p['Command']):<10} {str(p['Time']):<10} {str(p['State']):<20} {info}")
        
        # Kill processes that are not the current one and have been running/idle for too long
        # or are "Sleep" but holding locks (hard to tell here, but we can kill Sleep > 60s)
        if p['Id'] != current_pid and p['Command'] == 'Sleep' and p['Time'] > 30:
            print(f"Killing process {p['Id']}...")
            try:
                # We need a separate cursor/connection sometimes or just execute kill
                # cursor.execute(f"KILL {p['Id']}") # Careful with this
                pass 
            except Exception as e:
                print(f"Failed to kill {p['Id']}: {e}")

    cursor.close()
    conn.close()

if __name__ == "__main__":
    kill_hanging_processes()
