import sys
from app.database import SessionLocal, init_db
from models.user import User
import getpass

def create_admin():
    init_db()
    db = SessionLocal()
    
    print("=== OTOMANET Administrator Setup ===")
    username = input("Username [admin]: ") or "admin"
    email = input("Email: ")
    password = getpass.getpass("Password: ")
    confirm = getpass.getpass("Confirm Password: ")
    
    if password != confirm:
        print("Error: Passwords do not match.")
        sys.exit(1)
        
    existing = db.query(User).filter(User.username == username).first()
    if existing:
        print(f"User {username} already exists. Updating password...")
        existing.set_password(password)
        existing.role = "admin"
        existing.is_active = True
        existing.force_password_change = False
    else:
        user = User(
            username=username,
            email=email,
            role="admin",
            is_active=True,
            force_password_change=False
        )
        user.set_password(password)
        db.add(user)
        
    db.commit()
    db.close()
    print(f"=== Success! Administrator {username} is ready. ===")

if __name__ == "__main__":
    create_admin()
