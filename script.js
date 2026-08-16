document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('tableBody');
    const searchInput = document.getElementById('searchInput');
    const lastUpdated = document.getElementById('lastUpdated');
    
    let studentData = [];

    // Fetch JSON data with cache busting
    const timestamp = new Date().getTime();
    fetch('data.json?t=' + timestamp)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            studentData = data;
            
            let countAll = 0;
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

            countAll = studentData.length;

            document.getElementById('count-all').textContent = countAll;
            document.getElementById('count-not-registered').textContent = countNotRegistered;
            document.getElementById('count-unpaid').textContent = countUnpaid;
            document.getElementById('count-success').textContent = countSuccess;

            renderTable(studentData);
            
            // Try to get last modified date of the file if possible
            fetch('data.json?t=' + timestamp, { method: 'HEAD' })
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
            tableBody.innerHTML = `<tr><td colspan="4" class="empty-message error-message">ไม่สามารถโหลดข้อมูลได้ (หากเพิ่งสร้างเว็บ ต้องรอ GitHub Actions รันรอบแรกก่อน)</td></tr>`;
        });

    // Render table
    function renderTable(data) {
        tableBody.innerHTML = '';
        
        if (data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="4" class="empty-message">ไม่พบข้อมูล</td></tr>`;
            return;
        }

        data.forEach(student => {
            const tr = document.createElement('tr');
            
            let statusClass = '';
            let statusHtml = student.status;
            if (student.status.includes('ยังไม่ขึ้นทะเบียน')) {
                statusClass = 'status-not-registered';
                statusHtml = `<a href="https://www1.reg.kmitl.ac.th/gradapundit/login.php" target="_blank" class="status-link" title="คลิกเพื่อไปยังหน้าขึ้นทะเบียน">${student.status} ↗</a>`;
            } else if (student.status.includes('ยังไม่ชำระเงิน')) {
                statusClass = 'status-unpaid';
                statusHtml = `<a href="https://www1.reg.kmitl.ac.th/gradapundit/login.php" target="_blank" class="status-link" title="คลิกเพื่อไปยังหน้าชำระเงิน">รอชำระเงิน ↗</a>`;
            } else if (student.status.includes('ไม่พบข้อมูล') || student.status === '-') {
                statusClass = 'status-not-found';
            } else {
                statusClass = 'status-success';
            }

            const cleanName = student.name.replace(/&nbsp;/g, ' ').replace(/\u00A0/g, ' ').replace(/\s+/g, ' ');

            tr.innerHTML = `
                <td data-label="รหัสนักศึกษา">${student.id}</td>
                <td data-label="ชื่อ-สกุล">${cleanName}</td>
                <td data-label="สาขา">${student.major || '-'}</td>
                <td data-label="สถานะ" class="${statusClass}">${statusHtml}</td>
            `;
            tableBody.appendChild(tr);
        });
    }

    // Search and Filter functionality
    let currentFilter = 'all';

    window.setFilter = function(filterType) {
        if (currentFilter === filterType) {
            currentFilter = 'all'; // Toggle off to show all
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

    
    const pinBtn = document.getElementById('pinBtn');
    const topSection = document.getElementById('topSection');
    
    pinBtn.addEventListener('click', () => {
        if (topSection.classList.contains('sticky-active')) {
            // Unpinning
            pinBtn.classList.remove('active');
            pinBtn.title = 'ปักหมุดแถบนี้ไว้ด้านบน';
            
            // Only play animation if scrolled down significantly
            if (window.scrollY > 250) {
                topSection.classList.add('unpinning');
                setTimeout(() => {
                    topSection.classList.remove('sticky-active');
                    topSection.classList.remove('unpinning');
                }, 300);
            } else {
                // Remove instantly if near top
                topSection.classList.remove('sticky-active');
            }
        } else {
            // Pinning instantly
            topSection.classList.add('sticky-active');
            pinBtn.classList.add('active');
            pinBtn.title = 'ยกเลิกการปักหมุด';
        }
    });

    const clearBtn = document.getElementById('clearSearchBtn');
    
    searchInput.addEventListener('input', function() {
        if (this.value.length > 0) {
            clearBtn.style.display = 'block';
        } else {
            clearBtn.style.display = 'none';
        }
        applyFilters();
    });

    clearBtn.addEventListener('click', function() {
        searchInput.value = '';
        this.style.display = 'none';
        applyFilters();
        searchInput.focus();
    });

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
            } else if (currentFilter === 'all') {
                matchesStatus = true;
            }
            
            return matchesSearch && matchesStatus;
        });

        // Apply Sorting
        if (currentSortColumn) {
            filteredData.sort((a, b) => {
                let valA = a[currentSortColumn] || '';
                let valB = b[currentSortColumn] || '';
                
                // Thai string comparison
                let comparison = valA.localeCompare(valB, 'th');
                
                return currentSortDirection === 'asc' ? comparison : -comparison;
            });
        }
        
        renderTable(filteredData);
    }

    // Sorting functionality
    let currentSortColumn = 'id';
    let currentSortDirection = 'asc';

    document.querySelectorAll('.sortable').forEach(header => {
        header.addEventListener('click', () => {
            const column = header.getAttribute('data-sort');
            
            if (currentSortColumn === column) {
                // Toggle direction
                currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                currentSortColumn = column;
                currentSortDirection = 'asc';
            }

            // Update UI
            document.querySelectorAll('.sortable').forEach(h => {
                h.classList.remove('asc', 'desc');
                h.querySelector('span').textContent = '↕';
            });
            
            header.classList.add(currentSortDirection);
            header.querySelector('span').textContent = currentSortDirection === 'asc' ? '↑' : '↓';

            applyFilters();
        });
    });

    // Scroll to Top functionality
    const scrollTopBtn = document.getElementById('scrollTopBtn');
    
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            scrollTopBtn.classList.add('show');
        } else {
            scrollTopBtn.classList.remove('show');
        }
    });
    
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
});
