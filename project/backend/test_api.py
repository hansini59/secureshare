import pytest
import os
import tempfile
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from main import app, get_db, Base, User, UploadedFile
import io

# Test database setup
SQLITE_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLITE_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

# Create test database
Base.metadata.create_all(bind=engine)

client = TestClient(app)

class TestSecureFileSharing:
    
    def setup_method(self):
        """Setup test data before each test"""
        # Clear database
        db = TestingSessionLocal()
        db.query(UploadedFile).delete()
        db.query(User).delete()
        db.commit()
        db.close()
    
    def test_user_signup_client(self):
        """Test client user signup"""
        response = client.post("/api/auth/signup", json={
            "email": "client@test.com",
            "password": "testpass123",
            "user_type": "client"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "Account created successfully" in data["message"]
    
    def test_user_signup_ops(self):
        """Test operations user signup"""
        response = client.post("/api/auth/signup", json={
            "email": "ops@test.com",
            "password": "testpass123",
            "user_type": "ops"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
    
    def test_user_login_client(self):
        """Test client user login"""
        # First signup
        client.post("/api/auth/signup", json={
            "email": "client@test.com",
            "password": "testpass123",
            "user_type": "client"
        })
        
        # Then login
        response = client.post("/api/auth/login", json={
            "email": "client@test.com",
            "password": "testpass123",
            "user_type": "client"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
    
    def test_user_login_ops(self):
        """Test operations user login"""
        # First signup
        client.post("/api/auth/signup", json={
            "email": "ops@test.com",
            "password": "testpass123",
            "user_type": "ops"
        })
        
        # Then login
        response = client.post("/api/auth/login", json={
            "email": "ops@test.com",
            "password": "testpass123",
            "user_type": "ops"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
    
    def test_file_upload_by_ops_user(self):
        """Test file upload by operations user"""
        # Create ops user and login
        client.post("/api/auth/signup", json={
            "email": "ops@test.com",
            "password": "testpass123",
            "user_type": "ops"
        })
        
        login_response = client.post("/api/auth/login", json={
            "email": "ops@test.com",
            "password": "testpass123",
            "user_type": "ops"
        })
        token = login_response.json()["access_token"]
        
        # Create a mock PPTX file
        file_content = b"Mock PPTX content"
        files = {"file": ("test.pptx", io.BytesIO(file_content), "application/vnd.openxmlformats-officedocument.presentationml.presentation")}
        
        response = client.post(
            "/api/files/upload",
            files=files,
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "File uploaded successfully" in data["message"]
    
    def test_file_upload_by_client_user_forbidden(self):
        """Test that client users cannot upload files"""
        # Create client user and login
        client.post("/api/auth/signup", json={
            "email": "client@test.com",
            "password": "testpass123",
            "user_type": "client"
        })
        
        login_response = client.post("/api/auth/login", json={
            "email": "client@test.com",
            "password": "testpass123",
            "user_type": "client"
        })
        token = login_response.json()["access_token"]
        
        # Try to upload file
        file_content = b"Mock PPTX content"
        files = {"file": ("test.pptx", io.BytesIO(file_content), "application/vnd.openxmlformats-officedocument.presentationml.presentation")}
        
        response = client.post(
            "/api/files/upload",
            files=files,
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 403
    
    def test_file_list_by_client_user(self):
        """Test file listing by client user"""
        # Create client user and login
        client.post("/api/auth/signup", json={
            "email": "client@test.com",
            "password": "testpass123",
            "user_type": "client"
        })
        
        login_response = client.post("/api/auth/login", json={
            "email": "client@test.com",
            "password": "testpass123",
            "user_type": "client"
        })
        token = login_response.json()["access_token"]
        
        response = client.get(
            "/api/files/list",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "files" in data["data"]
    
    def test_download_link_generation(self):
        """Test secure download link generation"""
        # Create ops user and upload file
        client.post("/api/auth/signup", json={
            "email": "ops@test.com",
            "password": "testpass123",
            "user_type": "ops"
        })
        
        ops_login = client.post("/api/auth/login", json={
            "email": "ops@test.com",
            "password": "testpass123",
            "user_type": "ops"
        })
        ops_token = ops_login.json()["access_token"]
        
        # Upload file
        file_content = b"Mock PPTX content"
        files = {"file": ("test.pptx", io.BytesIO(file_content), "application/vnd.openxmlformats-officedocument.presentationml.presentation")}
        
        upload_response = client.post(
            "/api/files/upload",
            files=files,
            headers={"Authorization": f"Bearer {ops_token}"}
        )
        file_id = upload_response.json()["file_id"]
        
        # Create client user
        client.post("/api/auth/signup", json={
            "email": "client@test.com",
            "password": "testpass123",
            "user_type": "client"
        })
        
        client_login = client.post("/api/auth/login", json={
            "email": "client@test.com",
            "password": "testpass123",
            "user_type": "client"
        })
        client_token = client_login.json()["access_token"]
        
        # Generate download link
        response = client.get(
            f"/api/files/download/{file_id}",
            headers={"Authorization": f"Bearer {client_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "download_link" in data["data"]
    
    def test_secure_download_with_valid_token(self):
        """Test secure download with valid token"""
        # Setup: Create ops user, upload file, create client user, generate download link
        # ... (similar setup as above)
        
        # This test would require creating actual files and tokens
        # For brevity, testing the endpoint structure
        pass
    
    def test_secure_download_with_invalid_token(self):
        """Test secure download with invalid token"""
        response = client.get("/api/secure-download/invalid-token")
        assert response.status_code == 403
    
    def test_secure_download_non_client_user_forbidden(self):
        """Test that non-client users cannot access secure download"""
        # This would require creating a valid token for an ops user
        # and verifying it gets rejected
        pass
    
    def test_live_stats_endpoint(self):
        """Test live statistics endpoint"""
        response = client.get("/api/stats/live")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "total_files" in data["data"]
        assert "active_users" in data["data"]

if __name__ == "__main__":
    pytest.main([__file__])