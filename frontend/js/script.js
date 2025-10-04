document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://localhost:8000/api';
    const pages = document.querySelectorAll('.page');
    const navLinks = document.querySelectorAll('.nav-link');
    let owners = [], vehicles = [];

    function showPage(pageId) {
        // Future-proofing for when you add these pages
        const validPages = ['home', 'owners', 'vehicles', 'policies'];
        if (!validPages.includes(pageId)) {
            // For now, links like 'accidents' will just reload the home view
            pageId = 'home';
        }

        pages.forEach(page => page.classList.toggle('active', page.id === `${pageId}-page`));
        if (pageId === 'owners') fetchAndRenderOwners();
        if (pageId === 'vehicles') fetchAndRenderVehicles();
        if (pageId === 'policies') fetchAndRenderPolicies();
    }

    navLinks.forEach(link => link.addEventListener('click', e => {
        e.preventDefault();
        showPage(link.dataset.page);
    }));

    async function apiRequest(endpoint, method = 'GET', body = null) {
        const config = { method, headers: { 'Content-Type': 'application/json' } };
        if (body) config.body = JSON.stringify(body);
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            document.getElementById('error-banner').classList.add('hidden');
            return method === 'DELETE' ? true : await response.json();
        } catch (error) {
            console.error(`Failed to ${method} ${endpoint}:`, error);
            document.getElementById('error-banner').classList.remove('hidden');
            return null;
        }
    }

    // Owners Logic
    const ownerForm = document.getElementById('add-owner-form'), ownersList = document.getElementById('owners-list');
    async function fetchAndRenderOwners() {
        const data = await apiRequest('/owners/');
        if (data) {
            owners = data;
            ownersList.innerHTML = owners.map(o => `
                <div class="bg-white p-4 rounded-lg shadow-sm">
                    <h3 class="font-semibold text-lg">${o.fullName}</h3><p class="text-gray-600">${o.address}</p>
                    <p class="text-gray-500 text-sm">${o.phoneNumber}</p>
                    <div class="mt-4 flex space-x-2">
                        <button class="text-sm text-blue-600 hover:underline edit-owner-btn" data-id="${o.id}">Edit</button>
                        <button class="text-sm text-red-600 hover:underline delete-owner-btn" data-id="${o.id}">Delete</button>
                    </div></div>`).join('');
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
    ownersList.addEventListener('click', async e => {
        const id = e.target.dataset.id;
        if (e.target.classList.contains('delete-owner-btn') && confirm('Are you sure?')) {
            if (await apiRequest(`/owners/${id}/`, 'DELETE')) fetchAndRenderOwners();
        }
        if (e.target.classList.contains('edit-owner-btn')) {
            const owner = owners.find(o => o.id == id);
            if (owner) showEditModal('owner', owner);
        }
    });

    // Vehicles Logic
    const vehicleForm=document.getElementById('add-vehicle-form'), vehiclesList=document.getElementById('vehicles-list'), vehicleOwnerSelect=document.getElementById('vehicle-owner');
    async function populateOwnerDropdown(selectElement = vehicleOwnerSelect) {
        const data = await apiRequest('/owners/');
        if(data) {
            owners = data;
            selectElement.innerHTML = '<option value="">Select Owner</option>';
            owners.forEach(o => {
                const option = document.createElement('option');
                option.value = o.id; option.textContent = o.fullName;
                selectElement.appendChild(option);
            });
        }
    }
    async function fetchAndRenderVehicles() {
        await populateOwnerDropdown();
        const data = await apiRequest('/vehicles/');
        if(data) {
            vehicles = data;
            vehiclesList.innerHTML = data.map(v => {
                const owner = owners.find(o => o.id === v.owner);
                return `
                <div class="bg-white p-4 rounded-lg shadow-sm">
                    <h3 class="font-semibold text-lg">${v.model} (${v.year})</h3>
                    <p class="text-gray-800 font-mono">${v.vehicle_no}</p>
                    <p class="text-gray-600 text-sm">Owner: ${owner ? owner.fullName : 'N/A'}</p>
                    <p class="text-gray-500 text-xs mt-2">VIN: ${v.vin}</p>
                    <div class="mt-4 flex space-x-2">
                        <button class="text-sm text-blue-600 hover:underline edit-vehicle-btn" data-id="${v.id}">Edit</button>
                        <button class="text-sm text-red-600 hover:underline delete-vehicle-btn" data-id="${v.id}">Delete</button>
                    </div></div>`}).join('');
        }
    }
    vehicleForm.addEventListener('submit', async e => {
        e.preventDefault();
        const newVehicle = {
            vehicle_no: document.getElementById('vehicle-vehicle_no').value, model: document.getElementById('vehicle-model').value,
            year: document.getElementById('vehicle-year').value, vin: document.getElementById('vehicle-vin').value,
            owner: document.getElementById('vehicle-owner').value,
        };
        if (await apiRequest('/vehicles/', 'POST', newVehicle)) {
            fetchAndRenderVehicles();
            vehicleForm.reset();
        }
    });
    vehiclesList.addEventListener('click', async e => {
        const id = e.target.dataset.id;
        if (e.target.classList.contains('delete-vehicle-btn') && confirm('Are you sure?')) {
            if (await apiRequest(`/vehicles/${id}/`, 'DELETE')) fetchAndRenderVehicles();
        }
        if (e.target.classList.contains('edit-vehicle-btn')) {
            const vehicle = vehicles.find(v => v.id == id);
            if (vehicle) showEditModal('vehicle', vehicle);
        }
    });

    // Policies Logic
    const policyForm=document.getElementById('add-policy-form'), policiesList=document.getElementById('policies-list'), policyVehicleSelect=document.getElementById('policy-vehicle');
    async function populateVehicleDropdown(selectElement = policyVehicleSelect) {
        const data = await apiRequest('/vehicles/');
        if(data) {
            vehicles = data;
            selectElement.innerHTML = '<option value="">Select Vehicle</option>';
            vehicles.forEach(v => {
                const option = document.createElement('option');
                option.value = v.id; option.textContent = `${v.vehicle_no} (${v.model})`;
                selectElement.appendChild(option);
            });
        }
    }
    async function fetchAndRenderPolicies() {
        await populateVehicleDropdown();
        const data = await apiRequest('/policies/');
        if(data) {
            policiesList.innerHTML = data.map(p => {
                const vehicle = vehicles.find(v => v.id === p.vehicle);
                return `
                <div class="bg-white p-4 rounded-lg shadow-sm">
                    <h3 class="font-semibold text-lg">Policy #${p.policy_no}</h3>
                    <p class="text-gray-600 text-sm">Vehicle: ${vehicle ? vehicle.vehicle_no : 'N/A'}</p>
                    <p class="text-gray-500 text-sm">${p.start_date} to ${p.end_date}</p>
                    <p class="font-semibold mt-2">₹${Number(p.amount).toLocaleString('en-IN')}</p>
                    <p class="mt-2"><span class="status-badge status-${p.status}">${p.status}</span></p>
                    <div class="mt-4 flex space-x-2">
                        <button class="text-sm text-blue-600 hover:underline edit-policy-btn" data-id="${p.id}">Edit</button>
                        <button class="text-sm text-red-600 hover:underline delete-policy-btn" data-id="${p.id}">Delete</button>
                    </div></div>`}).join('');
        }
    }
    policyForm.addEventListener('submit', async e => {
        e.preventDefault();
        const newPolicy = {
            policy_no: document.getElementById('policy-policy_no').value, start_date: document.getElementById('policy-start_date').value,
            end_date: document.getElementById('policy-end_date').value, amount: document.getElementById('policy-amount').value,
            status: document.getElementById('policy-status').value, vehicle: document.getElementById('policy-vehicle').value,
        };
        if (await apiRequest('/policies/', 'POST', newPolicy)) {
            fetchAndRenderPolicies();
            policyForm.reset();
        }
    });
    policiesList.addEventListener('click', async e => {
        const id = e.target.dataset.id;
        if (e.target.classList.contains('delete-policy-btn') && confirm('Are you sure?')) {
            if (await apiRequest(`/policies/${id}/`, 'DELETE')) fetchAndRenderPolicies();
        }
        if (e.target.classList.contains('edit-policy-btn')) {
            const policy = (await apiRequest('/policies/')).find(p => p.id == id);
            if (policy) showEditModal('policy', policy);
        }
    });
    
    // Edit Modal Logic
    const modal=document.getElementById('edit-modal'), modalTitle=document.getElementById('edit-modal-title'), editForm=document.getElementById('edit-form'), cancelEditBtn=document.getElementById('cancel-edit-button');
    function showEditModal(type, item) {
        modalTitle.textContent = `Edit ${type.charAt(0).toUpperCase() + type.slice(1)}`;
        let formContent = '';
        if (type === 'owner') {
            formContent = `
                <input type="hidden" name="id" value="${item.id}">
                <input type="hidden" name="type" value="owner">
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Full Name</label>
                        <input type="text" name="fullName" value="${item.fullName}" class="mt-1 block w-full p-2 border rounded-md" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Address</label>
                        <input type="text" name="address" value="${item.address}" class="mt-1 block w-full p-2 border rounded-md" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Phone Number</label>
                        <input type="text" name="phoneNumber" value="${item.phoneNumber}" class="mt-1 block w-full p-2 border rounded-md" required>
                    </div>
                </div>
            `;
        }
        // Add more types (vehicle, policy) here if needed

        editForm.innerHTML = formContent;
        modal.classList.remove('hidden');
    }
    cancelEditBtn.addEventListener('click', () => modal.classList.add('hidden'));
    editForm.addEventListener('submit', async e => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const id = formData.get('id');
        let endpoint = '', body = {}, callback;

        if (formData.get('type') === 'owner') {
            endpoint = `/owners/${id}/`;
            body = { fullName: formData.get('fullName'), address: formData.get('address'), phoneNumber: formData.get('phoneNumber') };
            callback = fetchAndRenderOwners;
        } else if (formData.get('type') === 'vehicle') {
            // Logic for vehicle update
        } else if (formData.get('type') === 'policy') {
            // Logic for policy update
        }

        if (await apiRequest(endpoint, 'PUT', body)) {
            modal.classList.add('hidden');
            if (callback) callback();
        }
    });

    showPage('home');
});
