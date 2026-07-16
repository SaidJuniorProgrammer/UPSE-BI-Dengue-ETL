import os
import pymysql

# Load .env file manually if exists
def load_dotenv():
    # Look for .env in current dir, project root, or backend folder
    possible_paths = [
        os.path.join(os.getcwd(), '.env'),
        os.path.join(os.path.dirname(__file__), '../../.env'),
        os.path.join(os.path.dirname(__file__), '../../dashboard_bi/backend/.env'),
        os.path.join(os.path.dirname(__file__), '../.env')
    ]
    for path in possible_paths:
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#'):
                        try:
                            key, val = line.split('=', 1)
                            os.environ[key.strip()] = val.strip()
                        except ValueError:
                            pass
            break

load_dotenv()

def get_connection(with_db=True):
    config = {
        'host': os.environ.get('DB_HOST', 'localhost'),
        'user': os.environ.get('DB_USER', 'root'),
        'password': os.environ.get('DB_PASSWORD', 'ghil3412'),
        'port': int(os.environ.get('DB_PORT', 3306)),
        'charset': 'utf8mb4',
        'cursorclass': pymysql.cursors.DictCursor
    }
    if with_db:
        config['database'] = os.environ.get('DB_NAME', 'upse_dengue_dw')
    return pymysql.connect(**config)

