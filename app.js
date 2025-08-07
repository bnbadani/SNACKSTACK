// Nutrition Tracker - Frontend JavaScript
class NutritionTrackerApp {
    constructor() {
        this.apiBase = '/api';
        this.currentTab = 'dashboard';
        this.meals = [];
        this.userProfile = null;
        this.charts = {};
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.setTodayDate();
        await this.loadUserProfile();
        await this.loadMeals();
        this.updateDashboard();
        this.updateMealsList();
        this.loadStatistics();
        this.checkProfileSetup();
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Add meal form
        document.getElementById('add-meal-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addMeal();
        });

        // Edit meal form
        document.getElementById('edit-meal-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateMeal();
        });

        // Profile form
        document.getElementById('profile-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveUserProfile();
        });

        // Filters
        document.getElementById('filter-date').addEventListener('change', () => {
            this.updateMealsList();
        });

        document.getElementById('filter-meal-type').addEventListener('change', () => {
            this.updateMealsList();
        });

        document.getElementById('filter-search').addEventListener('input', 
            this.debounce(() => this.updateMealsList(), 300)
        );

        // Form validation
        this.setupFormValidation();

        // Modal close on outside click
        document.getElementById('edit-modal').addEventListener('click', (e) => {
            if (e.target.id === 'edit-modal') {
                this.closeEditModal();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeEditModal();
            }
        });
    }

    setupFormValidation() {
        const forms = document.querySelectorAll('.meal-form');
        forms.forEach(form => {
            const inputs = form.querySelectorAll('input[required], select[required]');
            inputs.forEach(input => {
                input.addEventListener('blur', () => this.validateField(input));
                input.addEventListener('input', () => this.clearFieldError(input));
            });
        });
    }

    validateField(field) {
        const value = field.value.trim();
        const errorElement = document.getElementById(field.id + '-error');
        
        if (!errorElement) return true;

        let isValid = true;
        let errorMessage = '';

        if (field.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        } else if (field.type === 'number' && value) {
            const num = parseFloat(value);
            if (isNaN(num) || num < 0) {
                isValid = false;
                errorMessage = 'Please enter a valid positive number';
            }
        } else if (field.type === 'date' && value) {
            const date = new Date(value);
            if (isNaN(date.getTime())) {
                isValid = false;
                errorMessage = 'Please enter a valid date';
            }
        }

        errorElement.textContent = errorMessage;
        field.classList.toggle('error', !isValid);
        
        return isValid;
    }

    clearFieldError(field) {
        const errorElement = document.getElementById(field.id + '-error');
        if (errorElement) {
            errorElement.textContent = '';
            field.classList.remove('error');
        }
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        this.currentTab = tabName;

        // Load data for specific tabs
        if (tabName === 'statistics') {
            this.loadStatistics();
        } else if (tabName === 'meals') {
            this.updateMealsList();
        } else if (tabName === 'dashboard') {
            this.updateDashboard();
        } else if (tabName === 'profile') {
            this.updateProfileResults();
        }
    }

    setTodayDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('date').value = today;
        
        // Set default date range for statistics (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        document.getElementById('stats-start-date').value = thirtyDaysAgo.toISOString().split('T')[0];
        document.getElementById('stats-end-date').value = today;
    }

    async loadMeals() {
        try {
            this.showLoading();
            
            // Try to load from localStorage first (fallback for no backend)
            const localMeals = localStorage.getItem('meals');
            if (localMeals) {
                this.meals = JSON.parse(localMeals);
            } else {
                this.meals = [];
            }

            try {
                // Try to load from server
                const response = await fetch(`${this.apiBase}/meals`);
                if (response.ok) {
                    this.meals = await response.json();
                } else {
                    console.log('Server not available, using local storage');
                }
            } catch (serverError) {
                console.log('Server not available, using local storage');
                // Keep using localStorage data
            }
        } catch (error) {
            console.error('Error loading meals:', error);
            this.meals = [];
        } finally {
            this.hideLoading();
        }
    }

    async loadUserProfile() {
        try {
            // Try to load from localStorage first (fallback for no backend)
            const localProfile = localStorage.getItem('userProfile');
            if (localProfile) {
                this.userProfile = JSON.parse(localProfile);
                this.populateProfileForm();
                this.updateProfileResults();
                return;
            }

            // Try to load from server
            const response = await fetch(`${this.apiBase}/profile`);
            if (response.ok) {
                this.userProfile = await response.json();
                this.populateProfileForm();
                this.updateProfileResults();
            } else if (response.status === 404) {
                // No profile exists yet
                this.userProfile = null;
            } else {
                throw new Error('Failed to load user profile');
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
            // Try localStorage as fallback
            const localProfile = localStorage.getItem('userProfile');
            if (localProfile) {
                this.userProfile = JSON.parse(localProfile);
                this.populateProfileForm();
                this.updateProfileResults();
            } else {
                this.userProfile = null;
            }
        }
    }

    async saveUserProfile() {
        try {
            const form = document.getElementById('profile-form');
            const formData = new FormData(form);
            
            // Validate form
            const inputs = form.querySelectorAll('input[required], select[required]');
            let isValid = true;
            inputs.forEach(input => {
                if (!this.validateField(input)) {
                    isValid = false;
                }
            });

            if (!isValid) {
                this.showToast('Please fix the errors in the form', 'error');
                return;
            }

            const profileData = {
                age: parseInt(formData.get('age')),
                gender: formData.get('gender'),
                heightFt: parseInt(formData.get('heightFt')),
                heightIn: parseInt(formData.get('heightIn')),
                weightLbs: parseFloat(formData.get('weightLbs')),
                activityLevel: formData.get('activityLevel'),
                goal: formData.get('goal')
            };

            // Calculate BMR and calories locally
            const calculatedProfile = this.calculateProfileData(profileData);

            this.showLoading();
            
            try {
                // Try to save to server first
                const response = await fetch(`${this.apiBase}/profile`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(profileData)
                });

                if (response.ok) {
                    this.userProfile = await response.json();
                } else {
                    throw new Error('Server not available');
                }
            } catch (serverError) {
                console.log('Server not available, using local calculation');
                // Fallback to local calculation
                this.userProfile = calculatedProfile;
                // Save to localStorage
                localStorage.setItem('userProfile', JSON.stringify(this.userProfile));
            }

            this.updateProfileResults();
            this.showToast('Profile saved successfully!', 'success');
            this.updateDashboard(); // Refresh with new calorie goals

        } catch (error) {
            console.error('Error saving profile:', error);
            this.showToast(error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    calculateProfileData(profileData) {
        // Calculate BMR using Mifflin-St Jeor Equation
        const totalHeightInches = (profileData.heightFt * 12) + profileData.heightIn;
        const heightCm = totalHeightInches * 2.54;
        const weightKg = profileData.weightLbs * 0.453592;
        
        let bmr;
        if (profileData.gender.toLowerCase() === 'male') {
            bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * profileData.age) + 5;
        } else {
            bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * profileData.age) - 161;
        }

        // Activity level multipliers
        const activityMultipliers = {
            'sedentary': 1.2,
            'lightly_active': 1.375,
            'moderately_active': 1.55,
            'very_active': 1.725,
            'extra_active': 1.9
        };
        
        const maintenanceCalories = bmr * (activityMultipliers[profileData.activityLevel] || 1.375);
        
        // Goal adjustments
        let dailyCalorieGoal;
        switch (profileData.goal.toLowerCase()) {
            case 'weight_loss':
                dailyCalorieGoal = Math.round(maintenanceCalories - 500);
                break;
            case 'weight_gain':
                dailyCalorieGoal = Math.round(maintenanceCalories + 500);
                break;
            case 'maintain':
            default:
                dailyCalorieGoal = Math.round(maintenanceCalories);
        }

        return {
            ...profileData,
            bmr: Math.round(bmr),
            dailyCalorieGoal: dailyCalorieGoal,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }

    populateProfileForm() {
        if (!this.userProfile) return;

        document.getElementById('profile-age').value = this.userProfile.age;
        document.getElementById('profile-gender').value = this.userProfile.gender;
        document.getElementById('profile-height-ft').value = this.userProfile.heightFt;
        document.getElementById('profile-height-in').value = this.userProfile.heightIn;
        document.getElementById('profile-weight').value = this.userProfile.weightLbs;
        document.getElementById('profile-activity').value = this.userProfile.activityLevel;
        document.getElementById('profile-goal').value = this.userProfile.goal;
    }

    updateProfileResults() {
        if (!this.userProfile) {
            // Reset to default values
            document.getElementById('bmr-value').textContent = '---';
            document.getElementById('daily-calories-value').textContent = '---';
            document.getElementById('bmi-value').textContent = '---';
            document.getElementById('bmi-category').textContent = 'Body Mass Index';
            document.getElementById('profile-info').style.display = 'none';
            return;
        }

        // Update BMR and daily calories
        document.getElementById('bmr-value').textContent = `${this.userProfile.bmr} cal`;
        document.getElementById('daily-calories-value').textContent = `${this.userProfile.dailyCalorieGoal} cal`;

        // Calculate and display BMI
        const totalHeightInches = (this.userProfile.heightFt * 12) + this.userProfile.heightIn;
        const heightM = totalHeightInches * 0.0254;
        const weightKg = this.userProfile.weightLbs * 0.453592;
        const bmi = weightKg / (heightM * heightM);
        
        document.getElementById('bmi-value').textContent = bmi.toFixed(1);
        
        // BMI category
        let category = '';
        if (bmi < 18.5) category = 'Underweight';
        else if (bmi < 25) category = 'Normal weight';
        else if (bmi < 30) category = 'Overweight';
        else category = 'Obese';
        
        document.getElementById('bmi-category').textContent = category;

        // Update profile summary
        const heightStr = `${this.userProfile.heightFt}'${this.userProfile.heightIn}"`;
        document.getElementById('personal-summary').textContent = 
            `${this.userProfile.age} year old ${this.userProfile.gender}, ${heightStr}, ${this.userProfile.weightLbs} lbs`;
        
        const activityLabels = {
            'sedentary': 'Sedentary',
            'lightly_active': 'Lightly Active',
            'moderately_active': 'Moderately Active',
            'very_active': 'Very Active',
            'extra_active': 'Extra Active'
        };
        document.getElementById('activity-summary').textContent = activityLabels[this.userProfile.activityLevel];
        
        const goalLabels = {
            'weight_loss': 'Weight Loss',
            'maintain': 'Maintain Weight',
            'weight_gain': 'Weight Gain'
        };
        document.getElementById('goal-summary').textContent = goalLabels[this.userProfile.goal];
        
        document.getElementById('updated-date').textContent = 
            new Date(this.userProfile.updatedAt).toLocaleDateString();
        
        document.getElementById('profile-info').style.display = 'block';
    }

    checkProfileSetup() {
        if (!this.userProfile) {
            // Show notification to set up profile
            setTimeout(() => {
                this.showToast('Tip: Set up your profile to get personalized calorie goals!', 'info');
            }, 3000);
        }

        // Add sample data if no meals exist (for demo purposes)
        if (this.meals.length === 0) {
            this.addSampleData();
        }
    }

    addSampleData() {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        const sampleMeals = [
            {
                transactionId: 'sample001',
                foodName: 'Greek Yogurt with Berries',
                calories: 150,
                protein: 15,
                carbs: 20,
                fats: 4,
                date: today,
                mealType: 'Breakfast',
                createdAt: new Date().toISOString()
            },
            {
                transactionId: 'sample002',
                foodName: 'Grilled Chicken Salad',
                calories: 320,
                protein: 35,
                carbs: 12,
                fats: 14,
                date: today,
                mealType: 'Lunch',
                createdAt: new Date().toISOString()
            },
            {
                transactionId: 'sample003',
                foodName: 'Almonds (1 oz)',
                calories: 160,
                protein: 6,
                carbs: 6,
                fats: 14,
                date: today,
                mealType: 'Snack',
                createdAt: new Date().toISOString()
            },
            {
                transactionId: 'sample004',
                foodName: 'Oatmeal with Banana',
                calories: 220,
                protein: 8,
                carbs: 45,
                fats: 3,
                date: yesterdayStr,
                mealType: 'Breakfast',
                createdAt: yesterday.toISOString()
            },
            {
                transactionId: 'sample005',
                foodName: 'Turkey Sandwich',
                calories: 380,
                protein: 25,
                carbs: 40,
                fats: 12,
                date: yesterdayStr,
                mealType: 'Lunch',
                createdAt: yesterday.toISOString()
            }
        ];

        this.meals = sampleMeals;
        localStorage.setItem('meals', JSON.stringify(this.meals));
        console.log('Added sample data for demo purposes');
    }

    async addMeal() {
        try {
            const form = document.getElementById('add-meal-form');
            const formData = new FormData(form);
            
            // Validate form
            const inputs = form.querySelectorAll('input[required], select[required]');
            let isValid = true;
            inputs.forEach(input => {
                if (!this.validateField(input)) {
                    isValid = false;
                }
            });

            if (!isValid) {
                this.showToast('Please fix the errors in the form', 'error');
                return;
            }

            const mealData = {
                foodName: formData.get('foodName'),
                calories: parseFloat(formData.get('calories')),
                protein: parseFloat(formData.get('protein')),
                carbs: parseFloat(formData.get('carbs')),
                fats: parseFloat(formData.get('fats')),
                date: formData.get('date'),
                mealType: formData.get('mealType')
            };

            this.showLoading();
            
            try {
                // Try to save to server first
                const response = await fetch(`${this.apiBase}/meals`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(mealData)
                });

                if (response.ok) {
                    const newMeal = await response.json();
                    this.meals.push(newMeal);
                } else {
                    throw new Error('Server not available');
                }
            } catch (serverError) {
                console.log('Server not available, saving locally');
                // Fallback to local storage
                const newMeal = {
                    transactionId: this.generateId(),
                    ...mealData,
                    createdAt: new Date().toISOString()
                };
                this.meals.push(newMeal);
                localStorage.setItem('meals', JSON.stringify(this.meals));
            }

            form.reset();
            this.setTodayDate(); // Reset date to today
            this.showToast('Meal added successfully!', 'success');
            this.updateDashboard();
            this.updateMealsList();
        } catch (error) {
            console.error('Error adding meal:', error);
            this.showToast(error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async updateMeal() {
        try {
            const form = document.getElementById('edit-meal-form');
            const formData = new FormData(form);
            const mealId = document.getElementById('edit-meal-id').value;

            // Validate form
            const inputs = form.querySelectorAll('input[required], select[required]');
            let isValid = true;
            inputs.forEach(input => {
                if (!this.validateField(input)) {
                    isValid = false;
                }
            });

            if (!isValid) {
                this.showToast('Please fix the errors in the form', 'error');
                return;
            }

            const mealData = {
                foodName: formData.get('foodName'),
                calories: parseFloat(formData.get('calories')),
                protein: parseFloat(formData.get('protein')),
                carbs: parseFloat(formData.get('carbs')),
                fats: parseFloat(formData.get('fats')),
                date: formData.get('date'),
                mealType: formData.get('mealType')
            };

            this.showLoading();
            
            try {
                // Try to update on server first
                const response = await fetch(`${this.apiBase}/meals/${mealId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(mealData)
                });

                if (response.ok) {
                    const updatedMeal = await response.json();
                    const index = this.meals.findIndex(m => m.transactionId === mealId);
                    if (index !== -1) {
                        this.meals[index] = updatedMeal;
                    }
                } else {
                    throw new Error('Server not available');
                }
            } catch (serverError) {
                console.log('Server not available, updating locally');
                // Fallback to local update
                const index = this.meals.findIndex(m => m.transactionId === mealId);
                if (index !== -1) {
                    this.meals[index] = {
                        ...this.meals[index],
                        ...mealData,
                        updatedAt: new Date().toISOString()
                    };
                    localStorage.setItem('meals', JSON.stringify(this.meals));
                }
            }

            this.closeEditModal();
            this.showToast('Meal updated successfully!', 'success');
            this.updateDashboard();
            this.updateMealsList();
        } catch (error) {
            console.error('Error updating meal:', error);
            this.showToast(error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async deleteMeal(mealId) {
        if (!confirm('Are you sure you want to delete this meal?')) {
            return;
        }

        try {
            this.showLoading();
            
            try {
                // Try to delete from server first
                const response = await fetch(`${this.apiBase}/meals/${mealId}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    this.meals = this.meals.filter(m => m.transactionId !== mealId);
                } else {
                    throw new Error('Server not available');
                }
            } catch (serverError) {
                console.log('Server not available, deleting locally');
                // Fallback to local deletion
                this.meals = this.meals.filter(m => m.transactionId !== mealId);
                localStorage.setItem('meals', JSON.stringify(this.meals));
            }

            this.showToast('Meal deleted successfully!', 'success');
            this.updateDashboard();
            this.updateMealsList();
        } catch (error) {
            console.error('Error deleting meal:', error);
            this.showToast(error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    updateDashboard() {
        const today = new Date().toISOString().split('T')[0];
        const todayMeals = this.meals.filter(meal => meal.date === today);

        // Calculate today's totals
        const totals = todayMeals.reduce((acc, meal) => {
            acc.calories += meal.calories;
            acc.protein += meal.protein;
            acc.carbs += meal.carbs;
            acc.fats += meal.fats;
            return acc;
        }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

        const calorieGoal = this.userProfile ? this.userProfile.dailyCalorieGoal : 2000;
        const caloriesConsumed = Math.round(totals.calories);

        // Update calorie progress
        document.getElementById('today-calories').textContent = caloriesConsumed;
        document.getElementById('calorie-goal').textContent = calorieGoal;
        document.getElementById('today-calories-display').textContent = caloriesConsumed;

        // Update progress bar
        const progressPercent = Math.min((caloriesConsumed / calorieGoal) * 100, 100);
        const progressBar = document.getElementById('calorie-progress');
        progressBar.style.width = `${progressPercent}%`;

        // Update progress bar color and status
        const remaining = calorieGoal - caloriesConsumed;
        const goalStatus = document.getElementById('goal-status');
        const remainingElement = document.getElementById('calories-remaining');

        progressBar.className = 'progress-fill';
        goalStatus.className = 'goal-status';

        if (remaining > 0) {
            remainingElement.textContent = `${remaining} calories remaining`;
            if (remaining > calorieGoal * 0.2) {
                goalStatus.textContent = 'On track';
                goalStatus.classList.add('on-track');
            } else {
                goalStatus.textContent = 'Close to goal';
                goalStatus.classList.add('close');
                progressBar.classList.add('over-goal');
            }
        } else {
            remainingElement.textContent = `${Math.abs(remaining)} calories over goal`;
            if (Math.abs(remaining) <= calorieGoal * 0.1) {
                goalStatus.textContent = 'Slightly over';
                goalStatus.classList.add('close');
                progressBar.classList.add('over-goal');
            } else {
                goalStatus.textContent = 'Over goal';
                goalStatus.classList.add('over');
                progressBar.classList.add('way-over');
            }
        }

        // Update other stats
        document.getElementById('today-protein').textContent = `${totals.protein.toFixed(1)}g`;
        document.getElementById('today-carbs').textContent = `${totals.carbs.toFixed(1)}g`;
        document.getElementById('today-fats').textContent = `${totals.fats.toFixed(1)}g`;

        // Update recent meals
        this.updateRecentMeals();

        // Update weekly chart
        this.updateWeeklyChart();
    }

    updateRecentMeals() {
        const recentMeals = this.meals
            .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
            .slice(0, 5);

        const container = document.getElementById('recent-meals-list');
        
        if (recentMeals.length === 0) {
            container.innerHTML = '<p class="no-data">No meals logged yet</p>';
            return;
        }

        container.innerHTML = recentMeals.map(meal => `
            <div class="meal-card">
                <div class="meal-header">
                    <div class="meal-title">${meal.foodName}</div>
                    <div class="meal-type">${meal.mealType}</div>
                </div>
                <div class="meal-meta">${meal.date}</div>
                <div class="meal-nutrition">
                    <div class="nutrition-item">
                        <div class="nutrition-value">${Math.round(meal.calories)}</div>
                        <div class="nutrition-label">cal</div>
                    </div>
                    <div class="nutrition-item">
                        <div class="nutrition-value">${meal.protein.toFixed(1)}</div>
                        <div class="nutrition-label">protein</div>
                    </div>
                    <div class="nutrition-item">
                        <div class="nutrition-value">${meal.carbs.toFixed(1)}</div>
                        <div class="nutrition-label">carbs</div>
                    </div>
                    <div class="nutrition-item">
                        <div class="nutrition-value">${meal.fats.toFixed(1)}</div>
                        <div class="nutrition-label">fats</div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateWeeklyChart() {
        const ctx = document.getElementById('weekly-chart');
        if (!ctx) return;

        // Get last 7 days of data
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            last7Days.push(date.toISOString().split('T')[0]);
        }

        const weeklyData = last7Days.map(date => {
            const dayMeals = this.meals.filter(meal => meal.date === date);
            return dayMeals.reduce((total, meal) => total + meal.calories, 0);
        });

        const labels = last7Days.map(date => {
            const d = new Date(date);
            return d.toLocaleDateString('en-US', { weekday: 'short' });
        });

        if (this.charts.weekly) {
            this.charts.weekly.destroy();
        }

        this.charts.weekly = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Daily Calories',
                    data: weeklyData,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    updateMealsList() {
        const filterDate = document.getElementById('filter-date').value;
        const filterMealType = document.getElementById('filter-meal-type').value;
        const filterSearch = document.getElementById('filter-search').value.toLowerCase();

        let filteredMeals = this.meals;

        if (filterDate) {
            filteredMeals = filteredMeals.filter(meal => meal.date === filterDate);
        }

        if (filterMealType) {
            filteredMeals = filteredMeals.filter(meal => meal.mealType === filterMealType);
        }

        if (filterSearch) {
            filteredMeals = filteredMeals.filter(meal => 
                meal.foodName.toLowerCase().includes(filterSearch)
            );
        }

        const container = document.getElementById('meals-list');
        const noMealsDiv = document.getElementById('no-meals');

        if (filteredMeals.length === 0) {
            container.style.display = 'none';
            noMealsDiv.style.display = 'block';
            return;
        }

        container.style.display = 'grid';
        noMealsDiv.style.display = 'none';

        // Sort by date (newest first)
        filteredMeals.sort((a, b) => new Date(b.date) - new Date(a.date));

        container.innerHTML = filteredMeals.map(meal => `
            <div class="meal-card">
                <div class="meal-header">
                    <div class="meal-title">${meal.foodName}</div>
                    <div class="meal-type">${meal.mealType}</div>
                </div>
                <div class="meal-meta">${meal.date} • ID: ${meal.transactionId}</div>
                <div class="meal-nutrition">
                    <div class="nutrition-item">
                        <div class="nutrition-value">${Math.round(meal.calories)}</div>
                        <div class="nutrition-label">calories</div>
                    </div>
                    <div class="nutrition-item">
                        <div class="nutrition-value">${meal.protein.toFixed(1)}g</div>
                        <div class="nutrition-label">protein</div>
                    </div>
                    <div class="nutrition-item">
                        <div class="nutrition-value">${meal.carbs.toFixed(1)}g</div>
                        <div class="nutrition-label">carbs</div>
                    </div>
                    <div class="nutrition-item">
                        <div class="nutrition-value">${meal.fats.toFixed(1)}g</div>
                        <div class="nutrition-label">fats</div>
                    </div>
                </div>
                <div class="meal-actions">
                    <button class="btn btn-secondary btn-small" onclick="app.editMeal('${meal.transactionId}')">
                        Edit
                    </button>
                    <button class="btn btn-danger btn-small" onclick="app.deleteMeal('${meal.transactionId}')">
                        Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    editMeal(mealId) {
        const meal = this.meals.find(m => m.transactionId === mealId);
        if (!meal) return;

        // Populate edit form
        document.getElementById('edit-meal-id').value = meal.transactionId;
        document.getElementById('edit-food-name').value = meal.foodName;
        document.getElementById('edit-calories').value = meal.calories;
        document.getElementById('edit-protein').value = meal.protein;
        document.getElementById('edit-carbs').value = meal.carbs;
        document.getElementById('edit-fats').value = meal.fats;
        document.getElementById('edit-date').value = meal.date;
        document.getElementById('edit-meal-type').value = meal.mealType;

        // Show modal
        document.getElementById('edit-modal').classList.add('show');
    }

    closeEditModal() {
        document.getElementById('edit-modal').classList.remove('show');
        // Clear any validation errors
        document.querySelectorAll('.form-error').forEach(error => {
            error.textContent = '';
        });
        document.querySelectorAll('.error').forEach(field => {
            field.classList.remove('error');
        });
    }

    async loadStatistics() {
        try {
            const startDate = document.getElementById('stats-start-date').value;
            const endDate = document.getElementById('stats-end-date').value;
            
            let stats;
            
            try {
                // Try to load from server first
                const params = new URLSearchParams();
                if (startDate) params.append('startDate', startDate);
                if (endDate) params.append('endDate', endDate);

                const response = await fetch(`${this.apiBase}/statistics?${params}`);
                if (response.ok) {
                    stats = await response.json();
                } else {
                    throw new Error('Server not available');
                }
            } catch (serverError) {
                console.log('Server not available, calculating statistics locally');
                // Calculate statistics locally
                stats = this.calculateLocalStatistics(startDate, endDate);
            }

            this.updateStatisticsDisplay(stats);
        } catch (error) {
            console.error('Error loading statistics:', error);
            this.showToast('Failed to load statistics', 'error');
        }
    }

    calculateLocalStatistics(startDate, endDate) {
        let filteredMeals = this.meals;
        
        if (startDate) {
            filteredMeals = filteredMeals.filter(meal => meal.date >= startDate);
        }
        
        if (endDate) {
            filteredMeals = filteredMeals.filter(meal => meal.date <= endDate);
        }
        
        const stats = {
            totalMeals: filteredMeals.length,
            totalCalories: 0,
            totalProtein: 0,
            totalCarbs: 0,
            totalFats: 0,
            averageCalories: 0,
            mealTypeBreakdown: {},
            dailyTotals: {},
            userProfile: this.userProfile
        };
        
        filteredMeals.forEach(meal => {
            stats.totalCalories += meal.calories;
            stats.totalProtein += meal.protein;
            stats.totalCarbs += meal.carbs;
            stats.totalFats += meal.fats;
            
            // Meal type breakdown
            if (!stats.mealTypeBreakdown[meal.mealType]) {
                stats.mealTypeBreakdown[meal.mealType] = {
                    count: 0,
                    calories: 0
                };
            }
            stats.mealTypeBreakdown[meal.mealType].count++;
            stats.mealTypeBreakdown[meal.mealType].calories += meal.calories;
            
            // Daily totals with calorie goals
            if (!stats.dailyTotals[meal.date]) {
                stats.dailyTotals[meal.date] = {
                    calories: 0,
                    protein: 0,
                    carbs: 0,
                    fats: 0,
                    meals: 0,
                    calorieGoal: this.userProfile ? this.userProfile.dailyCalorieGoal : 2000,
                    goalProgress: 0
                };
            }
            stats.dailyTotals[meal.date].calories += meal.calories;
            stats.dailyTotals[meal.date].protein += meal.protein;
            stats.dailyTotals[meal.date].carbs += meal.carbs;
            stats.dailyTotals[meal.date].fats += meal.fats;
            stats.dailyTotals[meal.date].meals++;
        });
        
        // Calculate goal progress for each day
        Object.keys(stats.dailyTotals).forEach(date => {
            const dayData = stats.dailyTotals[date];
            dayData.goalProgress = this.userProfile ? (dayData.calories / this.userProfile.dailyCalorieGoal) * 100 : 0;
        });
        
        const uniqueDays = Object.keys(stats.dailyTotals).length;
        stats.averageCalories = uniqueDays > 0 ? stats.totalCalories / uniqueDays : 0;
        
        return stats;
    }

    updateStatisticsDisplay(stats) {
        // Update overall totals
        document.getElementById('total-calories').textContent = Math.round(stats.totalCalories);
        document.getElementById('avg-calories').textContent = Math.round(stats.averageCalories);
        document.getElementById('total-meals').textContent = stats.totalMeals;

        // Update charts
        this.updateMacrosChart(stats);
        this.updateMealTypeChart(stats);
        this.updateTrendsChart(stats);
    }

    updateMacrosChart(stats) {
        const ctx = document.getElementById('macros-chart');
        if (!ctx) return;

        if (this.charts.macros) {
            this.charts.macros.destroy();
        }

        this.charts.macros = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Protein', 'Carbs', 'Fats'],
                datasets: [{
                    data: [stats.totalProtein, stats.totalCarbs, stats.totalFats],
                    backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    updateMealTypeChart(stats) {
        const ctx = document.getElementById('meal-type-chart');
        if (!ctx) return;

        if (this.charts.mealType) {
            this.charts.mealType.destroy();
        }

        const mealTypes = Object.keys(stats.mealTypeBreakdown);
        const counts = Object.values(stats.mealTypeBreakdown).map(item => item.count);

        this.charts.mealType = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: mealTypes,
                datasets: [{
                    label: 'Number of Meals',
                    data: counts,
                    backgroundColor: '#667eea',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    updateTrendsChart(stats) {
        const ctx = document.getElementById('trends-chart');
        if (!ctx) return;

        if (this.charts.trends) {
            this.charts.trends.destroy();
        }

        const dates = Object.keys(stats.dailyTotals).sort();
        const calories = dates.map(date => stats.dailyTotals[date].calories);

        this.charts.trends = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates.map(date => new Date(date).toLocaleDateString()),
                datasets: [{
                    label: 'Daily Calories',
                    data: calories,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span>${message}</span>
            </div>
        `;

        container.appendChild(toast);

        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    showLoading() {
        document.getElementById('loading').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loading').style.display = 'none';
    }

    generateId() {
        return Math.random().toString(36).substring(2, 10);
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Global functions for button onclick handlers
function switchTab(tabName) {
    if (window.app) {
        window.app.switchTab(tabName);
    }
}

function loadStatistics() {
    if (window.app) {
        window.app.loadStatistics();
    }
}

function closeEditModal() {
    if (window.app) {
        window.app.closeEditModal();
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new NutritionTrackerApp();
});

// Handle browser back/forward
window.addEventListener('popstate', (e) => {
    // Could implement URL-based routing here if needed
});