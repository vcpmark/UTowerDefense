#!/usr/bin/env python3
"""
Simple HTTP server for testing the game locally
Usage: python serve.py [port]
Default port: 8000
"""

import http.server
import socketserver
import sys
import os

# Get port from command line or use default
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000

# Change to the directory containing this script
os.chdir(os.path.dirname(os.path.abspath(__file__)))

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS for local development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        # Set correct MIME types for JavaScript modules
        if self.path.endswith('.js'):
            self.send_header('Content-Type', 'application/javascript')
        super().end_headers()

with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
    print(f"🎮 Motato Towers Server")
    print(f"📡 Server running at http://localhost:{PORT}")
    print(f"🌐 Open http://localhost:{PORT} in your browser")
    print(f"⚡ Press Ctrl+C to stop the server\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n👋 Server stopped")
        sys.exit(0)
