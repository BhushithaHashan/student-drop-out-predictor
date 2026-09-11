// =========================================================
// CONFIGURATION
// =========================================================

const API_URL = "http://127.0.0.1:8000";


// =========================================================
// DOM ELEMENTS
// =========================================================

const form = document.getElementById("prediction-form");

const predictButton =
    document.getElementById("predict-button");

const errorMessage =
    document.getElementById("error-message");

const errorText =
    document.getElementById("error-text");

const resultSection =
    document.getElementById("result-section");

const predictionValue =
    document.getElementById("prediction-value");

const newPredictionButton =
    document.getElementById("new-prediction");


// Probability text elements

const dropoutProbability =
    document.getElementById("dropout-probability");

const enrolledProbability =
    document.getElementById("enrolled-probability");

const graduateProbability =
    document.getElementById("graduate-probability");


// Probability bars

const dropoutBar =
    document.getElementById("dropout-bar");

const enrolledBar =
    document.getElementById("enrolled-bar");

const graduateBar =
    document.getElementById("graduate-bar");


// =========================================================
// INPUT TYPES
// =========================================================
//
// Every input is either:
//   - number
//   - binary
//
// All values are converted to JavaScript Numbers before
// being sent to FastAPI.
//
// The backend creates the five engineered features.
// =========================================================

const binaryFields = new Set([
    "Displaced",
    "Educational special needs",
    "Debtor",
    "Tuition fees up to date",
    "Gender",
    "Scholarship holder",
    "International"
]);


// =========================================================
// FORM SUBMISSION
// =========================================================

form.addEventListener("submit", async (event) => {

    event.preventDefault();

    hideError();

    // Browser-level validation

    if (!form.checkValidity()) {

        form.reportValidity();

        return;
    }


    try {

        setLoading(true);

        const studentData =
            collectStudentData();


        console.log(
            "Sending student data:",
            studentData
        );


        const response = await fetch(
            `${API_URL}/predict`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(studentData)
            }
        );


        const responseData =
            await response.json();


        // -------------------------------------------------
        // Backend returned an HTTP error
        // -------------------------------------------------

        if (!response.ok) {

            const message =
                responseData.detail ||
                "The prediction request failed.";

            throw new Error(message);
        }


        // -------------------------------------------------
        // Successful prediction
        // -------------------------------------------------

        displayPrediction(responseData);

    } catch (error) {

        console.error(
            "Prediction error:",
            error
        );

        showError(
            getReadableError(error)
        );

    } finally {

        setLoading(false);
    }
});


// =========================================================
// COLLECT STUDENT DATA
// =========================================================

function collectStudentData() {

    const data = {};

    const fields =
        form.querySelectorAll(
            "[data-key]"
        );


    fields.forEach((field) => {

        const key =
            field.dataset.key;

        const rawValue =
            field.value.trim();


        if (rawValue === "") {

            throw new Error(
                `${key} is required.`
            );
        }


        const numericValue =
            Number(rawValue);


        if (!Number.isFinite(numericValue)) {

            throw new Error(
                `${key} must contain a valid number.`
            );
        }


        // Binary fields are integers.

        if (binaryFields.has(key)) {

            data[key] =
                Math.round(numericValue);

        } else {

            data[key] =
                numericValue;
        }

    });


    return data;
}


// =========================================================
// DISPLAY PREDICTION
// =========================================================

function displayPrediction(result) {

    const prediction =
        result.prediction;


    const probabilities =
        result.probabilities || {};


    // -----------------------------------------------------
    // Prediction label
    // -----------------------------------------------------

    predictionValue.textContent =
        prediction;


    // -----------------------------------------------------
    // Probability values
    // -----------------------------------------------------

    const dropout =
        getProbability(
            probabilities,
            "Dropout"
        );

    const enrolled =
        getProbability(
            probabilities,
            "Enrolled"
        );

    const graduate =
        getProbability(
            probabilities,
            "Graduate"
        );


    // -----------------------------------------------------
    // Text
    // -----------------------------------------------------

    dropoutProbability.textContent =
        formatProbability(dropout);

    enrolledProbability.textContent =
        formatProbability(enrolled);

    graduateProbability.textContent =
        formatProbability(graduate);


    // -----------------------------------------------------
    // Progress bars
    // -----------------------------------------------------

    requestAnimationFrame(() => {

        dropoutBar.style.width =
            `${dropout * 100}%`;

        enrolledBar.style.width =
            `${enrolled * 100}%`;

        graduateBar.style.width =
            `${graduate * 100}%`;
    });


    // -----------------------------------------------------
    // Prediction colour/state
    // -----------------------------------------------------

    updatePredictionStyle(
        prediction
    );


    // -----------------------------------------------------
    // Show result
    // -----------------------------------------------------

    resultSection.classList.remove(
        "hidden"
    );


    // Scroll to result

    resultSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


// =========================================================
// GET PROBABILITY
// =========================================================

function getProbability(
    probabilities,
    className
) {

    const value =
        Number(
            probabilities[className] ?? 0
        );


    if (!Number.isFinite(value)) {

        return 0;
    }


    // Keep the value between 0 and 1.

    return Math.max(
        0,
        Math.min(
            1,
            value
        )
    );
}


// =========================================================
// FORMAT PROBABILITY
// =========================================================

function formatProbability(value) {

    return `${(
        value * 100
    ).toFixed(1)}%`;
}


// =========================================================
// PREDICTION STYLE
// =========================================================

function updatePredictionStyle(
    prediction
) {

    predictionValue.style.color =
        "";


    if (prediction === "Dropout") {

        predictionValue.style.color =
            "var(--danger)";

    } else if (prediction === "Enrolled") {

        predictionValue.style.color =
            "var(--warning)";

    } else if (prediction === "Graduate") {

        predictionValue.style.color =
            "var(--success)";
    }
}


// =========================================================
// LOADING STATE
// =========================================================

function setLoading(isLoading) {

    predictButton.disabled =
        isLoading;


    const buttonText =
        predictButton.querySelector(
            ".button-text"
        );


    if (isLoading) {

        buttonText.textContent =
            "Analysing...";

    } else {

        buttonText.textContent =
            "Predict Outcome";
    }
}


// =========================================================
// ERROR HANDLING
// =========================================================

function showError(message) {

    errorText.textContent =
        message;

    errorMessage.classList.remove(
        "hidden"
    );


    errorMessage.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}


function hideError() {

    errorMessage.classList.add(
        "hidden"
    );

    errorText.textContent =
        "";
}


// =========================================================
// READABLE ERROR MESSAGE
// =========================================================

function getReadableError(error) {

    const message =
        error?.message ||
        "";


    // Backend unavailable

    if (
        message.includes(
            "Failed to fetch"
        )
    ) {

        return (
            "Could not connect to the prediction API. " +
            "Make sure the FastAPI server is running on " +
            "http://127.0.0.1:8000."
        );
    }


    return message ||
        "Something went wrong while making the prediction.";
}


// =========================================================
// NEW PREDICTION
// =========================================================

newPredictionButton.addEventListener(
    "click",
    () => {

        resultSection.classList.add(
            "hidden"
        );


        form.reset();


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }
);
