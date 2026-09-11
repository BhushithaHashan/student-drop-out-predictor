# Student Dropout Prediction System

A full-stack machine learning application that predicts a student's academic outcome as **Dropout**, **Enrolled**, or **Graduate** using academic, demographic, application, and socio-economic information.

The project uses the **Predict Students' Dropout and Academic Success** dataset from the UCI Machine Learning Repository. The dataset contains 4,424 student records, 36 input features, and a three-class target.

---

## Project Overview

The system consists of:

* **Machine Learning model** — Random Forest classifier
* **Feature engineering** — five additional derived features
* **Preprocessing pipeline** — categorical encoding and numerical scaling
* **Backend API** — FastAPI
* **Frontend** — HTML, CSS and JavaScript
* **Saved model artifacts** — trained model and fitted preprocessing pipeline

The application accepts a student's information through the frontend and sends it to the FastAPI backend. The backend performs the same feature engineering and preprocessing used during model development before generating the prediction.

### Prediction Classes

The model predicts one of three outcomes:

* **Dropout**
* **Enrolled**
* **Graduate**

The API also returns the model's class probability estimates.

---

## System Architecture

```text
                    ┌──────────────────────┐
                    │      Frontend        │
                    │   HTML / CSS / JS    │
                    └──────────┬───────────┘
                               │
                         POST /predict
                               │
                               ▼
                    ┌──────────────────────┐
                    │      FastAPI         │
                    │      Backend         │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Feature Engineering  │
                    │      5 features       │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Saved Preprocessor   │
                    │ OneHotEncoder        │
                    │ StandardScaler       │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   Random Forest      │
                    │      Classifier       │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Prediction +         │
                    │ Probabilities        │
                    └──────────────────────┘
```

---

## Dataset

**Source:** UCI Machine Learning Repository

**Dataset:** Predict Students' Dropout and Academic Success

**Dataset ID:** 697

**Records:** 4,424 students

**Original features:** 36

**Target:** 3 classes

* Dropout
* Enrolled
* Graduate

The dataset contains information about student demographics, application history, previous qualifications, admission information, academic performance during the first and second semesters, and socio-economic indicators.

### Prediction Point

This project defines the prediction point as **after the second semester**.

Therefore, first- and second-semester academic performance variables are valid input information for this project rather than data leakage.

The target represents the student's eventual academic outcome.

---

## Machine Learning Pipeline

The machine learning workflow was:

```text
Raw Dataset
     │
     ▼
Exploratory Data Analysis
     │
     ▼
Data Validation
     │
     ▼
Feature Engineering
     │
     ▼
Train / Test Split
     │
     ▼
Preprocessing
     │
     ▼
Model Selection
     │
     ▼
Random Forest Training
     │
     ▼
Model Evaluation
     │
     ▼
Save Model + Preprocessor
```

---

## Data Split

The dataset was divided into training and testing sets using an **80/20 split**.

Stratification was used to preserve the class distribution between the training and testing sets.

```python
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)
```

The original feature matrix and target were separated before splitting:

```python
X = dataset.data.features
y = dataset.data.targets["Target"]
```

---

## Feature Engineering

Five additional features were created from the original academic and financial variables.

### 1. Semester 1 Approval Rate

Measures the proportion of enrolled curricular units that were successfully approved during the first semester.

```text
Sem1_approval_rate =
    1st semester approved units
    ───────────────────────────────
    1st semester enrolled units
```

If no units were enrolled, the value is set to `0`.

---

### 2. Semester 2 Approval Rate

Measures the proportion of enrolled curricular units that were successfully approved during the second semester.

```text
Sem2_approval_rate =
    2nd semester approved units
    ───────────────────────────────
    2nd semester enrolled units
```

If no units were enrolled, the value is set to `0`.

---

### 3. Grade Change

Measures the change in average grade between the two semesters.

```text
Grade_change =
    2nd semester grade - 1st semester grade
```

A positive value indicates improvement, while a negative value indicates a decline.

---

### 4. Financial Stress

A binary feature combining two financial indicators:

```text
Financial_stress = 1
if:
    Debtor = 1
    AND
    Tuition fees up to date = 0
```

