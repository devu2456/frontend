import React from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    localStorage.setItem('user', 'admin');
    navigate('/dashboard');
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card shadow p-4" style={{ width: '400px' }}>
        <div className="card-body text-center">
          <h2 className="card-title mb-4">School Vaccination Portal</h2>
          <button
            className="btn btn-primary btn-lg w-100"
            onClick={handleLogin}
          >
            Login as Coordinator
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;