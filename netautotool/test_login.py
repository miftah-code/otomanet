import requests
from bs4 import BeautifulSoup

s = requests.Session()
r = s.get('http://localhost:8000/auth/login')
soup = BeautifulSoup(r.text, 'html.parser')
csrf = soup.find('input', {'name': 'csrf_token'})
csrf_token = csrf['value'] if csrf else ''

# Since we don't know the password, let's just create a test user or see if we can login.
# Actually, I can just write a quick script to change miftah's password in the DB.