Otherwise:

```text
Financial_stress = 0
```

---

### 5. Approval Rate Change

Measures the change in academic approval rate between semesters.

```text
Approval_rate_change =
    Sem2_approval_rate - Sem1_approval_rate
```

---

## Final Feature Set

The model receives:

```text
36 original features
+
5 engineered features
----------------------
41 final features
```

The five engineered features are generated by the backend at prediction time.

They are **not expected from the frontend**.

---

## Preprocessing

Different types of input variables require different preprocessing.

### Categorical Features

Categorical variables are processed using:

```text
OneHotEncoder(handle_unknown="ignore")
```

This converts categorical values into numerical indicator features.

### Numerical Features

Numerical variables are processed using:

```text
StandardScaler
```

### Binary Features

Binary variables are passed through without additional transformation.

The preprocessing was implemented using a `ColumnTransformer`.

Most importantly, the **fitted preprocessing pipeline is saved and reused during prediction**.

The backend does not recreate or refit the preprocessing pipeline for each request.

---

## Machine Learning Model

The final model is a:

```text
RandomForestClassifier
```

The trained model is stored at:

```text
models/student_dropout_model.joblib
```

The fitted preprocessing pipeline is stored at:

```text
models/student_dropout_preprocessor.joblib
```

Both artifacts are loaded by the backend when the application starts.

---

## Backend

The backend is implemented using **FastAPI**.

### Main Components

```text
backend/
├── feature_engineering.py
├── model_service.py
├── main.py
└── requirements.txt
```

### `feature_engineering.py`

Responsible for:

* Validating the required original features
* Creating the five engineered features
* Returning the final 41-column feature set

### `model_service.py`

Responsible for:

* Loading the trained model
* Loading the fitted preprocessor
* Transforming incoming features
* Generating predictions
* Returning class probabilities

### `main.py`

Responsible for:

* Creating the FastAPI application
* Defining API endpoints
* Validating incoming requests using Pydantic
* Calling the feature-engineering pipeline
* Calling the model service
* Returning prediction results

---

## API Endpoints

### `GET /`

Returns basic API information.

### `GET /health`

Checks whether the ML model and preprocessing pipeline were loaded successfully.

Example:

```json
{
  "status": "ok",
  "model_loaded": true
}
```

### `POST /predict`

Accepts the 36 original dataset features and returns the prediction.

The five engineered features are calculated internally by the backend.

Example response:

```json
{
  "prediction": "Dropout",
  "probabilities": {
    "Dropout": 0.78,
    "Enrolled": 0.055,
    "Graduate": 0.165
  }
}
```

The probability values represent the Random Forest's class probability estimates for that prediction.

---

## Running the Backend

Create and activate the virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r backend/requirements.txt
```

Start the FastAPI application:

```bash
cd backend
uvicorn main:app --reload
```

The API will be available at:

```text
http://127.0.0.1:8000
```

Swagger API documentation:

```text
http://127.0.0.1:8000/docs
```

Health check:

```text
http://127.0.0.1:8000/health
```

---

## Running the Frontend

From the project root:

```bash
python3 -m http.server 5500 -d frontend
```

Then open:

```text
http://127.0.0.1:5500
```

The frontend sends requests to:

```text
http://127.0.0.1:8000/predict
```

---

## Project Structure

```text
.
├── backend
│   ├── feature_engineering.py
│   ├── main.py
│   ├── model_service.py
│   └── requirements.txt
│
├── frontend
│   ├── index.html
│   ├── script.js
│   └── style.css
│
├── models
│   ├── student_dropout_model.joblib
│   └── student_dropout_preprocessor.joblib
│
├── notebooks
│   ├── EDA.ipynb
│   ├── EDA+FeatureEngineering.ipynb
│   ├── EDA+FeatureEngineering+Preprossesing.ipynb
│   ├── EDA+FeatureEngineering+Preprossesing+Model_selection.ipynb
│   └── EDA+Preprosessing.ipynb
│
├── report
│   └── student-drop-out-predictor-report.pdf
│
└── README.md
```

---

## Frontend

The frontend provides a user-friendly interface for entering the student's information.

Instead of requiring users to enter dataset codes manually, categorical fields are presented using human-readable labels.

For example:

```text
Gender

