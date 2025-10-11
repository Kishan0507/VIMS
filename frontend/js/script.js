document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const API_BASE_URL = 'http://localhost:8000/api';
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    // --- GLOBAL STATE (to cache data) ---
    let owners = [], vehicles = [], policies = [], accidents = [];

    // --- GENERIC API REQUEST FUNCTION ---
    async function apiRequest(endpoint, method = 'GET', body = null) {
        const config = { method, headers: { 'Content-Type': 'application/json' } };
        if (body) config.body = JSON.stringify(body);
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const errorBanner = document.getElementById('error-banner');
            if (errorBanner) errorBanner.classList.add('hidden');
            return response.status === 204 ? true : await response.json();
        } catch (error) {
            console.error(`Failed to ${method} ${endpoint}:`, error);
            const errorBanner = document.getElementById('error-banner');
            if (errorBanner) errorBanner.classList.remove('hidden');
            return null;
        }
    }

    // --- PAGE-SPECIFIC INITIALIZATION ---

    // --- OWNERS PAGE LOGIC ---
    if (currentPage === 'owners.html') {
        const ownerForm = document.getElementById('add-owner-form');
        const ownersList = document.getElementById('owners-list');

        async function fetchAndRenderOwners() {
            const data = await apiRequest('/owners/');
            if (data) {
                owners = data;
                ownersList.innerHTML = owners.map(o => `
                    <div class="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow">
                        <h3 class="font-bold text-xl text-gray-800">${o.fullName}</h3>
                        <p class="text-gray-600 mt-1">${o.address}</p>
                        <p class="text-gray-500 text-sm mt-1">${o.phoneNumber}</p>
                        <div class="mt-4 flex space-x-3 border-t pt-3">
                            <button class="text-sm text-blue-600 font-semibold hover:underline edit-btn" data-type="owner" data-id="${o.id}">Edit</button>
                            <button class="text-sm text-red-600 font-semibold hover:underline delete-btn" data-type="owner" data-id="${o.id}">Delete</button>
                        </div>
                    </div>`).join('');
            }
        }

        ownerForm.addEventListener('submit', async e => {
            e.preventDefault();
            const newOwner = {
                fullName: document.getElementById('owner-fullName').value,
                address: document.getElementById('owner-address').value,
                phoneNumber: document.getElementById('owner-phoneNumber').value
            };
            if (await apiRequest('/owners/', 'POST', newOwner)) {
                fetchAndRenderOwners();
                ownerForm.reset();
            }
        });

        ownersList.addEventListener('click', e => {
            const { type, id } = e.target.dataset;
            if (e.target.classList.contains('delete-btn') && type === 'owner' && confirm('Are you sure?')) {
                apiRequest(`/owners/${id}/`, 'DELETE').then(success => {
                    if (success) fetchAndRenderOwners();
                });
            }
            if (e.target.classList.contains('edit-btn') && type === 'owner') {
                const owner = owners.find(o => o.id == id);
                if (owner) showEditModal('owner', owner);
            }
        });

        fetchAndRenderOwners();
    }

    // --- VEHICLES PAGE LOGIC ---
    if (currentPage === 'vehicles.html') {
        const vehicleForm = document.getElementById('add-vehicle-form');
        const vehiclesList = document.getElementById('vehicles-list');
        const ownerSelect = document.getElementById('vehicle-owner');

        async function populateOwnerDropdown(selectElement = ownerSelect, selectedId = null) {
            const ownerData = await apiRequest('/owners/');
            if (ownerData) {
                owners = ownerData;
                selectElement.innerHTML = '<option value="">Select Owner</option>';
                owners.forEach(o => {
                    const option = document.createElement('option');
                    option.value = o.id;
                    option.textContent = o.fullName;
                    if (selectedId && o.id == selectedId) {
                        option.selected = true;
                    }
                    selectElement.appendChild(option);
                });
            }
        }

        async function fetchAndRenderVehicles() {
            await populateOwnerDropdown();
            const vehicleData = await apiRequest('/vehicles/');
            if (vehicleData) {
                vehicles = vehicleData;
                vehiclesList.innerHTML = vehicles.map(v => {
                    const owner = owners.find(o => o.id === v.owner);
                    return `
                    <div class="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow">
                        <h3 class="font-bold text-xl">${v.model} (${v.year})</h3>
                        <p class="font-mono text-gray-700 mt-1">${v.vehicle_no}</p>
                        <p class="text-sm text-gray-600">Owner: ${owner ? owner.fullName : 'N/A'}</p>
                        <p class="text-xs text-gray-400 mt-2">VIN: ${v.vin}</p>
                        <div class="mt-4 flex space-x-3 border-t pt-3">
                            <button class="text-sm text-blue-600 font-semibold hover:underline edit-btn" data-type="vehicle" data-id="${v.id}">Edit</button>
                            <button class="text-sm text-red-600 font-semibold hover:underline delete-btn" data-type="vehicle" data-id="${v.id}">Delete</button>
                        </div>
                    </div>`;
                }).join('');
            }
        }

        vehicleForm.addEventListener('submit', async e => {
            e.preventDefault();
            const newVehicle = {
                vehicle_no: document.getElementById('vehicle-vehicle_no').value,
                model: document.getElementById('vehicle-model').value,
                year: document.getElementById('vehicle-year').value,
                vin: document.getElementById('vehicle-vin').value,
                owner: document.getElementById('vehicle-owner').value
            };
            if (await apiRequest('/vehicles/', 'POST', newVehicle)) {
                fetchAndRenderVehicles();
                vehicleForm.reset();
            }
        });

        vehiclesList.addEventListener('click', e => {
            const { type, id } = e.target.dataset;
            if (e.target.classList.contains('delete-btn') && type === 'vehicle' && confirm('Are you sure?')) {
                apiRequest(`/vehicles/${id}/`, 'DELETE').then(success => {
                    if (success) fetchAndRenderVehicles();
                });
            }
            if (e.target.classList.contains('edit-btn') && type === 'vehicle') {
                const vehicle = vehicles.find(v => v.id == id);
                if (vehicle) showEditModal('vehicle', vehicle);
            }
        });

        fetchAndRenderVehicles();
    }

    // --- POLICIES PAGE LOGIC ---
    if (currentPage === 'policies.html') {
        const policyForm = document.getElementById('add-policy-form');
        const policiesList = document.getElementById('policies-list');
        const vehicleSelect = document.getElementById('policy-vehicle');

        async function populateVehicleDropdown(selectElement = vehicleSelect, selectedId = null) {
             const vehicleData = await apiRequest('/vehicles/');
            if (vehicleData) {
                vehicles = vehicleData;
                selectElement.innerHTML = '<option value="">Select Vehicle</option>';
                vehicles.forEach(v => {
                    const option = document.createElement('option');
                    option.value = v.id;
                    option.textContent = `${v.vehicle_no} (${v.model})`;
                     if (selectedId && v.id == selectedId) {
                        option.selected = true;
                    }
                    selectElement.appendChild(option);
                });
            }
        }

        async function fetchAndRenderPolicies() {
            await populateVehicleDropdown(); // Ensure vehicles are loaded first
            const policyData = await apiRequest('/policies/');
            if (policyData) {
                policies = policyData;
                policiesList.innerHTML = policies.map(p => {
                    const vehicle = vehicles.find(v => v.id === p.vehicle);
                    return `
                    <div class="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow">
                        <h3 class="font-bold text-xl">Policy #${p.policy_no}</h3>
                        <p class="text-sm text-gray-600 mt-1">Vehicle: ${vehicle ? vehicle.vehicle_no : 'N/A'}</p>
                        <p class="text-sm text-gray-500">${p.start_date} to ${p.end_date}</p>
                        <p class="font-semibold text-lg mt-2">₹${Number(p.amount).toLocaleString('en-IN')}</p>
                        <p class="mt-2"><span class="status-badge status-${p.status}">${p.status}</span></p>
                        <div class="mt-4 flex space-x-3 border-t pt-3">
                            <button class="text-sm text-blue-600 font-semibold hover:underline edit-btn" data-type="policy" data-id="${p.id}">Edit</button>
                            <button class="text-sm text-red-600 font-semibold hover:underline delete-btn" data-type="policy" data-id="${p.id}">Delete</button>
                        </div>
                    </div>`;
                }).join('');
            }
        }
        
        policyForm.addEventListener('submit', async e => {
            e.preventDefault();
            const newPolicy = {
                policy_no: document.getElementById('policy-policy_no').value,
                start_date: document.getElementById('policy-start_date').value,
                end_date: document.getElementById('policy-end_date').value,
                amount: document.getElementById('policy-amount').value,
                status: document.getElementById('policy-status').value,
                vehicle: document.getElementById('policy-vehicle').value,
            };
            if (await apiRequest('/policies/', 'POST', newPolicy)) {
                fetchAndRenderPolicies();
                policyForm.reset();
            }
        });
        
        policiesList.addEventListener('click', e => {
            const { type, id } = e.target.dataset;
            if (e.target.classList.contains('delete-btn') && type === 'policy' && confirm('Are you sure?')) {
                 apiRequest(`/policies/${id}/`, 'DELETE').then(success => {
                    if (success) fetchAndRenderPolicies();
                });
            }
            if (e.target.classList.contains('edit-btn') && type === 'policy') {
                const policy = policies.find(p => p.id == id);
                if (policy) showEditModal('policy', policy);
            }
        });

        fetchAndRenderPolicies();
    }
    
    // --- ACCIDENTS PAGE LOGIC ---
    if (currentPage === 'accidents.html') {
        const accidentForm = document.getElementById('add-accident-form');
        const accidentsList = document.getElementById('accidents-list');
        const vehicleSelect = document.getElementById('accident-vehicle');

        async function populateVehicleDropdownForAccidents() {
            const vehicleData = await apiRequest('/vehicles/');
            if (vehicleData) {
                vehicles = vehicleData;
                vehicleSelect.innerHTML = '<option value="">Select a vehicle</option>';
                vehicles.forEach(v => {
                    const option = document.createElement('option');
                    option.value = v.id;
                    option.textContent = `${v.vehicle_no} (${v.model})`;
                    vehicleSelect.appendChild(option);
                });
            }
        }
        
        async function fetchAndRenderAccidents() {
            // NOTE: This requires a /accidents/ API endpoint in your Django backend.
            const data = await apiRequest('/accidents/');
            if (data) {
                accidents = data;
                accidentsList.innerHTML = data.map(a => {
                    const vehicle = vehicles.find(v => v.id === a.vehicle);
                    return `
                    <div class="bg-white p-6 rounded-lg shadow-md">
                        <h3 class="font-bold text-lg">Accident on ${a.accident_date}</h3>
                        <p class="text-sm text-gray-600 mt-1">Vehicle: ${vehicle ? vehicle.vehicle_no : 'N/A'}</p>
                        <p class="text-sm text-gray-500">Location: ${a.location}</p>
                        <p class="text-gray-700 mt-2 text-sm">${a.description}</p>
                         <div class="mt-4 flex space-x-3 border-t pt-3">
                            <button class="text-sm text-blue-600 font-semibold hover:underline edit-btn" data-type="accident" data-id="${a.id}">Edit</button>
                            <button class="text-sm text-red-600 font-semibold hover:underline delete-btn" data-type="accident" data-id="${a.id}">Delete</button>
                        </div>
                    </div>`;
                }).join('');
            }
        }

        accidentForm.addEventListener('submit', async e => {
            e.preventDefault();
            const newAccident = {
                vehicle: document.getElementById('accident-vehicle').value,
                accident_date: document.getElementById('accident-date').value,
                location: document.getElementById('accident-location').value,
                description: document.getElementById('accident-description').value,
            };
            if (await apiRequest('/accidents/', 'POST', newAccident)) {
                fetchAndRenderAccidents();
                accidentForm.reset();
            }
        });

        populateVehicleDropdownForAccidents();
        fetchAndRenderAccidents();
    }


    // --- GLOBAL EDIT MODAL LOGIC ---
    const modal = document.getElementById('edit-modal');
    if (modal) {
        const modalTitle = document.getElementById('edit-modal-title');
        const editForm = document.getElementById('edit-form');
        const cancelEditBtn = document.getElementById('cancel-edit-button');

        function showEditModal(type, item) {
            modalTitle.textContent = `Edit ${type.charAt(0).toUpperCase() + type.slice(1)}`;
            let formContent = '';

            if (type === 'owner') {
                formContent = `
                    <input type="hidden" name="id" value="${item.id}"><input type="hidden" name="type" value="owner">
                    <div class="space-y-4">
                        <div><label class="block text-sm font-medium">Full Name</label><input type="text" name="fullName" value="${item.fullName}" class="mt-1 block w-full p-2 border rounded-md" required></div>
                        <div><label class="block text-sm font-medium">Address</label><input type="text" name="address" value="${item.address}" class="mt-1 block w-full p-2 border rounded-md" required></div>
                        <div><label class="block text-sm font-medium">Phone Number</label><input type="text" name="phoneNumber" value="${item.phoneNumber}" class="mt-1 block w-full p-2 border rounded-md" required></div>
                    </div>`;
            } else if (type === 'vehicle') {
                 formContent = `
                    <input type="hidden" name="id" value="${item.id}"><input type="hidden" name="type" value="vehicle">
                    <div class="space-y-4">
                        <div><label class="block text-sm font-medium">Vehicle No</label><input type="text" name="vehicle_no" value="${item.vehicle_no}" class="mt-1 block w-full p-2 border rounded-md" required></div>
                        <div><label class="block text-sm font-medium">Model</label><input type="text" name="model" value="${item.model}" class="mt-1 block w-full p-2 border rounded-md" required></div>
                        <div><label class="block text-sm font-medium">Year</label><input type="number" name="year" value="${item.year}" class="mt-1 block w-full p-2 border rounded-md" required></div>
                        <div><label class="block text-sm font-medium">VIN</label><input type="text" name="vin" value="${item.vin}" class="mt-1 block w-full p-2 border rounded-md" required></div>
                        <div><label class="block text-sm font-medium">Owner</label><select name="owner" id="edit-vehicle-owner" class="mt-1 block w-full p-2 border rounded-md" required></select></div>
                    </div>`;
                editForm.innerHTML = formContent; // Set content before populating dropdown
                populateOwnerDropdown(document.getElementById('edit-vehicle-owner'), item.owner);
            } else if (type === 'policy') {
                formContent = `
                    <input type="hidden" name="id" value="${item.id}"><input type="hidden" name="type" value="policy">
                    <div class="space-y-4">
                        <div><label class="block text-sm font-medium">Policy No</label><input type="text" name="policy_no" value="${item.policy_no}" class="mt-1 block w-full p-2 border rounded-md" required></div>
                        <div><label class="block text-sm font-medium">Start Date</label><input type="date" name="start_date" value="${item.start_date}" class="mt-1 block w-full p-2 border rounded-md" required></div>
                        <div><label class="block text-sm font-medium">End Date</label><input type="date" name="end_date" value="${item.end_date}" class="mt-1 block w-full p-2 border rounded-md" required></div>
                        <div><label class="block text-sm font-medium">Amount</label><input type="number" name="amount" value="${item.amount}" class="mt-1 block w-full p-2 border rounded-md" required></div>
                        <div><label class="block text-sm font-medium">Status</label>
                            <select name="status" class="mt-1 block w-full p-2 border rounded-md" required>
                                <option value="active" ${item.status === 'active' ? 'selected' : ''}>Active</option>
                                <option value="expired" ${item.status === 'expired' ? 'selected' : ''}>Expired</option>
                                <option value="cancelled" ${item.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                            </select>
                        </div>
                        <div><label class="block text-sm font-medium">Vehicle</label><select name="vehicle" id="edit-policy-vehicle" class="mt-1 block w-full p-2 border rounded-md" required></select></div>
                    </div>`;
                editForm.innerHTML = formContent;
                populateVehicleDropdown(document.getElementById('edit-policy-vehicle'), item.vehicle);
            }

            if (type === 'owner') { // Direct set for simpler forms
                editForm.innerHTML = formContent;
            }
            
            modal.classList.remove('hidden');
        }

        cancelEditBtn.addEventListener('click', () => modal.classList.add('hidden'));
        
        editForm.addEventListener('submit', async e => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const id = formData.get('id');
            const type = formData.get('type');
            let endpoint = '', body = {}, callback;

            if (type === 'owner') {
                endpoint = `/owners/${id}/`;
                body = { 
                    fullName: formData.get('fullName'), 
                    address: formData.get('address'), 
                    phoneNumber: formData.get('phoneNumber') 
                };
                callback = () => window.location.reload();
            } else if (type === 'vehicle') {
                endpoint = `/vehicles/${id}/`;
                body = {
                    vehicle_no: formData.get('vehicle_no'), model: formData.get('model'),
                    year: formData.get('year'), vin: formData.get('vin'),
                    owner: formData.get('owner')
                };
                 callback = () => window.location.reload();
            } else if (type === 'policy') {
                endpoint = `/policies/${id}/`;
                body = {
                    policy_no: formData.get('policy_no'), start_date: formData.get('start_date'),
                    end_date: formData.get('end_date'), amount: formData.get('amount'),
                    status: formData.get('status'), vehicle: formData.get('vehicle')
                };
                 callback = () => window.location.reload();
            }

            if (await apiRequest(endpoint, 'PUT', body)) {
                modal.classList.add('hidden');
                if (callback) callback();
            }
        });
    }
});
