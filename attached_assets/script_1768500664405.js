// NutriCoach v5 - Frontend Logic
const API = '/api';
let token = localStorage.getItem('token');
let userId = localStorage.getItem('userId');
let currentEmail = null;
let analyzedFood = null;
let currentRecipe = null;

// Init
window.addEventListener('load', () => {
    if (token && userId) {
        loadDashboard();
    } else {
        document.getElementById('heroSection').style.display = 'flex';
    }
});

// ===== UI & LOADING =====
function showFullLoading(text, subtext) {
    document.getElementById('loaderText').textContent = text;
    document.getElementById('loaderSubtext').textContent = subtext;
    document.getElementById('loaderOverlay').classList.add('active');
}
function hideFullLoading() {
    document.getElementById('loaderOverlay').classList.remove('active');
}

function openAuthModal(mode) {
    document.getElementById('authSection').classList.add('active');
    if (mode === 'signup') switchToSignup();
    else switchToLogin();
}

function closeAuthModal() {
    document.getElementById('authSection').classList.remove('active');
}

// ===== AUTH =====
function switchToSignup() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('signupForm').classList.remove('hidden');
}
function switchToLogin() {
    document.getElementById('signupForm').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
}

// Toast Logic
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    // Icon based on type
    const icon = type === 'success' ? '✅' : '⚠️';
    toast.innerHTML = `<span style="font-size:1.2rem;">${icon}</span><span>${message}</span>`;

    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => toast.classList.add('active'));

    // Remove after 3s
    setTimeout(() => {
        toast.classList.remove('active');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function show(id) { document.getElementById(id).classList.remove('hidden'); }
function hide(id) { document.getElementById(id).classList.add('hidden'); }

// OTP Logic
function setupOtpInputs() {
    const containers = document.querySelectorAll('.otp-container');
    containers.forEach(container => {
        const inputs = container.querySelectorAll('.otp-digit');
        inputs.forEach((input, index) => {
            // Auto-focus next
            input.addEventListener('input', (e) => {
                if (e.target.value.length === 1) {
                    if (index < inputs.length - 1) inputs[index + 1].focus();
                }
            });
            // Backspace focus prev
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !e.target.value) {
                    if (index > 0) inputs[index - 1].focus();
                }
            });
            // Paste
            input.addEventListener('paste', (e) => {
                e.preventDefault();
                const text = (e.clipboardData || window.clipboardData).getData('text').slice(0, 6);
                if (!/^\d+$/.test(text)) return;
                text.split('').forEach((char, i) => {
                    if (inputs[i]) inputs[i].value = char;
                });
                if (inputs[text.length - 1]) inputs[text.length - 1].focus();
                else if (inputs[5]) inputs[5].focus();
            });
        });
    });
}

function getOtpValue(containerId) {
    const inputs = document.querySelectorAll(`#${containerId} .otp-digit`);
    let otp = '';
    inputs.forEach(i => otp += i.value);
    return otp;
}

// Init
window.addEventListener('load', () => {
    setupOtpInputs();
    if (token && userId) {
        loadDashboard();
    } else {
        document.getElementById('heroSection').style.display = 'flex';
    }
});

async function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    if (!email) return showToast('Enter email', 'error');

    showFullLoading('Sending OTP...', 'Check your email');
    try {
        const res = await fetch(`${API}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        hideFullLoading();
        const data = await res.json();
        if (res.ok) {
            currentEmail = email;
            hide('loginStep1'); show('loginStep2');
            showToast('OTP sent to ' + email);
        } else {
            showToast(data.error, 'error');
            if (data.action === 'signup') {
                setTimeout(() => switchToSignup(), 1500); // Auto-redirect
            }
        }
    } catch (e) { hideFullLoading(); showToast('Connection Error', 'error'); }
}

async function verifyLogin() {
    const otp = getOtpValue('loginOtpContainer');
    if (otp.length < 6) return showToast('Enter complete OTP', 'error');

    showFullLoading('Verifying...', 'Logging you in');
    try {
        const res = await fetch(`${API}/auth/login/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentEmail, otp })
        });
        hideFullLoading();
        if (res.ok) {
            const data = await res.json();
            token = data.token; userId = data.user_id;
            localStorage.setItem('token', token);
            localStorage.setItem('userId', userId);
            loadDashboard();
            showToast('Welcome back!');
        } else {
            const d = await res.json();
            showToast(d.error || 'Invalid OTP', 'error');
        }
    } catch (e) { hideFullLoading(); showToast('Connection Error', 'error'); }
}

