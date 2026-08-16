import urllib.request
import urllib.parse
import re
from http.cookiejar import CookieJar
from bs4 import BeautifulSoup
import json
import sys
import uuid

def map_major(thai_major):
    if 'วิทยาการข้อมูล' in thai_major:
        return 'DSBA'
    elif 'Business Information' in thai_major:
        return 'BIT'
    elif 'Information Technology' in thai_major and 'International' in thai_major:
        return 'IT (Inter)'
    elif 'ปัญญาประดิษฐ์เพื่อการวิเคราะห์เชิงธุรกิจ' in thai_major:
        return 'AIBA'
    elif 'เทคโนโลยีปัญญาประดิษฐ์' in thai_major or 'Artificial Intelligence Technology' in thai_major:
        return 'AIT'
    elif 'เทคโนโลยีสารสนเทศ' in thai_major:
        return 'IT'
    return thai_major

def mask_name(full_name):
    # ตัดคำนำหน้าทั้งไทยและอังกฤษที่อยู่ต้นประโยค
    name = re.sub(r'^(นางสาว|นาย|นาง|Mr\.|Miss|Ms\.|MR\.|MISS|MS\.)\s*', '', full_name, flags=re.IGNORECASE).strip()
    
    parts = name.split()
    if len(parts) == 0:
        return full_name
    elif len(parts) == 1:
        if len(parts[0]) > 3:
            return parts[0][:3] + '***'
        return parts[0]
        
    # คืนค่าเฉพาะชื่อจริง (คำแรก) ตัดนามสกุลทิ้งทั้งหมด
    return parts[0]

def scrape_students():
    url = 'https://www1.reg.kmitl.ac.th/gradapundit/pundit_status_show.php'
    cj = CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }

    try:
        # 1. GET request for token
        req = urllib.request.Request(url, headers=headers)
        resp = opener.open(req)
        html = resp.read().decode('cp874', errors='ignore')
        
        token_match = re.search(r'name="token".*?value="([^"]+)"', html)
        if not token_match:
            print("Could not find token. Stopping.")
            return []
            
        token = token_match.group(1)
        
        # 2. Build multipart/form-data
        boundary = uuid.uuid4().hex
        fields = {
            'faculty_name': 'คณะเทคโนโลยีสารสนเทศ',
            'status': '<< ทั้งหมด >>',
            'level': '0', # ทุกระดับชั้น
            'token': token,
            'Submit': 'ค้นหา'
        }
        
        body = []
        for key, val in fields.items():
            body.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{key}"\r\n\r\n{val}\r\n')
        body.append(f'--{boundary}--\r\n')
        data = ''.join(body).encode('cp874', errors='ignore')
        
        headers['Content-Type'] = f'multipart/form-data; boundary={boundary}'
        req_post = urllib.request.Request(url, data=data, headers=headers)
        
        resp = opener.open(req_post)
        html_out = resp.read().decode('cp874', errors='ignore')
        
        soup = BeautifulSoup(html_out, 'html.parser')
        tables = soup.find_all('table')
        
        results = []
        
        for table in tables:
            rows = table.find_all('tr')
            if len(rows) > 10:
                # This is the main data table
                # Row 0 is header: ลำดับ | รหัสนักศึกษา | ชื่อ - นามสกุล | หลักสูตร/สาขา | สถานะ
                for row in rows[1:]:
                    cols = [c.text.strip() for c in row.find_all(['td', 'th'])]
                    if len(cols) >= 6:
                        student_id = cols[1]
                        name = cols[2]
                        major = cols[4]  # Column 3 is the degree (Bachelor of Science)
                        status = cols[5]
                        
                        # Only include students from IT faculty (prefix 6407 or 6507, etc)
                        # Actually we can just include everyone returned in this list.
                        if "ยังไม่พบ" not in student_id and student_id.isdigit():
                            results.append({
                                "id": student_id,
                                "name": mask_name(name),
                                "major": map_major(major),
                                "status": status
                            })
                break
                
        # Sort results by student ID
        results.sort(key=lambda x: x['id'])
        return results
            
    except Exception as e:
        print("Error:", e)
        return []

if __name__ == "__main__":
    print("Scraping student list...")
    results = scrape_students()
    
    if len(results) > 0:
        with open('data.json', 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        print(f"Done! Fetched {len(results)} students. Results saved to data.json")
    else:
        print("No results fetched (Possible block or error). data.json was NOT overwritten.")
        sys.exit(1)
