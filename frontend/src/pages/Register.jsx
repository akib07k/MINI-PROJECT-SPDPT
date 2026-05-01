import { useState } from "react";
import API from "../services/api";
import { useNavigate, Link } from "react-router-dom";
import "./Register.css";
import heroImage from "../assets/Men Vectors - Download Free High-Quality Vectors from Freepik _ Freepik.jpg";

function Register() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [branch, setBranch] = useState("");
    const [semester, setSemester] = useState("");
    const [careerGoal, setCareerGoal] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        // --- Client-side validation ---
        const trimmedName = name.trim();
        const trimmedEmail = email.trim();

        if (!trimmedName) {
            alert("Full name is required.");
            return;
        }
        if (/^\d+$/.test(trimmedName)) {
            alert("Name cannot be only numbers. Please enter your real name.");
            return;
        }
        if (trimmedName.length < 2) {
            alert("Name must be at least 2 characters.");
            return;
        }
        if (!trimmedEmail) {
            alert("Email is required.");
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            alert("Please enter a valid email address.");
            return;
        }
        if (!password) {
            alert("Password is required.");
            return;
        }
        if (password.length < 6) {
            alert("Password must be at least 6 characters long.");
            return;
        }
        if (!/(?=.*[a-zA-Z])/.test(password)) {
            alert("Password must contain at least one letter.");
            return;
        }
        if (!/(?=.*\d)/.test(password)) {
            alert("Password must contain at least one number.");
            return;
        }
        if (!/(?=.*[@$!%*?&_#-])/.test(password)) {
            alert("Password must contain at least one special character.");
            return;
        }
        if (!branch.trim()) {
            alert("Branch is required.");
            return;
        }
        if (!semester.trim()) {
            alert("Semester is required.");
            return;
        }
        if (!careerGoal.trim()) {
            alert("Career Goal is required.");
            return;
        }

        try {
            const res = await API.post("/students", {
                name: trimmedName,
                email: trimmedEmail,
                password,
                branch,
                semester,
                careerGoal
            });

            alert(res.data.message || "Registration successful");
            navigate("/"); // Go to login page after registration

        } catch (err) {
            alert(err.response?.data?.message || err.response?.data?.error || "Registration failed");
        }
    };

    return (
        <div className="register-shell">
            <section className="register-panel register-panel-left">
                <div className="register-content">
                    <div className="register-topbar">
                        <div className="register-brand">
                            <div className="register-brand-icon" aria-hidden="true">
                                <span></span>
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                            <p>
                                STUDENT <span>PERSONAL DEV</span> &amp; PROGRESS TRACKER
                            </p>
                        </div>

                        <Link to="/" className="register-login-pill">
                            Login
                        </Link>
                    </div>

                    <div className="register-copy">
                        <h1>Register</h1>
                        <p>
                            Create your account to track performance, stay organized, and grow with SPDPT.
                        </p>
                    </div>

                    <form className="register-form" onSubmit={handleSubmit}>
                        <input
                            placeholder="Type your full name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                        <input
                            type="email"
                            placeholder="Type your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <input
                            type="password"
                            placeholder="Type your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <input
                            placeholder="Type your branch"
                            value={branch}
                            onChange={(e) => setBranch(e.target.value)}
                            required
                        />
                        <input
                            placeholder="Type your semester"
                            value={semester}
                            onChange={(e) => setSemester(e.target.value)}
                            required
                        />
                        <input
                            placeholder="Type your career goal"
                            value={careerGoal}
                            onChange={(e) => setCareerGoal(e.target.value)}
                            required
                        />
                        <button type="submit">Create Account</button>
                    </form>

                    <div className="register-footer">
                        Already have an account? <Link to="/">Login here</Link>
                    </div>
                </div>
            </section>

            <aside className="register-panel register-panel-right">
                <div className="register-illustration-wrap">
                    <img src={heroImage} alt="Student productivity illustration" className="register-illustration" />
                </div>

                <div className="register-highlight">
                    <span className="register-highlight-line"></span>
                    <h2>Build your progress space</h2>
                    <p>
                        Set up your student profile, define goals, and start managing your academic journey in one place.
                    </p>
                </div>
            </aside>
        </div>
    );
}

export default Register;
