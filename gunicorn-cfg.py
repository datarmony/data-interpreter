# -*- encoding: utf-8 -*-
import os

# Get the port from the environment variable PORT, default to 8080 if not set
port = os.getenv('PORT', '8080')
bind = f'0.0.0.0:{port}'
workers = 1
accesslog = '-'
loglevel = 'debug'
capture_output = True
enable_stdio_inheritance = True
