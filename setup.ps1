# setup.ps1 - Script to set up Live Chat App project structure

# Define project structure
$folders = @(
    "live-chat-app/static",
    "live-chat-app/templates",
    "live-chat-app/logs"
)

$files = @(
    "live-chat-app/static/style.css",
    "live-chat-app/static/script.js",
    "live-chat-app/static/admin_logs.js",
    "live-chat-app/templates/chat.html",
    "live-chat-app/templates/login.html",
    "live-chat-app/main.py",
    "live-chat-app/auth.py",
    "live-chat-app/database.py",
    "live-chat-app/requirements.txt"
)

# Create folders
foreach ($folder in $folders) {
    if (!(Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder -Force
        Write-Host "Created folder: $folder"
    }
}

# Create empty files
foreach ($file in $files) {
    if (!(Test-Path $file)) {
        New-Item -ItemType File -Path $file -Force
        Write-Host "Created file: $file"
    }
}

# Navigate to project directory
Set-Location "live-chat-app"

# Set up virtual environment if Python is installed
if (Get-Command python -ErrorAction SilentlyContinue) {
    Write-Host "Setting up virtual environment..."
    python -m venv venv
    Write-Host "Virtual environment created: venv"

    # Activate virtual environment (for Windows)
    .\venv\Scripts\Activate

    # Install dependencies if requirements.txt exists
    if (Test-Path "requirements.txt") {
        Write-Host "Installing dependencies from requirements.txt..."
        pip install -r requirements.txt
    }

    Write-Host "Setup complete! ✅"
}
else {
    Write-Host "Python is not installed! Please install Python and run the script again."
}
