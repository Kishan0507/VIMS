import React, { useState } from 'react';
import styles from './Vehicle.module.css';

// --- SIMULATED DATABASE DATA (This should eventually come from your backend) ---
// Note: We're now storing the owner's name directly with the vehicle.
const initialVehiclesData = [
    { id: 1, vehicleNo: 'KA-01-AB-1234', model: 'Camry', year: 2021, vin: 'VIN123ABC', ownerName: 'John Doe' },
    { id: 2, vehicleNo: 'MH-12-CD-5678', model: 'Civic', year: 2022, vin: 'VIN456DEF', ownerName: 'Jane Smith' },
    { id: 3, vehicleNo: 'TN-07-EF-9012', model: 'Fortuner', year: 2020, vin: 'VIN789GHI', ownerName: 'John Doe' },
];
// ----------------------------------------------------------------------

const VehiclePage = () => {
    const [vehicles, setVehicles] = useState(initialVehiclesData);
    const [searchQuery, setSearchQuery] = useState('');
    const [newVehicle, setNewVehicle] = useState({
        vehicleNo: '',
        model: '',
        year: '',
        vin: '',
        ownerName: '' // Changed from ownerId to ownerName
    });

    // --- LOGIC HANDLERS ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewVehicle(prev => ({ ...prev, [name]: value }));
    };

    const handleAddVehicle = (e) => {
        e.preventDefault();
        if (!newVehicle.vehicleNo || !newVehicle.ownerName) {
            alert('Please fill out Vehicle No. and Owner Name.');
            return;
        }
        const newId = vehicles.length > 0 ? Math.max(...vehicles.map(v => v.id)) + 1 : 1;
        setVehicles(prev => [...prev, { ...newVehicle, id: newId }]);
        // Reset form
        setNewVehicle({ vehicleNo: '', model: '', year: '', vin: '', ownerName: '' });
    };

    const handleDeleteVehicle = (vehicleId) => {
        setVehicles(prev => prev.filter(v => v.id !== vehicleId));
    };

    // --- FILTERING LOGIC ---
    const filteredVehicles = vehicles.filter(vehicle => {
        const ownerName = vehicle.ownerName.toLowerCase();
        const vehicleNo = vehicle.vehicleNo.toLowerCase();
        const query = searchQuery.toLowerCase();
        return ownerName.includes(query) || vehicleNo.includes(query);
    });

    return (
        <div className={styles.pageContainer}>
            <div className={styles.header}><h1>Vehicle Management</h1></div>

            {/* Add Vehicle Form */}
            <div className={styles.formContainer}>
                <h2>Add New Vehicle</h2>
                <form onSubmit={handleAddVehicle} className={styles.form}>
                    <label>Vehicle No:
                        <input type="text" name="vehicleNo" value={newVehicle.vehicleNo} onChange={handleInputChange} className={styles.input} required />
                    </label>
                    <label>Model:
                        <input type="text" name="model" value={newVehicle.model} onChange={handleInputChange} className={styles.input} />
                    </label>
                    <label>Year:
                        <input type="number" name="year" value={newVehicle.year} onChange={handleInputChange} className={styles.input} />
                    </label>
                    <label>VIN:
                        <input type="text" name="vin" value={newVehicle.vin} onChange={handleInputChange} className={styles.input} />
                    </label>
                    <label className={styles.fullWidth}>Owner Name:
                        <input type="text" name="ownerName" value={newVehicle.ownerName} onChange={handleInputChange} className={styles.input} required />
                    </label>
                    <button type="submit" className={styles.submitButton}>Add Vehicle</button>
                </form>
            </div>

            {/* Search Bar */}
            <div className={styles.searchContainer}>
                <input
                    type="text"
                    placeholder="Search by owner name or vehicle no..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={styles.searchInput}
                />
            </div>

            {/* Vehicle List */}
            <div className={styles.vehicleList}>
                {filteredVehicles.map(vehicle => (
                    <div key={vehicle.id} className={styles.vehicleCard}>
                        <button onClick={() => handleDeleteVehicle(vehicle.id)} className={styles.deleteButton}>×</button>
                        <h2>{vehicle.vehicleNo}</h2>
                        <p><strong>Owner:</strong> {vehicle.ownerName}</p>
                        <p><strong>Model:</strong> {vehicle.model || 'N/A'}</p>
                        <p><strong>Year:</strong> {vehicle.year || 'N/A'}</p>
                        <p><strong>VIN:</strong> {vehicle.vin || 'N/A'}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VehiclePage;
