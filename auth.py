from fastapi import APIRouter, HTTPException, Depends, Form, UploadFile, File
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from passlib.context import CryptContext
import datetime
from database import get_user, create_user
from jose import jwt
import shutil
import os


SECRET_KEY = "supersecretkey"
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

UPLOAD_DIR = "static/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

auth_router = APIRouter()

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

@auth_router.post("/register")
async def register(
    username: str = Form(...),
    password: str = Form(...),
    profile_pic: UploadFile = File(None)
):
    if get_user(username):
        raise HTTPException(status_code=400, detail="Username already exists")
    
    profile_pic_path = None
    if profile_pic:
        profile_pic_path = f"{UPLOAD_DIR}/{profile_pic.filename}"
        with open(profile_pic_path, "wb") as buffer:
            shutil.copyfileobj(profile_pic.file, buffer)
    
    hashed_password = get_password_hash(password)
    create_user(username, hashed_password, profile_pic_path)
    return {"message": "User registered successfully", "profile_pic": profile_pic_path}

@auth_router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = get_user(form_data.username)
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    token = create_access_token({"sub": form_data.username})
    return {"access_token": token, "token_type": "bearer"}
