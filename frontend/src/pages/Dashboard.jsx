
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Dashboard() {

    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Fetch prediction history
    useEffect(() => {

        const fetchHistory = async () => {

            try {
                const response = await api.get("prediction/history/");

                setHistory(response.data.history);

            } catch (error) {

                console.error("History error:", error);

                setError("Unable to load prediction history.");

            } finally {

                setLoading(false);

            }
        };

        fetchHistory();

    }, []);

    // Logout
    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    // Calculate statistics
    const totalPredictions = history.length;

    const passCount = history.filter(
        item => item.prediction === "PASS"
    ).length;

    const failCount = history.filter(
        item => item.prediction === "FAIL"
    ).length;


    return (

        <div className="dashboard">

            <header>
                <h2>Student Performance System</h2>
                <button onClick={handleLogout}>Logout</button>
            </header>

            <main>

                <h1>Welcome {user?.username}</h1>

                <p>Student Performance Dashboard</p>

                {/* Statistics */}
                <div className="stats">

                    <div className="card">
                        <h3>Total Predictions</h3>
                        <h1>{totalPredictions}</h1>
                    </div>

                    <div className="card">
                        <h3>Predicted Pass</h3>
                        <h1>{passCount}</h1>
                    </div>

                    <div className="card">
                        <h3>Predicted Fail</h3>
                        <h1>{failCount}</h1>
                    </div>

                </div>


                {/* Prediction Button */}
                <section>
                    <h2>Student Prediction</h2>

                    <p>
                        Predict student performance using the ML model.
                    </p>

                    <button onClick={() => navigate("/prediction")}>
                        Start Prediction
                    </button>
                </section>


                {/* Prediction History */}
                <section className="history-section">

                    <h2>Prediction History</h2>

                    {loading && <p>Loading history...</p>}

                    {error && <p className="error-message">{error}</p>}

                    {!loading && !error && history.length === 0 && (
                        <p>No prediction history available.</p>
                    )}

                    {!loading && history.length > 0 && (

                        <div className="table-container">

                            <table>

                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Attendance</th>
                                        <th>Study Hours</th>
                                        <th>Internal Marks</th>
                                        <th>Assignment Marks</th>
                                        <th>Result</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {history.map((item) => (

                                        <tr key={item.id}>

                                            <td>{item.id}</td>

                                            <td>{item.attendance}%</td>

                                            <td>{item.study_hours}</td>

                                            <td>{item.internal_marks}</td>

                                            <td>{item.assignment_marks}</td>

                                            <td>
                                                <span className={
                                                    item.prediction === "PASS"
                                                        ? "pass"
                                                        : "fail"
                                                }>
                                                    {item.prediction}
                                                </span>
                                            </td>

                                            <td>
                                                {new Date(item.created_at).toLocaleString()}
                                            </td>

                                        </tr>

                                    ))}

                                </tbody>

                            </table>

                        </div>

                    )}

                </section>

            </main>

        </div>

    );
}

export default Dashboard;