○ Female
○ Male
```

The frontend converts the selected option into the numerical value expected by the ML model before sending the request.

The frontend does **not** calculate the engineered features.

The frontend sends only the original 36 features:

```text
Frontend
   │
   │ 36 original features
   ▼
FastAPI
   │
   │ + 5 engineered features
   ▼
41 model features
```

---

## Example API Request

```json
{
  "Marital Status": 1,
  "Application mode": 17,
  "Application order": 5,
  "Course": 171,
  "Daytime/evening attendance": 1,
  "Previous qualification": 1,
  "Previous qualification (grade)": 122.0,
  "Nacionality": 1,
  "Mother's qualification": 19,
  "Father's qualification": 12,
  "Mother's occupation": 5,
  "Father's occupation": 9,
  "Admission grade": 127.3,
  "Displaced": 1,
  "Educational special needs": 0,
  "Debtor": 0,
  "Tuition fees up to date": 1,
  "Gender": 1,
  "Scholarship holder": 0,
  "Age at enrollment": 20,
  "International": 0,
  "Curricular units 1st sem (credited)": 0,
  "Curricular units 1st sem (enrolled)": 0,
  "Curricular units 1st sem (evaluations)": 0,
  "Curricular units 1st sem (approved)": 0,
  "Curricular units 1st sem (grade)": 0,
  "Curricular units 1st sem (without evaluations)": 0,
  "Curricular units 2nd sem (credited)": 0,
  "Curricular units 2nd sem (enrolled)": 0,
  "Curricular units 2nd sem (evaluations)": 0,
  "Curricular units 2nd sem (approved)": 0,
  "Curricular units 2nd sem (grade)": 0,
  "Curricular units 2nd sem (without evaluations)": 0,
  "Unemployment rate": 10.8,
  "Inflation rate": 1.4,
  "GDP": 1.74
}
```

---

## Example Response

```json
{
  "prediction": "Dropout",
  "probabilities": {
    "Dropout": 0.78,
    "Enrolled": 0.055,
    "Graduate": 0.165
  }
}
```

---

## Model Artifact Compatibility

The saved model artifacts were created using:

```text
scikit-learn 1.6.1
```

The backend environment should therefore use the same scikit-learn version when loading the serialized model and preprocessing pipeline.

---

## Exploratory Data Analysis

The project included analysis of:

* Dataset dimensions
* Data types
* Missing values
* Duplicate records
* Descriptive statistics
* Categorical distributions
* Binary feature distributions
* Logical consistency checks
* Grade ranges
* Age ranges
* Negative count checks
* Distribution plots
* IQR-based outlier analysis

### Outlier Handling

IQR analysis was used to identify statistically unusual observations.

An observation being classified as an IQR outlier does **not automatically mean that the observation is invalid**.

Values were therefore not removed solely because they were outside the IQR boundaries. A value should only be removed or modified when there is evidence that it represents an actual data error.

---

## Limitations

* The model is trained on data from a specific higher-education institution and may not generalize to every institution.
* The returned probabilities are model probability estimates and should not be interpreted as guaranteed real-world probabilities.
* Prediction quality depends on the quality and validity of the supplied student information.
* The system is intended as a predictive/decision-support application rather than a replacement for academic advisors or institutional decision-making.

---

## Technologies

### Machine Learning

* Python
* pandas
* NumPy
* scikit-learn
* Random Forest
* joblib

### Backend

* FastAPI
* Pydantic
* Uvicorn

### Frontend

* HTML5
* CSS3
* JavaScript

### Development

* Jupyter Notebook
* Git
* UCI Machine Learning Repository

---

## Dataset Citation

Realinho, V., Vieira Martins, M., Machado, J., & Baptista, L. (2021).

**Predict Students' Dropout and Academic Success.**

UCI Machine Learning Repository.

DOI: `10.24432/C5MC89`

The dataset is distributed under the **Creative Commons Attribution 4.0 International (CC BY 4.0)** license.

---

