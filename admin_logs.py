import logging
from logging.handlers import RotatingFileHandler
import os

def get_logger():
    # Create logs directory if it doesn't exist
    if not os.path.exists('logs'):
        os.makedirs('logs')

    # Configure logger
    logger = logging.getLogger('live_chat')
    logger.setLevel(logging.INFO)

    # Create file handler with rotation
    file_handler = RotatingFileHandler(
        'logs/admin.log',
        maxBytes=1024 * 1024,  # 1MB
        backupCount=5
    )
    
    # Create formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    file_handler.setFormatter(formatter)

    # Add handler to logger if it doesn't already have handlers
    if not logger.handlers:
        logger.addHandler(file_handler)

    return logger 