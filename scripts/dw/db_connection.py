import pymysql

DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'ghil3412',
    'charset': 'utf8mb4',
    'cursorclass': pymysql.cursors.DictCursor
}

def get_connection(with_db=True):
    config = DB_CONFIG.copy()
    if with_db:
        config['database'] = 'upse_dengue_dw'
    return pymysql.connect(**config)