async function handleSignup() {
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    if (!email || !password) return showToast('Fill all fields', 'error');

    showFullLoading('Creating Account...', 'Sending OTP');
    try {
        const res = await fetch(`${API}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        hideFullLoading();
        if (res.ok) {
            currentEmail = email;
            hide('signupStep1'); show('signupStep2');
            showToast('OTP sent to ' + email);
        } else {
            const data = await res.json();
            showToast(data.error, 'error');
            if (data.action === 'login') {
                setTimeout(() => switchToLogin(), 1500); // Auto-redirect
            }
        }
    } catch (e) { hideFullLoading(); showToast('Connection Error', 'error'); }
}

async function verifySignup() {
    const otp = getOtpValue('signupOtpContainer');
    if (otp.length < 6) return showToast('Enter complete OTP', 'error');

    showFullLoading('Verifying...', 'Setting up profile');
    try {
        const res = await fetch(`${API}/auth/signup/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentEmail, otp })
        });
        hideFullLoading();
        if (res.ok) {
            const data = await res.json();
            token = data.token; userId = data.user.id;
            localStorage.setItem('token', token);
            localStorage.setItem('userId', userId);

            // Fix: Don't load dashboard yet. Show Profile Modal.
            // Fix: Don't load dashboard yet. Show Profile Modal.
            document.getElementById('authSection').classList.remove('active');
            document.getElementById('heroSection').style.display = 'none';

            const modal = document.getElementById('profileModal');
            modal.classList.add('active');

            showToast('Email verified! Please complete your profile.');
        } else {
            const d = await res.json();
            showToast(d.error || 'Invalid OTP', 'error');
        }
    } catch (e) { hideFullLoading(); showToast('Connection Error', 'error'); }
}

function logout() {
    localStorage.clear();
    location.reload();
}

