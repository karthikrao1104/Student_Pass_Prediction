
import { useState, useEffect, useCallback } from "react";
import api from "../services/api";

function Prediction() {

    // Prediction method
    const [activeTab, setActiveTab] = useState("manual");

    // Manual entry
    const [formData, setFormData] = useState({
        attendance: "",
        study_hours: "",
        internal_marks: "",
        assignment_marks: ""
    });

    const [manualResult, setManualResult] = useState(null);

    // CSV upload
    const [file, setFile] = useState(null);
    const [csvResults, setCsvResults] = useState([]);
    const [stats, setStats] = useState(null);

    // History
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(true);

    // Pagination
    const ITEMS_PER_PAGE = 20;

    const [csvPage, setCsvPage] = useState(1);
    const [historyPage, setHistoryPage] = useState(1);

    // Common states
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Fetch history
    const fetchHistory = useCallback(async () => {
        try {
            const response = await api.get("prediction/history/");

            setHistory(response.data.history || []);
            setHistoryPage(1);

        } catch (err) {
            console.error("History error:", err);
            setError("Unable to load prediction history.");

        } finally {
            setHistoryLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    // Handle manual form changes
    const handleChange = (e) => {
        setFormData((previous) => ({
            ...previous,
            [e.target.name]: e.target.value
        }));
    };

    // Manual prediction
    const handleManualPredict = async (e) => {
        e.preventDefault();

        setLoading(true);
        setError("");
        setSuccess("");
        setManualResult(null);

        try {
            const response = await api.post(
                "prediction/predict/",
                {
                    attendance: Number(formData.attendance),
                    study_hours: Number(formData.study_hours),
                    internal_marks: Number(formData.internal_marks),
                    assignment_marks: Number(formData.assignment_marks)
                }
            );

            setManualResult(response.data);
            setSuccess("Student prediction completed successfully.");

            await fetchHistory();

        } catch (err) {
            console.error(
                "Manual prediction error:",
                err.response?.data || err
            );

            const data = err.response?.data;

            setError(
                data?.detail ||
                data?.error ||
                "Unable to predict student result."
            );

        } finally {
            setLoading(false);
        }
    };

    // Handle CSV selection
    const handleFileChange = (e) => {
        const selectedFile = e.target.files?.[0];

        setFile(selectedFile || null);
        setCsvResults([]);
        setStats(null);
        setCsvPage(1);
        setError("");
        setSuccess("");
    };

    // CSV upload and bulk prediction
    const handleCSVUpload = async () => {

        if (!file) {
            setError("Please select a CSV file.");
            return;
        }

        if (!file.name.toLowerCase().endsWith(".csv")) {
            setError("Please select a valid CSV file.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        setLoading(true);
        setError("");
        setSuccess("");
        setCsvResults([]);
        setStats(null);
        setCsvPage(1);

        try {
            const response = await api.post(
                "prediction/upload/",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data"
                    }
                }
            );

            const data = response.data;

            setCsvResults(data.results || []);

            setCsvPage(1);

            setStats({
                total: data.total_students,
                pass: data.pass_count,
                fail: data.fail_count
            });

            setSuccess(
                data.message ||
                "CSV predictions completed successfully."
            );

            await fetchHistory();

        } catch (err) {
            console.error(
                "CSV upload error:",
                err.response?.data || err
            );

            const data = err.response?.data;

            let message =
                data?.error ||
                data?.detail ||
                "CSV upload failed.";

            if (data?.missing_columns) {
                message += " Missing columns: " +
                    data.missing_columns.join(", ");
            }

            if (data?.details) {
                message += " " + JSON.stringify(data.details);
            }

            setError(message);

        } finally {
            setLoading(false);
        }
    };

    // Format date
    const formatDate = (date) => {
        if (!date) return "-";

        return new Date(date).toLocaleString();
    };

    // Clear CSV selection
    const clearCSV = () => {
        setFile(null);
        setCsvResults([]);
        setStats(null);
        setCsvPage(1);
        setError("");
        setSuccess("");
    };

    // =================================
    // CSV PAGINATION
    // =================================

    const csvTotalPages = Math.ceil(
        csvResults.length / ITEMS_PER_PAGE
    );

    const paginatedCSVResults = csvResults.slice(
        (csvPage - 1) * ITEMS_PER_PAGE,
        csvPage * ITEMS_PER_PAGE
    );

    // =================================
    // HISTORY PAGINATION
    // =================================

    const historyTotalPages = Math.ceil(
        history.length / ITEMS_PER_PAGE
    );

    const paginatedHistory = history.slice(
        (historyPage - 1) * ITEMS_PER_PAGE,
        historyPage * ITEMS_PER_PAGE
    );

    // =================================
    // PAGINATION COMPONENT
    // =================================

    const Pagination = ({
        currentPage,
        totalPages,
        onPageChange,
        totalRecords
    }) => {

        if (totalPages <= 1) return null;

        const startRecord =
            (currentPage - 1) * ITEMS_PER_PAGE + 1;

        const endRecord = Math.min(
            currentPage * ITEMS_PER_PAGE,
            totalRecords
        );

        return (
            <div className="pagination-wrapper">

                <div className="pagination-info">
                    Showing {startRecord}–{endRecord} of {totalRecords} records
                </div>

                <div className="pagination">

                    <button
                        type="button"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </button>

                    <div className="pagination-pages">

                        {Array.from(
                            { length: totalPages },
                            (_, index) => index + 1
                        ).map((page) => (

                            <button
                                type="button"
                                key={page}
                                className={
                                    currentPage === page
                                        ? "page-number active"
                                        : "page-number"
                                }
                                onClick={() => onPageChange(page)}
                            >
                                {page}
                            </button>

                        ))}

                    </div>

                    <button
                        type="button"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </button>

                </div>

            </div>
        );
    };

    return (
        <div className="prediction-page">

            <div className="prediction-container">

                {/* HEADER */}
                <div className="prediction-header">
                    <h1>Student Performance Prediction</h1>

                    <p>
                        Predict student academic performance using Machine Learning.
                    </p>
                </div>

                {/* MESSAGES */}
                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="success-message">
                        {success}
                    </div>
                )}

                {/* TABS */}
                <div className="prediction-tabs">

                    <button
                        type="button"
                        className={
                            activeTab === "manual" ? "active" : ""
                        }
                        onClick={() => {
                            setActiveTab("manual");
                            setError("");
                            setSuccess("");
                        }}
                    >
                        Manual Entry
                    </button>

                    <button
                        type="button"
                        className={
                            activeTab === "csv" ? "active" : ""
                        }
                        onClick={() => {
                            setActiveTab("csv");
                            setError("");
                            setSuccess("");
                        }}
                    >
                        CSV Upload
                    </button>

                </div>

                {/* ================================= */}
                {/* MANUAL ENTRY */}
                {/* ================================= */}

                {activeTab === "manual" && (

                    <div className="prediction-card">

                        <h2>Enter Student Details</h2>

                        <form onSubmit={handleManualPredict}>

                            <div className="prediction-grid">

                                <div className="form-group">
                                    <label>Attendance (%)</label>

                                    <input
                                        type="number"
                                        name="attendance"
                                        min="0"
                                        max="100"
                                        step="any"
                                        placeholder="Enter attendance"
                                        value={formData.attendance}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Study Hours</label>

                                    <input
                                        type="number"
                                        name="study_hours"
                                        min="0"
                                        max="12"
                                        step="any"
                                        placeholder="Enter study hours"
                                        value={formData.study_hours}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Internal Marks</label>

                                    <input
                                        type="number"
                                        name="internal_marks"
                                        min="0"
                                        max="100"
                                        step="any"
                                        placeholder="Enter internal marks"
                                        value={formData.internal_marks}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Assignment Marks</label>

                                    <input
                                        type="number"
                                        name="assignment_marks"
                                        min="0"
                                        max="100"
                                        step="any"
                                        placeholder="Enter assignment marks"
                                        value={formData.assignment_marks}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                            </div>

                            <button
                                type="submit"
                                className="predict-button"
                                disabled={loading}
                            >
                                {loading
                                    ? "Predicting..."
                                    : "Predict Student"
                                }
                            </button>

                        </form>

                        {/* MANUAL RESULT */}
                        {manualResult && (

                            <div className="result-card">

                                <h2>Prediction Result</h2>

                                <h1
                                    className={
                                        manualResult.result === "PASS"
                                            ? "pass"
                                            : "fail"
                                    }
                                >
                                    {manualResult.result}
                                </h1>

                                <p>
                                    Student: {manualResult.username}
                                </p>

                            </div>

                        )}

                    </div>

                )}

                {/* ================================= */}
                {/* CSV UPLOAD */}
                {/* ================================= */}

                {activeTab === "csv" && (

                    <div className="prediction-card">

                        <h2>Upload Student CSV</h2>

                        <p>
                            Upload a CSV file containing up to 100 student records.
                        </p>

                        <div className="form-group">

                            <label>Select CSV File</label>

                            <input
                                type="file"
                                accept=".csv,text/csv"
                                onChange={handleFileChange}
                            />

                        </div>

                        {file && (

                            <div className="selected-file">

                                <p>
                                    Selected file: <strong>{file.name}</strong>
                                </p>

                                <button
                                    type="button"
                                    onClick={clearCSV}
                                    disabled={loading}
                                >
                                    Remove file
                                </button>

                            </div>

                        )}

                        <button
                            type="button"
                            className="predict-button"
                            onClick={handleCSVUpload}
                            disabled={loading || !file}
                        >
                            {loading
                                ? "Processing CSV..."
                                : "Upload and Predict"
                            }
                        </button>

                        {/* STATISTICS */}
                        {stats && (

                            <div className="prediction-grid">

                                <div className="prediction-card">
                                    <h3>Total Students</h3>
                                    <h1>{stats.total}</h1>
                                </div>

                                <div className="prediction-card">
                                    <h3>PASS</h3>
                                    <h1 className="pass">{stats.pass}</h1>
                                </div>

                                <div className="prediction-card">
                                    <h3>FAIL</h3>
                                    <h1 className="fail">{stats.fail}</h1>
                                </div>

                            </div>

                        )}

                        {/* CSV RESULTS */}
                        {csvResults.length > 0 && (

                            <div className="history-section">

                                <h2>CSV Prediction Results</h2>

                                <div className="table-container">

                                    <table>

                                        <thead>
                                            <tr>
                                                <th>Student</th>
                                                <th>Attendance</th>
                                                <th>Study Hours</th>
                                                <th>Internal Marks</th>
                                                <th>Assignment Marks</th>
                                                <th>Result</th>
                                            </tr>
                                        </thead>

                                        <tbody>

                                            {paginatedCSVResults.map((item) => (

                                                <tr key={item.id}>

                                                    <td>
                                                        Student {item.student_number}
                                                    </td>

                                                    <td>{item.attendance}%</td>

                                                    <td>{item.study_hours}</td>

                                                    <td>{item.internal_marks}</td>

                                                    <td>{item.assignment_marks}</td>

                                                    <td>
                                                        <span
                                                            className={
                                                                item.prediction === "PASS"
                                                                    ? "pass"
                                                                    : "fail"
                                                            }
                                                        >
                                                            {item.prediction}
                                                        </span>
                                                    </td>

                                                </tr>

                                            ))}

                                        </tbody>

                                    </table>

                                </div>

                                {/* CSV PAGINATION */}
                                <Pagination
                                    currentPage={csvPage}
                                    totalPages={csvTotalPages}
                                    onPageChange={setCsvPage}
                                    totalRecords={csvResults.length}
                                />

                            </div>

                        )}

                    </div>

                )}

                {/* ================================= */}
                {/* PREDICTION HISTORY */}
                {/* ================================= */}

                <div className="history-section">

                    <h2>Prediction History</h2>

                    <p>
                        All previous manual and CSV predictions.
                    </p>

                    <button
                        type="button"
                        onClick={fetchHistory}
                        disabled={historyLoading}
                    >
                        {historyLoading
                            ? "Loading..."
                            : "Refresh History"
                        }
                    </button>

                    {historyLoading && (
                        <p>Loading prediction history...</p>
                    )}

                    {!historyLoading && history.length === 0 && (
                        <p>No prediction history available.</p>
                    )}

                    {!historyLoading && history.length > 0 && (

                        <>

                            <div className="table-container">

                                <table>

                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Attendance</th>
                                            <th>Study Hours</th>
                                            <th>Internal Marks</th>
                                            <th>Assignment Marks</th>
                                            <th>Prediction</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>

                                    <tbody>

                                        {paginatedHistory.map((item) => (

                                            <tr key={item.id}>

                                                <td>{item.id}</td>

                                                <td>{item.attendance}%</td>

                                                <td>{item.study_hours}</td>

                                                <td>{item.internal_marks}</td>

                                                <td>{item.assignment_marks}</td>

                                                <td>
                                                    <span
                                                        className={
                                                            item.prediction === "PASS"
                                                                ? "pass"
                                                                : "fail"
                                                        }
                                                    >
                                                        {item.prediction}
                                                    </span>
                                                </td>

                                                <td>
                                                    {formatDate(item.created_at)}
                                                </td>

                                            </tr>

                                        ))}

                                    </tbody>

                                </table>

                            </div>

                            {/* HISTORY PAGINATION */}
                            <Pagination
                                currentPage={historyPage}
                                totalPages={historyTotalPages}
                                onPageChange={setHistoryPage}
                                totalRecords={history.length}
                            />

                        </>

                    )}

                </div>

            </div>

        </div>
    );
}

export default Prediction;
