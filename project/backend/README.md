# Secure File Sharing API - FastAPI Backend

A secure file-sharing system built with FastAPI, featuring JWT authentication, role-based access control, and encrypted download URLs.

## 🚀 Features

### Authentication & Authorization
- **User Registration**: Open signup for both Operations and Client users
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access**: Different permissions for Operations and Client users
- **Password Hashing**: Secure password storage using bcrypt

### File Management
- **Secure Upload**: Operations users can upload PPTX, DOCX, and XLSX files
- **File Validation**: Strict file type and size validation
- **Encrypted Downloads**: Secure, time-limited download URLs with JWT tokens
- **Access Control**: Only Client users can download files

### Security Features
- **JWT Token Verification**: All endpoints protected with JWT authentication
- **Encrypted Download URLs**: Download tokens contain file_id and user_id
- **Role Verification**: Download endpoint verifies Client user role
- **Token Expiration**: Download tokens expire after 30 minutes
- **File Path Security**: Secure file storage and access

## 📋 API Endpoints

### Authentication
```
POST /api/auth/signup     - User registration
POST /api/auth/login      - User login
```

### File Operations
```
POST /api/files/upload           - Upload files (Operations only)
GET  /api/files/list             - List files (Client only)
GET  /api/files/download/{id}    - Generate download link (Client only)
GET  /api/secure-download/{token} - Secure file download
```

### Statistics
```
GET /api/stats/live - Live dashboard statistics
```

## 🛠 Installation & Setup

### Prerequisites
- Python 3.8+
- pip

### Installation
```bash
cd backend
pip install -r requirements.txt
```

### Run the Server
```bash
python main.py
```

The API will be available at `http://localhost:8000`

### API Documentation
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 🗄 Database Schema

### Users Table
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    hashed_password VARCHAR NOT NULL,
    user_type VARCHAR NOT NULL,  -- 'ops' or 'client'
    is_verified BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### UploadedFiles Table
```sql
CREATE TABLE uploaded_files (
    id INTEGER PRIMARY KEY,
    filename VARCHAR NOT NULL,
    original_filename VARCHAR NOT NULL,
    file_path VARCHAR NOT NULL,
    file_size INTEGER NOT NULL,
    content_type VARCHAR NOT NULL,
    uploaded_by INTEGER REFERENCES users(id),
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🔐 Secure Download Implementation

The `/secure-download/{token}` endpoint implements the following security measures:

1. **JWT Token Verification**: Validates the encrypted token using the secret key
2. **Token Structure**: Token contains `file_id`, `user_id`, `exp`, and `type`
3. **User Role Check**: Verifies the user has 'Client User' role
4. **File Access Control**: Checks file existence in database and filesystem
5. **Secure Headers**: Sets `Content-Disposition: attachment` for downloads
6. **Error Handling**: Returns 403 Forbidden for invalid/expired tokens

### Token Structure
```json
{
  "file_id": 123,
  "user_id": 456,
  "exp": 1640995200,
  "type": "download"
}
```

## 🧪 Testing

Run the test suite:
```bash
cd backend
python -m pytest test_api.py -v
```

### Test Coverage
- User registration and login
- File upload by Operations users
- File listing by Client users
- Download link generation
- Secure download with token verification
- Access control and permissions
- Error handling and edge cases

## 📝 Usage Examples

### 1. User Registration
```bash
curl -X POST "http://localhost:8000/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@example.com",
    "password": "securepass123",
    "user_type": "client"
  }'
```

### 2. User Login
```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@example.com",
    "password": "securepass123",
    "user_type": "client"
  }'
```

### 3. File Upload (Operations User)
```bash
curl -X POST "http://localhost:8000/api/files/upload" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@document.pptx"
```

### 4. Generate Download Link (Client User)
```bash
curl -X GET "http://localhost:8000/api/files/download/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5. Secure Download
```bash
curl -X GET "http://localhost:8000/api/secure-download/ENCRYPTED_TOKEN" \
  --output downloaded_file.pptx
```

## 🚀 Production Deployment

### Environment Variables
```bash
SECRET_KEY=your-production-secret-key
DATABASE_URL=postgresql://user:pass@localhost/dbname
UPLOAD_DIRECTORY=/secure/uploads
```

### Docker Deployment
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Security Considerations
- Use strong SECRET_KEY in production
- Enable HTTPS/TLS encryption
- Implement rate limiting
- Add file virus scanning
- Use production database (PostgreSQL)
- Set up proper logging and monitoring
- Configure CORS for specific origins
- Implement backup strategies

## 📊 API Response Examples

### Successful Login Response
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### Download Link Response
```json
{
  "success": true,
  "data": {
    "download_link": "/api/secure-download/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_at": "2024-01-15T11:30:00",
    "generated_at": "2024-01-15T11:00:00"
  },
  "message": "Download link generated successfully"
}
```

### Error Response
```json
{
  "detail": "Access denied. Only client users can download files"
}
```

## 🔧 Configuration

### File Upload Settings
- **Allowed Types**: PPTX, DOCX, XLSX only
- **Max File Size**: 50MB (configurable)
- **Upload Directory**: `./uploads/` (configurable)

### JWT Settings
- **Algorithm**: HS256
- **Access Token Expiry**: 30 minutes
- **Download Token Expiry**: 30 minutes

### Database
- **Default**: SQLite (development)
- **Production**: PostgreSQL recommended
- **Connection Pooling**: Enabled
- **Auto-migration**: Tables created automatically

This FastAPI backend provides a complete, secure file-sharing solution with proper authentication, authorization, and encrypted download functionality.