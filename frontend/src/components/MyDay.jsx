import { useEffect, useState } from "react";
import API from "../services/api";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import "./MyDay.css";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

// Color palette for pie chart slices
const COLORS = [
    "#6366f1", "#3b82f6", "#06b6d4", "#22c55e",
    "#ec4899", "#ef4444", "#f59e0b", "#a78bfa",
    "#14b8a6", "#f97316"
];

// Static ideal day data
const IDEAL_DAY = [
    { name: "Sleep", hours: 7 },
    { name: "College", hours: 6 },
    { name: "Study", hours: 2 },
    { name: "Skills", hours: 2 },
    { name: "Family", hours: 2 },
    { name: "Health", hours: 2 },
    { name: "Misc", hours: 3 }
];

// Productive category names (case-insensitive partial match)
const PRODUCTIVE_NAMES = [
    "study", "skills", "college", "coding", "code", "dsa", "programming",
    "project", "homework", "assignment", "lecture", "class", "lab",
    "reading", "research", "practice", "learn", "course", "tutorial",
    "exam", "test", "revision", "competitive", "development", "dev",
    "internship", "work", "training", "workshop", "seminar"
];

// --- Recommendation rules ---
function getRecommendations(categories) {
    const tips = [];
    const getHours = (keyword) => {
        return categories
            .filter(c => (c.name || "").toLowerCase().includes(keyword))
            .reduce((s, c) => s + (Number(c.hours) || 0), 0);
    };

    if (getHours("skills") < 2) tips.push("Try to spend more time on skills tomorrow.");
    if (getHours("study") < 3) tips.push("Increase study hours for better academic progress.");
    if (getHours("health") < 1 && getHours("gym") < 1 && getHours("exercise") < 1) tips.push("Take care of your health – add exercise or gym time.");
    if (getHours("sleep") < 6) tips.push("Proper sleep improves productivity. Aim for 7+ hours.");

    return tips;
}

// ---- Validation helper ----
// Returns true if string looks purely numeric (integers like "00000", "123", etc.)
const isPurelyNumeric = (str) => /^\d+$/.test(str.trim());

// Validate a single row, returns error string or ""
function validateRow(row) {
    const name = (row.name || "").trim();
    const hours = row.hours;

    if (!name) return ""; // Empty rows are skipped, not an error at row level
    if (isPurelyNumeric(name)) return "Activity name cannot be only numbers";
    if (name.length < 2) return "Activity name must be at least 2 characters";
    if (hours === "" || hours === null || hours === undefined) return "Hours are required";
    const h = Number(hours);
    if (isNaN(h)) return "Hours must be a number";
    if (h <= 0) return "Hours must be greater than 0";
    if (h > 24) return "Hours cannot exceed 24";
    return "";
}

