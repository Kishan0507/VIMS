import React, { useState } from 'react';
import styles from './PolicyForm.module.css';


const initialVehiclesData = [
    { id: 1, vehicleNo: 'KA-01-AB-1234', model: 'Camry' },
    { id: 2, vehicleNo: 'MH-12-CD-5678', model: 'Civic' },
    { id: 3, vehicleNo: 'TN-07-EF-9012', model: 'Fortuner' },
];

const initialPoliciesData = [
    { id: 1, policyNo: 'POL-001', vehicleId: 1, startDate: '2024-01-15', endDate: '2025-01-14', amount: 15000, status: 'active' },
    { id: 2, policyNo: 'POL-002', vehicleId: 2, startDate: '2023-08-20', endDate: '2024-08-19', amount: 12500, status: 'expired' },
];


const PolicyPage = () => {
    const [policies, setPolicies] = useState(initialPoliciesData);
    const [vehicles] = useState(initialVehiclesData);
    const [searchQuery, setSearchQuery] = useState('');
    const [newPolicy, setNewPolicy] = useState({
        policyNo: '', vehicleId: '', startDate: '', endDate: '', amount: '', status: 'active'
    });

    
    const [isEditing, setIsEditing] = useState(false);
    const [currentPolicy, setCurrentPolicy] = useState(null);

    
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewPolicy(prev => ({ ...prev, [name]: value }));
    };

    const handleAddPolicy = (e) => {
        e.preventDefault();
        if (!newPolicy.policyNo || !newPolicy.vehicleId) {
            alert('Please fill out Policy Number and select a Vehicle.');
            return;
        }
        const newId = policies.length > 0 ? Math.max(...policies.map(p => p.id)) + 1 : 1;
        setPolicies(prev => [...prev, { ...newPolicy, id: newId, amount: Number(newPolicy.amount) }]);
        setNewPolicy({ policyNo: '', vehicleId: '', startDate: '', endDate: '', amount: '', status: 'active' });
    };

    const handleDeletePolicy = (policyId) => {
        setPolicies(prev => prev.filter(p => p.id !== policyId));
    };

    
    const handleEditClick = (policy) => {
        setCurrentPolicy({ ...policy }); 
        setIsEditing(true);
    };

    const handleUpdatePolicy = (e) => {
        e.preventDefault();
        setPolicies(prevPolicies =>
            prevPolicies.map(p => (p.id === currentPolicy.id ? currentPolicy : p))
        );
        setIsEditing(false);
        setCurrentPolicy(null);
    };

    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        setCurrentPolicy(prev => ({ ...prev, [name]: value }));
    };

    
    const filteredPolicies = policies.filter(policy =>
        policy.policyNo.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getVehicleDetails = (vehicleId) => {
        return vehicles.find(v => v.id === parseInt(vehicleId));
    };

    return (
        <div className={styles.pageContainer}>
            <div className={styles.header}><h1>Policy Management</h1></div>

            
            <div className={styles.addPolicyContainer}>
                <h2>Create New Policy</h2>
                <form onSubmit={handleAddPolicy} className={styles.form}>
                    <label>Policy Number:
                        <input type="text" name="policyNo" value={newPolicy.policyNo} onChange={handleInputChange} className={styles.input} required />
                    </label>
                    <label>Vehicle:
                        <select name="vehicleId" value={newPolicy.vehicleId} onChange={handleInputChange} className={styles.select} required>
                            <option value="" disabled>Select a vehicle</option>
                            {vehicles.map(vehicle => (
                                <option key={vehicle.id} value={vehicle.id}>
                                    {vehicle.vehicleNo} ({vehicle.model})
                                </option>
                            ))}
                        </select>
                    </label>
                    <label>Start Date:
                        <input type="date" name="startDate" value={newPolicy.startDate} onChange={handleInputChange} className={styles.input} required />
                    </label>
                    <label>End Date:
                        <input type="date" name="endDate" value={newPolicy.endDate} onChange={handleInputChange} className={styles.input} required />
                    </label>
                    <label>Amount (₹):
                        <input type="number" name="amount" value={newPolicy.amount} onChange={handleInputChange} className={styles.input} required />
                    </label>
                    <label>Status:
                        <select name="status" value={newPolicy.status} onChange={handleInputChange} className={styles.select}>
                            <option value="active">Active</option>
                            <option value="expired">Expired</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </label>
                    <button type="submit" className={styles.submitButton}>Create Policy</button>
                </form>
            </div>

            
            <div className={styles.searchContainer}>
                <input
                    type="text"
                    placeholder="Search by policy number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={styles.searchInput}
                />
            </div>

            
            <div className={styles.policyList}>
                {filteredPolicies.map(policy => {
                    const vehicle = getVehicleDetails(policy.vehicleId);
                    return (
                        <div key={policy.id} className={styles.policyCard}>
                             <div className={styles.cardActions}>
                                <button onClick={() => handleEditClick(policy)} className={styles.editButton}>✎</button>
                                <button onClick={() => handleDeletePolicy(policy.id)} className={styles.deleteButton}>×</button>
                            </div>
                            <h2>Policy #{policy.policyNo}</h2>
                            <p><strong>Vehicle:</strong> {vehicle ? `${vehicle.vehicleNo} (${vehicle.model})` : 'N/A'}</p>
                            <p><strong>Period:</strong> {policy.startDate} to {policy.endDate}</p>
                            <p><strong>Amount:</strong> ₹{Number(policy.amount).toLocaleString('en-IN')}</p>
                            <p><strong>Status:</strong> <span className={`${styles.status} ${styles[`status-${policy.status}`]}`}>{policy.status.charAt(0).toUpperCase() + policy.status.slice(1)}</span></p>
                        </div>
                    );
                })}
            </div>

            
            {isEditing && currentPolicy && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h2>Edit Policy #{currentPolicy.policyNo}</h2>
                        <form onSubmit={handleUpdatePolicy} className={styles.form}>
                             <label>Policy Number:
                                <input type="text" name="policyNo" value={currentPolicy.policyNo} onChange={handleEditFormChange} className={styles.input} required />
                            </label>
                            <label>Vehicle:
                                <select name="vehicleId" value={currentPolicy.vehicleId} onChange={handleEditFormChange} className={styles.select} required>
                                    {vehicles.map(vehicle => (
                                        <option key={vehicle.id} value={vehicle.id}>{vehicle.vehicleNo}</option>
                                    ))}
                                </select>
                            </label>
                            <label>Start Date:
                                <input type="date" name="startDate" value={currentPolicy.startDate} onChange={handleEditFormChange} className={styles.input} required />
                            </label>
                            <label>End Date:
                                <input type="date" name="endDate" value={currentPolicy.endDate} onChange={handleEditFormChange} className={styles.input} required />
                            </label>
                            <label>Amount (₹):
                                <input type="number" name="amount" value={currentPolicy.amount} onChange={handleEditFormChange} className={styles.input} required />
                            </label>
                             <label>Status:
                                <select name="status" value={currentPolicy.status} onChange={handleEditFormChange} className={styles.select}>
                                    <option value="active">Active</option>
                                    <option value="expired">Expired</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </label>
                            <div className={`${styles.modalActions} ${styles.fullWidth}`}>
                                <button type="button" onClick={() => setIsEditing(false)} className={styles.cancelButton}>Cancel</button>
                                <button type="submit" className={styles.saveButton}>Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
export default PolicyPage;