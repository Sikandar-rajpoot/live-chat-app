# FastAPI Chat Application

A real-time chat application built with FastAPI, WebSockets, and Redis.

## Features

- Real-time messaging using WebSockets
- User authentication and authorization
- Message persistence using Redis
- Secure password hashing
- JWT token-based authentication

## Prerequisites

- Python 3.8+
- Redis server

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd <project-directory>
```

2. Create and activate a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Start Redis server:

```bash
redis-server
```

5. Run the application:

```bash
uvicorn main:app --reload
```

The application will be available at `http://localhost:8000`

## API Documentation

Once the application is running, you can access:

- Interactive API documentation: `http://localhost:8000/docs`
- Alternative API documentation: `http://localhost:8000/redoc`

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REDIS_URL=redis://localhost:6379
```

## Project Structure

```
.
├── main.py
├── requirements.txt
├── .env
└── app/
    ├── models/
    ├── routes/
    ├── services/
    └── utils/
```

## Contributing

1. Fork the repository
2. Create a new branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