function MyDay({ onSave }) {
    // Dynamic rows: student types everything
    const [rows, setRows] = useState([
        { name: "", hours: "", note: "" }
    ]);
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [rowErrors, setRowErrors] = useState([]); // per-row errors
    const [productivityScore, setProductivityScore] = useState(null);
    const [recommendations, setRecommendations] = useState([]);

    // Total hours calculated rounded to 2 decimal places to avoid float issues
    const totalHours = Number(rows.reduce((sum, r) => sum + (Number(r.hours) || 0), 0).toFixed(2));
    const remainingHours = Number((24 - totalHours).toFixed(2));

    // Helper to format decimal hours into "Xh Ym"
    const formatHoursToTime = (decimalHours) => {
        if (typeof decimalHours !== 'number' || isNaN(decimalHours)) return "0h 0m";
        const h = Math.floor(decimalHours);
        const m = Math.round((decimalHours - h) * 60);

        if (m === 0) return `${h}h`;
        if (h === 0) return `${m}m`;
        return `${h}h ${m}m`;
    };

    // Calculate productivity score from current rows
    const calcScore = (cats, total) => {
        if (!total || total === 0) return 0;
        const productive = cats
            .filter(c => PRODUCTIVE_NAMES.some(p => (c.name || "").toLowerCase().includes(p)))
            .reduce((s, c) => s + (Number(c.hours) || 0), 0);
        return Math.round((productive / total) * 100);
    };

    // Fetch today's MyDay on mount
    useEffect(() => {
        const student = JSON.parse(localStorage.getItem("student"));
        if (!student) return;

        API.get(`/myday/${student._id}`)
            .then(res => {
                console.log("MyDay API response:", res.data);
                if (res.data && res.data.categories && res.data.categories.length > 0) {
                    const cats = res.data.categories.map(c => ({
                        name: c.name || "",
                        hours: c.hours || "",
                        note: c.note || ""
                    }));
                    setRows(cats);
                    setRowErrors(cats.map(() => ""));
                    setSaved(true);

                    // Set productivity score
                    const score = res.data.productivityScore ?? calcScore(cats, res.data.totalHours);
                    setProductivityScore(score);

                    // Generate recommendations
                    setRecommendations(getRecommendations(cats));
                }
            })
            .catch(err => console.log("MyDay fetch:", err));
    }, []);

    // Update a row field
    const updateRow = (index, field, value) => {
        if (field === "name") {
            // Don't block typing, but validate inline
        }

        if (field === "hours") {
            const num = Number(value);
            const othersTotal = rows.reduce(
                (sum, r, i) => i === index ? sum : sum + (Number(r.hours) || 0), 0
            );
            if (num < 0) return;
            if (Number((othersTotal + num).toFixed(2)) > 24) {
                setError("Total cannot exceed 24 hours!");
                return;
            }
            setError("");
        }

        setRows(prev => {
            const copy = [...prev];
            copy[index] = { ...copy[index], [field]: value };

            // Only validate inline when changing hours/note, NOT when typing the name
            // (avoids showing "Hours are required" while user is still filling the name)
            if (field !== "name") {
                const newErrors = [...rowErrors];
                newErrors[index] = validateRow(copy[index]);
                setRowErrors(newErrors);
            } else {
                // Clear any existing error for this row while user is typing the name
                const newErrors = [...rowErrors];
                newErrors[index] = "";
                setRowErrors(newErrors);
            }

            return copy;
        });

        if (field !== "hours") setError("");
    };

    const addRow = () => {
        if (totalHours >= 24) {
            setError("Already at 24 hours — no more categories!");
            return;
        }
        setRows(prev => [...prev, { name: "", hours: "", note: "" }]);
        setRowErrors(prev => [...prev, ""]);
    };

    const removeRow = (index) => {
        if (rows.length <= 1) return;
        setRows(prev => prev.filter((_, i) => i !== index));
        setRowErrors(prev => prev.filter((_, i) => i !== index));
        setError("");
    };

    // Submit handler
    const handleSubmit = async () => {
        // Re-validate all rows
        const errors = rows.map(r => validateRow(r));
        setRowErrors(errors);

        // Check for rows that have a name but invalid content
        const namedRows = rows.filter(r => (r.name || "").trim());
        if (namedRows.length === 0) {
            setError("Add at least one activity with a name and hours.");
            return;
        }

        // Check if any named row has errors
        const hasErrors = namedRows.some(r => validateRow(r) !== "");
        if (hasErrors) {
            setError("Please fix the highlighted errors before saving.");
            return;
        }

        const validRows = rows.filter(r => r.name.trim() && Number(r.hours) > 0);

        if (validRows.length === 0) {
            setError("Add at least one category with name and hours.");
            return;
        }

        const total = validRows.reduce((s, r) => s + Number(r.hours), 0);
        if (total > 24) {
            setError("Total hours cannot exceed 24!");
            return;
        }

        const student = JSON.parse(localStorage.getItem("student"));
        if (!student) return;

        setSaving(true);
        setError("");

        try {
            const cats = validRows.map(r => ({
                name: r.name.trim(),
                hours: Number(r.hours),
                note: r.note || ""
            }));

            const payload = {
                studentId: student._id,
                categories: cats
            };

            const res = await API.post("/myday", payload);
            console.log("MyDay saved:", res.data);
            setSaved(true);

            // Update productivity score
            const score = res.data.productivityScore ?? calcScore(cats, total);
            setProductivityScore(score);

            // Generate recommendations
            setRecommendations(getRecommendations(cats));

            // Notify parent (Dashboard) to refresh weekly chart
            if (onSave) onSave();
        } catch (err) {
            console.error("MyDay save error:", err);
            setError(err.response?.data?.error || "Failed to save. Try again.");
        } finally {
            setSaving(false);
        }
    };

    // ---- Ideal Day Pie ----
    const idealPieData = {
        labels: IDEAL_DAY.map(d => `${d.name} (${formatHoursToTime(d.hours)})`),
        datasets: [{
            data: IDEAL_DAY.map(d => d.hours),
            backgroundColor: COLORS.slice(0, IDEAL_DAY.length),
            borderColor: "#0f172a",
            borderWidth: 2
        }]
    };

    // ---- Actual Day Pie ----
    const filledRows = rows.filter(r => r.name.trim() && Number(r.hours) > 0);
    const actualPieData = {
        labels: filledRows.map(r => `${r.name} (${formatHoursToTime(Number(r.hours))})`),
        datasets: [{
            data: filledRows.map(r => Number(r.hours)),
            backgroundColor: filledRows.map((_, i) => COLORS[i % COLORS.length]),
            borderColor: "#0f172a",
            borderWidth: 2
        }]
    };

    const makePieOptions = (withNotes = false) => ({
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                position: "bottom",
                labels: { color: "#e2e8f0", font: { size: 12 }, padding: 10 }
            },
            tooltip: {
                callbacks: {
                    label: (ctx) => {
                        const hours = ctx.parsed;
                        const pct = Math.round((hours / 24) * 100);
                        const formattedTime = formatHoursToTime(hours);
                        if (withNotes) {
                            const row = filledRows[ctx.dataIndex];
                            const note = row?.note ? ` – Note: ${row.note}` : "";
                            return ` ${row?.name} – ${formattedTime} (${pct}%)${note}`;
                        }
                        return ` ${ctx.label}: ${pct}%`;
                    }
                }
            }
        }
    });

    // Productivity score color
    const scoreColor = productivityScore >= 60 ? "#22c55e"
        : productivityScore >= 40 ? "#f59e0b" : "#ef4444";

    return (
        <div className="myday-section">
            <h3>📊 My Day Tracker</h3>

            {/* ===== Productivity Score Badge ===== */}
            {productivityScore !== null && (
                <div className="myday-score-card">
                    <div className="myday-score-header">
                        <span className="myday-score-icon">🔥</span>
                        <span className="myday-score-label">Productivity Score</span>
                        <span className="myday-score-value" style={{ color: scoreColor }}>
                            {productivityScore}%
                        </span>
                    </div>
                    <div className="myday-score-bar-track">
                        <div
                            className="myday-score-bar-fill"
                            style={{ width: `${productivityScore}%`, backgroundColor: scoreColor }}
                        ></div>
                    </div>
                    <p className="myday-score-hint">
                        Based on Study + Skills + College hours
                    </p>
                </div>
            )}

            {/* ===== Dual Pie Charts ===== */}
            <div className="myday-charts-grid">
                <div className="myday-chart-card">
                    <h4>🎯 Ideal Day</h4>
                    <div className="myday-chart-wrapper">
                        <Pie data={idealPieData} options={makePieOptions(false)} />
                    </div>
                </div>

                <div className="myday-chart-card">
                    <h4>📋 My Actual Day</h4>
                    {saved && filledRows.length > 0 ? (
                        <div className="myday-chart-wrapper">
                            <Pie data={actualPieData} options={makePieOptions(true)} />
                        </div>
                    ) : (
                        <p className="myday-placeholder-text">
                            Fill in your activities below to see your actual day chart.
                        </p>
                    )}
                </div>
            </div>

            {/* ===== Dynamic Input Form ===== */}
            <div className="myday-form-card">
                <h4>⏱️ Log Today's Hours</h4>

                <div className="myday-form-header">
                    <span>Activity</span>
                    <span>Hours</span>
                    <span>Note</span>
                    <span></span>
                </div>

                <div className="myday-form-grid">
                    {rows.map((row, i) => (
                        <div key={i} className="myday-form-row-wrapper">
                            <div className={`myday-form-row ${rowErrors[i] ? "myday-row-error" : ""}`}>
                                <input
                                    type="text"
                                    placeholder="e.g. Sleep, Study, Gym..."
                                    value={row.name}
                                    onChange={(e) => updateRow(i, "name", e.target.value)}
                                    className={`myday-name-input ${rowErrors[i] ? "input-error" : ""}`}
                                    title="Enter the activity name (e.g. Sleep, Study)"
                                />
                                <input
                                    type="number"
                                    min="0.5"
                                    max={Number(row.hours || 0) + remainingHours}
                                    step="0.5"
                                    placeholder="Hrs"
                                    value={row.hours}
                                    onChange={(e) => updateRow(i, "hours", e.target.value)}
                                    className={`myday-hours-input ${rowErrors[i] ? "input-error" : ""}`}
                                    title="Enter hours (e.g. 1.5 for 1h 30m)"
                                />
                                <input
                                    type="text"
                                    placeholder="Optional note"
                                    value={row.note}
                                    onChange={(e) => updateRow(i, "note", e.target.value)}
                                    className="myday-note-input"
                                />
                                <button
                                    className="myday-remove-btn"
                                    onClick={() => removeRow(i)}
                                    disabled={rows.length <= 1}
                                    title="Remove row"
                                >
                                    ✕
                                </button>
                            </div>
                            {rowErrors[i] && (
                                <span className="myday-row-error-msg">⚠ {rowErrors[i]}</span>
                            )}
                        </div>
                    ))}
                </div>

                <button className="myday-add-btn" onClick={addRow} disabled={totalHours >= 24}>
                    + Add Activity
                </button>

                <div className="myday-form-footer">
                    <span className={`myday-total ${totalHours > 24 ? "myday-total-error" : ""}`}>
                        Total: {formatHoursToTime(totalHours)} / 24h
                        {remainingHours > 0 && totalHours > 0 && (
                            <span className="myday-remaining"> ({formatHoursToTime(remainingHours)} remaining)</span>
                        )}
                    </span>

                    {error && <span className="myday-error">⚠ {error}</span>}

                    <button
                        className="myday-save-btn"
                        onClick={handleSubmit}
                        disabled={saving}
                    >
                        {saving ? "Saving..." : saved ? "✅ Update My Day" : "Save My Day"}
                    </button>
                </div>
            </div>

            {/* ===== Recommendations ===== */}
            {recommendations.length > 0 && (
                <div className="myday-reco-card">
                    <h4>📌 Recommendations</h4>
                    <ul className="myday-reco-list">
                        {recommendations.map((tip, i) => (
                            <li key={i} className="myday-reco-item">{tip}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

export default MyDay;
