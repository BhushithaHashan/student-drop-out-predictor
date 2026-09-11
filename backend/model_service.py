from pathlib import Path

import joblib


# Project root:
# student-dropout-predictor/
PROJECT_ROOT = Path(__file__).resolve().parent.parent

MODEL_PATH = PROJECT_ROOT / "models" / "student_dropout_model.joblib"
PREPROCESSOR_PATH = (
    PROJECT_ROOT / "models" / "student_dropout_preprocessor.joblib"
)


class ModelService:

    def __init__(self):
        self.model = joblib.load(MODEL_PATH)
        self.preprocessor = joblib.load(PREPROCESSOR_PATH)

    def predict(self, features):

        # Apply the exact fitted preprocessing from training
        processed_features = self.preprocessor.transform(features)

        # Make prediction
        prediction = self.model.predict(processed_features)[0]

        result = {
            "prediction": str(prediction)
        }

        # RandomForestClassifier supports predict_proba()
        if hasattr(self.model, "predict_proba"):

            probabilities = self.model.predict_proba(
                processed_features
            )[0]

            result["probabilities"] = {
                str(class_name): float(probability)
                for class_name, probability in zip(
                    self.model.classes_,
                    probabilities,
                )
            }

        return result
