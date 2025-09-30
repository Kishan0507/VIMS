import React, { useState } from 'react';
import styles from './PolicyForm.module.css';

// --- SIMULATED DATABASE DATA (This should eventually come from your backend or App.jsx) ---
const initialVehiclesData = [
    { id: 1, vehicleNo: 'KA-01-AB-1234', model: 'Camry', ownerId: 1 },
    { id: 2, vehicleNo: 'MH-12-CD-5678', model: 'Civic', ownerId: 2 },
    { id: 3, vehicleNo: 'TN-07-EF-9012', model: 'Fortuner', ownerId: 1 },
];

const initialPoliciesData = [
    { id: 1, policyNo: 'POL-001', vehicleId: 1, startDate: '2024-01-15', endDate: '2025-01-14', amount: 15000, status: 'active' },
    { id: 2, policyNo: 'POL-002', vehicleId: 2, startDate: '2023-08-20', endDate: '2024-08-19', amount: 12500, status: 'expired' },
];
// ----------------------------------------------------------------------

const PolicyPage = () => {
    // State for policies, vehicles, form, and search
    const [policies, setPolicies] = useState(initialPoliciesData);
    const [vehicles] = useState(initialVehiclesData); // Assuming this is static for now
    const [searchQuery, setSearchQuery] = useState('');
    const [newPolicy, setNewPolicy] = useState({
        policyNo: '',
        vehicleId: '',
        startDate: '',
        endDate: '',
        amount: '',
        status: 'active'
    });

    // --- LOGIC HANDLERS ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewPolicy(prev => ({ ...prev, [name]: value }));
    };

    const handleAddPolicy = (e) => {
        e.preventDefault();
        if (!newPolicy.policyNo || !newPolicy.vehicleId || !newPolicy.startDate || !newPolicy.endDate) {
            alert('Please fill out all required fields.');
            return;
        }
        const newId = policies.length > 0 ? Math.max(...policies.map(p => p.id)) + 1 : 1;
        setPolicies(prev => [...prev, { ...newPolicy, id: newId }]);
        // Reset form
        setNewPolicy({ policyNo: '', vehicleId: '', startDate: '', endDate: '', amount: '', status: 'active' });
    };

    const handleDeletePolicy = (policyId) => {
        setPolicies(prev => prev.filter(p => p.id !== policyId));
    };
    
    // --- FILTERING LOGIC ---
    const filteredPolicies = policies.filter(policy =>
        policy.policyNo.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Helper to get vehicle details for a policy
    const getVehicleDetails = (vehicleId) => {
        return vehicles.find(v => v.id === parseInt(vehicleId));
    };

    return (
        <div className={styles.pageContainer}>
            <div className={styles.header}><h1>Policy Management</h1></div>

            {/* Add Policy Form */}
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

            {/* Search Bar */}
            <div className={styles.searchContainer}>
                <input
                    type="text"
                    placeholder="Search by policy number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={styles.searchInput}
                />
            </div>

            {/* Policy List */}
            <div className={styles.policyList}>
                {filteredPolicies.map(policy => {
                    const vehicle = getVehicleDetails(policy.vehicleId);
                    return (
                        <div key={policy.id} className={styles.policyCard}>
                             <button onClick={() => handleDeletePolicy(policy.id)} className={styles.deleteButton}>×</button>
                            <h2>Policy #{policy.policyNo}</h2>
                            <p><strong>Vehicle:</strong> {vehicle ? `${vehicle.vehicleNo} (${vehicle.model})` : 'N/A'}</p>
                            <p><strong>Period:</strong> {policy.startDate} to {policy.endDate}</p>
                            <p><strong>Amount:</strong> ₹{Number(policy.amount).toLocaleString('en-IN')}</p>
                            <p><strong>Status:</strong> <span className={`${styles.status} ${styles[`status-${policy.status}`]}`}>{policy.status.charAt(0).toUpperCase() + policy.status.slice(1)}</span></p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PolicyPage;