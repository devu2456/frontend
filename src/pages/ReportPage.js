import React, { useEffect, useState } from 'react';
import API from '../services/api';
import 'bootstrap/dist/css/bootstrap.min.css';

const ReportPage = () => {
  const [students, setStudents] = useState([]);
  const [filter, setFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('date'); 
  const [sortOrder, setSortOrder] = useState('asc'); 
  const rowsPerPage = 5;

  const fetchStudents = async () => {
    try {
      const res = await API.get('/students');
      setStudents(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const filtered = students
  .map((s) => ({
    ...s,
    vaccinationRecords: s.vaccinationRecords.filter((rec) =>
      filter === '' ? true : rec.vaccineName.toLowerCase().includes(filter.toLowerCase())
    )
  }))
  .filter((s) => s.vaccinationRecords.length > 0); 



  const sorted = [...filtered].sort((a, b) => {
    if (sortField === 'Name') {
      const dateA = new Date(a.vaccinationRecords[0]?.date || 0);
      const dateB = new Date(b.vaccinationRecords[0]?.date || 0);
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    } else if (sortField === 'name') {
      return sortOrder === 'asc'
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else if (sortField === 'class') {
      return sortOrder === 'asc'
        ? a.class.localeCompare(b.class)
        : b.class.localeCompare(a.class);
    }
    return 0;
  });


  const paginated = sorted.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );


  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); 
    } else {
      setSortField(field);
      setSortOrder('asc'); 
    }
  };

  const exportToCSV = () => {
    const csvRows = [
      ['Student ID', 'Name', 'Class', 'Vaccine', 'Date']
    ];

    sorted.forEach((s) => {
      s.vaccinationRecords.forEach((v) => {
        csvRows.push([
          s.studentId,
          s.name,
          s.class,
          v.vaccineName,
          new Date(v.date).toLocaleDateString()
        ]);
      });
    });

    const csv = csvRows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'vaccination_report.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4">Vaccination Report</h2>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <input
          className="form-control w-50"
          placeholder="Filter by vaccine name..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <button className="btn btn-primary" onClick={exportToCSV}>
          Download CSV
        </button>
      </div>

      <table className="table table-striped table-hover">
        <thead className="table-dark">
          <tr>
            <th onClick={() => handleSort('studentId')}>
              Student ID {sortField === 'studentId' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('name')}>
              Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('class')}>
              Class {sortField === 'class' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th>Vaccine</th>
            <th onClick={() => handleSort('date')}>
              Date {sortField === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
          </tr>
        </thead>
        <tbody>
          {paginated.map((s) =>
            s.vaccinationRecords.map((v, i) => (
              <tr key={s._id + '-' + i}>
                <td>{s.studentId}</td>
                <td>{s.name}</td>
                <td>{s.class}</td>
                <td>{v.vaccineName}</td>
                <td>{new Date(v.date).toLocaleDateString()}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="d-flex justify-content-center mt-3">
        {Array.from({
          length: Math.ceil(filtered.length / rowsPerPage)
        }).map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentPage(idx + 1)}
            className={`btn btn-sm mx-1 ${
              currentPage === idx + 1 ? 'btn-primary' : 'btn-outline-primary'
            }`}
          >
            {idx + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ReportPage;