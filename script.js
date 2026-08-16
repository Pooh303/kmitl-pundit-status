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
            } else if (student.status.includes('ไม่พบข้อมูล')) {
                statusClass = 'status-not-found';
            } else {
                statusClass = 'status-registered'; // For 'ขึ้นทะเบียนแล้ว...' etc.
            }

            tr.innerHTML = `
                <td>${student.id}</td>
                <td>${student.name}</td>
                <td class="${statusClass}">${student.status}</td>
            `;
            tableBody.appendChild(tr);
        });
    }

    // Search functionality
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        
        const filteredData = studentData.filter(student => {
            return student.id.toLowerCase().includes(searchTerm) || 
                   student.name.toLowerCase().includes(searchTerm);
        });
        
        renderTable(filteredData);
    });
});
