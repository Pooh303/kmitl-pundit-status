document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('tableBody');
    const searchInput = document.getElementById('searchInput');
    const lastUpdated = document.getElementById('lastUpdated');
    
    let studentData = [];

    // Fetch JSON data
    fetch('data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            studentData = data;
            
            let countNotRegistered = 0;
            let countUnpaid = 0;
            let countSuccess = 0;

            studentData.forEach(student => {
                if (student.status.includes('ยังไม่ขึ้นทะเบียน')) {
                    countNotRegistered++;
                } else if (student.status.includes('ยังไม่ชำระเงิน')) {
                    countUnpaid++;
                } else if (!student.status.includes('ไม่พบข้อมูล') && student.status !== '-') {
                    countSuccess++;
                }
            });

            document.getElementById('count-not-registered').textContent = countNotRegistered;
            document.getElementById('count-unpaid').textContent = countUnpaid;
            document.getElementById('count-success').textContent = countSuccess;

            renderTable(studentData);
            
            // Try to get last modified date of the file if possible
            fetch('data.json', { method: 'HEAD' })
                .then(res => {
                    const lastMod = res.headers.get('Last-Modified');
                    if (lastMod) {
                        const date = new Date(lastMod);
                        document.getElementById('last-updated').textContent = date.toLocaleString('th-TH');
                    } else {
                        document.getElementById('last-updated').textContent = 'ล่าสุด (ตามรอบ GitHub Actions)';
                    }
                });
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            tableBody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:red;">ไม่สามารถโหลดข้อมูลได้ (หากเพิ่งสร้างเว็บ ต้องรอ GitHub Actions รันรอบแรกก่อน)</td></tr>`;
        });

    // Render table
    function renderTable(data) {
        tableBody.innerHTML = '';
        
        if (data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="3" style="text-align:center;">ไม่พบข้อมูล</td></tr>`;
            return;
        }

        data.forEach(student => {
            const tr = document.createElement('tr');
            
            let statusClass = '';
            if (student.status.includes('ยังไม่ขึ้นทะเบียน')) {
                statusClass = 'status-not-registered';
            } else if (student.status.includes('ยังไม่ชำระเงิน')) {
                statusClass = 'status-unpaid';
            } else if (student.status.includes('ไม่พบข้อมูล') || student.status === '-') {
                statusClass = 'status-not-found';
            } else {
                statusClass = 'status-success';
            }

            tr.innerHTML = `
                <td>${student.id}</td>
                <td>${student.name}</td>
                <td class="${statusClass}">${student.status}</td>
            `;
            tableBody.appendChild(tr);
        });
    }

    // Search and Filter functionality
    let currentFilter = null;

    window.setFilter = function(filterType) {
        if (currentFilter === filterType) {
            currentFilter = null; // Toggle off if clicked again
        } else {
            currentFilter = filterType;
        }
        
        // Update active classes on capsules
        document.querySelectorAll('.summary-capsule').forEach(el => el.classList.remove('active'));
        if (currentFilter) {
            document.getElementById('cap-' + currentFilter).classList.add('active');
        }
        
        applyFilters();
    };

    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase();
        
        const filteredData = studentData.filter(student => {
            // Check Search
            const matchesSearch = student.id.toLowerCase().includes(searchTerm) || 
                                  student.name.toLowerCase().includes(searchTerm);
            
            // Check Filter status
            let matchesStatus = true;
            if (currentFilter === 'not-registered') {
                matchesStatus = student.status.includes('ยังไม่ขึ้นทะเบียน');
            } else if (currentFilter === 'unpaid') {
                matchesStatus = student.status.includes('ยังไม่ชำระเงิน');
            } else if (currentFilter === 'success') {
                matchesStatus = !student.status.includes('ไม่พบข้อมูล') && 
                                student.status !== '-' && 
                                !student.status.includes('ยังไม่ขึ้นทะเบียน') && 
                                !student.status.includes('ยังไม่ชำระเงิน');
            }
            
            return matchesSearch && matchesStatus;
        });
        
        renderTable(filteredData);
    }

    searchInput.addEventListener('input', applyFilters);
});
