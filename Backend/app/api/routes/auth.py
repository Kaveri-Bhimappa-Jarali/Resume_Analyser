from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.core.security import create_access_token, hash_password, verify_password
from app.api.dependencies import get_current_user
from app.db.database import get_db
from app.db.models import User
from app.schemas.auth import AuthResponse, TokenData, UserCreate, UserLogin, UserOut
from app.schemas.common import APIResponse

router = APIRouter()


@router.post("/register", response_model=APIResponse[AuthResponse])
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise AppError("A user with that email already exists.", status_code=400)

    new_user = User(
        name=user_data.name.strip(),
        email=user_data.email.lower(),
        password_hash=hash_password(user_data.password),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token(subject=str(new_user.id))
    return APIResponse(
        data=AuthResponse(user=UserOut.from_orm(new_user), token=TokenData(access_token=token)),
        message="Registration successful.",
    )


@router.post("/login", response_model=APIResponse[AuthResponse])
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email.lower()).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise AppError("Invalid email or password.", status_code=401)

    token = create_access_token(subject=str(user.id))
    return APIResponse(
        data=AuthResponse(user=UserOut.from_orm(user), token=TokenData(access_token=token)),
        message="Login successful.",
    )


@router.get("/me", response_model=APIResponse[UserOut])
def get_me(current_user: User = Depends(get_current_user)):
    return APIResponse(data=UserOut.from_orm(current_user), message="User profile loaded.")
