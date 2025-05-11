import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { Modal, Button, Form } from 'react-bootstrap';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Papa from 'papaparse';

const StudentPage = () => {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({ name: '', studentId: '', class: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [drives, setDrives] = useState([]);
  const [selectedVaccine, setSelectedVaccine] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editStudent, setEditStudent] = useState({ name: '', class: '' });
  const [csvFile, setCsvFile] = useState(null);
  const [vaccineDetails, setVaccineDetails] = useState({
    driveId: '',
    vaccineName: '',
    date: '',
  });
  const [sortField, setSortField] = useState('studentId');
  const [sortOrder, setSortOrder] = useState('asc');

  const fetchStudents = async () => {
    try {
      const res = await API.get('/students');
      setStudents(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDrives = async () => {
    try {
      const res = await API.get('/drives?upcoming=true');
      setDrives(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchDrives();
  }, []);

  const handleSort = (field) => {
    const order = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(order);

    const sortedStudents = [...students].sort((a, b) => {
      if (field === 'class') {
        return order === 'asc'
          ? parseInt(a[field], 10) - parseInt(b[field], 10)
          : parseInt(b[field], 10) - parseInt(a[field], 10);
      } else {
        if (order === 'asc') {
          return a[field] > b[field] ? 1 : -1;
        } else {
          return a[field] < b[field] ? 1 : -1;
        }
      }
    });

    setStudents(sortedStudents);
  };

  const openVaccinationModal = async (student) => {
    setSelectedStudent(student);

    const alreadyVaccinated = student.vaccinationRecords.some(
      (record) => record.vaccineName === selectedVaccine
    );

    const selectedDrive = drives.find((drive) => drive.vaccineName === selectedVaccine);

    setVaccineDetails({
      driveId: selectedDrive?._id || '',
      vaccineName: selectedDrive?.vaccineName || '',
      date: '',
    });

    try {
      const res = await API.get('/drives?upcoming=true');
      setDrives(res.data);
      setShowModal(true);


    } catch (err) {
      console.error('Error fetching vaccination drives:', err);
      alert('Failed to fetch vaccination drives. Please try again.');
    }
  };

  const handleVaccinationSubmit = async () => {
    if (!vaccineDetails.driveId || !vaccineDetails.vaccineName || !vaccineDetails.date) {
      alert('Please fill all fields');
      return;
    }

    try {
      await API.put(`/students/${selectedStudent.studentId}/vaccinate`, vaccineDetails);
      fetchStudents();
      setShowModal(false);
      setVaccineDetails({ driveId: '', vaccineName: '', date: '' });

      toast.success('Student marked as vaccinated successfully!', {
        position: 'top-center',
        autoClose: 3000,
      });
    } catch (err) {
      if (err.response.data.message == 'Already vaccinated for this vaccine' || err.response.data.message == 'No available doses for this vaccination drive') {
        toast.error(err.response?.data?.message || 'Error updating vaccination.', {
          position: 'top-center',
          autoClose: 3000,
        });
      } else {
        alert(err.response?.data?.message || 'Error updating vaccination');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const classValue = parseInt(form.class, 10);
    if (isNaN(classValue) || classValue < 1 || classValue > 12) {
      toast.error('Class must be a number between 1 and 12.', {
        position: 'top-center',
        autoClose: 3000,
      });
      return;
    }

    try {
      await API.post('/students', form);
      fetchStudents();
      setForm({ name: '', studentId: '', class: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding student');
    }
  };

  const openEditModal = (student) => {
    setEditStudent({ name: student.name, class: student.class });
    setSelectedStudent(student);
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    const classValue = parseInt(editStudent.class, 10);
    if (isNaN(classValue) || classValue < 1 || classValue > 12) {
      toast.error('Class must be a number between 1 and 12.', {
        position: 'top-center',
        autoClose: 3000,
      });
      return;
    }

    try {
      const res = await API.put(`/students/${selectedStudent.studentId}`, editStudent);
      fetchStudents();
      setShowEditModal(false);
      toast.success('Student details updated successfully!', {
        position: 'top-center',
        autoClose: 3000,
      });
    } catch (err) {
      console.error('Error updating student:', err);
      toast.error(err.response?.data?.message || 'Error updating student.', {
        position: 'top-center',
        autoClose: 3000,
      });
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile) {
      toast.error('Please select a CSV file.', {
        position: 'top-center',
        autoClose: 3000,
      });
      return;
    }

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const studentsData = results.data.map((row) => ({
            studentId: row.studentId,
            name: row.name,
            class: row.class,
          }));

          const isValid = studentsData.every(
            (student) =>
              student.studentId &&
              student.name &&
              !isNaN(parseInt(student.class, 10)) &&
              parseInt(student.class, 10) >= 1 &&
              parseInt(student.class, 10) <= 12
          );

          if (!isValid) {
            toast.error('Invalid data in CSV file. Please check the format.', {
              position: 'top-center',
              autoClose: 3000,
            });
            return;
          }

          for (const student of studentsData) {
            try {
              await API.post('/students', student);
            } catch (err) {
              console.error(`Error adding student ${student.studentId}:`, err);
              toast.error(
                `Error adding student ${student.studentId}: ${err.response?.data?.message || 'Unknown error'}`,
                {
                  position: 'top-center',
                  autoClose: 3000,
                }
              );
            }
          }

          fetchStudents();
          toast.success('All valid students imported successfully!', {
            position: 'top-center',
            autoClose: 3000,
          });
        } catch (err) {
          console.error('Error processing CSV:', err);
          toast.error('Error processing CSV file.', {
            position: 'top-center',
            autoClose: 3000,
          });
        }
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        toast.error('Error parsing CSV file.', {
          position: 'top-center',
          autoClose: 3000,
        });
      },
    });
  };

  const filteredStudentsAll = students.filter((student) => {
    const matchesSearchTerm =
      student.studentId.toLowerCase().includes(searchTerm) ||
      student.name.toLowerCase().includes(searchTerm) ||
      student.class.toString().includes(searchTerm);

    if (!selectedVaccine) return matchesSearchTerm;

    const vaccineDrive = drives.find((drive) => drive.vaccineName === selectedVaccine);
    if (!vaccineDrive) return false;

    return matchesSearchTerm && vaccineDrive.applicableClasses.includes(student.class);
  });



  const filteredStudents = students.filter((student) => {
    const matchesSearchTerm =
      student.studentId.toLowerCase().includes(searchTerm) ||
      student.name.toLowerCase().includes(searchTerm) ||
      student.class.toString().includes(searchTerm);
  
    if (!selectedVaccine) return matchesSearchTerm;
  
    const vaccineDrive = drives.find((drive) => drive.vaccineName === selectedVaccine);
    if (!vaccineDrive) return false;
  
    return matchesSearchTerm && vaccineDrive.applicableClasses.includes(student.class);
  });

  const vaccinatedStudents = filteredStudents.filter((student) =>
    student.vaccinationRecords.some((record) => record.vaccineName === selectedVaccine)
  );

  const notVaccinatedStudents = filteredStudents.filter((student) =>
    !student.vaccinationRecords.some((record) => record.vaccineName === selectedVaccine)
  );

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Manage Students</h2>

      <form onSubmit={handleSubmit} className="mb-4">
        <div className="row g-3">
          <div className="col-md-3">
            <input
              className="form-control"
              placeholder="Student ID"
              value={form.studentId}
              onChange={(e) => setForm({ ...form, studentId: e.target.value })}
              required
            />
          </div>
          <div className="col-md-3">
            <input
              className="form-control"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="col-md-3">
            <input
              className="form-control"
              placeholder="Class"
              value={form.class}
              onChange={(e) => setForm({ ...form, class: e.target.value })}
              required
            />
          </div>
          <div className="col-md-3">
            <button type="submit" className="btn btn-primary w-100">
              Add Student
            </button>
          </div>
        </div>
      </form>

      <div className="mb-4">
        <input
          type="file"
          accept=".csv"
          className="form-control"
          onChange={(e) => setCsvFile(e.target.files[0])}
        />
        <button
          className="btn btn-primary mt-2"
          onClick={handleCsvUpload}
          disabled={!csvFile}
        >
          Upload CSV
        </button>
      </div>

      <div className="mb-4">
        <Form.Select
          value={selectedVaccine}
          onChange={(e) => setSelectedVaccine(e.target.value)}
        >
          <option value="">Show All Vaccines</option>
          {drives.map((drive) => (
            <option key={drive._id} value={drive.vaccineName}>
              {drive.vaccineName}
            </option>
          ))}
        </Form.Select>
      </div>

      <input
        className="form-control mb-4"
        placeholder="Search by ID, name, or class..."
        onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
      />

      {selectedVaccine ? (
        <>
          <h3 className="mt-4">Vaccinated Students</h3>
          <table className="table table-bordered">
            <thead>
              <tr>
                <th onClick={() => handleSort('studentId')} style={{ cursor: 'pointer' }}>
                  ID {sortField === 'studentId' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                  Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('class')} style={{ cursor: 'pointer' }}>
                  Class {sortField === 'class' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
              </tr>
            </thead>
            <tbody>
              {vaccinatedStudents.map((s) => (
                <tr key={s._id}>
                  <td>{s.studentId}</td>
                  <td>{s.name}</td>
                  <td>{s.class}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 className="mt-4">Not Vaccinated Students</h3>
          <table className="table table-bordered">
            <thead>
              <tr>
                <th onClick={() => handleSort('studentId')} style={{ cursor: 'pointer' }}>
                  ID {sortField === 'studentId' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                  Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('class')} style={{ cursor: 'pointer' }}>
                  Class {sortField === 'class' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
              </tr>
            </thead>
            <tbody>
              {notVaccinatedStudents.map((s) => (
                <tr key={s._id}>
                  <td>{s.studentId}</td>
                  <td>{s.name}</td>
                  <td>{s.class}</td>
                  <td>
                    <button
                      className="btn btn-success"
                      onClick={() => openVaccinationModal(s)}
                    >
                      Mark Vaccinated
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <table className="table table-bordered">
          <thead>
            <tr>
              <th onClick={() => handleSort('studentId')} style={{ cursor: 'pointer' }}>
                ID {sortField === 'studentId' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('class')} style={{ cursor: 'pointer' }}>
                Class {sortField === 'class' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((s) => (
              <tr key={s._id}>
                <td>{s.studentId}</td>
                <td>{s.name}</td>
                <td>{s.class}</td>
                <td>
                  <button
                    className="btn btn-warning me-2"
                    onClick={() => openEditModal(s)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-success"
                    onClick={() => openVaccinationModal(s)}
                  >
                    Mark Vaccinated
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Student Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter Name"
                value={editStudent.name}
                onChange={(e) => setEditStudent({ ...editStudent, name: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Class</Form.Label>
              <Form.Control
                type="number"
                placeholder="Enter Class"
                value={editStudent.class}
                onChange={(e) => setEditStudent({ ...editStudent, class: e.target.value })}
                min="1"
                max="12"
                required
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={handleEditSubmit}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Mark Vaccinated</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Vaccination Drive</Form.Label>
              <Form.Select
                value={vaccineDetails.driveId}
                onChange={(e) => {
                  const selectedDrive = drives.find((drive) => drive._id === e.target.value);
                  setVaccineDetails({
                    ...vaccineDetails,
                    driveId: selectedDrive?._id || '',
                    vaccineName: selectedDrive?.vaccineName || '',
                    date: '',
                  });
                }}
                disabled={!!selectedVaccine}
              >
                <option value="">Select Drive</option>
                {drives.map((drive) => (
                  <option key={drive._id} value={drive._id}>
                    {drive.vaccineName} - {new Date(drive.date).toLocaleDateString()} (Classes: {drive.applicableClasses.join(', ')})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Vaccine Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Vaccine Name"
                value={vaccineDetails.vaccineName}
                readOnly
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                value={vaccineDetails.date}
                onChange={(e) => setVaccineDetails({ ...vaccineDetails, date: e.target.value })}
                min={vaccineDetails.driveId ? new Date().toISOString().split('T')[0] : ''}
                max={
                  vaccineDetails.driveId
                    ? new Date(drives.find((drive) => drive._id === vaccineDetails.driveId)?.date)
                      .toISOString()
                      .split('T')[0]
                    : ''
                }
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
          <Button
            variant="primary"
            onClick={handleVaccinationSubmit}
            disabled={
              selectedStudent?.vaccinationRecords.some(
                (record) => record.vaccineName === selectedVaccine
              )
            }
          >
            Submit
          </Button>
        </Modal.Footer>
      </Modal>

      <ToastContainer />
    </div>
  );
};

export default StudentPage;