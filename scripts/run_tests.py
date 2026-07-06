import requests
import json
import time
import os

BASE_URL = "http://127.0.0.1:8000/api"

def print_result(name, success, info=""):
    status = "[PASS]" if success else "[FAIL]"
    print(f"{status} | {name} {info}")

def run_tests():
    print("--- STARTING PHASE 6 TESTS ---\n")
    
    # 1. Health Check
    try:
        r = requests.get(f"{BASE_URL}/health")
        print_result("Health Check", r.status_code == 200, r.text)
    except Exception as e:
        print_result("Health Check", False, str(e))
        return

    # 2. Registration & Login (JWT)
    test_email = f"test_{int(time.time())}@vedyam.org"
    password = "password123"
    token = None
    
    # Register
    r = requests.post(f"{BASE_URL}/auth/register", json={
        "name": "Test User",
        "email": test_email,
        "password": password,
        "role": "user"
    })
    
    if r.status_code in (200, 201):
        print_result("Registration", True, f"Created {test_email}")
        token = r.json().get("token")
    elif r.status_code == 409:
        print_result("Registration", True, "User already exists")
    else:
        print_result("Registration", False, r.text)
        
    # Login
    r = requests.post(f"{BASE_URL}/auth/login", json={
        "email": test_email,
        "password": password
    })
    
    if r.status_code == 200:
        token = r.json().get("token")
        print_result("Login (JWT)", True, "Token received")
    else:
        print_result("Login (JWT)", False, r.text)
        
    headers = {"Authorization": f"Bearer {token}"} if token else {}

    # 3. Protected Routes (/api/me)
    if headers:
        r = requests.get(f"{BASE_URL}/me", headers=headers)
        print_result("Protected Route (/me)", r.status_code == 200)
    else:
        print_result("Protected Route (/me)", False, "No token")

    # 4. Courses (Public)
    r = requests.get(f"{BASE_URL}/courses")
    if r.status_code == 200:
        courses = r.json().get("courses", [])
        print_result("Courses Fetch", True, f"Found {len(courses)} courses")
    else:
        print_result("Courses Fetch", False, r.text)

    # 5. Website Chatbot (Gemini)
    r = requests.post(f"{BASE_URL}/website/chat", json={
        "message": "Hello!"
    })
    print_result("Website Chatbot", r.status_code == 200, "Replied" if r.status_code == 200 else r.text)

    print("\n--- PHASE 6 TESTS COMPLETE ---")

if __name__ == "__main__":
    run_tests()
