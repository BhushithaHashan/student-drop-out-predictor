import pandas as pd
import numpy as np


ORIGINAL_FEATURES = [
    "Marital Status",
    "Application mode",
    "Application order",
    "Course",
    "Daytime/evening attendance",
    "Previous qualification",
    "Previous qualification (grade)",
    "Nacionality",
    "Mother's qualification",
    "Father's qualification",
    "Mother's occupation",
    "Father's occupation",
    "Admission grade",
    "Displaced",
    "Educational special needs",
    "Debtor",
    "Tuition fees up to date",
    "Gender",
    "Scholarship holder",
    "Age at enrollment",
    "International",
    "Curricular units 1st sem (credited)",
    "Curricular units 1st sem (enrolled)",
    "Curricular units 1st sem (evaluations)",
    "Curricular units 1st sem (approved)",
    "Curricular units 1st sem (grade)",
    "Curricular units 1st sem (without evaluations)",
    "Curricular units 2nd sem (credited)",
    "Curricular units 2nd sem (enrolled)",
    "Curricular units 2nd sem (evaluations)",
    "Curricular units 2nd sem (approved)",
    "Curricular units 2nd sem (grade)",
    "Curricular units 2nd sem (without evaluations)",
    "Unemployment rate",
    "Inflation rate",
    "GDP",
]


ENGINEERED_FEATURES = [
    "Sem1_approval_rate",
    "Sem2_approval_rate",
    "Grade_change",
    "Financial_stress",
    "Approval_rate_change",
]


def create_engineered_features(data: dict) -> pd.DataFrame:
    """
    Convert the raw student data into the exact 41-column
    DataFrame expected by the saved preprocessor.

    The five engineered features reproduce the notebook logic.
    """

    # Create one-row DataFrame from the incoming student data
    df = pd.DataFrame([data])

    # Check that every original dataset feature is present
    missing_columns = [
        column
        for column in ORIGINAL_FEATURES
        if column not in df.columns
    ]

    if missing_columns:
        raise ValueError(
            f"Missing required features: {missing_columns}"
        )

    # ---------------------------------------------------------
    # 1. Semester 1 approval rate
    # ---------------------------------------------------------

    df["Sem1_approval_rate"] = np.where(
        df["Curricular units 1st sem (enrolled)"] > 0,
        df["Curricular units 1st sem (approved)"]
        / df["Curricular units 1st sem (enrolled)"],
        0,
    )

    # ---------------------------------------------------------
    # 2. Semester 2 approval rate
    # ---------------------------------------------------------

    df["Sem2_approval_rate"] = np.where(
        df["Curricular units 2nd sem (enrolled)"] > 0,
        df["Curricular units 2nd sem (approved)"]
        / df["Curricular units 2nd sem (enrolled)"],
        0,
    )

    # ---------------------------------------------------------
    # 3. Grade change
    # ---------------------------------------------------------

    df["Grade_change"] = (
        df["Curricular units 2nd sem (grade)"]
        - df["Curricular units 1st sem (grade)"]
    )

    # ---------------------------------------------------------
    # 4. Financial stress
    # ---------------------------------------------------------

    df["Financial_stress"] = (
        (df["Debtor"] == 1)
        & (df["Tuition fees up to date"] == 0)
    ).astype(int)

    # ---------------------------------------------------------
    # 5. Approval rate change
    # ---------------------------------------------------------

    df["Approval_rate_change"] = (
        df["Sem2_approval_rate"]
        - df["Sem1_approval_rate"]
    )

    # Final safety check
    expected_columns = ORIGINAL_FEATURES + ENGINEERED_FEATURES

    missing_final = [
        column
        for column in expected_columns
        if column not in df.columns
    ]

    if missing_final:
        raise ValueError(
            f"Missing final features: {missing_final}"
        )

    # Return exactly the 41 columns expected by the preprocessor
    return df[expected_columns]
