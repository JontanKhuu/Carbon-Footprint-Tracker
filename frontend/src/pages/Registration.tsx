import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { registerUser } from '../services/api';
import type { RegisterUserRequest } from '../types';

function Registration() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const validateEmail = (email: string): string | null => {
        if (!email || !email.trim()) {
            return 'Email is required';
        }
        // Only allow .com email addresses
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.com$/;
        if (!emailPattern.test(email.trim())) {
            return 'Please enter a valid email address ending with .com';
        }
        if (email.length > 254) {
            return 'Email address is too long';
        }
        return null;
    };

    const validatePassword = (pwd: string): string[] => {
        const errors: string[] = [];
        
        if (pwd.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }
        if (!/[A-Z]/.test(pwd)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (!/[a-z]/.test(pwd)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        if (!/[0-9]/.test(pwd)) {
            errors.push('Password must contain at least one number');
        }
        if (!/[^A-Za-z0-9]/.test(pwd)) {
            errors.push('Password must contain at least one special character');
        }
        
        return errors;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setFieldErrors({});

        // Validate email format
        const emailError = validateEmail(email);
        if (emailError) {
            setError('Please fix the errors below');
            setFieldErrors({ email: emailError });
            return;
        }

        // Validate password strength
        const passwordErrors = validatePassword(password);
        if (passwordErrors.length > 0) {
            setError('Password does not meet requirements');
            setFieldErrors({ password: passwordErrors.join('. ') });
            return;
        }

        // Validate password match
        if (password !== confirmPassword) {
            setError('Passwords do not match. Please try again.');
            setFieldErrors({ confirmPassword: 'Passwords do not match' });
            return;
        }

        try {
            await registerUser({ username, email, password } as RegisterUserRequest);
            navigate('/login');
        } catch (err) {
            console.error('Registration error:', err);
            
            if (axios.isAxiosError(err) && err.response?.data) {
                const responseData = err.response.data;
                
                // Check if there are multiple field errors
                if (responseData.errors && typeof responseData.errors === 'object') {
                    // Multiple field errors - set them all
                    setFieldErrors(responseData.errors);
                    setError(responseData.error || 'Please fix the errors below');
                } else if (responseData.error) {
                    // Single error message - try to map to fields
                    const errorMessage = responseData.error;
                    setError(errorMessage);
                    
                    const newFieldErrors: Record<string, string> = {};
                    
                    // Check for username errors
                    if (errorMessage.toLowerCase().includes('username')) {
                        newFieldErrors.username = errorMessage;
                    }
                    // Check for email errors
                    if (errorMessage.toLowerCase().includes('email')) {
                        newFieldErrors.email = errorMessage;
                    }
                    // Check for password errors
                    if (errorMessage.toLowerCase().includes('password')) {
                        newFieldErrors.password = errorMessage;
                    }
                    
                    // Only set field errors if we found any
                    if (Object.keys(newFieldErrors).length > 0) {
                        setFieldErrors(newFieldErrors);
                    }
                } else {
                    setError('Registration failed. Please try again.');
                }
            } else {
                setError('Registration failed. Please try again.');
            }
        }
    };

    return (
        <div style={{ textAlign: 'center' }}>
            <h2 style={{ marginBottom: '1px' }}>Registration</h2>
            <form onSubmit={handleSubmit} style={{ 
                display: 'inline-block', 
                textAlign: 'left',
                maxWidth: '400px',
                width: '100%',
                padding: '20px'
            }}>
                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="username" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Username:
                    </label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => {
                            setUsername(e.target.value);
                            if (fieldErrors.username) {
                                setFieldErrors(prev => {
                                    const newErrors = { ...prev };
                                    delete newErrors.username;
                                    return newErrors;
                                });
                            }
                            setError('');
                        }}
                        required
                        style={{ 
                            display: 'block', 
                            width: '100%', 
                            padding: '8px',
                            fontSize: '16px',
                            border: fieldErrors.username ? '2px solid red' : '1px solid #ccc',
                            borderRadius: '4px',
                            boxSizing: 'border-box'
                        }}
                    />
                    {fieldErrors.username && (
                        <span style={{ color: 'red', fontSize: '14px', display: 'block', marginTop: '4px' }}>
                            {fieldErrors.username}
                        </span>
                    )}
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="email" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Email:
                    </label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            if (fieldErrors.email) {
                                setFieldErrors(prev => {
                                    const newErrors = { ...prev };
                                    delete newErrors.email;
                                    return newErrors;
                                });
                            }
                            setError('');
                        }}
                        required
                        style={{ 
                            display: 'block', 
                            width: '100%', 
                            padding: '8px',
                            fontSize: '16px',
                            border: fieldErrors.email ? '2px solid red' : '1px solid #ccc',
                            borderRadius: '4px',
                            boxSizing: 'border-box'
                        }}
                    />
                    {fieldErrors.email && (
                        <span style={{ color: 'red', fontSize: '14px', display: 'block', marginTop: '4px' }}>
                            {fieldErrors.email}
                        </span>
                    )}
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="password" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Password:
                    </label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            if (fieldErrors.password || fieldErrors.confirmPassword) {
                                setFieldErrors(prev => {
                                    const newErrors = { ...prev };
                                    delete newErrors.password;
                                    delete newErrors.confirmPassword;
                                    return newErrors;
                                });
                            }
                            setError('');
                        }}
                        required
                        style={{ 
                            display: 'block', 
                            width: '100%', 
                            padding: '8px',
                            fontSize: '16px',
                            border: fieldErrors.password ? '2px solid red' : '1px solid #ccc',
                            borderRadius: '4px',
                            boxSizing: 'border-box'
                        }}
                    />
                    {fieldErrors.password && (
                        <span style={{ color: 'red', fontSize: '14px', display: 'block', marginTop: '4px' }}>
                            {fieldErrors.password}
                        </span>
                    )}
                    {!fieldErrors.password && password && (
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                            Password must contain: at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character
                        </div>
                    )}
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Confirm Password:
                    </label>
                    <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            if (fieldErrors.confirmPassword) {
                                setFieldErrors(prev => {
                                    const newErrors = { ...prev };
                                    delete newErrors.confirmPassword;
                                    return newErrors;
                                });
                            }
                            setError('');
                        }}
                        required
                        style={{ 
                            display: 'block', 
                            width: '100%', 
                            padding: '8px',
                            fontSize: '16px',
                            border: fieldErrors.confirmPassword ? '2px solid red' : '1px solid #ccc',
                            borderRadius: '4px',
                            boxSizing: 'border-box'
                        }}
                    />
                    {fieldErrors.confirmPassword && (
                        <span style={{ color: 'red', fontSize: '14px', display: 'block', marginTop: '4px' }}>
                            {fieldErrors.confirmPassword}
                        </span>
                    )}
                </div>
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <button 
                        type="submit"
                        style={{
                            padding: '10px 20px',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Register
                    </button>
                </div>
            </form>
            {error && !Object.keys(fieldErrors).length && (
                <p style={{ 
                    color: 'red', 
                    marginTop: '15px',
                    padding: '10px',
                    backgroundColor: '#fee',
                    borderRadius: '4px',
                    border: '1px solid #fcc'
                }}>
                    {error}
                </p>
            )}
            <p style={{ marginTop: '15px' }}>
                Already have an account? <Link to="/login">Login</Link> 
            </p>
        </div>  
    ); 
}

export default Registration;