// ===== DASHBOARD & MEALS =====
function showTab(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById('tab' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.remove('hidden');
    if (tab === 'dashboard') loadMeals();
    if (tab === 'cheat') loadCheatMeals();
}

async function loadDashboard(profileData = null) {
    // Don't hide Hero yet if we might fail auth
    try {
        let profile = profileData;

        if (!profile) {
            // Load Profile if not provided
            const pRes = await fetch(`${API}/profile`, { headers: { 'Authorization': `Bearer ${token}` } });

            if (pRes.status === 401) {
                // Token invalid/expired
                localStorage.clear();
                document.getElementById('heroSection').style.display = 'flex';
                document.getElementById('authSection').classList.remove('active');
                document.getElementById('dashboardSection').classList.add('hidden');
                showToast('Session expired. Please log in again.', 'error');
                return;
            }

            if (pRes.status === 404) {
                // Auth OK, Profile Missing -> Setup
                document.getElementById('heroSection').style.display = 'none';
                document.getElementById('authSection').classList.remove('active');
                document.getElementById('profileModal').classList.add('active');
                showToast('Please complete your profile setup.', 'info');
                return;
            }

            if (!pRes.ok) {
                console.error('Profile load error');
                showToast('Failed to load profile data.', 'error');
                return;
            }

            profile = await pRes.json();
        }

        // Auth Success - Hide Landing/Auth
        document.getElementById('heroSection').style.display = 'none';
        document.getElementById('authSection').classList.remove('active');

        // Check for weight alert
        if (profile.weight_update_reminder) {
            show('weightAlert');
            showToast('Remember to update your weight!', 'info');
        }

        // Set Goals
        document.getElementById('caloriesGoal').textContent = profile.calories;
        document.getElementById('proteinGoal').textContent = profile.protein;
        document.getElementById('carbsGoal').textContent = profile.carbs;
        document.getElementById('fatsGoal').textContent = profile.fats;

        // Fill Profile Form
        document.getElementById('updateAge').value = profile.age;
        document.getElementById('updateHeight').value = profile.height;
        document.getElementById('updateWeight').value = profile.weight;
        document.getElementById('updateTarget').value = profile.target_weight;

        show('dashboardSection');
        showTab('dashboard');
        window.scrollTo(0, 0);
        loadMeals();

    } catch (e) { console.error(e); showToast('Connection Error', 'error'); }
}

async function saveProfile() {
    const age = document.getElementById('profileAge').value;
    const weight = document.getElementById('profileWeight').value;
    const height = document.getElementById('profileHeight').value;
    const targetWeight = document.getElementById('profileTarget').value;
    const goal = document.getElementById('profileGoal').value;

    if (!age || !weight || !height) return showToast('Fill required fields', 'error');

    showFullLoading('Saving...', 'AI calculating macros...');
    try {
        const res = await fetch(`${API}/profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ age, weight, height, targetWeight, goal })
        });
        hideFullLoading();
        if (res.ok) {
            const data = await res.json();
            document.getElementById('profileModal').classList.remove('active');
            // Pass the saved profile directly to avoid fetch delay
            await loadDashboard(data.profile);
            showToast('Profile Saved & Macros Calculated!');
        } else {
            const d = await res.json();
            const msg = d.error || 'Error saving profile';
            showToast(msg, 'error');
            // Also show in modal error box
            const errBox = document.getElementById('profileError');
            errBox.textContent = msg;
            errBox.classList.remove('hidden');
        }
    } catch (e) {
        hideFullLoading();
        showToast('Connection Error', 'error');
        document.getElementById('profileError').textContent = 'Connection Error';
        document.getElementById('profileError').classList.remove('hidden');
    }
}

async function updateProfile() {
    const age = document.getElementById('updateAge').value;
    const weight = document.getElementById('updateWeight').value;
    const height = document.getElementById('updateHeight').value;
    const targetWeight = document.getElementById('updateTarget').value;

    showFullLoading('Updating...', 'Recalculating');
    try {
        const res = await fetch(`${API}/profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ age, weight, height, targetWeight })
        });
        // Log weight
        if (weight) {
            await fetch(`${API}/weight-logs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ weight })
            });
        }
        hideFullLoading();
        if (res.ok) { showToast('Profile Updated'); loadDashboard(); }
        else {
            const d = await res.json();
            showToast(d.error || 'Error updating profile', 'error');
        }
    } catch (e) { hideFullLoading(); showToast('Connection Error', 'error'); }
}

async function loadMeals() {
    const res = await fetch(`${API}/meals`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) return;
    const meals = await res.json();

    let totals = { cal: 0, pro: 0, carbs: 0, fats: 0 };

    const html = meals.map(m => {
        totals.cal += m.calories; totals.pro += m.protein; totals.carbs += m.carbs; totals.fats += m.fats;
        return `
        <div class="meal-item">
            <div>
                <strong>${m.name}</strong>
                <div style="font-size:0.9rem; color:var(--gray-dark);">
                    ${m.calories} cal | P: ${m.protein}g | C: ${m.carbs}g | F: ${m.fats}g
                </div>
            </div>
            <button onclick="deleteMeal(${m.id})" class="delete-btn">&times;</button>
        </div>`;
    }).join('');

    document.getElementById('mealsList').innerHTML = html || '<div style="text-align:center; padding:20px; color:var(--gray-dark);">No meals tracked today</div>';

    // Update Progress
    ['calories', 'protein', 'carbs', 'fats'].forEach(k => {
        const valStart = k === 'calories' ? 'cal' : k === 'protein' ? 'pro' : k;
        const val = totals[valStart];
        const goal = parseInt(document.getElementById(k + 'Goal').textContent) || 1;
        document.getElementById(k + 'Value').textContent = val;
        document.getElementById(k + 'Progress').style.width = Math.min((val / goal) * 100, 100) + '%';
    });
}

async function deleteMeal(id) {
    if (!confirm('Delete meal?')) return;
    await fetch(`${API}/meals/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    showToast('Meal deleted.', 'success');
    loadMeals();
}

async function analyzeFood() {
    const desc = document.getElementById('foodDescription').value.trim();
    const img = document.getElementById('foodImage').files[0];

    if (!desc && !img) return showToast('Enter description or upload image', 'error');

    showFullLoading('Analyzing...', 'Gemini is checking your food');
    try {
        let res;
        if (img) {
            const fd = new FormData(); fd.append('image', img);
            res = await fetch(`${API}/analyze-food`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: fd });
        } else {
            res = await fetch(`${API}/analyze-food`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ description: desc })
            });
        }

        hideFullLoading();
        const data = await res.json();
        if (res.ok) {
            analyzedFood = data;
            document.getElementById('foodDetails').innerHTML = `
                <strong>${data.name}</strong><br>
                Calories: ${data.calories} | P: ${data.protein}g | C: ${data.carbs}g | F: ${data.fats}g
            `;
            show('foodResult');
            showToast('Food analyzed successfully!', 'success');
        } else showToast('Analysis failed', 'error');
    } catch (e) { hideFullLoading(); showToast('Connection Error', 'error'); }
}

