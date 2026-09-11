// ============================================================
// API CONFIGURATION
// ============================================================

const API_URL = "http://127.0.0.1:8000";


// ============================================================
// DOM
// ============================================================

const form =
    document.getElementById("prediction-form");

const predictButton =
    document.getElementById("predict-button");

const resultSection =
    document.getElementById("result-section");

const predictionValue =
    document.getElementById("prediction-value");

const predictionCard =
    document.getElementById("prediction-card");

const errorMessage =
    document.getElementById("error-message");

const errorText =
    document.getElementById("error-text");

const newPredictionButton =
    document.getElementById("new-prediction");


// Probability labels

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


// ============================================================
// SUBMIT
// ============================================================

form.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        hideError();


        // Browser validation

        if (!form.checkValidity()) {

            form.reportValidity();

            return;
        }


        try {

            setLoading(true);


            // ----------------------------------------------
            // Build the 36-feature dataset JSON
            // ----------------------------------------------

            const studentData =
                collectStudentData();


            console.log(
                "Student JSON:",
                studentData
            );


            // ----------------------------------------------
            // Send to FastAPI
            // ----------------------------------------------

            const response =
                await fetch(
                    `${API_URL}/predict`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                studentData
                            )
                    }
                );


            const result =
                await response.json();


            // ----------------------------------------------
            // Handle backend errors
            // ----------------------------------------------

            if (!response.ok) {

                throw new Error(
                    result.detail ||
                    "Prediction request failed."
                );
            }


            // ----------------------------------------------
            // Display result
            // ----------------------------------------------

            displayResult(result);

        } catch (error) {

            console.error(
                "Prediction error:",
                error
            );

            showError(
                readableError(error)
            );

        } finally {

            setLoading(false);
        }
    }
);


// ============================================================
// COLLECT 36 ORIGINAL FEATURES
// ============================================================

function collectStudentData() {

    const data = {};

    const fields =
        form.querySelectorAll(
            "[data-key]"
        );


    fields.forEach(
        (field) => {

            const key =
                field.dataset.key;

            const rawValue =
                field.value.trim();


            if (rawValue === "") {

                throw new Error(
                    `${key} is required.`
                );
            }


            const value =
                Number(rawValue);


            if (!Number.isFinite(value)) {

                throw new Error(
                    `${key} must be a valid number.`
                );
            }


            data[key] =
                value;
        }
    );


    return data;
}


// ============================================================
// DISPLAY RESULT
// ============================================================

function displayResult(result) {

    const prediction =
        result.prediction;

    const probabilities =
        result.probabilities || {};


    // ----------------------------------------------
    // Main prediction
    // ----------------------------------------------

    predictionValue.textContent =
        prediction;


    // ----------------------------------------------
    // Prediction styling
    // ----------------------------------------------

    predictionCard.classList.remove(
        "prediction-dropout",
        "prediction-enrolled",
        "prediction-graduate"
    );


    if (prediction === "Dropout") {

        predictionCard.classList.add(
            "prediction-dropout"
        );

        predictionValue.style.color =
            "var(--red)";

    } else if (
        prediction === "Enrolled"
    ) {

        predictionCard.classList.add(
            "prediction-enrolled"
        );

        predictionValue.style.color =
            "var(--orange)";

    } else if (
        prediction === "Graduate"
    ) {

        predictionCard.classList.add(
            "prediction-graduate"
        );

        predictionValue.style.color =
            "var(--green)";
    }


    // ----------------------------------------------
    // Probabilities
    // ----------------------------------------------

    const dropout =
        safeProbability(
            probabilities.Dropout
        );

    const enrolled =
        safeProbability(
            probabilities.Enrolled
        );

    const graduate =
        safeProbability(
            probabilities.Graduate
        );


    // ----------------------------------------------
    // Text
    // ----------------------------------------------

    dropoutProbability.textContent =
        percentage(dropout);

    enrolledProbability.textContent =
        percentage(enrolled);

    graduateProbability.textContent =
        percentage(graduate);


    // ----------------------------------------------
    // Bars
    // ----------------------------------------------

    requestAnimationFrame(
        () => {

            dropoutBar.style.width =
                `${dropout * 100}%`;

            enrolledBar.style.width =
                `${enrolled * 100}%`;

            graduateBar.style.width =
                `${graduate * 100}%`;
        }
    );


    // ----------------------------------------------
    // Show
    // ----------------------------------------------

    resultSection.classList.remove(
        "hidden"
    );


    resultSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


// ============================================================
// PROBABILITY SAFETY
// ============================================================

function safeProbability(value) {

    const number =
        Number(value);


    if (!Number.isFinite(number)) {

        return 0;
    }


    return Math.max(
        0,
        Math.min(
            1,
            number
        )
    );
}


// ============================================================
// FORMAT %
 // ============================================================

function percentage(value) {

    return `${(
        value * 100
    ).toFixed(1)}%`;
}


// ============================================================
// LOADING
// ============================================================

function setLoading(loading) {

    predictButton.disabled =
        loading;


    const text =
        predictButton.querySelector(
            ".button-text"
        );


    if (loading) {

        text.textContent =
            "Analysing student...";

    } else {

        text.textContent =
            "Predict Outcome";
    }
}


// ============================================================
// ERRORS
// ============================================================

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


function readableError(error) {

    const message =
        error?.message || "";


    if (
        message.includes(
            "Failed to fetch"
        )
    ) {

        return (
            "The prediction API could not be reached. " +
            "Make sure FastAPI is running on " +
            "http://127.0.0.1:8000."
        );
    }


    return (
        message ||
        "An unexpected error occurred."
    );
}


// ============================================================
// NEW PREDICTION
// ============================================================

newPredictionButton.addEventListener(
    "click",
    () => {

        form.reset();


        resultSection.classList.add(
            "hidden"
        );


        hideError();


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }
);


// ============================================================
// SIDEBAR ACTIVE SECTION
// ============================================================

const sections =
    document.querySelectorAll(
        "section[id]"
    );

const navigationSteps =
    document.querySelectorAll(
        ".step"
    );


const observer =
    new IntersectionObserver(
        (entries) => {

            entries.forEach(
                (entry) => {

                    if (!entry.isIntersecting) {
                        return;
                    }


                    navigationSteps.forEach(
                        (step) => {

                            step.classList.remove(
                                "active"
                            );
                        }
                    );


                    const activeStep =
                        document.querySelector(
                            `.step[href="#${entry.target.id}"]`
                        );


                    if (activeStep) {

                        activeStep.classList.add(
                            "active"
                        );
                    }
                }
            );

        },
        {
            rootMargin:
                "-25% 0px -65% 0px"
        }
    );


sections.forEach(
    (section) => {

        observer.observe(section);
    }
);