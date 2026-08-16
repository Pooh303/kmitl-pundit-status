import urllib.request
import urllib.parse
import re
from http.cookiejar import CookieJar
from bs4 import BeautifulSoup
import time
import json
import sys

def scrape_students(start_id, end_id, prefix="65070"):
    url = 'https://www1.reg.kmitl.ac.th/gradapundit/pundit_search.php'
    cj = CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))

    try:
        # Initial GET to fetch the first token
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'})
        resp = opener.open(req)
        html = resp.read().decode('cp874', errors='ignore')
        
        results = []
        
        for i in range(start_id, end_id + 1):
            student_id = f"{prefix}{i:03d}"
            
            token_match = re.search(r'name="token"\s+type="hidden"\s+id="token"\s+value="([^"]+)"', html)
            if not token_match:
                print(f"Could not find token for {student_id}. Stopping.")
                break
                
            token = token_match.group(1)
            
            data = urllib.parse.urlencode({'student_id': student_id, 'token': token, 'Submit': 'แสดงข้อมูล'}).encode('cp874', errors='ignore')
            req_post = urllib.request.Request(url, data=data, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'})
            resp = opener.open(req_post)
            html = resp.read().decode('cp874', errors='ignore')
            
            soup = BeautifulSoup(html, 'html.parser')
            td_info = soup.find(id='td_info')
            
            if td_info:
                rows = td_info.find_all('tr')
                info = {}
                for row in rows:
                    cols = row.find_all('td')
                    if len(cols) == 2:
                        key = cols[0].text.strip().replace(':', '').replace(' ', '')
                        val = cols[1].text.strip()
                        info[key] = val
                
                if info:
                    vals = list(info.values())
                    if len(vals) >= 3:
                        name = vals[1]
                        status = vals[2]
                        results.append({
                            "id": student_id,
                            "name": name,
                            "status": status
                        })
                        sys.stdout.buffer.write(f"[{student_id}] Found\n".encode('utf-8'))
                    else:
                        results.append({"id": student_id, "name": "-", "status": "ไม่พบข้อมูล"})
                else:
                    results.append({"id": student_id, "name": "-", "status": "ไม่พบข้อมูล"})
            else:
                results.append({"id": student_id, "name": "-", "status": "ไม่พบข้อมูล"})
                
            time.sleep(0.05)
            
        return results
            
    except Exception as e:
        print("Error:", e)
        return []

if __name__ == "__main__":
    print("Scraping student IDs from 65070001 to 65070300...")
    # Adjust range as needed
    results = scrape_students(1, 300, "65070")
    
    if len(results) > 0:
        with open('data.json', 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        print("Done! Results saved to data.json")
    else:
        print("No results fetched (Possible block or error). data.json was NOT overwritten.")
        sys.exit(1)