async function addAnalyzedMeal() {
    if (!analyzedFood) return;

    showFullLoading('Saving...', 'Adding to log');
    try {
        const res = await fetch(`${API}/analyzed-meal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(analyzedFood)
        });
        hideFullLoading();
        if (res.ok) {
            showToast('Meal Added!');
            hide('foodResult');
            document.getElementById('foodDescription').value = '';
            document.getElementById('foodImage').value = '';
            loadMeals();
        } else {
            showToast('Failed to save meal', 'error');
        }
    } catch (e) { hideFullLoading(); showToast('Connection Error', 'error'); }
}

// ===== RECIPES =====
async function generateRecipes() {
    const ingredients = document.getElementById('ingredients').value.split(',');
    if (!ingredients[0]) return showToast('Enter ingredients', 'error');

    showFullLoading('Cooking up ideas...', 'Gemini is writing recipes');
    try {
        const res = await fetch(`${API}/recipes/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ ingredients })
        });
        hideFullLoading();
        const data = await res.json();

        const html = data.recipes.map((r, i) => `
            <div class="recipe-card">
                <h3>${r.name}</h3>
                <p>Contains: ${Array.isArray(r.ingredients) ? r.ingredients.slice(0, 3).join(', ') : 'Ingredients'}...</p>
                <div style="margin-top:auto;">
                    <button onclick='openRecipeModal(${JSON.stringify(r).replace(/'/g, "&apos;")})' class="btn btn-primary btn-sm" style="margin-bottom:8px;">See Recipe</button>
                    <button onclick='madeThis(${JSON.stringify(r.macros).replace(/'/g, "&apos;")}, "${r.name.replace(/"/g, '&quot;')}")' class="btn btn-success btn-sm">✅ Made This</button>
                </div>
            </div>
        `).join('');
        document.getElementById('recipesList').innerHTML = html;
        showToast('Recipes generated!', 'success');
    } catch (e) { hideFullLoading(); showToast('Connection Error', 'error'); }
}

function openRecipeModal(recipe) {
    document.getElementById('modalRecipeTitle').textContent = recipe.name;
    document.getElementById('modalIngredients').innerHTML = recipe.ingredients.map(i => `<li>${i}</li>`).join('');
    document.getElementById('modalInstructions').textContent = recipe.instructions;
    document.getElementById('modalMacros').textContent = `Cal: ${recipe.macros.calories} | P: ${recipe.macros.protein} | C: ${recipe.macros.carbs}`;

    const btn = document.getElementById('modalMadeBtn');
    btn.onclick = () => {
        madeThis(recipe.macros, recipe.name);
        closeRecipeModal();
    };

    document.getElementById('recipeModal').classList.add('active');
}

function closeRecipeModal() { document.getElementById('recipeModal').classList.remove('active'); }

