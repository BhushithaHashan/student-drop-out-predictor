from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ConfigDict

from feature_engineering import create_engineered_features
from model_service import ModelService


app = FastAPI(
    title="Student Dropout Prediction API",
    version="1.0.0",
)


# ---------------------------------------------------------
# CORS
# ---------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# Request model
# ---------------------------------------------------------
# These are the 36 ORIGINAL dataset features.
# The five engineered features are created by the backend.
# ---------------------------------------------------------

class StudentInput(BaseModel):

    model_config = ConfigDict(
        populate_by_name=True
    )

    # -------------------------
    # Categorical features
    # -------------------------

    marital_status: int = Field(alias="Marital Status")
    application_mode: int = Field(alias="Application mode")
    application_order: int = Field(alias="Application order")
    course: int = Field(alias="Course")
    daytime_evening_attendance: int = Field(
        alias="Daytime/evening attendance"
    )
    previous_qualification: int = Field(
        alias="Previous qualification"
    )
    nationality: int = Field(alias="Nacionality")
    mothers_qualification: int = Field(
        alias="Mother's qualification"
    )
    fathers_qualification: int = Field(
        alias="Father's qualification"
    )
    mothers_occupation: int = Field(
        alias="Mother's occupation"
    )
    fathers_occupation: int = Field(
        alias="Father's occupation"
    )

    # -------------------------
    # Numerical features
    # -------------------------

    previous_qualification_grade: float = Field(
        alias="Previous qualification (grade)"
    )
    admission_grade: float = Field(
        alias="Admission grade"
    )
    age_at_enrollment: int = Field(
        alias="Age at enrollment"
    )

    curricular_units_1st_sem_credited: int = Field(
        alias="Curricular units 1st sem (credited)"
    )
    curricular_units_1st_sem_enrolled: int = Field(
        alias="Curricular units 1st sem (enrolled)"
    )
    curricular_units_1st_sem_evaluations: int = Field(
        alias="Curricular units 1st sem (evaluations)"
    )
    curricular_units_1st_sem_approved: int = Field(
        alias="Curricular units 1st sem (approved)"
    )
    curricular_units_1st_sem_grade: float = Field(
        alias="Curricular units 1st sem (grade)"
    )
    curricular_units_1st_sem_without_evaluations: int = Field(
        alias="Curricular units 1st sem (without evaluations)"
    )

    curricular_units_2nd_sem_credited: int = Field(
        alias="Curricular units 2nd sem (credited)"
    )
    curricular_units_2nd_sem_enrolled: int = Field(
        alias="Curricular units 2nd sem (enrolled)"
    )
    curricular_units_2nd_sem_evaluations: int = Field(
        alias="Curricular units 2nd sem (evaluations)"
    )
    curricular_units_2nd_sem_approved: int = Field(
        alias="Curricular units 2nd sem (approved)"
    )
    curricular_units_2nd_sem_grade: float = Field(
        alias="Curricular units 2nd sem (grade)"
    )
    curricular_units_2nd_sem_without_evaluations: int = Field(
        alias="Curricular units 2nd sem (without evaluations)"
    )

    unemployment_rate: float = Field(
        alias="Unemployment rate"
    )
    inflation_rate: float = Field(
        alias="Inflation rate"
    )
    gdp: float = Field(
        alias="GDP"
    )

    # -------------------------
    # Binary features
    # -------------------------

    displaced: int = Field(alias="Displaced")
    educational_special_needs: int = Field(
        alias="Educational special needs"
    )
    debtor: int = Field(alias="Debtor")
    tuition_fees_up_to_date: int = Field(
        alias="Tuition fees up to date"
    )
    gender: int = Field(alias="Gender")
    scholarship_holder: int = Field(
        alias="Scholarship holder"
    )
    international: int = Field(alias="International")


# ---------------------------------------------------------
# Load model and preprocessor once when the API starts
# ---------------------------------------------------------

try:
    model_service = ModelService()
except Exception as error:
    model_service = None
    model_loading_error = str(error)


# ---------------------------------------------------------
# Health check
# ---------------------------------------------------------

@app.get("/")
def root():
    return {
        "message": "Student Dropout Prediction API"
    }


@app.get("/health")
def health():

    if model_service is None:
        return {
            "status": "error",
            "model_loaded": False,
            "error": model_loading_error,
        }

    return {
        "status": "ok",
        "model_loaded": True,
    }


# ---------------------------------------------------------
# Prediction endpoint
# ---------------------------------------------------------

@app.post("/predict")
def predict(student_data: StudentInput):

    if model_service is None:
        raise HTTPException(
            status_code=500,
            detail="ML model could not be loaded.",
        )

    try:

        # -------------------------------------------------
        # Pydantic model
        #       ↓
        # Convert back to the exact dataset column names
        # -------------------------------------------------

        raw_data = student_data.model_dump(
            by_alias=True
        )

        # -------------------------------------------------
        # 36 original features
        #       ↓
        # Add 5 engineered features
        #       ↓
        # 41 features
        # -------------------------------------------------

        features = create_engineered_features(
            raw_data
        )

        # -------------------------------------------------
        # 41 features
        #       ↓
        # Saved preprocessor
        #       ↓
        # Saved Random Forest model
        # -------------------------------------------------

        result = model_service.predict(
            features
        )

        return result

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(error)}",
        )