import React, { useState } from 'react';
import styles from './OwnerForm.module.css';

// --- SIMULATED DATABASE DATA (You can reuse this from your VehiclePage) ---
const initialOwnersData = [
    { id: 1, name: 'Anjali Sharma', address: '123 MG Road, Bangalore', phone: '9876543210' },
    { id: 2, name: 'Rohan Mehta', address: '456 Park Street, Mumbai', phone: '8765432109' },
    { id: 3, name: 'Priya Singh', address: '789 High-Tech City, Hyderabad', phone: '7654321098' }
];

const initialVehiclesData = [
    { id: 1, vehicleNo: 'KA-01-AB-1234', model: 'Camry', ownerId: 1 },
    { id: 2, vehicleNo: 'MH-12-CD-5678', model: 'Civic', ownerId: 2 },
    { id: 3, vehicleNo: 'TN-07-EF-9012', model: 'Fortuner', ownerId: 1 },
];
// ----------------------------------------------------------------------

const OwnerPage = () => {
    // State for owners, vehicles, form, and search
    const [owners, setOwners] = useState(initialOwnersData);
    const [vehicles, setVehicles] = useState(initialVehiclesData);
    const [searchQuery, setSearchQuery] = useState('');
    const [newOwner, setNewOwner] = useState({ name: '', address: '', phone: '' });

    // --- LOGIC HANDLERS ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewOwner(prev => ({ ...prev, [name]: value }));
    };

    const handleAddOwner = (e) => {
        e.preventDefault();
        if (!newOwner.name || !newOwner.phone) {
            alert('Name and Phone are required.');
            return;
        }
        const newId = owners.length > 0 ? Math.max(...owners.map(o => o.id)) + 1 : 1;
        setOwners(prev => [...prev, { ...newOwner, id: newId }]);
        setNewOwner({ name: '', address: '', phone: '' }); // Reset form
    };

    const handleDeleteOwner = (ownerId) => {
        // Also remove vehicles associated with this owner to prevent orphaned data
        setVehicles(prev => prev.filter(v => v.ownerId !== ownerId));
        setOwners(prev => prev.filter(o => o.id !== ownerId));
    };
    
    // --- FILTERING LOGIC ---
    const filteredOwners = owners.filter(owner =>
        owner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        owner.phone.includes(searchQuery)
    );

    return (
        <div className={styles.pageContainer}>
            <div className={styles.header}><h1>Owner Management</h1></div>

            {/* Add Owner Form */}
            <div className={styles.addOwnerContainer}>
                <h2>Add New Owner</h2>
                <form onSubmit={handleAddOwner} className={styles.form}>
                    <label>Full Name: <input type="text" name="name" value={newOwner.name} onChange={handleInputChange} className={styles.input} required /></label>
                    <label>Phone Number: <input type="tel" name="phone" value={newOwner.phone} onChange={handleInputChange} className={styles.input} required /></label>
                    <label className={styles.addressInput}>Address: <input type="text" name="address" value={newOwner.address} onChange={handleInputChange} className={styles.input} /></label>
                    <button type="submit" className={styles.submitButton}>Add Owner</button>
                </form>
            </div>

            {/* Search Bar */}
            <div className={styles.searchContainer}>
                <input
                    type="text"
                    placeholder="Search by name or phone number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={styles.searchInput}
                />
            </div>

            {/* Owner List */}
            <div className={styles.ownerList}>
                {filteredOwners.map(owner => {
                    // Find vehicles for the current owner
                    const ownersVehicles = vehicles.filter(v => v.ownerId === owner.id);
                    return (
                        <div key={owner.id} className={styles.ownerCard}>
                            <button onClick={() => handleDeleteOwner(owner.id)} className={styles.deleteButton}>×</button>
                            <div className={styles.ownerInfo}>
                                <h2>{owner.name}</h2>
                                <p><strong>Phone:</strong> {owner.phone}</p>
                                <p><strong>Address:</strong> {owner.address}</p>
                            </div>
                            <div className={styles.vehiclesSection}>
                                <h3>Owned Vehicles:</h3>
                                {ownersVehicles.length > 0 ? (
                                    ownersVehicles.map(vehicle => (
                                        <div key={vehicle.id} className={styles.vehicleItem}>
                                            {vehicle.vehicleNo} ({vehicle.model})
                                        </div>
                                    ))
                                ) : (
                                    <p className={styles.noVehicles}>No vehicles registered.</p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default OwnerPage;