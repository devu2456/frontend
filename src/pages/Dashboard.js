import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import API from '../services/api';

ChartJS.register(ArcElement, Tooltip, Legend);

const Dashboard = () => {
  const [metrics, setMetrics] = useState({
    totalStudents: 0,
    eligibleStudentCount: 0,
    vaccinatedStudentCount: 0,
    eligibleStudents: [],
    upcomingDrives: [],
    totalDrives: [],
  });
  const [selectedDrive, setSelectedDrive] = useState('');
  const [sortField, setSortField] = useState('name'); 

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const url = selectedDrive
          ? `/metrics?vaccineId=${selectedDrive}`
          : '/metrics';

        const response = await API.get(url);

        setMetrics({
          ...response.data,
          upcomingDrives: response.data.upcomingDrives || [],
          eligibleStudents: response.data.eligibleStudents || [],
          totalDrives: response.data.totalDrives || [],
        });

        if (!selectedDrive && (response.data.upcomingDrives || []).length > 0) {
          setSelectedDrive(response.data.upcomingDrives[0]._id);
        }
      } catch (error) {
        console.error('Error fetching metrics:', error);
      }
    };

    fetchMetrics();
  }, [selectedDrive]);

  const unvaccinatedEligibleStudents =
    metrics.eligibleStudentCount - metrics.vaccinatedStudentCount;

  const vaccinationPercentage =
    metrics.eligibleStudentCount > 0
      ? ((metrics.vaccinatedStudentCount / metrics.eligibleStudentCount) * 100).toFixed(2)
      : 0;

  // Pie Chart Data
  const pieData = {
    labels: ['Vaccinated Students', 'Unvaccinated Eligible Students'],
    datasets: [
      {
        data: [metrics.vaccinatedStudentCount, unvaccinatedEligibleStudents],
        backgroundColor: ['#36A2EB', '#FF6384'],
        hoverBackgroundColor: ['#36A2EB', '#FF6384'],
      },
    ],
  };

  // Sort Eligible Students
  const sortedEligibleStudents = [...metrics.eligibleStudents].sort((a, b) => {
    if (sortField === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sortField === 'class') {
      return a.class.localeCompare(b.class);
    } else if (sortField === 'studentId') {
      return a.studentId.localeCompare(b.studentId);
    }
    return 0;
  });

  return (
    <div className="container mt-4">
      <h2 className="mb-4 text-center">Dashboard</h2>

      <div className="row mb-4">
        <div className="col-md-4">
          <Link to="/students" className="btn btn-primary w-100">
            Manage Students
          </Link>
        </div>
        <div className="col-md-4">
          <Link to="/drives" className="btn btn-primary w-100">
            Manage Vaccination Drives
          </Link>
        </div>
        <div className="col-md-4">
          <Link to="/reports" className="btn btn-primary w-100">
            Generate Reports
          </Link>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card text-center shadow">
            <div className="card-body">
              <h5 className="card-title">Total Students</h5>
              <p className="card-text display-6">{metrics.totalStudents}</p>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card text-center shadow">
            <div className="card-body">
              <h5 className="card-title">Vaccination Percentage</h5>
              <p className="card-text display-6">{vaccinationPercentage}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-6 offset-md-3">
          <div className="card shadow">
            <div className="card-body">
              <h5 className="card-title text-center">Vaccination Metrics</h5>
              <div style={{ width: '300px', height: '300px', margin: '0 auto' }}>
                <Pie data={pieData} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h4>Select a Vaccine Drive</h4>
        <select
          className="form-select"
          value={selectedDrive}
          onChange={(e) => setSelectedDrive(e.target.value)}
        >
          <option value="">Select a Drive</option>
          {(metrics.totalDrives || []).map((drive) => (
            <option key={drive._id} value={drive._id}>
              {drive.vaccineName} - {new Date(drive.date).toLocaleDateString()}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <h4>Upcoming Drives</h4>
        {metrics.upcomingDrives.length > 0 ? (
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Vaccine Name</th>
                <th>Date</th>
                <th>Available Doses</th>
              </tr>
            </thead>
            <tbody>
              {metrics.upcomingDrives.map((drive) => {
                const fullDriveDetails = metrics.totalDrives.find((d) => d._id === drive._id);
                return (
                  <tr key={drive._id}>
                    <td>{drive.vaccineName}</td>
                    <td>{new Date(drive.date).toLocaleDateString()}</td>
                    <td>{fullDriveDetails?.availableDoses || 'N/A'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="text-muted">No upcoming drives available.</p>
        )}
      </div>

      <div className="mb-4">
        <h4>Eligible Students</h4>

        <div className="mb-3">
          <label htmlFor="sortField" className="form-label">
            Sort By:
          </label>
          <select
            id="sortField"
            className="form-select"
            value={sortField}
            onChange={(e) => setSortField(e.target.value)}
          >
            <option value="name">Name</option>
            <option value="class">Class</option>
            <option value="studentId">Student ID</option>
          </select>
        </div>

        {sortedEligibleStudents.length > 0 ? (
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Class</th>
                <th>Vaccination Records</th>
              </tr>
            </thead>
            <tbody>
              {sortedEligibleStudents.map((student) => (
                <tr key={student._id}>
                  <td>{student.studentId}</td>
                  <td>{student.name}</td>
                  <td>{student.class}</td>
                  <td>
                    {student.vaccinationRecords.length > 0 ? (
                      <ul>
                        {student.vaccinationRecords.map((record, index) => (
                          <li key={index}>
                            {record.vaccineName} -{' '}
                            {new Date(record.date).toLocaleDateString()}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      'No Records'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-muted">No eligible students for the selected drive.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;