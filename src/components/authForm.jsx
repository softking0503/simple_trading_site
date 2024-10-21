import React, { useState } from 'react';

const AuthForm = ({ type }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (type === 'register' && password !== confirmPassword) {
            setMessage("Passwords do not match");
            return;
        }
        try {
            const url = type === 'login'
                ? 'http://localhost:5000/auth/login'
                : 'http://localhost:5000/auth/register';
            const body = type === 'login'
                ? { username, password }
                : { username, password, confirmPassword };

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('token', data.token);
                window.location.href = data.redirectTo;
            } else {
                setMessage(data.message || "Error occurred");
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.leftPanel}>
                <h1 style={styles.heading}>{type === 'login' ? 'Login to your Account' : 'Create your Account'}</h1>
                <p>or continue with {type === 'login' ? 'username' : 'registration'}</p>

                <form onSubmit={handleSubmit} style={styles.form}>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        style={styles.input}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={styles.input}
                        required
                    />
                    {type === 'register' && (
                        <input
                            type="password"
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            style={styles.input}
                            required
                        />
                    )}
                    <button type="submit" style={styles.submitButton}>
                        {
                            type === "login" ? "LOG IN" : "REGISTER"
                        }
                    </button>
                </form>

                <div style={styles.navigationLink}>
                    <p style={styles.navigationLinkMessage}>{type === 'login' ? "Don't have an account? " : "Already have an account? "}</p>                    <a href={type === 'login' ? 'register' : 'login'} style={styles.link}>
                        {type === 'login' ? 'Create an account' : 'Login here'}
                    </a>
                </div>
                <p style={styles.message}>{message}</p>
            </div>

            <div style={styles.rightPanel}>
                <div style={styles.imageSection}>
                    <h2>{type === 'login' ? 'Connect with any device.' : 'Join us!'}</h2>
                    <p>{type === 'login' ? 'Log in from any device, anywhere.' : 'Start creating your account today.'}</p>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'row',
        width: '100%',
        height: '100vh',
    },
    leftPanel: {
        width: '50%',
        padding: '60px',
        backgroundColor: '#f8f9fb',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    rightPanel: {
        width: '50%',
        backgroundColor: '#4A90E2',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '60px',
    },
    heading: {
        fontSize: '30px',
        color: '#333',
        marginBottom: '20px',
    },
    socialLogin: {
        display: 'flex',
        gap: '10px',
        marginBottom: '20px',
    },
    form: {
        width: '100%',
        marginTop: '20px',
    },
    input: {
        width: '100%',
        padding: '15px',
        margin: '10px 0',
        border: '1px solid #ddd',
        borderRadius: '5px',
        fontSize: '16px',
    },
    submitButton: {
        width: '100%',
        padding: '15px',
        backgroundColor: '#4A90E2',
        color: '#fff',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '18px',
        marginTop: '20px',
    },
    link: {
        color: '#4A90E2',
        textDecoration: 'none',
        fontWeight: 'bold',
    },
    navigationLink: {
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        marginTop: '25px',
    },
    navigationLinkMessage: {
        color: 'black',
        marginRight:'10px'
    },
    message: {
        color: '#ff4d4d',
        marginTop: '15px',
    },
    imageSection: {
        textAlign: 'center',
        color: '#fff',
    },
};

export default AuthForm;
