# app.py - NutriCoach Complete Application v5.0
import os
import json
import base64
import io
import secrets
import smtplib
import ssl
import csv
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.utils import formataddr

from flask import Flask, render_template, request, jsonify, make_response
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv
import google.generativeai as genai
from supabase import create_client
from PIL import Image

load_dotenv()

app = Flask(__name__)
app.config['JSON_SORT_KEYS'] = False
app.secret_key = os.getenv('SECRET_KEY', secrets.token_hex(32))

CORS(app, resources={r"/api/*": {"origins": ["*"], "methods": ["GET", "POST", "DELETE"], "allow_headers": ["Content-Type", "Authorization"]}})

limiter = Limiter(app=app, key_func=get_remote_address, default_limits=["200 per day", "50 per hour"], storage_uri="memory://")

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

supabase = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None
admin_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY else supabase

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-1.5-flash')
else:
    model = None

def get_user_id():
    try:
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return None
        token = auth_header.replace('Bearer ', '').strip()
        
        # 1. Try Custom Token Format: user-{uuid}-{random}
        if token.startswith('user-'):
            # Just return the UUID part. 
            # Format: user-{uuid}-{random}
            parts = token.split('-')
            # part[0]=user, part[1]=uuid, part[2+]=random
            if len(parts) >= 3:
                uuid_candidate = parts[1]
                # Basic sanity check for UUID length (36)
                if len(uuid_candidate) == 36:
                     return uuid_candidate
        
        # 2. Try Supabase JWT (Only if not a custom token)
        if supabase:
             try:
                 user = supabase.auth.get_user(token)
                 return user.user.id if user and hasattr(user, 'user') else None
             except:
                 pass
        
        return None
    except:
        return None

def generate_otp(email, purpose, extra=None):
    try:
        otp = f"{secrets.randbelow(1_000_000):06d}"
        expires_at = datetime.utcnow() + timedelta(minutes=10)
        
        if admin_client:
            admin_client.table("otps").delete().eq("email", email).eq("purpose", purpose).execute()
            admin_client.table("otps").insert({"email": email, "purpose": purpose, "otp": otp, "extra": extra or {}, "expires_at": expires_at.isoformat()}).execute()
        
        send_otp_email(email, otp, purpose)
        return otp
    except Exception as e:
        app.logger.error(f"OTP gen error: {e}")
        return None

def verify_otp(email, otp, purpose):
    try:
        if not admin_client:
            return None
        resp = admin_client.table("otps").select("*").eq("email", email).eq("purpose", purpose).execute()
        if not resp.data:
            return None
        row = resp.data[0]
        if row.get("otp") != otp:
            return None
        expires_at = datetime.fromisoformat(row.get("expires_at").replace('Z', '+00:00'))
        if datetime.utcnow() > expires_at.replace(tzinfo=None):
            admin_client.table("otps").delete().eq("email", email).eq("purpose", purpose).execute()
            return None
        admin_client.table("otps").delete().eq("email", email).eq("purpose", purpose).execute()
        return row.get("extra", {})
    except:
        return None

def extract_json(text):
    try:
        # Find first '{' and last '}'
        start = text.find('{')
        end = text.rfind('}')
        if start != -1 and end != -1:
            json_str = text[start:end+1]
            return json_str
        return '{}'
    except:
        return '{}'

def calculate_macros(weight, height, age, goal, target_weight):
    try:
        if model:
            prompt = f"Calculate optimal daily macros for: Weight {weight}kg, Height {height}cm, Age {age}, Goal {goal}, Target Weight {target_weight}kg. Return ONLY JSON: {{\"calories\": 2000, \"protein\": 150, \"carbs\": 200, \"fats\": 66}}"
            try:
                response = model.generate_content(prompt)
                return json.loads(extract_json(response.text))
            except:
                pass 
        
        # Fallback
        weight = float(weight)
        multiplier = 30
        if goal == 'weight_loss': multiplier = 25
        elif goal == 'muscle_building': multiplier = 35
        
        calories = int(weight * multiplier)
        protein = int((calories * 0.3) / 4)
        carbs = int((calories * 0.4) / 4)
        fats = int((calories * 0.3) / 9)
        return {'calories': calories, 'protein': protein, 'carbs': carbs, 'fats': fats}
    except:
        return {'calories': 2000, 'protein': 150, 'carbs': 200, 'fats': 66}

