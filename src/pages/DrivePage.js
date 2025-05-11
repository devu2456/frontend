import React, { useEffect, useState } from 'react';
import API from '../services/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './DrivePage.css'; 

const DrivePage = () => {
  const [drives, setDrives] = useState([]);
  const [form, setForm] = useState({
    vaccineName: '',
    date: new Date(),
    availableDoses: '',
    applicableClasses: ''
  });
  const [editForm, setEditForm] = useState(null); 
  const [sortField, setSortField] = useState('date'); 
  const [sortOrder, setSortOrder] = useState('asc'); 

  
  const fetchDrives = async () => {
    try {
      const res = await API.get('/drives');
      setDrives(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDrives();
  }, []);

  
  const handleSubmit = async (e) => {
    e.preventDefault();

    
    const classList = form.applicableClasses.split(',').map((cls) => cls.trim());
    const isValidClasses = classList.every(
      (cls) => /^\d+$/.test(cls) && parseInt(cls, 10) >= 1 && parseInt(cls, 10) <= 12
    );
    const hasDuplicates = new Set(classList).size !== classList.length;

    if (!isValidClasses) {
      alert('Applicable Classes must only contain numbers between 1 and 12, separated by commas.');
      return;
    }

    if (hasDuplicates) {
      alert('Applicable Classes must not contain duplicate values.');
      return;
    }

    try {
      await API.post('/drives', {
        ...form,
        date: form.date.toISOString(),
        applicableClasses: classList
      });
      fetchDrives();
      setForm({ vaccineName: '', date: new Date(), availableDoses: '', applicableClasses: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating drive');
    }
  };

  
  const handleEditSubmit = async (e) => {
    e.preventDefault();

    
    const classList = editForm.applicableClasses.split(',').map((cls) => cls.trim());
    const isValidClasses = classList.every(
      (cls) => /^\d+$/.test(cls) && parseInt(cls, 10) >= 1 && parseInt(cls, 10) <= 12
    );
    const hasDuplicates = new Set(classList).size !== classList.length;

    if (!isValidClasses) {
      alert('Applicable Classes must only contain numbers between 1 and 12, separated by commas.');
      return;
    }

    if (hasDuplicates) {
      alert('Applicable Classes must not contain duplicate values.');
      return;
    }

    try {
      await API.put(`/drives/${editForm._id}`, {
        ...editForm,
        date: editForm.date.toISOString(),
        applicableClasses: classList
      });
      fetchDrives();
      setEditForm(null); 
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating drive');
    }
  };

  
  const sortedDrives = [...drives].sort((a, b) => {
    if (sortField === 'date') {
      return sortOrder === 'asc'
        ? new Date(a.date) - new Date(b.date)
        : new Date(b.date) - new Date(a.date);
    } else if (sortField === 'vaccineName') {
      return sortOrder === 'asc'
        ? a.vaccineName.localeCompare(b.vaccineName)
        : b.vaccineName.localeCompare(a.vaccineName);
    } else if (sortField === 'availableDoses') {
      return sortOrder === 'asc' ? a.availableDoses - b.availableDoses : b.availableDoses - a.availableDoses;
    }
    return 0;
  });

  return (
    <div style={{ padding: '20px' }}>
      <h2 className="text-center mb-4">Manage Vaccination Drives</h2>

      
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="form-group mb-3">
          <label>Vaccine Name</label>
          <input
            className="form-control"
            placeholder="Vaccine Name"
            value={form.vaccineName}
            onChange={(e) => setForm({ ...form, vaccineName: e.target.value })}
            required
          />
        </div>
        <div className="form-group mb-3">
          <label>Date</label>
          <DatePicker
            className="form-control"
            selected={form.date}
            onChange={(date) => setForm({ ...form, date })}
            dateFormat="yyyy-MM-dd"
            required
          />
        </div>
        <div className="form-group mb-3">
          <label>Available Doses</label>
          <input
            className="form-control"
            placeholder="Available Doses"
            type="number"
            value={form.availableDoses}
            onChange={(e) => setForm({ ...form, availableDoses: e.target.value })}
            required
          />
        </div>
        <div className="form-group mb-3">
          <label>Applicable Classes (comma-separated)</label>
          <input
            className="form-control"
            placeholder="Applicable Classes"
            value={form.applicableClasses}
            onChange={(e) => setForm({ ...form, applicableClasses: e.target.value })}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary w-100">Create Drive</button>
      </form>

      
      {editForm && (
        <form onSubmit={handleEditSubmit} className="mb-4">
          <h4>Edit Drive</h4>
          <div className="form-group mb-3">
            <label>Vaccine Name</label>
            <input
              className="form-control"
              value={editForm.vaccineName}
              onChange={(e) => setEditForm({ ...editForm, vaccineName: e.target.value })}
              required
            />
          </div>
          <div className="form-group mb-3">
            <label>Date</label>
            <DatePicker
              className="form-control"
              selected={new Date(editForm.date)}
              onChange={(date) => setEditForm({ ...editForm, date })}
              dateFormat="yyyy-MM-dd"
              required
            />
          </div>
          <div className="form-group mb-3">
            <label>Available Doses</label>
            <input
              className="form-control"
              type="number"
              value={editForm.availableDoses}
              onChange={(e) => setEditForm({ ...editForm, availableDoses: e.target.value })}
              required
            />
          </div>
          <div className="form-group mb-3">
            <label>Applicable Classes (comma-separated)</label>
            <input
              className="form-control"
              value={editForm.applicableClasses}
              onChange={(e) => setEditForm({ ...editForm, applicableClasses: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="btn btn-success w-100">Update Drive</button>
          <button
            type="button"
            className="btn btn-secondary w-100 mt-2"
            onClick={() => setEditForm(null)}
          >
            Cancel
          </button>
        </form>
      )}

      
      <table className="table table-bordered">
        <thead>
          <tr>
            <th onClick={() => setSortField('vaccineName')}>
              Vaccine {sortField === 'vaccineName' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => setSortField('date')}>
              Date {sortField === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => setSortField('availableDoses')}>
            Available Doses {sortField === 'availableDoses' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th>Classes</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {sortedDrives.map((d) => (
            <tr key={d._id}>
              <td>{d.vaccineName}</td>
              <td>{new Date(d.date).toLocaleDateString()}</td>
              <td>{d.availableDoses}</td>
              <td>{d.applicableClasses.join(', ')}</td>
              <td>
                {new Date(d.date) > new Date() ? (
                  <span className="badge bg-success">Active</span>
                ) : new Date(d.date).toLocaleDateString() === new Date().toLocaleDateString() ? (
                  <span className="badge bg-warning text-dark">Ended</span>
                ) : (
                  <span className="badge bg-danger">Expired</span>
                )}
              </td>
              <td>
                {new Date(d.date) > new Date() ? (
                  <button
                    className="btn btn-warning btn-sm"
                    onClick={() =>
                      setEditForm({
                        ...d,
                        date: new Date(d.date),
                        applicableClasses: Array.isArray(d.applicableClasses)
                          ? d.applicableClasses.join(', ')
                          : d.applicableClasses
                      })
                    }
                  >
                    Edit
                  </button>
                ) : (
                  <button className="btn btn-secondary btn-sm" disabled>
                    Edit
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DrivePage;