async function madeThis(macros, name) {
    await fetch(`${API}/meals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
            name: name,
            calories: macros.calories,
            protein: macros.protein,
            carbs: macros.carbs,
            fats: macros.fats
        })
    });
    showToast('Added to meal log!');
    loadMeals();
}

// ===== CHEAT MEALS =====
async function loadCheatMeals() {
    const res = await fetch(`${API}/cheat-meals`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) {
        const cheats = await res.json();
        document.getElementById('cheatHistory').innerHTML = cheats.map(c => `
            <div class="meal-item">
                <span>${c.name} (${c.created_at.split('T')[0]})</span>
                <span class="macro-badge" style="background:#fee2e2; color:#c53030;">${c.calories} cal</span>
                <button onclick="deleteCheat(${c.id})" class="delete-btn">&times;</button>
            </div>
        `).join('');
    } else {
        showToast('Failed to load cheat meal history.', 'error');
    }
}
async function deleteCheat(id) {
    if (!confirm('Delete?')) return;
    await fetch(`${API}/cheat-meals/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    showToast('Cheat meal deleted.', 'success');
    loadCheatMeals();
}

// ===== PROFILE & OTHER =====
async function showWeightLogs() {
    const res = await fetch(`${API}/weight-logs`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) {
        const logs = await res.json();
        document.getElementById('weightHistory').innerHTML = logs.map(l => `
            <div style="padding:10px; border-bottom:1px solid #eee; display:flex; justify-content:space-between;">
                <span>${l.log_date}</span>
                <strong>${l.weight} kg</strong>
            </div>
        `).join('');
    } else {
        showToast('Failed to load weight logs.', 'error');
    }
}

// ===== PROGRESS & CHARTS =====
let weightChart = null;
let calorieChart = null;

async function loadProgressCharts() {
    showFullLoading('Loading Progress...', 'Fetching data');
    try {
        const [wRes, mRes] = await Promise.all([
            fetch(`${API}/weight-logs`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${API}/reports/download?range=monthly`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        // Fetch last 7 days of meals for chart
        const dates = [...Array(7)].map((_, i) => {
            const d = new Date(); d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        const mealPromises = dates.map(date => fetch(`${API}/meals?date=${date}`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()));
        const mealsData = await Promise.all(mealPromises);

        const calorieData = mealsData.map(dayMeals => Array.isArray(dayMeals) ? dayMeals.reduce((sum, m) => sum + m.calories, 0) : 0);

        // Weight Data
        let weightLabels = [];
        let weightValues = [];
        if (wRes.ok) {
            const wLogs = await wRes.json();
            const sorted = wLogs.slice(0, 10).reverse();
            weightLabels = sorted.map(l => l.log_date);
            weightValues = sorted.map(l => l.weight);
        }

        hideFullLoading();
        renderCharts(dates, calorieData, weightLabels, weightValues);
        document.getElementById('progressModal').classList.add('active');

    } catch (e) { hideFullLoading(); console.error(e); showToast('Error loading charts', 'error'); }
}

function renderCharts(calLabels, calData, wLabels, wData) {
    const ctxCal = document.getElementById('calorieChart').getContext('2d');
    const ctxWeight = document.getElementById('weightChart').getContext('2d');

    if (calorieChart) calorieChart.destroy();
    if (weightChart) weightChart.destroy();

    calorieChart = new Chart(ctxCal, {
        type: 'bar',
        data: {
            labels: calLabels,
            datasets: [{
                label: 'Calories',
                data: calData,
                backgroundColor: '#B3D9FF',
                borderRadius: 5
            }]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });

    weightChart = new Chart(ctxWeight, {
        type: 'line',
        data: {
            labels: wLabels,
            datasets: [{
                label: 'Weight (kg)',
                data: wData,
                borderColor: '#FFB3D9',
                tension: 0.4,
                fill: false
            }]
        },
        options: { responsive: true }
    });
}

function downloadReport(range = 'weekly') {
    fetch(`${API}/reports/download?range=${range}`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => {
            if (!res.ok) throw new Error('Failed to download report');
            return res.blob();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `report_${range}.csv`;
            document.body.appendChild(a); a.click(); a.remove();
            window.URL.revokeObjectURL(url);
            showToast('Report downloaded successfully!', 'success');
        })
        .catch(e => {
            console.error(e);
            showToast('Failed to download report.', 'error');
        });
}

// Share/Poster
function shareProgress(platform) {
    showToast(`Generating ${platform} card...`, 'success');
}

// Delete Account
function openDeleteModal() { document.getElementById('deleteAccountModal').classList.add('active'); }
function closeDeleteModal() { document.getElementById('deleteAccountModal').classList.remove('active'); }

async function requestDeleteOtp() {
    const email = document.getElementById('deleteEmail').value;
    if (!email) return showToast('Confirm email', 'error');

    try {
        const res = await fetch(`${API}/auth/delete-account`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ email })
        });
        if (res.ok) {
            hide('deleteStep1'); show('deleteStep2');
            showToast('OTP sent to your email.', 'success');
        } else {
            const d = await res.json();
            showToast(d.error || 'Failed to send OTP.', 'error');
        }
    } catch (e) {
        showToast('Connection Error', 'error');
    }
}

async function confirmDeleteAccount() {
    const email = document.getElementById('deleteEmail').value;
    const otp = document.getElementById('deleteOtp').value;

    const res = await fetch(`${API}/auth/delete-account/verify`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ email, otp })
    });

    if (res.ok) {
        showToast('Account Deleted. Goodbye!', 'success');
        setTimeout(logout, 2000);
    } else {
        showToast('Verification failed', 'error');
    }
}

function togglePassword(id, btn) {
    const input = document.getElementById(id);
    if (input.type === 'password') { input.type = 'text'; btn.textContent = '🙈'; }
    else { input.type = 'password'; btn.textContent = '👁️'; }
}