def send_otp_email(to_email, otp, purpose="OTP"):
    try:
        host = os.getenv('SMTP_HOST')
        port = int(os.getenv('SMTP_PORT', '587'))
        username = os.getenv('SMTP_USERNAME')
        password = os.getenv('SMTP_PASSWORD')
        sender = os.getenv('SMTP_SENDER', username)
        sender_name = os.getenv('SMTP_SENDER_NAME', 'NutriCoach')
        
        if not all([host, username, password]):
            app.logger.info(f"[DEV] OTP for {to_email}: {otp}")
            return True
        
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <div style="background: linear-gradient(135deg, #FFB3D9, #B3D9FF); padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0;">NutriCoach 🥑</h1>
            </div>
            <div style="padding: 30px; background-color: #ffffff; text-align: center;">
                <h2 style="color: #2D3748;">Your Verification Code</h2>
                <p style="color: #6C757D; font-size: 16px;">Use the code below to complete your {purpose} request.</p>
                <div style="background-color: #F8F9FA; padding: 15px; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2D3748; margin: 20px 0; display: inline-block; border: 2px dashed #B3D9FF;">
                    {otp}
                </div>
                <p style="color: #6C757D; font-size: 14px;">This code is valid for 10 minutes. Do not share it with anyone.</p>
            </div>
            <div style="background-color: #F8F9FA; padding: 15px; border-radius: 0 0 10px 10px; text-align: center; font-size: 12px; color: #aaa;">
                &copy; 2025 NutriCoach. All rights reserved.
            </div>
        </div>
        """
        
        msg = MIMEText(html_content, 'html')
        msg['Subject'] = f"NutriCoach: Your {purpose} Code"
        msg['From'] = formataddr((sender_name, sender))
        msg['To'] = to_email
        
        context = ssl.create_default_context()
        with smtplib.SMTP(host, port) as server:
            server.starttls(context=context)
            server.login(username, password)
            server.sendmail(sender, [to_email], msg.as_string())
        return True
    except Exception as e:
        app.logger.error(f"Email error: {e}")
        return False

@app.route('/api/auth/signup', methods=['POST'])
@limiter.limit("10 per hour")
def signup():
    try:
        data = request.json or {}
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'error': 'Email and password required'}), 400
        
        # Check if user exists first (Mock check via admin list for simplicity in this setup)
        # Note: In production Supabase, explicit check or handling error 400 is fine.
        # But we need specific 409 for frontend redirect.
        try:
            users = admin_client.auth.admin.list_users()
            for u in users:
                if hasattr(u, 'email') and u.email == email:
                    return jsonify({'error': 'User exists', 'redirect': 'login'}), 409
        except:
            pass # Proceed to try signup
            
        try:
            resp = supabase.auth.sign_up({'email': email, 'password': password})
            if not resp or not resp.user:
                # Double check fail reason
                return jsonify({'error': 'Signup failed'}), 400
            
            token = resp.session.access_token if resp.session else None
            extra = {'user_id': resp.user.id, 'email': email, 'access_token': token}
            generate_otp(email, 'signup', extra)
            return jsonify({'message': 'OTP sent', 'email': email}), 200
        except Exception as e:
            if 'already' in str(e).lower() or 'exist' in str(e).lower():
                return jsonify({'error': 'User exists', 'redirect': 'login'}), 409
            return jsonify({'error': 'Signup failed ' + str(e)}), 400
    except Exception as e:
        app.logger.error(f"Signup error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
@limiter.limit("10 per hour")
def login():
    try:
        data = request.json or {}
        email = data.get('email', '').strip().lower()
        
        if not email:
            return jsonify({'error': 'Email required'}), 400
        
        # Check existence
        user_exists = False
        user_id = None
        try:
            users = admin_client.auth.admin.list_users()
            for user in users:
                if hasattr(user, 'email') and user.email == email:
                    user_exists = True
                    user_id = user.id
                    break
        except:
             # Fallback
             pass
             
        if not user_exists:
            return jsonify({'error': 'User not found', 'redirect': 'signup'}), 404
        
        extra = {'email': email, 'user_id': user_id}
        generate_otp(email, 'login', extra)
        return jsonify({'message': 'OTP sent'}), 200
    except:
        return jsonify({'error': 'Login failed'}), 500

@app.route('/api/auth/login/verify', methods=['POST'])
def login_verify():
    try:
        data = request.json or {}
        email = data.get('email', '').strip().lower()
        otp = data.get('otp', '').strip()
        
        extra = verify_otp(email, otp, 'login')
        if not extra:
            return jsonify({'error': 'Invalid OTP'}), 401
        
        user_id = extra.get('user_id')
        # FORCE CUSTOM TOKEN
        token = f"user-{user_id}-{secrets.token_urlsafe(32)}"
        
        return jsonify({'message': 'Success', 'token': token, 'user_id': user_id, 'user': {'id': user_id, 'email': email}}), 200
    except:
        return jsonify({'error': 'Failed'}), 500

@app.route('/api/auth/delete-account', methods=['POST'])
def delete_account_request():
    try:
        user_id = get_user_id()
        if not user_id:
            return jsonify({'error': 'Not authenticated'}), 401
        
        data = request.json or {}
        email = data.get('email')
        
        if not email:
             return jsonify({'error': 'Email required for verification'}), 400

        extra = {'user_id': user_id, 'email': email}
        generate_otp(email, 'delete_account', extra)
        return jsonify({'message': 'OTP sent'}), 200
    except:
        return jsonify({'error': 'Failed'}), 500

@app.route('/api/auth/delete-account/verify', methods=['POST'])
def delete_account_verify():
    try:
        data = request.json or {}
        email = data.get('email', '').strip().lower()
        otp = data.get('otp', '').strip()
        
        extra = verify_otp(email, otp, 'delete_account')
        if not extra:
            return jsonify({'error': 'Invalid OTP'}), 401
        
        user_id = extra.get('user_id')
        if user_id != get_user_id():
             return jsonify({'error': 'Unauthorized'}), 403

        if admin_client:
            admin_client.auth.admin.delete_user(user_id)
            return jsonify({'message': 'Account deleted'}), 200
        else:
            return jsonify({'error': 'Admin privs missing'}), 500
    except Exception as e:
        app.logger.error(f"Delete acc error: {e}")
        return jsonify({'error': 'Failed'}), 500

@app.route('/api/profile', methods=['GET'])
def get_profile():
    try:
        user_id = get_user_id()
        if not user_id:
            return jsonify({'error': 'Not authenticated'}), 401
            
        # Use admin_client to bypass RLS
        client = admin_client if admin_client else supabase
        resp = client.table('profiles').select('*').eq('user_id', user_id).execute()
        
        if not resp.data:
            return jsonify({'error': 'Profile not found'}), 404
            
        return jsonify(resp.data[0]), 200
    except Exception as e:
        app.logger.error(f"Get Profile error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/profile', methods=['POST'])
def save_profile():
    try:
        user_id = get_user_id()
        if not user_id:
            return jsonify({'error': 'Not authenticated'}), 401
        
        data = request.json or {}
        # goal = data.get('goal', 'maintenance') # User removed goal selection
        goal = 'maintenance' 
        weight = float(data.get('weight', 70))
        height = float(data.get('height', 170))
        age = int(data.get('age', 25))
        target_weight = float(data.get('targetWeight', weight))
        
        macros = calculate_macros(weight, height, age, goal, target_weight)
        
        profile = {
            'user_id': user_id,
            'age': age,
            'weight': weight,
            'height': height,
            'target_weight': target_weight,
            'calories': macros['calories'],
            'protein': macros['protein'],
            'carbs': macros['carbs'],
            'fats': macros['fats'],
            'instagram': data.get('instagram'),
            'twitter': data.get('twitter'),
            'facebook': data.get('facebook'),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        # Use admin_client to bypass RLS
        client = admin_client if admin_client else supabase
        existing = client.table('profiles').select('id').eq('user_id', user_id).execute()
        if existing.data:
            client.table('profiles').update(profile).eq('user_id', user_id).execute()
        else:
            client.table('profiles').insert(profile).execute()
        
        return jsonify({'message': 'Saved', 'profile': profile}), 201
    except Exception as e:
        app.logger.error(f"Profile error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/meals', methods=['GET'])
def get_meals():
    try:
        user_id = get_user_id()
        if not user_id:
            return jsonify({'error': 'Not authenticated'}), 401
        date = request.args.get('date', datetime.utcnow().date().isoformat())
        resp = supabase.table('meals').select('*').eq('user_id', user_id).eq('meal_date', date).order('created_at', desc=True).execute()
        return jsonify(resp.data or []), 200
    except:
        return jsonify({'error': 'Failed'}), 500

@app.route('/api/meals/range', methods=['GET'])
def get_meals_range():
    try:
        user_id = get_user_id()
        if not user_id: return jsonify({'error': 'Auth required'}), 401
        
        start = request.args.get('start')
        end = request.args.get('end')
        
        resp = supabase.table('meals').select('*').eq('user_id', user_id).gte('meal_date', start).lte('meal_date', end).execute()
        return jsonify(resp.data or []), 200
    except:
        return jsonify({'error': 'Failed'}), 500

@app.route('/api/meals', methods=['POST'])
def add_meal():
    try:
        user_id = get_user_id()
        if not user_id:
            return jsonify({'error': 'Not authenticated'}), 401
        data = request.json or {}
        meal = {
            'user_id': user_id,
            'name': data.get('name'),
            'calories': int(data.get('calories', 0)),
            'protein': int(data.get('protein', 0)),
            'carbs': int(data.get('carbs', 0)),
            'fats': int(data.get('fats', 0)),
            'meal_date': datetime.utcnow().date().isoformat()
        }
        supabase.table('meals').insert(meal).execute()
        return jsonify({'message': 'Added', 'meal': meal}), 201
    except:
        return jsonify({'error': 'Failed'}), 500

@app.route('/api/meals/<int:meal_id>', methods=['DELETE'])
def delete_meal(meal_id):
    try:
        user_id = get_user_id()
        if not user_id:
            return jsonify({'error': 'Not authenticated'}), 401
        supabase.table('meals').delete().eq('id', meal_id).eq('user_id', user_id).execute()
        return jsonify({'message': 'Deleted'}), 200
    except:
        return jsonify({'error': 'Failed'}), 500

@app.route('/api/analyze-food', methods=['POST'])
@limiter.limit("30 per hour")
def analyze_food():
    try:
        user_id = get_user_id()
        if not user_id:
            return jsonify({'error': 'Not authenticated'}), 401
        
        if not model:
            app.logger.error("Gemini Model is NONE. Check GEMINI_API_KEY env var.")
            return jsonify({'error': 'AI Service Unavailable (Key Error)'}), 503

        prompt_text = "Analyze this food. Calculate total calories, protein, carbs, fats. Return ONLY JSON: {\"name\": \"Food Name\", \"calories\": 0, \"protein\": 0, \"carbs\": 0, \"fats\": 0}. Do not breakdown ingredients."
        
        result = None
        try:
            response = None
            if 'image' in request.files:
                img = Image.open(request.files['image'].stream)
                response = model.generate_content([prompt_text, img])
            elif request.json and 'description' in request.json:
                desc = request.json['description']
                response = model.generate_content(f"Analyze: {desc}. {prompt_text}")
            else:
                return jsonify({'error': 'No input'}), 400
            
            if not response:
                raise Exception("No response from AI")
                
            result = json.loads(extract_json(response.text))
            
        except Exception as e:
            app.logger.error(f"Gemini Analysis Failed: {str(e)}")
            # Fallback to help debugging if it's a code issue vs API issue
            return jsonify({'error': f'AI Analysis failed: {str(e)}'}), 500

        return jsonify(result), 200
    except Exception as e:
        app.logger.error(f"Outer Endpoint Error: {e}")
        return jsonify({'error': 'System Error'}), 500

@app.route('/api/recipes/generate', methods=['POST'])
@limiter.limit("30 per hour")
def generate_recipes():
    try:
        user_id = get_user_id()
        if not user_id:
            return jsonify({'error': 'Not authenticated'}), 401
        
        data = request.json or {}
        ingredients = data.get('ingredients', [])
        if not ingredients:
            return jsonify({'error': 'Ingredients required'}), 400
        
        if not model:
            return jsonify({'error': 'Gemini API Key missing'}), 503

        prompt = f"Generate 5 recipes using: {', '.join(ingredients)}. Include step-by-step instructions. Return ONLY JSON: {{\"recipes\": [{{\"name\": \"Recipe Name\", \"ingredients\": [\"ing1\", \"ing2\"], \"instructions\": \"1. ...\", \"macros\": {{\"calories\": 0, \"protein\": 0, \"carbs\": 0, \"fats\": 0}}}}]}}"
        
        try:
            response = model.generate_content(prompt)
            result = json.loads(extract_json(response.text))
            return jsonify(result), 200
        except Exception as e:
             app.logger.error(f"Recipe Gen Error: {e}")
             return jsonify({'error': 'AI Generation failed.'}), 500
    except:
        return jsonify({'error': 'Failed'}), 500

@app.route('/api/cheat-meals/analyze', methods=['POST'])
@limiter.limit("30 per hour")
def analyze_cheat_meal():
    try:
        user_id = get_user_id()
        if not user_id: return jsonify({'error': 'Auth required'}), 401
        
        if not model: return jsonify({'error': 'Gemini API Key missing'}), 503

        data = request.json or {}
        meal_name = data.get('meal', '')
        if not meal_name: return jsonify({'error': 'Meal name required'}), 400
        
        prompt = f"Analyze this cheat meal: {meal_name}. Estimate calories, protein, carbs, fats. Return ONLY JSON: {{\"name\": \"{meal_name}\", \"calories\": 0, \"protein\": 0, \"carbs\": 0, \"fats\": 0}}"
        
        try:
            response = model.generate_content(prompt)
            result = json.loads(extract_json(response.text))
            return jsonify(result), 200
        except:
             return jsonify({'error': 'AI Analysis failed'}), 500
    except:
        return jsonify({'error': 'Failed'}), 500

@app.route('/api/weight-logs', methods=['GET'])
def get_weight_logs():
    try:
        user_id = get_user_id()
        if not user_id:
            return jsonify({'error': 'Not authenticated'}), 401
        resp = supabase.table('weight_logs').select('*').eq('user_id', user_id).order('log_date', desc=True).execute()
        return jsonify(resp.data or []), 200
    except:
        return jsonify({'error': 'Failed'}), 500

@app.route('/api/weight-logs', methods=['POST'])
def add_weight_log():
    try:
        user_id = get_user_id()
        if not user_id:
            return jsonify({'error': 'Not authenticated'}), 401
        data = request.json or {}
        weight = {'user_id': user_id, 'weight': float(data.get('weight', 0)), 'log_date': datetime.utcnow().date().isoformat()}
        supabase.table('weight_logs').insert(weight).execute()
        
        # Update profile weight
        supabase.table('profiles').update({'weight': weight['weight'], 'updated_at': datetime.utcnow().isoformat()}).eq('user_id', user_id).execute()
        
        return jsonify({'message': 'Logged'}), 201
    except:
        return jsonify({'error': 'Failed'}), 500

@app.route('/api/analyzed-meal', methods=['POST'])
def add_analyzed_meal():
    # Helper to add analyzed meal directly
    try:
        user_id = get_user_id()
        if not user_id: return jsonify({'error': 'Auth required'}), 401
        data = request.json or {}
        meal = {
            'user_id': user_id,
            'name': data.get('name', 'Analyzed Meal'),
            'calories': int(data.get('calories', 0)),
            'protein': int(data.get('protein', 0)),
            'carbs': int(data.get('carbs', 0)),
            'fats': int(data.get('fats', 0)),
            'meal_date': datetime.utcnow().date().isoformat()
        }
        supabase.table('meals').insert(meal).execute()
        return jsonify({'message': 'Saved', 'meal': meal}), 201
    except Exception as e:
        app.logger.error(f"Analyzed meal error: {e}")
        return jsonify({'error': 'Failed to save analyzed meal'}), 500

@app.route('/api/reports/download', methods=['GET'])
def download_report():
    try:
        user_id = get_user_id()
        if not user_id:
            return jsonify({'error': 'Not authenticated'}), 401
        
        range_type = request.args.get('range', 'weekly')
        today = datetime.utcnow().date()
        
        if range_type == 'daily':
            start_date = today
        elif range_type == 'monthly':
            start_date = today - timedelta(days=30)
        else: # weekly
            start_date = today - timedelta(days=7)
            
        resp = supabase.table('meals').select('*').eq('user_id', user_id).gte('meal_date', start_date.isoformat()).order('meal_date', desc=True).execute()
        meals = resp.data or []
        
        # Create CSV
        si = io.StringIO()
        cw = csv.writer(si)
        cw.writerow(['Date', 'Meal Name', 'Calories', 'Protein', 'Carbs', 'Fats'])
        for m in meals:
            cw.writerow([m['meal_date'], m['name'], m['calories'], m['protein'], m['carbs'], m['fats']])
        
        output = make_response(si.getvalue())
        output.headers["Content-Disposition"] = f"attachment; filename=report_{range_type}.csv"
        output.headers["Content-type"] = "text/csv"
        return output
    except:
        return jsonify({'error': 'Failed'}), 500

@app.route('/favicon.ico')
def favicon():
    return '', 204

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(debug=os.getenv('FLASK_ENV') == 'development', host='0.0.0.0', port=port)
