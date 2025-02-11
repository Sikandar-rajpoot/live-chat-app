import json
import os
import time
import logging
from datetime import datetime, timedelta
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends, Request
from fastapi.templating import Jinja2Templates
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from jose import jwt, JWTError

app = FastAPI()
templates = Jinja2Templates(directory="templates")

SECRET_KEY = "supersecretkey"
ALGORITHM = "HS256"
DATA_FILE = "users.json"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")
active_connections = {}

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Ensure users.json exists
if not os.path.exists(DATA_FILE):
    with open(DATA_FILE, "w") as f:
        json.dump([], f)

# Load users from JSON
def load_users():
    with open(DATA_FILE, "r") as f:
        return json.load(f)

# Save users to JSON
def save_users(users):
    with open(DATA_FILE, "w") as f:
        json.dump(users, f, indent=4)

# Create JWT token
def create_access_token(username: str):
    expire = datetime.utcnow() + timedelta(hours=1)
    return jwt.encode({"sub": username, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)

# Verify JWT token
def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except JWTError as e:
        logger.error(f"Token verification failed: {e}")
        return None

@app.post("/register")
async def register(form_data: OAuth2PasswordRequestForm = Depends()):
    users = load_users()
    if any(user["username"] == form_data.username for user in users):
        raise HTTPException(status_code=400, detail="Username already exists")
    
    users.append({"username": form_data.username, "password": form_data.password})
    save_users(users)
    return {"message": "User registered successfully"}

# Rate limiting for login attempts
login_attempts = {}
MAX_ATTEMPTS = 5
LOCKOUT_TIME = 300  # 5 minutes

@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), request: Request = None):
    ip = request.client.host
    current_time = time.time()

    # Check if IP is locked out
    if ip in login_attempts and login_attempts[ip]["attempts"] >= MAX_ATTEMPTS:
        if current_time - login_attempts[ip]["last_attempt"] < LOCKOUT_TIME:
            raise HTTPException(status_code=429, detail="Too many login attempts. Try again later.")
        login_attempts[ip]["attempts"] = 0  # Reset attempts after lockout period

    if ip not in login_attempts:
        login_attempts[ip] = {"attempts": 0, "last_attempt": current_time}

    users = load_users()
    user = next((u for u in users if u["username"] == form_data.username and u["password"] == form_data.password), None)
    
    if not user:
        login_attempts[ip]["attempts"] += 1
        login_attempts[ip]["last_attempt"] = current_time
        raise HTTPException(status_code=400, detail="Invalid credentials")

    login_attempts[ip]["attempts"] = 0  # Reset on successful login
    token = create_access_token(form_data.username)
    return {"access_token": token, "token_type": "bearer"}

@app.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str):
    await websocket.accept()

    username = verify_token(token)
    if not username:
        await websocket.send_json({"error": "Invalid token"})
        await websocket.close()
        return

    active_connections[username] = websocket
    logger.info(f"User {username} connected. Active users: {len(active_connections)}")

    try:
        await broadcast_message("System", f"{username} has joined the chat")

        while True:
            data = await websocket.receive_text()
            logger.info(f"Received message from {username}: {data}")

            await broadcast_message(username, data)

    except WebSocketDisconnect:
        logger.info(f"{username} disconnected")
    except Exception as e:
        logger.error(f"WebSocket error for {username}: {e}")
    finally:
        active_connections.pop(username, None)
        await broadcast_message("System", f"{username} has left the chat")
        logger.info(f"Active users after {username} left: {len(active_connections)}")

async def broadcast_message(sender: str, message: str):
    """Send a message to all connected WebSocket clients."""
    disconnected_clients = []
    
    for username, connection in active_connections.items():
        try:
            await connection.send_json({"username": sender, "message": message})
        except Exception as e:
            logger.error(f"Error sending message to {username}: {e}")
            disconnected_clients.append(username)

    # Remove disconnected clients
    for username in disconnected_clients:
        active_connections.pop(username, None)

@app.get("/chat")
async def chat_page(request: Request):
    return templates.TemplateResponse("chat.html", {"request": request})

@app.get("/")
async def root():
    return RedirectResponse(url="/login")

@app.get("/register")
async def register_page():
    return RedirectResponse(url="/login")

@app.get("/login")
async def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})
