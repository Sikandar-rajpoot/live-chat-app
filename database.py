users_db = {}

def get_user(username: str):
    return users_db.get(username)

def create_user(username: str, hashed_password: str):
    users_db[username] = {"username": username, "password": hashed_password}

