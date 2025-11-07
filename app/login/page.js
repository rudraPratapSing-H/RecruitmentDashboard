'use client';


import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        // Store user in localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('userName', data.user.name);
        localStorage.setItem('userEmail', data.user.email);
        localStorage.setItem('userId', data.user.id);
        
        // Redirect to search page
        router.push('/search');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0f172a'
    }}>
      <div style={{ 
        maxWidth: '400px',
        width: '100%',
        margin: '20px',
        padding: '40px',
        backgroundColor: '#1e293b',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
        border: '1px solid #475569'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ 
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#cbd5e1',
            marginBottom: '8px'
          }}>
            Interview Portal
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>
            Sign in to access the platform
          </p>
        </div>
        
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block',
              marginBottom: '6px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#cbd5e1'
            }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
              style={{ 
                width: '100%',
                padding: '10px 12px',
                fontSize: '16px',
                border: '1px solid #475569',
                borderRadius: '6px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
                backgroundColor: '#0f172a',
                color: '#e2e8f0'
              }}
              onFocus={(e) => e.target.style.borderColor = '#a78bfa'}
              onBlur={(e) => e.target.style.borderColor = '#475569'}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block',
              marginBottom: '6px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#cbd5e1'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              style={{ 
                width: '100%',
                padding: '10px 12px',
                fontSize: '16px',
                border: '1px solid #475569',
                borderRadius: '6px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
                backgroundColor: '#0f172a',
                color: '#e2e8f0'
              }}
              onFocus={(e) => e.target.style.borderColor = '#a78bfa'}
              onBlur={(e) => e.target.style.borderColor = '#475569'}
            />
          </div>

          {error && (
            <div style={{ 
              padding: '12px',
              marginBottom: '20px',
              backgroundColor: '#1f0d0d',
              border: '1px solid #7f1d1d',
              borderRadius: '6px',
              color: '#fca5a5',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            style={{ 
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              fontWeight: '600',
              background: loading ? '#475569' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
              boxSizing: 'border-box',
              boxShadow: loading ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.4)'
            }}
            onMouseEnter={(e) => !loading && (e.target.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)')}
            onMouseLeave={(e) => !loading && (e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)')}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ 
          marginTop: '24px',
          paddingTop: '24px',
          borderTop: '1px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            Need help? Contact your administrator
          </p>
        </div>
      </div>
    </div>
  );
}
